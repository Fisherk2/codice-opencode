import { describe, expect, it } from "bun:test";
import { DEFAULT_PACKS } from "../../../src/application/packOptions";
import { CleanInstallUseCase } from "../../../src/application/use-cases/CleanInstallUseCase";
import {
	FILE_RULE_MANIFEST,
	filterByPacks,
	getPackRules,
	getRulesByCategory,
	packIdFromPath,
} from "../../../src/domain/entities/FileRuleManifest";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";
import type { GitignoreError } from "../../../src/domain/types/GitignoreError";
import type { Result } from "../../../src/domain/types/Result";
import type { SymlinkError } from "../../../src/domain/types/SymlinkError";
import { OPENCODE_SYMLINKS } from "../../../src/infrastructure/config/symlinks";
import {
	createMockFileSystem,
	createMockGitignoreCreator,
	createMockPrompt,
	createMockSymlinkCreator,
	type FileSystemMockCalls,
	type FileSystemMockOptions,
	type GitignoreCreatorMock,
	type MockedFileSystem,
	type SymlinkCreatorMock,
	type UserPromptMock,
} from "./test-doubles";

/** Entries that require actual template file staging (excludes noTemplateCopy) */
const STAGEABLE_RULES = FILE_RULE_MANIFEST.filter((r) => !r.noTemplateCopy);

/** Stageable rules after default pack filtering (software-development only) */
const STAGEABLE_DEFAULT_PACK_RULES = filterByPacks(FILE_RULE_MANIFEST, DEFAULT_PACKS).filter(
	(r) => !r.noTemplateCopy,
);

/** Count of stageable rules that are not optional (mandatory + standard). */
const NON_OPTIONAL_COUNT = STAGEABLE_DEFAULT_PACK_RULES.filter(
	(r) => r.category !== "optional",
).length;

interface CleanFixture {
	useCase: CleanInstallUseCase;
	fs: MockedFileSystem;
	calls: FileSystemMockCalls;
	prompt: UserPromptMock;
	symlinkCreator: SymlinkCreatorMock;
	gitignoreCreator: GitignoreCreatorMock;
}

/**
 * Wire a fully-mocked CleanInstallUseCase.
 * Per-test overrides (mockResolvedValue/mockImplementation) are applied
 * in the test body AFTER this call so each scenario stays self-contained.
 */
function createCleanFixture(options: FileSystemMockOptions = {}): CleanFixture {
	const { stub: fs, calls } = createMockFileSystem(options);
	const engine = new FileMergeEngine(fs);
	const prompt = createMockPrompt({
		selectOptionalDefault: "all",
		allOptionalPaths: getRulesByCategory("optional").map((r) => r.path),
	});
	const symlinkCreator = createMockSymlinkCreator();
	const gitignoreCreator = createMockGitignoreCreator();
	const useCase = new CleanInstallUseCase(
		fs,
		engine,
		prompt,
		symlinkCreator,
		OPENCODE_SYMLINKS,
		gitignoreCreator,
	);
	return { useCase, fs, calls, prompt, symlinkCreator, gitignoreCreator };
}

