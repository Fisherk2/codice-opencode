/**
 * Shared helpers for use cases (application layer).
 *
 * Services all three installation modes (Clean, Project, Update):
 * - writability check
 * - version file write with staging rollback
 * - confirm overwrite prompt (shared by Clean + Project install)
 *
 * Post-installation orchestration (gitignore, symlinks, success message)
 * for Clean and Project install modes lives in the separate
 * {@link postInstall} module to keep file size under the 200-line
 * convention. Update mode does not perform post-install generation.
 *
 * @module
 */

import type { IFileSystem } from "../domain/ports/IFileSystem";
import type { IStagingSystem } from "../domain/ports/IStagingSystem";
import { failure, type Result, success } from "../domain/types/Result";
import type { IUserPrompt } from "./ports/IUserPrompt";

/**
 * Check if the destination directory is writable.
 *
 * If not, returns a Failure with an actionable error message.
 * All three installation modes perform this check at the start.
 *
 * @param fileSystem - Filesystem adapter (IFileSystem).
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
 * Ask the user for confirmation when the destination is not empty.
 * Skips the prompt when force=true or the directory is effectively empty
 * (allows .git/ and .codice-version).
 *
 * Shared by CleanInstallUseCase and ProjectInstallUseCase to avoid
 * duplicating the guard pattern.
 *
 * @param fileSystem - Filesystem adapter (provides isEmpty check).
 * @param userPrompt - Adapter for interactive prompts.
 * @param message - Confirmation message shown to the user.
 * @param cancelMessage - Message shown if the user cancels.
 * @param force - If true, skip the prompt. If false or undefined, check isEmpty and prompt.
 * @returns true if the operation should proceed, false if cancelled.
 */
export async function confirmOverwrite(
	fileSystem: IFileSystem,
	userPrompt: IUserPrompt,
	message: string,
	cancelMessage: string,
	force?: boolean,
): Promise<boolean> {
	if (force) return true;

	const isEmpty = await fileSystem.isEmpty();
	if (isEmpty) return true;

	const confirmed = await userPrompt.confirm(message, false);
	if (!confirmed) {
		await userPrompt.showCancel(cancelMessage);
	}
	return confirmed;
}

/**
 * Write a version file with atomic rollback on failure.
 *
 * If the write fails, the staging directory is cleaned up
 * automatically and a Failure is returned with the error context.
 *
 * @param fileSystem - Filesystem + staging adapter (IFileSystem & IStagingSystem).
 * @param versionData - Data to serialize as JSON into the version file.
 * @param operationLabel - Human-readable label for rollback message (e.g. "Installation", "Update").
 * @returns Success on write, Failure on error (with staging cleaned).
 */
export async function writeVersionFileSafe(
	fileSystem: IFileSystem & IStagingSystem,
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
