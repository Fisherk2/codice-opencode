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

import { getOptionalRules } from "../domain/entities/FileRuleManifest";
import type { IFileSystem } from "../domain/ports/IFileSystem";
import type { IStagingSystem } from "../domain/ports/IStagingSystem";
import type { MergeError } from "../domain/types/MergeError";
import type { ProgressCallback } from "../domain/types/ProgressEvent";
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
 * @param defaultYes - Default answer for the confirm prompt. Update mode defaults to
 *   Yes so a single keystroke accepts the update (plan Phase 4); install modes keep No.
 * @returns true if the operation should proceed, false if cancelled.
 */
export async function confirmOverwrite(
	fileSystem: IFileSystem,
	userPrompt: IUserPrompt,
	message: string,
	cancelMessage: string,
	force?: boolean,
	defaultYes = false,
): Promise<boolean> {
	if (force) return true;

	const isEmpty = await fileSystem.isEmpty();
	if (isEmpty) return true;

	const confirmed = await userPrompt.confirm(message, defaultYes);
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

/**
 * Create a progress callback wired to the given TUI prompt adapter.
 *
 * Shared across all three installation modes (Clean, Project, Update)
 * to avoid duplicating the switch-on-event-type pattern.
 *
 * The callback:
 * - Sets up a progress bar once on the first stage_start event.
 * - Advances the bar per file via updateProgress.
 * - Logs structured events for commit start/complete and errors.
 * - Catches listener exceptions to ensure the progress bar is always
 *   completed, even if a downstream handler throws.
 *
 * @param userPrompt - TUI adapter implementing IUserPrompt.
 * @param label - Descriptive label for the progress bar (e.g. "Clean install...").
 * @returns A ProgressCallback suitable for FileMergeEngine.execute().
 */
export function createProgressCallback(userPrompt: IUserPrompt, label: string): ProgressCallback {
	let barStarted = false;
	return (event) => {
		try {
			switch (event.type) {
				case "stage_start":
					if (!barStarted) {
						userPrompt.showProgressBar(event.total, label);
						barStarted = true;
					}
					userPrompt.updateProgress(event.current, event.filePath);
					break;
				case "stage_complete":
					userPrompt.updateProgress(event.current, event.filePath);
					break;
				case "stage_skip":
					break;
				case "commit_start":
					userPrompt.logProgressEvent(`commit: Committing ${event.total} files atomically...`);
					break;
				case "commit_complete":
					// commit_complete is only emitted when total > 0 (FileMergeEngine
					// skips commit when nothing was staged), so the progress bar is
					// guaranteed to have been started by a prior stage_start.
					userPrompt.logProgressEvent(`commit: ${event.total} files committed`);
					userPrompt.completeProgress();
					break;
				case "error":
					userPrompt.logProgressEvent(`error: ${event.filePath}: ${event.message}`);
					userPrompt.completeProgress();
					break;
			}
		} catch {
			userPrompt.completeProgress();
		}
	};
}

/**
 * Wrap a domain MergeError into a generic Error with enriched context.
 *
 * MergeError carries structured phase/path information that would be lost
 * when converting to the generic Error returned by use cases. Appending
 * phase and (when known) path keeps the user-facing message actionable.
 */
export function wrapMergeError(err: MergeError): Error {
	const context = err.path ? ` during ${err.phase} of ${err.path}` : ` during ${err.phase}`;
	return new Error(`${err.message}${context}`);
}

/**
 * Show the optional-file checklist via the TUI.
 * Shared by Clean and Project install so the interactive branch (and the
 * "optional" category lookup) stays in one place.
 */
export async function promptForOptionals(userPrompt: IUserPrompt): Promise<readonly string[]> {
	return await userPrompt.selectOptional(getOptionalRules());
}
