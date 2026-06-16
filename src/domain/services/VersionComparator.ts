import { compare, diff as semverDiff, valid } from "semver";
import { failure, type Result, success } from "../types/Result";
import type { ComparisonResult } from "../types/version";

// Module-level map: semver diff strings → ReleaseType (pre* variants map to base type)
const RELEASE_TYPE_MAP: Partial<
	Record<
		"major" | "premajor" | "minor" | "preminor" | "patch" | "prepatch" | "prerelease" | "release",
		ReleaseType
	>
> = {
	major: "major",
	premajor: "major",
	minor: "minor",
	preminor: "minor",
	patch: "patch",
	prepatch: "patch",
};

/**
 * Release type determined from a version diff.
 */
export type ReleaseType = "major" | "minor" | "patch" | "none";

/**
 * Compares semantic versions for the Update mode workflow.
 * All methods are pure — no I/O, no side effects.
 *
 * Uses the `semver` library for parsing and comparison.
 */
export class VersionComparator {
	/**
	 * Validate a single version string and return its normalized form.
	 * Returns Failure with an actionable message if the format is invalid.
	 */
	private validateSingleVersion(version: string): Result<string, Error> {
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
	private validateVersions(
		local: string,
		remote: string,
	): Result<{ localValid: string; remoteValid: string }, Error> {
		const localResult = this.validateSingleVersion(local);
		if (!localResult.ok) return localResult;
		const remoteResult = this.validateSingleVersion(remote);
		if (!remoteResult.ok) return remoteResult;
		return success({ localValid: localResult.value, remoteValid: remoteResult.value });
	}

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
		const validated = this.validateVersions(local, remote);
		if (!validated.ok) return validated;

		const result = compare(validated.value.localValid, validated.value.remoteValid);
		if (result < 0) return success("newer");
		if (result > 0) return success("older");
		return success("equal");
	}

	/**
	 * Convenience method to check if an update is available.
	 * Returns false if either version is invalid (fail-safe default).
	 */
	isUpdateAvailable(local: string, remote: string): boolean {
		const result = this.compare(local, remote);
		return result.ok && result.value === "newer";
	}

	/**
	 * Determine the release type (major/minor/patch/none) between two versions.
	 *
	 * @param local - Installed version string
	 * @param remote - Target version string
	 * @returns The type of version bump, or Failure if versions are invalid.
	 */
	getReleaseType(local: string, remote: string): Result<ReleaseType, Error> {
		const validated = this.validateVersions(local, remote);
		if (!validated.ok) return validated;

		const diff = semverDiff(validated.value.localValid, validated.value.remoteValid);
		if (diff === null) return success("none");

		return success(RELEASE_TYPE_MAP[diff] ?? "none");
	}
}
