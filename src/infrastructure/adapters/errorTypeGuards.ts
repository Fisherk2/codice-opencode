/**
 * Narrow an unknown thrown value to a Node error carrying a `code` property.
 *
 * Node's fs/network errors are always `Error` instances with a string `code`
 * (e.g. "ENOENT", "EACCES", "EPERM"). Casting `unknown` to `NodeJS.ErrnoException`
 * without a guard is unsound — this guard makes the narrowing explicit at the
 * call site while keeping the shared idiom DRY across adapters.
 */
export function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}
