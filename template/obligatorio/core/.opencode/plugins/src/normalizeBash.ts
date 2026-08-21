/**
 * Normalizes a bash command for regex matching safety.
 *
 * Strips comments at token boundaries (not inside URLs), replaces newlines,
 * and collapses whitespace. Prevents common bypass attempts:
 * comment injection, split flags, newline padding.
 *
 * @param cmd - Raw bash command string.
 * @returns Normalized command safe for pattern matching.
 *
 * @example
 * normalizeBash("rm -rf / # dangerous")  // "rm -rf /"
 * normalizeBash("curl x.com/a#frag")     // "curl x.com/a#frag"
 */
export function normalizeBash(cmd: string): string {
	return cmd
		.replace(/(^|\s)#.*/g, " ") // strip comments starting at token boundary (not inside words)
		.replace(/\n/g, " ") // replace newlines with space
		.replace(/\s+/g, " ") // collapse whitespace
		.trim();
}
