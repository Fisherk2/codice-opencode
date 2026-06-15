import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { IFileSystem } from "../../application/ports/IFileSystem";
import { TEMPLATE_DIR_NAME, VERSION_FILE_NAME } from "../config/constants";
import { AtomicStager } from "./AtomicStager";
import { TemplateResolver } from "./TemplateResolver";

/**
 * Bun-compatible filesystem adapter with atomic staging support.
 *
 * Uses Bun.file() and Bun.write() for file reads and writes (Bun-native APIs).
 * Uses node:fs/promises for directory operations (mkdir, readdir, rename, rm,
 * access, unlink) because Bun does not yet provide native equivalents for
 * these filesystem primitives. All operations are compatible with Bun's runtime.
 *
 * Template resolution is delegated to TemplateResolver, and atomic staging
 * operations are delegated to AtomicStager. This class coordinates between
 * the two and implements the IFileSystem port.
 */
export class BunFileSystem implements IFileSystem {
	private readonly templateResolver: TemplateResolver;
	private readonly atomicStager: AtomicStager;
	private readonly destinationRoot: string;

	/**
	 * @param templateRoot - Path to the template directory (default: cwd/template)
	 * @param destinationRoot - Path to the destination directory (default: cwd)
	 */
	constructor(templateRoot?: string, destinationRoot?: string) {
		const resolvedTemplate = templateRoot ?? path.join(process.cwd(), TEMPLATE_DIR_NAME);
		const resolvedDest = destinationRoot ?? process.cwd();
		this.templateResolver = new TemplateResolver(resolvedTemplate);
		this.atomicStager = new AtomicStager(resolvedDest);
		this.destinationRoot = resolvedDest;
	}

	// ---------------------------------------------------------------------------
	// IFileSystem implementation — template operations
	// ---------------------------------------------------------------------------

	/**
	 * Read a file from the template directory.
	 * Delegates to TemplateResolver which searches category subdirectories.
	 */
	async readTemplateFile(relativePath: string): Promise<string> {
		return this.templateResolver.readFile(relativePath);
	}

	// ---------------------------------------------------------------------------
	// IFileSystem implementation — destination operations
	// ---------------------------------------------------------------------------

	/**
	 * Check if a path exists in the destination directory.
	 */
	async destinationExists(relativePath: string): Promise<boolean> {
		// resolveDestinationPath throws on path traversal — NOT caught, so it propagates
		const fullPath = this.atomicStager.resolveDestinationPath(relativePath);
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
		return this.atomicStager.resolveStagingPath(relativePath);
	}

	/**
	 * Stage a file or directory by resolving the template path and delegating
	 * to AtomicStager for the staging write.
	 */
	async stageFile(relativePath: string): Promise<void> {
		const resolved = await this.templateResolver.resolvePath(relativePath);
		await this.atomicStager.stageFile(resolved, relativePath);
	}

	/**
	 * Atomic rename: promote all staged files to the destination.
	 * Delegates to AtomicStager which handles backup and rollback.
	 */
	async commitStaging(): Promise<void> {
		await this.atomicStager.commitStaging();
	}

	/**
	 * Remove the staging directory recursively.
	 */
	async cleanStaging(): Promise<void> {
		await this.atomicStager.cleanStaging();
	}

	// ---------------------------------------------------------------------------
	// IFileSystem implementation — writability and directory state
	// ---------------------------------------------------------------------------

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

	// ---------------------------------------------------------------------------
	// IFileSystem implementation — version file operations
	// ---------------------------------------------------------------------------

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
}
