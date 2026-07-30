import type { FileRule } from "../entities/FileRule";
import type { IFileMergeEngine } from "../ports/IFileMergeEngine";
import type { IFileSystem } from "../ports/IFileSystem";
import type { IStagingSystem } from "../ports/IStagingSystem";
import type { MergeError } from "../types/MergeError";
import { commitError, stagingError } from "../types/MergeError";
import type { ProgressCallback, ProgressEvent } from "../types/ProgressEvent";
import type { Result } from "../types/Result";
import { failure, success } from "../types/Result";

/**
 * Orchestrates file merging according to classification rules.
 *
 * - mandatory: always stages (overwrites destination).
 * - standard: stages only if destination does NOT exist.
 * - optional: stages only if user selected AND destination missing.
 *
 * Guarantees atomic writes: stage all first → commit (rename) or rollback.
 */
export class FileMergeEngine implements IFileMergeEngine {
	constructor(private readonly fileSystem: IFileSystem & IStagingSystem) {}

	/**
	 * Execute merge rules against the destination directory.
	 * @param onProgress - Optional progress callback (exceptions are swallowed).
	 */
	async execute(
		rules: readonly FileRule[],
		selectedOptionals?: readonly string[],
		onProgress?: ProgressCallback,
	): Promise<Result<void, MergeError>> {
		const selected = new Set(selectedOptionals ?? []);

		// Compute subdirectory exclusions for standard dirs that overlap
		// with optional sub-paths, so each file is copied only once.
		const optionalPaths = rules.filter((r) => r.category === "optional").map((r) => r.path);

		// Pre-compute which non-virtual rules should be staged, so we can
		// report an accurate total to the progress bar (it will always reach
		// 100% because total reflects only files that will actually be staged).
		const stageDecisions = new Map<string, boolean>();
		for (const rule of rules) {
			if (rule.noTemplateCopy) continue;
			stageDecisions.set(rule.path, await this.shouldStage(rule, selected));
		}
		const total = [...stageDecisions.values()].filter(Boolean).length;
		let current = 0;

		// Phase 1: Stage all files
		for (const rule of rules) {
			// Content generated post-installation (e.g., .devin/ symlinks)
			if (rule.noTemplateCopy) {
				this.safeEmit(onProgress, {
					type: "stage_skip",
					filePath: rule.path,
					reason: "Virtual entry (no template copy)",
				});
				continue;
			}

			const shouldStage = stageDecisions.get(rule.path)!;
			if (!shouldStage) {
				this.safeEmit(onProgress, {
					type: "stage_skip",
					filePath: rule.path,
					reason: this.skipReason(rule, selected),
				});
				continue;
			}

			current++;

			const excludeSubDirs = this.computeExclusions(rule, optionalPaths);

			this.safeEmit(onProgress, {
				type: "stage_start",
				current,
				total,
				filePath: rule.path,
			});

			try {
				await this.fileSystem.stageFile(rule.path, excludeSubDirs);
			} catch (err) {
				const message = err instanceof Error ? err.message : "Unknown staging error";
				this.safeEmit(onProgress, {
					type: "error",
					filePath: rule.path,
					message,
				});
				await this.fileSystem.cleanStaging();
				return failure(stagingError(rule.path, message));
			}

			this.safeEmit(onProgress, {
				type: "stage_complete",
				current,
				total,
				filePath: rule.path,
			});
		}

		// Phase 2: Commit staging (atomic rename)
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

		return success(undefined);
	}

	/** Decide whether a rule's file should be staged based on category and state. */
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

	/** Emit event via optional callback, swallowing listener exceptions. */
	private safeEmit(onProgress: ProgressCallback | undefined, event: ProgressEvent): void {
		if (!onProgress) return;
		try {
			onProgress(event);
		} catch {
			// Swallow callback exceptions — see safeEmit contract.
		}
	}

	private skipReason(rule: FileRule, selected: Set<string>): string {
		if (rule.category === "standard") {
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

	/**
	 * Compute subdirectory exclusions for standard dirs overlapping
	 * optional sub-paths (e.g. "docs/guides" → exclude "guides" from "docs" walk).
	 */
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
