import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { IFileSystem } from "../../application/ports/IFileSystem";
import { STAGING_DIR_NAME, TEMPLATE_DIR_NAME, VERSION_FILE_NAME } from "../config/constants";

/**
 * Bun-compatible filesystem adapter with atomic staging support.
 *
 * Uses Bun.file() and Bun.write() for file reads and writes (Bun-native APIs).
 * Uses node:fs/promises for directory operations (mkdir, readdir, rename, rm,
 * access, unlink) because Bun does not yet provide native equivalents for
 * these filesystem primitives. All operations are compatible with Bun's runtime.
 *
 * Template files are resolved from the template root by searching
 * each category subdirectory (obligatorio/estandar/opcional) in order.
 * Files are cached after first lookup for performance.
 */
export class BunFileSystem implements IFileSystem {
	private readonly templateRoot: string;
	private readonly destinationRoot: string;
	private readonly stagingRoot: string;
	private readonly templateCache = new Map<string, string>();

	/**
	 * @param templateRoot - Path to the template directory (default: cwd/template)
	 * @param destinationRoot - Path to the destination directory (default: cwd)
	 */
	constructor(templateRoot?: string, destinationRoot?: string) {
		this.templateRoot = templateRoot ?? path.join(process.cwd(), TEMPLATE_DIR_NAME);
		this.destinationRoot = destinationRoot ?? process.cwd();
		this.stagingRoot = path.join(this.destinationRoot, STAGING_DIR_NAME);
	}

	// ---------------------------------------------------------------------------
	// Template file resolution helpers
	// ---------------------------------------------------------------------------

