/**
 * Unit tests for resolveInteractiveMode().
 *
 * Tests the interactive mode selection logic extracted from main().
 * Uses a mock IUserPrompt to verify:
 *   - Interactive mode prompts the user and returns their selection
 *   - Non-interactive modes pass through without prompting (no prompt side-effects)
 *   - Cancel returns null with appropriate cancellation message
 */

import { describe, expect, mock as mockFn, test } from "bun:test";
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import { resolveInteractiveMode } from "../../../src/cli/main";

// -----------------------------------------------------------------------
// Mock factory
// -----------------------------------------------------------------------

/**
 * Create a mock IUserPrompt whose promptForMode resolves to the given result.
 * All methods are wrapped in mockFn() so call-count and argument assertions
 * work out of the box.
 */
function createMockUserPrompt(
	promptResult: Promise<"clean" | "project" | "update" | null>,
): IUserPrompt {
	return {
		showIntro: mockFn(() => {}),
		promptForMode: mockFn(() => promptResult),
		showCancel: mockFn(() => {}),
		showWarning: mockFn(() => {}),
		showInfo: mockFn(() => {}),
		confirm: mockFn(() => Promise.resolve(true)),
		selectOptional: mockFn(() => Promise.resolve([])),
		showSpinner: mockFn(() => {}),
		stopSpinner: mockFn(() => {}),
		showProgressBar: mockFn(() => {}),
		updateProgress: mockFn(() => {}),
		completeProgress: mockFn(() => {}),
		logProgressEvent: mockFn(() => {}),
		showSuccess: mockFn(() => {}),
		showError: mockFn(() => {}),
	};
}

// -----------------------------------------------------------------------
// Interactive mode — user selects a mode
// -----------------------------------------------------------------------

describe("resolveInteractiveMode — interactive mode", () => {
	test('returns "clean" when user selects clean', async () => {
		const prompt = createMockUserPrompt(Promise.resolve("clean" as const));

		const result = await resolveInteractiveMode("interactive", prompt, "1.2.0");

		expect(result).toBe("clean");
	});

	test('returns "project" when user selects project', async () => {
		const prompt = createMockUserPrompt(Promise.resolve("project" as const));

		const result = await resolveInteractiveMode("interactive", prompt, "1.2.0");

		expect(result).toBe("project");
	});

	test('returns "update" when user selects update', async () => {
		const prompt = createMockUserPrompt(Promise.resolve("update" as const));

		const result = await resolveInteractiveMode("interactive", prompt, "1.2.0");

		expect(result).toBe("update");
	});

	test("returns null when user cancels", async () => {
		const prompt = createMockUserPrompt(Promise.resolve(null));

		const result = await resolveInteractiveMode("interactive", prompt, "1.2.0");

		expect(result).toBeNull();
	});
});

// -----------------------------------------------------------------------
// Non-interactive mode — passthrough without prompting
// -----------------------------------------------------------------------

describe("resolveInteractiveMode — non-interactive passthrough", () => {
	test('returns "clean" without prompting when mode is already "clean"', async () => {
		const prompt = createMockUserPrompt(
			Promise.resolve<"clean" | "project" | "update" | null>(null),
		);

		const result = await resolveInteractiveMode("clean", prompt, "1.2.0");

		expect(result).toBe("clean");
		expect(prompt.showIntro).not.toHaveBeenCalled();
		expect(prompt.promptForMode).not.toHaveBeenCalled();
	});

	test('returns "project" without prompting when mode is already "project"', async () => {
		const prompt = createMockUserPrompt(
			Promise.resolve<"clean" | "project" | "update" | null>(null),
		);

		const result = await resolveInteractiveMode("project", prompt, "1.2.0");

		expect(result).toBe("project");
		expect(prompt.showIntro).not.toHaveBeenCalled();
		expect(prompt.promptForMode).not.toHaveBeenCalled();
	});

	test('returns "update" without prompting when mode is already "update"', async () => {
		const prompt = createMockUserPrompt(
			Promise.resolve<"clean" | "project" | "update" | null>(null),
		);

		const result = await resolveInteractiveMode("update", prompt, "1.2.0");

		expect(result).toBe("update");
		expect(prompt.showIntro).not.toHaveBeenCalled();
		expect(prompt.promptForMode).not.toHaveBeenCalled();
	});
});

// -----------------------------------------------------------------------
// Interaction verifications
// -----------------------------------------------------------------------

describe("resolveInteractiveMode — prompt interaction verification", () => {
	test("showIntro is called with version string when mode is interactive", async () => {
		const prompt = createMockUserPrompt(Promise.resolve("clean" as const));

		await resolveInteractiveMode("interactive", prompt, "1.2.0");

		expect(prompt.showIntro).toHaveBeenCalledTimes(1);
		expect(prompt.showIntro).toHaveBeenCalledWith("Códice v1.2.0 — Opencode Workspace Installer");
	});

	test("showCancel is called when user cancels", async () => {
		const prompt = createMockUserPrompt(Promise.resolve(null));

		await resolveInteractiveMode("interactive", prompt, "1.2.0");

		expect(prompt.showCancel).toHaveBeenCalledTimes(1);
		expect(prompt.showCancel).toHaveBeenCalledWith("Installation cancelled.");
	});
});
