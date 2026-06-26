/**
 * Error codes for gitignore creation operations.
 */
export type GitignoreErrorCode = "READ_FAILED" | "WRITE_FAILED" | "TEMPLATE_NOT_FOUND";

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
 *
 * @param destPath - Destination path where .gitignore was being created.
 * @param templatePath - Optional template path for diagnostic context.
 */
export function gitignoreTemplateNotFoundError(
	destPath: string,
	templatePath?: string,
): GitignoreError {
	const pathHint = templatePath
		? ` at: ${templatePath}`
		: `. Ensure the template directory contains 'gitignore' (no dot prefix).`;
	return {
		destPath,
		message: `Template gitignore file not found${pathHint}`,
		code: "TEMPLATE_NOT_FOUND",
	};
}
