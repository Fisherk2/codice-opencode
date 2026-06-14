/**
 * Structured error type for merge operations.
 * Provides context about which phase failed and for which path.
 */
export interface MergeError {
	/** The phase in which the error occurred */
	readonly phase: "staging" | "commit" | "validation";
	/** The path being processed when the error occurred (if applicable) */
	readonly path?: string;
	/** Human-readable error message */
	readonly message: string;
}

/**
 * Create a MergeError for a staging phase failure.
 */
export function stagingError(path: string, message: string): MergeError {
	return { phase: "staging", path, message };
}

/**
 * Create a MergeError for a commit phase failure.
 */
export function commitError(message: string): MergeError {
	return { phase: "commit", message };
}

/**
 * Create a MergeError for a validation phase failure.
 */
export function validationError(path: string, message: string): MergeError {
	return { phase: "validation", path, message };
}
