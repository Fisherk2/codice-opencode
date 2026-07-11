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
