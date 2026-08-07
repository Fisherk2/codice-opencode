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
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";
import type { IStagingSystem } from "../../../src/domain/ports/IStagingSystem";

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

export interface MockedUserPrompt extends IUserPrompt {
	showWarning: Mock<IUserPrompt["showWarning"]>;
	showInfo: Mock<IUserPrompt["showInfo"]>;
	confirm: Mock<IUserPrompt["confirm"]>;
	selectOptional: Mock<IUserPrompt["selectOptional"]>;
	showProgressBar: Mock<IUserPrompt["showProgressBar"]>;
	updateProgress: Mock<IUserPrompt["updateProgress"]>;
	completeProgress: Mock<IUserPrompt["completeProgress"]>;
	logProgressEvent: Mock<IUserPrompt["logProgressEvent"]>;
	showIntro: Mock<IUserPrompt["showIntro"]>;
	showSuccess: Mock<IUserPrompt["showSuccess"]>;
	showCancel: Mock<IUserPrompt["showCancel"]>;
	showError: Mock<IUserPrompt["showError"]>;
	promptForMode: Mock<IUserPrompt["promptForMode"]>;
	selectPacks: Mock<IUserPrompt["selectPacks"]>;
	showVersionInfo: Mock<IUserPrompt["showVersionInfo"]>;
	selectUpdateOption: Mock<IUserPrompt["selectUpdateOption"]>;
	showInstallSummary: Mock<IUserPrompt["showInstallSummary"]>;
}

/** User prompt mock that also captures every logProgressEvent message. */
export interface UserPromptMock extends MockedUserPrompt {
	readonly logEntries: string[];
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

export type PromptMockOptions =
	| { readonly selectOptionalDefault?: "none" }
	| {
			readonly selectOptionalDefault: "all";
			readonly allOptionalPaths: readonly string[];
	  };
