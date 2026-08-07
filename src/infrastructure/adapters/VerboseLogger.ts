/**
 * Timestamped stderr logger for --verbose mode.
 *
 * SPEC.md requires --verbose to "emit timestamped, structured log lines to
 * stderr describing every operation, decision, and external call." This
 * adapter centralizes that formatting; adapters call log() at operation
 * boundaries and emit nothing when disabled (zero overhead in normal runs).
 *
 * Emits via console.warn, which writes to stderr — matching the existing
 * verbose diagnostics in BunSymlinkCreator/BunGitignoreCreator and their
 * tests (which mock console.warn).
 */
export class VerboseLogger {
	/**
	 * @param enabled - Whether verbose output is active (--verbose flag).
	 */
	constructor(private readonly enabled: boolean) {}

	/**
	 * Emit a timestamped, structured line to stderr when verbose is enabled.
	 *
	 * Format: `[ISO-8601] operation: detail`. Every call site in the adapters
	 * passes a detail string, so the `op:` prefix is always present in practice;
	 * the bare `[ts] operation` branch exists only as a safety fallback. The
	 * operation names ("stage", "commit", "github", ...) are stable identifiers,
	 * making the output parseable without being JSON.
	 *
	 * @param operation - Operation/decision name (e.g. "stage", "commit", "github").
	 * @param detail - Optional human-readable detail appended after a colon.
	 */
	log(operation: string, detail?: string): void {
		if (!this.enabled) return;
		const line =
			detail === undefined
				? `[${new Date().toISOString()}] ${operation}`
				: `[${new Date().toISOString()}] ${operation}: ${detail}`;
		// biome-ignore lint/suspicious/noConsole: verbose diagnostic output
		console.warn(line);
	}
}
