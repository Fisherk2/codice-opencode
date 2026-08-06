// ---------------------------------------------------------------------------
// MENTION PATTERNS — Shared agent-mention regex construction
//
// The mention grammar (`@name` + `agente name`) is built in two places:
// the static AGENT_MENTION_PATTERNS in defaults.ts and the runtime
// discoverAgentMentionPatterns() in autoDiscovery.ts. Keeping the grammar
// in one module prevents the two paths from drifting.
// ---------------------------------------------------------------------------

import { escapeRegExp } from "./escapeRegExp";

/**
 * Builds the two mention patterns for a single agent.
 *
 * Returns `@name` with a word boundary (matches `@name`, `@name!`, etc.)
 * and the Spanish-language `agente name` reference.
 *
 * @param agent - Agent name to build patterns for (e.g., `"tlaloc"`).
 * @returns Array of two RegExp patterns.
 */
export function mentionPatternsFor(agent: string): RegExp[] {
	const escaped = escapeRegExp(agent);
	return [new RegExp(`@${escaped}\\b`, "i"), new RegExp(`agente\\s+${escaped}`, "i")];
}
