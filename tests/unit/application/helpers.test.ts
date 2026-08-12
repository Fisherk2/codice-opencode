import { describe, expect, mock as mockFn, test } from "bun:test";
import { confirmOverwrite, createProgressCallback } from "../../../src/application/helpers";
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";

// ── Mock factories ────────────────────────────────────────────────

function createMockFileSystem(opts?: { isEmpty?: boolean }): IFileSystem {
	return {
		destinationExists: mockFn(() => Promise.resolve(false)),
		isWritable: mockFn(() => Promise.resolve(true)),
		isEmpty: mockFn(() => Promise.resolve(opts?.isEmpty ?? true)),
		writeVersionFile: mockFn(async () => {}),
		readVersionFile: mockFn(() => Promise.resolve(null)),
		walkTemplateDirectory: mockFn(() => Promise.resolve([])),
		walkDestinationDirectory: mockFn(() => Promise.resolve([])),
	};
}

function createMockPrompt(opts?: { confirmResult?: boolean }): {
	stub: IUserPrompt;
	confirmCalls: string[];
	cancelCalls: string[];
} {
	const confirmCalls: string[] = [];
	const cancelCalls: string[] = [];
	return {
		confirmCalls,
		cancelCalls,
		stub: {
			showWarning: mockFn(() => {}),
			showInfo: mockFn(() => {}),
			confirm: mockFn((msg: string) => {
				confirmCalls.push(msg);
				return Promise.resolve(opts?.confirmResult ?? true);
			}),
			selectOptional: mockFn(() => Promise.resolve([])),
			showProgressBar: mockFn(() => {}),
			updateProgress: mockFn(() => {}),
			completeProgress: mockFn(() => {}),
			logProgressEvent: mockFn(() => {}),
			showIntro: mockFn(() => {}),
			showSuccess: mockFn(() => {}),
			showCancel: mockFn((msg: string) => {
				cancelCalls.push(msg);
			}),
			showError: mockFn(() => {}),
			promptForMode: mockFn(() => Promise.resolve<"clean" | "project" | "update" | null>(null)),
			selectPacks: mockFn(() => Promise.resolve(["software-development"] as const)),
			showVersionInfo: mockFn(() => {}),
			selectUpdateOption: mockFn(() =>
				Promise.resolve<"current" | "add" | "cancel" | null>("current"),
			),
			showInstallSummary: mockFn(() => {}),
		},
	};
}

// ── Tests ─────────────────────────────────────────────────────────

describe("confirmOverwrite", () => {
	test("returns true immediately when force=true (skips prompt)", async () => {
		const fs = createMockFileSystem({ isEmpty: false });
		const prompt = createMockPrompt();

		const result = await confirmOverwrite(fs, prompt.stub, "Overwrite?", "Cancelled.", true);

		expect(result).toBe(true);
		// Prompt should never have been called
		expect(fs.isEmpty).not.toHaveBeenCalled();
		expect(prompt.stub.confirm).not.toHaveBeenCalled();
	});

	test("returns true immediately when directory is empty (skips prompt)", async () => {
		const fs = createMockFileSystem({ isEmpty: true });
		const prompt = createMockPrompt({ confirmResult: false });

		const result = await confirmOverwrite(fs, prompt.stub, "Overwrite?", "Cancelled.");

		expect(result).toBe(true);
		// isEmpty was checked, but confirm was never reached
		expect(fs.isEmpty).toHaveBeenCalled();
		expect(prompt.stub.confirm).not.toHaveBeenCalled();
	});

	test("returns true when user confirms", async () => {
		const fs = createMockFileSystem({ isEmpty: false });
		const prompt = createMockPrompt({ confirmResult: true });

		const result = await confirmOverwrite(fs, prompt.stub, "Overwrite files?", "Cancelled.");

		expect(result).toBe(true);
		expect(fs.isEmpty).toHaveBeenCalled();
		expect(prompt.stub.confirm).toHaveBeenCalledTimes(1);
		expect(prompt.stub.confirm).toHaveBeenCalledWith("Overwrite files?", false);
		// No cancel message shown on confirmation
		expect(prompt.cancelCalls).toHaveLength(0);
	});

	test("returns false and shows cancel message when user declines", async () => {
		const fs = createMockFileSystem({ isEmpty: false });
		const prompt = createMockPrompt({ confirmResult: false });

		const result = await confirmOverwrite(
			fs,
			prompt.stub,
			"Overwrite files?",
			"Update cancelled by user.",
		);

		expect(result).toBe(false);
		expect(fs.isEmpty).toHaveBeenCalled();
		expect(prompt.stub.confirm).toHaveBeenCalledTimes(1);
		expect(prompt.cancelCalls).toHaveLength(1);
		expect(prompt.cancelCalls[0]).toBe("Update cancelled by user.");
	});

	test("passes defaultYes=true to confirm when requested (update mode default)", async () => {
		const fs = createMockFileSystem({ isEmpty: false });
		const prompt = createMockPrompt();

		const result = await confirmOverwrite(
			fs,
			prompt.stub,
			'Update workspace in "/tmp/project"? Continue?',
			"Update cancelled by user.",
			undefined,
			true,
		);

		expect(result).toBe(true);
		expect(prompt.stub.confirm).toHaveBeenCalledTimes(1);
		expect(prompt.stub.confirm).toHaveBeenCalledWith(
			'Update workspace in "/tmp/project"? Continue?',
			true,
		);
	});
});

