import type { FileRule } from "../../domain/entities/FileRule";

/**
 * Pack metadata for the pack selection screen.
 */
export interface PackOption {
	/** Pack identifier (e.g., "software-development") */
	readonly id: string;
	/** Human-readable name (e.g., "Software Development") */
	readonly name: string;
	/** Short description of pack contents */
	readonly description: string;
	/** Approximate agent count in this pack */
	readonly agentCount: number;
	/** Whether this pack is locked (already installed, can't be deselected in Update Option B) */
	readonly locked?: boolean;
}

/**
 * Display metadata for the local installation state.
 * Used to show "Current installation: v2.0.0, Packs: software-development" in the TUI.
 */
export interface VersionDisplayInfo {
	/** Detected local version (e.g., "2.0.0"), or null if not detected */
	readonly version: string | null;
	/** Packs installed locally (empty if pre-v2.0) */
	readonly installedPacks: readonly string[];
	/** Installation status for messaging */
	readonly status: "missing" | "pre-1.2.0" | "pre-2.0.0" | "v2.0+";
}

/**
 * Update sub-option choice.
 */
export type UpdateOption = "current" | "add" | "cancel";

export interface UpdateOptionChoice {
	readonly value: UpdateOption;
	readonly label: string;
	readonly hint?: string;
}

/**
 * Abstract TUI interactions for prompts, confirmations,
 * and file selection checklists.
 */
export interface IUserPrompt {
	/**
	 * Display a warning message to the user.
	 */
	showWarning(message: string): void;

	/**
	 * Display an informational message.
	 */
	showInfo(message: string): void;

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
	 * Display a multi-file progress bar.
	 * @param total - Total number of files to process.
	 * @param label - Optional label to display alongside the bar.
	 */
	showProgressBar(total: number, label?: string): void;

	/**
	 * Update the progress bar to show current file being processed.
	 * @param current - Number of files completed (0-indexed).
	 * @param filePath - Path of the file currently being processed.
	 */
	updateProgress(current: number, filePath: string): void;

	/**
	 * Mark the progress bar as complete. Cleans up any resources.
	 * Must be called after the last file is processed, even on error paths,
	 * to ensure the terminal cursor and TUI state are restored.
	 */
	completeProgress(): void;

	/**
	 * Log a structured progress event message.
	 * Messages should follow the pattern: "category: message"
	 * e.g., "commit: 47 files committed", "symlink: Created .opencode/agents"
	 * @param message - The event message to log (may include category prefix for styling).
	 */
	logProgressEvent(message: string): void;

	/**
	 * Display the application intro header.
	 */
	showIntro(title: string): void;

	/**
	 * Display the exit message on success.
	 */
	showSuccess(message: string): void;

	/**
	 * Display the exit message on cancellation.
	 */
	showCancel(message: string): void;

	/**
	 * Display the exit message on error.
	 */
	showError(message: string): void;

	/**
	 * Prompt the user to select an installation mode.
	 * @returns Selected mode ("clean" | "project" | "update"), or null if cancelled.
	 */
	promptForMode(): Promise<"clean" | "project" | "update" | null>;

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
	 * showVersionInfo — display detected local installation info to the user.
	 * Shown before the mode menu when version is detected.
	 */
	showVersionInfo(info: VersionDisplayInfo): void;

	/**
	 * selectUpdateOption — prompt user to choose between Update Option A (current packs) or Option B (add packs).
	 *
	 * @param options - Available update choices.
	 * @returns Selected option or null on cancel.
	 */
	selectUpdateOption(options: readonly UpdateOptionChoice[]): Promise<UpdateOption | null>;

	/**
	 * showInstallSummary — display a pre-install summary of what will be
	 * installed. Called by InstallUseCaseBase between buildRules and merge.
	 * Informational only; no confirmation step.
	 *
	 * @param info - Summary data (packs, optionals, totals).
	 */
	showInstallSummary(info: InstallSummaryInfo): void;
}

/**
 * Pre-install summary data displayed before the merge step.
 * The user has already confirmed overwrite + packs + optionals; this is
 * informational only (no confirmation step per FEV-22 decision #5).
 */
export interface InstallSummaryInfo {
	/** Packs to install with their agent counts */
	readonly packs: readonly { readonly id: string; readonly agentCount: number }[];
	/** Mandatory directories always included in the install */
	readonly mandatoryDirs: readonly string[];
	/** Optional files the user selected (empty if none) */
	readonly optionalFiles: readonly string[];
	/** Total estimated agents (sum of pack agentCount) */
	readonly totalAgents: number;
	/** Total estimated files (packs + mandatory + optionals) */
	readonly totalFiles: number;
}
