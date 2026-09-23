/**
 * Single source for the warning copy shared by the version gate
 * (UpdateWorkspaceUseCase.readInstalledVersion) and the version-info
 * header (buildVersionInfoMessages). Centralized so a wording change
 * only touches one layer; callers must not alter this copy — it is
 * pinned by update-workspace and version-info tests.
 */

/** First sentence of the "nothing installed" guidance. */
export const NO_INSTALLATION_FOUND = "No previous Códice installation found.";

/** Where the user is sent instead of the update flow. */
export const UPDATE_NOT_AVAILABLE =
	"Update is not available — use Clean Install or Project Install.";

/** Reinstall guidance after the v2.0.0 update-system rework. */
export const UPDATE_SYSTEM_CHANGED =
	"The update system has changed in v2.0.0. Please reinstall using Clean Install or Project Install to adopt the new pack system.";

/**
 * Warning emitted when `.codice-version` is missing/unparseable during a
 * proposed update. A detected sentence + the not-available advice, joined
 * by a space because the warning prompt renders a single line.
 */
export function buildNoPreviousInstallWarning(): string {
	return `${NO_INSTALLATION_FOUND} ${UPDATE_NOT_AVAILABLE}`;
}

/**
 * Warning emitted when an update finds a pre-2.0.0 installation. The
 * detected sentence names the concrete version found on disk.
 */
export function buildUpdateSystemChangedWarning(version: string): string {
	return `Detected v${version} installation. ${UPDATE_SYSTEM_CHANGED}`;
}
