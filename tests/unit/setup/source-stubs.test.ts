/**
 * Source Stubs Validation Tests
 */

import { describe, expect, test } from "bun:test";
import { fileExists, readTextFile } from "./helpers";

const EXPORT_PATTERN = /export\s+(class|interface|function|const|type)/;

interface StubEntry {
	path: string;
	description: string;
	pattern: RegExp;
}

const stubs: StubEntry[] = [
	{
		path: "src/cli/main.ts",
		description: "CLI entry point",
		pattern: /main\(\)/,
	},
	{
		path: "src/domain/entities/FileRule.ts",
		description: "FileRule entity",
		pattern: EXPORT_PATTERN,
	},
	{
		path: "src/domain/entities/WorkspaceVersion.ts",
		description: "WorkspaceVersion entity",
		pattern: EXPORT_PATTERN,
	},
	{
		path: "src/domain/services/FileMergeEngine.ts",
		description: "FileMergeEngine service",
		pattern: EXPORT_PATTERN,
	},
	{
		path: "src/domain/services/VersionComparator.ts",
		description: "VersionComparator service",
		pattern: EXPORT_PATTERN,
	},
	{
		path: "src/application/ports/IFileSystem.ts",
		description: "IFileSystem port",
		pattern: EXPORT_PATTERN,
	},
	{
		path: "src/application/ports/IGitHubClient.ts",
		description: "IGitHubClient port",
		pattern: EXPORT_PATTERN,
	},
	{
		path: "src/application/ports/IUserPrompt.ts",
		description: "IUserPrompt port",
		pattern: EXPORT_PATTERN,
	},
	{
		path: "src/application/use-cases/CleanInstallUseCase.ts",
		description: "CleanInstallUseCase",
		pattern: EXPORT_PATTERN,
	},
	{
		path: "src/application/use-cases/ProjectInstallUseCase.ts",
		description: "ProjectInstallUseCase",
		pattern: EXPORT_PATTERN,
	},
	{
		path: "src/application/use-cases/UpdateWorkspaceUseCase.ts",
		description: "UpdateWorkspaceUseCase",
		pattern: EXPORT_PATTERN,
	},
	{
		path: "src/infrastructure/adapters/BunFileSystem.ts",
		description: "BunFileSystem adapter",
		pattern: EXPORT_PATTERN,
	},
	{
		path: "src/infrastructure/adapters/GitHubRestClient.ts",
		description: "GitHubRestClient adapter",
		pattern: EXPORT_PATTERN,
	},
	{
		path: "src/infrastructure/adapters/ClackPromptsAdapter.ts",
		description: "ClackPromptsAdapter",
		pattern: EXPORT_PATTERN,
	},
	{
		path: "src/infrastructure/config/constants.ts",
		description: "Constants config",
		pattern: EXPORT_PATTERN,
	},
];

describe("Source Stubs Validation", () => {
	for (const stub of stubs) {
		const verb = stub.pattern === EXPORT_PATTERN ? "exports something" : "has entry point";
		test(`${stub.description} exists and ${verb}`, () => {
			expect(fileExists(stub.path)).toBe(true);
			const content = readTextFile(stub.path);
			expect(content).toMatch(stub.pattern);
		});
	}
});
