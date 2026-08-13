// ---------------------------------------------------------------------------
// FRONTMATTER — Shared YAML frontmatter parsing helpers
//
// Both autoDiscovery (agent field) and intentDiscovery (description field)
// parse command `.md` frontmatter with the same delimiter rules. Keeping the
// regex and the extraction helper here avoids duplicating the parse logic in
// two discovery modules.
// ---------------------------------------------------------------------------

/** Regex to match the frontmatter block between `---` delimiters. */
export const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/;

/**
 * Extracts a single `key: value` field from YAML frontmatter in a markdown file.
 *
 * Expects frontmatter to be delimited by `---` markers at the start of the
 * file. Returns `null` when no valid frontmatter block exists, the field is
 * absent, or the value is empty after trimming.
 *
 * @param content - The full text content of a `.md` file.
 * @param fieldRegex - Regex matching the field line, with one capture group.
 * @returns The trimmed field value, or `null`.
 */
export function parseFieldFromFrontmatter(content: string, fieldRegex: RegExp): string | null {
	const match = content.match(FRONTMATTER_REGEX);
	if (!match) {
		return null;
	}

	const frontmatterText = match[1];
	if (!frontmatterText) {
		return null;
	}

	const fieldMatch = frontmatterText.match(fieldRegex);
	if (!fieldMatch) {
		return null;
	}

	// noUncheckedIndexedAccess (enabled in both the root and plugin tsconfigs)
	// types regex groups as `string | undefined`, so the guard is required
	// even though `(.+)` always captures ≥1 char.
	const rawValue = fieldMatch[1];
	if (!rawValue) {
		return null;
	}

	const value = rawValue.trim();
	return value.length > 0 ? value : null;
}
