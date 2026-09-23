import type { InstallSummaryInfo, VersionDisplayInfo } from "../types/displayContracts";

/**
 * Port for surfacing messages to the user: warnings, info, successes,
 * cancellations, errors, and one-shot informational screens.
 *
 * Segregated from IUserPrompt (ISP): consumers that only produce output
 * — post-install orchestration, status checks — depend on this narrow
 * port and never gain access to interactive methods.
 */
export interface IMessageDisplay {
	/**
	 * Display a warning message to the user.
	 */
	showWarning(message: string): void;

	/**
	 * Display an informational message.
	 */
	showInfo(message: string): void;

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
	 * Display the application intro header.
	 */
	showIntro(title: string): void;

	/**
	 * showVersionInfo — display detected local installation info to the user.
	 * Shown before the mode menu when version is detected.
	 */
	showVersionInfo(info: VersionDisplayInfo): void;

	/**
	 * showInstallSummary — display a pre-install summary of what will be
	 * installed. Called by InstallUseCaseBase between buildRules and merge.
	 * Informational only; no confirmation step.
	 *
	 * @param info - Summary data (packs, optionals, totals).
	 */
	showInstallSummary(info: InstallSummaryInfo): void;
}
