import * as fs from "node:fs/promises";
import * as path from "node:path";
import { walkDirectory } from "./directoryWalker";
import { resolveWithinRoot } from "./pathResolver";

/**
 * Performs atomic file staging, commit, and rollback operations.
 *
 * Files are first written to a staging directory, then atomically renamed
 * to their destination paths. On failure, all backed-up original files
 * are restored to guarantee project consistency.
 *
 * This class is a single-responsibility extraction from BunFileSystem.
 * It handles ONLY the staging/destination filesystem concerns — it does
 * NOT know about template resolution or category directory structure.
 */
export class AtomicStager {
	private readonly destinationRoot: string;
	private readonly stagingRoot: string;

	/**
	 * @param destinationRoot - Absolute path to the destination directory.
	 */
	constructor(destinationRoot: string) {
		this.destinationRoot = destinationRoot;
		this.stagingRoot = path.join(destinationRoot, ".codice-staging");
	}

	// ---------------------------------------------------------------------------
	// Public API — called by BunFileSystem delegates
	// ---------------------------------------------------------------------------

	/**
	 * Resolve a relative path against the destination root and prevent
	 * path traversal attacks. The resolved path must stay within the
	 * destinationRoot boundary.
	 */
	resolveDestinationPath(relativePath: string): string {
		return resolveWithinRoot(this.destinationRoot, relativePath, "destination");
	}

	/**
	 * Compute the staging path for a given relative destination path.
	 * Mirrors the destination directory structure under the staging root.
	 * Validates that the resolved path stays within the staging directory.
	 */
	resolveStagingPath(relativePath: string): string {
		return resolveWithinRoot(this.stagingRoot, relativePath, "staging");
	}

	/**
	 * Stage a file by copying from the resolved template path to the staging
	 * directory. If the resolved path is a directory, all files within it
	 * are staged recursively. Creates intermediate directories as needed.
	 *
	 * @param resolvedTemplatePath - Already-resolved absolute path within the template directory.
	 * @param relativeDestPath - The relative destination path (used to build staging path).
	 * @param excludeSubDirs - Optional set of subdirectory names to exclude when
	 *                         walking a directory (e.g. Set("opencode") to exclude
	 *                         docs/opencode/ when staging docs/).
	 */
	async stageFile(
		resolvedTemplatePath: string,
		relativeDestPath: string,
		excludeSubDirs?: Set<string>,
	): Promise<void> {
		const stat = await fs.stat(resolvedTemplatePath);

		if (stat.isDirectory()) {
			const files = await walkDirectory(resolvedTemplatePath, false, excludeSubDirs);
			for (const filePath of files) {
				const fileRelative = path.relative(resolvedTemplatePath, filePath);
				const fullRelative = path.join(relativeDestPath, fileRelative);
				await this.writeFileToStaging(filePath, fullRelative);
			}
		} else {
			await this.writeFileToStaging(resolvedTemplatePath, relativeDestPath);
		}
	}

	/**
	 * Atomic rename: promote all staged files to the destination.
	 * Walks the staging directory tree and renames each file to its
	 * corresponding destination path. Before each rename, the original
	 * destination file (if it exists) is backed up. On failure, all
	 * backed-up files are restored to guarantee project consistency.
	 */
	async commitStaging(): Promise<void> {
		const stagingDir = this.stagingRoot;
		const backups = new Map<string, string>();

		try {
			// Check if staging directory exists (fs.access works for dirs; Bun.file does not)
			try {
				await fs.access(stagingDir);
			} catch {
				throw new Error("No staged files found. Call stageFile() before commitStaging().");
			}

			// Walk and rename each staged file atomically
			const stagedFiles = await walkDirectory(stagingDir);
			for (const stagingFilePath of stagedFiles) {
				await this.renameStagedFile(stagingFilePath, stagingDir, backups);
			}

			// Clean up staging directory after successful commit
			await this.cleanStaging();

			// Clean up backup files on success
			for (const backupPath of backups.values()) {
				try {
					await fs.unlink(backupPath);
				} catch {
					// Ignore cleanup errors for backup files
				}
			}
		} catch (error) {
			await this.restoreBackups(backups);
			await this.cleanStaging();

			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to commit staged files: ${message}`);
		}
	}

	/**
	 * Remove the staging directory recursively.
	 */
	async cleanStaging(): Promise<void> {
		try {
			await fs.rm(this.stagingRoot, { recursive: true, force: true });
		} catch {
			// If staging doesn't exist, there's nothing to clean
		}
	}

	// ---------------------------------------------------------------------------
	// Private helpers
	// ---------------------------------------------------------------------------

	/**
	 * Read a source file and write its content to the staging directory.
	 * Creates intermediate directories in the staging path as needed.
	 */
	private async writeFileToStaging(sourcePath: string, stagingRelativePath: string): Promise<void> {
		const content = await Bun.file(sourcePath).text();
		const stagingPath = this.resolveStagingPath(stagingRelativePath);
		await fs.mkdir(path.dirname(stagingPath), { recursive: true });
		await Bun.write(stagingPath, content);
	}

	/**
	 * Atomically rename a single staged file to its destination path.
	 * Before the rename, the original destination file (if it exists) is backed
	 * up to allow rollback. Creates intermediate directories as needed.
	 */
	private async renameStagedFile(
		stagingFilePath: string,
		stagingDir: string,
		backups: Map<string, string>,
	): Promise<void> {
		const relativePath = path.relative(stagingDir, stagingFilePath);
		const destPath = this.resolveDestinationPath(relativePath);

		// Ensure destination parent directory exists
		await fs.mkdir(path.dirname(destPath), { recursive: true });

		// Back up original destination file if it exists
		try {
			const destFile = Bun.file(destPath);
			if (await destFile.exists()) {
				const backupPath = `${destPath}.codice-backup`;
				await fs.copyFile(destPath, backupPath);
				backups.set(destPath, backupPath);
			}
		} catch {
			// If we can't copy the original, we can't back it up — proceed anyway
		}

		// Atomic rename: staging → destination
		await fs.rename(stagingFilePath, destPath);
	}

	/**
	 * Restore backed-up destination files and clean up backup files.
	 * On any individual failure, continues with the remaining backups.
	 */
	private async restoreBackups(backups: Map<string, string>): Promise<void> {
		for (const [destPath, backupPath] of backups) {
			try {
				const backupFile = Bun.file(backupPath);
				if (await backupFile.exists()) {
					await fs.copyFile(backupPath, destPath);
				}
				await fs.unlink(backupPath);
			} catch {
				// If rollback fails for a specific file, continue with others
			}
		}
	}
}
