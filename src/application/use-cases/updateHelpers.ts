/**
 * Helper functions extracted from UpdateWorkspaceUseCase to keep
 * individual modules under the 200-line convention.
 *
 * These are pure coordination helpers — no domain logic.
 *
 * @module
 */

import type { WorkspaceVersion } from "../../domain/entities/WorkspaceVersion";
import type { IFileSystem } from "../../domain/ports/IFileSystem";
import type { IStagingSystem } from "../../domain/ports/IStagingSystem";
import type { Result } from "../../domain/types/Result";
import { confirmOverwrite, writeVersionFileSafe } from "../helpers";
import type { IUserPrompt } from "../ports/IUserPrompt";
import type { UpdateWorkspaceOptions } from "./UpdateWorkspaceUseCase";

/**
 * Destination-relative paths of the SDD plugin shipped by installers
 * <= 2.1.2 (tag v2.1.2: template/obligatorio/core/.opencode/plugins/*,
 * spread to the destination root by the "core" source grouping). v2.1.3
 * removed the plugin from the template, so these files survive an update
 * as unmanaged remnants.
 */
const LEGACY_PLUGIN_REMNANT_FILES: readonly string[] = [
	".opencode/plugins/sdd-pipeline.ts",
	".opencode/plugins/src/destructivePatterns.ts",
	".opencode/plugins/src/normalizeBash.ts",
	".opencode/plugins/README.md",
	".opencode/plugins/tsconfig.json",
];

/**
 * Build the advisory shown when updating from a pre-2.1.3 install whose
 * SDD plugin files survive the update as unmanaged remnants.
 */
export function buildPluginRemnantMessage(): string {
	return [
		"Legacy plugin remnant: v2.1.3 removed the SDD plugin, but these files from your previous install remain and must be deleted manually:",
		...LEGACY_PLUGIN_REMNANT_FILES,
		"(plus .opencode/plugins/sdd-workflow-test.md if you installed it as an optional file)",
		"Do NOT delete the plugins/ directory itself — it may contain third-party plugins.",
	].join("\n");
}

/**
 * Ask the user for confirmation when the update is not forced.
 * Defaults to Yes so unattended sessions can accept the update
 * with a single keystroke (plan Phase 4).
 */
export async function maybeConfirmUpdate(
	fileSystem: IFileSystem & IStagingSystem,
	userPrompt: IUserPrompt,
	localVersion: WorkspaceVersion,
	destinationPath: string,
	options?: UpdateWorkspaceOptions,
): Promise<boolean> {
	if (!options?.force) {
		const confirmed = await confirmOverwrite(
			fileSystem,
			userPrompt,
			`Update workspace in "${destinationPath}"? Packs: ${localVersion.installedPacks.join(", ") || "(none)"}. Continue?`,
			"Update cancelled by user.",
			undefined,
			true,
		);
		if (!confirmed) return false;
	}
	return true;
}

/**
 * Write the version file and show success message after a successful update.
 * Updates the .codice-version with the new version and installed packs,
 * then skips optional files (optionalSelections resets per spec §6.1).
 */
export async function finishUpdate(
	fileSystem: IFileSystem & IStagingSystem,
	userPrompt: IUserPrompt,
	safeVersion: string,
	finalPacks: readonly string[],
): Promise<Result<void, Error>> {
	const versionResult = await writeVersionFileSafe(
		fileSystem,
		{
			version: safeVersion,
			installedPacks: [...finalPacks],
			installedAt: new Date().toISOString(),
			optionalSelections: [],
		},
		"Update",
	);

	if (versionResult.ok) {
		userPrompt.showSuccess(`Workspace updated to v${safeVersion}. Packs: ${finalPacks.join(", ")}`);
	}
	return versionResult;
}
