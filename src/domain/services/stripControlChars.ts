/**
 * Strip control characters (incl. ANSI escapes) from text before it is
 * echoed to the terminal or embedded in an error message: raw escape
 * bytes could inject terminal sequences.
 *
 * Lives in the domain layer because both the CLI argument validators and
 * the AtomicStager intent-marker errors need it, and infrastructure must
 * not import from the CLI layer. Single definition keeps the
 * noControlCharactersInRegex suppression in one place.
 */

// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping them is the point
const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/g;

/** Return `text` with all control characters (incl. ANSI escapes) removed. */
export function stripControlChars(text: string): string {
	return text.replace(CONTROL_CHARS_RE, "");
}
