/**
 * Shared CleanInstallUseCase fixture for integration tests.
 *
 * clean-install.test.ts and progress-logs.test.ts both wire the same
 * fully-mocked CleanInstallUseCase; extracted here so a change to the
 * use case constructor signature updates one file instead of two.
 * Kept out of test-doubles.ts to respect the 200-line convention
 * (same split pattern as mock-types.ts / test-doubles.ts).
 *
 * No `.test.` suffix: imported by tests, not executed.
 */

import { CleanInstallUseCase } from "../../../src/application/use-cases/CleanInstallUseCase";
import { getRulesByCategory } from "../../../src/domain/entities/FileRuleManifest";
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

export interface CleanInstallFixture {
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
export function createCleanInstallFixture(
	options: FileSystemMockOptions = {},
): CleanInstallFixture {
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
