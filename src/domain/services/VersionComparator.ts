/**
 * Result of comparing two semantic versions.
 */
export type ComparisonResult = "newer" | "older" | "equal" | "incompatible";

/**
 * Compares semantic versions for the Update mode workflow.
 * Determines whether the remote version is newer, older, equal,
 * or incompatible with the local version.
 */
export class VersionComparator {
  /**
   * Compare a local version against a remote version.
   * @param local - Installed version string (e.g. "1.0.0")
   * @param remote - Latest remote version string (e.g. "1.1.0")
   * @returns The relationship between local and remote.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  compare(_local: string, _remote: string): ComparisonResult {
    // TODO: Implement using semver library
    // Returns "newer" if remote > local
    // Returns "older" if remote < local
    // Returns "equal" if same
    // Returns "incompatible" if versions can't be compared
    return "equal";
  }
}
