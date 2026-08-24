import * as fs from "node:fs/promises";
import * as path from "node:path";
import { BACKUP_INTENT_FILE, STAGING_DIR_NAME } from "../config/constants";
import { walkDirectory } from "./directoryWalker";
import { resolveWithinRoot } from "./pathResolver";
import { VerboseLogger } from "./VerboseLogger";

const BACKUP_SUFFIX = ".codice-backup";

/**
 * Atomic file staging, commit, and rollback operations.
 *
 * Files are staged to a staging directory, then atomically renamed to the
 * destination. On failure, backed-up originals are restored for consistency.
 */
export class AtomicStager {
	private readonly destinationRoot: string;
	private readonly stagingRoot: string;
	private readonly logger: VerboseLogger;

	/** @param destinationRoot - Absolute path to the destination directory. */
	constructor(destinationRoot: string, logger?: VerboseLogger) {
		this.destinationRoot = destinationRoot;
		this.stagingRoot = path.join(destinationRoot, STAGING_DIR_NAME);
		this.logger = logger ?? new VerboseLogger(false);
	}

	/** Resolve a relative path against destinationRoot, preventing path traversal. */
	resolveDestinationPath(relativePath: string): string {
		return resolveWithinRoot(this.destinationRoot, relativePath, "destination");
	}

	/** Compute the staging path for a relative destination path, preventing traversal. */
	resolveStagingPath(relativePath: string): string {
		return resolveWithinRoot(this.stagingRoot, relativePath, "staging");
	}

	/**
	 * Stage a file or directory by copying to the staging area.
	 * Directories are walked recursively; excludeSubDirs skips named subdirs.
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
	 * Promote staged files to the destination. Backs up originals first;
	 * on failure restores all backups to guarantee consistency.
	 */
	async commitStaging(): Promise<void> {
		const stagingDir = this.stagingRoot;
		const backups = new Map<string, string>();
		const intentPath = path.join(this.destinationRoot, BACKUP_INTENT_FILE);

		// Fail-fast: refuse if previous commit was interrupted (hard-kill left orphan).
		let orphanIntent: string | null = null;
		try {
			orphanIntent = await fs.readFile(intentPath, "utf-8");
		} catch {
			// Marker absent or unreadable — proceed normally.
		}
		if (orphanIntent !== null) {
			throw new Error(
				`Previous commit was interrupted (intent recorded at ${orphanIntent}). ` +
					`Inspect .codice-backup manually before retrying. ` +
					`Remove ${BACKUP_INTENT_FILE} to force a retry.`,
			);
		}

		try {
			await fs.writeFile(intentPath, new Date().toISOString(), "utf-8");

			// fs.access works for dirs; Bun.file does not.
			try {
				await fs.access(stagingDir);
			} catch {
				await fs.unlink(intentPath).catch(() => {});
				throw new Error("No staged files found. Call stageFile() before commitStaging().");
			}

			const stagedFiles = await walkDirectory(stagingDir);
			this.logger.log("commit", `promoting ${stagedFiles.length} staged file(s)`);
			for (const stagingFilePath of stagedFiles) {
				await this.renameStagedFile(stagingFilePath, stagingDir, backups);
			}

			await this.cleanStaging();

			for (const backupPath of backups.values()) {
				try {
					await fs.unlink(backupPath);
				} catch {
					// Ignore cleanup errors for backup files
				}
			}

			await fs.unlink(intentPath).catch(() => {});
		} catch (error) {
			// Rollback on failure. Remove intent marker after handled rollback —
			// only a hard-kill leaves an orphan marker that blocks the next run.
			this.logger.log("rollback", `restoring ${backups.size} backup(s) after failed commit`);
			await this.restoreBackups(backups);
			await this.cleanStaging();
			await fs.unlink(intentPath).catch(() => {});

			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to commit staged files: ${message}`);
		}
	}

	/** Remove the staging directory recursively. */
	async cleanStaging(): Promise<void> {
		this.logger.log("staging_cleanup", this.stagingRoot);
		try {
			await fs.rm(this.stagingRoot, { recursive: true, force: true });
		} catch {
			// If staging doesn't exist, there's nothing to clean
		}
	}

	/** Copy a source file to the staging directory, creating parent dirs as needed. */
	private async writeFileToStaging(sourcePath: string, stagingRelativePath: string): Promise<void> {
		const stagingPath = this.resolveStagingPath(stagingRelativePath);
		await fs.mkdir(path.dirname(stagingPath), { recursive: true });
		// copyFile is cross-device-safe (unlike rename) and avoids loading into RAM.
		await fs.copyFile(sourcePath, stagingPath);
		this.logger.log("stage_file", `${sourcePath} → ${stagingPath}`);
	}

	/** Atomically rename a staged file to its destination, backing up the original first. */
	private async renameStagedFile(
		stagingFilePath: string,
		stagingDir: string,
		backups: Map<string, string>,
	): Promise<void> {
		const relativePath = path.relative(stagingDir, stagingFilePath);
		const destPath = this.resolveDestinationPath(relativePath);
		this.logger.log("commit_file", `${relativePath} → ${destPath}`);

		await fs.mkdir(path.dirname(destPath), { recursive: true });

		try {
			await fs.access(destPath);
			const backupPath = `${destPath}${BACKUP_SUFFIX}`;
			await fs.copyFile(destPath, backupPath);
			backups.set(destPath, backupPath);
		} catch {
			// destPath doesn't exist or can't be read — skip backup, proceed anyway
		}

		await fs.rename(stagingFilePath, destPath);
	}

	/**
	 * Restore backed-up destination files. Continues with remaining files
	 * on individual failure. Sweeps only successfully-restored backups to
	 * avoid discarding the only copy of original content.
	 */
	private async restoreBackups(backups: Map<string, string>): Promise<void> {
		const restored = new Set<string>();
		for (const [destPath, backupPath] of backups) {
			try {
				await fs.access(backupPath);
				await fs.copyFile(backupPath, destPath);
				restored.add(backupPath);
			} catch {
				// Continue restoring remaining files
			}
		}
		// Sweep only successfully-restored backups — a failed copyFile may be the
		// only copy of original content and must be preserved.
		for (const backupPath of restored) {
			try {
				await fs.unlink(backupPath);
			} catch {
				// Ignore cleanup errors for backup files
			}
		}
	}
}
