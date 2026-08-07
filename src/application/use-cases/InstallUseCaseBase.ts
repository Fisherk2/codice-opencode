/**
 * Base class for installation use cases implementing the Template Method pattern
 * (GoF). Clean and Project installs share one flow; the abstract hooks specialize it.
 */

import type { FileRule } from "../../domain/entities/FileRule";
import { FILE_RULE_MANIFEST, getPackRules } from "../../domain/entities/FileRuleManifest";
import type { IFileMergeEngine } from "../../domain/ports/IFileMergeEngine";
import type { IFileSystem } from "../../domain/ports/IFileSystem";
import type { IStagingSystem } from "../../domain/ports/IStagingSystem";
import { failure, type Result, success } from "../../domain/types/Result";
import {
	checkWritable,
	confirmOverwrite,
	createProgressCallback,
	wrapMergeError,
} from "../helpers";
import { buildInstallSummary } from "../installSummary";
import type { IGitignoreCreator } from "../ports/IGitignoreCreator";
import type { ISymlinkCreator, SymlinkSpec } from "../ports/ISymlinkCreator";
import type { IUserPrompt } from "../ports/IUserPrompt";
import { runPostInstallSteps } from "../postInstall";

/** Options shared by all installation modes. */
export interface BaseInstallOptions {
	/** Skip the non-empty directory confirmation prompt */
	readonly force?: boolean;
	/** Version tag to write into the version file (e.g. "1.0.0") */
	readonly version?: string;
	/** Packs to install; skips the wizard when provided via CLI (--packs/--packs-all) */
	readonly packs?: readonly string[];
}

/**
 * Abstract base for Clean Install and Project Install use cases.
 * Template method: execute() defines the invariant installation flow.
 */
export abstract class InstallUseCaseBase {
	/**
	 * @param fileSystem - Adapter for filesystem operations (staging, checks)
	 * @param mergeEngine - Domain service that orchestrates file merging
	 * @param userPrompt - Adapter for interactive user prompts
	 * @param symlinkCreator - Adapter for post-installation symlink generation
	 * @param opencodeSymlinks - Always-created .opencode/ symlinks (3)
	 * @param gitignoreCreator - Adapter for post-installation .gitignore generation
	 */
	constructor(
		protected readonly fileSystem: IFileSystem & IStagingSystem,
		protected readonly mergeEngine: IFileMergeEngine,
		protected readonly userPrompt: IUserPrompt,
		protected readonly symlinkCreator: ISymlinkCreator,
		protected readonly opencodeSymlinks: readonly SymlinkSpec[],
		protected readonly gitignoreCreator: IGitignoreCreator,
	) {}

	/**
	 * Template method: run the installation flow with subclass hooks.
	 * @param destinationPath - Target directory for installation.
	 * @param options - Optional flags (force, version).
	 * @returns Result indicating success or a structured error.
	 */
	async execute(
		destinationPath: string,
		options: BaseInstallOptions = {},
	): Promise<Result<void, Error>> {
		// Phase 1: Validate destination is writable
		const writableCheck = await checkWritable(this.fileSystem, destinationPath);
		if (!writableCheck.ok) return writableCheck;

		// Phase 2: Confirm overwrite if destination is not empty
		const confirmed = await confirmOverwrite(
			this.fileSystem,
			this.userPrompt,
			this.getConfirmMessage(destinationPath),
			this.getCancelMessage(),
			options.force,
		);
		if (!confirmed) return success(undefined);

		// Phase 2.5: Select agent packs. CLI-provided packs skip the wizard;
		// a cancel returns an empty selection — aborting prevents a partial install.
		const selectedPacks = options.packs ?? (await this.selectPacks(options.force ?? false));
		if (selectedPacks.length === 0) return success(undefined);

		// Phase 3: Select optional files (subclass decides behavior)
		const selectedOptionals = await this.selectOptionals(options.force ?? false);

		// Phase 4: Build merge rules (subclass-specific transformation)
		const rules = this.buildRules(selectedPacks, selectedOptionals);
		this.showInstallSummary(selectedPacks, selectedOptionals);

		// Phase 5: Execute merge with progress callback
		const onProgress = createProgressCallback(this.userPrompt, this.getProgressLabel());

		const mergeResult = await this.mergeEngine.execute(rules, { selectedOptionals, onProgress });
		if (!mergeResult.ok) {
			return failure(wrapMergeError(mergeResult.error));
		}

		// Phase 6: Post-install steps (gitignore, symlinks, version file)
		return await this.runPostInstall(
			destinationPath,
			selectedPacks,
			selectedOptionals,
			options.version,
		);
	}

	// ---- Abstract hooks: selectPacks, buildRules, selectOptionals, getSuccessMessage ----

	/**
	 * Determine which agent packs to install. Behavior varies by mode:
	 * - Clean: force=true selects all packs; else shows the interactive menu.
	 * - Project: force=true selects default; else shows the interactive menu.
	 * @param force - If true, use the default selection (no interactive menu).
	 * @returns Array of pack IDs to install.
	 */
	protected abstract selectPacks(force: boolean): Promise<readonly string[]>;

	/**
	 * Transform manifest rules into the final rule set: filter by selected
	 * packs; Clean additionally converts all categories to mandatory (overwrite).
	 */
	protected abstract buildRules(
		selectedPacks: readonly string[],
		selectedOptionals: readonly string[],
	): readonly FileRule[];

	/**
	 * Determine which optional files to include: Clean force=true selects all;
	 * Project force=true returns empty (no opt-in); else shows the interactive menu.
	 */
	protected abstract selectOptionals(force: boolean): Promise<readonly string[]>;

	/** Success message displayed after a successful installation. */
	protected abstract getSuccessMessage(): string;

	// ---- Overridable defaults (small differences between modes) ----

	/** Confirmation message for a non-empty destination directory. */
	protected getConfirmMessage(destinationPath: string): string {
		return `The destination directory "${destinationPath}" is not empty. Existing files may be overwritten. Continue?`;
	}

	/** Message shown when the user cancels the installation. */
	protected getCancelMessage(): string {
		return "Installation cancelled by user.";
	}

	/** Label for the progress bar during file merge. */
	protected getProgressLabel(): string {
		return "Installing...";
	}

	/** Whether symlink warnings include a "Re-run the installer" hint. */
	protected getRetryHint(): boolean {
		return false;
	}

	// ---- Private helpers ----

	/** Post-install orchestration: gitignore, symlinks, version file (via runPostInstallSteps). */
	private async runPostInstall(
		destinationPath: string,
		selectedPacks: readonly string[],
		selectedOptionals: readonly string[],
		version?: string,
	): Promise<Result<void, Error>> {
		return runPostInstallSteps({
			fileSystem: this.fileSystem,
			gitignoreCreator: this.gitignoreCreator,
			symlinkCreator: this.symlinkCreator,
			userPrompt: this.userPrompt,
			opencodeSymlinks: this.opencodeSymlinks,
			destinationPath,
			selectedPacks,
			selectedOptionals,
			version,
			operationLabel: "Installation",
			successMessage: this.getSuccessMessage(),
			retryHint: this.getRetryHint(),
		});
	}

	/** Show the pre-install summary via IUserPrompt (spec §3.3).
	 * Informational only — earlier confirmations captured intent (FEV-22 #5). */
	private showInstallSummary(
		selectedPacks: readonly string[],
		selectedOptionals: readonly string[],
	): void {
		this.userPrompt.showInstallSummary(
			buildInstallSummary(getPackRules(), selectedPacks, selectedOptionals, FILE_RULE_MANIFEST),
		);
	}
}
