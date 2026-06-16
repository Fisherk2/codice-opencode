import * as path from "node:path";

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
	const rootWithSep = path.resolve(root) + path.sep;
	if (!resolved.startsWith(rootWithSep)) {
		throw new Error(
			`Path traversal blocked: ${relativePath} resolves outside the ${context} directory.`,
		);
	}
	return resolved;
}
