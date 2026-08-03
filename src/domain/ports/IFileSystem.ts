/**
 * Abstract filesystem operations for the installer.
 *
 * Covers template reads, destination queries, and version file management.
 * Staging operations (stageFile, commitStaging, cleanStaging) are defined
 * in IStagingSystem per the Interface Segregation Principle.
 *
 * All file I/O goes through this port to isolate
 * domain/application logic from the underlying runtime.
 */
export interface IFileSystem {
	/**
	 * Check if a path exists in the destination.
	 */
	destinationExists(relativePath: string): Promise<boolean>;

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

	/**
	 * Walk a directory relative to the template root and return
	 * relative paths of all files within it, sorted.
	 *
	 * @param relativePath - Path relative to the template root
	 *   (e.g. "docs" walks template/estandar/docs on disk).
	 * @returns Sorted array of file paths relative to the given directory.
	 */
	walkTemplateDirectory(relativePath: string): Promise<readonly string[]>;

	/**
	 * Walk a directory relative to the destination root and return
	 * relative paths of all files within it, sorted.
	 *
	 * @param relativePath - Path relative to the destination root
	 *   (e.g. "docs" walks <dest>/docs on disk).
	 * @returns Sorted array of file paths relative to the given directory.
	 */
	walkDestinationDirectory(relativePath: string): Promise<readonly string[]>;
}
