import { describe, expect, it } from "bun:test";
import { DEFAULT_PACKS } from "../../../src/application/packOptions";
import { ProjectInstallUseCase } from "../../../src/application/use-cases/ProjectInstallUseCase";
import {
	FILE_RULE_MANIFEST,
	filterByPacks,
	getRulesByCategory,
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

/** Stageable rules after default pack filtering (software-development only) */
const STAGEABLE_DEFAULT_PACK_RULES = filterByPacks(FILE_RULE_MANIFEST, DEFAULT_PACKS).filter(
	(r) => !r.noTemplateCopy,
);

/** Count of stageable rules that are not optional (mandatory + standard). */
const NON_OPTIONAL_COUNT = STAGEABLE_DEFAULT_PACK_RULES.filter(
	(r) => r.category !== "optional",
).length;

const optionalRules = getRulesByCategory("optional");

interface ProjectFixture {
	useCase: ProjectInstallUseCase;
	fs: MockedFileSystem;
	calls: FileSystemMockCalls;
	prompt: UserPromptMock;
	symlinkCreator: SymlinkCreatorMock;
	gitignoreCreator: GitignoreCreatorMock;
}

/**
 * Wire a fully-mocked ProjectInstallUseCase.
 * Project mode tracks destinationExists() calls for carry-over assertions;
 * per-test overrides are applied in the test body AFTER this call.
 */
function createProjectFixture(options: FileSystemMockOptions = {}): ProjectFixture {
	const { stub: fs, calls } = createMockFileSystem({
		trackDestinationExists: true,
		...options,
	});
	const engine = new FileMergeEngine(fs);
	const prompt = createMockPrompt({
		selectOptionalDefault: "all",
		allOptionalPaths: optionalRules.map((r) => r.path),
	});
	const symlinkCreator = createMockSymlinkCreator();
	const gitignoreCreator = createMockGitignoreCreator();
	const useCase = new ProjectInstallUseCase(
		fs,
		engine,
		prompt,
		symlinkCreator,
		OPENCODE_SYMLINKS,
		gitignoreCreator,
	);
	return { useCase, fs, calls, prompt, symlinkCreator, gitignoreCreator };
}

describe("ProjectInstallUseCase", () => {
	describe("constructor", () => {
		it("should create an instance when given valid dependencies", () => {
			const { useCase } = createProjectFixture();
			expect(useCase).toBeInstanceOf(ProjectInstallUseCase);
		});
	});

	describe("execute", () => {
		it("should copy all files respecting category rules when destination is empty", async () => {
			const { useCase, calls } = createProjectFixture();

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Default pack selection stages manifest minus unselected packs (8 packs, only 1 selected)
			expect(calls.stageFile.length).toBe(STAGEABLE_DEFAULT_PACK_RULES.length);
			// Commit should have been called
			expect(calls.commitStaging).toBe(1);
			// Version file should be written
			expect(calls.writeVersionFile.length).toBe(1);
		});

		it("should skip confirmation when destination is empty (no prompt)", async () => {
			const { useCase, calls, prompt } = createProjectFixture();
			// fs.isEmpty already returns true by default

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Should NOT have asked for confirmation (isEmpty short-circuits)
			expect(prompt.confirm).not.toHaveBeenCalled();
			// Operation proceeds normally
			expect(calls.stageFile.length).toBe(STAGEABLE_DEFAULT_PACK_RULES.length);
			expect(calls.commitStaging).toBe(1);
		});

		it("should return an error when destination is not writable", async () => {
			const { useCase, fs, calls } = createProjectFixture();
			fs.isWritable.mockResolvedValue(false);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toContain("Permission denied");
			// No files should have been staged
			expect(calls.stageFile.length).toBe(0);
		});

		it("should ask for confirmation when destination is not empty and force=false", async () => {
			const { useCase, fs, calls, prompt } = createProjectFixture();
			fs.isEmpty.mockResolvedValue(false);
			prompt.confirm.mockResolvedValue(true);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.confirm).toHaveBeenCalledTimes(1);
			expect(calls.stageFile.length).toBe(STAGEABLE_DEFAULT_PACK_RULES.length);
		});

		it("should skip installation when user rejects the confirmation", async () => {
			const { useCase, fs, calls, prompt } = createProjectFixture();
			fs.isEmpty.mockResolvedValue(false);
			prompt.confirm.mockResolvedValue(false);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.confirm).toHaveBeenCalledTimes(1);
			expect(calls.stageFile.length).toBe(0);
		});

		it("should skip confirmation and optional selection when force=true", async () => {
			const { useCase, fs, calls, prompt } = createProjectFixture();
			fs.isEmpty.mockResolvedValue(false);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			expect(prompt.confirm).not.toHaveBeenCalled();
			expect(prompt.selectOptional).not.toHaveBeenCalled();
			// Only non-optional files should be staged (default pack, mandatory + standard)
			expect(calls.stageFile.length).toBe(NON_OPTIONAL_COUNT);
		});

		it("should present optional files checkbox and use selected paths", async () => {
			const { useCase, calls, prompt } = createProjectFixture();
			// User selects only a stageable optional file
			const stageableOptional = optionalRules.find((r) => !r.noTemplateCopy)!;
			prompt.selectOptional.mockResolvedValue([stageableOptional.path]);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// selectOptional should have been called with optional rules
			expect(prompt.selectOptional).toHaveBeenCalledTimes(1);
			const selectArgs = prompt.selectOptional.mock.calls[0]!;
			expect(selectArgs[0].length).toBe(optionalRules.length);
			// Only one optional file was selected, so non-selected optional files are skipped
			// Default pack + mandatory + standard + 1 selected stageable optional
			expect(calls.stageFile.length).toBe(NON_OPTIONAL_COUNT + 1);
		});

		it("should skip optional files when user selects none", async () => {
			const { useCase, calls, prompt } = createProjectFixture();
			prompt.selectOptional.mockResolvedValue([]);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Only mandatory + standard files should be staged (default pack, no optionals)
			expect(calls.stageFile.length).toBe(NON_OPTIONAL_COUNT);
		});

		it("should carry over standard files that already exist", async () => {
			const { useCase, fs, calls } = createProjectFixture();
			const standardRules = getRulesByCategory("standard");
			// First standard file exists in destination
			fs.destinationExists.mockImplementation(
				async (path: string) => path === standardRules[0]?.path,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Standard file that existed should NOT be staged
			const stagedFirstStandard = calls.stageFile.filter((p) => p === standardRules[0]?.path);
			expect(stagedFirstStandard.length).toBe(0);
		});

		it("should write optionalSelections in version file", async () => {
			const { useCase, calls, prompt } = createProjectFixture();
			const selectedPaths = [optionalRules[0]!.path];
			prompt.selectOptional.mockResolvedValue(selectedPaths);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData).toHaveProperty("optionalSelections");
			expect(versionData.optionalSelections).toEqual(selectedPaths);
		});

		it("should not stage optional file that already exists in destination", async () => {
			const { useCase, fs, calls, prompt } = createProjectFixture();
			// User selects the first optional file
			const firstOptional = optionalRules[0]!;
			prompt.selectOptional.mockResolvedValue([firstOptional.path]);
			// But that file already exists in the destination
			fs.destinationExists.mockImplementation(async (path: string) => path === firstOptional.path);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// The selected optional file should NOT be staged because it already exists
			const stagedOptional = calls.stageFile.filter((p) => p === firstOptional.path);
			expect(stagedOptional.length).toBe(0);
			// But mandatory + standard + pack files (minus existing standard) should still be staged
			// Since destinationExists returns true for the optional path only, standard files
			// that don't exist should still be staged
			expect(calls.stageFile.length).toBe(NON_OPTIONAL_COUNT);
		});

		it("should return error and clean staging when merge engine fails", async () => {
			const { useCase, fs, calls } = createProjectFixture();
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

		it("should show warning but still succeed when gitignore creation fails", async () => {
			const { useCase, prompt, gitignoreCreator } = createProjectFixture();
			// Configure gitignore mock to return failure
			gitignoreCreator.createGitignore.mockResolvedValue({
				ok: false,
				error: {
					destPath: "/tmp/project",
					message: "Failed to write .gitignore: Permission denied",
					code: "WRITE_FAILED",
				},
			} as Result<void, GitignoreError>);

			const result = await useCase.execute("/tmp/project");

			// Gitignore failure should NOT cause the install to fail
			expect(result.ok).toBe(true);
			// Warning should have been shown about gitignore, including --verbose hint
			expect(prompt.showWarning).toHaveBeenCalledWith(expect.stringContaining(".gitignore"));
			expect(prompt.showWarning).toHaveBeenCalledWith(expect.stringContaining("--verbose"));
		});

		it("should handle version file write failure gracefully", async () => {
			const { useCase, fs, calls } = createProjectFixture();
			fs.writeVersionFile.mockRejectedValue(new Error("Permission denied"));

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toContain("version file");
			expect(calls.cleanStaging).toBe(1);
		});

		it("should create .opencode symlinks when optional files are selected", async () => {
			const { useCase, symlinkCreator } = createProjectFixture();

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// createSymlinks called once (opencode only)
			expect(symlinkCreator.createSymlinksCalls).toHaveLength(1);
		});

		it("should create .opencode symlinks even when no optionals selected", async () => {
			const { useCase, prompt, symlinkCreator } = createProjectFixture();
			prompt.selectOptional.mockResolvedValue([]);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// createSymlinks called only once (opencode only)
			expect(symlinkCreator.createSymlinksCalls).toHaveLength(1);
		});

		it("should show warning but still succeed when .opencode symlinks fail", async () => {
			const { useCase, prompt, symlinkCreator } = createProjectFixture();
			// Configure symlink mock to fail
			const symlinkErrorData: SymlinkError = {
				target: "../agents",
				linkPath: ".opencode/agents",
				message: "Disk full",
			};
			symlinkCreator.createSymlinks.mockResolvedValue({
				ok: false,
				error: [symlinkErrorData],
			} as Result<void, SymlinkError[]>);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.showWarning).toHaveBeenCalledTimes(1);
			expect(prompt.showWarning).toHaveBeenCalledWith(expect.stringContaining("symlink"));
			// Project Install does NOT set retryHint → no re-run hint in warning
			expect(prompt.showWarning).not.toHaveBeenCalledWith(
				expect.stringContaining("Re-run the installer"),
			);
		});

		it("should emit progress events during merge", async () => {
			const { useCase, prompt } = createProjectFixture();

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Progress bar should have been initialized with the correct label
			expect(prompt.showProgressBar).toHaveBeenCalled();
			expect(prompt.showProgressBar).toHaveBeenCalledWith(expect.any(Number), "Project install...");
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
			const { useCase, prompt } = createProjectFixture();

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/agents");
			expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/commands");
			expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/skills");
			expect(prompt.logProgressEvent).toHaveBeenCalledWith("gitignore: Generated .gitignore");
		});

		it("should persist default pack to version file when force=true", async () => {
			const { useCase, calls, prompt } = createProjectFixture();

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			// Project force=true uses ONLY the default pack — no interactive pack menu
			expect(prompt.selectPacks).not.toHaveBeenCalled();
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.installedPacks).toEqual([...DEFAULT_PACKS]);
			// v2.0 writer emits "version" (not legacy "installedVersion")
			expect(versionData.version).toBeDefined();
			expect(versionData.installedVersion).toBeUndefined();
		});

		it("should persist custom pack selection to version file", async () => {
			const { useCase, calls, prompt } = createProjectFixture();
			prompt.selectPacks.mockResolvedValueOnce(["software-development", "business"]);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.installedPacks).toEqual(["software-development", "business"]);
		});

		it("should abort when user cancels the pack selection wizard (no partial install)", async () => {
			const { useCase, calls, prompt } = createProjectFixture();
			prompt.selectPacks.mockResolvedValueOnce([]);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Cancel aborts before merging — nothing staged, no version file written
			expect(calls.stageFile.length).toBe(0);
			expect(calls.writeVersionFile.length).toBe(0);
			expect(calls.commitStaging).toBe(0);
		});

		it("shows install summary before merge", async () => {
			const { useCase, prompt } = createProjectFixture();

			await useCase.execute("/tmp/project", { force: true });

			// force=true uses only DEFAULT_PACKS (software-development, 146 agents)
			expect(prompt.showInstallSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					packs: expect.arrayContaining([{ id: "software-development", agentCount: 146 }]),
					totalAgents: 146,
				}),
			);
		});

		it("should respect explicit options.packs override (skips wizard, only business pack)", async () => {
			const { useCase, calls, prompt } = createProjectFixture();

			const result = await useCase.execute("/tmp/project", {
				force: true,
				packs: ["business"],
			});

			expect(result.ok).toBe(true);
			// CLI-provided packs bypass the pack-selection wizard entirely
			expect(prompt.selectPacks).not.toHaveBeenCalled();
			// Summary reports the business pack with its manifest agent count
			expect(prompt.showInstallSummary).toHaveBeenCalledWith(
				expect.objectContaining({
					packs: expect.arrayContaining([{ id: "business", agentCount: 92 }]),
				}),
			);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.installedPacks).toEqual(["business"]);
			// Only the business pack's rule is staged — software-development is excluded
			expect(calls.stageFile).toContain("packs/business");
			expect(calls.stageFile).not.toContain("packs/software-development");
		});

		it("should preserve existing standard files when installing a non-default pack", async () => {
			const { useCase, fs, calls } = createProjectFixture();
			// README.md already exists in the destination → standard rule skips it
			fs.destinationExists.mockImplementation(async (path: string) => path === "README.md");

			const result = await useCase.execute("/tmp/project", {
				force: true,
				packs: ["business"],
			});

			expect(result.ok).toBe(true);
			// Existing standard file is carried over, never overwritten
			expect(calls.stageFile).not.toContain("README.md");
			// The non-default pack's agents are still staged
			expect(calls.stageFile).toContain("packs/business");
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.installedPacks).toEqual(["business"]);
		});
	});
});
