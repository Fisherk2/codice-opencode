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

import { existsSync, readdirSync, readFileSync } from "fs";
import { basename, extname } from "path";

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
	if (!existsSync(commandsDir)) {
		return {};
	}

	const entries = readdirSync(commandsDir, { withFileTypes: true });
	const map: Record<string, string> = {};

	for (const entry of entries) {
		// Only process .md files, skip directories and hidden/other files
		if (!entry.isFile() || extname(entry.name).toLowerCase() !== ".md") {
			continue;
		}

		const filePath = `${commandsDir}/${entry.name}`;
		let content: string;
		try {
			content = readFileSync(filePath, "utf-8");
		} catch {
			// Skip files that can't be read (permission errors, etc.)
			continue;
		}

		const agent = parseAgentFromFrontmatter(content);
		if (agent === null) {
			continue;
		}

		// Map /{filename} (without .md) to the agent name
		const commandName = `/${basename(entry.name, ".md")}`;
		map[commandName] = agent;
	}

	return map;
}

/**
 * Scans the user's agents directory and returns the set of valid subagent names.
 *
 * Reads each `*.md` file in the given directory and derives the agent name
 * from the filename (without the `.md` extension). The file contents are not
 * inspected — presence alone constitutes registration.
 *
 * @param agentsDir - Path to the user's `agents/` directory.
 * @returns A set of agent names derived from `*.md` filenames. Returns an
 *          empty `Set` if the directory does not exist.
 */
export function discoverValidSubagents(agentsDir: string): Set<string> {
	if (!existsSync(agentsDir)) {
		return new Set();
	}

	const entries = readdirSync(agentsDir, { withFileTypes: true });
	const agents = new Set<string>();

	for (const entry of entries) {
		if (!entry.isFile() || extname(entry.name).toLowerCase() !== ".md") {
			continue;
		}

		const agentName = basename(entry.name, ".md");
		agents.add(agentName);
	}

	return agents;
}

/**
 * Generates agent mention patterns for the given set of agent names.
 *
 * For each agent, produces two RegExp patterns:
 * - `@agentName` with a word boundary (matches `@agentName`, `@agentName!`, etc.)
 * - `agente agentName` (Spanish-language agent reference)
 *
 * @param agents - A set of agent names to generate patterns for.
 * @returns A record mapping each agent name to an array of two RegExp patterns.
 *          Returns an empty record if the set is empty.
 */
export function discoverAgentMentionPatterns(agents: Set<string>): Record<string, RegExp[]> {
	const patterns: Record<string, RegExp[]> = {};

	for (const agent of agents) {
		// Escape special regex characters in the agent name to avoid injection
		const escaped = agent.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		patterns[agent] = [new RegExp(`@${escaped}\\b`, "i"), new RegExp(`agente\\s+${escaped}`, "i")];
	}

	return patterns;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

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
	const agentMatch = frontmatterText.match(AGENT_FIELD_REGEX);
	if (!agentMatch) {
		return null;
	}

	return agentMatch[1].trim();
}
