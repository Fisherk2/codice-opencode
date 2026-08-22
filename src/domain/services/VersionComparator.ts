import { compare, valid } from "semver";
import type { IVersionComparator } from "../ports/IVersionComparator";
import { failure, type Result, success } from "../types/Result";
import type { RemoteVersionStatus } from "../types/version";

/**
 * Validate a single version string and return its normalized form.
 * Returns Failure with an actionable message if the format is invalid.
 */
export function validateVersion(version: string): Result<string, Error> {
	const validVersion = valid(version);
	if (!validVersion) {
		return failure(
			new Error(
				`Invalid version format: "${version}". Expected a valid semver version (e.g. "1.0.0").`,
			),
		);
	}
	return success(validVersion);
}

/**
 * Validate both version strings and return normalized valid forms.
 * Returns Failure with actionable message if either is invalid.
 */
export function validateVersions(
	local: string,
	remote: string,
): Result<{ localValid: string; remoteValid: string }, Error> {
	const localResult = validateVersion(local);
	if (!localResult.ok) return localResult;
	const remoteResult = validateVersion(remote);
	if (!remoteResult.ok) return remoteResult;
	return success({ localValid: localResult.value, remoteValid: remoteResult.value });
}

/** Service for the Update mode workflow — memoized; no I/O. */
export class VersionComparator implements IVersionComparator {
	/** Caches normalized semver strings to avoid repeated valid() normalization. */
	private readonly parsedCache = new Map<string, string>();

	/**
	 * Explicit constructor for dependency injection (testability).
	 * Without arguments, uses the default semver-based validation.
	 * (REF: TECH_DEBT.md TD-1.2 — also avoids Bun coverage artifact.)
	 */
	constructor(
		private readonly validateFn: (v: string) => Result<string, Error> = validateVersion,
	) {}

	/**
	 * Compare a local version against a remote version.
	 *
	 * @param local - Installed version string (e.g. "1.0.0")
	 * @param remote - Latest remote version string (e.g. "1.1.0")
	 * @returns Result with RemoteVersionStatus (from the remote's perspective)
	 *          or an Error if either version string is not a valid semver format.
	 *
	 * Comparison semantics (from the remote's perspective):
	 * - "ahead"  → remote > local  (update available)
	 * - "behind" → remote < local  (local is ahead)
	 * - "equal"  → remote === local
	 * - Failure  → invalid version format
	 */
	compare(local: string, remote: string): Result<RemoteVersionStatus, Error> {
		let localValid = this.parsedCache.get(local);
		let remoteValid = this.parsedCache.get(remote);

		if (localValid === undefined || remoteValid === undefined) {
			const localResult = this.validateFn(local);
			if (!localResult.ok) return localResult;
			const remoteResult = this.validateFn(remote);
			if (!remoteResult.ok) return remoteResult;
			this.parsedCache.set(local, localResult.value);
			this.parsedCache.set(remote, remoteResult.value);
			localValid = localResult.value;
			remoteValid = remoteResult.value;
		}

		const result = compare(localValid, remoteValid);
		if (result < 0) return success("ahead");
		if (result > 0) return success("behind");
		return success("equal");
	}
}
