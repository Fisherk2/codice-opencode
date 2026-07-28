import semver from "semver";
// Import version for User-Agent header — Bun resolves package.json at runtime, no special setup needed
import { version as pkgVersion } from "../../../package.json";
import type { IGitHubClient } from "../../application/ports/IGitHubClient";
import { GITHUB_API_TIMEOUT_MS, getGitHubApiUrl } from "../config/constants";

/** Maximum allowed response body size (1 MB) to prevent OOM from malicious responses */
const MAX_RESPONSE_BYTES = 1024 * 1024;

/**
 * Fetch-based GitHub REST API client for checking latest releases.
 * Uses unauthenticated requests (60 req/hr limit).
 *
 * All error conditions (network failure, timeout, HTTP errors,
 * malformed JSON) return null instead of throwing, making it safe
 * for the installer to fallback to the local template.
 */
export class GitHubRestClient implements IGitHubClient {
	private readonly apiUrl: string;
	private readonly timeoutMs: number;

	/**
	 * @param apiUrl - GitHub API URL for latest release (default: from constants)
	 * @param timeoutMs - Request timeout in milliseconds (default: from constants)
	 */
	constructor(apiUrl?: string, timeoutMs?: number) {
		this.apiUrl = apiUrl ?? getGitHubApiUrl();
		this.timeoutMs = timeoutMs ?? GITHUB_API_TIMEOUT_MS;
	}

	/**
	 * Fetch the latest release tag from the repository.
	 * @returns The tag name (e.g. "v1.0.0") or null on failure.
	 */
	async getLatestReleaseTag(): Promise<string | null> {
		try {
			const data = await this.fetchLatestRelease();
			if (data === null) {
				return null;
			}
			const tag = data.tag_name;
			if (typeof tag !== "string") {
				return null;
			}
			// Validate tag is a valid semver (including pre-release tags like v1.0.0-beta)
			if (semver.valid(tag) === null) {
				return null;
			}
			return tag;
		} catch {
			// Catch any unexpected errors gracefully
			return null;
		}
	}

	/**
	 * Fetch the release notes/changelog for the latest version.
	 * @returns Release body text or null if unavailable.
	 */
	async getLatestReleaseNotes(): Promise<string | null> {
		try {
			const data = await this.fetchLatestRelease();
			if (data === null) {
				return null;
			}
			const body = data.body;
			return typeof body === "string" ? body : null;
		} catch {
			return null;
		}
	}

	// ---------------------------------------------------------------------------
	// Private helpers
	// ---------------------------------------------------------------------------

	/**
	 * Fetch the latest release JSON from the GitHub API.
	 * Returns null for any error condition (network, timeout, HTTP, parsing).
	 */
	private async fetchLatestRelease(): Promise<Record<string, unknown> | null> {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

		try {
			const response = await fetch(this.apiUrl, {
				signal: controller.signal,
				headers: {
					Accept: "application/vnd.github.v3+json",
					"User-Agent": `codice-installer/${pkgVersion}`,
				},
			});

			// Any HTTP error (404, 403, 5xx, etc.) → null.
			// All error codes are treated identically: the installer falls back
			// to the bundled local template. Distinguishing between 404 (no
			// release), 403 (rate limit), and other codes adds no value here
			// because the fallback behavior is the same in every case.
			if (!response.ok) return null;

			// Check content-length before reading body to prevent OOM
			const contentLength = response.headers.get("content-length");
			if (contentLength && Number.parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
				return null;
			}

			// Parse JSON
			const text = await response.text();

			// Guard against oversized responses where content-length was missing or lying
			if (text.length > MAX_RESPONSE_BYTES) {
				return null;
			}
			try {
				const data = JSON.parse(text);
				if (typeof data === "object" && data !== null) {
					return data as Record<string, unknown>;
				}
				return null;
			} catch {
				// Malformed JSON response
				return null;
			}
		} catch {
			// Covers: AbortError (timeout), DNS failure, connection refused,
			// and any other unexpected error.
			return null;
		} finally {
			clearTimeout(timeoutId);
		}
	}
}
