/**
 * Abstract filesystem operations for the installer.
 * All file I/O goes through this port to isolate
 * domain/application logic from the underlying runtime.
 */
export interface IFileSystem {
	/**
	 * Read a file from the template directory.
	 * @param relativePath - Path relative to template root.
	 * @returns File contents as a string.
	 */
	readTemplateFile(relativePath: string): Promise<string>;

	/**
	 * Check if a path exists in the destination.
	 */
	destinationExists(relativePath: string): Promise<boolean>;

	/**
	 * Get the staging path for a given destination path.
	 */
	getStagingPath(relativePath: string): string;

	/**
	 * Stage a file: copy from template to staging directory.
	 * If the path resolves to a directory and excludeSubDirs is provided,
	 * subdirectories matching names in the set are excluded from staging.
	 *
	 * @param relativePath - Path relative to template root.
	 * @param excludeSubDirs - Optional set of subdirectory names to skip.
	 */
	stageFile(relativePath: string, excludeSubDirs?: Set<string>): Promise<void>;

	/**
	 * Atomic rename: promote all staged files to destination.
	 */
	commitStaging(): Promise<void>;

	/**
	 * Remove staging directory (rollback or cleanup).
	 */
	cleanStaging(): Promise<void>;

	/**
	 * Check if the destination directory is writable.
	 */
	isWritable(): Promise<boolean>;

	/**
	 * Check if the destination directory is empty.
	 */
	isEmpty(): Promise<boolean>;

	/**
	 * Write the .codice-version file to destination root.
	 */
	writeVersionFile(versionData: string): Promise<void>;

	/**
	 * Read the .codice-version file from destination root.
	 */
	readVersionFile(): Promise<string | null>;
}
