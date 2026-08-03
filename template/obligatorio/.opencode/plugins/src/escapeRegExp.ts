// ---------------------------------------------------------------------------
// escapeRegExp — Escapes user-provided strings for safe inclusion in RegExp
//
// Agent names and intent keywords come from workspace files or configuration
// written by users. Escaping prevents regex metacharacters in those values
// from being interpreted as pattern syntax (regex injection).
// ---------------------------------------------------------------------------

/**
 * Escapes all regex metacharacters in a string so it can be embedded in a
 * RegExp constructor as a literal match.
 *
 * @param value - The raw string to escape (e.g. an agent name or keyword).
 * @returns A string safe to interpolate into a RegExp pattern.
 */
export function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
