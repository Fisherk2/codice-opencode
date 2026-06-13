import type { IGitHubClient } from "../../application/ports/IGitHubClient";

/**
 * Fetch-based GitHub REST API client for checking latest releases.
 * Uses unauthenticated requests (60 req/hr limit).
 */
export class GitHubRestClient implements IGitHubClient {
  getLatestReleaseTag(): Promise<string | null> {
    throw new Error("Not implemented");
  }

  getLatestReleaseNotes(): Promise<string | null> {
    throw new Error("Not implemented");
  }
}
