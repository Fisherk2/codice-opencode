/**
 * Normalizes a bash command for safer regex matching.
 *
 * Strips comments (from `#` at token start to end of line) while leaving
 * mid-word/mid-URL hashes intact (bash treats `#` inside a word or URL as a
 * literal: `curl 'x.com/a#frag'` must NOT lose the fragment). Replaces
 * newlines with a space (preventing token merging), collapses repeated
 * whitespace, and trims leading/trailing space. This prevents common bypass
 * attempts like:
 *   - Comment injection:   "rm -rf / # safe" → "rm -rf /"
 *   - Split flags:         "rm  -rf"         → "rm -rf"
 *   - Newline padding:     "rm\n-rf\n/"      → "rm -rf /"
 *
 * The order of operations matters: comments are stripped first (only at
 * token start, so URL fragments survive), then newlines, then whitespace.
 *
 * @param cmd - The raw bash command string.
 * @returns The normalized command, safe for pattern matching.
 *
 * @example
 * ```ts
 * normalizeBash("rm -rf / # dangerous")     // "rm -rf /"
 * normalizeBash("rm\n-rf\n/")               // "rm -rf /"
 * normalizeBash("  rm   -rf   /  ")         // "rm -rf /"
 * normalizeBash("curl x.com/a#frag")        // "curl x.com/a#frag"
 * ```
 */
export function normalizeBash(cmd: string): string {
	return cmd
		.replace(/(^|\s)#.*/g, " ") // strip comments starting at token boundary (not inside words)
		.replace(/\n/g, " ") // replace newlines with space
		.replace(/\s+/g, " ") // collapse whitespace
		.trim();
}
