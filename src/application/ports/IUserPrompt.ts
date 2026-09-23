import type { FileRule } from "../../domain/entities/FileRule";
import type {
	InstallMode,
	PackOption,
	UpdateOption,
	UpdateOptionChoice,
} from "../types/displayContracts";
import type { IMessageDisplay } from "./IMessageDisplay";
import type { IProgressReporter } from "./IProgressReporter";

/**
 * Contracts re-exported so existing consumers keep their import site.
 * The data shapes themselves live in ../types/displayContracts (type-only
 * module — shared by the segregated ports without import cycles).
 */
export type {
	InstallMode,
	InstallSummaryInfo,
	PackOption,
	UpdateOption,
	UpdateOptionChoice,
	VersionDisplayInfo,
} from "../types/displayContracts";

/**
 * Interactive TUI surface for prompts, confirmations and checklists.
 *
 * ISP split: pure output (messages) lives in IMessageDisplay, progress
 * reporting in IProgressReporter; IUserPrompt composes both and adds the
 * interactive decision methods. Consumers needing only output depend on
 * the narrow interfaces instead of the full prompt.
 */
export interface IUserPrompt extends IMessageDisplay, IProgressReporter {
	/**
	 * Ask the user for a yes/no confirmation.
	 * @param message - The question to display.
	 * @param defaultYes - Whether the default answer is Yes.
	 * @returns true if user confirmed.
	 */
	confirm(message: string, defaultYes?: boolean): Promise<boolean>;

	/**
	 * Present a multiselect checklist for optional files.
	 * @param options - List of optional FileRules to present.
	 * @returns Selected paths.
	 */
	selectOptional(options: readonly FileRule[]): Promise<string[]>;

	/**
	 * Prompt the user to select an installation mode.
	 * @returns Selected mode, or null if cancelled.
	 */
	promptForMode(): Promise<InstallMode | null>;

	/**
	 * selectPacks — present a multiselect checklist for agent packs.
	 * Used in Clean Install, Project Install, and Update Option B flows.
	 *
	 * @param options - List of pack options to present.
	 * @param preSelected - Pack IDs to pre-select (e.g., ["software-development"] for default).
	 * @returns Selected pack IDs. Empty array on cancel.
	 */
	selectPacks(
		options: readonly PackOption[],
		preSelected: readonly string[],
	): Promise<readonly string[]>;

	/**
	 * selectUpdateOption — prompt user to choose between Update Option A (current packs) or Option B (add packs).
	 *
	 * @param options - Available update choices.
	 * @returns Selected option or null on cancel.
	 */
	selectUpdateOption(options: readonly UpdateOptionChoice[]): Promise<UpdateOption | null>;
}
