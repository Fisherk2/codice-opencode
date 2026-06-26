import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Recursively walk a directory and return all file paths.
 * Skips symbolic links to prevent following symlinks that
 * point outside the intended directory (security measure).
 *
 * @param dirPath - Absolute path to the directory to walk.
 * @param verbose - If true, log skipped symlinks to stderr (for debugging/auditing).
 * @param excludeSubPaths - Optional set of relative path prefixes to exclude
 *                          (e.g. Set("opencode") excludes any entry named "opencode"
 *                          or at a path containing "opencode").
 * @returns Array of absolute file paths within the directory tree.
 */
export async function walkDirectory(
	dirPath: string,
	verbose = false,
	excludeSubPaths?: Set<string>,
): Promise<string[]> {
	const files: string[] = [];
	const entries = await fs.readdir(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		// Skip symbolic links — they may point outside the intended boundary
		if (entry.isSymbolicLink()) {
			if (verbose) {
				const entryPath = path.join(dirPath, entry.name);
				// biome-ignore lint/suspicious/noConsole: verbose audit log for security observability
				console.warn(`[verbose] Skipping symbolic link: ${entryPath}`);
			}
			continue;
		}

		// Skip entries that match exclusion set
		if (excludeSubPaths?.has(entry.name)) {
			continue;
		}

		const entryPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			const subFiles = await walkDirectory(entryPath, verbose, excludeSubPaths);
			files.push(...subFiles);
		} else if (entry.isFile()) {
			files.push(entryPath);
		}
	}

	return files;
}
