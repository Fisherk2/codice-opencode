import semver from "semver";
import type { IGitHubClient } from "../../application/ports/IGitHubClient";
import { GITHUB_API_LATEST_RELEASE, GITHUB_API_TIMEOUT_MS } from "../config/constants";

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
		this.apiUrl = apiUrl ?? GITHUB_API_LATEST_RELEASE;
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
					"User-Agent": "codice-installer/1.0.0",
				},
			});

			// Handle HTTP errors gracefully
			if (!response.ok) {
				if (response.status === 404) {
					// No release found — this is not an error for the user
					return null;
				}
				if (response.status === 403) {
					// Rate limited — too many requests
					// In verbose mode, log this for debugging
					return null;
				}
				// Other HTTP errors
				return null;
			}

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
		} catch (error) {
			// Handle abort/timeout
			if (error instanceof DOMException && error.name === "AbortError") {
				return null;
			}
			// Network errors (DNS failure, connection refused, etc.)
			return null;
		} finally {
			clearTimeout(timeoutId);
		}
	}
}
