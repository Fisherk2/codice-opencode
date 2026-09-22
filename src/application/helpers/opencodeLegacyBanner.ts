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
 */

import type { IFileSystem } from "../../domain/ports/IFileSystem";
import { VersionComparator } from "../../domain/services/VersionComparator";
import type { IUserPrompt } from "../ports/IUserPrompt";
import { parseVersionData } from "../use-cases/updateFlow";

/** Last Códice version shipped on the retired Opencode Legacy runtime. */
const LEGACY_MAX_VERSION = "2.1.2";

const LEGACY_BANNER_MESSAGE =
	"⚠ Opencode Legacy only — upgrade to ≥ 2.1.4 for native Opencode V2 support";

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

		// compare() reports from the remote's perspective: with the threshold as
		// "remote", "ahead" (threshold > installed) and "equal" both mean the
		// install sits on the legacy line and deserves the warning.
		const comparison = new VersionComparator().compare(installed.version, LEGACY_MAX_VERSION);
		if (!comparison.ok) return;
		if (comparison.value === "ahead" || comparison.value === "equal") {
			userPrompt.showWarning(LEGACY_BANNER_MESSAGE);
		}
	} catch {
		// Advisory only: a broken loader must never interrupt the caller's flow.
	}
}
