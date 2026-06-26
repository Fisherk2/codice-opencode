/**
 * CLI argument parsing for Códice.
 *
 * Extracted from main.ts to respect the 200-line file size limit.
 * Defines all CLI types and the argument parser.
 */

import * as path from "node:path";

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

/**
 * Validate a destination path at parse time.
 *
 * Checks for obvious path traversal attempts and empty values
 * so the user gets immediate feedback instead of a confusing downstream error.
 * Full path containment validation is handled by pathResolver.ts at
 * installation time — this is an early-fail convenience guard.
 */
export function validateDestPath(dest: string): string | null {
	const trimmed = dest.trim();
	if (!trimmed) return "Destination path is empty";

	// Reject path traversal attempts at the CLI level
	const normalized = path.normalize(trimmed);
	if (normalized.includes("..")) {
		return `Invalid destination path: "${trimmed}" contains path traversal segments`;
	}

	// Reject absolute paths that are well-known system directories.
	// These are never valid project workspace destinations.
	// Uses prefix matching — catches both exact matches (e.g. /etc) and
	// sub-paths within guarded directories (e.g. /etc/cron.d).
	if (path.isAbsolute(normalized)) {
		// Check for filesystem root
		if (normalized === path.sep) {
			return `Invalid destination path: "${trimmed}" is the filesystem root`;
		}
		// Check for common system directories using prefix matching.
		// This catches direct matches (/etc) and subdirectories (/etc/cron.d).
		const SYSTEM_DIRS = [
			"/etc",
			"/var",
			"/usr",
			"/bin",
			"/boot",
			"/dev",
			"/proc",
			"/sys",
			"/opt",
			"/sbin",
			"/root",
			// /tmp intentionally omitted — users commonly install to /tmp for testing
		];
		for (const sysDir of SYSTEM_DIRS) {
			if (normalized === sysDir || normalized.startsWith(`${sysDir}/`)) {
				return `Invalid destination path: "${trimmed}" is inside a system directory "${sysDir}"`;
			}
		}
	}

	return null; // valid
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
			// Consume the next arg as the value for this flag
			i++;
			if (i >= args.length) {
				return null; // --dest (and future value flags) require a value
			}
			const rawDest = args[i] as string;
			const error = validateDestPath(rawDest);
			if (error) {
				// biome-ignore lint/suspicious/noConsole: CLI user-facing error
				console.error(`[error] ${error}`);
				return null;
			}
			destination = rawDest;
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
