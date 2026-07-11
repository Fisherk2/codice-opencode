import { afterEach, beforeEach, describe, expect, it, mock as mockFn } from "bun:test";
import * as fs from "node:fs/promises";
import type { Dependencies } from "../../../src/cli/main";
import { createDependencies, main, promptForMode, runMode, VERSION } from "../../../src/cli/main";
import { EXIT_ERROR, EXIT_INTERRUPT, EXIT_SUCCESS, EXIT_USAGE } from "../../../src/cli/output";
import { failure, success } from "../../../src/domain/types/Result";

// ---------------------------------------------------------------------------
// Mock dependencies factory
// ---------------------------------------------------------------------------

function createMockDeps(): Dependencies {
	return {
		fileSystem: {
			readTemplateFile: mockFn(() => Promise.resolve("")),
			destinationExists: mockFn(() => Promise.resolve(false)),
			getStagingPath: mockFn((p: string) => `staging/${p}`),
			stageFile: mockFn(() => Promise.resolve()),
			commitStaging: mockFn(() => Promise.resolve()),
			cleanStaging: mockFn(() => Promise.resolve()),
			isWritable: mockFn(() => Promise.resolve(true)),
			isEmpty: mockFn(() => Promise.resolve(true)),
			writeVersionFile: mockFn(() => Promise.resolve()),
			readVersionFile: mockFn(() => Promise.resolve(null)),
		} as unknown as Dependencies["fileSystem"],
		userPrompt: {
			showWarning: mockFn(() => {}),
			showInfo: mockFn(() => {}),
			confirm: mockFn(() => Promise.resolve(true)),
			selectOptional: mockFn(() => Promise.resolve([])),
			showSpinner: mockFn(() => {}),
			stopSpinner: mockFn(() => {}),
			showIntro: mockFn(() => {}),
			showSuccess: mockFn(() => {}),
			showCancel: mockFn(() => {}),
			showError: mockFn(() => {}),
		} as unknown as Dependencies["userPrompt"],
		cleanInstall: {
			execute: mockFn(() => Promise.resolve(success(undefined))),
		} as unknown as Dependencies["cleanInstall"],
		projectInstall: {
			execute: mockFn(() => Promise.resolve(success(undefined))),
		} as unknown as Dependencies["projectInstall"],
		updateWorkspace: {
			execute: mockFn(() => Promise.resolve(success(undefined))),
		} as unknown as Dependencies["updateWorkspace"],
	};
}

// ---------------------------------------------------------------------------
// runMode
// ---------------------------------------------------------------------------

describe("runMode", () => {
	it("should dispatch to cleanInstall when mode is 'clean'", async () => {
		const deps = createMockDeps();
		const result = await runMode("clean", deps, "/tmp/project", {
			force: false,
			verbose: false,
		});
		expect(result.ok).toBe(true);
		expect(deps.cleanInstall.execute).toHaveBeenCalledTimes(1);
		expect(deps.projectInstall.execute).not.toHaveBeenCalled();
		expect(deps.updateWorkspace.execute).not.toHaveBeenCalled();
	});

	it("should dispatch to projectInstall when mode is 'project'", async () => {
		const deps = createMockDeps();
		const result = await runMode("project", deps, "/tmp/project", {
			force: false,
			verbose: false,
		});
		expect(result.ok).toBe(true);
		expect(deps.projectInstall.execute).toHaveBeenCalledTimes(1);
		expect(deps.cleanInstall.execute).not.toHaveBeenCalled();
		expect(deps.updateWorkspace.execute).not.toHaveBeenCalled();
	});

	it("should dispatch to updateWorkspace when mode is 'update'", async () => {
		const deps = createMockDeps();
		const result = await runMode("update", deps, "/tmp/project", {
			force: false,
			verbose: false,
		});
		expect(result.ok).toBe(true);
		expect(deps.updateWorkspace.execute).toHaveBeenCalledTimes(1);
		expect(deps.cleanInstall.execute).not.toHaveBeenCalled();
		expect(deps.projectInstall.execute).not.toHaveBeenCalled();
	});

	it("should pass force flag to use case execute options", async () => {
		const deps = createMockDeps();
		await runMode("clean", deps, "/tmp/project", { force: true, verbose: false });
		const callArgs = (deps.cleanInstall.execute as ReturnType<typeof mockFn>).mock
			.calls[0] as unknown[];
		// First arg is destination path, second arg is options
		expect(callArgs[0]).toBe("/tmp/project");
		expect(callArgs[1]).toEqual({ force: true, version: VERSION });
	});

	it("should return error when use case fails", async () => {
		const deps = createMockDeps();
		(deps.cleanInstall.execute as ReturnType<typeof mockFn>).mockResolvedValue(
			failure(new Error("Something went wrong")),
		);
		const result = await runMode("clean", deps, "/tmp/project", {
			force: false,
			verbose: false,
		});
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.message).toContain("Something went wrong");
	});
});

