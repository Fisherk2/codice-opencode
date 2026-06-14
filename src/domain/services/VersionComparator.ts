import { compare as semverCompare, diff as semverDiff, valid as semverValid } from "semver";
import { failure, type Result, success } from "../types/Result";

/**
 * Result of comparing two semantic versions.
 * - "newer": Local is older, remote is newer (update available).
 * - "older": Local is newer than remote (downgrade scenario).
 * - "equal": Both versions are identical.
 * - "incompatible": Version strings could not be parsed.
 */
export type ComparisonResult = "newer" | "older" | "equal" | "incompatible";

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
	 * Validate both version strings and return normalized valid forms.
	 * Returns Failure with actionable message if either is invalid.
	 */
	private validateVersions(
		local: string,
		remote: string,
	): { localValid: string; remoteValid: string } | { error: Result<never, Error> } {
		const localValid = semverValid(local);
		if (!localValid) {
			return {
				error: failure(
					new Error(
						`Invalid version format: "${local}". Expected a valid semver version (e.g. "1.0.0").`,
					),
				),
			};
		}
		const remoteValid = semverValid(remote);
		if (!remoteValid) {
			return {
				error: failure(
					new Error(
						`Invalid version format: "${remote}". Expected a valid semver version (e.g. "1.0.0").`,
					),
				),
			};
		}
		return { localValid, remoteValid };
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
		if ("error" in validated) return validated.error;

		const result = semverCompare(validated.localValid, validated.remoteValid);
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
		if ("error" in validated) return validated.error;

		const diff = semverDiff(validated.localValid, validated.remoteValid);
		if (diff === null) return success("none");

		// Map semver diff to our ReleaseType union
		switch (diff) {
			case "major":
				return success("major");
			case "premajor":
				return success("major");
			case "minor":
				return success("minor");
			case "preminor":
				return success("minor");
			case "patch":
				return success("patch");
			case "prepatch":
				return success("patch");
			default:
				return success("none");
		}
	}
}
