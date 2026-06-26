import { FILE_RULE_MANIFEST } from "../../domain/entities/FileRuleManifest";
import type { IFileMergeEngine } from "../../domain/ports/IFileMergeEngine";
import type { IFileSystem } from "../../domain/ports/IFileSystem";
import { failure, type Result, success } from "../../domain/types/Result";
import { checkWritable, writeVersionFileSafe } from "../helpers";
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
 * with the complete template. No classification rules applied;
 * all files are treated as Obligatorio.
 *
 * After file merge, post-installation symlinks are created:
 * - .opencode/{agents,commands,skills} → ../{agents,commands,skills}/
 * - .devin/{skills,workflows,rules/*} → (various target paths)
 *
 * Symlink creation failures are reported as warnings but do not
 * cause rollback — the core files are already committed.
 */
export class CleanInstallUseCase {
	/**
	 * @param fileSystem - Adapter for filesystem operations (staging, checks)
	 * @param mergeEngine - Domain service that orchestrates file merging
	 * @param userPrompt - Adapter for interactive user prompts
	 * @param symlinkCreator - Adapter for post-installation symlink generation
	 */
	constructor(
		private readonly fileSystem: IFileSystem,
		private readonly mergeEngine: IFileMergeEngine,
		private readonly userPrompt: IUserPrompt,
		private readonly symlinkCreator: ISymlinkCreator,
		private readonly symlinks: readonly SymlinkSpec[],
	) {}

	/**
	 * Execute a clean installation of the full template.
	 *
	 * Flow:
	 * 1. Validate destination is writable.
	 * 2. If destination is not empty and force is false, ask user for confirmation.
	 * 3. Convert all manifest rules to "mandatory" and pass them to FileMergeEngine.
	 * 4. On success, write the `.codice-version` file.
	 * 5. On version file failure, clean staging and return an error.
	 *
	 * @param _destinationPath - Target directory for installation (used for error messages).
	 * @param options - Optional flags.
	 * @returns Result indicating success or a structured error.
	 */
	async execute(
		destinationPath: string,
		options?: CleanInstallOptions,
	): Promise<Result<void, Error>> {
		// Check writability
		const writableCheck = await checkWritable(this.fileSystem, destinationPath);
		if (!writableCheck.ok) return writableCheck;

		// Ask confirmation if destination is not empty
		const isEmpty = await this.fileSystem.isEmpty();
		if (!isEmpty && !options?.force) {
			const confirmed = await this.userPrompt.confirm(
				`The destination directory "${destinationPath}" is not empty. All existing files may be overwritten. Continue?`,
				false,
			);
			if (!confirmed) {
				await this.userPrompt.showCancel("Clean installation cancelled by user.");
				return success(undefined);
			}
		}

		// Convert all rules to mandatory so every file overwrites
		const allRules = FILE_RULE_MANIFEST.map((rule) => ({
			...rule,
			category: "mandatory" as const,
		}));

		// Execute the merge engine
		const mergeResult = await this.mergeEngine.execute(allRules);
		if (!mergeResult.ok) {
			return failure(new Error(mergeResult.error.message));
		}

		// Create post-installation symlinks (clean install copies everything,
		// including optional .devin/ directory, so ALL 10 symlinks are created)
		const symlinkResult = await this.symlinkCreator.createSymlinks(this.symlinks);

		if (!symlinkResult.ok) {
			this.userPrompt.showWarning(
				`Some symlinks could not be created (${symlinkResult.error.length} failures). ` +
					"The workspace was installed successfully. Re-run the installer to retry symlink creation.",
			);
		}

		// Write version file (with atomic rollback on failure)
		const versionResult = await writeVersionFileSafe(
			this.fileSystem,
			{
				installedVersion: options?.version ?? "0.0.0",
				installedAt: new Date().toISOString(),
				optionalSelections: [] as string[],
			},
			"Installation",
		);

		if (versionResult.ok) {
			this.userPrompt.showSuccess("Clean installation complete.");
		}
		return versionResult;
	}
}
