import * as clack from "@clack/prompts";
import type { IUserPrompt } from "../../application/ports/IUserPrompt";
import type { FileRule } from "../../domain/entities/FileRule";

/**
 * @clack/prompts adapter implementing the IUserPrompt interface.
 * Provides an interactive TUI for the installer using @clack/prompts primitives.
 *
 * Display methods (showWarning, showInfo, showIntro, showSuccess, showCancel,
 * showError) are synchronous — they do not wait for user interaction.
 * Interactive methods (confirm, selectOptional) return promises.
 */
export class ClackPromptsAdapter implements IUserPrompt {
	private spinner: ReturnType<typeof clack.spinner> | null = null;

	/**
	 * Display a warning message using @clack/prompts note() with yellow styling.
	 */
	showWarning(message: string): void {
		clack.note(message, "⚠️  Warning");
	}

	/**
	 * Display an informational message using @clack/prompts note().
	 */
	showInfo(message: string): void {
		clack.note(message, "Info");
	}

	/**
	 * Ask the user for a yes/no confirmation.
	 * @param message - The question to display.
	 * @param defaultYes - Whether the default answer is Yes.
	 * @returns true if user confirmed.
	 */
	async confirm(message: string, defaultYes?: boolean): Promise<boolean> {
		const result = await clack.confirm({
			message,
			initialValue: defaultYes ?? true,
		});

		if (clack.isCancel(result)) {
			return false;
		}

		return result as boolean;
	}

	/**
	 * Present a multiselect checklist for optional files.
	 * @param options - List of optional FileRules to present.
	 * @returns Selected paths (the `path` property of each selected FileRule).
	 */
	async selectOptional(options: readonly FileRule[]): Promise<string[]> {
		if (options.length === 0) {
			return [];
		}

		// Build options for the multiselect prompt
		const promptOptions: { value: string; label: string; hint?: string }[] = options.map(
			(rule) => ({
				value: rule.path,
				label: rule.path,
				hint: rule.description || undefined,
			}),
		);

		const result = await clack.multiselect({
			message: "Select optional files to install:",
			options: promptOptions,
			required: false,
		});

		if (clack.isCancel(result)) {
			return [];
		}

		return result as string[];
	}

	/**
	 * Show a spinner with a message during async operations.
	 */
	showSpinner(message: string): void {
		if (this.spinner) {
			this.spinner.stop();
		}
		this.spinner = clack.spinner();
		this.spinner.start(message);
	}

	/**
	 * Stop the current spinner.
	 */
	stopSpinner(): void {
		if (this.spinner) {
			this.spinner.stop();
			this.spinner = null;
		}
	}

	/**
	 * Display the application intro header.
	 */
	showIntro(title: string): void {
		clack.intro(title);
	}

	/**
	 * Display the exit message on success.
	 */
	showSuccess(message: string): void {
		clack.outro(`✅ ${message}`);
	}

	/**
	 * Display the exit message on cancellation.
	 */
	showCancel(message: string): void {
		clack.cancel(message);
	}

	/**
	 * Display the exit message on error.
	 */
	showError(message: string): void {
		clack.cancel(`❌ ${message}`);
	}

	/**
	 * Present the mode selection menu to the user.
	 * Implements IUserPrompt.promptForMode().
	 * @returns Selected mode, or null if user cancelled.
	 */
	async promptForMode(): Promise<"clean" | "project" | "update" | null> {
		const result = await clack.select({
			message: "Select installation mode:",
			options: [
				{
					value: "clean" as const,
					label: "Clean Install",
					hint: "Complete template overwrite (all files)",
				},
				{
					value: "project" as const,
					label: "Project Install",
					hint: "Selective merge with file classification",
				},
				{
					value: "update" as const,
					label: "Update Workspace",
					hint: "Update to latest template version",
				},
			],
		});

		if (clack.isCancel(result)) return null;
		return result as "clean" | "project" | "update";
	}
}
