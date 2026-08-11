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
// Intent keyword discovery lives in ./intentDiscovery.ts.
// ---------------------------------------------------------------------------

import { existsSync, readFileSync } from "node:fs";
import { scanMarkdownFiles, scanMarkdownFilesRecursive } from "./directoryScanner";
import { parseFieldFromFrontmatter } from "./frontmatter";
import { mentionPatternsFor } from "./mentionPatterns";
import { PRIMARY_AGENTS } from "./validSubagents";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

		const agent = parseFieldFromFrontmatter(content, AGENT_FIELD_REGEX);
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
 * @returns Set of lowercased `*.md` basenames plus the 6 primary agents;
 *          empty when the directory is absent.
 */
export function discoverValidSubagents(agentsDir: string): Set<string> {
	if (!existsSync(agentsDir)) {
		return new Set(); // Caller falls back to new Set(PRIMARY_AGENTS) — see sdd-pipeline.ts
	}
	const discovered = scanMarkdownFilesRecursive(agentsDir);
	// Lowercase both sides so sdd-pipeline.ts can match case-insensitively
	// (agent files are lowercase by convention, but discovery must tolerate
	// any casing in the filesystem). PRIMARY_AGENTS are already lowercase.
	const names = new Set<string>(PRIMARY_AGENTS);
	for (const name of discovered) {
		names.add(name.toLowerCase());
	}
	return names;
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
		patterns[agent] = mentionPatternsFor(agent);
	}

	return patterns;
}
