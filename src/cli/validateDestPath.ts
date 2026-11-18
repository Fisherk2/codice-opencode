/**
 * Destination path validation for the CLI.
 *
 * Extracted from parse-args.ts to respect the 200-line file convention.
 * This is a convenience early-fail guard only — the real containment
 * boundary is pathResolver.ts (resolveWithinRoot + isPathWithin) enforced
 * at write time. The two layers are defense-in-depth: the CLI check gives
 * immediate feedback, the resolver guarantees safety regardless of input.
 */

import * as path from "node:path";

/**
 * Well-known system directories that are never valid project destinations.
 * Prefix matching catches sub-paths (e.g. /etc/cron.d). /tmp and /var are
 * intentionally omitted — /tmp is commonly used for testing, and macOS
 * returns /var/folders/... from os.tmpdir() which is the user's temp dir.
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
			]
		: ["/etc", "/usr", "/bin", "/boot", "/dev", "/proc", "/sys", "/opt", "/sbin", "/root"];

/** Bare Windows drive roots (C:\, D:\, etc.) */
const DRIVE_ROOT_RE = /^[A-Z]:\\?$/i;

/**
 * Validate a destination path at parse time — early-fail convenience guard
 * for traversal attempts and empty values. Full containment validation is
 * handled by pathResolver.ts at installation time.
 */
export function validateDestPath(dest: string): string | null {
	if (dest.includes("\0")) return "Destination path contains NUL bytes";

	const trimmed = dest.trim();
	if (!trimmed) return "Destination path is empty";

	// Control characters (incl. ANSI escapes) in a raw CLI arg must never be
	// echoed back to the terminal: strip them before checks and messages.
	// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping them is the point
	const display = trimmed.replace(/[\u0000-\u001f\u007f]/g, "");

	// Reject path traversal attempts at the CLI level. Per-segment check
	// (not a bare includes("..")) so legitimate names like "my..project"
	// pass; path.normalize already collapses interior "a/../b" sequences.
	const normalized = path.normalize(display);
	if (normalized.split(path.sep).some((segment) => segment === "..")) {
		return `Invalid destination path: "${display}" contains path traversal segments`;
	}

	// Relative paths are contained by construction; absolute paths are
	// checked against system destinations below.
	if (path.isAbsolute(normalized)) {
		return absolutePathViolation(normalized, display);
	}

	return null; // valid
}

/** Reject absolute paths targeting the root or a well-known system directory. */
function absolutePathViolation(normalized: string, display: string): string | null {
	if (normalized === path.sep) {
		return `Invalid destination path: "${display}" is the filesystem root`;
	}

	for (const sysDir of SYSTEM_DIRS) {
		if (normalized === sysDir || normalized.startsWith(`${sysDir}${path.sep}`)) {
			return `Invalid destination path: "${display}" is inside a system directory "${sysDir}"`;
		}
	}

	if (DRIVE_ROOT_RE.test(normalized)) {
		return `Invalid destination path: "${display}" is a drive root`;
	}

	return null;
}
