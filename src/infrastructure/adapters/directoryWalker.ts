import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Recursively walk a directory and return all file paths.
 * Skips symbolic links to prevent following symlinks that
 * point outside the intended directory (security measure).
 *
 * @param dirPath - Absolute path to the directory to walk.
 * @param verbose - If true, log skipped symlinks to stderr (for debugging/auditing).
 * @param excludeNames - Optional set of entry names to exclude. Matched against
 *                       each entry's name (not path). Applied recursively at all
 *                       directory levels, so excluding "node_modules" skips any
 *                       directory named "node_modules" at any depth.
 *                       (e.g. Set("node_modules") excludes node_modules/ at any
 *                       level of the directory tree).
 * @returns Array of absolute file paths within the directory tree.
 */
export async function walkDirectory(
	dirPath: string,
	verbose = false,
	excludeNames?: Set<string>,
): Promise<string[]> {
	const files: string[] = [];
	const entries = await fs.readdir(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		const entryPath = path.join(dirPath, entry.name);

		// Skip symbolic links — they may point outside the intended boundary
		if (entry.isSymbolicLink()) {
			if (verbose) {
				// biome-ignore lint/suspicious/noConsole: verbose audit log for security observability
				console.warn(`[verbose] Skipping symbolic link: ${entryPath}`);
			}
			continue;
		}

		// Skip entries that match exclusion set
		if (excludeNames?.has(entry.name)) {
			continue;
		}

		if (entry.isDirectory()) {
			const subFiles = await walkDirectory(entryPath, verbose, excludeNames);
			files.push(...subFiles);
		} else if (entry.isFile()) {
			files.push(entryPath);
		}
	}

	return files;
}
