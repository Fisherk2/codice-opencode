/**
 * Shared IUserPrompt test double for unit and integration tests.
 *
 * Single source for the mock prompt surface so per-file duplicates
 * stay in sync with the IUserPrompt port. Optional caller-owned
 * arrays record the message methods; per-call behavior is shaped
 * through PromptMockOptions.
 *
 * No `.test.` suffix: imported by tests, not executed.
 */

import type { Mock } from "bun:test";
import { mock as mockFn } from "bun:test";
import type { IUserPrompt } from "../../src/application/ports/IUserPrompt";

/** User prompt mock with all methods wrapped in bun:test mocks. */
export interface MockedUserPrompt extends IUserPrompt {
	showWarning: Mock<IUserPrompt["showWarning"]>;
	showInfo: Mock<IUserPrompt["showInfo"]>;
	confirm: Mock<IUserPrompt["confirm"]>;
	selectOptional: Mock<IUserPrompt["selectOptional"]>;
	showProgressBar: Mock<IUserPrompt["showProgressBar"]>;
	updateProgress: Mock<IUserPrompt["updateProgress"]>;
	completeProgress: Mock<IUserPrompt["completeProgress"]>;
	logProgressEvent: Mock<IUserPrompt["logProgressEvent"]>;
	showIntro: Mock<IUserPrompt["showIntro"]>;
	showSuccess: Mock<IUserPrompt["showSuccess"]>;
	showCancel: Mock<IUserPrompt["showCancel"]>;
	showError: Mock<IUserPrompt["showError"]>;
	promptForMode: Mock<IUserPrompt["promptForMode"]>;
	selectPacks: Mock<IUserPrompt["selectPacks"]>;
	showVersionInfo: Mock<IUserPrompt["showVersionInfo"]>;
	selectUpdateOption: Mock<IUserPrompt["selectUpdateOption"]>;
	showInstallSummary: Mock<IUserPrompt["showInstallSummary"]>;
}

/** User prompt mock that also exposes every recorded message list. */
export interface UserPromptMock extends MockedUserPrompt {
	readonly logEntries: string[];
	readonly warnings: string[];
	readonly infos: string[];
	readonly cancels: string[];
	readonly confirmCalls: string[];
	readonly successes: string[];
}

export interface PromptMockOptions {
	/** promptForMode() resolved value (default: null). */
	readonly promptResult?: Promise<"clean" | "project" | "update" | null>;
	/** confirm() resolved value (default: true). */
	readonly confirmResult?: boolean;
	/** selectOptional() default selection. */
	readonly selectOptionalDefault?: "none" | "all";
	/** Required when selectOptionalDefault is "all". */
	readonly allOptionalPaths?: readonly string[];
}

/** Build the shared IUserPrompt double with optional per-call behavior. */
export function createMockPrompt(options: PromptMockOptions = {}): UserPromptMock {
	const { promptResult = null, confirmResult = true } = options;
	const selectOptionalDefault = options.selectOptionalDefault ?? "none";
	const allOptionalPaths = "allOptionalPaths" in options ? options.allOptionalPaths : undefined;
	const logEntries: string[] = [];
	const warnings: string[] = [];
	const infos: string[] = [];
	const cancels: string[] = [];
	const confirmCalls: string[] = [];
	const successes: string[] = [];

	return {
		showWarning: mockFn((message: string) => {
			warnings.push(message);
		}),
		showInfo: mockFn((message: string) => {
			infos.push(message);
		}),
		confirm: mockFn((message: string) => {
			confirmCalls.push(message);
			return Promise.resolve(confirmResult);
		}),
		selectOptional: mockFn(() =>
			Promise.resolve(selectOptionalDefault === "all" ? [...(allOptionalPaths ?? [])] : []),
		),
		showProgressBar: mockFn(() => {}),
		updateProgress: mockFn(() => {}),
		completeProgress: mockFn(() => {}),
		logProgressEvent: mockFn((message: string) => {
			logEntries.push(message);
		}),
		showIntro: mockFn(() => {}),
		showSuccess: mockFn((message: string) => {
			successes.push(message);
		}),
		showCancel: mockFn((message: string) => {
			cancels.push(message);
		}),
		showError: mockFn(() => {}),
		promptForMode: mockFn(() => Promise.resolve(promptResult)),
		selectPacks: mockFn(() => Promise.resolve(["software-development"])),
		showVersionInfo: mockFn(() => {}),
		selectUpdateOption: mockFn(() => Promise.resolve("current")),
		showInstallSummary: mockFn(() => {}),
		get logEntries() {
			return logEntries;
		},
		get warnings() {
			return warnings;
		},
		get infos() {
			return infos;
		},
		get cancels() {
			return cancels;
		},
		get confirmCalls() {
			return confirmCalls;
		},
		get successes() {
			return successes;
		},
	};
}
