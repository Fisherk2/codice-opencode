import type { IUserPrompt } from "../../application/ports/IUserPrompt";
import type { FileRule } from "../../domain/entities/FileRule";

/**
 * @clack/prompts adapter implementing the IUserPrompt interface.
 * Provides an interactive TUI for the installer.
 */
export class ClackPromptsAdapter implements IUserPrompt {
	showWarning(_message: string): void {
		// TODO: Implement with @clack/prompts note()
	}

	showInfo(_message: string): void {
		// TODO: Implement with @clack/prompts note()
	}

	confirm(_message: string, _defaultYes?: boolean): Promise<boolean> {
		// TODO: Implement with @clack/prompts confirm()
		return Promise.resolve(true);
	}

	selectOptional(_options: FileRule[]): Promise<string[]> {
		// TODO: Implement with @clack/prompts multiselect()
		return Promise.resolve([]);
	}

	showSpinner(_message: string): void {
		// TODO: Implement with @clack/prompts spinner()
	}

	stopSpinner(): void {
		// TODO: Implement spinner stop
	}

	showIntro(_title: string): void {
		// TODO: Implement with @clack/prompts intro()
	}

	showSuccess(_message: string): void {
		// TODO: Implement with @clack/prompts outro()
	}

	showCancel(_message: string): void {
		// TODO: Implement with @clack/prompts cancel()
	}

	showError(_message: string): void {
		// TODO: Implement with @clack/prompts cancel()
	}
}
