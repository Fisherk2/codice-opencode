/**
 * Narrow an unknown thrown value to an error carrying a string `code` property.
 *
 * Lives alongside the other domain error types (Result, MergeError, etc.)
 * because it is a pure, dependency-free type guard shared by every
 * infrastructure adapter that inspects fs/network failures — placing it
 * in an adapter would force adapters to import from a sibling adapter.
 *
 * `ErrnoLike` intentionally models only the `code` property consumed by
 * adapters (e.g. "ENOENT", "EACCES", "EPERM") instead of referencing
 * `NodeJS.ErrnoException` — the domain layer must stay free of Node platform
 * types. Casting `unknown` to an error type without a guard is unsound;
 * this guard makes the narrowing explicit at the call site while keeping
 * the shared idiom DRY across adapters.
 */

/**
 * Minimal shape of a platform error carrying an error-code string.
 * Models only the `code` and `message` properties consumed by adapters —
 * enough for error matching and user-facing messages without coupling
 * the domain to Node's platform types.
 */
export interface ErrnoLike {
	readonly code?: string;
	readonly message: string;
}

/** Narrow an unknown thrown value to an error carrying a `code` property. */
export function isErrnoException(error: unknown): error is ErrnoLike {
	return error instanceof Error && "code" in error;
}
