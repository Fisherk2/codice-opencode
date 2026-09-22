import { valid } from "semver";
import { FILE_RULE_MANIFEST, filterByPacks } from "../../domain/entities/FileRuleManifest";
import type { WorkspaceVersion } from "../../domain/entities/WorkspaceVersion";
import type { IFileMergeEngine } from "../../domain/ports/IFileMergeEngine";
import type { IFileSystem } from "../../domain/ports/IFileSystem";
import type { IStagingSystem } from "../../domain/ports/IStagingSystem";
import type { IVersionComparator } from "../../domain/ports/IVersionComparator";
import { failure, type Result, success } from "../../domain/types/Result";
import { checkWritable, createProgressCallback, wrapMergeError } from "../helpers";
import { isLegacyVersion } from "../legacyBanner";
import type { IGitHubClient } from "../ports/IGitHubClient";
import type { IUserPrompt } from "../ports/IUserPrompt";
import { parseVersionData } from "../versionData";
import {
	buildNoPreviousInstallWarning,
	buildUpdateSystemChangedWarning,
} from "../versionGateMessages";
import { isPreV2Version, resolveUpdatePacks } from "./updateFlow";
import { buildPluginRemnantMessage, finishUpdate, maybeConfirmUpdate } from "./updateHelpers";
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
	 * Execute a workspace update: writable check → v2.0 version gate →
	 * confirm → GitHub info → bundled comparison → pack scope → scoped
	 * merge → version file.
	 *
	 * The Opencode Legacy deprecation warning is shown once in the
	 * pre-menu detection banner, so it is not repeated here.
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

		// Pre-2.1.3 installs carry SDD plugin files the updater cannot
		// remove: warn with the exact remnant list. Placed before the
		// confirm prompt so Option A, Option B, and non-interactive
		// updates (all flowing through here) inform the user up front.
		if (isLegacyVersion(localVersion.version)) {
			this.userPrompt.showWarning(buildPluginRemnantMessage());
		}

		// Ask for confirmation if not forced.
		if (
			!(await maybeConfirmUpdate(
				this.fileSystem,
				this.userPrompt,
				localVersion,
				destinationPath,
				options,
			))
		) {
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

		const versionResult = this.resolveNewVersion(options);
		if (!versionResult.ok) {
			return failure(versionResult.error);
		}
		const finishResult = await finishUpdate(
			this.fileSystem,
			this.userPrompt,
			versionResult.value,
			finalPacks,
		);
		return finishResult;
	}

	/** Read .codice-version and enforce the v2.0+ gate; null means "abort gracefully". */
	private async readInstalledVersion(): Promise<WorkspaceVersion | null> {
		const localVersion = parseVersionData(await this.fileSystem.readVersionFile());
		if (!localVersion) {
			await this.userPrompt.showWarning(buildNoPreviousInstallWarning());
			return null;
		}
		if (isPreV2Version(localVersion)) {
			await this.userPrompt.showWarning(buildUpdateSystemChangedWarning(localVersion.version));
			return null;
		}
		return localVersion;
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
	 * Version to write: explicit flag > bundled template.
	 * Returns Failure if neither source is valid semver — the caller
	 * must not proceed with an invalid version (bug #79: "0.0.0" broke
	 * Update detection; a missing/invalid version should fail loudly).
	 */
	private resolveNewVersion(options: UpdateWorkspaceOptions | undefined): Result<string, Error> {
		const resolved = options?.version ?? this.bundledVersion;
		if (valid(resolved)) {
			return success(resolved);
		}
		return failure(
			new Error(
				`Cannot resolve version: neither explicit flag ("${options?.version ?? "undefined"}") ` +
					`nor bundled template ("${this.bundledVersion}") is valid semver.`,
			),
		);
	}
}
