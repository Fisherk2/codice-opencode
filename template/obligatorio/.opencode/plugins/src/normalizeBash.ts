// ---------------------------------------------------------------------------
// normalizeBash — Normalizes a bash command for safer regex matching
//
// Strips comments, replaces newlines with spaces, collapses whitespace,
// and trims. This prevents common bypass attempts like:
//   - Comment injection:   "rm -rf / # safe" → "rm -rf /"
//   - Split flags:         "rm  -rf"         → "rm -rf"
//   - Newline padding:     "rm\n-rf\n/"      → "rm -rf /"
//
// The order of operations matters:
//   1. Strip comments (first, so "safe#" → "")
//   2. Replace newlines with space (so tokens don't merge)
//   3. Collapse whitespace (so "rm  -rf" → "rm -rf")
//   4. Trim (so "  rm -rf /  " → "rm -rf /")
// ---------------------------------------------------------------------------

/**
 * Normalizes a bash command for safer regex matching.
 *
 * Strips comments (`#` to end of line), replaces newlines with a space
 * (preventing token merging), collapses repeated whitespace, and trims
 * leading/trailing space.
 *
 * @param cmd - The raw bash command string.
 * @returns The normalized command, safe for pattern matching.
 *
 * @example
 * ```ts
 * normalizeBash("rm -rf / # dangerous")     // "rm -rf /"
 * normalizeBash("rm\n-rf\n/")               // "rm -rf /"
 * normalizeBash("  rm   -rf   /  ")         // "rm -rf /"
 * ```
 */
export function normalizeBash(cmd: string): string {
	return cmd
		.replace(/#.*/g, " ") // strip comments (replace with space to avoid merging)
		.replace(/\n/g, " ") // replace newlines with space (not empty — tokens must stay separate)
		.replace(/\s+/g, " ") // collapse whitespace
		.trim();
}
