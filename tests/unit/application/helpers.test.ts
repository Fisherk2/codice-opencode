import { describe, expect, mock as mockFn, spyOn, test } from "bun:test";
import { confirmOverwrite, createProgressCallback } from "../../../src/application/helpers";
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";
import { createMockPrompt as createSharedPrompt } from "../../shared/test-doubles";

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
	const prompt = createSharedPrompt({ confirmResult: opts?.confirmResult });
	return { stub: prompt, confirmCalls: prompt.confirmCalls, cancelCalls: prompt.cancels };
}

// ── Tests ─────────────────────────────────────────────────────────

describe("confirmOverwrite", () => {
	test("returns true immediately when force=true (skips prompt)", async () => {
		const fs = createMockFileSystem({ isEmpty: false });
		const prompt = createMockPrompt();

		const result = await confirmOverwrite(fs, prompt.stub, "Overwrite?", "Cancelled.", {
			force: true,
		});

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
			{ defaultYes: true },
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

	test("throttles stage_complete redraws by file count between draws", () => {
		const prompt = createMockPrompt();
		const callback = createProgressCallback(prompt.stub, "Clean install...");
		// Freeze the clock so only the file-count rule decides draws.
		const nowSpy = spyOn(Date, "now").mockReturnValue(0);

		callback({ type: "stage_start", current: 1, total: 30, filePath: "a" });
		callback({ type: "stage_complete", current: 1, total: 30, filePath: "a" }); // first → draws
		for (let i = 2; i <= 29; i++) {
			callback({ type: "stage_complete", current: i, total: 30, filePath: `f${i}` });
		}
		callback({ type: "stage_complete", current: 30, total: 30, filePath: "last" }); // last → draws

		nowSpy.mockRestore();
		// Draws at 1, 11, 21 (file-count rule), and 30 (isLast) — the
		// remaining 26 files skip the TUI re-render entirely.
		expect(prompt.stub.updateProgress).toHaveBeenCalledTimes(4);
		expect(prompt.stub.updateProgress).toHaveBeenLastCalledWith(30, "last");
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
