/**
 * GitHub API client for checking the latest release version.
 * Uses only unauthenticated requests (60 req/hr limit).
 */
export interface IGitHubClient {
	/**
	 * Fetch the latest release tag from the repository.
	 * @returns The tag name (e.g. "v1.0.0") or null on failure.
	 * @throws If the network is unreachable or timeout exceeded.
	 */
	getLatestReleaseTag(): Promise<string | null>;

	/**
	 * Fetch the release notes/changelog for the latest version.
	 * @returns Release body text or null if unavailable.
	 */
	getLatestReleaseNotes(): Promise<string | null>;
}
