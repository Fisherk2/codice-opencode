import * as fs from "node:fs/promises";
import * as path from "node:path";
import { STAGING_DIR_NAME } from "../config/constants";
import { walkDirectory } from "./directoryWalker";
import { resolveWithinRoot } from "./pathResolver";
import { VerboseLogger } from "./VerboseLogger";

const BACKUP_SUFFIX = ".codice-backup";

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
	private readonly logger: VerboseLogger;

	/**
	 * @param destinationRoot - Absolute path to the destination directory.
	 * @param logger - Optional verbose logger; disabled when omitted.
	 */
	constructor(destinationRoot: string, logger?: VerboseLogger) {
		this.destinationRoot = destinationRoot;
		this.stagingRoot = path.join(destinationRoot, STAGING_DIR_NAME);
		this.logger = logger ?? new VerboseLogger(false);
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
	 *                         walking a directory (e.g. Set("node_modules") to exclude
	 *                         node_modules/ when staging a directory).
	 */
	async stageFile(
		resolvedTemplatePath: string,
		relativeDestPath: string,
		excludeSubDirs?: ReadonlySet<string>,
	): Promise<void> {
		this.logger.log("stage", `${resolvedTemplatePath} → ${relativeDestPath}`);
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
			this.logger.log("commit", `promoting ${stagedFiles.length} staged file(s)`);
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
			this.logger.log("rollback", `restoring ${backups.size} backup(s) after failed commit`);
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
		this.logger.log("clean", `removing ${this.stagingRoot}`);
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
		const stagingPath = this.resolveStagingPath(stagingRelativePath);
		await fs.mkdir(path.dirname(stagingPath), { recursive: true });
		// Use copyFile for cross-device-safe copy (avoids loading entire file into RAM).
		// Bun.write() would also work but loads the full content into memory.
		await fs.copyFile(sourcePath, stagingPath);
		this.logger.log("stage_file", `${sourcePath} → ${stagingPath}`);
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
		this.logger.log("commit_file", `${relativePath} → ${destPath}`);

		// Ensure destination parent directory exists
		await fs.mkdir(path.dirname(destPath), { recursive: true });

		// Back up original destination file if it exists
		try {
			await fs.access(destPath);
			const backupPath = `${destPath}${BACKUP_SUFFIX}`;
			await fs.copyFile(destPath, backupPath);
			backups.set(destPath, backupPath);
		} catch {
			// If destPath doesn't exist or can't be read, skip backup — proceed anyway
		}

		// Atomic rename: staging → destination
		await fs.rename(stagingFilePath, destPath);
	}

	/**
	 * Restore backed-up destination files and clean up backup files.
	 * On any individual failure, continues with the remaining backups.
	 *
	 * A final sweep removes backup files whose unlink failed during the
	 * restore loop (e.g. transient EBUSY on Windows), so interrupted or
	 * failed commits never leave `.codice-backup` orphans behind. Only
	 * backups whose destination was successfully restored are swept —
	 * a backup whose copyFile failed may be the only copy of the
	 * original content and must be preserved.
	 */
	private async restoreBackups(backups: Map<string, string>): Promise<void> {
		const restored = new Set<string>();
		for (const [destPath, backupPath] of backups) {
			try {
				await fs.access(backupPath);
				await fs.copyFile(backupPath, destPath);
				restored.add(backupPath);
			} catch {
				// If rollback fails for a specific file, continue with others
			}
		}
		// Final sweep: remove backups whose restore succeeded but whose unlink
		// was skipped (the loop above never reached it) or failed transiently.
		for (const backupPath of restored) {
			try {
				await fs.unlink(backupPath);
			} catch {
				// Ignore cleanup errors for backup files
			}
		}
	}
}
