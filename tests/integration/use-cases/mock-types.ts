/**
 * Mock type declarations for use-case integration tests.
 *
 * Each Mocked* interface redeclares its methods with the bun:test `Mock<T>`
 * shape so tests can call `.mockResolvedValue(...)`, `.mockImplementation(...)`,
 * and read `.mock.calls` without casts. Split from test-doubles.ts (factories)
 * to keep both files under the 200-line convention.
 *
 * No `.test.` suffix: imported by tests, not executed.
 */

import type { Mock } from "bun:test";
import type { IGitHubClient } from "../../../src/application/ports/IGitHubClient";
import type { IGitignoreCreator } from "../../../src/application/ports/IGitignoreCreator";
import type { ISymlinkCreator } from "../../../src/application/ports/ISymlinkCreator";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";
import type { IStagingSystem } from "../../../src/domain/ports/IStagingSystem";

// User-prompt double types are shared with unit tests; re-exported here so
// existing integration imports keep their import site.
export type {
	MockedUserPrompt,
	PromptMockOptions,
	UserPromptMock,
} from "../../shared/test-doubles";

export interface MockedFileSystem extends IFileSystem, IStagingSystem {
	destinationExists: Mock<IFileSystem["destinationExists"]>;
	stageFile: Mock<IStagingSystem["stageFile"]>;
	commitStaging: Mock<IStagingSystem["commitStaging"]>;
	cleanStaging: Mock<IStagingSystem["cleanStaging"]>;
	isWritable: Mock<IFileSystem["isWritable"]>;
	isEmpty: Mock<IFileSystem["isEmpty"]>;
	writeVersionFile: Mock<IFileSystem["writeVersionFile"]>;
	readVersionFile: Mock<IFileSystem["readVersionFile"]>;
	walkTemplateDirectory: Mock<IFileSystem["walkTemplateDirectory"]>;
	walkDestinationDirectory: Mock<IFileSystem["walkDestinationDirectory"]>;
}

/** Symlink creator mock that records each createSymlinks call's arguments. */
export interface SymlinkCreatorMock extends ISymlinkCreator {
	createSymlink: Mock<ISymlinkCreator["createSymlink"]>;
	createSymlinks: Mock<ISymlinkCreator["createSymlinks"]>;
	readonly createSymlinksCalls: Array<readonly unknown[]>;
}

/** Gitignore creator mock that records each createGitignore destination. */
export interface GitignoreCreatorMock extends IGitignoreCreator {
	createGitignore: Mock<IGitignoreCreator["createGitignore"]>;
	readonly gitignoreCalls: string[];
}

export interface MockedGitHubClient extends IGitHubClient {
	getLatestReleaseTag: Mock<IGitHubClient["getLatestReleaseTag"]>;
}

export interface FileSystemMockOptions {
	/** isEmpty() default. Clean/Project: true; Update: false. */
	readonly isEmpty?: boolean;
	/** Record destinationExists() paths in calls.destinationExists. */
	readonly trackDestinationExists?: boolean;
	/** readVersionFile() resolved value (string JSON or null). */
	readonly readVersionFile?: string | null;
	/** Walk template dirs with the realistic per-standard-dir file lists. */
	readonly realisticWalkTemplate?: boolean;
}

export interface FileSystemMockCalls {
	stageFile: string[];
	commitStaging: number;
	cleanStaging: number;
	writeVersionFile: string[];
	destinationExists?: string[];
}
