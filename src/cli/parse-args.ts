/**
 * CLI argument parsing for Códice.
 *
 * Extracted from main.ts to respect the 200-line file size limit.
 * Defines all CLI types and the argument parser.
 */

import * as path from "node:path";
import { validatePackList } from "./validatePackList";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Installation modes supported by the CLI */
export type Mode = "clean" | "project" | "update" | "interactive";

/** Parsed CLI options: packs/packsAll select packs; updateAddPacks adds packs. */
export interface CliOptions {
	readonly force: boolean;
	readonly verbose: boolean;
	readonly packs?: readonly string[];
	readonly packsAll?: boolean;
	readonly updateAddPacks?: readonly string[];
}

/**
 * Well-known system directories that are never valid project destinations.
 * Prefix matching catches sub-paths (e.g. /etc/cron.d). /tmp is intentionally
 * omitted — users commonly install to /tmp for testing.
 */
const SYSTEM_DIRS: readonly string[] =
	process.platform === "win32"
		? [
				"C:\\Windows",
				"C:\\Windows\\System32",
				"C:\\Program Files",
				"C:\\Program Files (x86)",
				"C:\\Users\\Public",
				"C:\\ProgramData",
				"C:\\Users",
			]
		: ["/etc", "/var", "/usr", "/bin", "/boot", "/dev", "/proc", "/sys", "/opt", "/sbin", "/root"];

/** Bare Windows drive roots (C:\, D:\, etc.) */
const DRIVE_ROOT_RE = /^[A-Z]:\\?$/i;

/**
 * Validate a destination path at parse time — early-fail convenience guard
 * for traversal attempts and empty values. Full containment validation is
 * handled by pathResolver.ts at installation time.
 */
export function validateDestPath(dest: string): string | null {
	const trimmed = dest.trim();
	if (!trimmed) return "Destination path is empty";

	// Reject path traversal attempts at the CLI level
	const normalized = path.normalize(trimmed);
	if (normalized.includes("..")) {
		return `Invalid destination path: "${trimmed}" contains path traversal segments`;
	}

	// Relative paths are contained by construction; absolute paths are
	// checked against system destinations below.
	if (path.isAbsolute(normalized)) {
		return absolutePathViolation(normalized, trimmed);
	}

	return null; // valid
}

/** Reject absolute paths targeting the root or a well-known system directory. */
function absolutePathViolation(normalized: string, trimmed: string): string | null {
	if (normalized === path.sep) {
		return `Invalid destination path: "${trimmed}" is the filesystem root`;
	}

	for (const sysDir of SYSTEM_DIRS) {
		if (normalized === sysDir || normalized.startsWith(`${sysDir}${path.sep}`)) {
			return `Invalid destination path: "${trimmed}" is inside a system directory "${sysDir}"`;
		}
	}

	if (DRIVE_ROOT_RE.test(normalized)) {
		return `Invalid destination path: "${trimmed}" is a drive root`;
	}

	return null;
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

/**
 * Read and validate the value token following a value-flag.
 * Returns null when missing or invalid (prints CLI error for --dest).
 */
function readFlagValue(
	args: readonly string[],
	valueIndex: number,
	isDest: boolean,
): string | null {
	if (valueIndex >= args.length) return null;
	const raw = args[valueIndex] as string;
	if (isDest) {
		const error = validateDestPath(raw);
		if (error) {
			// biome-ignore lint/suspicious/noConsole: CLI user-facing error
			console.error(`[error] ${error}`);
			return null;
		}
		return raw;
	}
	// Pack lists must be non-empty and contain only known pack IDs.
	// An unknown ID would silently install zero packs (filterByPacks drops
	// unmatched rules), so reject it here with a usage error.
	if (validatePackList(raw) === null) {
		// biome-ignore lint/suspicious/noConsole: CLI user-facing error
		console.error(`[error] Invalid pack list: "${raw}". Use --help to list valid pack IDs.`);
		return null;
	}
	return raw;
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
		const arg: string = args[i]!; // Non-null: guarded by i < args.length
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
