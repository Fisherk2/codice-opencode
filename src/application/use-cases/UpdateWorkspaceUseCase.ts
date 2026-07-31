import { valid } from "semver";
import { FILE_RULE_MANIFEST } from "../../domain/entities/FileRuleManifest";
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
 *
 * Version logic:
 * - Compares the installed version (from .codice-version) against the
 *   bundled template version (the VERSION constant). If installed >= bundled,
 *   the workspace is considered up to date and no update is performed.
 * - The GitHub remote version is checked for informational purposes only —
 *   a newer remote version triggers a suggestion, but the update decision
 *   is based on bundled vs installed version.
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
			const confirmed = await confirmOverwrite(
				this.fileSystem,
				this.userPrompt,
				`Update workspace in "${destinationPath}"? Obligatorio and Estándar files will be updated. Opcional files will be preserved. Continue?`,
				"Update cancelled by user.",
			);
			if (!confirmed) return success(undefined);
		}

		// Read local version info (best-effort)
		let installedVersion = "0.0.0";
		let previousOptionalSelections: string[] = [];
		try {
			const versionData = await this.fileSystem.readVersionFile();
			if (versionData) {
				const parsed = JSON.parse(versionData);
				// Validate fields (defense-in-depth — .codice-version could be corrupted)
				if (typeof parsed.installedVersion === "string") {
					installedVersion = parsed.installedVersion;
				}
				if (Array.isArray(parsed.optionalSelections)) {
					previousOptionalSelections = parsed.optionalSelections.filter(
						(s: unknown): s is string => typeof s === "string",
					);
				}
			}
		} catch {
			// No version file or corrupted JSON — treat as a first update in an existing project
		}

		// Check GitHub for latest version (informational only)
		const remoteTag = await this.gitHubClient.getLatestReleaseTag();
		let remoteVersion: string | undefined;
		if (remoteTag) {
			remoteVersion = remoteTag.startsWith("v") ? remoteTag.slice(1) : remoteTag;
			const remoteComparison = this.versionComparator.compare(installedVersion, remoteVersion);
			if (remoteComparison.ok && remoteComparison.value === "newer") {
				await this.userPrompt.showInfo(
					`A newer version (v${remoteVersion}) is available on GitHub. The bundled template (v${this.bundledVersion}) will be used for this update.`,
				);
			}
		} else {
			await this.userPrompt.showWarning(
				"Could not check for updates via GitHub. Falling back to the bundled template version.",
			);
		}

		// Compare installed version against bundled template version
		const bundledComparison = this.versionComparator.compare(installedVersion, this.bundledVersion);
		if (bundledComparison.ok && bundledComparison.value !== "newer") {
			// Installed >= bundled — workspace is already up to date
			await this.userPrompt.showInfo(
				`Workspace is already up to date at version ${installedVersion}. No update needed.`,
			);
			return success(undefined);
		}

		// Get only Obligatorio + Estándar rules (skip Opcional).
		// Obligatorio rules overwrite existing files (mandatory category).
		// Estándar rules respect destinationExists (preserve existing user files).
		const updateRules = FILE_RULE_MANIFEST.filter((rule) => rule.category !== "optional");

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
	 * Priority: explicit flag > bundled template > fallback to "0.0.0".
	 *
	 * The bundled template version is always available,
	 * so the chain never reaches the fallback — kept for type safety.
	 */
	private resolveNewVersion(options: UpdateWorkspaceOptions | undefined): string {
		const resolved = options?.version ?? this.bundledVersion;
		return valid(resolved) ? resolved : "0.0.0";
	}
}
