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
import type { IUserPrompt, VersionDisplayInfo } from "../../../src/application/ports/IUserPrompt";
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
		showProgressBar: mockFn(() => {}),
		updateProgress: mockFn(() => {}),
		completeProgress: mockFn(() => {}),
		logProgressEvent: mockFn(() => {}),
		showSuccess: mockFn(() => {}),
		showError: mockFn(() => {}),
		selectPacks: mockFn(() => Promise.resolve(["software-development"] as const)),
		showVersionInfo: mockFn(() => {}),
		selectUpdateOption: mockFn(() =>
			Promise.resolve<"current" | "add" | "cancel" | null>("current"),
		),
	};
}

/** Version context for an up-to-date installation (update always allowed). */
const v2Context: VersionDisplayInfo = {
	version: "2.0.0",
	installedPacks: [],
	status: "v2.0+",
};

// -----------------------------------------------------------------------
// Interactive mode — user selects a mode
// -----------------------------------------------------------------------

describe("resolveInteractiveMode — interactive mode", () => {
	test('returns "clean" when user selects clean', async () => {
		const prompt = createMockUserPrompt(Promise.resolve("clean" as const));

		const result = await resolveInteractiveMode("interactive", prompt, "1.2.0", v2Context);

		expect(result).toBe("clean");
	});

	test('returns "project" when user selects project', async () => {
		const prompt = createMockUserPrompt(Promise.resolve("project" as const));

		const result = await resolveInteractiveMode("interactive", prompt, "1.2.0", v2Context);

		expect(result).toBe("project");
	});

	test('returns "update" when user selects update', async () => {
		const prompt = createMockUserPrompt(Promise.resolve("update" as const));

		const result = await resolveInteractiveMode("interactive", prompt, "1.2.0", v2Context);

		expect(result).toBe("update");
	});

	test("returns null when user cancels", async () => {
		const prompt = createMockUserPrompt(Promise.resolve(null));

		const result = await resolveInteractiveMode("interactive", prompt, "1.2.0", v2Context);

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

		const result = await resolveInteractiveMode("clean", prompt, "1.2.0", v2Context);

		expect(result).toBe("clean");
		expect(prompt.showIntro).not.toHaveBeenCalled();
		expect(prompt.promptForMode).not.toHaveBeenCalled();
	});

	test('returns "project" without prompting when mode is already "project"', async () => {
		const prompt = createMockUserPrompt(
			Promise.resolve<"clean" | "project" | "update" | null>(null),
		);

		const result = await resolveInteractiveMode("project", prompt, "1.2.0", v2Context);

		expect(result).toBe("project");
		expect(prompt.showIntro).not.toHaveBeenCalled();
		expect(prompt.promptForMode).not.toHaveBeenCalled();
	});

	test('returns "update" without prompting when mode is already "update"', async () => {
		const prompt = createMockUserPrompt(
			Promise.resolve<"clean" | "project" | "update" | null>(null),
		);

		const result = await resolveInteractiveMode("update", prompt, "1.2.0", v2Context);

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

		await resolveInteractiveMode("interactive", prompt, "1.2.0", v2Context);

		expect(prompt.showIntro).toHaveBeenCalledTimes(1);
		expect(prompt.showIntro).toHaveBeenCalledWith("Códice v1.2.0 — Opencode Workspace Installer");
	});

	test("showCancel is called when user cancels", async () => {
		const prompt = createMockUserPrompt(Promise.resolve(null));

		await resolveInteractiveMode("interactive", prompt, "1.2.0", v2Context);

		expect(prompt.showCancel).toHaveBeenCalledTimes(1);
		expect(prompt.showCancel).toHaveBeenCalledWith("Installation cancelled.");
	});
});

// -----------------------------------------------------------------------
// Update availability gate — blocks "update" for pre-v2.0 installations
// -----------------------------------------------------------------------

describe("resolveInteractiveMode — update availability gate", () => {
	test('blocks "update" and warns when installation is pre-2.0.0', async () => {
		const prompt = createMockUserPrompt(Promise.resolve("update" as const));
		const preV2Context: VersionDisplayInfo = {
			version: "1.4.0",
			installedPacks: [],
			status: "pre-2.0.0",
		};

		const result = await resolveInteractiveMode("interactive", prompt, "1.2.0", preV2Context);

		expect(result).toBeNull();
		expect(prompt.showWarning).toHaveBeenCalledWith(
			"Update is not available for this installation. Use Clean Install or Project Install instead.",
		);
	});

	test('blocks "update" when installation is missing', async () => {
		const prompt = createMockUserPrompt(Promise.resolve("update" as const));
		const missingContext: VersionDisplayInfo = {
			version: null,
			installedPacks: [],
			status: "missing",
		};

		const result = await resolveInteractiveMode("interactive", prompt, "1.2.0", missingContext);

		expect(result).toBeNull();
		expect(prompt.showWarning).toHaveBeenCalledTimes(1);
	});

	test('allows "update" when installation is v2.0+', async () => {
		const prompt = createMockUserPrompt(Promise.resolve("update" as const));

		const result = await resolveInteractiveMode("interactive", prompt, "1.2.0", v2Context);

		expect(result).toBe("update");
		expect(prompt.showWarning).not.toHaveBeenCalled();
	});
});
