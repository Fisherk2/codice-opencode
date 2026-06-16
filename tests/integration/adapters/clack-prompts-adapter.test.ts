import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import type { FileRule } from "../../../src/domain/entities/FileRule";

/**
 * Integration tests for ClackPromptsAdapter.
 * Uses mocked @clack/prompts module to verify adapter behavior.
 */

// Mock the @clack/prompts module
// IMPORTANT: Bun's mock.module() replaces all future imports of this module
// globally within the test runner. The mock must include ALL functions that
// any tested module might call, otherwise those functions will be undefined.
// In particular, ClackPromptsAdapter.promptForMode() needs `select`.

const mockNote = mock();
const mockConfirm = mock();
const mockMultiselect = mock();
const mockSelect = mock();
const mockSpinner = mock(() => ({
	start: mock(),
	stop: mock(),
}));
const mockIntro = mock();
const mockOutro = mock();
const mockCancel = mock();
const mockIsCancel = mock(() => false);

mock.module("@clack/prompts", () => ({
	note: mockNote,
	confirm: mockConfirm,
	multiselect: mockMultiselect,
	select: mockSelect,
	spinner: mockSpinner,
	intro: mockIntro,
	outro: mockOutro,
	cancel: mockCancel,
	isCancel: mockIsCancel,
}));

// Import after mock is set up
const { ClackPromptsAdapter } = await import(
	"../../../src/infrastructure/adapters/ClackPromptsAdapter"
);
type ClackPromptsAdapterInstance = InstanceType<typeof ClackPromptsAdapter>;

describe("ClackPromptsAdapter", () => {
	let adapter: ClackPromptsAdapterInstance;

	beforeEach(() => {
		adapter = new ClackPromptsAdapter();
		mockNote.mockReset();
		mockConfirm.mockReset();
		mockMultiselect.mockReset();
		mockIntro.mockReset();
		mockOutro.mockReset();
		mockCancel.mockReset();
		mockIsCancel.mockReset();
	});

	afterEach(() => {
		// Clean up spinner state
		adapter.stopSpinner();
	});

	describe("showWarning", () => {
		it("should display a warning message via note()", () => {
			adapter.showWarning("Disk space is low");
			expect(mockNote).toHaveBeenCalledTimes(1);
			expect(mockNote).toHaveBeenCalledWith(
				"Disk space is low",
				expect.stringContaining("Warning"),
			);
		});
	});

	describe("showInfo", () => {
		it("should display an info message via note()", () => {
			adapter.showInfo("Installing template...");
			expect(mockNote).toHaveBeenCalledTimes(1);
			expect(mockNote).toHaveBeenCalledWith("Installing template...", "Info");
		});
	});

	describe("confirm", () => {
		it("should call confirm() with the message and default", async () => {
			mockConfirm.mockResolvedValue(true);

			const result = await adapter.confirm("Continue?", true);
			expect(result).toBe(true);
			expect(mockConfirm).toHaveBeenCalledWith({
				message: "Continue?",
				initialValue: true,
			});
		});

		it("should return false when user cancels", async () => {
			mockIsCancel.mockReturnValue(true);
			mockConfirm.mockResolvedValue(undefined);

			const result = await adapter.confirm("Continue?", false);
			expect(result).toBe(false);
		});

		it("should default to true when defaultYes is not provided", async () => {
			mockConfirm.mockResolvedValue(true);

			const result = await adapter.confirm("Continue?");
			expect(result).toBe(true);
			expect(mockConfirm).toHaveBeenCalledWith({
				message: "Continue?",
				initialValue: true,
			});
		});
	});

	describe("selectOptional", () => {
		it("should return empty array when no options provided", async () => {
			const result = await adapter.selectOptional([]);
			expect(result).toEqual([]);
		});

		it("should call multiselect with correct options", async () => {
			mockMultiselect.mockResolvedValue(["config.json", "README.md"]);

			const options: FileRule[] = [
				{
					path: "config.json",
					category: "optional",
					isDirectory: false,
					description: "Configuration file",
				},
				{
					path: "README.md",
					category: "optional",
					isDirectory: false,
					description: "Project readme",
				},
			];

			const result = await adapter.selectOptional(options);
			expect(result).toEqual(["config.json", "README.md"]);
			expect(mockMultiselect).toHaveBeenCalledTimes(1);
			expect(mockMultiselect).toHaveBeenCalledWith({
				message: expect.stringContaining("optional"),
				options: [
					{ value: "config.json", label: "config.json", hint: "Configuration file" },
					{ value: "README.md", label: "README.md", hint: "Project readme" },
				],
				required: false,
			});
		});

		it("should handle user cancellation", async () => {
			mockIsCancel.mockReturnValue(true);
			mockMultiselect.mockResolvedValue(undefined);

			const options: FileRule[] = [
				{
					path: "config.json",
					category: "optional",
					isDirectory: false,
					description: "",
				},
			];

			const result = await adapter.selectOptional(options);
			expect(result).toEqual([]);
		});

		it("should handle options without descriptions", async () => {
			mockMultiselect.mockResolvedValue([]);

			const options: FileRule[] = [
				{
					path: "config.json",
					category: "optional",
					isDirectory: false,
					description: "",
				},
			];

			const result = await adapter.selectOptional(options);
			expect(result).toEqual([]);
		});
	});

	describe("spinner", () => {
		it("should start spinner with message", () => {
			adapter.showSpinner("Installing...");
			expect(mockSpinner).toHaveBeenCalledTimes(1);

			// Should be able to call stopSpinner without error
			adapter.stopSpinner();
		});

		it("should replace existing spinner", () => {
			adapter.showSpinner("First task...");
			adapter.showSpinner("Second task...");
			// Second call should have stopped the first spinner
			adapter.stopSpinner();
		});
	});

	describe("flow messages", () => {
		it("should show intro", () => {
			// Use a placeholder message—the adapter delegates verbatim; version is irrelevant
			const testMessage = "Códice vX.Y.Z";
			adapter.showIntro(testMessage);
			expect(mockIntro).toHaveBeenCalledWith(testMessage);
		});

		it("should show success", () => {
			adapter.showSuccess("Installation complete");
			expect(mockOutro).toHaveBeenCalledWith(expect.stringContaining("Installation complete"));
		});

		it("should show cancel message", () => {
			adapter.showCancel("Operation cancelled");
			expect(mockCancel).toHaveBeenCalledWith("Operation cancelled");
		});

		it("should show error message", () => {
			adapter.showError("Something went wrong");
			expect(mockCancel).toHaveBeenCalledWith(expect.stringContaining("Something went wrong"));
		});
	});
});
