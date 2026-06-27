import { describe, expect, it, mock as mockFn } from "bun:test";
import type { IGitignoreCreator } from "../../../src/application/ports/IGitignoreCreator";
import type { ISymlinkCreator } from "../../../src/application/ports/ISymlinkCreator";
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import { CleanInstallUseCase } from "../../../src/application/use-cases/CleanInstallUseCase";
import { FILE_RULE_MANIFEST } from "../../../src/domain/entities/FileRuleManifest";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";
import type { GitignoreError } from "../../../src/domain/types/GitignoreError";
import type { Result } from "../../../src/domain/types/Result";
import type { SymlinkError } from "../../../src/domain/types/SymlinkError";

/** Entries that require actual template file staging (excludes noTemplateCopy) */
const STAGEABLE_RULES = FILE_RULE_MANIFEST.filter((r) => !r.noTemplateCopy);

/**
 * Create a mock IFileSystem with configurable default behaviors.
 * Each test can override specific methods via the returned object.
 */
function createMockFileSystem(): {
	stub: IFileSystem;
	calls: {
		stageFile: string[];
		commitStaging: number;
		cleanStaging: number;
		writeVersionFile: string[];
	};
} {
	const calls = {
		stageFile: [] as string[],
		commitStaging: 0,
		cleanStaging: 0,
		writeVersionFile: [] as string[],
	};

	const stub: IFileSystem = {
		readTemplateFile: mockFn(() => Promise.resolve("")),
		destinationExists: mockFn(() => Promise.resolve(false)),
		getStagingPath: mockFn((path: string) => `.codice-staging/${path}`),
		stageFile: mockFn(async (path: string) => {
			calls.stageFile.push(path);
		}) as (path: string, excludeSubDirs?: Set<string>) => Promise<void>,
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
	};

	return { stub, calls };
}

// Symlink specs for testing — matches what the composition root passes
const TEST_SYMLINKS = [
	{ target: "../agents", linkPath: ".opencode/agents" },
	{ target: "../commands", linkPath: ".opencode/commands" },
	{ target: "../skills", linkPath: ".opencode/skills" },
	{ target: "../skills", linkPath: ".devin/skills" },
	{ target: "../commands", linkPath: ".devin/workflows" },
	{ target: "../../docs/CODE_STYLE.md", linkPath: ".devin/rules/CODE_STYLE.md" },
	{ target: "../../CONTRIBUTING.md", linkPath: ".devin/rules/CONTRIBUTING.md" },
	{
		target: "../../skills/code-review-and-quality/SKILL.md",
		linkPath: ".devin/rules/code-review-and-quality.md",
	},
	{
		target: "../../skills/incremental-implementation/SKILL.md",
		linkPath: ".devin/rules/incremental-implementation.md",
	},
	{
		target: "../../skills/test-driven-development/SKILL.md",
		linkPath: ".devin/rules/test-driven-development.md",
	},
];

/**
 * Create a mock ISymlinkCreator that records calls.
 */
function createMockSymlinkCreator(): ISymlinkCreator & {
	createSymlinksCalls: Array<readonly unknown[]>;
} {
	const calls: Array<readonly unknown[]> = [];
	return {
		createSymlink: mockFn(() =>
			Promise.resolve({ ok: true, value: undefined } as Result<void, SymlinkError>),
		),
		createSymlinks: mockFn((symlinks: readonly unknown[]) => {
			calls.push(symlinks);
			return Promise.resolve({ ok: true, value: undefined } as Result<void, SymlinkError[]>);
		}),
		get createSymlinksCalls() {
			return calls;
		},
	};
}

/**
 * Create a mock IUserPrompt with configurable return values.
 */
