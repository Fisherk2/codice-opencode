/**
 * Narrow an unknown thrown value to a Node error carrying a `code` property.
 *
 * Lives alongside the other domain error types (Result, MergeError, etc.)
 * because it is a pure, dependency-free type guard shared by every
 * infrastructure adapter that inspects fs/network failures — placing it
 * in an adapter would force adapters to import from a sibling adapter.
 *
 * Node's fs/network errors are always `Error` instances with a string `code`
 * (e.g. "ENOENT", "EACCES", "EPERM"). Casting `unknown` to `NodeJS.ErrnoException`
 * without a guard is unsound — this guard makes the narrowing explicit at the
 * call site while keeping the shared idiom DRY across adapters.
 */
export function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && "code" in error;
}
