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
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Set of all recognized flags (mode, option, and terminal flags) */
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
]);

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * Parse CLI arguments into a mode and options.
 * Returns null if arguments are unrecognized.
 *
 * @param args - Raw argv slice (excluding "node" and script path).
 * @returns ParsedArgs on success, null on unrecognized arguments.
 */
export function parseArgs(args: readonly string[]): ParsedArgs | null {
	const flags = new Set(args.filter((a) => a.startsWith("--")));
	const positional = args.filter((a) => !a.startsWith("--"));

	// Reject any unrecognized flags
	for (const flag of flags) {
		if (!ALLOWED_FLAGS.has(flag)) {
			return null;
		}
	}

	const options: CliOptions = {
		force: flags.has("--force"),
		verbose: flags.has("--verbose"),
	};

	if (flags.has("--clean")) return { mode: "clean", options };
	if (flags.has("--project")) return { mode: "project", options };
	if (flags.has("--update")) return { mode: "update", options };

	// No mode flag → interactive (default), but reject unknown positionals
	if (positional.length === 0) return { mode: "interactive", options };

	// Unknown positional arguments
	return null;
}
