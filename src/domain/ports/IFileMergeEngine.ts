import type { FileRule } from "../entities/FileRule";
import type { MergeError } from "../types/MergeError";
import type { Result } from "../types/Result";

/**
 * Interface for the file merge orchestrator.
 * Use cases depend on this abstraction, not the concrete FileMergeEngine class,
 * enabling test substitution without hacks (as unknown as casts).
 */
export interface IFileMergeEngine {
	/**
	 * Execute all merge rules against the destination directory.
	 * @param rules - Ordered list of classification rules to apply.
	 * @param selectedOptionals - Paths of optional files the user opted into.
	 * @returns Result<void, MergeError> — success if all operations complete.
	 */
	execute(
		rules: readonly FileRule[],
		selectedOptionals?: readonly string[],
	): Promise<Result<void, MergeError>>;
}
