import type { Result } from "../../domain/types/Result";
import type { SymlinkError } from "../../domain/types/SymlinkError";

/**
 * Specification for a single symlink to create.
 * Uses relative paths so the workspace is portable across machines.
 */
export interface SymlinkSpec {
	/** Relative path to the target (what the symlink points to) */
	readonly target: string;
	/** Relative path for the symlink file/directory (where to create it) */
	readonly linkPath: string;
}

/**
 * Port for creating symbolic links in the installed workspace.
 *
 * Symlinks bridge the gap between the flat template structure and the
 * nested directory layout that OpenCode/Devin expect. For example:
 *   .opencode/agents → ../agents
 *   .devin/skills   → ../skills
 *
 * These symlinks exist as real symlinks in the local dev template but
 * are resolved by npm when packaging, so they must be recreated
 * post-installation in the user's workspace.
 *
 * Implementations should be idempotent: if a symlink already exists,
 * skip it rather than overwrite. If the link path is a real directory,
 * skip it with a warning (the user may have converted it).
 *
 * Reference: ADR-FEV2B-3 (post-install symlink generation)
 */
export interface ISymlinkCreator {
	/**
	 * Create a single symbolic link.
	 *
	 * @param target - Relative path to the symlink target (e.g., "../agents").
	 * @param linkPath - Relative path where to create the symlink (e.g., ".opencode/agents").
	 * @returns Success (void) or a structured SymlinkError on failure.
	 */
	createSymlink(target: string, linkPath: string): Promise<Result<void, SymlinkError>>;

	/**
	 * Create multiple symbolic links in batch.
	 *
	 * Each symlink is attempted independently. If one fails, the others
	 * still proceed (no rollback). All errors are collected and returned.
	 *
	 * @param symlinks - Array of symlink specifications to create.
	 * @returns Success (void) or an array of SymlinkErrors (one per failure).
	 */
	createSymlinks(symlinks: readonly SymlinkSpec[]): Promise<Result<void, SymlinkError[]>>;
}
