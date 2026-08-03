import * as clack from "@clack/prompts";
import type { IUserPrompt } from "../../application/ports/IUserPrompt";
import type { FileRule } from "../../domain/entities/FileRule";

/** @clack/prompts adapter implementing IUserPrompt. */

/** Mode-selection menu options — hoisted to avoid re-allocation on every call. */
const MODE_OPTIONS = [
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
];

/** Progress-event category → @clack/prompts display call. Looked up by logProgressEvent via Object.hasOwn. */
const PROGRESS_EMITTERS: Record<string, (text: string) => void> = {
	commit: (text) => clack.log.success(`✓ ${text}`),
	symlink: (text) => clack.log.success(`🔗 ${text}`),
	gitignore: (text) => clack.log.info(`📄 ${text}`),
	error: (text) => clack.log.error(`✗ ${text}`),
	skip: (text) => clack.log.warn(`⊘ ${text}`),
};

export class ClackPromptsAdapter implements IUserPrompt {
	// biome-ignore lint/complexity/noUselessConstructor: Bun coverage artifact (REF: TECH_DEBT.md TD-1.2)
	constructor() {}

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

		return result;
	}

	private progressBar: ReturnType<typeof clack.progress> | null = null;

	showProgressBar(total: number, label?: string): void {
		this.progressBar = clack.progress({ max: total, style: "heavy" });
		if (label) this.progressBar.start(label);
	}

	updateProgress(_current: number, filePath: string): void {
		if (!this.progressBar) return;
		this.progressBar.advance(1, `Processing: ${filePath}`);
	}

	completeProgress(): void {
		if (this.progressBar) {
			this.progressBar.stop();
			this.progressBar = null;
		}
	}

	logProgressEvent(message: string): void {
		const colonIdx = message.indexOf(":");
		if (colonIdx > 0) {
			const category = message.slice(0, colonIdx).trim().toLowerCase();
			const text = message.slice(colonIdx + 1).trim();
			if (Object.hasOwn(PROGRESS_EMITTERS, category)) {
				PROGRESS_EMITTERS[category]!(text);
				return;
			}
		}
		clack.log.step(message);
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

	/** Present mode selection menu. Returns selected mode or null on cancel. */
	async promptForMode(): Promise<"clean" | "project" | "update" | null> {
		const result = await clack.select({
			message: "Select installation mode:",
			options: MODE_OPTIONS,
		});
		if (clack.isCancel(result)) return null;
		return result as "clean" | "project" | "update";
	}
}
