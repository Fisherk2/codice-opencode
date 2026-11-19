/**
 * Atomic .codice-version write with staging rollback on failure.
 *
 * @module
 */

import type { IStagedFileSystem } from "../domain/ports/IStagedFileSystem";
import { failure, type Result, success } from "../domain/types/Result";

/**
 * Write a version file with atomic rollback on failure.
 *
 * If the write fails, the staging directory is cleaned up
 * automatically and a Failure is returned with the error context.
 *
 * @param fileSystem - Filesystem + staging adapter (IStagedFileSystem).
 * @param versionData - Data to serialize as JSON into the version file.
 * @param operationLabel - Human-readable label for rollback message (e.g. "Installation", "Update").
 * @returns Success on write, Failure on error (with staging cleaned).
 */
export async function writeVersionFileSafe(
	fileSystem: IStagedFileSystem,
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
