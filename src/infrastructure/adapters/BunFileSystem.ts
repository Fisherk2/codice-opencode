import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { IFileSystem } from "../../application/ports/IFileSystem";
import { STAGING_DIR_NAME, TEMPLATE_DIR_NAME, VERSION_FILE_NAME } from "../config/constants";

/**
 * Bun-native filesystem adapter with atomic staging support.
 * Uses Bun.file() and Bun.write() APIs for optimal performance.
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
	 * Build the full template path by searching each category subdirectory
	 * (obligatorio, estandar, opcional) for the given relative path.
	 * Results are cached so each relative path is resolved at most once.
	 */
	private async resolveTemplatePath(relativePath: string): Promise<string> {
		const cached = this.templateCache.get(relativePath);
		if (cached !== undefined) {
			return cached;
		}

		const categories = ["obligatorio", "estandar", "opcional"];
		for (const category of categories) {
			const fullPath = path.join(this.templateRoot, category, relativePath);
			try {
				const file = Bun.file(fullPath);
				if (await file.exists()) {
					this.templateCache.set(relativePath, fullPath);
					return fullPath;
				}
			} catch {
				// File.stat may throw on certain errors; treat as "not found"
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
		const normalized = path.normalize(relativePath);

		// Block absolute paths and explicit traversal sequences
		if (path.isAbsolute(normalized) || normalized.startsWith("..")) {
			throw new Error(
				`Path traversal detected: ${relativePath}. All paths must be relative and stay within the destination directory.`,
			);
		}

		const resolved = path.resolve(this.destinationRoot, normalized);

		// Verify the resolved path is actually inside destinationRoot
		const destinationWithSep = path.resolve(this.destinationRoot) + path.sep;
		if (!resolved.startsWith(destinationWithSep)) {
			throw new Error(
				`Path traversal blocked: ${relativePath} resolves outside the destination directory.`,
			);
		}

		return resolved;
	}

	/**
	 * Compute the staging path for a given relative destination path.
	 * Mirrors the destination directory structure under the staging root.
	 */
	private resolveStagingPath(relativePath: string): string {
		return path.join(this.stagingRoot, relativePath);
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
	 * Stage a file by reading from the template and writing to the staging directory.
	 * Creates intermediate directories in the staging path as needed.
	 */
	async stageFile(relativePath: string): Promise<void> {
		// Read the template file content
		const templatePath = await this.resolveTemplatePath(relativePath);
		const content = await Bun.file(templatePath).text();

		// Compute staging path and ensure its parent directory exists
		const stagingPath = this.resolveStagingPath(relativePath);
		await fs.mkdir(path.dirname(stagingPath), { recursive: true });

		// Write to staging
		await Bun.write(stagingPath, content);
	}

	/**
	 * Atomic rename: promote all staged files to the destination.
	 * Walks the staging directory tree and renames each file to its
	 * corresponding destination path. If any rename fails, the caller
	 * should call cleanStaging() to roll back.
	 */
	async commitStaging(): Promise<void> {
		const stagingDir = this.stagingRoot;

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

				// Atomic rename: staging → destination
				await fs.rename(stagingFilePath, destPath);
			}

			// Clean up staging directory after successful commit
			await this.cleanStaging();
		} catch (error) {
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
			// If we can't read the directory, assume it's empty
			return true;
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
	 * Recursively walk a directory and return all file paths.
	 */
	private async walkDirectory(dirPath: string): Promise<string[]> {
		const files: string[] = [];
		const entries = await fs.readdir(dirPath, { withFileTypes: true });

		for (const entry of entries) {
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
