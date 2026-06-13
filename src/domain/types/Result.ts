/**
 * Result monad for explicit error handling.
 * Domain services return Result<T, Error> instead of throwing exceptions.
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

export interface Success<T> {
	readonly ok: true;
	readonly value: T;
}

export interface Failure<E> {
	readonly ok: false;
	readonly error: E;
}

/** Create a success result. */
export function success<T>(value: T): Success<T> {
	return { ok: true, value };
}

/** Create a failure result. */
export function failure<E>(error: E): Failure<E> {
	return { ok: false, error };
}
