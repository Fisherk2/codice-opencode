/**
 * Shared helpers for use cases (application layer).
 *
 * Extracts duplicated patterns from CleanInstallUseCase,
 * ProjectInstallUseCase, and UpdateWorkspaceUseCase:
 * - writability check
 * - version file write with staging rollback
 */

import type { IFileSystem } from "../domain/ports/IFileSystem";
import { failure, type Result, success } from "../domain/types/Result";
import type { ISymlinkCreator, SymlinkSpec } from "./ports/ISymlinkCreator";
import type { IUserPrompt } from "./ports/IUserPrompt";

/**
 * Check if the destination directory is writable.
 *
 * If not, returns a Failure with an actionable error message.
 * All three installation modes perform this check at the start.
 *
 * @param fileSystem - Filesystem adapter.
 * @param destinationPath - Target directory (used for error message).
 * @returns Success if writable, Failure with details otherwise.
 */
export async function checkWritable(
	fileSystem: IFileSystem,
	destinationPath: string,
): Promise<Result<void, Error>> {
	const writable = await fileSystem.isWritable();
	if (!writable) {
		return failure(
			new Error(
				`Permission denied at "${destinationPath}". Check directory permissions or run with elevated access.`,
			),
		);
	}
	return success(undefined);
}

/**
 * Write a version file with atomic rollback on failure.
 *
 * If the write fails, the staging directory is cleaned up
 * automatically and a Failure is returned with the error context.
 *
 * @param fileSystem - Filesystem adapter.
 * @param versionData - Data to serialize as JSON into the version file.
 * @param operationLabel - Human-readable label for rollback message (e.g. "Installation", "Update").
 * @returns Success on write, Failure on error (with staging cleaned).
 */
export async function writeVersionFileSafe(
	fileSystem: IFileSystem,
	versionData: Record<string, unknown>,
	operationLabel: string,
): Promise<Result<void, Error>> {
	try {
		await fileSystem.writeVersionFile(JSON.stringify(versionData));
		return success(undefined);
	} catch (err) {
		await fileSystem.cleanStaging();
		return failure(
			new Error(
				`Failed to write version file: ${err instanceof Error ? err.message : "Unknown error"}. ${operationLabel} rolled back.`,
			),
		);
	}
}

/**
 * Create symlinks and display a warning on failure.
 *
 * Shared across use cases to avoid duplicating the symlink guard pattern:
 *   createSymlinks → if not ok → showWarning with label
 *
 * @param symlinkCreator - Adapter for symlink generation.
 * @param prompt - Adapter for user-facing warnings.
 * @param symlinks - Array of symlink specs to create.
 * @param label - Directory label for the warning message (e.g. "opencode", "devin").
 * @param retryHint - If true, appends "Re-run the installer to retry symlink creation."
 */
export async function createSymlinksWithWarning(
	symlinkCreator: ISymlinkCreator,
	prompt: IUserPrompt,
	symlinks: readonly SymlinkSpec[],
	label: string,
	retryHint?: boolean,
): Promise<void> {
	const result = await symlinkCreator.createSymlinks(symlinks);
	if (!result.ok) {
		const message =
			`Some .${label}/ symlinks could not be created (${result.error.length} failures). ` +
			"The workspace was installed successfully." +
			(retryHint ? " Re-run the installer to retry symlink creation." : "") +
			" Run with --verbose for details.";
		prompt.showWarning(message);
	}
}
