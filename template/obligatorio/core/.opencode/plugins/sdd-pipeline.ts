import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "@opencode-ai/plugin";
import {
	discoverAgentMentionPatterns,
	discoverCommandAgentMap,
	discoverValidSubagents,
} from "./src/autoDiscovery";
import { loadSddConfig } from "./src/configLoader";
import { DEFAULTS, DESTRUCTIVE_PATTERNS } from "./src/defaults";
import { escapeRegExp } from "./src/escapeRegExp";
import { normalizeBash } from "./src/normalizeBash";
import { PRIMARY_AGENTS } from "./src/validSubagents";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SddState {
	pipeline_phase: string;
	active_spec: string | null;
	current_task: string | null;
	completed_tasks: string[];
	pending_tasks: string[];
	agent_type: string;
	last_intent: string | null;
}

interface MessageEvent {
	message?: { content?: string };
	parts?: unknown[];
}

/** Typed error for SDD pipeline blocking — avoids string prefix coupling. */
class SddError extends Error {
	constructor(msg: string) {
		super(msg);
		this.name = "SddError";
	}
}

// Plugin
// ---------------------------------------------------------------------------

export const SddPipelinePlugin: Plugin = async (ctx) => {
	const { directory } = ctx;

	// ── Paths ────────────────────────────────────────────────────────────────
	const projectDir = directory || process.cwd();

	// ── Auto-discovery (Pillar 1) — fallback to DEFAULTS when directories absent ──
	const commandsDir = join(projectDir, "commands");
	const agentsDir = join(projectDir, "agents");
	const discoveredCommandAgentMap = discoverCommandAgentMap(commandsDir);
	const discoveredValidSubagents = discoverValidSubagents(agentsDir);
	const commandAgentMap =
		Object.keys(discoveredCommandAgentMap).length > 0
			? discoveredCommandAgentMap
			: DEFAULTS.COMMAND_AGENT_MAP;
	// Fall back to PRIMARY_AGENTS (the 6 built-in agents) when no `agents/`
	// directory exists — subagent names can only be registered via filesystem
	// auto-discovery (ADR-013), so without it only primary agents are valid.
	const validSubagents =
		discoveredValidSubagents.size > 0 ? discoveredValidSubagents : new Set(PRIMARY_AGENTS);
	const agentMentionPatterns = discoverAgentMentionPatterns(validSubagents);

	// ── Configuration loading (Pillar 2) — merge user config with defaults ──
	// loadSddConfig already deep-merges every section with DEFAULTS, so
	// the ?? fallback only narrows the optional type — values are complete.
	const sddConfig = loadSddConfig(projectDir);
	const commandPhaseMap = sddConfig.commandPhaseMap ?? DEFAULTS.COMMAND_PHASE_MAP;
	const intentPatterns = sddConfig.intentPatterns ?? DEFAULTS.INTENT_PATTERNS;
	const phaseSuggestions = sddConfig.phaseSuggestions ?? DEFAULTS.PHASE_SUGGESTIONS;

	// OQ-3: warn when a commands/ file has no commandPhaseMap entry
	for (const command of Object.keys(commandAgentMap)) {
		if (!commandPhaseMap[command]) {
			// biome-ignore lint/suspicious/noConsole: intentional plugin telemetry log
			console.debug(
				`[sdd-pipeline] Command "${command}" has no commandPhaseMap entry, defaulting to "idle"`,
			);
		}
	}
	const pluginsDir = join(projectDir, ".opencode", "plugins");
	const auditLogPath = join(pluginsDir, ".sdd-audit.log");

	// ── In-memory SDD state (no persistence — detected fresh each session) ──
	const sddState: SddState = {
		pipeline_phase: "idle",
		active_spec: null,
		current_task: null,
		completed_tasks: [],
		pending_tasks: [],
		agent_type: "unknown",
		last_intent: null,
	};

	// ── Audit log helpers ────────────────────────────────────────────────────

	// [P1] In-memory line count — avoids re-reading the file on every append.
	//      Reset to 0 if file doesn't exist; set on init; tracked in audit().
	let auditLineCount = 0;

	/** Maximum audit log lines before rotation. When hit, the log is truncated to half. */
	const MAX_AUDIT_LINES = 500;

	/** Formats an unknown error as a human-readable string. */
	const formatError = (err: unknown): string => (err instanceof Error ? err.message : String(err));

	/** Reads the audit log, counts lines, and truncates to half if >= MAX_AUDIT_LINES. */
	const maybeRotateAuditLog = (): void => {
		if (!existsSync(auditLogPath)) {
			auditLineCount = 0;
			return;
		}
		const content = readFileSync(auditLogPath, "utf-8");
		const lines = content.split("\n");
		// Remove trailing empty line from split if file ends with newline
		auditLineCount = lines.at(-1) === "" ? lines.length - 1 : lines.length;
		if (auditLineCount >= MAX_AUDIT_LINES) {
			const keep = lines.slice(-(MAX_AUDIT_LINES / 2));
			writeFileSync(auditLogPath, `${keep.join("\n")}\n`);
			auditLineCount = keep.length;
			// biome-ignore lint/suspicious/noConsole: intentional plugin telemetry log
			console.debug("[sdd-pipeline] Audit log truncated on init");
		}
	};

	// Init: rotate if needed and seed line count
	try {
		maybeRotateAuditLog();
	} catch (err: unknown) {
		// biome-ignore lint/suspicious/noConsole: intentional plugin telemetry log
		console.debug("[sdd-pipeline] Could not truncate audit log:", formatError(err));
	}

	// ── Helpers ──────────────────────────────────────────────────────────────

	/** Sanitizes a string for safe log entry — prevents newline injection. */
	const sanitize = (s: string): string => s.replace(/[\n\r]/g, "_");

	/** Writes a timestamped entry to the audit log file. Handles rotation when line count exceeds limit. */
	const audit = (source: string, detail: string): void => {
		try {
			const timestamp = new Date().toISOString();
			const entry = `[${timestamp}] [${source}] ${sanitize(detail)}\n`;

			// [P1] Rotate only when in-memory count reaches threshold
			if (auditLineCount >= MAX_AUDIT_LINES) {
				maybeRotateAuditLog();
			}

			appendFileSync(auditLogPath, entry);
			auditLineCount++;
		} catch (err: unknown) {
			// biome-ignore lint/suspicious/noConsole: intentional plugin telemetry log
			console.debug("[sdd-pipeline] Could not write audit log:", formatError(err));
		}
	};

	// ── Build injected context strings ───────────────────────────────────────

	/** Constructs the full SDD context string including pipeline state. */
	const buildSddContext = (): string => {
		const lines = [
			"## SDD Pipeline State",
			`- Phase: ${sddState.pipeline_phase}`,
			`- Active spec: ${sddState.active_spec ?? "none"}`,
			`- Current task: ${sddState.current_task ?? "none"}`,
			`- Agent type: ${sddState.agent_type}`,
			`- Completed: ${sddState.completed_tasks.join(", ") || "none"}`,
			`- Pending: ${sddState.pending_tasks.join(", ") || "none"}`,
		];
		return lines.join("\n");
	};

	/** Maps a slash command to its corresponding SDD pipeline phase. */
	const commandToPhase = (command: string): string => commandPhaseMap[command] ?? "idle";

	// ── Hooks ────────────────────────────────────────────────────────────────

	return {
		/**
		 * Fires before each LLM call to build the system prompt.
		 * Injects SDD pipeline state so the agent
		 * always has the orchestration guides available from the FIRST message.
		 */
		"experimental.chat.system.transform": async (_input: unknown, output: unknown) => {
			try {
				const out = output as { system: string[] };

				// Inject SDD state at the beginning so it appears early in the system prompt
				const sddContext = buildSddContext();

				// Add phase suggestion if agent is used outside typical phase
				const suggestion = phaseSuggestions[sddState.pipeline_phase]?.[sddState.agent_type];
				const suggestionLine = suggestion
					? `
> **Suggestion:** ${suggestion}`
					: "";

				// Add intent suggestion if detected in last user message (visible to model)
				let intentLine = "";
				if (sddState.last_intent) {
					intentLine = `\n> **Intent detected:** User wants to \`${sddState.last_intent}\`. Suggest they use the command.`;
					sddState.last_intent = null; // Consume intent after injecting
				}

				out.system.unshift(sddContext + suggestionLine + intentLine);
				audit(
					"system.transform",
					`Injected SDD state (agent: ${sddState.agent_type}, phase: ${sddState.pipeline_phase})`,
				);
			} catch (err: unknown) {
				// biome-ignore lint/suspicious/noConsole: intentional plugin error log
				console.error("[sdd-pipeline] Error in system.transform:", formatError(err));
			}
		},

		/**
		 * Fires when a new message is received.
		 * Detects user intent and suggests the matching SDD slash command.
		 */
		"chat.message": async (_input: unknown, output: unknown) => {
			try {
				const out = output as MessageEvent;
				const content = out?.message?.content ?? "";
				if (!content) return;

				const lower = content.toLowerCase();

				// --- Detect agent mentions (e.g., "@tlaloc", "agente tezcatlipoca") ---
				for (const [agentType, patterns] of Object.entries(agentMentionPatterns)) {
					if (patterns.some((p) => p.test(content))) {
						if (sddState.agent_type !== agentType) {
							sddState.agent_type = agentType;
							audit("chat.message", `Agent switched via mention: ${agentType}`);
						}
						break;
					}
				}

				// --- Detect slash commands that load specific agents ---
				// Commands override EVERYTHING — they represent explicit user intent.
				// Always set the agent, even if it's the same (ensures state is persisted
				// on the first command after session start when agent is "unknown").
				// Must be followed by space, EOL, or non-word char to avoid false matches
				// like "/specification" matching "/spec".
				for (const [command, agentType] of Object.entries(commandAgentMap)) {
					if (lower.startsWith(command)) {
						const nextChar = lower[command.length];
						const isEnd = lower.length === command.length;
						const hasBoundary = isEnd || !nextChar || /\s/.test(nextChar);
						if (!hasBoundary) continue;
						const prev = sddState.agent_type;
						sddState.agent_type = agentType;
						sddState.pipeline_phase = commandToPhase(command);
						if (prev !== agentType) {
							audit("chat.message", `Agent switched via command ${command}: ${agentType}`);
						}
						break;
					}
				}

				// --- Detect SDD intent keywords ---
				// Store intent so system.transform can inject a visible suggestion.
				// Uses word-boundary regex to avoid false positives on common English
				// substrings (e.g., "relationship status" should NOT match /ship,
				// "I protest this decision" should NOT match /test).
				for (const [command, keywords] of Object.entries(intentPatterns)) {
					if (
						keywords.some((kw) => {
							const escaped = escapeRegExp(kw);
							return new RegExp(`\\b${escaped}\\b`, "i").test(content);
						})
					) {
						sddState.last_intent = command;
						audit("chat.message", `intent=${command}`);
						break;
					}
				}
			} catch (err: unknown) {
				// biome-ignore lint/suspicious/noConsole: intentional plugin error log
				console.error("[sdd-pipeline] Error in chat.message:", formatError(err));
			}
		},

		/**
		 * Fires before a tool executes.
		 * Enforces tool permissions, bash write rules, and SDD phase enforcement.
		 */
		"tool.execute.before": async (input: unknown, output: unknown) => {
			const inp = input as { tool?: string } | undefined;
			const out = output as { args?: Record<string, unknown> } | undefined;

			try {
				const tool = inp?.tool ?? "";
				const args = out?.args ?? {};

				// --- Always block destructive commands ---
				if (tool === "Bash" || tool === "bash") {
					// Normalize the command before checking: strip comments, collapse whitespace
					// This prevents bypasses like "rm  -rf" (double space) or "rm -r -f" (split flags)
					const cmd = normalizeBash((args.command as string) ?? "");
					for (const pattern of DESTRUCTIVE_PATTERNS) {
						if (pattern.test(cmd)) {
							audit("tool.before", `BLOCKED ${tool}: destructive command`);
							throw new SddError("Destructive command blocked. Use safe alternatives.");
						}
					}
				}

				// --- Task() Subagent Name Validation ---
				// [C2] Use .toLowerCase() to handle any case variant ("task", "Task", "TASK")
				if (tool.toLowerCase() === "task") {
					// Extract only the subagent identifier from known parameter keys.
					// Do NOT scan all string values — task() has other string params
					// (description, prompt, command) that are not subagent names.
					const subagentName =
						(args.subagent_type as string) ??
						(args.agent as string) ??
						(args.name as string) ??
						(args.type as string) ??
						(args.subagent as string) ??
						"";

					if (!subagentName && Object.keys(args).length > 0) {
						// biome-ignore lint/suspicious/noConsole: intentional plugin telemetry log
						console.debug(
							"[sdd-pipeline] task() args have no recognizable subagent key:",
							Object.keys(args),
						);
					}

					// Case-insensitive match: agent files are lowercase by convention
					// (backend-developer.md), and the LLM may capitalize the name.
					if (subagentName && !validSubagents.has(subagentName.toLowerCase())) {
						audit("tool.before", `BLOCKED task: unknown subagent "${subagentName}"`);
						throw new SddError(
							`Unknown subagent: "${subagentName}". Create an .md file in the agents/ directory or use a primary agent.`,
						);
					}
				}
			} catch (err: unknown) {
				// [R2] Re-throw our own SddError instances; log everything else
				if (err instanceof SddError) throw err;
				// biome-ignore lint/suspicious/noConsole: intentional plugin error log
				console.error("[sdd-pipeline] Error in tool.before:", formatError(err));
			}
		},

		/**
		 * Fires after a tool returns a result.
		 * Lightweight audit logging.
		 */
		"tool.execute.after": async (input: unknown) => {
			try {
				const inp = input as { tool?: string } | undefined;
				audit("tool.after", `${inp?.tool ?? "unknown"} completed`);
			} catch (err: unknown) {
				// biome-ignore lint/suspicious/noConsole: intentional plugin error log
				console.error("[sdd-pipeline] Error in tool.after:", formatError(err));
			}
		},

		/**
		 * Fires during context compaction.
		 * Re-injects SDD state into the compacted context.
		 */
		"experimental.session.compacting": async (_input: unknown, output: unknown) => {
			try {
				const out = output as { context?: string[] };

				out.context?.push(buildSddContext());

				audit("session.compacting", "Injected SDD state");
			} catch (err: unknown) {
				// biome-ignore lint/suspicious/noConsole: intentional plugin error log
				console.error("[sdd-pipeline] Error in session.compacting:", formatError(err));
			}
		},
	};
};

export default SddPipelinePlugin;
