/**
 * Local installation detection for the TUI header (FEV-21 Phase 5).
 *
 * Reads .codice-version and derives a VersionDisplayInfo shown above the mode
 * menu. Extracted from main.ts to respect the 200-line file size limit —
 * output.ts, parse-args.ts, and version.ts follow the same pattern.
 */

import type { VersionDisplayInfo } from "../application/ports/IUserPrompt";
import { WorkspaceVersion } from "../domain/entities/WorkspaceVersion";
import type { IFileSystem } from "../domain/ports/IFileSystem";
import { stripVPrefix } from "../domain/types/version";

/**
 * Classify a version's status for the TUI header.
 * v2.x → "v2.0+", v1.2+ → "pre-2.0.0", anything older → "pre-1.2.0".
 */
function classifyStatus(major: number, minor: number): VersionDisplayInfo["status"] {
	if (major >= 2) return "v2.0+";
	if (major === 1 && minor >= 2) return "pre-2.0.0";
	return "pre-1.2.0";
}

/**
 * Detect the local installation state for the TUI header.
 *
 * Derives the status from the major/minor version. Malformed or missing
 * files degrade to "missing" — detection is fail-open and never crashes the
 * CLI (worst case the header shows "No Installation Detected").
 *
 * @param fileSystem - Adapter exposing readVersionFile().
 * @returns Version display info for the TUI header.
 */
export async function detectVersionContext(fileSystem: IFileSystem): Promise<VersionDisplayInfo> {
	try {
		const data = await fileSystem.readVersionFile();
		if (data === null) return { version: null, installedPacks: [], status: "missing" };
		const version = WorkspaceVersion.fromJSON(JSON.parse(data));
		const { version: rawVersion, installedPacks } = version;
		const [majorStr, minorStr] = stripVPrefix(rawVersion).split(".");
		const major = parseInt(majorStr ?? "0", 10);
		const minor = parseInt(minorStr ?? "0", 10);
		return { version: rawVersion, installedPacks, status: classifyStatus(major, minor) };
	} catch {
		return { version: null, installedPacks: [], status: "missing" };
	}
}
