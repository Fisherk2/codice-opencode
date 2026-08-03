import { compare, valid } from "semver";
import type { IVersionComparator } from "../ports/IVersionComparator";
import { failure, type Result, success } from "../types/Result";
import type { ComparisonResult } from "../types/version";

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

/**
 * Compares semantic versions for the Update mode workflow.
 * All methods are pure — no I/O, no side effects.
 *
 * Uses the `semver` library for parsing and comparison.
 */
export class VersionComparator implements IVersionComparator {
	/**
	 * Explicit empty constructor.
	 * Present to avoid Bun's coverage tool counting an implicit constructor
	 * as an uncovered function. (REF: TECH_DEBT.md TD-1.2)
	 */
	// biome-ignore lint/complexity/noUselessConstructor: Needed to fix Bun coverage artifact (REF: TECH_DEBT.md TD-1.2)
	constructor() {}
	/**
	 * Compare a local version against a remote version.
	 *
	 * @param local - Installed version string (e.g. "1.0.0")
	 * @param remote - Latest remote version string (e.g. "1.1.0")
	 * @returns Result with ComparisonResult or an Error if either version
	 *          string is not a valid semver format.
	 *
	 * Comparison semantics (from local's perspective):
	 * - "newer"  → remote > local  (update available)
	 * - "older"  → remote < local  (local is ahead)
	 * - "equal"  → remote === local
	 * - Failure  → invalid version format
	 */
	compare(local: string, remote: string): Result<ComparisonResult, Error> {
		const validated = validateVersions(local, remote);
		if (!validated.ok) return validated;

		const result = compare(validated.value.localValid, validated.value.remoteValid);
		if (result < 0) return success("newer");
		if (result > 0) return success("older");
		return success("equal");
	}
}