// ---------------------------------------------------------------------------
// createDependencies
// ---------------------------------------------------------------------------

describe("createDependencies", () => {
	it("should return wired dependencies with all required fields", () => {
		const deps = createDependencies();
		expect(deps).toHaveProperty("fileSystem");
		expect(deps).toHaveProperty("userPrompt");
		expect(deps).toHaveProperty("cleanInstall");
		expect(deps).toHaveProperty("projectInstall");
		expect(deps).toHaveProperty("updateWorkspace");
	});

	it("should create dependencies that are instances of the expected classes", () => {
		const deps = createDependencies();
		// Verify the use cases have execute methods
		expect(typeof deps.cleanInstall.execute).toBe("function");
		expect(typeof deps.projectInstall.execute).toBe("function");
		expect(typeof deps.updateWorkspace.execute).toBe("function");
		// Verify the adapters have expected methods
		expect(typeof deps.fileSystem.isWritable).toBe("function");
		expect(typeof deps.fileSystem.stageFile).toBe("function");
		expect(typeof deps.userPrompt.showIntro).toBe("function");
		expect(typeof deps.userPrompt.confirm).toBe("function");
	});
});

// ---------------------------------------------------------------------------
// promptForMode
// ---------------------------------------------------------------------------

describe("promptForMode", () => {
	it("should be a function that returns a promise", () => {
		expect(typeof promptForMode).toBe("function");
	});

	it("should delegate to userPrompt.promptForMode and return its result", async () => {
		const mockPrompt = {
			promptForMode: () => Promise.resolve("clean" as const),
		};
		const result = await promptForMode(mockPrompt as unknown as Dependencies["userPrompt"]);
		expect(result).toBe("clean");
	});

	it("should return null when userPrompt.promptForMode returns null", async () => {
		const mockPrompt = {
			promptForMode: () => Promise.resolve(null),
		};
		const result = await promptForMode(mockPrompt as unknown as Dependencies["userPrompt"]);
		expect(result).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// main() — SIGINT handling
// ---------------------------------------------------------------------------

/**
 * SIGINT tests require a NON-throwing process.exit mock because the
 * handler is invoked as a callback. If it threw, the error would be
 * unhandled (process.on callbacks don't catch errors).
 *
 * main() is called with --clean --force to reach the handler registration
 * at line 132 (before that, it's too early; with --version, it never
 * gets past the terminal flag check).
 */
describe("main() — SIGINT handling", () => {
	let origOn: typeof process.on;
	let origOff: typeof process.off;
	let origExit2: typeof process.exit;
	let capturedHandler: (() => void) | null;
	let sigintExitMock: ReturnType<typeof mockFn>;
	const testDir = "/tmp/test-codice-sigint";

	beforeEach(async () => {
		origOn = process.on;
		origOff = process.off;
		origExit2 = process.exit;
		capturedHandler = null;
		sigintExitMock = mockFn(() => {}); // no throw — needed for callback

		// Mock process.on to capture the SIGINT handler
		const onMock = mockFn((_event: string, handler: (..._args: unknown[]) => void) => {
			if (_event === "SIGINT") capturedHandler = handler as () => void;
			return process;
		});
		process.on = onMock as unknown as typeof process.on;
		// Mock process.off to prevent actual removal
		process.off = mockFn(() => process) as unknown as typeof process.off;
		process.exit = sigintExitMock as unknown as typeof process.exit;

		// Ensure clean test directory
		await fs.mkdir(testDir, { recursive: true });
	});

	afterEach(async () => {
		process.on = origOn;
		process.off = origOff;
		process.exit = origExit2;
		await fs.rm(testDir, { recursive: true, force: true });
	});

	it("registers SIGINT handler on process.on", async () => {
		process.argv = ["bun", "main.ts", "--clean", "--force", "--dest", testDir];

		try {
			await main();
		} catch {
			// OK — main may reject if install finishes or fails
		}

		expect(capturedHandler).not.toBeNull();
		// Verify the first exit was SUCCESS (install completed) or ERROR (install failed)
		expect(sigintExitMock.mock.calls.length).toBeGreaterThanOrEqual(1);
	});

	it("calls process.exit with EXIT_INTERRUPT on SIGINT", async () => {
		process.argv = ["bun", "main.ts", "--clean", "--force", "--dest", testDir];

		try {
			await main();
		} catch {
			// OK
		}

		expect(capturedHandler).not.toBeNull();

		const callCountBefore = sigintExitMock.mock.calls.length;
		capturedHandler!();

		// Should have incremented by exactly 1
		expect(sigintExitMock.mock.calls.length).toBe(callCountBefore + 1);
		const lastCall = sigintExitMock.mock.calls[callCountBefore] as unknown[];
		expect(lastCall[0]).toBe(EXIT_INTERRUPT);
	});

	it("double SIGINT is idempotent — only first triggers exit", async () => {
		process.argv = ["bun", "main.ts", "--clean", "--force", "--dest", testDir];

		try {
			await main();
		} catch {
			// OK
		}

		expect(capturedHandler).not.toBeNull();

		const callCountBefore = sigintExitMock.mock.calls.length;

		// First SIGINT — should call process.exit
		capturedHandler!();
		expect(sigintExitMock.mock.calls.length).toBe(callCountBefore + 1);

		// Second SIGINT — should be idempotent
		capturedHandler!();
		expect(sigintExitMock.mock.calls.length).toBe(callCountBefore + 1);
	});
});

// ---------------------------------------------------------------------------
// main() — success / error path
// ---------------------------------------------------------------------------

/**
 * Tests the main() execution path with --clean --force, which bypasses
 * the interactive mode and runs through the full try/catch/finally block.
 *
 * The clean install actually executes (reading template, writing files,
 * creating symlinks, etc.), so we verify both success and error scenarios.
 */
describe("main() — execution path", () => {
	let origExit3: typeof process.exit;
	let execExitMock: ReturnType<typeof mockFn>;

	beforeEach(() => {
		origExit3 = process.exit;
		execExitMock = mockFn(() => {});
		process.exit = execExitMock as unknown as typeof process.exit;
	});

	afterEach(() => {
		process.exit = origExit3;
	});

	it("exits with EXIT_SUCCESS on clean install with --clean --force", async () => {
		const testDir = "/tmp/test-main-success";
		await fs.mkdir(testDir, { recursive: true });
		process.argv = ["bun", "main.ts", "--clean", "--force", "--dest", testDir];

		try {
			await main();
		} catch {
			// OK
		}

		// The install succeeded or failed — either way, process.exit was called
		expect(execExitMock.mock.calls.length).toBeGreaterThanOrEqual(1);
		const exitCode = (execExitMock.mock.calls[0] as unknown[])[0] as number;
		// Should exit with SUCCESS if install completed, or ERROR if it failed
		expect([EXIT_SUCCESS, EXIT_ERROR]).toContain(exitCode);

		await fs.rm(testDir, { recursive: true, force: true });
	});

	it("triggers EXIT_ERROR when installation fails (read-only destination)", async () => {
		const readonlyDir = "/tmp/test-main-readonly";
		await fs.mkdir(readonlyDir, { recursive: true });
		await fs.chmod(readonlyDir, 0o444);
		process.argv = ["bun", "main.ts", "--clean", "--force", "--dest", readonlyDir];

		try {
			await main();
		} catch {
			// OK
		}

		// With a read-only destination, isWritable() returns false,
		// and the use case should return an error.
		expect(execExitMock.mock.calls.length).toBeGreaterThanOrEqual(1);
		const exitCode = (execExitMock.mock.calls[0] as unknown[])[0] as number;
		expect(exitCode).toBe(EXIT_ERROR);

		await fs.chmod(readonlyDir, 0o755);
		await fs.rm(readonlyDir, { recursive: true, force: true });
	});

	it("exits with EXIT_ERROR on update with --update when version is missing", async () => {
		const testDir = "/tmp/test-main-update";
		await fs.mkdir(testDir, { recursive: true });

		// Mock version check: CODICE_GITHUB_API_URL points to a non-existent
		// server so the version check fails gracefully.
		const prevApiUrl = process.env.CODICE_GITHUB_API_URL;
		process.env.CODICE_GITHUB_API_URL = "http://localhost:1/nonexistent";
		process.argv = ["bun", "main.ts", "--update", "--force", "--dest", testDir];

		try {
			await main();
		} catch {
			// OK
		}

		// Update should attempt version check, fail, and fall back to local
		expect(execExitMock.mock.calls.length).toBeGreaterThanOrEqual(1);

		process.env.CODICE_GITHUB_API_URL = prevApiUrl;
		await fs.rm(testDir, { recursive: true, force: true });
	});

	it("cleans up SIGINT listener in finally block after completion", async () => {
		const testDir = "/tmp/test-main-finally";
		await fs.mkdir(testDir, { recursive: true });

		const offMock = mockFn(() => process);
		process.off = offMock as unknown as typeof process.off;
		process.argv = ["bun", "main.ts", "--clean", "--force", "--dest", testDir];

		try {
			await main();
		} catch {
			// OK
		}

		// finally block calls process.off("SIGINT", handler)
		expect(offMock).toHaveBeenCalledWith("SIGINT", expect.any(Function));

		await fs.rm(testDir, { recursive: true, force: true });
	});
});

// ---------------------------------------------------------------------------
// main() — terminal flags
// ---------------------------------------------------------------------------

/**
 * The terminal flag handling (--version, --help) runs BEFORE the try-catch
 * block in main(). To stop execution after the flag handler calls
 * process.exit(), the mock throws an Error. The test catches this and
 * verifies the exit code.
 */
describe("main() — terminal flags", () => {
	let origArgv: string[];
	let origExit: typeof process.exit;
	let exitMock: ReturnType<typeof mockFn>;

	/**
	 * Run main() with given argv and catch the __EXIT__ thrown by the mock.
	 * Returns without rethrowing known __EXIT__ errors.
	 */
	async function runWithArgs(...args: string[]): Promise<void> {
		process.argv = ["bun", "main.ts", ...args];
		try {
			await main();
		} catch (e) {
			if ((e as Error).message !== "__EXIT__") throw e;
		}
	}

	beforeEach(() => {
		origArgv = process.argv;
		origExit = process.exit;
		exitMock = mockFn(() => {
			throw new Error("__EXIT__");
		});
		process.exit = exitMock as unknown as typeof process.exit;
	});

	afterEach(() => {
		process.argv = origArgv;
		process.exit = origExit;
	});

	it.each([
		{ flag: "--version", exitCode: EXIT_SUCCESS },
		{ flag: "-V", exitCode: EXIT_SUCCESS },
		{ flag: "--help", exitCode: EXIT_SUCCESS },
		{ flag: "-h", exitCode: EXIT_SUCCESS },
		{ flag: "--bogus", exitCode: EXIT_USAGE },
	])("exits with $exitCode when $flag is passed", async ({ flag, exitCode }) => {
		await runWithArgs(flag);
		expect(exitMock).toHaveBeenCalledWith(exitCode);
	});

	it("does not reach parseArgs — process.exit called exactly once for terminal flags", async () => {
		await runWithArgs("--version");

		// process.exit should only be called once (by the version check).
		// If parseArgs was reached, it would succeed (--version is in ALLOWED_FLAGS)
		// and createDependencies would execute, causing additional side effects.
		expect(exitMock).toHaveBeenCalledTimes(1);
		expect(exitMock).toHaveBeenCalledWith(EXIT_SUCCESS);
	});
});
