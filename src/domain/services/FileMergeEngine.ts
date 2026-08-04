import type { FileRule } from "../entities/FileRule";
import type { IFileMergeEngine, MergeExecuteOptions } from "../ports/IFileMergeEngine";
import type { IFileSystem } from "../ports/IFileSystem";
import type { IStagingSystem } from "../ports/IStagingSystem";
import type { MergeError } from "../types/MergeError";
import { commitError, stagingError } from "../types/MergeError";
import type { ProgressCallback, ProgressEvent } from "../types/ProgressEvent";
import type { Result } from "../types/Result";
import { failure, success } from "../types/Result";
import { computeExclusions, skipReason } from "./mergeRules";
import { computeStagePlan } from "./stagePlanner";

/**
 * Orchestrates atomic file merging according to classification rules:
 * - mandatory: always stages (overwrites).
 * - standard: stages only if destination does NOT exist.
 * - optional: stages only if user selected AND destination missing.
 *
 * In update mode, standard directories use tree-level diffing
 * (computeStagePlan) to deliver only new files instead of skipping
 * entire directories.
 */
export class FileMergeEngine implements IFileMergeEngine {
	constructor(private readonly fileSystem: IFileSystem & IStagingSystem) {}

	/** Execute merge rules. @param options.updateMode enables tree-level diff for standard dirs. */
	async execute(
		rules: readonly FileRule[],
		options?: MergeExecuteOptions,
	): Promise<Result<void, MergeError>> {
		const selected = new Set(options?.selectedOptionals ?? []);
		const isUpdateMode = options?.updateMode ?? false;
		const onProgress = options?.onProgress;
		// Pre-computed by stagePlanner.ts.
		const { stageDecisions, expandedDirs, total } = await computeStagePlan(
			this.fileSystem,
			rules,
			selected,
			isUpdateMode,
		);
		const optionalPaths = rules.filter((r) => r.category === "optional").map((r) => r.path);
		let current = 0;

		// Phase 1: Stage all files
		for (const rule of rules) {
			if (rule.noTemplateCopy) {
				this.safeEmit(onProgress, {
					type: "stage_skip",
					filePath: rule.path,
					reason: "Virtual entry (no template copy)",
				});
				continue;
			}

			const shouldStage = stageDecisions.get(rule.path);
			// Defensive guard: prevents crash if a future rule type skips pre-computation.
			if (shouldStage === undefined) continue;
			if (!shouldStage) {
				this.safeEmit(onProgress, {
					type: "stage_skip",
					filePath: rule.path,
					reason: skipReason(rule, selected, isUpdateMode),
				});
				continue;
			}

			// Handle expanded directories (tree-level diff in update mode)
			const expanded = expandedDirs.get(rule.path);
			if (expanded) {
				for (const file of expanded) {
					current++;
					// Expanded standard dirs never set destPath, so source == dest.
					const fullPath = `${rule.path}/${file}`;
					const result = await this.stageOne(fullPath, fullPath, current, total, onProgress);
					if (!result.ok) return result;
				}
				continue;
			}

			current++;
			const excludeSubDirs = computeExclusions(rule, optionalPaths);
			const result = await this.stageOne(
				rule.path,
				rule.destPath ?? rule.path,
				current,
				total,
				onProgress,
				excludeSubDirs,
			);
			if (!result.ok) return result;
		}

		// Phase 2: Commit staging (atomic rename). Skip when nothing was staged.
		if (total > 0) {
			this.safeEmit(onProgress, { type: "commit_start", total });

			try {
				await this.fileSystem.commitStaging();
			} catch (err) {
				const message = err instanceof Error ? err.message : "Unknown commit error";
				this.safeEmit(onProgress, { type: "error", filePath: "", message });
				await this.fileSystem.cleanStaging();
				return failure(commitError(message));
			}

			this.safeEmit(onProgress, { type: "commit_complete", total });
		} else {
			// Nothing staged this run, but a staging directory could remain from
			// an earlier interrupted operation — remove it so the destination
			// never accumulates .codice-staging artifacts.
			await this.fileSystem.cleanStaging();
		}

		return success(undefined);
	}

	/** Emit event via optional callback, swallowing listener exceptions. */
	private safeEmit(onProgress: ProgressCallback | undefined, event: ProgressEvent): void {
		if (!onProgress) return;
		try {
			onProgress(event);
		} catch {
			// Intentional: a faulty progress listener must never interrupt the merge.
		}
	}

	/**
	 * Stage a single file with progress events.
	 * Progress events report the destination path (what the user sees on disk),
	 * which may differ from the template source path when a rule sets destPath.
	 * @returns A Failure after emitting error + cleaning staging if staging fails,
	 *   or success(undefined) on success.
	 */
	private async stageOne(
		sourcePath: string,
		destPath: string,
		current: number,
		total: number,
		onProgress: ProgressCallback | undefined,
		excludeSubDirs?: Set<string>,
	): Promise<Result<void, MergeError>> {
		this.safeEmit(onProgress, {
			type: "stage_start",
			current,
			total,
			filePath: destPath,
		});

		try {
			await this.fileSystem.stageFile(sourcePath, destPath, excludeSubDirs);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown staging error";
			this.safeEmit(onProgress, {
				type: "error",
				filePath: destPath,
				message,
			});
			await this.fileSystem.cleanStaging();
			return failure(stagingError(destPath, message));
		}

		this.safeEmit(onProgress, {
			type: "stage_complete",
			current,
			total,
			filePath: destPath,
		});
		return success(undefined);
	}
}
