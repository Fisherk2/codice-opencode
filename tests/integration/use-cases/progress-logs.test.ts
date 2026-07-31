import { describe, expect, it, mock as mockFn } from "bun:test";
import type { IGitignoreCreator } from "../../../src/application/ports/IGitignoreCreator";
import type { ISymlinkCreator } from "../../../src/application/ports/ISymlinkCreator";
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import { CleanInstallUseCase } from "../../../src/application/use-cases/CleanInstallUseCase";
import { FILE_RULE_MANIFEST } from "../../../src/domain/entities/FileRuleManifest";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";
import type { IStagingSystem } from "../../../src/domain/ports/IStagingSystem";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";
import type { GitignoreError } from "../../../src/domain/types/GitignoreError";
import type { Result } from "../../../src/domain/types/Result";
import type { SymlinkError } from "../../../src/domain/types/SymlinkError";
import { OPENCODE_SYMLINKS } from "../../../src/infrastructure/config/symlinks";

/** Entries that require actual template file staging (excludes noTemplateCopy) */
const STAGEABLE_COUNT = FILE_RULE_MANIFEST.filter((r) => !r.noTemplateCopy).length;

// ---------------------------------------------------------------------------
// Helper factories (mirroring patterns from clean-install.test.ts)
// ---------------------------------------------------------------------------

function createMockFileSystem(): {
	stub: IFileSystem & IStagingSystem;
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

	const stub: IFileSystem & IStagingSystem = {
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
		walkTemplateDirectory: mockFn(() => Promise.resolve([])),
		walkDestinationDirectory: mockFn(() => Promise.resolve([])),
	};

	return { stub, calls };
}

/**
 * Create a mock IUserPrompt that captures all logProgressEvent calls
 * so we can assert both content and ordering of structured log events.
 */
function createMockPrompt(): IUserPrompt & { logEntries: string[] } {
	const logEntries: string[] = [];
	return {
		showWarning: mockFn(() => {}),
		showInfo: mockFn(() => {}),
		confirm: mockFn(() => Promise.resolve(true)),
		selectOptional: mockFn((options: readonly { path: string }[]) =>
			Promise.resolve(options.map((o) => o.path)),
		),
		showSpinner: mockFn(() => {}),
		stopSpinner: mockFn(() => {}),
		showProgressBar: mockFn(() => {}),
		updateProgress: mockFn(() => {}),
		completeProgress: mockFn(() => {}),
		logProgressEvent: mockFn((message: string) => {
			logEntries.push(message);
		}),
		showIntro: mockFn(() => {}),
		showSuccess: mockFn(() => {}),
		showCancel: mockFn(() => {}),
		showError: mockFn(() => {}),
		promptForMode: mockFn(() => Promise.resolve<"clean" | "project" | "update" | null>(null)),
		get logEntries() {
			return logEntries;
		},
	};
}

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

// ---------------------------------------------------------------------------
// Tests: Structured log events
// ---------------------------------------------------------------------------

