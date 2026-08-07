import type { Result } from "../types/Result";
import type { RemoteVersionStatus } from "../types/version";

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
	 * @returns Result with RemoteVersionStatus (from the remote's perspective,
	 *          e.g. "ahead" when remote > local, meaning an update is available)
	 *          or an Error if either version string is not a valid semver format.
	 */
	compare(local: string, remote: string): Result<RemoteVersionStatus, Error>;
}
