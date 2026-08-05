/**
 * Unit tests for main() catch block (unexpected thrown errors).
 *
 * Injects a throwing use case into the DI container via mock.module so that
 * runMode() throws inside main()'s try block and the catch block handles it.
 *
 * This covers the catch-block path in main.ts (Fatal error + EXIT_ERROR).
 *
 * ---------------------------------------------------------------------------
 * WHY THE MOCK IS SCOPED AND RESTORED
 * ---------------------------------------------------------------------------
 * Bun's `mock.module()` mutates the process-global module registry and is NOT
 * restored automatically between test files. Every test file loaded after this
 * one in the same `bun test` process would keep seeing the stubbed container.
 *
 * That leak caused macOS-only CI failures: Bun walks test files in filesystem
 * order, which differs per filesystem (ext4/NTFS vs APFS). On macOS this file
 * loaded BEFORE tests/integration/cli/main.test.ts, so createDependencies()
 * there returned the stub — `fileSystem` was `{}` (no isWritable) and every
 * use case threw "Unexpected internal error" (exit 1 instead of EXIT_SUCCESS).
 *
 * The mock is therefore installed in beforeAll and undone in afterAll, so the
 * suite stays order-independent across platforms.
 */

import { afterAll, beforeAll, describe, expect, mock, spyOn, test } from "bun:test";

// Imported (and captured) BEFORE any mock.module call so the genuine
// implementation can be put back once this file's tests are done.
import * as containerModule from "../../../src/cli/container";
import { main } from "../../../src/cli/main";
import { EXIT_ERROR } from "../../../src/cli/output";

const CONTAINER_MODULE_PATH = "../../../src/cli/container";

const realCreateDependencies = containerModule.createDependencies;

// -----------------------------------------------------------------------
// Container stub
// -----------------------------------------------------------------------

const mockExecute = () => {
	throw new Error("Unexpected internal error");
};

const mockExecuteNonError = () => {
	throw "string error value";
};

function installContainerStub(): void {
	mock.module(CONTAINER_MODULE_PATH, () => ({
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
}

function restoreContainerModule(): void {
	mock.module(CONTAINER_MODULE_PATH, () => ({
		createDependencies: realCreateDependencies,
	}));
}

// -----------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------

describe("main() — catch block", () => {
	beforeAll(installContainerStub);
	afterAll(restoreContainerModule);

	test("handles unexpected throw from use case with Fatal error and EXIT_ERROR", async () => {
		const origArgv = process.argv;
		const origExit = process.exit;
		let exitCode = -1;

		// Capture process.exit code
		process.exit = ((code: number) => {
			exitCode = code;
		}) as unknown as typeof process.exit;

		// Spy on console.error to verify the "Fatal error" message
		const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

		process.argv = ["bun", "main.ts", "--clean", "--force", "--dest", "/tmp/test-main-catch"];

		// Snapshotted inside `finally` because mockRestore() also clears the
		// recorded calls, and the restore must happen even if main() throws.
		let fatalMessages: string[] = [];

		try {
			await main();
		} catch {
			// main() may or may not throw depending on how the mock resolves
		} finally {
			fatalMessages = consoleSpy.mock.calls
				.map((args: unknown[]) => String(args[0] ?? ""))
				.filter((message: string) => message.includes("Fatal error"));
			consoleSpy.mockRestore();
			process.exit = origExit;
			process.argv = origArgv;
		}

		// Verify catch block handled the error
		expect(exitCode).toBe(EXIT_ERROR);

		// Verify "Fatal error" message was logged
		expect(fatalMessages.length).toBeGreaterThanOrEqual(1);
		expect(fatalMessages[0]).toContain("Unexpected internal error");
	});

	test("handles non-Error throw via String() conversion in catch block", async () => {
		// Install a stub that throws a non-Error value (string) to cover
		// the String(error) branch in the catch block (line 184 of main.ts)
		mock.module(CONTAINER_MODULE_PATH, () => ({
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
				cleanInstall: { execute: mockExecuteNonError },
				projectInstall: { execute: mockExecuteNonError },
				updateWorkspace: { execute: mockExecuteNonError },
			}),
		}));

		const origArgv = process.argv;
		const origExit = process.exit;
		let exitCode = -1;

		process.exit = ((code: number) => {
			exitCode = code;
		}) as unknown as typeof process.exit;

		const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

		process.argv = [
			"bun",
			"main.ts",
			"--clean",
			"--force",
			"--dest",
			"/tmp/test-main-catch-nonerror",
		];

		let fatalMessages: string[] = [];

		try {
			await main();
		} catch {
			// main() may or may not throw depending on how the mock resolves
		} finally {
			fatalMessages = consoleSpy.mock.calls
				.map((args: unknown[]) => String(args[0] ?? ""))
				.filter((message: string) => message.includes("Fatal error"));
			consoleSpy.mockRestore();
			process.exit = origExit;
			process.argv = origArgv;
			// Restore original stub for other tests in this suite
			installContainerStub();
		}

		// Verify catch block handled the non-Error throw
		expect(exitCode).toBe(EXIT_ERROR);

		// Verify "Fatal error" message was logged with String()-converted value
		expect(fatalMessages.length).toBeGreaterThanOrEqual(1);
		expect(fatalMessages[0]).toContain("string error value");
	});
});
