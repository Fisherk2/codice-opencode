/**
 * Normalizes a bash command for safer regex matching.
 *
 * Strips comments (`#` to end of line), replaces newlines with a space
 * (preventing token merging), collapses repeated whitespace, and trims
 * leading/trailing space. This prevents common bypass attempts like:
 *   - Comment injection:   "rm -rf / # safe" → "rm -rf /"
 *   - Split flags:         "rm  -rf"         → "rm -rf"
 *   - Newline padding:     "rm\n-rf\n/"      → "rm -rf /"
 *
 * The order of operations matters: comments are stripped first (with a
 * space, so "safe#" does not merge tokens), then newlines, then whitespace.
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
