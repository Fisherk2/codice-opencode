// ---------------------------------------------------------------------------
// AUTO-DISCOVERY — Filesystem scanning for user workspace configuration
//
// These functions derive SDD pipeline configuration from files the user
// creates in their own workspace (commands/, agents/ directories). They
// serve as the discovery pillar (Pillar 1) of auto-discovery, allowing
// dynamic configuration without manual registration.
//
// All functions use only Node.js `fs` module — no Bun-specific APIs.
// YAML frontmatter is parsed manually via regex (no external deps).
// ---------------------------------------------------------------------------

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { escapeRegExp } from "./escapeRegExp";
import { PRIMARY_AGENTS } from "./validSubagents";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Regex to match the frontmatter block between `---` delimiters. */
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/;

/** Regex to extract the `agent:` field value from raw YAML frontmatter text. */
const AGENT_FIELD_REGEX = /^agent:\s*(.+)$/m;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Scans the user's commands directory and builds a command→agent mapping.
 *
 * Reads each `*.md` file in the given directory, parses its YAML frontmatter
 * to extract the `agent:` field, and maps `/{filename}` (without `.md`) to
 * the agent name.
 *
 * Files without an `agent:` field, with malformed frontmatter, or with a
 * non-`.md` extension are silently skipped.
 *
 * @param commandsDir - Path to the user's `commands/` directory.
 * @returns A record mapping slash-command names (e.g., `"/spec"`) to agent
 *          names (e.g., `"quetzalcoatl"`). Returns `{}` if the directory
 *          does not exist.
 */
export function discoverCommandAgentMap(commandsDir: string): Record<string, string> {
	const map: Record<string, string> = {};

	for (const name of scanMarkdownFiles(commandsDir)) {
		const filePath = `${commandsDir}/${name}.md`;
		let content: string;
		try {
			content = readFileSync(filePath, "utf-8");
		} catch {
			// Skip files that can't be read (permission errors, etc.)
			continue;
		}

		const agent = parseAgentFromFrontmatter(content);
		if (agent !== null) {
			map[`/${name}`] = agent;
		}
	}

	return map;
}

/**
 * Scans the user's agents directory tree and returns the set of valid subagent names.
 *
 * Reads each `*.md` file under the given directory (recursively) and derives
 * the agent name from the filename (without the `.md` extension). File
 * contents are not inspected — presence alone constitutes registration.
 *
 * When the directory does not exist, returns an empty `Set` so the caller
 * falls back to `new Set(PRIMARY_AGENTS)` (see sdd-pipeline.ts).
 *
 * @param agentsDir - Path to the user's `agents/` directory.
 * @returns Set of `*.md` basenames plus the 6 primary agents; empty when the directory is absent.
 */
export function discoverValidSubagents(agentsDir: string): Set<string> {
	if (!existsSync(agentsDir)) {
		return new Set(); // Caller falls back to new Set(PRIMARY_AGENTS) — see sdd-pipeline.ts
	}
	const discovered = scanMarkdownFilesRecursive(agentsDir);
	return new Set([...discovered, ...PRIMARY_AGENTS]);
}

/**
 * Generates agent mention patterns for primary agents only.
 *
 * Only the 6 primary agents (huitzilopochtli, quetzalcoatl, moctezuma, tlaloc,
 * mictlantecuhtli, tezcatlipoca) get mention patterns — subagents are not
 * referenced directly in user messages.
 *
 * For each primary agent, produces two RegExp patterns:
 * - `@agentName` with a word boundary (matches `@agentName`, `@agentName!`, etc.)
 * - `agente agentName` (Spanish-language agent reference)
 *
 * @param agents - A set of agent names to filter and generate patterns for.
 * @returns A record mapping each primary agent name to an array of two RegExp
 *          patterns. Returns an empty record if no primary agents are found.
 */
export function discoverAgentMentionPatterns(agents: Set<string>): Record<string, RegExp[]> {
	const primary = new Set(PRIMARY_AGENTS);
	const patterns: Record<string, RegExp[]> = {};

	for (const agent of agents) {
		if (!primary.has(agent)) continue; // Only primary agents get mention patterns
		const escaped = escapeRegExp(agent);
		patterns[agent] = [new RegExp(`@${escaped}\\b`, "i"), new RegExp(`agente\\s+${escaped}`, "i")];
	}

	return patterns;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Scans a directory for markdown files and returns their base names (without `.md`).
 *
 * Top-level only — commands are flat. Subagent discovery uses the recursive variant.
 *
 * @param dir - Path to the directory to scan.
 * @returns Array of base names (e.g., `["spec", "build"]` for `spec.md`, `build.md`).
 */
function scanMarkdownFiles(dir: string): string[] {
	if (!existsSync(dir)) {
		return [];
	}

	return readdirSync(dir, { withFileTypes: true })
		.filter((entry) => entry.isFile() && extname(entry.name).toLowerCase() === ".md")
		.map((entry) => basename(entry.name, ".md"));
}

/**
 * Recursively scans a directory tree for `.md` files, returning base names
 * without the extension. Recursion keeps discovery forward-compatible with a
 * future `packs/<name>/` layout; hidden directories (`.git`, `.opencode`)
 * are skipped so tooling-internal state never registers as a subagent name.
 *
 * @param dir - Path to the directory to scan.
 * @returns Flat array of base names (e.g., `["spec", "build"]`).
 */
function scanMarkdownFilesRecursive(dir: string): string[] {
	if (!existsSync(dir)) {
		return [];
	}
	const names: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			if (entry.name.startsWith(".")) continue;
			names.push(...scanMarkdownFilesRecursive(join(dir, entry.name)));
		} else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
			names.push(basename(entry.name, ".md"));
		}
	}
	return names;
}

/**
 * Parses the `agent:` field from YAML frontmatter in a markdown file.
 *
 * Expects frontmatter to be delimited by `---` markers at the start of the
 * file. Returns `null` if no valid frontmatter is found or if the `agent:`
 * field is missing.
 *
 * @param content - The full text content of a `.md` file.
 * @returns The agent name if found, or `null` otherwise.
 */
function parseAgentFromFrontmatter(content: string): string | null {
	const match = content.match(FRONTMATTER_REGEX);
	if (!match) {
		return null;
	}

	const frontmatterText = match[1];
	if (!frontmatterText) {
		return null;
	}

	const agentMatch = frontmatterText.match(AGENT_FIELD_REGEX);
	if (!agentMatch) {
		return null;
	}

	const rawValue = agentMatch[1];
	if (!rawValue) {
		return null;
	}

	const value = rawValue.trim();
	return value.length > 0 ? value : null;
}
