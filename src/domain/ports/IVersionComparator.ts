import type { Result } from "../types/Result";
import type { ComparisonResult } from "../types/version";

/**
 * Release type determined from a version diff.
 */
export type ReleaseType = "major" | "minor" | "patch" | "none";

/**
 * Interface for semantic version comparison.
 * Use cases depend on this abstraction, not the concrete VersionComparator class,
 * enabling test substitution without hacks (as unknown as casts).
 */
export interface IVersionComparator {
	/**
	 * Compare a local version against a remote version.
	 * @param local - Installed version string (e.g. "1.0.0")
	 * @param remote - Latest remote version string (e.g. "1.1.0")
	 * @returns Result with ComparisonResult or an Error if either version
	 *          string is not a valid semver format.
	 */
	compare(local: string, remote: string): Result<ComparisonResult, Error>;

	/**
	 * Convenience check if an update is available.
	 * Returns false if either version is invalid (fail-safe default).
	 */
	isUpdateAvailable(local: string, remote: string): boolean;

	/**
	 * Determine the release type between two versions.
	 * @param local - Installed version string
	 * @param remote - Target version string
	 * @returns The type of version bump, or Failure if versions are invalid.
	 */
	getReleaseType(local: string, remote: string): Result<ReleaseType, Error>;
}
