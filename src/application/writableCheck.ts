/**
 * Destination writability check shared by all three installation modes.
 *
 * @module
 */

import type { IFileSystem } from "../domain/ports/IFileSystem";
import { failure, type Result, success } from "../domain/types/Result";

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
