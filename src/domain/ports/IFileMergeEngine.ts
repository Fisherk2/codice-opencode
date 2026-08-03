import type { FileRule } from "../entities/FileRule";
import type { MergeError } from "../types/MergeError";
import type { ProgressCallback } from "../types/ProgressEvent";
import type { Result } from "../types/Result";

/**
 * Optional execution knobs for {@link IFileMergeEngine.execute}.
 */
export interface MergeExecuteOptions {
	/** Paths of optional files the user opted into. When omitted, no optional rules are staged. */
	readonly selectedOptionals?: readonly string[];
	/** Progress callback invoked during execution. A faulty listener never interrupts the merge. */
	readonly onProgress?: ProgressCallback;
	/** When true, standard directories use tree-level diffing to stage only new files. */
	readonly updateMode?: boolean;
}

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
	 * @param options - Optional execution knobs (selected optionals, progress callback, update mode).
	 * @returns Result<void, MergeError> — success if all operations complete.
	 */
	execute(
		rules: readonly FileRule[],
		options?: MergeExecuteOptions,
	): Promise<Result<void, MergeError>>;
}
