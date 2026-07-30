/**
 * Mode 1: Clean Install — overwrites everything in the destination
 * with the complete template. All files are treated as mandatory
 * (overwrite destination regardless of existing state).
 *
 * Extends InstallUseCaseBase via the Template Method pattern.
 * The three abstract hooks specialize the shared flow:
 * 1. buildRules: All manifest rules → mandatory (selected optionals included).
 * 2. selectOptionals: force=true auto-selects all; else shows interactive menu.
 * 3. getSuccessMessage: "Clean installation complete."
 *
 * Flow (inherited from base):
 * checkWritable → confirmOverwrite → selectOptionals → buildRules →
 * mergeEngine.execute → runPostInstallSteps
 */

import type { FileRule } from "../../domain/entities/FileRule";
import { FILE_RULE_MANIFEST, getRulesByCategory } from "../../domain/entities/FileRuleManifest";
import { InstallUseCaseBase } from "./InstallUseCaseBase";

export type { BaseInstallOptions } from "./InstallUseCaseBase";

/**
 * Mode 1: Clean Install — overwrite everything with the full template.
 * All files are treated as mandatory regardless of their manifest category.
 */
export class CleanInstallUseCase extends InstallUseCaseBase {
	/**
	 * Transform the manifest: include all non-optional rules plus selected
	 * optionals, then mark every rule as mandatory (overwrite).
	 *
	 * Unselected optional files are excluded from the rule set entirely.
	 */
	protected buildRules(selectedOptionals: readonly string[]): readonly FileRule[] {
		return FILE_RULE_MANIFEST.filter(
			(r) => r.category !== "optional" || selectedOptionals.includes(r.path),
		).map((r) => ({ ...r, category: "mandatory" as const }));
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
		return await this.userPrompt.selectOptional(getRulesByCategory("optional"));
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
