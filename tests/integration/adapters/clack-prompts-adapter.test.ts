import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import * as realClack from "@clack/prompts";
import type { PackOption, UpdateOptionChoice } from "../../../src/application/ports/IUserPrompt";
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
//
// The mock is also NOT auto-restored between test files, so it is undone in
// afterAll below. Leaving it installed makes every later-loaded test file use
// the stub, and Bun's file order is filesystem-dependent (ext4/NTFS vs APFS) —
// that is exactly how a leaked mock.module turns into a platform-only CI
// failure. Snapshot the real exports BEFORE mock.module runs.

const realClackExports = { ...realClack };

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
const mockProgress = mock(() => ({
	start: mock(),
	advance: mock(),
	stop: mock(),
}));
const mockLog = {
	message: mock(),
	info: mock(),
	success: mock(),
	step: mock(),
	warn: mock(),
	warning: mock(),
	error: mock(),
};

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
	progress: mockProgress,
	log: mockLog,
}));

// Restore the real module so later-loaded test files are unaffected.
afterAll(() => {
	mock.module("@clack/prompts", () => realClackExports);
});

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
		mockSelect.mockReset();
		mockIntro.mockReset();
		mockOutro.mockReset();
		mockCancel.mockReset();
		mockIsCancel.mockReset();
	});

	it("creates instance with explicit constructor", () => {
		// REF: TECH_DEBT.md TD-1.2 — explicit constructor to fix Bun coverage artifact
		expect(adapter).toBeInstanceOf(ClackPromptsAdapter);
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

	describe("promptForMode", () => {
		it("should return 'clean' when user selects Clean Install", async () => {
			mockSelect.mockResolvedValue("clean");
			mockIsCancel.mockReturnValue(false);

			const result = await adapter.promptForMode();
			expect(result).toBe("clean");
			expect(mockSelect).toHaveBeenCalledWith(
				expect.objectContaining({ message: expect.stringContaining("mode") }),
			);
		});

		it("should return 'project' when user selects Project Install", async () => {
			mockSelect.mockResolvedValue("project");
			mockIsCancel.mockReturnValue(false);

			const result = await adapter.promptForMode();
			expect(result).toBe("project");
		});

		it("should return 'update' when user selects Update Workspace", async () => {
			mockSelect.mockResolvedValue("update");
			mockIsCancel.mockReturnValue(false);

			const result = await adapter.promptForMode();
			expect(result).toBe("update");
		});

		it("should return null when user cancels", async () => {
			mockSelect.mockResolvedValue(undefined);
			mockIsCancel.mockReturnValue(true);

			const result = await adapter.promptForMode();
			expect(result).toBeNull();
		});
	});

	describe("ClackPromptsAdapter.selectPacks()", () => {
		it("returns selected pack IDs on user selection", async () => {
			mockMultiselect.mockResolvedValue(["software-development", "business"]);

			const options: PackOption[] = [
				{
					id: "software-development",
					name: "Software Development",
					description: "Core development agents",
					agentCount: 4,
				},
				{
					id: "business",
					name: "Business",
					description: "Business-focused agents",
					agentCount: 2,
				},
			];

			const result = await adapter.selectPacks(options, ["software-development"]);
			expect(result).toEqual(["software-development", "business"]);
			expect(mockMultiselect).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Select agent packs to install:",
					required: true,
					initialValues: ["software-development"],
				}),
			);
		});

		it("returns empty array on cancel", async () => {
			mockIsCancel.mockReturnValue(true);
			mockMultiselect.mockResolvedValue(Symbol("cancel") as never);

			const options: PackOption[] = [
				{
					id: "software-development",
					name: "Software Development",
					description: "Core development agents",
					agentCount: 4,
				},
			];

			const result = await adapter.selectPacks(options, []);
			expect(result).toEqual([]);
		});

		it("marks locked packs with [INSTALLED, LOCKED] label", async () => {
			mockMultiselect.mockResolvedValue(["software-development"]);

			const options: PackOption[] = [
				{
					id: "software-development",
					name: "Software Development",
					description: "Core development agents",
					agentCount: 4,
					locked: true,
				},
			];

			await adapter.selectPacks(options, []);
			expect(mockMultiselect).toHaveBeenCalledWith(
				expect.objectContaining({
					options: expect.arrayContaining([
						expect.objectContaining({
							label: expect.stringContaining("[INSTALLED, LOCKED]"),
						}),
					]),
				}),
			);
		});
	});

	describe("ClackPromptsAdapter.showVersionInfo()", () => {
		it("shows 'v2.0+' installation message with current packs", () => {
			adapter.showVersionInfo({
				version: "2.0.0",
				installedPacks: ["software-development", "business"],
				status: "v2.0+",
			});

			expect(mockNote).toHaveBeenCalledWith(
				expect.stringContaining("Current installation: v2.0.0"),
				expect.stringContaining("v2.0+"),
			);
		});

		it("shows 'No Installation Detected' for missing status", () => {
			adapter.showVersionInfo({ version: null, installedPacks: [], status: "missing" });

			expect(mockNote).toHaveBeenCalledWith(
				expect.stringContaining("No previous Códice installation found"),
				expect.stringContaining("No Installation Detected"),
			);
		});
	});

	describe("ClackPromptsAdapter.selectUpdateOption()", () => {
		it("returns 'current' when user selects Option A", async () => {
			mockSelect.mockResolvedValue("current");

			const options: UpdateOptionChoice[] = [
				{ value: "current", label: "Keep current packs" },
				{ value: "add", label: "Add more packs" },
				{ value: "cancel", label: "Cancel update" },
			];

			const result = await adapter.selectUpdateOption(options);
			expect(result).toBe("current");
		});

		it("returns null on cancel", async () => {
			mockIsCancel.mockReturnValue(true);
			mockSelect.mockResolvedValue(Symbol("cancel") as never);

			const options: UpdateOptionChoice[] = [
				{ value: "current", label: "Keep current packs" },
				{ value: "add", label: "Add more packs" },
			];

			const result = await adapter.selectUpdateOption(options);
			expect(result).toBeNull();
		});
	});
});
