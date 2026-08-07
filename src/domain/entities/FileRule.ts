/**
 * Classification category for a template file.
 *
 * Maps from template directory naming (Spanish → English):
 *   obligatorio/ → mandatory  — Always copied, overwrites destination.
 *   estandar/    → standard    — Copied only if destination does not exist.
 *   opcional/    → optional    — Copied only if user explicitly opts in.
 *   packs/*      → pack        — Selectable agent packs chosen via the
 *                                installer wizard; only selected packs are
 *                                staged, non-pack rules always pass through.
 */
export type RuleCategory = "mandatory" | "standard" | "optional" | "pack";

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
	/**
	 * If true, skip template file resolution and staging.
	 * Used for entries whose content is generated entirely
	 * post-installation (e.g., symlinks via BunSymlinkCreator).
	 * The entry exists only for user selection tracking in the UX.
	 */
	readonly noTemplateCopy?: boolean;
	/**
	 * Optional destination path override. When omitted, `path` is used as both
	 * source and destination (v1.x behavior). When present, `path` is the
	 * template source path and `destPath` is where the content lands in the
	 * destination. Needed for v2.0: core/ and packs/* are source groupings but
	 * the destination stays flat (core/* spreads to root, packs/* merge into
	 * agents/).
	 */
	readonly destPath?: string;
	/**
	 * Approximate per-pack agent count. Only meaningful for `pack` category
	 * rules; used by the installer wizard to show `~N agents` per pack.
	 * Backward compatible: rules without it default to 0. Approximate counts
	 * are sufficient for v2.0.0 (specs/spec-installer-ux-v2.md §10 Q4).
	 */
	readonly agentCount?: number;
}
