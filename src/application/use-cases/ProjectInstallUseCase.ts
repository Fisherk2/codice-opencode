import { FILE_RULE_MANIFEST, getRulesByCategory } from "../../domain/entities/FileRuleManifest";
import type { FileMergeEngine } from "../../domain/services/FileMergeEngine";
import { failure, type Result, success } from "../../domain/types/Result";
import type { IFileSystem } from "../ports/IFileSystem";
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
	 */
	constructor(
		private readonly fileSystem: IFileSystem,
		private readonly mergeEngine: FileMergeEngine,
		private readonly userPrompt: IUserPrompt,
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
				`The destination directory "${destinationPath}" is not empty. Some existing files may be overwritten. Continue?`,
				false,
			);
			if (!confirmed) {
				await this.userPrompt.showCancel("Project installation cancelled by user.");
				return success(undefined);
			}
		}

		// Step 3: Present optional files as a checklist
		const optionalRules = getRulesByCategory("optional");
		const selectedOptionals = await this.userPrompt.selectOptional(optionalRules);

		// Step 4: Execute the merge engine with manifest rules + selected optionals
		const mergeResult = await this.mergeEngine.execute(FILE_RULE_MANIFEST, selectedOptionals);
		if (!mergeResult.ok) {
			return failure(new Error(mergeResult.error.message));
		}

		// Step 5: Write version file with optional selections recorded
		try {
			await this.fileSystem.writeVersionFile(
				JSON.stringify({
					installedVersion: options?.version ?? "0.0.0",
					installedAt: new Date().toISOString(),
					optionalSelections: selectedOptionals,
				}),
			);
		} catch (err) {
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