describe("CleanInstallUseCase", () => {
	describe("constructor", () => {
		it("should create an instance when given valid dependencies", () => {
			const { useCase } = createCleanFixture();
			expect(useCase).toBeInstanceOf(CleanInstallUseCase);
		});
	});

	describe("execute", () => {
		it("should copy all files from the manifest when destination is empty", async () => {
			const { useCase, calls, prompt, gitignoreCreator } = createCleanFixture();

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Default pack selection stages manifest minus unselected packs (8 packs, only 1 selected)
			expect(calls.stageFile.length).toBe(STAGEABLE_DEFAULT_PACK_RULES.length);
			// Commit should have been called
			expect(calls.commitStaging).toBe(1);
			// Version file should be written
			expect(calls.writeVersionFile.length).toBe(1);
			// Gitignore should have been generated with the destination path
			expect(gitignoreCreator.gitignoreCalls).toHaveLength(1);
			expect(gitignoreCreator.gitignoreCalls[0]).toBe("/tmp/project");
			// Should NOT have asked for confirmation (directory is empty)
			expect(prompt.confirm).not.toHaveBeenCalled();
			// Success message should have been shown
			expect(prompt.showSuccess).toHaveBeenCalledWith("Clean installation complete.");
		});

		it("should skip confirmation when destination is empty (no prompt)", async () => {
			const { useCase, calls, prompt } = createCleanFixture();
			// fs.isEmpty already returns true by default

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Should NOT have asked for confirmation (isEmpty short-circuits)
			expect(prompt.confirm).not.toHaveBeenCalled();
			// Operation proceeds normally
			expect(calls.stageFile.length).toBe(STAGEABLE_DEFAULT_PACK_RULES.length);
			expect(calls.commitStaging).toBe(1);
			// Success message shown
			expect(prompt.showSuccess).toHaveBeenCalledWith("Clean installation complete.");
		});

		it("should show warning but still succeed when gitignore creation fails", async () => {
			const { useCase, prompt, gitignoreCreator } = createCleanFixture();
			// Configure gitignore mock to return failure
			gitignoreCreator.createGitignore.mockResolvedValue({
				ok: false,
				error: {
					destPath: "/tmp/project",
					message: "Failed to read template gitignore",
					code: "READ_FAILED",
				},
			} as Result<void, GitignoreError>);

			const result = await useCase.execute("/tmp/project");

			// Gitignore failure should NOT cause the install to fail
			expect(result.ok).toBe(true);
			// Warning should have been shown about gitignore, including --verbose hint
			expect(prompt.showWarning).toHaveBeenCalledWith(expect.stringContaining(".gitignore"));
			expect(prompt.showWarning).toHaveBeenCalledWith(expect.stringContaining("--verbose"));
		});

		it("should create symlinks after successful merge", async () => {
			const { useCase, symlinkCreator } = createCleanFixture();

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(symlinkCreator.createSymlinksCalls).toHaveLength(1);
			// First call should be .opencode symlinks (3)
			expect(symlinkCreator.createSymlinksCalls[0]).toHaveLength(OPENCODE_SYMLINKS.length);
		});

		it("should show warning but still succeed when symlink creation fails", async () => {
			const { useCase, prompt, symlinkCreator } = createCleanFixture();
			// Configure mock to return symlink failures for ALL calls
			const symlinkError: SymlinkError = {
				target: "../agents",
				linkPath: ".opencode/agents",
				message: "Symlink target does not exist",
			};
			symlinkCreator.createSymlinks.mockResolvedValue({
				ok: false,
				error: [symlinkError],
			} as Result<void, SymlinkError[]>);

			const result = await useCase.execute("/tmp/project");

			// Symlink failure should NOT cause the install to fail
			expect(result.ok).toBe(true);
			// Warning should be shown for opencode symlinks
			expect(prompt.showWarning).toHaveBeenCalledTimes(1);
			expect(prompt.showWarning).toHaveBeenCalledWith(expect.stringContaining(".opencode/"));
			// Clean Install sets retryHint=true → warning includes re-run hint
			expect(prompt.showWarning).toHaveBeenCalledWith(
				expect.stringContaining("Re-run the installer to retry symlink creation"),
			);
		});

		it("should return an error when destination is not writable", async () => {
			const { useCase, fs, calls } = createCleanFixture();
			fs.isWritable.mockResolvedValue(false);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(false);
			if (result.ok) return; // type guard for the Failure branch
			expect(result.error.message).toContain("Permission denied");
			// No files should have been staged
			expect(calls.stageFile.length).toBe(0);
		});

		it("should ask for confirmation when destination is not empty and force=false", async () => {
			const { useCase, fs, calls, prompt } = createCleanFixture();
			fs.isEmpty.mockResolvedValue(false);
			// User confirms
			prompt.confirm.mockResolvedValue(true);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.confirm).toHaveBeenCalledTimes(1);
			// Files should be staged after confirmation (default pack selection)
			expect(calls.stageFile.length).toBe(STAGEABLE_DEFAULT_PACK_RULES.length);
		});

		it("should skip installation when user rejects the confirmation", async () => {
			const { useCase, fs, calls, prompt } = createCleanFixture();
			fs.isEmpty.mockResolvedValue(false);
			// User rejects
			prompt.confirm.mockResolvedValue(false);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.confirm).toHaveBeenCalledTimes(1);
			// No files should be staged
			expect(calls.stageFile.length).toBe(0);
		});

		it("should skip confirmation when force=true even if destination is not empty", async () => {
			const { useCase, fs, calls, prompt } = createCleanFixture();
			fs.isEmpty.mockResolvedValue(false);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			// Should NOT have asked for confirmation
			expect(prompt.confirm).not.toHaveBeenCalled();
			// Files should be staged
			expect(calls.stageFile.length).toBe(STAGEABLE_RULES.length);
		});

		it("should write a JSON version file on success", async () => {
			const { useCase, calls } = createCleanFixture();

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(calls.writeVersionFile.length).toBe(1);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData).toHaveProperty("version");
			expect(versionData).toHaveProperty("installedPacks");
			expect(versionData).toHaveProperty("installedAt");
			expect(typeof versionData.installedAt).toBe("string");
		});

		it("should call selectOptional when force is not set", async () => {
			const { useCase, prompt } = createCleanFixture();

			await useCase.execute("/tmp/project");

			expect(prompt.selectOptional).toHaveBeenCalledTimes(1);
			const selectArgs = prompt.selectOptional.mock.calls[0]!;
			// Should pass all optional rules to the selection prompt
			const allOptionals = getRulesByCategory("optional");
			expect(selectArgs[0].length).toBe(allOptionals.length);
		});

		it("should skip selectOptional when force=true and auto-select all", async () => {
			const { useCase, calls, prompt } = createCleanFixture();

			await useCase.execute("/tmp/project", { force: true });

			// selectOptional should NOT be called when force=true
			expect(prompt.selectOptional).not.toHaveBeenCalled();
			// All optionals should be staged (including stageable ones)
			const stageableNonOptional = STAGEABLE_RULES.filter((r) => r.category !== "optional");
			const stageableOptional = STAGEABLE_RULES.filter((r) => r.category === "optional");
			expect(calls.stageFile.length).toBe(stageableNonOptional.length + stageableOptional.length);
		});

		it("should stage no optional files when user selects none", async () => {
			const { useCase, calls, prompt } = createCleanFixture();
			prompt.selectOptional.mockResolvedValue([]);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Only mandatory + standard files should be staged (default pack, no optionals)
			expect(calls.stageFile.length).toBe(NON_OPTIONAL_COUNT);
		});

		it("should record optionalSelections in version file", async () => {
			const { useCase, calls, prompt } = createCleanFixture();
			const selectedPaths: string[] = [getRulesByCategory("optional")[0]!.path];
			prompt.selectOptional.mockResolvedValue(selectedPaths);

			await useCase.execute("/tmp/project");

			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData).toHaveProperty("optionalSelections");
			expect(versionData.optionalSelections).toEqual(selectedPaths);
		});

		it("should return error and clean staging when merge engine fails", async () => {
			const { useCase, fs, calls } = createCleanFixture();
			// Make stageFile throw to trigger a merge engine failure
			fs.stageFile.mockRejectedValue(new Error("Disk full during staging"));

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toContain("staging");
			// Staging should have been cleaned after the merge failure
			expect(calls.cleanStaging).toBeGreaterThanOrEqual(1);
			// Version file should NOT have been written
			expect(calls.writeVersionFile.length).toBe(0);
		});

		it("should handle version file write failure gracefully", async () => {
			const { useCase, fs, calls } = createCleanFixture();
			fs.writeVersionFile.mockRejectedValue(new Error("Disk full"));

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(false);
			if (result.ok) return; // type guard for the Failure branch
			expect(result.error.message).toContain("version file");
			// Staging should have been cleaned after the version file failure
			expect(calls.cleanStaging).toBe(1);
		});

		it("should emit progress events during merge", async () => {
			const { useCase, prompt } = createCleanFixture();

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Progress bar should have been initialized with the correct label
			expect(prompt.showProgressBar).toHaveBeenCalled();
			expect(prompt.showProgressBar).toHaveBeenCalledWith(expect.any(Number), "Clean install...");
			// Progress updates should have been sent
			expect(prompt.updateProgress).toHaveBeenCalled();
			// Commit log event should have been emitted
			expect(prompt.logProgressEvent).toHaveBeenCalledWith(
				expect.stringContaining("commit: Committing"),
			);
			expect(prompt.logProgressEvent).toHaveBeenCalledWith(expect.stringContaining("commit:"));
			// Progress should have been completed
			expect(prompt.completeProgress).toHaveBeenCalled();
		});

		it("should emit symlink and gitignore log events after merge", async () => {
			const { useCase, prompt } = createCleanFixture();

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/agents");
			expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/commands");
			expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/skills");
			expect(prompt.logProgressEvent).toHaveBeenCalledWith("gitignore: Generated .gitignore");
		});

		it("should persist all pack IDs to version file when force=true", async () => {
			const { useCase, calls, prompt } = createCleanFixture();

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			// force=true auto-selects ALL packs — no interactive pack menu
			expect(prompt.selectPacks).not.toHaveBeenCalled();
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			const allPackIds = getPackRules().map((r) => packIdFromPath(r.path));
			expect(versionData.installedPacks).toEqual(allPackIds);
			// v2.0 writer emits "version" (not legacy "installedVersion")
			expect(versionData.version).toBeDefined();
			expect(versionData.installedVersion).toBeUndefined();
		});

		it("should persist custom pack selection to version file", async () => {
			const { useCase, calls, prompt } = createCleanFixture();
			prompt.selectPacks.mockResolvedValueOnce(["software-development", "business"]);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.installedPacks).toEqual(["software-development", "business"]);
		});

		it("should skip the pack selection wizard when packs are provided via options", async () => {
			const { useCase, calls, prompt } = createCleanFixture();

			const result = await useCase.execute("/tmp/project", {
				packs: ["software-development", "business"],
			});

			expect(result.ok).toBe(true);
			// CLI-provided packs take precedence — the wizard is never shown
			expect(prompt.selectPacks).not.toHaveBeenCalled();
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.installedPacks).toEqual(["software-development", "business"]);
		});

		it("should abort when user cancels the pack selection wizard (no partial install)", async () => {
			const { useCase, calls, prompt } = createCleanFixture();
			prompt.selectPacks.mockResolvedValueOnce([]);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Cancel aborts before merging — nothing staged, no version file written
			expect(calls.stageFile.length).toBe(0);
			expect(calls.writeVersionFile.length).toBe(0);
			expect(calls.commitStaging).toBe(0);
		});

		it("shows install summary before merge", async () => {
			const { useCase, prompt } = createCleanFixture();

			await useCase.execute("/tmp/project", { force: true });

			// force=true auto-selects all 8 packs → 352 total agents
			expect(prompt.showInstallSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					packs: expect.arrayContaining([{ id: "software-development", agentCount: 146 }]),
					totalAgents: 352,
					totalFiles: expect.any(Number),
				}),
			);
		});

		it("should include core, main and writers in the install summary mandatory directories", async () => {
			const { useCase, prompt } = createCleanFixture();

			await useCase.execute("/tmp/project", { force: true });

			// buildInstallSummary derives mandatoryDirs from the manifest's
			// mandatory directory rules (core + the two always-installed packs)
			expect(prompt.showInstallSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					mandatoryDirs: expect.arrayContaining(["core", "packs/main", "packs/writers"]),
				}),
			);
		});

		it("should include selected optional files in the install summary", async () => {
			const { useCase, prompt } = createCleanFixture();
			// Wizard runs (force=false): user picks two optional files
			prompt.selectOptional.mockResolvedValue(["Justfile", "docs/DESIGN.md"]);

			await useCase.execute("/tmp/project");

			// Selected optional paths flow straight into the summary
			expect(prompt.showInstallSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					optionalFiles: expect.arrayContaining(["Justfile", "docs/DESIGN.md"]),
				}),
			);
		});
	});
});