// ── createProgressCallback tests ──────────────────────────────────

describe("createProgressCallback", () => {
	test("sets up progress bar on first stage_start event", () => {
		const prompt = createMockPrompt();
		const callback = createProgressCallback(prompt.stub, "Clean install...");

		callback({ type: "stage_start", current: 0, total: 33, filePath: "file1.md" });

		expect(prompt.stub.showProgressBar).toHaveBeenCalledTimes(1);
		expect(prompt.stub.showProgressBar).toHaveBeenCalledWith(33, "Clean install...");
		// stage_start only initializes the bar; advancement happens on stage_complete
		expect(prompt.stub.updateProgress).toHaveBeenCalledTimes(0);
	});

	test("does not re-setup progress bar on subsequent stage_start events", () => {
		const prompt = createMockPrompt();
		const callback = createProgressCallback(prompt.stub, "Clean install...");

		callback({ type: "stage_start", current: 0, total: 33, filePath: "file1.md" });
		callback({ type: "stage_start", current: 1, total: 33, filePath: "file2.md" });

		expect(prompt.stub.showProgressBar).toHaveBeenCalledTimes(1);
		expect(prompt.stub.updateProgress).toHaveBeenCalledTimes(0);
	});

	test("updates progress on stage_complete event", () => {
		const prompt = createMockPrompt();
		const callback = createProgressCallback(prompt.stub, "Project install...");

		callback({ type: "stage_complete", current: 33, total: 33, filePath: "last-file.md" });

		expect(prompt.stub.updateProgress).toHaveBeenCalledTimes(1);
		expect(prompt.stub.updateProgress).toHaveBeenCalledWith(33, "last-file.md");
		// No progress bar setup because we never got stage_start
		expect(prompt.stub.showProgressBar).toHaveBeenCalledTimes(0);
	});

	test("logs commit_start event", () => {
		const prompt = createMockPrompt();
		const callback = createProgressCallback(prompt.stub, "Clean install...");

		callback({ type: "commit_start", total: 33 });

		expect(prompt.stub.logProgressEvent).toHaveBeenCalledTimes(1);
		expect(prompt.stub.logProgressEvent).toHaveBeenCalledWith(
			"commit: Committing 33 files atomically...",
		);
	});

	test("logs commit_complete and completes progress bar", () => {
		const prompt = createMockPrompt();
		const callback = createProgressCallback(prompt.stub, "Clean install...");

		callback({ type: "commit_complete", total: 33 });

		expect(prompt.stub.logProgressEvent).toHaveBeenCalledWith("commit: 33 files committed");
		expect(prompt.stub.completeProgress).toHaveBeenCalledTimes(1);
	});

	test("logs error event and completes progress bar", () => {
		const prompt = createMockPrompt();
		const callback = createProgressCallback(prompt.stub, "Clean install...");

		callback({ type: "error", filePath: "/broken/file.md", message: "Permission denied" });

		expect(prompt.stub.logProgressEvent).toHaveBeenCalledWith(
			"error: /broken/file.md: Permission denied",
		);
		expect(prompt.stub.completeProgress).toHaveBeenCalledTimes(1);
	});

	test("skips stage_skip event silently (no TUI calls)", () => {
		const prompt = createMockPrompt();
		const callback = createProgressCallback(prompt.stub, "Clean install...");

		callback({ type: "stage_skip", filePath: "existing.md", reason: "Rule prevents overwrite" });

		expect(prompt.stub.updateProgress).toHaveBeenCalledTimes(0);
		expect(prompt.stub.logProgressEvent).toHaveBeenCalledTimes(0);
		expect(prompt.stub.completeProgress).toHaveBeenCalledTimes(0);
	});

	test("catch block: completes progress when updateProgress throws", () => {
		const prompt = createMockPrompt();
		// Override updateProgress to throw
		prompt.stub.updateProgress = mockFn(() => {
			throw new Error("TUI crash");
		});
		const callback = createProgressCallback(prompt.stub, "Clean install...");

		// Must not throw — the catch block intercepts and completes the bar
		expect(() =>
			callback({ type: "stage_complete", current: 0, total: 33, filePath: "file1.md" }),
		).not.toThrow();

		expect(prompt.stub.completeProgress).toHaveBeenCalledTimes(1);
	});

	test("catch block: completes progress when logProgressEvent throws", () => {
		const prompt = createMockPrompt();
		prompt.stub.logProgressEvent = mockFn(() => {
			throw new Error("TUI crash during commit log");
		});
		const callback = createProgressCallback(prompt.stub, "Clean install...");

		expect(() => callback({ type: "commit_complete", total: 33 })).not.toThrow();

		expect(prompt.stub.completeProgress).toHaveBeenCalledTimes(1);
	});

	test("catch block: completes progress when a listener throws on error event", () => {
		const prompt = createMockPrompt();
		prompt.stub.logProgressEvent = mockFn(() => {
			throw new Error("TUI crash during error log");
		});
		const callback = createProgressCallback(prompt.stub, "Clean install...");

		expect(() =>
			callback({ type: "error", filePath: "/bad/file.md", message: "Disk full" }),
		).not.toThrow();

		expect(prompt.stub.completeProgress).toHaveBeenCalledTimes(1);
	});
});
