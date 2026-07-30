/**
 * Mode 2: Project Install — selectively merge template files
 * into an existing project. Preserves user customizations
 * by applying classification rules:
 *   - Mandatory always overwrites.
 *   - Standard copies only if missing.
 *   - Optional copies only if user selected AND missing.
 *
 * Extends InstallUseCaseBase via the Template Method pattern.
 * The three abstract hooks specialize the shared flow:
 * 1. buildRules: Include all non-optional + selected optionals (keep original categories).
 * 2. selectOptionals: force=true returns empty (no opt-in); else shows interactive menu.
 * 3. getSuccessMessage: "Project installation complete."
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
 * Mode 2: Project Install — selective merge into an existing project.
 * Preserves user customizations by respecting category rules.
 */
export class ProjectInstallUseCase extends InstallUseCaseBase {
	/**
	 * Include all non-optional rules plus selected optionals,
	 * preserving their original categories so the merge engine
	 * applies the correct behavior (mandatory=overwrite,
	 * standard=if-missing, optional=if-selected-and-missing).
	 *
	 * Unselected optional files are excluded from the rule set.
	 */
	protected buildRules(selectedOptionals: readonly string[]): readonly FileRule[] {
		return FILE_RULE_MANIFEST.filter(
			(r) => r.category !== "optional" || selectedOptionals.includes(r.path),
		);
	}

	/**
	 * Present optional file checklist.
	 * When force=true, returns empty (no interactive prompt, no optional files).
	 * Otherwise shows the interactive menu via IUserPrompt.
	 */
	protected async selectOptionals(force: boolean): Promise<readonly string[]> {
		if (force) return [];
		return await this.userPrompt.selectOptional(getRulesByCategory("optional"));
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
