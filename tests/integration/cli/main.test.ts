import { describe, expect, it, mock as mockFn } from "bun:test";
import type { Dependencies } from "../../../src/cli/main";
import {
	createDependencies,
	parseArgs,
	promptForMode,
	runMode,
	VERSION,
} from "../../../src/cli/main";
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
// parseArgs
// ---------------------------------------------------------------------------

describe("parseArgs", () => {
	it("should return interactive mode when no flags are given", () => {
		const result = parseArgs([]);
		expect(result).not.toBeNull();
		expect(result!.mode).toBe("interactive");
		expect(result!.options.force).toBe(false);
		expect(result!.options.verbose).toBe(false);
	});

	it("should return clean mode for --clean flag", () => {
		const result = parseArgs(["--clean"]);
		expect(result).not.toBeNull();
		expect(result!.mode).toBe("clean");
	});

	it("should return project mode for --project flag", () => {
		const result = parseArgs(["--project"]);
		expect(result).not.toBeNull();
		expect(result!.mode).toBe("project");
	});

	it("should return update mode for --update flag", () => {
		const result = parseArgs(["--update"]);
		expect(result).not.toBeNull();
		expect(result!.mode).toBe("update");
	});

	it("should extract --force flag", () => {
		const result = parseArgs(["--clean", "--force"]);
		expect(result).not.toBeNull();
		expect(result!.options.force).toBe(true);
	});

	it("should extract --verbose flag", () => {
		const result = parseArgs(["--project", "--verbose"]);
		expect(result).not.toBeNull();
		expect(result!.options.verbose).toBe(true);
	});

	it("should allow combined --force and --verbose flags", () => {
		const result = parseArgs(["--update", "--force", "--verbose"]);
		expect(result).not.toBeNull();
		expect(result!.options.force).toBe(true);
		expect(result!.options.verbose).toBe(true);
	});

	it("should return null for unknown positional arguments", () => {
		const result = parseArgs(["unknown-arg"]);
		expect(result).toBeNull();
	});

	it("should return null for unknown flags", () => {
		const result = parseArgs(["--unknown-flag"]);
		expect(result).toBeNull();
	});

	it("should return interactive mode when only flags (force/verbose) are provided without a mode flag", () => {
		const result = parseArgs(["--force", "--verbose"]);
		expect(result).not.toBeNull();
		expect(result!.mode).toBe("interactive");
		expect(result!.options.force).toBe(true);
		expect(result!.options.verbose).toBe(true);
	});
});

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
