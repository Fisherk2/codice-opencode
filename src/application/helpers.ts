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
