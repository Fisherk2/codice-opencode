/** GitHub repository owner */
export const GITHUB_OWNER = "fisherk2";

/** GitHub repository name */
export const GITHUB_REPO = "codice-opencode";

const GITHUB_API_DEFAULT = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

/**
 * Get the GitHub API URL for the latest release.
 *
 * The URL can be overridden via the CODICE_GITHUB_API_URL environment variable
 * for testing and mocking purposes. When overridden, the URL is validated
 * to ensure it is a well-formed HTTPS URL pointing to api.github.com.
 * Non-conforming overrides emit a warning to stderr and fall back to the
 * default URL.
 *
 * @returns The API URL string.
 */
export function getGitHubApiUrl(): string {
	const envUrl = process.env.CODICE_GITHUB_API_URL;
	if (!envUrl) return GITHUB_API_DEFAULT;

	// Allow bypassing URL validation for E2E testing (e.g., http://localhost:4567 mock server)
	if (process.env.CODICE_BYPASS_URL_VALIDATION === "true") {
		return envUrl;
	}

	try {
		const url = new URL(envUrl);
		if (
			url.protocol === "https:" &&
			(url.hostname === "github.com" || url.hostname.endsWith(".github.com"))
		) {
			return envUrl;
		}
	} catch {
		// URL constructor failed — not a valid URL
	}
	// biome-ignore lint/suspicious/noConsole: production warning for invalid env var override
	console.warn(
		`[warn] CODICE_GITHUB_API_URL must be an HTTPS URL pointing to github.com. Got "${envUrl}". Falling back to default.`,
	);
	return GITHUB_API_DEFAULT;
}

/** Timeout for GitHub API requests (milliseconds) */
export const GITHUB_API_TIMEOUT_MS = 3_000;

/** Name of the staging directory used for atomic writes */
export const STAGING_DIR_NAME = ".codice-staging";

/** Name of the version file written to the destination root */
export const VERSION_FILE_NAME = ".codice-version";

/** Name of the directory containing the template files */
export const TEMPLATE_DIR_NAME = "template";
