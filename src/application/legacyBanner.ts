/**
 * Opencode Legacy upgrade banner (FEV-30 Task 3.1).
 *
 * The V1 plugin was removed from the template, so workspaces installed by the
 * retired Opencode Legacy line (<= 2.1.2) silently lose plugin support. This
 * helper nudges those users toward >= 2.1.4 (native Opencode V2 support).
 *
 * Purely advisory and fail-open: absent, corrupt, or unreadable version files
 * degrade to a silent no-op so the banner can never interrupt an install,
 * update, or menu flow (mirrors detectVersionContext's detection contract).
 *
 * Settling assumption (left out deliberately: local FS + advisory contract):
 * `readVersionFile` is expected to always settle — it reads from the local
 * filesystem, where a hanging read is not a realistic failure mode. A loader
 * that never settles would stall the caller without throwing, which the
 * fail-open try/catch cannot absorb; adding a timeout would pull concurrency
 * machinery into a three-line advisory helper. Accepted by design; revisit
 * if this ever reads from remote I/O.
 */

import type { IFileSystem } from "../domain/ports/IFileSystem";
import { VersionComparator } from "../domain/services/VersionComparator";
import type { Result } from "../domain/types/Result";
import type { RemoteVersionStatus } from "../domain/types/version";
import type { IUserPrompt } from "./ports/IUserPrompt";
import { parseVersionData } from "./versionData";

/** Last Códice version shipped on the retired Opencode Legacy runtime. */
const LEGACY_MAX_VERSION = "2.1.2";

const LEGACY_BANNER_MESSAGE =
	"⚠ Opencode Legacy only — upgrade to ≥ 2.1.4 for native Opencode V2 support";

/**
 * Is the installed version on the retired legacy line (its version at or
 * below the threshold)?
 *
 * compare() reports from the remote's perspective: with the threshold as
 * "remote", "ahead" (threshold > installed) and "equal" both mean the
 * install sits on the legacy line and deserves the warning.
 */
function isOnLegacyLine(comparison: Result<RemoteVersionStatus, Error>): boolean {
	return comparison.ok && (comparison.value === "ahead" || comparison.value === "equal");
}

/**
 * Warn the user when the workspace was installed by Opencode Legacy (<= 2.1.2).
 *
 * Reads `.codice-version` through the existing loader chain
 * (`IFileSystem.readVersionFile` + `parseVersionData`) and compares the
 * installed version against the legacy threshold with the domain's
 * `VersionComparator` — no duplicated read or comparison logic.
 *
 * @param fileSystem - Destination version-file loader; `null`/`undefined`
 *   (loader absent) makes the call a no-op.
 * @param userPrompt - TUI adapter used to display the warning.
 * @returns Resolves always — every failure path is swallowed by design.
 */
export async function maybePrintLegacyBanner(
	fileSystem: Pick<IFileSystem, "readVersionFile"> | null | undefined,
	userPrompt: Pick<IUserPrompt, "showWarning">,
): Promise<void> {
	if (fileSystem === null || fileSystem === undefined) return;

	try {
		const installed = parseVersionData(await fileSystem.readVersionFile());
		if (installed === null) return;

		const comparison = new VersionComparator().compare(installed.version, LEGACY_MAX_VERSION);
		if (isOnLegacyLine(comparison)) {
			userPrompt.showWarning(LEGACY_BANNER_MESSAGE);
		}
	} catch {
		// Advisory only: a broken loader must never interrupt the caller's flow.
	}
}
