import type { FileRule } from "../entities/FileRule";
import type { IFileMergeEngine } from "../ports/IFileMergeEngine";
import type { IFileSystem } from "../ports/IFileSystem";
import type { MergeError } from "../types/MergeError";
import { commitError, stagingError } from "../types/MergeError";
import type { Result } from "../types/Result";
import { failure, success } from "../types/Result";

/**
 * Orchestrates file merging according to classification rules.
 *
 * Applies the correct strategy per category:
 * - **mandatory**: Always stages the file (overwrites destination).
 * - **standard**: Stages only if the destination does NOT exist.
 * - **optional**: Stages only if the user selected it AND destination does NOT exist.
 *
 * Guarantees atomic writes:
 * 1. Stage all files first (into staging directory).
 * 2. If any stage fails → cleanStaging() + return error.
 * 3. If all stages succeed → commitStaging() (atomic rename).
 * 4. If commit fails → cleanStaging() + return error.
 */
export class FileMergeEngine implements IFileMergeEngine {
	constructor(private readonly fileSystem: IFileSystem) {}

	/**
	 * Execute all merge rules against the destination directory.
	 *
	 * @param rules - Ordered list of classification rules to apply.
	 * @param selectedOptionals - Paths of optional files the user opted into.
	 * @returns Result<void, MergeError> — success if all operations complete.
	 */
	async execute(
		rules: readonly FileRule[],
		selectedOptionals?: readonly string[],
	): Promise<Result<void, MergeError>> {
		const selected = new Set(selectedOptionals ?? []);

		// Compute subdirectory exclusions for standard dirs that overlap
		// with optional sub-paths, so each file is copied only once.
		const optionalPaths = rules
			.filter((r) => r.category === "optional")
			.map((r) => r.path);
		// Phase 1: Stage all files
		for (const rule of rules) {
			const shouldStage = await this.shouldStage(rule, selected);
			if (!shouldStage) continue;

			const excludeSubDirs = this.computeExclusions(rule, optionalPaths);

			try {
				await this.fileSystem.stageFile(rule.path, excludeSubDirs);
			} catch (err) {
				await this.fileSystem.cleanStaging();
				const message = err instanceof Error ? err.message : "Unknown staging error";
				return failure(stagingError(rule.path, message));
			}
		}

		// Phase 2: Commit staging (atomic rename)
		// commitStaging() is always called, even with zero staged files (empty rules).
		// This guarantees the staging directory is cleaned up consistently at the end
		// of every execution, regardless of how many files were actually staged.
		try {
			await this.fileSystem.commitStaging();
		} catch (err) {
			await this.fileSystem.cleanStaging();
			const message = err instanceof Error ? err.message : "Unknown commit error";
			return failure(commitError(message));
		}

		return success(undefined);
	}

	/**
	 * Determine whether a rule's file should be staged.
	 *
	 * Strategy decision matrix:
	 * | Category   | Destination exists? | Selected? | Stage? |
	 * |------------|---------------------|-----------|--------|
	 * | mandatory  | (ignored)           | N/A       | YES    |
	 * | standard   | no                  | N/A       | YES    |
	 * | standard   | yes                 | N/A       | NO     |
	 * | optional   | no                  | yes       | YES    |
	 * | optional   | yes/no              | no        | NO     |
	 * | optional   | yes                 | yes       | NO     |
	 */
	private async shouldStage(rule: FileRule, selected: Set<string>): Promise<boolean> {
		if (rule.category === "mandatory") {
			return true;
		}

		if (rule.category === "standard") {
			const exists = await this.fileSystem.destinationExists(rule.path);
			return !exists;
		}

		if (rule.category === "optional") {
			if (!selected.has(rule.path)) {
				return false;
			}
			const exists = await this.fileSystem.destinationExists(rule.path);
			return !exists;
		}

		return false;
	}

	/**
	 * Compute subdirectory exclusions for a standard directory rule that
	 * overlaps with optional sub-paths. When a standard dir like "docs"
	 * has an optional sub-path "docs/opencode", the directory walker should
	 * exclude "opencode" so the optional rule can handle it separately.
	 *
	 * @returns Set of immediate subdirectory names to exclude, or undefined.
	 */
	private computeExclusions(
		rule: FileRule,
		optionalPaths: string[],
	): Set<string> | undefined {
		// Only standard directories get exclusions; mandatory always overwrites everything.
		if (!rule.isDirectory || rule.category !== "standard") {
			return undefined;
		}

		const dirPrefix = `${rule.path}/`;
		const overlapping = optionalPaths.filter((opt) =>
			opt.startsWith(dirPrefix),
		);
		if (overlapping.length === 0) {
			return undefined;
		}

		return new Set<string>(
			overlapping
				.map((opt) => {
					const rest = opt.slice(dirPrefix.length);
					return rest.split("/")[0] ?? "";
				})
				.filter((name) => name !== ""),
		);
	}
}