function createMockPrompt(): IUserPrompt {
	return {
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
		promptForMode: mockFn(() => Promise.resolve<"clean" | "project" | "update" | null>(null)),
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

describe("CleanInstallUseCase", () => {
	describe("constructor", () => {
		it("should create an instance when given valid dependencies", () => {
			const { stub: fs } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const symlinkCreator = createMockSymlinkCreator();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new CleanInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkCreator,
				TEST_SYMLINKS,
				gitignoreCreator,
			);
			expect(useCase).toBeInstanceOf(CleanInstallUseCase);
		});
	});

	describe("execute", () => {
		it("should copy all files from the manifest when destination is empty", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const symlinkCreator = createMockSymlinkCreator();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new CleanInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkCreator,
				TEST_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// All manifest files should be staged (since all are treated as mandatory)
			expect(calls.stageFile.length).toBe(STAGEABLE_RULES.length);
			// Commit should have been called
			expect(calls.commitStaging).toBe(1);
			// Version file should be written
			expect(calls.writeVersionFile.length).toBe(1);
			// Gitignore should have been generated with the destination path
			expect(gitignoreCreator.gitignoreCalls).toHaveLength(1);
			expect(gitignoreCreator.gitignoreCalls[0]).toBe("/tmp/project");
		});

		it("should show warning but still succeed when gitignore creation fails", async () => {
			const { stub: fs } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const symlinkCreator = createMockSymlinkCreator();
			const gitignoreCreator = createMockGitignoreCreator();
			// Configure gitignore mock to return failure
			(gitignoreCreator.createGitignore as ReturnType<typeof mockFn>).mockResolvedValue({
				ok: false,
				error: {
					destPath: "/tmp/project",
					message: "Failed to read template gitignore",
					code: "READ_FAILED",
				},
			} as Result<void, GitignoreError>);
			const useCase = new CleanInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkCreator,
				TEST_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			// Gitignore failure should NOT cause the install to fail
			expect(result.ok).toBe(true);
			// Warning should have been shown about gitignore, including --verbose hint
			expect(prompt.showWarning).toHaveBeenCalledWith(expect.stringContaining(".gitignore"));
			expect(prompt.showWarning).toHaveBeenCalledWith(expect.stringContaining("--verbose"));
		});

		it("should create symlinks after successful merge", async () => {
			const { stub: fs } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const symlinkCreator = createMockSymlinkCreator();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new CleanInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkCreator,
				TEST_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(symlinkCreator.createSymlinksCalls).toHaveLength(1);
			// Verify it was called with the TEST_SYMLINKS array
			const passedSpecs = symlinkCreator.createSymlinksCalls[0];
			expect(passedSpecs).toHaveLength(TEST_SYMLINKS.length);
		});

		it("should show warning but still succeed when symlink creation fails", async () => {
			const { stub: fs } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const symlinkCreator = createMockSymlinkCreator();
			// Configure mock to return symlink failures
			const symlinkError: SymlinkError = {
				target: "../agents",
				linkPath: ".opencode/agents",
				message: "Symlink target does not exist",
			};
			(symlinkCreator.createSymlinks as ReturnType<typeof mockFn>).mockResolvedValue({
				ok: false,
				error: [symlinkError],
			} as Result<void, SymlinkError[]>);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new CleanInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkCreator,
				TEST_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			// Symlink failure should NOT cause the install to fail
			expect(result.ok).toBe(true);
			// Warning should have been shown
			expect(prompt.showWarning).toHaveBeenCalledTimes(1);
			expect(prompt.showWarning).toHaveBeenCalledWith(expect.stringContaining("symlink"));
		});

		it("should return an error when destination is not writable", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.isWritable as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const symlinkCreator = createMockSymlinkCreator();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new CleanInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkCreator,
				TEST_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(false);
			if (result.ok) return; // type guard for the Failure branch
			expect(result.error.message).toContain("Permission denied");
			// No files should have been staged
			expect(calls.stageFile.length).toBe(0);
		});

		it("should ask for confirmation when destination is not empty and force=false", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.isEmpty as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const prompt = createMockPrompt();
			// User confirms
			(prompt.confirm as ReturnType<typeof mockFn>).mockResolvedValue(true);
			const engine = new FileMergeEngine(fs);
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new CleanInstallUseCase(
				fs,
				engine,
				prompt,
				createMockSymlinkCreator(),
				TEST_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.confirm).toHaveBeenCalledTimes(1);
			// Files should be staged after confirmation
			expect(calls.stageFile.length).toBe(STAGEABLE_RULES.length);
		});

		it("should skip installation when user rejects the confirmation", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.isEmpty as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const prompt = createMockPrompt();
			// User rejects
			(prompt.confirm as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const engine = new FileMergeEngine(fs);
			const symlinkMock = createMockSymlinkCreator();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new CleanInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkMock,
				TEST_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.confirm).toHaveBeenCalledTimes(1);
			// No files should be staged
			expect(calls.stageFile.length).toBe(0);
		});

		it("should skip confirmation when force=true even if destination is not empty", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.isEmpty as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const symlinkMock = createMockSymlinkCreator();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new CleanInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkMock,
				TEST_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			// Should NOT have asked for confirmation
			expect(prompt.confirm).not.toHaveBeenCalled();
			// Files should be staged
			expect(calls.stageFile.length).toBe(STAGEABLE_RULES.length);
		});

		it("should write a JSON version file on success", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const symlinkMock = createMockSymlinkCreator();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new CleanInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkMock,
				TEST_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(calls.writeVersionFile.length).toBe(1);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData).toHaveProperty("installedVersion");
			expect(versionData).toHaveProperty("installedAt");
			expect(typeof versionData.installedAt).toBe("string");
		});

		it("should return error and clean staging when merge engine fails", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			// Make stageFile throw to trigger a merge engine failure
			(fs.stageFile as ReturnType<typeof mockFn>).mockRejectedValue(
				new Error("Disk full during staging"),
			);
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const symlinkMock = createMockSymlinkCreator();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new CleanInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkMock,
				TEST_SYMLINKS,
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

		it("should handle version file write failure gracefully", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.writeVersionFile as ReturnType<typeof mockFn>).mockRejectedValue(new Error("Disk full"));
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const symlinkMock = createMockSymlinkCreator();
			const gitignoreCreator = createMockGitignoreCreator();
			const useCase = new CleanInstallUseCase(
				fs,
				engine,
				prompt,
				symlinkMock,
				TEST_SYMLINKS,
				gitignoreCreator,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(false);
			if (result.ok) return; // type guard for the Failure branch
			expect(result.error.message).toContain("version file");
			// Staging should have been cleaned after the version file failure
			expect(calls.cleanStaging).toBe(1);
		});
	});
});
