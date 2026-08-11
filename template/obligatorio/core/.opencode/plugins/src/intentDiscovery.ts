// ---------------------------------------------------------------------------
// INTENT DISCOVERY — Description-derived intent keywords
//
// Derives natural-language intent keywords from each command file's own
// `description:` frontmatter, replacing the hardcoded INTENT_PATTERNS map.
// Contributors no longer maintain a keyword map when adding commands, and
// end-user commands get intent detection without manual registration.
// ---------------------------------------------------------------------------

import { readFileSync } from "node:fs";
import { scanMarkdownFiles } from "./directoryScanner";
import { parseFieldFromFrontmatter } from "./frontmatter";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Regex to extract the `description:` field value from raw YAML frontmatter text. */
const DESCRIPTION_FIELD_REGEX = /^description:\s*(.+)$/m;

/**
 * Common English function words excluded from intent keywords.
 *
 * Description-derived keywords are matched as whole words against user
 * messages; function words would fire on almost every sentence, so they
 * are filtered out before keyword lists are built.
 */
const STOPWORDS: ReadonlySet<string> = new Set([
	"a",
	"an",
	"and",
	"are",
	"as",
	"at",
	"be",
	"by",
	"for",
	"from",
	"in",
	"into",
	"is",
	"it",
	"of",
	"on",
	"or",
	"the",
	"to",
	"with",
	"your",
	"you",
	"do",
	"does",
	"did",
	"not",
	"no",
	"that",
	"this",
	"these",
	"those",
	"they",
	"we",
	"our",
	"their",
	"then",
	"than",
	"so",
	"if",
	"but",
	"was",
	"were",
	"will",
	"would",
	// Generic action verbs that appear in many descriptions and would steal
	// intent from the command that actually owns the phrase.
	"new",
	"run",
	"get",
	"use",
	// Generic nouns spanning multiple command domains; the command name
	// (e.g. "code-simplify") remains the anchor keyword for those commands.
	"code",
]);

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
 * words (STOPWORDS) are dropped. Duplicates are removed preserving first
 * occurrence.
 *
 * @param commandName - The command basename (e.g., `"sync"`).
 * @param description - The `description:` frontmatter value, or `null`.
 * @returns A deduplicated keyword list; always contains the command name.
 */
export function deriveIntentKeywords(commandName: string, description: string | null): string[] {
	const keywords = [commandName.toLowerCase()];

	if (description !== null) {
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
