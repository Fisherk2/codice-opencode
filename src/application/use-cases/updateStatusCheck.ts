/**
 * Version status helpers for the Update Workspace flow (FEV-21 Phase 4).
 *
 * reportRemoteStatus and notifyIfUpToDate were extracted from
 * UpdateWorkspaceUseCase so the class stays under the 200-line file
 * convention — mirrors the updateFlow.ts extraction pattern. Both are
 * informational; neither can block the update.
 */

import type { WorkspaceVersion } from "../../domain/entities/WorkspaceVersion";
import type { IVersionComparator } from "../../domain/ports/IVersionComparator";
import { stripVPrefix } from "../../domain/types/version";
import type { IGitHubClient } from "../ports/IGitHubClient";
import type { IUserPrompt } from "../ports/IUserPrompt";

/** Collaborators shared by the status checks (subset of the use-case deps). */
export interface UpdateStatusDeps {
	readonly gitHubClient: IGitHubClient;
	readonly versionComparator: IVersionComparator;
	readonly userPrompt: IUserPrompt;
	readonly bundledVersion: string;
}

/** Informational GitHub check — never blocks the update. */
export async function reportRemoteStatus(
	deps: UpdateStatusDeps,
	localVersion: WorkspaceVersion,
): Promise<void> {
	const remoteTag = await deps.gitHubClient.getLatestReleaseTag();
	if (!remoteTag) {
		await deps.userPrompt.showWarning(
			"Could not check for updates via GitHub. Falling back to the bundled template version.",
		);
		return;
	}
	const remoteVersion = stripVPrefix(remoteTag);
	const comparison = deps.versionComparator.compare(localVersion.version, remoteVersion);
	if (comparison.ok && comparison.value === "ahead") {
		await deps.userPrompt.showInfo(
			`A newer version (v${remoteVersion}) is available on GitHub. The bundled template (v${deps.bundledVersion}) will be used for this update.`,
		);
	}
}

/** True when installed >= bundled; a failed comparison falls through to "not up to date". */
export async function notifyIfUpToDate(
	deps: UpdateStatusDeps,
	localVersion: WorkspaceVersion,
): Promise<boolean> {
	const bundledComparison = deps.versionComparator.compare(
		localVersion.version,
		deps.bundledVersion,
	);
	const isUpToDate = bundledComparison.ok && bundledComparison.value !== "ahead";
	if (isUpToDate) {
		await deps.userPrompt.showInfo(
			`Workspace is already up to date at version ${localVersion.version}. No update needed.`,
		);
	}
	return isUpToDate;
}
