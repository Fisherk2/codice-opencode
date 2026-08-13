/**
 * CLI argument parsing for Códice.
 *
 * Extracted from main.ts to respect the 200-line file size limit.
 * Defines all CLI types and the argument parser.
 */

import type { InstallMode } from "../application/ports/IUserPrompt";
import { validateDestPath } from "./validateDestPath";
import { validatePackList } from "./validatePackList";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Installation modes supported by the CLI */
export type Mode = InstallMode | "interactive";

/** Parsed CLI options: packs/packsAll select packs; updateAddPacks adds packs. */
export interface CliOptions {
	readonly force: boolean;
	readonly verbose: boolean;
	readonly packs?: readonly string[];
	readonly packsAll?: boolean;
	readonly updateAddPacks?: readonly string[];
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

/** Flags that take a value argument (e.g. --dest <path>). */
const VALUE_FLAGS = new Set(["--dest", "--packs", "--update-add-packs"]);

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
	"--packs-all",
	...VALUE_FLAGS,
]);

// --- Parser ---

/** Validate dest path and report error if invalid. Returns null on error. */
function validateDestPathAndReport(raw: string): string | null {
	const error = validateDestPath(raw);
	if (error) {
		// biome-ignore lint/suspicious/noConsole: CLI user-facing error
		console.error(`[error] ${error}`);
		return null;
	}
	return raw;
}

/** Validate pack list and report error if invalid. Returns null on error. */
function validatePackListAndReport(raw: string): string | null {
	if (validatePackList(raw) === null) {
		// biome-ignore lint/suspicious/noConsole: CLI user-facing error
		console.error(`[error] Invalid pack list: "${raw}". Use --help to list valid pack IDs.`);
		return null;
	}
	return raw;
}

/**
 * Read and validate the value token following a value-flag.
 * Returns null when missing or invalid (prints CLI error for --dest).
 */
function readFlagValue(
	args: readonly string[],
	valueIndex: number,
	isDest: boolean,
): string | null {
	const raw = args[valueIndex];
	if (raw === undefined) return null;
	return isDest ? validateDestPathAndReport(raw) : validatePackListAndReport(raw);
}

/** Split a raw comma-separated list into trimmed, non-empty pack IDs. */
function splitPackList(value: string | undefined): readonly string[] | undefined {
	if (value === undefined) return undefined;
	return value
		.split(",")
		.map((p) => p.trim())
		.filter(Boolean);
}

/**
 * Parse CLI arguments into a mode and options.
 * Returns null on unrecognized or invalid input.
 */
export function parseArgs(args: readonly string[]): ParsedArgs | null {
	let destination: string | undefined;
	const flags = new Set<string>();
	const values: Record<string, string> = {};

	let i = 0;
	while (i < args.length) {
		const arg = args[i]!; // Non-null: guarded by i < args.length
		i++; // Consume the flag token

		if (VALUE_FLAGS.has(arg)) {
			const isDest = arg === "--dest";
			const value = readFlagValue(args, i, isDest);
			if (value === null) return null;
			if (isDest) destination = value;
			else values[arg] = value;
			i++; // Consume the value token
		} else if (ALLOWED_FLAGS.has(arg)) {
			flags.add(arg);
		} else {
			// Unrecognized flag or positional argument → reject
			return null;
		}
	}

	const options: CliOptions = {
		force: flags.has("--force"),
		verbose: flags.has("--verbose"),
		packs: splitPackList(values["--packs"]),
		packsAll: flags.has("--packs-all"),
		updateAddPacks: splitPackList(values["--update-add-packs"]),
	};

	if (flags.has("--clean")) return { mode: "clean", options, destination };
	if (flags.has("--project")) return { mode: "project", options, destination };
	if (flags.has("--update")) return { mode: "update", options, destination };

	// No mode flag → interactive (default)
	return { mode: "interactive", options, destination };
}
