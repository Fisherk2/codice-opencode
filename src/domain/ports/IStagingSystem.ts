/**
 * Abstract staging operations for atomic file writes.
 *
 * Files are first written to a staging directory, then atomically renamed
 * to their destination paths. This ensures that an interrupted operation
 * never leaves the destination in an inconsistent state.
 *
 * Separated from IFileSystem per the Interface Segregation Principle:
 * staging concerns (stageFile, commitStaging, cleanStaging)
 * form a cohesive, independently testable unit.
 *
 * Consumers that only perform staging operations (no template reads or
 * destination queries) should depend on IStagingSystem alone.
 */
export interface IStagingSystem {
	/**
	 * Stage a file or directory by resolving the template path and writing
	 * to the staging directory. If the path resolves to a directory and
	 * excludeSubDirs is provided, subdirectories matching names in the set
	 * are excluded from staging (e.g. node_modules/ when staging a project).
	 *
	 * @param relativePath - Path relative to template root (source).
	 * @param destPath - Optional destination path override; defaults to relativePath.
	 * @param excludeSubDirs - Optional set of subdirectory names to exclude.
	 */
	stageFile(relativePath: string, destPath?: string, excludeSubDirs?: Set<string>): Promise<void>;

	/**
	 * Atomic rename: promote all staged files to the destination.
	 * Before each rename, the original destination file (if it exists) is
	 * backed up. On failure, all backed-up files are restored to guarantee
	 * project consistency.
	 */
	commitStaging(): Promise<void>;

	/**
	 * Remove the staging directory recursively (rollback or cleanup).
	 */
	cleanStaging(): Promise<void>;
}
