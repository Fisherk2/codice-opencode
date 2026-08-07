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
