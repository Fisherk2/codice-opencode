import * as fs from "node:fs/promises";
import * as path from "node:path";
import { BACKUP_INTENT_FILE, STAGING_DIR_PREFIX } from "../config/constants";
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
	/** Lazily created unique staging dir (`.codice-staging-<random>`); null until first stage. */
	private stagingRoot: string | null = null;
	private readonly logger: VerboseLogger;

	/** @param destinationRoot - Absolute path to the destination directory. */
	constructor(destinationRoot: string, logger?: VerboseLogger) {
		this.destinationRoot = destinationRoot;
		this.logger = VerboseLogger.from(logger);
	}

	/**
	 * Create the per-run staging directory once. mkdtemp guarantees a name
	 * no concurrent run holds, so staging never interleaves across runs.
	 */
	private async ensureStagingRoot(): Promise<string> {
		if (this.stagingRoot === null) {
			this.stagingRoot = await fs.mkdtemp(path.join(this.destinationRoot, STAGING_DIR_PREFIX));
			this.logger.log("staging_dir", this.stagingRoot);
		}
		return this.stagingRoot;
	}

	/** The current staging dir; only valid after ensureStagingRoot(). */
	private stagingRootOrFail(): string {
		if (this.stagingRoot === null) {
			throw new Error(
				"Staging directory not initialized. Call stageFile() before commitStaging().",
			);
		}
		return this.stagingRoot;
	}

	/** Resolve a relative path against destinationRoot, preventing path traversal. */
	resolveDestinationPath(relativePath: string): string {
		return resolveWithinRoot(this.destinationRoot, relativePath, "destination");
	}

	/** Compute the staging path for a relative destination path, preventing traversal. */
	resolveStagingPath(relativePath: string): string {
		return resolveWithinRoot(this.stagingRootOrFail(), relativePath, "staging");
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
	async commitStaging(): Promise<string> {
		const stagingDir = this.stagingRoot;
		const backups = new Map<string, string>();
		const promoted = new Set<string>();
		const intentPath = path.join(this.destinationRoot, BACKUP_INTENT_FILE);

		// Fail-fast: refuse if previous commit was interrupted (hard-kill left orphan).
		await this.assertNoOrphanIntent(intentPath);

		try {
			// O_EXCL create (flag "wx"): only one run can claim the marker, so
			// a second concurrent commit fails cleanly instead of interleaving.
			try {
				await fs.writeFile(intentPath, new Date().toISOString(), { encoding: "utf-8", flag: "wx" });
			} catch (createError) {
				if ((createError as NodeJS.ErrnoException)?.code === "EEXIST") {
					throw new Error(
						`Another commit is in progress or left an intent marker at ${intentPath}. ` +
							"Inspect .codice-backup manually; remove the marker only when no update is running.",
					);
				}
				throw createError;
			}

			// fs.access works for dirs; Bun.file does not.
			try {
				if (stagingDir === null) throw new Error("not-created");
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

			// The commit has succeeded: an intent-marker cleanup failure is
			// non-blocking residue — report it, never throw (a throw here
			// would falsely trigger rollback of a completed commit).
			let residueNote = "";
			try {
				await fs.unlink(intentPath);
			} catch (unlinkError) {
				const detail = unlinkError instanceof Error ? unlinkError.message : String(unlinkError);
				this.logger.log("intent_cleanup", `WARNING: could not remove intent marker: ${detail}`);
				residueNote =
					` WARNING: commit succeeded but the backup intent marker could not be removed ` +
					`(${detail}). Inspect ${intentPath} before the next update.`;
			}
			return residueNote;
		} catch (error) {
			// Rollback on failure. Rename-promoted files (no backup existed) are
			// unlinked so they cannot leak as partial results; unlink failures
			// are reported, not thrown — the residue message is the best-effort
			// guarantee here. Remove intent marker after handled rollback —
			// only a hard-kill leaves an orphan marker that blocks the next run.
			const residueNote = await this.rollbackFailedCommit(promoted, backups, intentPath);

			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to commit staged files: ${message}${residueNote}`);
		}
	}

	/**
	 * Fail-fast guard: refuse when a previous commit was interrupted by a
	 * hard-kill and left its intent marker behind. The marker content names
	 * the staging directory the interrupted run was committing. Fail-closed
	 * policy (mirrors ensureNotSymlink): only ENOENT means "absent" — any
	 * other read error leaves the marker's state unknown, so the run is
	 * refused instead of risking a second interleaved commit.
	 */
	private async assertNoOrphanIntent(intentPath: string): Promise<void> {
		let orphanIntent: string | null = null;
		try {
			orphanIntent = await fs.readFile(intentPath, "utf-8");
		} catch (error) {
			if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return;
			const detail = error instanceof Error ? error.message : String(error);
			throw new Error(`Cannot verify backup intent marker '${intentPath}': ${detail}`);
		}
		if (orphanIntent !== null) {
			throw new Error(
				`Previous commit was interrupted (intent recorded at ${orphanIntent}). ` +
					`Inspect .codice-backup manually before retrying. ` +
					`Remove ${BACKUP_INTENT_FILE} to force a retry.`,
			);
		}
	}

	/**
	 * Best-effort cleanup after a failed commit: unlink rename-promoted
	 * files, restore backups, clear staging and the intent marker.
	 * @returns residue note for files that could not be unlinked ("" if none).
	 */
	private async rollbackFailedCommit(
		promoted: Set<string>,
		backups: Map<string, string>,
		intentPath: string,
	): Promise<string> {
		let residueNote = "";
		if (promoted.size > 0) {
			this.logger.log("rollback", `removing ${promoted.size} promoted file(s) after failed commit`);
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
		return residueNote;
	}

	/** Remove this run's staging directory recursively. */
	async cleanStaging(): Promise<void> {
		this.logger.log("staging_cleanup", this.stagingRoot ?? "(not created)");
		if (this.stagingRoot === null) return;
		try {
			await fs.rm(this.stagingRoot, { recursive: true, force: true });
		} catch {
			// If staging doesn't exist, there's nothing to clean
		}
	}

	/** Copy a source file to the staging directory, creating parent dirs as needed. */
	private async writeFileToStaging(sourcePath: string, stagingRelativePath: string): Promise<void> {
		const stagingRoot = await this.ensureStagingRoot();
		// Fail-closed: a symlink swapped in for the staging root (e.g. by an
		// attacker racing between mkdtemp and this write) must not redirect
		// staging writes outside the destination root.
		await this.ensureNotSymlink(stagingRoot, "staging directory");
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

		// Fail-closed: a symlinked INTERMEDIATE component would redirect the
		// rename (and mkdir -p) outside the destination root.
		await this.assertNoSymlinkedIntermediate(destPath);

		await fs.mkdir(path.dirname(destPath), { recursive: true });

		// Policy for a symlink at destPath itself: replace WITHOUT backup.
		// rename() replaces the link entry atomically without following it,
		// but copyFile(destPath, backup) would have dereferenced the link —
		// unlinking the link first keeps every operation link-free.
		let destLstat: Awaited<ReturnType<typeof fs.lstat>> | null = null;
		try {
			destLstat = await fs.lstat(destPath);
		} catch (error) {
			if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") {
				const detail = error instanceof Error ? error.message : String(error);
				throw new Error(`Cannot inspect destination file '${relativePath}': ${detail}`);
			}
		}
		if (destLstat?.isSymbolicLink()) {
			await fs.unlink(destPath);
		}

		const backupPath = `${destPath}${BACKUP_SUFFIX}`;
		await this.ensureNotSymlink(backupPath, "backup file");
		if (destLstat && !destLstat.isSymbolicLink()) {
			try {
				await fs.copyFile(destPath, backupPath);
				backups.set(destPath, backupPath);
			} catch (error) {
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
	 * Fail-closed guard: walk destPath's intermediate components (relative
	 * to destinationRoot) and refuse if any EXISTING one is a symbolic
	 * link — mkdir -p and rename would otherwise follow it and write
	 * outside the destination root. Missing components are fine (mkdir
	 * creates them inside the root).
	 */
	private async assertNoSymlinkedIntermediate(destPath: string): Promise<void> {
		const relative = path.relative(this.destinationRoot, destPath);
		const intermediates = relative.split(path.sep).slice(0, -1);
		let current = this.destinationRoot;
		for (const part of intermediates) {
			current = path.join(current, part);
			let lstat: Awaited<ReturnType<typeof fs.lstat>>;
			try {
				lstat = await fs.lstat(current);
			} catch (error) {
				if ((error as NodeJS.ErrnoException)?.code === "ENOENT") continue;
				const detail = error instanceof Error ? error.message : String(error);
				throw new Error(`Cannot verify destination component '${current}': ${detail}`);
			}
			if (lstat.isSymbolicLink()) {
				throw new Error(
					`Refusing to write: destination component '${current}' is a symbolic link.`,
				);
			}
		}
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
