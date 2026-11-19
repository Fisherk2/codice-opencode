/**
 * Overwrite confirmation prompt shared by Clean and Project install
 * (and by the update flow via updateHelpers).
 *
 * @module
 */

import type { IFileSystem } from "../domain/ports/IFileSystem";
import type { IUserPrompt } from "./ports/IUserPrompt";

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
 * @param flags - force: skip the prompt entirely. defaultYes: default answer
 *   for the confirm prompt — update mode defaults to Yes so a single keystroke
 *   accepts the update (plan Phase 4); install modes keep No.
 * @returns true if the operation should proceed, false if cancelled.
 */
export interface ConfirmOverwriteFlags {
	/** If true, skip the prompt. If false or undefined, check isEmpty and prompt. */
	readonly force?: boolean;
	/** Default answer for the confirm prompt. Defaults to false. */
	readonly defaultYes?: boolean;
}

export async function confirmOverwrite(
	fileSystem: IFileSystem,
	userPrompt: IUserPrompt,
	message: string,
	cancelMessage: string,
	flags: ConfirmOverwriteFlags = {},
): Promise<boolean> {
	if (flags.force) return true;

	const isEmpty = await fileSystem.isEmpty();
	if (isEmpty) return true;

	const confirmed = await userPrompt.confirm(message, flags.defaultYes ?? false);
	if (!confirmed) {
		await userPrompt.showCancel(cancelMessage);
	}
	return confirmed;
}
