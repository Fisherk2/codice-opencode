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
  selectOptional(options: FileRule[]): Promise<string[]>;

  /**
   * Show a spinner with a message during async operations.
   * @param message - Status message to display.
   */
  showSpinner(message: string): void;

  /**
   * Stop the current spinner.
   */
  stopSpinner(): void;

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
}
