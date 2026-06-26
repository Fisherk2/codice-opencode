import type { GitignoreError } from "../../domain/types/GitignoreError";
import type { Result } from "../../domain/types/Result";

/**
 * Port for generating the .gitignore file in the installed workspace.
 *
 * npm hard-excludes .gitignore from packages — even when listed in the
 * `files` field of package.json. To work around this, the template file
 * is named `gitignore` (no dot prefix) and this port generates the
 * actual `.gitignore` file post-installation.
 *
 * Implementations should:
 * - Read the template `gitignore` file (no dot) from the template directory.
 * - Write its content to `destPath/.gitignore` in the destination workspace.
 * - Be idempotent: if `.gitignore` already exists, skip rather than overwrite.
 * - If the link path is a real directory, skip with a warning (user may have
 *   manually created it before the installer could generate it).
 *
 * Use in: Clean Install and Project Install modes ONLY.
 * Do NOT use in Update Workspace mode — preserve user's existing .gitignore.
 *
 * Reference: ADR-FEV2C-3 (idempotent generation), ADR-FEV2C-4 (port/adapter),
 *            ADR-FEV2C-5 (GitignoreError type), Issue #11
 */
export interface IGitignoreCreator {
	/**
	 * Generate the .gitignore file in the destination directory.
	 *
	 * Reads the template `gitignore` file and writes it to `destPath/.gitignore`.
	 * If `.gitignore` already exists (idempotent), the operation is skipped.
	 *
	 * @param destPath - Absolute path to the destination workspace directory.
	 * @returns Success (void) or a structured GitignoreError on failure.
	 */
	createGitignore(destPath: string): Promise<Result<void, GitignoreError>>;
}
