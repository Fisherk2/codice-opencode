import { valid } from "semver";
import { FILE_RULE_MANIFEST, filterByPacks } from "../../domain/entities/FileRuleManifest";
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
	 * Execute a workspace update.
	 *
	 * Flow: writable check → version gate (v2.0+ only) → confirm (unless
	 * forced) → GitHub info check → bundled comparison → pack scope
	 * (Option A / Option B / addPacks) → scoped merge → write v2.0 version file.
	 *
	 * @param destinationPath - Target directory for the update.
	 * @param options - Optional flags.
	 * @returns Result indicating success or a structured error.
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
		const localVersion = parseVersionData(await this.fileSystem.readVersionFile());
		if (!localVersion) {
			await this.userPrompt.showWarning(
				"No previous Códice installation found. Update is not available — use Clean Install or Project Install.",
			);
			return success(undefined);
		}
		if (isPreV2Version(localVersion)) {
			await this.userPrompt.showWarning(
				`Detected v${localVersion.version} installation. The update system has changed in v2.0.0. Please reinstall using Clean Install or Project Install to adopt the new pack system.`,
			);
			return success(undefined);
		}

		// Ask for confirmation if not forced. Defaults to Yes so unattended
		// sessions can accept the update with a single keystroke (plan Phase 4).
		if (!options?.force) {
			const confirmed = await confirmOverwrite(
				this.fileSystem,
				this.userPrompt,
				`Update workspace in "${destinationPath}"? Packs: ${localVersion.installedPacks.join(", ") || "(none)"}. Continue?`,
				"Update cancelled by user.",
				undefined,
				true,
			);
			if (!confirmed) return success(undefined);
		}

		// Check GitHub for latest version (informational only)
		const remoteTag = await this.gitHubClient.getLatestReleaseTag();
		if (remoteTag) {
			const remoteVersion = remoteTag.startsWith("v") ? remoteTag.slice(1) : remoteTag;
			const remoteComparison = this.versionComparator.compare(localVersion.version, remoteVersion);
			if (remoteComparison.ok && remoteComparison.value === "ahead") {
				await this.userPrompt.showInfo(
					`A newer version (v${remoteVersion}) is available on GitHub. The bundled template (v${this.bundledVersion}) will be used for this update.`,
				);
			}
		} else {
			await this.userPrompt.showWarning(
				"Could not check for updates via GitHub. Falling back to the bundled template version.",
			);
		}

		// Compare installed version against bundled template version.
		// VersionComparator reports "ahead" when bundled > local (update
		// available). isUpToDate requires the comparison to SUCCEED — a failed
		// comparison (invalid bundled semver) must fall through so
		// resolveNewVersion can write the "0.0.0" fallback.
		const bundledComparison = this.versionComparator.compare(
			localVersion.version,
			this.bundledVersion,
		);
		const isUpToDate = bundledComparison.ok && bundledComparison.value !== "ahead";
		if (isUpToDate) {
			await this.userPrompt.showInfo(
				`Workspace is already up to date at version ${localVersion.version}. No update needed.`,
			);
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

		// Update skips opcional entirely (spec §6.1): optionalSelections resets.
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

	/**
	 * Resolve the version string to write to .codice-version.
	 * Priority: explicit flag > bundled template > fallback to "0.0.0".
	 *
	 * The fallback IS reachable: when the bundled template version is not
	 * valid semver (e.g. a malformed package.json), valid() returns null and
	 * "0.0.0" is written instead of crashing or corrupting the version file.
	 * This is a runtime-safety net, not a type-level guarantee.
	 */
	private resolveNewVersion(options: UpdateWorkspaceOptions | undefined): string {
		const resolved = options?.version ?? this.bundledVersion;
		return valid(resolved) ? resolved : "0.0.0";
	}
}
