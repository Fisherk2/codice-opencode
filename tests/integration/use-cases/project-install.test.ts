import { describe, expect, it, mock as mockFn } from "bun:test";
import { DEFAULT_PACKS } from "../../../src/application/packOptions";
import type { IGitignoreCreator } from "../../../src/application/ports/IGitignoreCreator";
import type { ISymlinkCreator } from "../../../src/application/ports/ISymlinkCreator";
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import { ProjectInstallUseCase } from "../../../src/application/use-cases/ProjectInstallUseCase";
import type { FileRule } from "../../../src/domain/entities/FileRule";
import {
	FILE_RULE_MANIFEST,
	filterByPacks,
	getRulesByCategory,
} from "../../../src/domain/entities/FileRuleManifest";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";
import type { IStagingSystem } from "../../../src/domain/ports/IStagingSystem";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";
import type { GitignoreError } from "../../../src/domain/types/GitignoreError";
import type { Result } from "../../../src/domain/types/Result";
import type { SymlinkError } from "../../../src/domain/types/SymlinkError";
import { OPENCODE_SYMLINKS } from "../../../src/infrastructure/config/symlinks";

/** Stageable rules after default pack filtering (software-development only) */
const STAGEABLE_DEFAULT_PACK_RULES = filterByPacks(FILE_RULE_MANIFEST, DEFAULT_PACKS).filter(
	(r) => !r.noTemplateCopy,
);

/**
 * Create a mock IFileSystem with configurable default behaviors.
 * Each test can override specific methods via the returned object.
 */
function createMockFileSystem(): {
	stub: IFileSystem & IStagingSystem;
	calls: {
		stageFile: string[];
		commitStaging: number;
		cleanStaging: number;
		writeVersionFile: string[];
		destinationExists: string[];
	};
} {
	const calls = {
		stageFile: [] as string[],
		commitStaging: 0,
		cleanStaging: 0,
		writeVersionFile: [] as string[],
		destinationExists: [] as string[],
	};

	const stub: IFileSystem & IStagingSystem = {
		destinationExists: mockFn(async (path: string) => {
			calls.destinationExists.push(path);
			return false;
		}),
		stageFile: mockFn(async (path: string) => {
			calls.stageFile.push(path);
		}) as (path: string, destPath?: string, excludeSubDirs?: Set<string>) => Promise<void>,
		commitStaging: mockFn(async () => {
			calls.commitStaging++;
		}),
		cleanStaging: mockFn(async () => {
			calls.cleanStaging++;
		}),
		isWritable: mockFn(() => Promise.resolve(true)),
		isEmpty: mockFn(() => Promise.resolve(true)),
		writeVersionFile: mockFn(async (data: string) => {
			calls.writeVersionFile.push(data);
		}),
		readVersionFile: mockFn(() => Promise.resolve(null)),
		walkTemplateDirectory: mockFn(() => Promise.resolve([])),
		walkDestinationDirectory: mockFn(() => Promise.resolve([])),
	};

	return { stub, calls };
}

/**
 * Create a mock IUserPrompt with configurable return values.
 */
function createMockPrompt(): IUserPrompt {
	return {
		showWarning: mockFn(() => {}),
		showInfo: mockFn(() => {}),
		confirm: mockFn(() => Promise.resolve(true)),
		selectOptional: mockFn((options: FileRule[]) => Promise.resolve(options.map((o) => o.path))),
		showProgressBar: mockFn(() => {}),
		updateProgress: mockFn(() => {}),
		completeProgress: mockFn(() => {}),
		logProgressEvent: mockFn(() => {}),
		showIntro: mockFn(() => {}),
		showSuccess: mockFn(() => {}),
		showCancel: mockFn(() => {}),
		showError: mockFn(() => {}),
		promptForMode: mockFn(() => Promise.resolve<"clean" | "project" | "update" | null>(null)),
		selectPacks: mockFn(() => Promise.resolve(["software-development"] as const)),
		showVersionInfo: mockFn(() => {}),
		selectUpdateOption: mockFn(() =>
			Promise.resolve<"current" | "add" | "cancel" | null>("current"),
		),
		showInstallSummary: mockFn(() => {}),
	};
}

const optionalRules = getRulesByCategory("optional");

/**
 * Create a mock ISymlinkCreator that records calls.
 */
function createMockSymlinkCreator(): ISymlinkCreator & { getCreateSymlinksCalls(): number } {
	let callCount = 0;
	return {
		createSymlink: mockFn(() => Promise.resolve({ ok: true, value: undefined } as const)),
		createSymlinks: mockFn(() => {
			callCount++;
			return Promise.resolve({ ok: true, value: undefined } as const);
		}),
		getCreateSymlinksCalls: () => callCount,
	};
}

/**
 * Create a mock IGitignoreCreator that records calls.
 */
