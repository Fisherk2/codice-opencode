import { FILE_RULE_MANIFEST } from "../../domain/entities/FileRuleManifest";
import type { FileMergeEngine } from "../../domain/services/FileMergeEngine";
import { failure, type Result, success } from "../../domain/types/Result";
import type { IFileSystem } from "../ports/IFileSystem";
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
 */
export class CleanInstallUseCase {
	/**
	 * @param fileSystem - Adapter for filesystem operations (staging, checks)
	 * @param mergeEngine - Domain service that orchestrates file merging
	 * @param userPrompt - Adapter for interactive user prompts
	 */
	constructor(
		private readonly fileSystem: IFileSystem,
		private readonly mergeEngine: FileMergeEngine,
		private readonly userPrompt: IUserPrompt,
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
		// Step 1: Check writability
		const writable = await this.fileSystem.isWritable();
		if (!writable) {
			return failure(
				new Error(
					`Permission denied at "${destinationPath}". Check directory permissions or run with elevated access.`,
				),
			);
		}

		// Step 2: Check if destination is empty and ask confirmation if needed
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

		// Step 3: Convert all rules to mandatory so every file overwrites
		const allRules = FILE_RULE_MANIFEST.map((rule) => ({
			...rule,
			category: "mandatory" as const,
		}));

		// Step 4: Execute the merge engine
		const mergeResult = await this.mergeEngine.execute(allRules);
		if (!mergeResult.ok) {
			return failure(new Error(mergeResult.error.message));
		}

		// Step 5: Write version file
		try {
			await this.fileSystem.writeVersionFile(
				JSON.stringify({
					installedVersion: options?.version ?? "0.0.0",
					installedAt: new Date().toISOString(),
					optionalSelections: [] as string[],
				}),
			);
		} catch (err) {
			// Clean up staging since version file write failed
			await this.fileSystem.cleanStaging();
			return failure(
				new Error(
					`Failed to write version file: ${err instanceof Error ? err.message : "Unknown error"}. Installation rolled back.`,
				),
			);
		}

		return success(undefined);
	}
}
