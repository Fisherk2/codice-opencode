import { valid } from "semver";
import { FILE_RULE_MANIFEST } from "../../domain/entities/FileRuleManifest";
import type { IFileMergeEngine } from "../../domain/ports/IFileMergeEngine";
import type { IFileSystem } from "../../domain/ports/IFileSystem";
import type { IVersionComparator } from "../../domain/ports/IVersionComparator";
import { failure, type Result, success } from "../../domain/types/Result";
import { checkWritable, writeVersionFileSafe } from "../helpers";
import type { IGitHubClient } from "../ports/IGitHubClient";
import type { IUserPrompt } from "../ports/IUserPrompt";

/**
 * Options for the update workspace execution.
 */
export interface UpdateWorkspaceOptions {
	/** Skip the confirmation prompt */
	readonly force?: boolean;
	/** Explicit version tag (overrides GitHub version lookup) */
	readonly version?: string;
}

/**
 * Mode 3: Update Workspace — update an existing installation
 * to the latest template version. Only Obligatorio and Estándar
 * files are updated; Opcional files are preserved.
 */
export class UpdateWorkspaceUseCase {
	/**
	 * @param fileSystem - Adapter for filesystem operations (staging, reading version)
	 * @param mergeEngine - Domain service that orchestrates file merging
	 * @param userPrompt - Adapter for interactive user prompts
	 * @param gitHubClient - Adapter for GitHub API version checking
	 * @param versionComparator - Domain service for semantic version comparison
	 */
	constructor(
		private readonly fileSystem: IFileSystem,
		private readonly mergeEngine: IFileMergeEngine,
		private readonly userPrompt: IUserPrompt,
		private readonly gitHubClient: IGitHubClient,
		private readonly versionComparator: IVersionComparator,
	) {}

	/**
	 * Execute a workspace update.
	 *
	 * Flow:
	 * 1. Validate destination is writable.
	 * 2. If not forced, ask user for confirmation.
	 * 3. Read local version info from `.codice-version` (best-effort).
	 * 4. Check GitHub for latest release tag.
	 * 5. Compare versions; if already up to date, inform user and skip.
	 * 6. If GitHub unreachable, warn and continue with local template.
	 * 7. Execute merge engine with only Obligatorio and Estándar rules.
	 * 8. Write updated `.codice-version` file.
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

		// Ask for confirmation if not forced
		if (!options?.force) {
			const confirmed = await this.userPrompt.confirm(
				`Update workspace in "${destinationPath}"? Obligatorio and Estándar files will be updated. Opcional files will be preserved. Continue?`,
				true,
			);
			if (!confirmed) {
				await this.userPrompt.showCancel("Update cancelled by user.");
				return success(undefined);
			}
		}

		// Read local version info (best-effort)
		let installedVersion = "0.0.0";
		let previousOptionalSelections: string[] = [];
		try {
			const versionData = await this.fileSystem.readVersionFile();
			if (versionData) {
				const parsed = JSON.parse(versionData);
				installedVersion = parsed.installedVersion ?? installedVersion;
				previousOptionalSelections = parsed.optionalSelections ?? [];
			}
		} catch {
			// No version file found — this is a first update in an existing project
		}

		// Check GitHub for latest version
		const remoteTag = await this.gitHubClient.getLatestReleaseTag();
		if (remoteTag) {
			// Strip 'v' prefix (GitHub tags use "vX.Y.Z" format)
			const remoteVersion = remoteTag.startsWith("v") ? remoteTag.slice(1) : remoteTag;
			const comparison = this.versionComparator.compare(installedVersion, remoteVersion);
			if (comparison.ok && comparison.value === "equal") {
				await this.userPrompt.showInfo(
					`Workspace is already up to date at version ${installedVersion}. No update needed.`,
				);
				return success(undefined);
			}
			if (comparison.ok && comparison.value !== "newer") {
				// Local is ahead of remote — unusual but not an error
				await this.userPrompt.showInfo(
					`Local version (${installedVersion}) is ahead of remote (${remoteVersion}). No update needed.`,
				);
				return success(undefined);
			}
		} else {
			await this.userPrompt.showWarning(
				"Could not check for updates via GitHub. Falling back to the bundled template version.",
			);
		}

		// Get only Obligatorio + Estándar rules (skip Opcional).
		// Obligatorio rules overwrite existing files (mandatory category).
		// Estándar rules respect destinationExists (preserve existing user files).
		const updateRules = FILE_RULE_MANIFEST.filter((rule) => rule.category !== "optional");

		// Execute the merge engine
		const mergeResult = await this.mergeEngine.execute(updateRules);
		if (!mergeResult.ok) {
			return failure(new Error(mergeResult.error.message));
		}

		const safeVersion = this.resolveNewVersion(options, remoteTag, installedVersion);

		// Write version file with preserved optional selections
		const versionResult = await writeVersionFileSafe(
			this.fileSystem,
			{
				installedVersion: safeVersion,
				installedAt: new Date().toISOString(),
				optionalSelections: previousOptionalSelections,
			},
			"Update",
		);

		if (versionResult.ok) {
			this.userPrompt.showSuccess("Workspace update complete.");
		}
		return versionResult;
	}

	/**
	 * Resolve the version string to write to .codice-version.
	 * Priority: explicit flag > GitHub remote > previously installed > "0.0.0"
	 * Falls back to "0.0.0" if the resolved string is not valid semver.
	 */
	private resolveNewVersion(
		options: UpdateWorkspaceOptions | undefined,
		remoteTag: string | null,
		installedVersion: string,
	): string {
		const resolved =
			options?.version ?? (remoteTag ? remoteTag.replace(/^v/, "") : undefined) ?? installedVersion;
		return valid(resolved) ? resolved : "0.0.0";
	}
}
