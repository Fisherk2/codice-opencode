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
 * destination. On commit failure, newly promoted files are unlinked and
 * backed-up originals are restored; unremovable residues are reported in
 * the error instead of silently kept.
 */
export class AtomicStager {
	private readonly destinationRoot: string;
	private readonly stagingRoot: string;
	private readonly logger: VerboseLogger;

	/** @param destinationRoot - Absolute path to the destination directory. */
	constructor(destinationRoot: string, logger?: VerboseLogger) {
		this.destinationRoot = destinationRoot;
		this.stagingRoot = path.join(destinationRoot, STAGING_DIR_NAME);
		this.logger = VerboseLogger.from(logger);
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
	 * Promote staged files to the destination. Backs up originals first.
	 * On failure the rollback removes newly promoted files (rename-only,
	 * no backup) and restores the backed-up originals. Best effort: a
	 * promoted file whose unlink fails is listed in the thrown error so
	 * the residue is visible instead of silent.
	 */
	async commitStaging(): Promise<void> {
		const stagingDir = this.stagingRoot;
		const backups = new Map<string, string>();
		const promoted = new Set<string>();
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
				await this.renameStagedFile(stagingFilePath, stagingDir, backups, promoted);
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
			// Rollback on failure. Rename-promoted files (no backup existed) are
			// unlinked so they cannot leak as partial results; unlink failures
			// are reported, not thrown — the residue message is the best-effort
			// guarantee here. Remove intent marker after handled rollback —
			// only a hard-kill leaves an orphan marker that blocks the next run.
			let residueNote = "";
			if (promoted.size > 0) {
				this.logger.log(
					"rollback",
					`removing ${promoted.size} promoted file(s) after failed commit`,
				);
				const residues: string[] = [];
				for (const destPath of promoted) {
					try {
						await fs.unlink(destPath);
					} catch (unlinkError) {
						if ((unlinkError as NodeJS.ErrnoException)?.code !== "ENOENT") {
							residues.push(destPath);
						}
					}
				}
				if (residues.length > 0) {
					residueNote = ` WARNING: could not remove ${residues.length} promoted file(s): ${residues.join(", ")}`;
				}
			}
			this.logger.log("rollback", `restoring ${backups.size} backup(s) after failed commit`);
			await this.restoreBackups(backups);
			await this.cleanStaging();
			await fs.unlink(intentPath).catch(() => {});

			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to commit staged files: ${message}${residueNote}`);
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
		// Fail-closed: a pre-existing symlink at the staging root must not
		// redirect staging writes outside the destination root.
		await this.ensureNotSymlink(this.stagingRoot, "staging directory");
		const stagingPath = this.resolveStagingPath(stagingRelativePath);
		await fs.mkdir(path.dirname(stagingPath), { recursive: true });
		// copyFile is cross-device-safe (unlike rename) and avoids loading into RAM.
		await fs.copyFile(sourcePath, stagingPath);
		this.logger.log("stage_file", `${sourcePath} → ${stagingPath}`);
	}

	/**
	 * Fail-closed guard against symlink redirection: lstat does not follow
	 * links, so a symlinked staging root or backup path is detected without
	 * dereferencing it. Coverage note: this closes the two known write
	 * targets (staging root, backup path); intermediate component symlinks
	 * between destinationRoot and those targets are out of scope.
	 */
	private async ensureNotSymlink(targetPath: string, role: string): Promise<void> {
		let lstat: Awaited<ReturnType<typeof fs.lstat>>;
		try {
			lstat = await fs.lstat(targetPath);
		} catch (error) {
			if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return;
			// Uncheckable state (EACCES from parent perms...) — refuse to write.
			const detail = error instanceof Error ? error.message : String(error);
			throw new Error(`Cannot verify ${role} '${targetPath}': ${detail}`);
		}
		if (lstat.isSymbolicLink()) {
			throw new Error(`Refusing to write: ${role} '${targetPath}' exists and is a symbolic link.`);
		}
	}

	/** Atomically rename a staged file to its destination, backing up the original first. */
	private async renameStagedFile(
		stagingFilePath: string,
		stagingDir: string,
		backups: Map<string, string>,
		promoted: Set<string>,
	): Promise<void> {
		const relativePath = path.relative(stagingDir, stagingFilePath);
		const destPath = this.resolveDestinationPath(relativePath);
		this.logger.log("commit_file", `${relativePath} → ${destPath}`);

		await fs.mkdir(path.dirname(destPath), { recursive: true });

		const backupPath = `${destPath}${BACKUP_SUFFIX}`;
		await this.ensureNotSymlink(backupPath, "backup file");
		try {
			await fs.copyFile(destPath, backupPath);
			backups.set(destPath, backupPath);
		} catch (error) {
			if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
				// destPath does not exist — nothing to back up (new file).
			} else {
				// A surviving original must never be overwritten without a
				// usable backup: fail the commit so rollback runs instead.
				const detail = error instanceof Error ? error.message : String(error);
				throw new Error(
					`Cannot back up existing destination file '${relativePath}': ${detail}. ` +
						"Refusing to overwrite without a backup to avoid data loss.",
				);
			}
		}

		await fs.rename(stagingFilePath, destPath);
		promoted.add(destPath);
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
