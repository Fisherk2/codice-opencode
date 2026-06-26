/**
 * Error codes for gitignore creation operations.
 */
export type GitignoreErrorCode =
	| "READ_FAILED"
	| "WRITE_FAILED"
	| "TEMPLATE_NOT_FOUND"
	| "PATH_ESCAPE";

/**
 * Structured error type for gitignore generation operations.
 * Provides context about which operation failed and why.
 */
export interface GitignoreError {
	/** The destination path where .gitignore was being created */
	readonly destPath: string;
	/** Human-readable error message */
	readonly message: string;
	/** Error code for programmatic handling */
	readonly code: GitignoreErrorCode;
	/** System error code (e.g., EACCES, EISDIR) if applicable */
	readonly syscall?: string;
}

/**
 * Create a GitignoreError for a read failure (template file read error).
 */
export function gitignoreReadError(destPath: string, message: string): GitignoreError {
	return { destPath, message, code: "READ_FAILED" };
}

/**
 * Create a GitignoreError for a write failure (.gitignore file write error).
 */
export function gitignoreWriteError(destPath: string, message: string): GitignoreError {
	return { destPath, message, code: "WRITE_FAILED" };
}

/**
 * Create a GitignoreError when the template gitignore file is not found.
 */
export function gitignoreTemplateNotFoundError(destPath: string): GitignoreError {
	return {
		destPath,
		message: `Template gitignore file not found. Ensure template/estandar/gitignore exists.`,
		code: "TEMPLATE_NOT_FOUND",
	};
}

/**
 * Create a GitignoreError when the resolved path escapes the workspace root.
 */
export function gitignorePathEscapeError(destPath: string, resolvedPath: string): GitignoreError {
	return {
		destPath,
		message: `Resolved path escapes workspace root: ${resolvedPath}`,
		code: "PATH_ESCAPE",
	};
}
