import { type FileRule } from "../entities/FileRule";

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_rules: readonly FileRule[]): Promise<void> {
    // TODO: Implement merge logic per classification category
    // - mandatory: always copy, overwrite if exists
    // - standard: copy only if missing
    // - optional: copy only if user selected AND missing
  }
}
