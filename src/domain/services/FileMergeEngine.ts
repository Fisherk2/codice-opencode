import type { FileRule } from "../entities/FileRule";
import type { IFileMergeEngine } from "../ports/IFileMergeEngine";
import type { IFileSystem } from "../ports/IFileSystem";
import type { IStagingSystem } from "../ports/IStagingSystem";
import type { MergeError } from "../types/MergeError";
import { commitError, stagingError } from "../types/MergeError";
import type { ProgressCallback, ProgressEvent } from "../types/ProgressEvent";
import type { Result } from "../types/Result";
import { failure, success } from "../types/Result";
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

	/** Execute merge rules. @param isUpdateMode enables tree-level diff for standard dirs. */
	async execute(
		rules: readonly FileRule[],
		selectedOptionals?: readonly string[],
		onProgress?: ProgressCallback,
		isUpdateMode = false,
	): Promise<Result<void, MergeError>> {
		const selected = new Set(selectedOptionals ?? []);
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
					reason: this.skipReason(rule, selected, isUpdateMode),
				});
				continue;
			}

			// Handle expanded directories (tree-level diff in update mode)
			const expanded = expandedDirs.get(rule.path);
			if (expanded) {
				for (const file of expanded) {
					current++;
					const result = await this.stageOne(`${rule.path}/${file}`, current, total, onProgress);
					if (result) return result;
				}
				continue;
			}

			current++;
			const excludeSubDirs = this.computeExclusions(rule, optionalPaths);
			const result = await this.stageOne(rule.path, current, total, onProgress, excludeSubDirs);
			if (result) return result;
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
		}

		return success(undefined);
	}

	/** Emit event via optional callback, swallowing listener exceptions. */
	private safeEmit(onProgress: ProgressCallback | undefined, event: ProgressEvent): void {
		if (!onProgress) return;
		try {
			onProgress(event);
		} catch {}
	}

	/**
	 * Stage a single file with progress events.
	 * @returns A Failure after emitting error + cleaning staging if staging fails,
	 *   or null on success.
	 */
	private async stageOne(
		filePath: string,
		current: number,
		total: number,
		onProgress: ProgressCallback | undefined,
		excludeSubDirs?: Set<string>,
	): Promise<Result<void, MergeError> | null> {
		this.safeEmit(onProgress, {
			type: "stage_start",
			current,
			total,
			filePath,
		});

		try {
			await this.fileSystem.stageFile(filePath, excludeSubDirs);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown staging error";
			this.safeEmit(onProgress, {
				type: "error",
				filePath,
				message,
			});
			await this.fileSystem.cleanStaging();
			return failure(stagingError(filePath, message));
		}

		this.safeEmit(onProgress, {
			type: "stage_complete",
			current,
			total,
			filePath,
		});
		return null;
	}

	private skipReason(rule: FileRule, selected: Set<string>, isUpdateMode = false): string {
		if (rule.category === "standard") {
			if (isUpdateMode && rule.isDirectory) {
				return "No new files in directory";
			}
			return "Destination already exists";
		}
		if (rule.category === "optional" && !selected.has(rule.path)) {
			return "Not selected by user";
		}
		if (rule.category === "optional") {
			return "Destination already exists";
		}
		return "Skipped by classification rule";
	}

	/** Compute subdir exclusions when standard and optional dirs overlap. */
	private computeExclusions(rule: FileRule, optionalPaths: string[]): Set<string> | undefined {
		// Only standard directories get exclusions; mandatory always overwrites everything.
		if (!rule.isDirectory || rule.category !== "standard") {
			return undefined;
		}

		const dirPrefix = `${rule.path}/`;
		const overlapping = optionalPaths.filter((opt) => opt.startsWith(dirPrefix));
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
