/**
 * Port for reporting processing progress to the user.
 *
 * Segregated from IUserPrompt (ISP): consumers that only report progress
 * — post-install orchestration, merge engines — depend on this narrow
 * port instead of the full prompt surface.
 */
export interface IProgressReporter {
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
}
