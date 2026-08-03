import type { IFileSystem } from "../ports/IFileSystem";

/**
 * Compare two directory trees and return relative paths of files present in source
 * but missing in destination. Used by Update mode to deliver new standard files
 * at file-level granularity instead of skipping entire standard directories.
 *
 * @param fileSystem - Adapter for filesystem reads (template + destination).
 * @param sourceDir - Relative path within the template directory (e.g. "docs").
 * @param destDir - Relative path within the destination directory (e.g. "docs").
 * @returns Sorted array (lexicographic) of relative paths from sourceDir
 *   of files present in the template but missing in the destination.
 */
export async function diffTrees(
	fileSystem: IFileSystem,
	sourceDir: string,
	destDir: string,
): Promise<readonly string[]> {
	// If destination doesn't exist at all, all source files are "missing"
	const destExists = await fileSystem.destinationExists(destDir);
	if (!destExists) {
		// Return all files from the template directory
		return fileSystem.walkTemplateDirectory(sourceDir);
	}

	// Walk both directories and return only files in source but not in dest
	const sourceFiles = new Set(await fileSystem.walkTemplateDirectory(sourceDir));
	const destFiles = new Set(await fileSystem.walkDestinationDirectory(destDir));

	const missing: string[] = [];
	for (const file of sourceFiles) {
		if (!destFiles.has(file)) {
			missing.push(file);
		}
	}
	return missing.sort();
}
