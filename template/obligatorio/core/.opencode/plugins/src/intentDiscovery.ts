// ---------------------------------------------------------------------------
// INTENT DISCOVERY — Description-derived intent keywords
//
// Derives natural-language intent keywords from each command file's own
// `description:` frontmatter, replacing the hardcoded INTENT_PATTERNS map.
// Contributors no longer maintain a keyword map when adding commands, and
// end-user commands get intent detection without manual registration.
//
// mergeIntentKeywordLayers() composes the three keyword layers in order:
// discovered baseline → static extensions (Spanish) → user overrides.
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { scanMarkdownFiles } from "./directoryScanner";
import { parseFieldFromFrontmatter } from "./frontmatter";
import { STOPWORDS } from "./stopwords";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Regex to extract the `description:` field value from raw YAML frontmatter text. */
const DESCRIPTION_FIELD_REGEX = /^description:\s*(.+)$/m;

/**
 * Composes the intent keyword layers in precedence order.
 *
 * 1. `discovered` — the baseline derived from command descriptions.
 * 2. `extensions` — static keywords (e.g. Spanish translations) that APPEND
 *    to an existing command's list, deduplicated preserving order. Commands
 *    absent from the discovered map are ignored — no orphan intents.
 * 3. `overrides` — user-provided keywords that REPLACE the entire list for a
 *    command key (per-key override, not keyword merge; see types.ts JSDoc).
 *
 * @param discovered - Baseline keyword map (from discoverIntentPatterns).
 * @param extensions - Keyword lists appended to matching commands.
 * @param overrides - Keyword lists that replace matching commands entirely.
 * @returns A new keyword map with all three layers applied.
 */
export function mergeIntentKeywordLayers(
	discovered: Record<string, readonly string[]>,
	extensions: Record<string, readonly string[]>,
	overrides: Record<string, readonly string[]>,
): Record<string, readonly string[]> {
	const merged: Record<string, readonly string[]> = { ...discovered };

	// Extensions append to an existing command's keywords (dedupe preserving
	// first occurrence) and never introduce a command that was not discovered.
	for (const [command, keywords] of Object.entries(extensions)) {
		const existing = merged[command];
		if (existing !== undefined) {
			merged[command] = [...new Set([...existing, ...keywords])];
		}
	}

	// Overrides replace the entire keyword list for a command key.
	for (const [command, keywords] of Object.entries(overrides)) {
		merged[command] = keywords;
	}

	return merged;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Discovers natural-language intent keywords from each command file's own
 * `description:` frontmatter.
 *
 * Sorting names alphabetically keeps first-match-wins intent detection
 * deterministic across filesystems: object insertion order follows the
 * sorted command list, so the same message always resolves to the same
 * command regardless of readdir order.
 *
 * @param commandsDir - Path to the user's `commands/` directory.
 * @returns A record mapping slash-command names (e.g., `"/sync"`) to their
 *          derived keyword lists. Returns `{}` if the directory does not
 *          exist or contains no readable `.md` files.
 */
export function discoverIntentPatterns(commandsDir: string): Record<string, readonly string[]> {
	const names = [...scanMarkdownFiles(commandsDir)].sort();
	// A token that is another command's name (e.g. "plan" appearing in
	// /migrate's description) would steal intent via first-match-wins when
	// the user says that word. Exclude those collisions so each command's
	// own name stays the authoritative keyword.
	const commandNames = new Set(names.map((n) => n.toLowerCase()));
	const patterns: Record<string, readonly string[]> = {};

	for (const name of names) {
		const filePath = `${commandsDir}/${name}.md`;
		let content: string;
		try {
			content = readFileSync(filePath, "utf-8");
		} catch {
			// Skip files that can't be read (permission errors, etc.)
			continue;
		}

		const description = parseFieldFromFrontmatter(content, DESCRIPTION_FIELD_REGEX);
		patterns[`/${name}`] = deriveIntentKeywords(name, description).filter(
			(keyword) => keyword === name.toLowerCase() || !commandNames.has(keyword),
		);
	}

	return patterns;
}

/**
 * Derives intent keywords for a command from its name and description.
 *
 * The command name is always the first keyword (lowercased). The description
 * is tokenized on non-alphanumeric characters (Unicode-aware so accented
 * words stay intact); tokens shorter than 3 characters and common function
 * words (STOPWORDS, English and Spanish) are dropped. Duplicates are removed
 * preserving first occurrence.
 *
 * @param commandName - The command basename (e.g., `"sync"`).
 * @param description - The `description:` frontmatter value, `null` when the
 *                      field is absent, or an empty/whitespace-only string.
 * @returns A deduplicated keyword list; always contains the command name.
 */
export function deriveIntentKeywords(commandName: string, description: string | null): string[] {
	const keywords = [commandName.toLowerCase()];

	// A null, empty, or whitespace-only description contributes no keywords —
	// skip the tokenize/filter pass entirely instead of processing a no-op.
	if (description !== null && description.trim().length > 0) {
		const tokens = description
			.toLowerCase()
			// \p{L}/\p{N} (Unicode letters/numbers) keep accented words intact
			// ("Códice" stays one token instead of splitting on the ó)
			.split(/[^\p{L}\p{N}]+/u)
			.filter((token) => token.length >= 3 && !STOPWORDS.has(token));
		keywords.push(...tokens);
	}

	// Deduplicate preserving first occurrence (Set iteration is insertion-ordered).
	return [...new Set(keywords)];
}
