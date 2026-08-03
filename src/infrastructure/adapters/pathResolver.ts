import * as path from "node:path";

/**
 * Append the platform path separator to a resolved root path.
 *
 * Used for containment checks: comparing against `root + sep` prevents
 * substring prefix matches (e.g. `/home/project` vs `/home/project-evil`).
 * The filesystem root (`/`) is returned unchanged to avoid `//` sequences.
 */
export function withTrailingSeparator(root: string): string {
	const resolved = path.resolve(root);
	// The filesystem root must never gain a second separator (`//`), and a
	// root-as-boundary trivially contains every absolute path. Callers must
	// not use the root as a containment boundary; parse-args.ts already
	// blocks `/` as a destination.
	if (resolved === path.sep) return resolved;
	return resolved.endsWith(path.sep) ? resolved : `${resolved}${path.sep}`;
}

/**
 * Returns `true` when `target` resolves to a path strictly inside `root`
 * (equal paths return `false`).
 *
 * The trailing separator on `root` prevents `/home/project` from matching
 * `/home/project-evil`. Both paths are resolved so relative inputs and
 * `..` sequences are handled before comparison.
 */
export function isPathWithin(root: string, target: string): boolean {
	return path.resolve(target).startsWith(withTrailingSeparator(root));
}

/**
 * Resolve a relative path against a root directory.
 * Rejects absolute paths, traversal sequences, and paths
 * that resolve outside the root boundary.
 *
 * @param root - The absolute root directory path.
 * @param relativePath - The relative path to resolve.
 * @param context - Label for error messages (e.g. "destination", "staging").
 * @returns The resolved absolute path within the root.
 * @throws Error if path traversal is detected.
 */
export function resolveWithinRoot(root: string, relativePath: string, context: string): string {
	const normalized = path.normalize(relativePath);
	if (path.isAbsolute(normalized) || normalized.startsWith("..")) {
		throw new Error(
			`Path traversal detected: ${relativePath}. All paths must be relative and stay within the ${context} directory.`,
		);
	}
	const resolved = path.resolve(root, normalized);
	if (!isPathWithin(root, resolved)) {
		throw new Error(
			`Path traversal blocked: ${relativePath} resolves outside the ${context} directory.`,
		);
	}
	return resolved;
}