describe("CleanInstallUseCase structured log events", () => {
	it("should emit all structured log events during a successful install", async () => {
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
			OPENCODE_SYMLINKS,
			gitignoreCreator,
		);

		const result = await useCase.execute("/tmp/project");

		expect(result.ok).toBe(true);

		// Commit messages should include the expected total
		expect(prompt.logProgressEvent).toHaveBeenCalledWith(
			`commit: Committing ${STAGEABLE_COUNT} files atomically...`,
		);
		expect(prompt.logProgressEvent).toHaveBeenCalledWith(
			`commit: ${STAGEABLE_COUNT} files committed`,
		);

		// Symlink messages should be exact
		expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/agents");
		expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/commands");
		expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/skills");

		// Gitignore message should be exact
		expect(prompt.logProgressEvent).toHaveBeenCalledWith("gitignore: Generated .gitignore");
	});

	it("should emit commit messages before gitignore and symlink messages", async () => {
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
			OPENCODE_SYMLINKS,
			gitignoreCreator,
		);

		const result = await useCase.execute("/tmp/project");

		expect(result.ok).toBe(true);

		const logEntries = prompt.logEntries;

		// Find the indices of key log events
		const commitStartIdx = logEntries.findIndex((msg) => msg.startsWith("commit: Committing"));
		const commitCompleteIdx = logEntries.findIndex(
			(msg) => msg.startsWith("commit: ") && msg.endsWith("committed"),
		);
		const gitignoreIdx = logEntries.findIndex((msg) => msg.startsWith("gitignore:"));
		const symlinkIdx = logEntries.findIndex((msg) => msg.startsWith("symlink:"));

		// All indices should be found
		expect(commitStartIdx).toBeGreaterThanOrEqual(0);
		expect(commitCompleteIdx).toBeGreaterThan(commitStartIdx);
		// gitignore and symlink events now emit AFTER commit (from postInstall.ts)
		expect(gitignoreIdx).toBeGreaterThan(commitCompleteIdx);
		expect(symlinkIdx).toBeGreaterThan(gitignoreIdx);
	});

	it("should emit log events for all opencode symlinks (2 commit + 1 gitignore + 3 symlinks)", async () => {
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
			OPENCODE_SYMLINKS,
			gitignoreCreator,
		);

		const result = await useCase.execute("/tmp/project");

		expect(result.ok).toBe(true);

		// Count logProgressEvent calls by category
		const commitCalls = prompt.logEntries.filter((msg) => msg.startsWith("commit:"));
		const symlinkCalls = prompt.logEntries.filter((msg) => msg.startsWith("symlink:"));
		const gitignoreCalls = prompt.logEntries.filter((msg) => msg.startsWith("gitignore:"));

		expect(commitCalls).toHaveLength(2);
		// All opencode (3) symlinks get log events
		expect(symlinkCalls).toHaveLength(OPENCODE_SYMLINKS.length);
		expect(gitignoreCalls).toHaveLength(1);
		expect(prompt.logEntries).toHaveLength(2 + 1 + OPENCODE_SYMLINKS.length);
	});

	it("should emit only commit log events when merge fails (no symlink/gitignore)", async () => {
		const { stub: fs } = createMockFileSystem();
		// Make stageFile throw to trigger merge failure
		(fs.stageFile as ReturnType<typeof mockFn>).mockRejectedValue(new Error("Disk full"));
		const engine = new FileMergeEngine(fs);
		const prompt = createMockPrompt();
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

		const result = await useCase.execute("/tmp/project");

		expect(result.ok).toBe(false);

		// Should NOT have symlink or gitignore log events (merge never completed)
		const symlinkCalls = prompt.logEntries.filter((msg) => msg.startsWith("symlink:"));
		const gitignoreCalls = prompt.logEntries.filter((msg) => msg.startsWith("gitignore:"));
		expect(symlinkCalls).toHaveLength(0);
		expect(gitignoreCalls).toHaveLength(0);

		// Error log event should be present
		const errorCalls = prompt.logEntries.filter((msg) => msg.startsWith("error:"));
		expect(errorCalls).toHaveLength(1);
		expect(errorCalls[0]).toContain("Disk full");
	});

	it("should still emit symlink/gitignore log events when no optionals are selected", async () => {
		const { stub: fs } = createMockFileSystem();
		const engine = new FileMergeEngine(fs);
		const prompt = createMockPrompt();
		// User selects NO optional files
		(prompt.selectOptional as ReturnType<typeof mockFn>).mockResolvedValue([]);
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

		const result = await useCase.execute("/tmp/project");

		expect(result.ok).toBe(true);

		// Symlink and gitignore log events should still be emitted
		// (.opencode symlinks always created, gitignore always generated)
		expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/agents");
		expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/commands");
		expect(prompt.logProgressEvent).toHaveBeenCalledWith("symlink: Created .opencode/skills");
		expect(prompt.logProgressEvent).toHaveBeenCalledWith("gitignore: Generated .gitignore");
	});
});
