import { describe, expect, it } from "bun:test";
import { DEFAULT_PACKS } from "../../../src/application/packOptions";
import { CleanInstallUseCase } from "../../../src/application/use-cases/CleanInstallUseCase";
import {
	FILE_RULE_MANIFEST,
	filterByPacks,
	getRulesByCategory,
} from "../../../src/domain/entities/FileRuleManifest";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";
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
const STAGEABLE_COUNT = filterByPacks(FILE_RULE_MANIFEST, DEFAULT_PACKS).filter(
	(r) => !r.noTemplateCopy,
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
 * Wire a fully-mocked CleanInstallUseCase (mirrors clean-install.test.ts).
 * The shared prompt mock captures logProgressEvent messages into
 * prompt.logEntries so ordering assertions stay self-contained.
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

// ---------------------------------------------------------------------------
// Tests: Structured log events
// ---------------------------------------------------------------------------

describe("CleanInstallUseCase structured log events", () => {
	it("should emit all structured log events during a successful install", async () => {
		const { useCase, prompt } = createCleanFixture();

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
		const { useCase, prompt } = createCleanFixture();

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
		const { useCase, prompt } = createCleanFixture();

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
		const { useCase, fs, prompt } = createCleanFixture();
		// Make stageFile throw to trigger merge failure
		fs.stageFile.mockRejectedValue(new Error("Disk full"));

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
		const { useCase, prompt } = createCleanFixture();
		// User selects NO optional files
		prompt.selectOptional.mockResolvedValue([]);

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
