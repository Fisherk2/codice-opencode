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
 * 5. On merge success, generate .gitignore from template (graceful on failure).
 * 6. Create post-installation symlinks:
 *    - .opencode/{agents,commands,skills} — always created.
 *    - .devin/{skills,workflows,rules/*} — created only if user selected .devin.
 * 7. Write the `.codice-version` file with optionalSelections.
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
		// Phase 1: Validate destination is writable
		const writableCheck = await checkWritable(this.fileSystem, destinationPath);
		if (!writableCheck.ok) return writableCheck;

		// Phase 2: Confirm overwrite if destination is not empty
		const confirmed = await this.confirmOverwrite(destinationPath, options?.force);
		if (!confirmed) return success(undefined);

		// Phase 3: Select optional files
		const selectedOptionals = await this.selectOptionals(options?.force);

		// Phase 4: Execute merge engine with manifest rules + selected optionals
		const mergeResult = await this.mergeEngine.execute(FILE_RULE_MANIFEST, selectedOptionals);
		if (!mergeResult.ok) {
			return failure(new Error(mergeResult.error.message));
		}

		// Phase 5: Post-install steps
		return await this.runPostInstall(destinationPath, selectedOptionals, options?.version);
	}

	/**
	 * Ask for confirmation if destination is not empty.
	 * Skips prompt when force=true.
	 * @returns true if the operation should proceed, false if cancelled.
	 */
	private async confirmOverwrite(destinationPath: string, force?: boolean): Promise<boolean> {
		if (force) return true;

		const isEmpty = await this.fileSystem.isEmpty();
		if (isEmpty) return true;

		const confirmed = await this.userPrompt.confirm(
			`The destination directory "${destinationPath}" is not empty. Some existing files may be overwritten. Continue?`,
			false,
		);
		if (!confirmed) {
			await this.userPrompt.showCancel("Project installation cancelled by user.");
		}
		return confirmed;
	}

	/**
	 * Present optional file checklist, or return empty when force=true.
	 * In project mode, force skips all optional files (no interaction).
	 * @returns List of selected optional file paths.
	 */
	private async selectOptionals(force?: boolean): Promise<readonly string[]> {
		if (force) return [];
		const optionalRules = getRulesByCategory("optional");
		return await this.userPrompt.selectOptional(optionalRules);
	}

	/**
	 * Generate .gitignore, create symlinks, and write version file.
	 * Gitignore and symlink failures are warnings, not rollback triggers.
	 */
	private async runPostInstall(
		destinationPath: string,
		selectedOptionals: readonly string[],
		version?: string,
	): Promise<Result<void, Error>> {
		// Generate .gitignore from template (graceful on failure)
		await this.createGitignore(destinationPath);

		// Create .opencode/ symlinks always
		await this.createOpenCodeSymlinks();

		// Create .devin/ symlinks only if user selected .devin
		if (selectedOptionals.includes(".devin")) {
			await this.createDevinSymlinks();
		}

		// Write version file with optionalSelections recorded
		const versionResult = await writeVersionFileSafe(
			this.fileSystem,
			{
				installedVersion: version ?? "0.0.0",
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

	private async createGitignore(destinationPath: string): Promise<void> {
		const gitignoreResult = await this.gitignoreCreator.createGitignore(destinationPath);
		if (!gitignoreResult.ok) {
			this.userPrompt.showWarning(
				`Could not generate .gitignore: ${gitignoreResult.error.message}. ` +
					"The workspace was installed successfully. " +
					"Create a .gitignore file manually or re-run the installer. " +
					"Run with --verbose for details.",
			);
		}
	}

	private async createOpenCodeSymlinks(): Promise<void> {
		const opencodeResult = await this.symlinkCreator.createSymlinks(this.opencodeSymlinks);
		if (!opencodeResult.ok) {
			this.userPrompt.showWarning(
				`Some .opencode/ symlinks could not be created (${opencodeResult.error.length} failures). ` +
					"The workspace was installed successfully. " +
					"Run with --verbose for details.",
			);
		}
	}

	private async createDevinSymlinks(): Promise<void> {
		const devinResult = await this.symlinkCreator.createSymlinks(this.devinSymlinks);
		if (!devinResult.ok) {
			this.userPrompt.showWarning(
				`Some .devin/ symlinks could not be created (${devinResult.error.length} failures). ` +
					"The workspace was installed successfully. " +
					"Run with --verbose for details.",
			);
		}
	}
}
