import { valid } from "semver";
import { FILE_RULE_MANIFEST, filterByPacks } from "../../domain/entities/FileRuleManifest";
import type { WorkspaceVersion } from "../../domain/entities/WorkspaceVersion";
import type { IFileMergeEngine } from "../../domain/ports/IFileMergeEngine";
import type { IFileSystem } from "../../domain/ports/IFileSystem";
import type { IStagingSystem } from "../../domain/ports/IStagingSystem";
import type { IVersionComparator } from "../../domain/ports/IVersionComparator";
import { failure, type Result, success } from "../../domain/types/Result";
import {
	checkWritable,
	confirmOverwrite,
	createProgressCallback,
	wrapMergeError,
	writeVersionFileSafe,
} from "../helpers";
import type { IGitHubClient } from "../ports/IGitHubClient";
import type { IUserPrompt } from "../ports/IUserPrompt";
import { isPreV2Version, parseVersionData, resolveUpdatePacks } from "./updateFlow";
import { notifyIfUpToDate, reportRemoteStatus, type UpdateStatusDeps } from "./updateStatusCheck";

/**
 * Options for the update workspace execution.
 */
export interface UpdateWorkspaceOptions {
	/** Skip the confirmation prompt */
	readonly force?: boolean;
	/** Explicit version tag (overrides GitHub version lookup) */
	readonly version?: string;
	/** Packs to add during a non-interactive update (Option B without the menu) */
	readonly addPacks?: readonly string[];
}

/**
 * Mode 3: Update Workspace — update an existing v2.0+ installation.
 *
 * Version-gated: only runs when `.codice-version` parses to a major >= 2
 * (the pack system); missing or pre-v2.0 installs are blocked with a
 * reinstall suggestion. Pack scope: Option A (installed only), Option B
 * (add packs, installed locked), or non-interactive addPacks.
 */
export class UpdateWorkspaceUseCase {
	/**
	 * @param fileSystem - Adapter for filesystem operations (staging, reading version)
	 * @param mergeEngine - Domain service that orchestrates file merging
	 * @param userPrompt - Adapter for interactive user prompts
	 * @param gitHubClient - Adapter for GitHub API version checking
	 * @param versionComparator - Domain service for semantic version comparison
	 * @param bundledVersion - The version of the template bundled in the package
	 */
	constructor(
		private readonly fileSystem: IFileSystem & IStagingSystem,
		private readonly mergeEngine: IFileMergeEngine,
		private readonly userPrompt: IUserPrompt,
		private readonly gitHubClient: IGitHubClient,
		private readonly versionComparator: IVersionComparator,
		private readonly bundledVersion: string,
	) {}

	/**
	 * Execute a workspace update: writable check → v2.0 version gate → confirm
	 * → GitHub info → bundled comparison → pack scope → scoped merge → version file.
	 */
	async execute(
		destinationPath: string,
		options?: UpdateWorkspaceOptions,
	): Promise<Result<void, Error>> {
		// Check writability
		const writableCheck = await checkWritable(this.fileSystem, destinationPath);
		if (!writableCheck.ok) return writableCheck;

		// Version gate (BEFORE any destructive prompt): the update system needs
		// a v2.0+ installation with pack metadata. Missing, corrupt, or pre-v2.0
		// files are all treated as "must reinstall" — never update blindly.
		const localVersion = await this.readInstalledVersion();
		if (localVersion === null) return success(undefined);

		// Ask for confirmation if not forced. Defaults to Yes so unattended
		// sessions can accept the update with a single keystroke (plan Phase 4).
		if (!await this.maybeConfirmUpdate(localVersion, destinationPath, options)) {
			return success(undefined);
		}

		// Informational GitHub check — never blocks the update
		await reportRemoteStatus(this.statusDeps, localVersion);

		// Compare installed version against bundled template version. Returns
		// true when no update is needed (installed >= bundled).
		if (await notifyIfUpToDate(this.statusDeps, localVersion)) {
			return success(undefined);
		}

		// Option A / Option B / non-interactive addPacks → pack scope
		const finalPacks = await resolveUpdatePacks(
			this.userPrompt,
			localVersion.installedPacks,
			options ?? {},
		);
		if (finalPacks === null) return success(undefined);

		// Non-optional rules, scoped to the resolved packs so agents from
		// unselected packs are never merged.
		const updateRules = filterByPacks(
			FILE_RULE_MANIFEST.filter((rule) => rule.category !== "optional"),
			finalPacks,
		);

		// Execute the merge engine with progress
		const onProgress = createProgressCallback(this.userPrompt, "Updating files...");
		const mergeResult = await this.mergeEngine.execute(updateRules, {
			onProgress,
			updateMode: true,
		});
		if (!mergeResult.ok) {
			// progress callback already called completeProgress() on the error event
			return failure(wrapMergeError(mergeResult.error));
		}

		const safeVersion = this.resolveNewVersion(options);
		const versionResult = await this.finishUpdate(safeVersion, finalPacks);
		return versionResult;
	}

	/** Read .codice-version and enforce the v2.0+ gate; null means "abort gracefully". */
	private async readInstalledVersion(): Promise<WorkspaceVersion | null> {
		const localVersion = parseVersionData(await this.fileSystem.readVersionFile());
		if (!localVersion) {
			await this.userPrompt.showWarning(
				"No previous Códice installation found. Update is not available — use Clean Install or Project Install.",
			);
			return null;
		}
		if (isPreV2Version(localVersion)) {
			await this.userPrompt.showWarning(
				`Detected v${localVersion.version} installation. The update system has changed in v2.0.0. Please reinstall using Clean Install or Project Install to adopt the new pack system.`,
			);
			return null;
		}
		return localVersion;
	}

	/**
	 * Ask the user for confirmation when the update is not forced.
	 * Defaults to Yes so unattended sessions can accept the update
	 * with a single keystroke (plan Phase 4).
	 */
	private async maybeConfirmUpdate(
		localVersion: WorkspaceVersion,
		destinationPath: string,
		options?: UpdateWorkspaceOptions,
	): Promise<boolean> {
		if (!options?.force) {
			const confirmed = await confirmOverwrite(
				this.fileSystem,
				this.userPrompt,
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
	private async finishUpdate(
		safeVersion: string,
		finalPacks: readonly string[],
	): Promise<Result<void, Error>> {
		const versionResult = await writeVersionFileSafe(
			this.fileSystem,
			{
				version: safeVersion,
				installedPacks: [...finalPacks],
				installedAt: new Date().toISOString(),
				optionalSelections: [],
			},
			"Update",
		);

		if (versionResult.ok) {
			this.userPrompt.showSuccess(
				`Workspace updated to v${safeVersion}. Packs: ${finalPacks.join(", ")}`,
			);
		}
		return versionResult;
	}

	/** Collaborators for the status checks, derived from the injected deps. */
	private get statusDeps(): UpdateStatusDeps {
		return {
			gitHubClient: this.gitHubClient,
			versionComparator: this.versionComparator,
			userPrompt: this.userPrompt,
			bundledVersion: this.bundledVersion,
		};
	}

	/**
	 * Version to write: explicit flag > bundled template > "0.0.0" fallback.
	 * The fallback IS reachable when the bundled template version is not valid
	 * semver (e.g. a malformed package.json) — a runtime-safety net.
	 */
	private resolveNewVersion(options: UpdateWorkspaceOptions | undefined): string {
		const resolved = options?.version ?? this.bundledVersion;
		return valid(resolved) ? resolved : "0.0.0";
	}
}
