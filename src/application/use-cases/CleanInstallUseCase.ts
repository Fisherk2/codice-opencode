/**
 * Mode 1: Clean Install — overwrites everything in the destination
 * with the complete template. All files are treated as mandatory
 * (overwrite destination regardless of existing state).
 *
 * Extends InstallUseCaseBase via the Template Method pattern.
 * The four abstract hooks specialize the shared flow:
 * 1. selectPacks: force=true auto-selects all packs; else shows interactive menu.
 * 2. buildRules: All manifest rules → mandatory (selected packs + optionals included).
 * 3. selectOptionals: force=true auto-selects all; else shows interactive menu.
 * 4. getSuccessMessage: "Clean installation complete."
 *
 * Flow (inherited from base):
 * checkWritable → confirmOverwrite → selectPacks → selectOptionals →
 * buildRules → mergeEngine.execute → runPostInstallSteps
 */

import type { FileRule } from "../../domain/entities/FileRule";
import {
	FILE_RULE_MANIFEST,
	filterByPacks,
	getAllPackIds,
	getRulesByCategory,
	isRuleSelected,
} from "../../domain/entities/FileRuleManifest";
import { promptForOptionals } from "../helpers";
import { promptForPackSelection } from "../packOptions";
import { InstallUseCaseBase } from "./InstallUseCaseBase";

export type { BaseInstallOptions } from "./InstallUseCaseBase";

/**
 * Mode 1: Clean Install — overwrite everything with the full template.
 * All files are treated as mandatory regardless of their manifest category.
 */
export class CleanInstallUseCase extends InstallUseCaseBase {
	/**
	 * Pack selection: force=true auto-selects all packs (no interaction);
	 * otherwise shows the interactive menu with the default pack pre-selected.
	 */
	protected async selectPacks(force: boolean): Promise<readonly string[]> {
		if (force) {
			return getAllPackIds();
		}
		return await promptForPackSelection(this.userPrompt);
	}

	/**
	 * Transform the manifest: include selected packs + selected optionals,
	 * then mark every rule as mandatory (overwrite). Unselected packs are
	 * excluded via filterByPacks(); unselected optionals via isRuleSelected().
	 */
	protected buildRules(
		selectedPacks: readonly string[],
		selectedOptionals: readonly string[],
	): readonly FileRule[] {
		return filterByPacks(FILE_RULE_MANIFEST, selectedPacks)
			.filter((r) => isRuleSelected(r, selectedOptionals))
			.map((r) => ({ ...r, category: "mandatory" }));
	}

	/**
	 * Present optional file checklist.
	 * When force=true, auto-selects all optional files (no interaction).
	 * Otherwise shows the interactive menu via IUserPrompt.
	 */
	protected async selectOptionals(force: boolean): Promise<readonly string[]> {
		if (force) {
			return getRulesByCategory("optional").map((r) => r.path);
		}
		return await promptForOptionals(this.userPrompt);
	}

	protected getSuccessMessage(): string {
		return "Clean installation complete.";
	}

	// -- Overridable defaults for mode-specific copy --

	protected override getConfirmMessage(destinationPath: string): string {
		return `The destination directory "${destinationPath}" is not empty. All existing files may be overwritten. Continue?`;
	}

	protected override getCancelMessage(): string {
		return "Clean installation cancelled by user.";
	}

	protected override getProgressLabel(): string {
		return "Clean install...";
	}

	protected override getRetryHint(): boolean {
		return true;
	}
}