	/**
	 * Resolve a relative path against a root directory.
	 * Rejects absolute paths, traversal sequences, and paths
	 * that resolve outside the root boundary.
	 */
	private resolveWithinRoot(root: string, relativePath: string, context: string): string {
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

	/**
	 * Build the full template path by searching each category subdirectory
	 * (obligatorio, estandar, opcional) for the given relative path.
	 * Supports both files and directories.
	 * Results are cached so each relative path is resolved at most once.
	 */
	private async resolveTemplatePath(relativePath: string): Promise<string> {
		const cached = this.templateCache.get(relativePath);
		if (cached !== undefined) {
			return cached;
		}

		// Reject absolute paths and explicit traversal sequences
		const normalized = path.normalize(relativePath);
		if (path.isAbsolute(normalized) || normalized.startsWith("..")) {
			throw new Error(
				`Invalid template path: ${relativePath}. All template paths must be relative.`,
			);
		}

		const categories = ["obligatorio", "estandar", "opcional"];
		for (const category of categories) {
			const fullPath = path.join(this.templateRoot, category, relativePath);

			// Verify resolved path stays within templateRoot — prevents symlink escape
			// and traversal via path components like `subdir/../../../etc/passwd`.
			// The trailing separator prevents substring prefix matching (e.g. /home/project
			// vs /home/project-evil).
			const resolved = path.resolve(fullPath);
			const templateWithSep = path.resolve(this.templateRoot) + path.sep;
			if (!resolved.startsWith(templateWithSep)) {
				throw new Error(`Template path escapes template directory: ${relativePath}.`);
			}

			// Check existence using fs.access (works for both files and directories)
			try {
				await fs.access(resolved);
				this.templateCache.set(relativePath, resolved);
				return resolved;
			} catch {
				// Not found in this category; continue to next
			}
		}

		throw new Error(
			`Template file not found: ${relativePath}. Ensure the template directory contains the file under obligatorio/, estandar/, or opcional/.`,
		);
	}

	/**
	 * Resolve a relative path against the destination root and prevent
	 * path traversal attacks. The resolved path must stay within the
	 * destinationRoot boundary.
	 */
	private resolveDestinationPath(relativePath: string): string {
		return this.resolveWithinRoot(this.destinationRoot, relativePath, "destination");
	}

	/**
	 * Compute the staging path for a given relative destination path.
	 * Mirrors the destination directory structure under the staging root.
	 * Validates that the resolved path stays within the staging directory.
	 */
	private resolveStagingPath(relativePath: string): string {
		return this.resolveWithinRoot(this.stagingRoot, relativePath, "staging");
	}

	// ---------------------------------------------------------------------------
	// IFileSystem implementation
	// ---------------------------------------------------------------------------

	/**
	 * Read a file from the template directory.
	 * Searches each category subdirectory in order (obligatorio → estandar → opcional).
	 */
	async readTemplateFile(relativePath: string): Promise<string> {
		const fullPath = await this.resolveTemplatePath(relativePath);
		const file = Bun.file(fullPath);
		return file.text();
	}

	/**
	 * Check if a path exists in the destination directory.
	 */
	async destinationExists(relativePath: string): Promise<boolean> {
		// resolveDestinationPath throws on path traversal — NOT caught, so it propagates
		const fullPath = this.resolveDestinationPath(relativePath);
		try {
			const file = Bun.file(fullPath);
			return await file.exists();
		} catch {
			// Filesystem errors (permissions, etc.) treated as "does not exist"
			return false;
		}
	}

	/**
	 * Get the staging path for a given destination path.
	 * Does NOT create the staging directory.
	 */
	getStagingPath(relativePath: string): string {
		return this.resolveStagingPath(relativePath);
	}

	/**
	 * Stage a file or directory by reading from the template and writing
	 * to the staging directory. If the resolved path is a directory, all
	 * files within it are staged recursively. Creates intermediate
	 * directories in the staging path as needed.
	 */
	async stageFile(relativePath: string): Promise<void> {
		const resolved = await this.resolveTemplatePath(relativePath);
		const stat = await fs.stat(resolved);

		if (stat.isDirectory()) {
			const files = await this.walkDirectory(resolved);
			for (const filePath of files) {
				const fileRelative = path.relative(resolved, filePath);
				const fullRelative = path.join(relativePath, fileRelative);
				await this.writeFileToStaging(filePath, fullRelative);
			}
		} else {
			await this.writeFileToStaging(resolved, relativePath);
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
		// Backup of original destination files: destPath → backupPath
		const backups = new Map<string, string>();

		try {
			// Check if staging directory exists (fs.access works for directories; Bun.file does not)
			let stagingExists = false;
			try {
				await fs.access(stagingDir);
				stagingExists = true;
			} catch {
				stagingExists = false;
			}

			if (!stagingExists) {
				throw new Error("No staged files found. Call stageFile() before commitStaging().");
			}

			// Walk the staging directory recursively
			const stagedFiles = await this.walkDirectory(stagingDir);

			for (const stagingFilePath of stagedFiles) {
				// Compute relative path from staging root → this is the destination relative path
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
					// The worst case is we can't roll back this particular file
				}

				// Atomic rename: staging → destination
				await fs.rename(stagingFilePath, destPath);
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
			// Rollback: restore all backed-up original files
			await this.restoreBackups(backups);

			// Clean up staging on failure too
			await this.cleanStaging();

			// Re-throw with actionable message
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

	/**
	 * Check if the destination directory is writable by attempting
	 * to create a temporary file and cleaning it up.
	 */
	async isWritable(): Promise<boolean> {
		try {
			const testFile = path.join(this.destinationRoot, ".codice-write-test");
			await Bun.write(testFile, "test");
			await fs.unlink(testFile);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Check if the destination directory is effectively empty.
	 * Allows .git/ and .codice-version files to exist without
	 * considering the directory non-empty.
	 */
	async isEmpty(): Promise<boolean> {
		try {
			const entries = await fs.readdir(this.destinationRoot);
			const visibleEntries = entries.filter(
				(entry) => entry !== ".git" && entry !== VERSION_FILE_NAME,
			);
			return visibleEntries.length === 0;
		} catch {
			// If we can't read the directory, assume non-empty to prevent
			// silent overwrites — the confirmation prompt will be shown.
			return false;
		}
	}

	/**
	 * Write the version file (.codice-version) to the destination root.
	 * Uses atomic write via Bun.write to a temp file, then renames.
	 */
	async writeVersionFile(versionData: string): Promise<void> {
		const versionFilePath = path.join(this.destinationRoot, VERSION_FILE_NAME);
		const tempPath = `${versionFilePath}.tmp`;

		try {
			// Write to temp file first
			await Bun.write(tempPath, versionData);
			// Atomic rename
			await fs.rename(tempPath, versionFilePath);
		} catch (error) {
			// Clean up temp file if rename failed
			try {
				await fs.unlink(tempPath);
			} catch {
				// Ignore cleanup errors
			}
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(`Failed to write version file: ${message}`);
		}
	}

	/**
	 * Read the version file (.codice-version) from the destination root.
	 * Returns null if the file does not exist.
	 */
	async readVersionFile(): Promise<string | null> {
		try {
			const versionFilePath = path.join(this.destinationRoot, VERSION_FILE_NAME);
			const file = Bun.file(versionFilePath);
			const exists = await file.exists();
			if (!exists) {
				return null;
			}
			return file.text();
		} catch {
			return null;
		}
	}

	// ---------------------------------------------------------------------------
	// Private helpers
	// ---------------------------------------------------------------------------

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

	/**
	 * Read a template file and write its content to the staging directory.
	 * Creates intermediate directories in the staging path as needed.
	 */
	private async writeFileToStaging(sourcePath: string, stagingRelativePath: string): Promise<void> {
		const content = await Bun.file(sourcePath).text();
		const stagingPath = this.resolveStagingPath(stagingRelativePath);
		await fs.mkdir(path.dirname(stagingPath), { recursive: true });
		await Bun.write(stagingPath, content);
	}

	/**
	 * Recursively walk a directory and return all file paths.
	 * Skips symbolic links to prevent following symlinks that
	 * point outside the template directory (security measure).
	 */
	private async walkDirectory(dirPath: string): Promise<string[]> {
		const files: string[] = [];
		const entries = await fs.readdir(dirPath, { withFileTypes: true });

		for (const entry of entries) {
			// Skip symbolic links — they may point outside the template
			// (e.g., development-time symlinks to other projects)
			if (entry.isSymbolicLink()) {
				continue;
			}

			const entryPath = path.join(dirPath, entry.name);
			if (entry.isDirectory()) {
				const subFiles = await this.walkDirectory(entryPath);
				files.push(...subFiles);
			} else if (entry.isFile()) {
				files.push(entryPath);
			}
		}

		return files;
	}
}
