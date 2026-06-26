import { FILE_RULE_MANIFEST, getRulesByCategory } from "../../domain/entities/FileRuleManifest";
import type { IFileMergeEngine } from "../../domain/ports/IFileMergeEngine";
import type { IFileSystem } from "../../domain/ports/IFileSystem";
import { failure, type Result, success } from "../../domain/types/Result";
import { checkWritable, writeVersionFileSafe } from "../helpers";
import type { IGitignoreCreator } from "../ports/IGitignoreCreator";
import type { ISymlinkCreator, SymlinkSpec } from "../ports/ISymlinkCreator";
import type { IUserPrompt } from "../ports/IUserPrompt";

/**
 * Options for the project install execution.
 */
export interface ProjectInstallOptions {
	/** Skip the non-empty directory confirmation prompt */
	readonly force?: boolean;
	/** Version tag to write into the version file (e.g. "1.0.0") */
	readonly version?: string;
}

/**
 * Mode 2: Project Install — selectively merge template files
 * into an existing project. Preserves user customizations
 * by applying classification rules.
 *
 * Flow:
 * 1. Validate destination is writable.
 * 2. If destination is not empty and force is false, ask user for confirmation.
 * 3. Present optional files as a checklist to the user.
 * 4. Pass all manifest rules + selected optional paths to FileMergeEngine.
 * 5. On success, write the `.codice-version` file with optionalSelections.
 */
export class ProjectInstallUseCase {
	/**
	 * @param fileSystem - Adapter for filesystem operations (staging, checks)
	 * @param mergeEngine - Domain service that orchestrates file merging
	 * @param userPrompt - Adapter for interactive user prompts
	 * @param symlinkCreator - Adapter for post-installation symlink generation
	 * @param opencodeSymlinks - Always-created .opencode/ symlinks (3)
	 * @param devinSymlinks - Conditional .devin/ symlinks (7, created only if .devin selected)
	 */
	constructor(
		private readonly fileSystem: IFileSystem,
		private readonly mergeEngine: IFileMergeEngine,
		private readonly userPrompt: IUserPrompt,
		private readonly symlinkCreator: ISymlinkCreator,
		private readonly opencodeSymlinks: readonly SymlinkSpec[],
		private readonly devinSymlinks: readonly SymlinkSpec[],
		private readonly gitignoreCreator: IGitignoreCreator,
	) {}

	/**
	 * Execute a project installation with selective merge.
	 *
	 * @param destinationPath - Target directory for installation.
	 * @param options - Optional flags.
	 * @returns Result indicating success or a structured error.
	 */
	async execute(
		destinationPath: string,
		options?: ProjectInstallOptions,
	): Promise<Result<void, Error>> {
		// Check writability
		const writableCheck = await checkWritable(this.fileSystem, destinationPath);
		if (!writableCheck.ok) return writableCheck;

		// Ask confirmation if destination is not empty
		const isEmpty = await this.fileSystem.isEmpty();
		if (!isEmpty && !options?.force) {
			const confirmed = await this.userPrompt.confirm(
				`The destination directory "${destinationPath}" is not empty. Some existing files may be overwritten. Continue?`,
				false,
			);
			if (!confirmed) {
				await this.userPrompt.showCancel("Project installation cancelled by user.");
				return success(undefined);
			}
		}

		// Present optional files as a checklist (skip if force=true — no interaction)
		const optionalRules = getRulesByCategory("optional");
		const selectedOptionals = options?.force
			? []
			: await this.userPrompt.selectOptional(optionalRules);

		// Execute the merge engine with manifest rules + selected optionals
		const mergeResult = await this.mergeEngine.execute(FILE_RULE_MANIFEST, selectedOptionals);
		if (!mergeResult.ok) {
			return failure(new Error(mergeResult.error.message));
		}

		// Generate .gitignore from template (post-installation, graceful on failure)
		const gitignoreResult = await this.gitignoreCreator.createGitignore(destinationPath);
		if (!gitignoreResult.ok) {
			this.userPrompt.showWarning(
				`Could not generate .gitignore: ${gitignoreResult.error.message}. ` +
					"The workspace was installed successfully. " +
					"Create a .gitignore file manually or re-run the installer.",
			);
		}

		// Create post-installation symlinks
		// .opencode/ symlinks are always created (they mirror root dirs)
		const opencodeResult = await this.symlinkCreator.createSymlinks(this.opencodeSymlinks);
		if (!opencodeResult.ok) {
			this.userPrompt.showWarning(
				`Some .opencode/ symlinks could not be created (${opencodeResult.error.length} failures). ` +
					"The workspace was installed successfully.",
			);
		}

		// .devin/ symlinks are created only if the user selected .devin
		const hasDevin = selectedOptionals.includes(".devin");
		if (hasDevin) {
			const devinResult = await this.symlinkCreator.createSymlinks(this.devinSymlinks);
			if (!devinResult.ok) {
				this.userPrompt.showWarning(
					`Some .devin/ symlinks could not be created (${devinResult.error.length} failures). ` +
						"The workspace was installed successfully.",
				);
			}
		}

		// Write version file with optional selections recorded
		const versionResult = await writeVersionFileSafe(
			this.fileSystem,
			{
				installedVersion: options?.version ?? "0.0.0",
				installedAt: new Date().toISOString(),
				optionalSelections: selectedOptionals,
			},
			"Installation",
		);

		if (versionResult.ok) {
			this.userPrompt.showSuccess("Project installation complete.");
		}
		return versionResult;
	}
}
