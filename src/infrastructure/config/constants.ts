/** GitHub repository owner */
export const GITHUB_OWNER = "fisherk2";

/** GitHub repository name */
export const GITHUB_REPO = "11-codice-opencode";

/** GitHub API URL for latest release */
export const GITHUB_API_LATEST_RELEASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest` as const;

/** Timeout for GitHub API requests (milliseconds) */
export const GITHUB_API_TIMEOUT_MS = 3_000;

/** Name of the staging directory used for atomic writes */
export const STAGING_DIR_NAME = ".codice-staging";

/** Name of the version file written to the destination root */
export const VERSION_FILE_NAME = ".codice-version";

/** Name of the directory containing the template files */
export const TEMPLATE_DIR_NAME = "template";
