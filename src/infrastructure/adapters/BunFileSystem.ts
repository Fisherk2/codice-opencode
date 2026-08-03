import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { IFileSystem } from "../../domain/ports/IFileSystem";
import type { IStagingSystem } from "../../domain/ports/IStagingSystem";
import { VERSION_FILE_NAME } from "../config/constants";
import { AtomicStager } from "./AtomicStager";
import { walkDirectory } from "./directoryWalker";
import { TemplateResolver } from "./TemplateResolver";

/** Temporary file used to probe destination writability (removed after check). */
const WRITE_TEST_FILE_NAME = ".codice-write-test";

/** Suffix for the temp file that is atomically renamed to the version file. */
const VERSION_FILE_TMP_SUFFIX = ".tmp";

/**
 * Whether an fs error code means the path exists (even if unreadable).
 * ENOENT means absent; EACCES/EPERM mean present but permission-blocked.
 * Any other code is treated as absent — staging will surface a clearer error.
 */
function classifyAccessError(err: unknown): boolean {
	const code = (err as NodeJS.ErrnoException).code;
	if (code === "ENOENT") return false;
	if (code === "EACCES" || code === "EPERM") return true; // exists but unreadable
	return false; // conservative: staging will fail with clearer message if unwritable
}

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
 * the two and implements both IFileSystem (template/destination/version ops)
 * and IStagingSystem (atomic write staging).
 */
export class BunFileSystem implements IFileSystem, IStagingSystem {
	private readonly templateResolver: TemplateResolver;
	private readonly atomicStager: AtomicStager;
	private readonly destinationRoot: string;

	/**
	 * @param templateRoot - Path to the template directory.
	 *                       Auto-detected by TemplateResolver when not provided.
	 * @param destinationRoot - Path to the destination directory (default: cwd).
	 */
	constructor(templateRoot?: string, destinationRoot?: string) {
		const resolvedDest = destinationRoot ?? process.cwd();
		this.templateResolver = new TemplateResolver(templateRoot);
		this.atomicStager = new AtomicStager(resolvedDest);
		this.destinationRoot = resolvedDest;
	}

	/** Check if a path exists in the destination directory. */
	async destinationExists(relativePath: string): Promise<boolean> {
		// resolveDestinationPath throws on path traversal — NOT caught, so it propagates
		const fullPath = this.atomicStager.resolveDestinationPath(relativePath);
		try {
			await fs.access(fullPath);
			return true;
		} catch (err) {
			return classifyAccessError(err);
		}
	}

	/**
	 * Stage a file or directory by resolving the template path and delegating
	 * to AtomicStager for the staging write.
	 *
	 * @param relativePath - Path relative to template root.
	 * @param excludeSubDirs - Optional set of subdirectory names to exclude
	 *                         when staging a directory (e.g. Set("node_modules")
	 *                         to exclude node_modules/ from a staged directory).
	 */
	async stageFile(relativePath: string, excludeSubDirs?: Set<string>): Promise<void> {
		const resolved = await this.templateResolver.resolvePath(relativePath);
		await this.atomicStager.stageFile(resolved, relativePath, excludeSubDirs);
	}

	/** Atomic rename: promote all staged files to the destination. */
	async commitStaging(): Promise<void> {
		await this.atomicStager.commitStaging();
	}

	/** Remove the staging directory recursively. */
	async cleanStaging(): Promise<void> {
		await this.atomicStager.cleanStaging();
	}

	/**
	 * Check if the destination directory is writable by attempting
	 * to create a temporary file and cleaning it up.
	 */
	async isWritable(): Promise<boolean> {
		try {
			const testFile = path.join(this.destinationRoot, WRITE_TEST_FILE_NAME);
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
		const tempPath = `${versionFilePath}${VERSION_FILE_TMP_SUFFIX}`;

		try {
			// Write to temp file first, then atomic rename
			await Bun.write(tempPath, versionData);
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

	/** Read the version file (.codice-version) from the destination root. */
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

	/** Walk a directory relative to the template root. */
	async walkTemplateDirectory(relativePath: string): Promise<readonly string[]> {
		const resolved = await this.templateResolver.resolvePath(relativePath);
		return this.walkRelative(resolved);
	}

	/** Walk a directory relative to the destination root. */
	async walkDestinationDirectory(relativePath: string): Promise<readonly string[]> {
		const resolved = this.atomicStager.resolveDestinationPath(relativePath);
		return this.walkRelative(resolved);
	}

	/** Walk an absolute directory, returning lexicographically sorted relative paths. */
	private async walkRelative(absolutePath: string): Promise<readonly string[]> {
		const files = await walkDirectory(absolutePath);
		return files.map((f) => path.relative(absolutePath, f)).sort();
	}
}
