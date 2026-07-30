import { describe, expect, mock as mockFn, test } from "bun:test";
import { confirmOverwrite } from "../../../src/application/helpers";
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";

// ── Mock factories ────────────────────────────────────────────────

function createMockFileSystem(opts?: { isEmpty?: boolean }): IFileSystem {
	return {
		readTemplateFile: mockFn(() => Promise.resolve("")),
		destinationExists: mockFn(() => Promise.resolve(false)),
		isWritable: mockFn(() => Promise.resolve(true)),
		isEmpty: mockFn(() => Promise.resolve(opts?.isEmpty ?? true)),
		writeVersionFile: mockFn(async () => {}),
		readVersionFile: mockFn(() => Promise.resolve(null)),
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
			showSpinner: mockFn(() => {}),
			stopSpinner: mockFn(() => {}),
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
});
