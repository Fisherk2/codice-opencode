/**
 * Mode 2: Project Install — selectively merge template files
 * into an existing project. Preserves user customizations
 * by applying classification rules:
 *   - Mandatory always overwrites.
 *   - Standard copies only if missing.
 *   - Optional copies only if user selected AND missing.
 *
 * Extends InstallUseCaseBase via the Template Method pattern.
 * The four abstract hooks specialize the shared flow:
 * 1. selectPacks: force=true uses default pack; else shows interactive menu.
 * 2. buildRules: Include selected packs + optionals (keep original categories).
 * 3. selectOptionals: force=true returns empty (no opt-in); else shows interactive menu.
 * 4. getSuccessMessage: "Project installation complete."
 *
 * Flow (inherited from base):
 * checkWritable → confirmOverwrite → selectPacks → selectOptionals →
 * buildRules → mergeEngine.execute → runPostInstallSteps
 */

import type { FileRule } from "../../domain/entities/FileRule";
import {
	FILE_RULE_MANIFEST,
	filterByPacks,
	isRuleSelected,
} from "../../domain/entities/FileRuleManifest";
import { promptForOptionals } from "../helpers";
import { DEFAULT_PACKS, promptForPackSelection } from "../packOptions";
import { InstallUseCaseBase } from "./InstallUseCaseBase";

export type { BaseInstallOptions } from "./InstallUseCaseBase";

/**
 * Mode 2: Project Install — selective merge into an existing project.
 * Preserves user customizations by respecting category rules.
 */
export class ProjectInstallUseCase extends InstallUseCaseBase {
	/**
	 * Pack selection: force=true uses ONLY the default pack (no opt-in for
	 * additional packs); otherwise shows the interactive menu with the
	 * default pack pre-selected.
	 */
	protected async selectPacks(force: boolean): Promise<readonly string[]> {
		if (force) {
			return [...DEFAULT_PACKS];
		}
		return await promptForPackSelection(this.userPrompt);
	}

	/**
	 * Include selected packs + non-optional rules + selected optionals,
	 * preserving their original categories so the merge engine applies the
	 * correct behavior (mandatory=overwrite, pack=always, standard=if-missing,
	 * optional=if-selected-and-missing). Unselected packs are excluded via
	 * filterByPacks(); unselected optionals via isRuleSelected().
	 */
	protected buildRules(
		selectedPacks: readonly string[],
		selectedOptionals: readonly string[],
	): readonly FileRule[] {
		return filterByPacks(FILE_RULE_MANIFEST, selectedPacks).filter((r) =>
			isRuleSelected(r, selectedOptionals),
		);
	}

	/**
	 * Present optional file checklist.
	 * When force=true, returns empty (no interactive prompt, no optional files).
	 * Otherwise shows the interactive menu via IUserPrompt.
	 */
	protected async selectOptionals(force: boolean): Promise<readonly string[]> {
		if (force) return [];
		return await promptForOptionals(this.userPrompt);
	}

	protected getSuccessMessage(): string {
		return "Project installation complete.";
	}

	// -- Overridable defaults for mode-specific copy --

	protected override getConfirmMessage(destinationPath: string): string {
		return `The destination directory "${destinationPath}" is not empty. Some existing files may be overwritten. Continue?`;
	}

	protected override getCancelMessage(): string {
		return "Project installation cancelled by user.";
	}

	protected override getProgressLabel(): string {
		return "Project install...";
	}
}
