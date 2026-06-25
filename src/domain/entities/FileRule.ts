/**
 * Classification category for a template file.
 *
 * Maps from template directory naming (Spanish → English):
 *   obligatorio/ → mandatory  — Always copied, overwrites destination.
 *   estandar/    → standard    — Copied only if destination does not exist.
 *   opcional/    → optional    — Copied only if user explicitly opts in.
 */
export type RuleCategory = "mandatory" | "standard" | "optional";

/**
 * Classification rule for a single path in the template directory.
 * Defines how the file or directory should be handled during install/update.
 */
export interface FileRule {
	/** Relative path from template/ root */
	readonly path: string;
	/** Classification category */
	readonly category: RuleCategory;
	/** Whether this rule applies to a directory */
	readonly isDirectory: boolean;
	/** Human-readable rationale for the classification */
	readonly description: string;
}
