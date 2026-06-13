import type { FileRule } from "../../domain/entities/FileRule";
import type { IUserPrompt } from "../../application/ports/IUserPrompt";

/**
 * @clack/prompts adapter implementing the IUserPrompt interface.
 * Provides an interactive TUI for the installer.
 */
export class ClackPromptsAdapter implements IUserPrompt {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showWarning(_message: string): void {
    // TODO: Implement with @clack/prompts note()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showInfo(_message: string): void {
    // TODO: Implement with @clack/prompts note()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  confirm(_message: string, _defaultYes?: boolean): Promise<boolean> {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectOptional(_options: FileRule[]): Promise<string[]> {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showSpinner(_message: string): void {
    // TODO: Implement with @clack/prompts spinner()
  }

  stopSpinner(): void {
    // TODO: Implement spinner stop
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showIntro(_title: string): void {
    // TODO: Implement with @clack/prompts intro()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showSuccess(_message: string): void {
    // TODO: Implement with @clack/prompts outro()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showCancel(_message: string): void {
    // TODO: Implement with @clack/prompts cancel()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showError(_message: string): void {
    // TODO: Implement with @clack/prompts cancel()
  }
}
