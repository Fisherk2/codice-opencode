import type { FileRule } from "../entities/FileRule";
import type { Result } from "../types/Result";

/**
 * Orchestrates file merging according to classification rules.
 * Applies the correct strategy (Obligatorio/Estándar/Opcional)
 * for each rule and guarantees atomic writes.
 */
export class FileMergeEngine {
	/**
	 * Execute all merge rules against the destination directory.
	 * @param rules - Ordered list of classification rules to apply.
	 * @returns Result indicating success or a structured error.
	 */
	async execute(_rules: readonly FileRule[]): Promise<Result<void, Error>> {
		// TODO: Implement merge logic per classification category
		throw new Error("Not implemented");
	}
}
