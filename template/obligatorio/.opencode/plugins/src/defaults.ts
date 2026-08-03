// ---------------------------------------------------------------------------
// DEFAULTS — SDD Pipeline Configuration
//
// Barrel module for the hardcoded configuration maps used by the SDD pipeline
// plugin. These are the canonical defaults that the plugin falls back to when
// no overrides are provided in the opencode.json config.
//
// Data-heavy tables live in dedicated modules (validSubagents.ts,
// intentPatterns.ts) to keep every file under the 200-line convention.
// All exports are deeply readonly to prevent accidental mutation at runtime.
// ---------------------------------------------------------------------------

import { escapeRegExp } from "./escapeRegExp";
import { INTENT_PATTERNS } from "./intentPatterns";
import { PRIMARY_AGENTS, VALID_SUBAGENTS } from "./validSubagents";

export { DESTRUCTIVE_PATTERNS } from "./destructivePatterns";
export { INTENT_PATTERNS } from "./intentPatterns";
export { PRIMARY_AGENTS, VALID_SUBAGENTS } from "./validSubagents";

/**
 * Maps slash commands to their primary agent.
 *
 * When a user sends a slash command, the pipeline routes to the
 * corresponding agent. This is the authoritative mapping.
 */
export const COMMAND_AGENT_MAP: Readonly<Record<string, string>> = {
	"/spec": "quetzalcoatl",
	"/design": "quetzalcoatl",
	"/evolve": "quetzalcoatl",
	"/diagnosis": "quetzalcoatl",
	"/docs-update": "quetzalcoatl",
	"/plan": "moctezuma",
	"/build": "tlaloc",
	"/test": "mictlantecuhtli",
	"/review": "tezcatlipoca",
	"/ship": "mictlantecuhtli",
	"/code-simplify": "tlaloc",
	"/webperf": "mictlantecuhtli",
	"/help": "huitzilopochtli", // FEV-14 — onboarding command
} as const;

/**
 * Maps slash commands to their SDD pipeline phase.
 *
 * Defines which SDD phase a command belongs to. Used for phase
 * validation and transition logic in the pipeline.
 */
export const COMMAND_PHASE_MAP: Readonly<Record<string, string>> = {
	"/spec": "define",
	"/design": "define",
	"/evolve": "define",
	"/diagnosis": "define",
	"/docs-update": "define",
	"/plan": "plan",
	"/build": "build",
	"/test": "verify",
	"/review": "review",
	"/ship": "ship",
	"/code-simplify": "review",
	"/webperf": "review",
	"/help": "idle", // FEV-14 — informational command
} as const;

/**
 * SDD Phase Suggestions — advisory prompts shown to users.
 *
 * Each phase contains per-agent suggestions that appear in the system
 * prompt to guide the user toward the next appropriate command.
 * These are non-enforcing hints, not hard rules.
 */
export const PHASE_SUGGESTIONS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
	idle: {
		huitzilopochtli:
			"Consider /help to discover available commands, or /spec to start a new project.", // FEV-14 — onboarding command
	},
	define: {
		moctezuma:
			"Consider /spec, /evolve, /design, /diagnosis, or /docs-update to define requirements.",
		tlaloc: "Consider /spec, /evolve, /diagnosis, or /docs-update to define requirements.",
		mictlantecuhtli: "Consider /spec, /evolve, /diagnosis, or /docs-update to define requirements.",
		tezcatlipoca: "Consider /spec, /evolve, /diagnosis, or /docs-update to define requirements.",
	},
	plan: {
		quetzalcoatl: "Consider /spec or /design first to define requirements.",
		tlaloc: "Consider /plan first to break work into tasks.",
		mictlantecuhtli: "Consider /plan first to break work into tasks.",
		tezcatlipoca: "Consider /plan first to break work into tasks.",
	},
	build: {
		huitzilopochtli: "Consider delegating implementation to tlaloc via /build.",
		quetzalcoatl: "Consider /spec or /design first, then /plan.",
		moctezuma: "Consider /plan first, then /build.",
		mictlantecuhtli: "Consider /build first to implement code.",
		tezcatlipoca: "Consider /build first to implement code.",
	},
	verify: {
		huitzilopochtli: "Consider /build first to implement code.",
		quetzalcoatl: "Consider /spec → /plan → /build before testing.",
		moctezuma: "Consider /build first, then /test.",
		tlaloc: "Consider /test to verify your implementation.",
		tezcatlipoca: "Consider /test to verify code quality.",
	},
	review: {
		huitzilopochtli: "Consider /test first to verify code quality.",
		quetzalcoatl: "Consider /spec → /plan → /build → /test before review.",
		moctezuma: "Consider /test first, then /review.",
		tlaloc: "Consider /test first, then /review.",
		mictlantecuhtli: "Consider /review to audit code quality.",
	},
	ship: {
		huitzilopochtli: "Consider /test and /review before shipping.",
		quetzalcoatl: "Consider full SDD cycle before shipping.",
		moctezuma: "Consider /test and /review before shipping.",
		tlaloc: "Consider /test and /review before shipping.",
		// tezcatlipoca: read-only agent, cannot ship — no suggestion
	},
} as const;

/**
 * Agent mention patterns — detect agent switches from user messages.
 *
 * Each primary agent has one or more RegExp patterns that match when
 * a user @mentions or references them by name, triggering an agent
 * switch in the pipeline.
 */
export const AGENT_MENTION_PATTERNS: Readonly<Record<string, readonly RegExp[]>> =
	Object.fromEntries(
		PRIMARY_AGENTS.map((agent) => {
			const escaped = escapeRegExp(agent);
			return [agent, [new RegExp(`@${escaped}\\b`, "i"), new RegExp(`agente\\s+${escaped}`, "i")]];
		}),
	) as Readonly<Record<string, readonly RegExp[]>>;

/**
 * Aggregated DEFAULTS object containing all 6 configuration maps.
 *
 * This is the canonical defaults object used by the SDD pipeline plugin.
 * Consumers can import individual named exports or the entire DEFAULTS object.
 *
 * NOTE: DESTRUCTIVE_PATTERNS is intentionally omitted from this object —
 * it is a safety boundary and must remain hardcoded per OQ-4.
 */
export const DEFAULTS: Readonly<{
	COMMAND_AGENT_MAP: typeof COMMAND_AGENT_MAP;
	VALID_SUBAGENTS: typeof VALID_SUBAGENTS;
	INTENT_PATTERNS: typeof INTENT_PATTERNS;
	COMMAND_PHASE_MAP: typeof COMMAND_PHASE_MAP;
	PHASE_SUGGESTIONS: typeof PHASE_SUGGESTIONS;
	AGENT_MENTION_PATTERNS: typeof AGENT_MENTION_PATTERNS;
}> = {
	COMMAND_AGENT_MAP,
	VALID_SUBAGENTS,
	INTENT_PATTERNS,
	COMMAND_PHASE_MAP,
	PHASE_SUGGESTIONS,
	AGENT_MENTION_PATTERNS,
} as const;
