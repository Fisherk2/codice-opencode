/**
 * Structured error type for symlink creation operations.
 * Provides context about which symlink creation failed and why.
 */
export interface SymlinkError {
	/** The target path the symlink was supposed to point to */
	readonly target: string;
	/** The link path that was being created */
	readonly linkPath: string;
	/** Human-readable error message */
	readonly message: string;
	/** System error code (e.g., EACCES, EEXIST) if applicable */
	readonly code?: string;
}

/**
 * Create a SymlinkError with context about the failed operation.
 */
export function symlinkError(
	target: string,
	linkPath: string,
	message: string,
	code?: string,
): SymlinkError {
	return { target, linkPath, message, code };
}
