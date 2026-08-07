/**
 * Shared mock factories for use-case integration tests.
 *
 * Factories build the Mocked* doubles declared in mock-types.ts. Per-file
 * defaults are expressed through the factory options; each test file's
 * fixture helper passes its mode-specific defaults (see clean-install.test.ts,
 * project-install.test.ts, update-workspace.test.ts).
 *
 * No `.test.` suffix: imported by tests, not executed.
 */

import { mock as mockFn } from "bun:test";
import type { IGitHubClient } from "../../../src/application/ports/IGitHubClient";
import type { IGitignoreCreator } from "../../../src/application/ports/IGitignoreCreator";
import type { ISymlinkCreator, SymlinkSpec } from "../../../src/application/ports/ISymlinkCreator";
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";
import type { IStagingSystem } from "../../../src/domain/ports/IStagingSystem";
import { success } from "../../../src/domain/types/Result";
import type {
	FileSystemMockCalls,
	FileSystemMockOptions,
	GitignoreCreatorMock,
	MockedFileSystem,
	MockedGitHubClient,
	PromptMockOptions,
	SymlinkCreatorMock,
	UserPromptMock,
} from "./mock-types";

export type {
	FileSystemMockCalls,
	FileSystemMockOptions,
	GitignoreCreatorMock,
	MockedFileSystem,
	MockedGitHubClient,
	PromptMockOptions,
	SymlinkCreatorMock,
	UserPromptMock,
} from "./mock-types";

export function createMockFileSystem(options: FileSystemMockOptions = {}): {
	stub: MockedFileSystem;
	calls: FileSystemMockCalls;
} {
	const {
		isEmpty = true,
		trackDestinationExists = false,
		readVersionFile = null,
		realisticWalkTemplate = false,
	} = options;

	const destinationExistsCalls: string[] = [];
	const calls: FileSystemMockCalls = {
		stageFile: [],
		commitStaging: 0,
		cleanStaging: 0,
		writeVersionFile: [],
	};
	if (trackDestinationExists) {
		calls.destinationExists = destinationExistsCalls;
	}

	const stub: MockedFileSystem = {
		destinationExists: mockFn<IFileSystem["destinationExists"]>(async (path: string) => {
			if (trackDestinationExists) destinationExistsCalls.push(path);
			return false;
		}),
		stageFile: mockFn<IStagingSystem["stageFile"]>(async (path: string) => {
			calls.stageFile.push(path);
		}),
		commitStaging: mockFn<IStagingSystem["commitStaging"]>(async () => {
			calls.commitStaging++;
		}),
		cleanStaging: mockFn<IStagingSystem["cleanStaging"]>(async () => {
			calls.cleanStaging++;
		}),
		isWritable: mockFn<IFileSystem["isWritable"]>(() => Promise.resolve(true)),
		isEmpty: mockFn<IFileSystem["isEmpty"]>(() => Promise.resolve(isEmpty)),
		writeVersionFile: mockFn<IFileSystem["writeVersionFile"]>(async (data: string) => {
			calls.writeVersionFile.push(data);
		}),
		readVersionFile: mockFn<IFileSystem["readVersionFile"]>(() => Promise.resolve(readVersionFile)),
		// Tree-level diffing (update mode) needs per-standard-dir file lists;
		// each dir contributes exactly 1 file to keep staged-count assertions
		// backward compatible with the pre-diff behavior.
		walkTemplateDirectory: mockFn<IFileSystem["walkTemplateDirectory"]>(async (path: string) => {
			if (realisticWalkTemplate) {
				if (path === "docs") return ["APPFLOW.md"];
				if (path === "specs") return ["spec-template.md"];
				if (path === "tasks") return ["plan.md"];
			}
			return [];
		}),
		walkDestinationDirectory: mockFn<IFileSystem["walkDestinationDirectory"]>(() =>
			Promise.resolve([]),
		),
	};

	return { stub, calls };
}

export function createMockPrompt(options: PromptMockOptions = {}): UserPromptMock {
	const selectOptionalDefault = options.selectOptionalDefault ?? "none";
	const allOptionalPaths = "allOptionalPaths" in options ? options.allOptionalPaths : undefined;
	const logEntries: string[] = [];

	return {
		showWarning: mockFn<IUserPrompt["showWarning"]>(() => {}),
		showInfo: mockFn<IUserPrompt["showInfo"]>(() => {}),
		confirm: mockFn<IUserPrompt["confirm"]>(() => Promise.resolve(true)),
		selectOptional: mockFn<IUserPrompt["selectOptional"]>(() =>
			Promise.resolve(selectOptionalDefault === "all" ? [...(allOptionalPaths ?? [])] : []),
		),
		showProgressBar: mockFn<IUserPrompt["showProgressBar"]>(() => {}),
		updateProgress: mockFn<IUserPrompt["updateProgress"]>(() => {}),
		completeProgress: mockFn<IUserPrompt["completeProgress"]>(() => {}),
		logProgressEvent: mockFn<IUserPrompt["logProgressEvent"]>((message: string) => {
			logEntries.push(message);
		}),
		showIntro: mockFn<IUserPrompt["showIntro"]>(() => {}),
		showSuccess: mockFn<IUserPrompt["showSuccess"]>(() => {}),
		showCancel: mockFn<IUserPrompt["showCancel"]>(() => {}),
		showError: mockFn<IUserPrompt["showError"]>(() => {}),
		promptForMode: mockFn<IUserPrompt["promptForMode"]>(() => Promise.resolve(null)),
		selectPacks: mockFn<IUserPrompt["selectPacks"]>(() =>
			Promise.resolve(["software-development"]),
		),
		showVersionInfo: mockFn<IUserPrompt["showVersionInfo"]>(() => {}),
		selectUpdateOption: mockFn<IUserPrompt["selectUpdateOption"]>(() => Promise.resolve("current")),
		showInstallSummary: mockFn<IUserPrompt["showInstallSummary"]>(() => {}),
		get logEntries() {
			return logEntries;
		},
	};
}

export function createMockSymlinkCreator(): SymlinkCreatorMock {
	const calls: Array<readonly unknown[]> = [];
	return {
		createSymlink: mockFn<ISymlinkCreator["createSymlink"]>(() =>
			Promise.resolve(success(undefined)),
		),
		createSymlinks: mockFn<ISymlinkCreator["createSymlinks"]>(
			(symlinks: readonly SymlinkSpec[]) => {
				calls.push(symlinks);
				return Promise.resolve(success(undefined));
			},
		),
		get createSymlinksCalls() {
			return calls;
		},
	};
}

export function createMockGitignoreCreator(): GitignoreCreatorMock {
	const calls: string[] = [];
	return {
		createGitignore: mockFn<IGitignoreCreator["createGitignore"]>((destPath: string) => {
			calls.push(destPath);
			return Promise.resolve(success(undefined));
		}),
		get gitignoreCalls() {
			return calls;
		},
	};
}

export function createMockGitHubClient(tagName: string | null = "v1.0.0"): MockedGitHubClient {
	return {
		getLatestReleaseTag: mockFn<IGitHubClient["getLatestReleaseTag"]>(() =>
			Promise.resolve(tagName),
		),
	};
}
