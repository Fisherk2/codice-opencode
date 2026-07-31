import type { FileRule } from "../../domain/entities/FileRule";

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
}
