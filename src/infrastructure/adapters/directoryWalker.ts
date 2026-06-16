import * as fs from "node:fs/promises";
import * as path from "node:path";

/**
 * Recursively walk a directory and return all file paths.
 * Skips symbolic links to prevent following symlinks that
 * point outside the intended directory (security measure).
 *
 * @param dirPath - Absolute path to the directory to walk.
 * @returns Array of absolute file paths within the directory tree.
 */
export async function walkDirectory(dirPath: string): Promise<string[]> {
	const files: string[] = [];
	const entries = await fs.readdir(dirPath, { withFileTypes: true });

	for (const entry of entries) {
		// Skip symbolic links — they may point outside the intended boundary
		if (entry.isSymbolicLink()) {
			continue;
		}

		const entryPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			const subFiles = await walkDirectory(entryPath);
			files.push(...subFiles);
		} else if (entry.isFile()) {
			files.push(entryPath);
		}
	}

	return files;
}