function createMockGitignoreCreator(): IGitignoreCreator & {
	gitignoreCalls: string[];
} {
	const calls: string[] = [];
	return {
		createGitignore: mockFn((destPath: string) => {
			calls.push(destPath);
			return Promise.resolve({ ok: true, value: undefined } as Result<void, GitignoreError>);
		}),
		get gitignoreCalls() {
			return calls;
		},
	};
}

describe("ProjectInstallUseCase", () => {
	describe("constructor", () => {
		it("should create an instance when given valid dependencies", () => {
			const { stub: fs } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);
			expect(useCase).toBeInstanceOf(ProjectInstallUseCase);
		});
	});

	describe("execute", () => {
		it("should copy all files respecting category rules when destination is empty", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

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
			const { stub: fs, calls } = createMockFileSystem();
			// fs.isEmpty already returns true by default
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Should NOT have asked for confirmation (isEmpty short-circuits)
			expect(prompt.confirm).not.toHaveBeenCalled();
			// Operation proceeds normally
			expect(calls.stageFile.length).toBe(STAGEABLE_DEFAULT_PACK_RULES.length);
			expect(calls.commitStaging).toBe(1);
		});

		it("should return an error when destination is not writable", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.isWritable as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toContain("Permission denied");
			// No files should have been staged
			expect(calls.stageFile.length).toBe(0);
		});

		it("should ask for confirmation when destination is not empty and force=false", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.isEmpty as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const prompt = createMockPrompt();
			(prompt.confirm as ReturnType<typeof mockFn>).mockResolvedValue(true);
			const engine = new FileMergeEngine(fs);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.confirm).toHaveBeenCalledTimes(1);
			expect(calls.stageFile.length).toBe(STAGEABLE_DEFAULT_PACK_RULES.length);
		});

		it("should skip installation when user rejects the confirmation", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.isEmpty as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const prompt = createMockPrompt();
			(prompt.confirm as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const engine = new FileMergeEngine(fs);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.confirm).toHaveBeenCalledTimes(1);
			expect(calls.stageFile.length).toBe(0);
		});

		it("should skip confirmation and optional selection when force=true", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.isEmpty as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			expect(prompt.confirm).not.toHaveBeenCalled();
			expect(prompt.selectOptional).not.toHaveBeenCalled();
			// Only non-optional files should be staged (default pack, mandatory + standard)
			const nonOptionalCount = STAGEABLE_DEFAULT_PACK_RULES.filter(
				(r) => r.category !== "optional",
			).length;
			expect(calls.stageFile.length).toBe(nonOptionalCount);
		});

		it("should present optional files checkbox and use selected paths", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			// User selects only a stageable optional file
			const stageableOptional = optionalRules.find((r) => !r.noTemplateCopy)!;
			(prompt.selectOptional as ReturnType<typeof mockFn>).mockResolvedValue([
				stageableOptional.path,
			]);
			const engine = new FileMergeEngine(fs);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// selectOptional should have been called with optional rules
			expect(prompt.selectOptional).toHaveBeenCalledTimes(1);
			const selectArgs = (prompt.selectOptional as ReturnType<typeof mockFn>).mock.calls[0]!;
			expect(selectArgs[0].length).toBe(optionalRules.length);
			// Only one optional file was selected, so non-selected optional files are skipped
			// Default pack + mandatory + standard + 1 selected stageable optional
			const stageableNonOptional = STAGEABLE_DEFAULT_PACK_RULES.filter(
				(r) => r.category !== "optional",
			).length;
			expect(calls.stageFile.length).toBe(stageableNonOptional + 1);
		});

		it("should skip optional files when user selects none", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			(prompt.selectOptional as ReturnType<typeof mockFn>).mockResolvedValue([]);
			const engine = new FileMergeEngine(fs);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Only mandatory + standard files should be staged (default pack, no optionals)
			const nonOptionalCount = STAGEABLE_DEFAULT_PACK_RULES.filter(
				(r) => r.category !== "optional",
			).length;
			expect(calls.stageFile.length).toBe(nonOptionalCount);
		});

		it("should carry over standard files that already exist", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const standardRules = getRulesByCategory("standard");
			// First standard file exists in destination
			(fs.destinationExists as ReturnType<typeof mockFn>).mockImplementation(
				async (path: string) => path === standardRules[0]?.path,
			);
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Standard file that existed should NOT be staged
			const stagedFirstStandard = calls.stageFile.filter((p) => p === standardRules[0]?.path);
			expect(stagedFirstStandard.length).toBe(0);
		});

		it("should write optionalSelections in version file", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			const selectedPaths = [optionalRules[0]!.path];
			(prompt.selectOptional as ReturnType<typeof mockFn>).mockResolvedValue(selectedPaths);
			const engine = new FileMergeEngine(fs);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData).toHaveProperty("optionalSelections");
			expect(versionData.optionalSelections).toEqual(selectedPaths);
		});

		it("should not stage optional file that already exists in destination", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			// User selects the first optional file
			const firstOptional = optionalRules[0]!;
			(prompt.selectOptional as ReturnType<typeof mockFn>).mockResolvedValue([firstOptional.path]);
			// But that file already exists in the destination
			(fs.destinationExists as ReturnType<typeof mockFn>).mockImplementation(
				async (path: string) => path === firstOptional.path,
			);
			const engine = new FileMergeEngine(fs);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// The selected optional file should NOT be staged because it already exists
			const stagedOptional = calls.stageFile.filter((p) => p === firstOptional.path);
			expect(stagedOptional.length).toBe(0);
			// But mandatory + standard + pack files (minus existing standard) should still be staged
			// Since destinationExists returns true for the optional path only, standard files
			// that don't exist should still be staged
			const nonOptionalCount = STAGEABLE_DEFAULT_PACK_RULES.filter(
				(r) => r.category !== "optional",
			).length;
			expect(calls.stageFile.length).toBe(nonOptionalCount);
		});

		it("should return error and clean staging when merge engine fails", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			// Make stageFile throw to trigger a merge engine failure
			(fs.stageFile as ReturnType<typeof mockFn>).mockRejectedValue(
				new Error("Disk full during staging"),
			);
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

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
			const { stub: fs } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const gitignoreCreator = createMockGitignoreCreator();
			// Configure gitignore mock to return failure
			(gitignoreCreator.createGitignore as ReturnType<typeof mockFn>).mockResolvedValue({
				ok: false,
				error: {
					destPath: "/tmp/project",
					message: "Failed to write .gitignore: Permission denied",
					code: "WRITE_FAILED",
				},
			} as Result<void, GitignoreError>);
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			// Gitignore failure should NOT cause the install to fail
			expect(result.ok).toBe(true);
			// Warning should have been shown about gitignore, including --verbose hint
			expect(prompt.showWarning).toHaveBeenCalledWith(expect.stringContaining(".gitignore"));
			expect(prompt.showWarning).toHaveBeenCalledWith(expect.stringContaining("--verbose"));
		});

		it("should handle version file write failure gracefully", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.writeVersionFile as ReturnType<typeof mockFn>).mockRejectedValue(
				new Error("Permission denied"),
			);
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toContain("version file");
			expect(calls.cleanStaging).toBe(1);
		});

		it("should create .opencode symlinks when optional files are selected", async () => {
			const { stub: fs } = createMockFileSystem();
			const prompt = createMockPrompt();
			const symlinkMock = createMockSymlinkCreator();
			const engine = new FileMergeEngine(fs);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkMock,
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// createSymlinks called once (opencode only)
			expect(symlinkMock.getCreateSymlinksCalls()).toBe(1);
		});

		it("should create .opencode symlinks even when no optionals selected", async () => {
			const { stub: fs } = createMockFileSystem();
			const prompt = createMockPrompt();
			(prompt.selectOptional as ReturnType<typeof mockFn>).mockResolvedValue([]);
			const symlinkMock = createMockSymlinkCreator();
			const engine = new FileMergeEngine(fs);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkMock,
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// createSymlinks called only once (opencode only)
			expect(symlinkMock.getCreateSymlinksCalls()).toBe(1);
		});

		it("should show warning but still succeed when .opencode symlinks fail", async () => {
			const { stub: fs } = createMockFileSystem();
			const prompt = createMockPrompt();
			// Configure symlink mock to fail
			const symlinkErrorData: SymlinkError = {
				target: "../agents",
				linkPath: ".opencode/agents",
				message: "Disk full",
			};
			const symlinkMock = createMockSymlinkCreator();
			symlinkMock.createSymlinks = mockFn(() =>
				Promise.resolve({
					ok: false,
					error: [symlinkErrorData],
				} as Result<void, SymlinkError[]>),
			);
			const engine = new FileMergeEngine(fs);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkMock,
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

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
			const { stub: fs } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
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
			const { stub: fs } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
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

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/agents");
			expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/commands");
			expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/skills");
			expect(prompt.logProgressEvent).toHaveBeenCalledWith("gitignore: Generated .gitignore");
		});

		it("should persist default pack to version file when force=true", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

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
			const { stub: fs, calls } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			(prompt.selectPacks as ReturnType<typeof mockFn>).mockResolvedValueOnce([
				"software-development",
				"business",
			]);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.installedPacks).toEqual(["software-development", "business"]);
		});

		it("should abort when user cancels the pack selection wizard (no partial install)", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			(prompt.selectPacks as ReturnType<typeof mockFn>).mockResolvedValueOnce([]);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new ProjectInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				OPENCODE_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Cancel aborts before merging — nothing staged, no version file written
			expect(calls.stageFile.length).toBe(0);
			expect(calls.writeVersionFile.length).toBe(0);
			expect(calls.commitStaging).toBe(0);
		});
	});
});
