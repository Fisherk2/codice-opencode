/**
 * Unit tests for main() catch block (unexpected thrown errors).
 *
 * Uses mock.module to inject a throwing use case into the DI container
 * BEFORE importing main(), so that runMode() throws inside the try block
 * and the catch block handles it.
 *
 * This covers lines 179-182 in main.ts (the catch-block path).
 */

import { describe, expect, mock, spyOn, test } from "bun:test";

// -----------------------------------------------------------------------
// Mock the container module BEFORE importing main
// -----------------------------------------------------------------------

const mockExecute = () => {
	throw new Error("Unexpected internal error");
};

mock.module("../../../src/cli/container", () => ({
	createDependencies: () => ({
		fileSystem: {} as Record<string, unknown>,
		userPrompt: {
			showIntro: () => {},
			showWarning: () => {},
			showInfo: () => {},
			confirm: () => Promise.resolve(true),
			selectOptional: () => Promise.resolve([]),
			showProgressBar: () => {},
			updateProgress: () => {},
			completeProgress: () => {},
			logProgressEvent: () => {},
			promptForMode: () => Promise.resolve("clean" as const),
			showSuccess: () => {},
			showCancel: () => {},
			showError: () => {},
		},
		cleanInstall: { execute: mockExecute },
		projectInstall: { execute: mockExecute },
		updateWorkspace: { execute: mockExecute },
	}),
}));

// -----------------------------------------------------------------------
// Now import main — it will see the mocked createDependencies
// -----------------------------------------------------------------------

import { main } from "../../../src/cli/main";
import { EXIT_ERROR } from "../../../src/cli/output";

// -----------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------

describe("main() — catch block", () => {
	let origArgv: string[];
	let origExit: typeof process.exit;
	let exitCode = -1;

	test("handles unexpected throw from use case with Fatal error and EXIT_ERROR", async () => {
		origArgv = process.argv;
		origExit = process.exit;
		exitCode = -1;

		// Capture process.exit code
		process.exit = ((code: number) => {
			exitCode = code;
		}) as unknown as typeof process.exit;

		// Spy on console.error to verify the "Fatal error" message
		const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

		process.argv = ["bun", "main.ts", "--clean", "--force", "--dest", "/tmp/test-main-catch"];

		try {
			await main();
		} catch {
			// main() may or may not throw depending on how the mock resolves
		}

		// Verify catch block handled the error
		expect(exitCode).toBe(EXIT_ERROR);

		// Verify "Fatal error" message was logged
		const fatalCalls = consoleSpy.mock.calls.filter(
			(args: string[]) => args[0] && String(args[0]).includes("Fatal error"),
		);
		expect(fatalCalls.length).toBeGreaterThanOrEqual(1);
		expect(String(fatalCalls[0]?.[0])).toContain("Unexpected internal error");

		consoleSpy.mockRestore();

		// Restore
		process.exit = origExit;
		process.argv = origArgv;
	});
});
