import type { FileRule } from "../entities/FileRule";
import type { MergeError } from "../types/MergeError";
import type { ProgressCallback } from "../types/ProgressEvent";
import type { Result } from "../types/Result";

/**
 * Interface for the file merge orchestrator.
 * Use cases depend on this abstraction, not the concrete FileMergeEngine class,
 * enabling test substitution without hacks (as unknown as casts).
 */
export interface IFileMergeEngine {
	/**
	 * Execute all merge rules against the destination directory.
	 *
	 * @param rules - Ordered list of classification rules to apply.
	 * @param selectedOptionals - Paths of optional files the user opted into.
	 *   Only relevant when rules include optional-category entries. When omitted,
	 *   no optional rules are staged (equivalent to passing an empty array).
	 * @param onProgress - Optional callback invoked with progress events during
	 *   execution. Receives a discriminated ProgressEvent describing the current
	 *   phase, file path, and progress counters. The callback is wrapped in a
	 *   try/catch so that a faulty listener never interrupts the merge.
	 * @param isUpdateMode - When true, standard directories use tree-level diffing
	 *   to stage only files that are new in the template but missing in the
	 *   destination, instead of skipping the entire directory. Defaults to false.
	 * @returns Result<void, MergeError> — success if all operations complete.
	 */
	execute(
		rules: readonly FileRule[],
		selectedOptionals?: readonly string[],
		onProgress?: ProgressCallback,
		isUpdateMode?: boolean,
	): Promise<Result<void, MergeError>>;
}
