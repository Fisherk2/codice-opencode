/**
 * CLI argument parsing for Códice.
 *
 * Extracted from main.ts to respect the 200-line file size limit.
 * Defines all CLI types and the argument parser.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Installation modes supported by the CLI */
export type Mode = "clean" | "project" | "update" | "interactive";

/** Parsed CLI options */
export interface CliOptions {
	readonly force: boolean;
	readonly verbose: boolean;
}

/** Parsed CLI arguments */
export interface ParsedArgs {
	readonly mode: Mode;
	readonly options: CliOptions;
	/** Optional destination path (defaults to cwd) */
	readonly destination?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Flags that take a value argument (e.g. --dest <path>).
 */
const VALUE_FLAGS = new Set(["--dest"]);

/** Set of all recognized flags (mode, option, terminal, and value flags) */
const ALLOWED_FLAGS = new Set([
	"--clean",
	"--project",
	"--update",
	"--force",
	"--verbose",
	"--version",
	"-V",
	"--help",
	"-h",
	...VALUE_FLAGS,
]);

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse CLI arguments into a mode and options.
 * Returns null if arguments are unrecognized.
 *
 * Supports simple flags (--verbose) and value flags (--dest <path>).
 * Positional arguments are rejected.
 *
 * @param args - Raw argv slice (excluding "node" and script path).
 * @returns ParsedArgs on success, null on unrecognized arguments.
 */
export function parseArgs(args: readonly string[]): ParsedArgs | null {
	let destination: string | undefined;
	const flags = new Set<string>();

	let i = 0;
	while (i < args.length) {
		const arg: string = args[i]!; // Non-null: guarded by i < args.length

		if (VALUE_FLAGS.has(arg)) {
			// --dest <path>: consume the next arg as the value
			i++;
			if (i >= args.length) {
				return null; // --dest requires a value
			}
			if (arg === "--dest") {
				destination = args[i];
			}
		} else if (ALLOWED_FLAGS.has(arg)) {
			flags.add(arg);
		} else {
			// Unrecognized flag or positional argument → reject
			return null;
		}

		i++;
	}

	const options: CliOptions = {
		force: flags.has("--force"),
		verbose: flags.has("--verbose"),
	};

	if (flags.has("--clean")) return { mode: "clean", options, destination };
	if (flags.has("--project")) return { mode: "project", options, destination };
	if (flags.has("--update")) return { mode: "update", options, destination };

	// No mode flag → interactive (default)
	return { mode: "interactive", options, destination };
}
