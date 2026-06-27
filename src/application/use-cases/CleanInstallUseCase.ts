import type { FileRule } from "../../domain/entities/FileRule";
import { FILE_RULE_MANIFEST, getRulesByCategory } from "../../domain/entities/FileRuleManifest";
import type { IFileMergeEngine } from "../../domain/ports/IFileMergeEngine";
import type { IFileSystem } from "../../domain/ports/IFileSystem";
import { failure, type Result, success } from "../../domain/types/Result";
import { checkWritable, createSymlinksWithWarning, writeVersionFileSafe } from "../helpers";
import type { IGitignoreCreator } from "../ports/IGitignoreCreator";
import type { ISymlinkCreator, SymlinkSpec } from "../ports/ISymlinkCreator";
import type { IUserPrompt } from "../ports/IUserPrompt";

/**
 * Options for the clean install execution.
 */
export interface CleanInstallOptions {
	/** Skip the non-empty directory confirmation prompt */
	readonly force?: boolean;
	/** Version tag to write into the version file (e.g. "1.0.0") */
	readonly version?: string;
}

/**
 * Mode 1: Clean Install — overwrites everything in the destination
 * with the complete template. All files are treated as Obligatorio.
 *
 * Flow:
 * 1. Validate destination is writable.
 * 2. If destination is not empty and force is false, ask user for confirmation.
 * 3. Show optional file selection menu (skip if force=true — selects all).
 * 4. Convert obligatorio + estandar + selected optional to mandatory.
 * 5. Execute the merge engine.
 * 6. On merge success, generate .gitignore from template (graceful on failure).
 * 7. Create post-installation symlinks:
 *    - .opencode/{agents,commands,skills} — always created.
 *    - .devin/{skills,workflows,rules/*} — created only if user selected .devin.
 * 8. Write the `.codice-version` file with optionalSelections.
 */
export class CleanInstallUseCase {
	/**
	 * @param fileSystem - Adapter for filesystem operations (staging, checks)
	 * @param mergeEngine - Domain service that orchestrates file merging
	 * @param userPrompt - Adapter for interactive user prompts
	 * @param symlinkCreator - Adapter for post-installation symlink generation
	 * @param opencodeSymlinks - Always-created .opencode/ symlinks (3)
	 * @param devinSymlinks - Conditional .devin/ symlinks (7, created only if .devin selected)
	 * @param gitignoreCreator - Adapter for post-installation .gitignore generation
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
	 * Execute a clean installation of the full template.
	 *
	 * @param destinationPath - Target directory for installation.
	 * @param options - Optional flags.
	 * @returns Result indicating success or a structured error.
	 */
	async execute(
		destinationPath: string,
		options?: CleanInstallOptions,
	): Promise<Result<void, Error>> {
		// Phase 1: Validate destination is writable
		const writableCheck = await checkWritable(this.fileSystem, destinationPath);
		if (!writableCheck.ok) return writableCheck;

		// Phase 2: Confirm overwrite if destination is not empty
		const confirmed = await this.confirmOverwrite(destinationPath, options?.force);
		if (!confirmed) return success(undefined);

		// Phase 3: Select optional files
		const selectedOptionals = await this.selectOptionals(options?.force);

		// Phase 4: Build merge rules
		const allRules = this.buildRules(selectedOptionals);

		// Phase 5: Execute merge
		const mergeResult = await this.mergeEngine.execute(allRules);
		if (!mergeResult.ok) {
			return failure(new Error(mergeResult.error.message));
		}

		// Phase 6: Post-install steps
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
			`The destination directory "${destinationPath}" is not empty. All existing files may be overwritten. Continue?`,
			false,
		);
		if (!confirmed) {
			await this.userPrompt.showCancel("Clean installation cancelled by user.");
		}
		return confirmed;
	}

	/**
	 * Present optional file checklist, or auto-select all when force=true.
	 * @returns List of selected optional file paths.
	 */
	private async selectOptionals(force?: boolean): Promise<readonly string[]> {
		const optionalRules = getRulesByCategory("optional");
		if (force) {
			return optionalRules.map((r) => r.path);
		}
		return await this.userPrompt.selectOptional(optionalRules);
	}

	/**
	 * Convert all manifest rules to mandatory, preserving optional selection.
	 * Selected optionals → mandatory (staged), unselected → optional (skipped by engine).
	 */
	private buildRules(selectedOptionals: readonly string[]): FileRule[] {
		return FILE_RULE_MANIFEST.map((rule) => {
			if (rule.category === "optional") {
				if (selectedOptionals.includes(rule.path)) {
					return { ...rule, category: "mandatory" as const };
				}
				return rule;
			}
			return { ...rule, category: "mandatory" as const };
		});
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
			this.userPrompt.showSuccess("Clean installation complete.");
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
		await createSymlinksWithWarning(
			this.symlinkCreator,
			this.userPrompt,
			this.opencodeSymlinks,
			"opencode",
			true, // retryHint — Clean Install can be re-run to fix symlinks
		);
	}

	private async createDevinSymlinks(): Promise<void> {
		await createSymlinksWithWarning(
			this.symlinkCreator,
			this.userPrompt,
			this.devinSymlinks,
			"devin",
		);
	}
}
