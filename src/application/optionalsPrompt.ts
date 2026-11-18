/**
 * Optional-file checklist prompt shared by Clean and Project install.
 *
 * @module
 */

import { getOptionalRules } from "../domain/entities/FileRuleManifest";
import type { IUserPrompt } from "./ports/IUserPrompt";

/**
 * Show the optional-file checklist via the TUI.
 * Shared by Clean and Project install so the interactive branch (and the
 * "optional" category lookup) stays in one place.
 */
export function promptForOptionals(userPrompt: IUserPrompt): Promise<readonly string[]> {
	return userPrompt.selectOptional(getOptionalRules());
}
