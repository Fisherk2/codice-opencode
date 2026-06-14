import { describe, expect, it, mock as mockFn } from "bun:test";
import type { IFileSystem } from "../../../src/application/ports/IFileSystem";
import type { IGitHubClient } from "../../../src/application/ports/IGitHubClient";
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import { UpdateWorkspaceUseCase } from "../../../src/application/use-cases/UpdateWorkspaceUseCase";
import type { FileRule } from "../../../src/domain/entities/FileRule";
import {
	FILE_RULE_MANIFEST,
	getRulesByCategory,
} from "../../../src/domain/entities/FileRuleManifest";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";
import { VersionComparator } from "../../../src/domain/services/VersionComparator";

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
		}),
		commitStaging: mockFn(async () => {
			calls.commitStaging++;
		}),
		cleanStaging: mockFn(async () => {
			calls.cleanStaging++;
		}),
		isWritable: mockFn(() => Promise.resolve(true)),
		isEmpty: mockFn(() => Promise.resolve(false)),
		writeVersionFile: mockFn(async (data: string) => {
			calls.writeVersionFile.push(data);
		}),
		readVersionFile: mockFn(() =>
			Promise.resolve(
				JSON.stringify({
					installedVersion: "0.9.0",
					installedAt: "2026-01-01T00:00:00.000Z",
					optionalSelections: ["Justfile"],
				}),
			),
		),
	};

	return { stub, calls };
}

function createMockPrompt(): IUserPrompt {
	return {
		showWarning: mockFn(() => {}),
		showInfo: mockFn(() => {}),
		confirm: mockFn(() => Promise.resolve(true)),
		selectOptional: mockFn((_options: FileRule[]) => Promise.resolve([])),
		showSpinner: mockFn(() => {}),
		stopSpinner: mockFn(() => {}),
		showIntro: mockFn(() => {}),
		showSuccess: mockFn(() => {}),
		showCancel: mockFn(() => {}),
		showError: mockFn(() => {}),
	};
}

function createMockGitHubClient(tagName: string | null = "v1.0.0"): IGitHubClient {
	return {
		getLatestReleaseTag: mockFn(() => Promise.resolve(tagName)),
		getLatestReleaseNotes: mockFn(() => Promise.resolve("Release notes")),
	};
}

const nonOptionalCount = FILE_RULE_MANIFEST.length - getRulesByCategory("optional").length;

describe("UpdateWorkspaceUseCase", () => {
	describe("constructor", () => {
		it("should create an instance when given valid dependencies", () => {
			const { stub: fs } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient();
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(fs, engine, prompt, gitHub, comparator);
			expect(useCase).toBeInstanceOf(UpdateWorkspaceUseCase);
		});
	});

	describe("execute", () => {
		it("should return an error when destination is not writable", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.isWritable as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient();
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(fs, engine, prompt, gitHub, comparator);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toContain("Permission denied");
			expect(calls.stageFile.length).toBe(0);
		});

		it("should ask for confirmation when force=false", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			(prompt.confirm as ReturnType<typeof mockFn>).mockResolvedValue(true);
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient();
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(fs, engine, prompt, gitHub, comparator);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.confirm).toHaveBeenCalledTimes(1);
			expect(calls.stageFile.length).toBe(nonOptionalCount);
		});

		it("should skip installation when user rejects confirmation", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			(prompt.confirm as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient();
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(fs, engine, prompt, gitHub, comparator);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(calls.stageFile.length).toBe(0);
		});

		it("should skip confirmation when force=true", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient();
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(fs, engine, prompt, gitHub, comparator);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			expect(prompt.confirm).not.toHaveBeenCalled();
			expect(calls.stageFile.length).toBe(nonOptionalCount);
		});

		it("should inform user when already up to date and skip copying", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.readVersionFile as ReturnType<typeof mockFn>).mockResolvedValue(
				JSON.stringify({
					installedVersion: "1.0.0",
					installedAt: "2026-01-01T00:00:00.000Z",
					optionalSelections: [],
				}),
			);
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient("v1.0.0");
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(fs, engine, prompt, gitHub, comparator);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.showInfo).toHaveBeenCalled();
			// No files should be staged since version is already current
			expect(calls.stageFile.length).toBe(0);
		});

		it("should continue with local template when GitHub is unreachable", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient(null);
			const engine = new FileMergeEngine(fs);
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(fs, engine, prompt, gitHub, comparator);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Should show a warning about unreachable GitHub
			expect(prompt.showWarning).toHaveBeenCalled();
			// Should still proceed with local template
			expect(calls.stageFile.length).toBe(nonOptionalCount);
		});

		it("should only stage mandatory and standard files (NOT optional)", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient("v1.0.0");
			const engine = new FileMergeEngine(fs);
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(fs, engine, prompt, gitHub, comparator);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Only non-optional files should be staged
			expect(calls.stageFile.length).toBe(nonOptionalCount);
			// No optional file should be in staged files
			const optionalPaths = getRulesByCategory("optional").map((r) => r.path);
			const stagedOptional = calls.stageFile.filter((p) => optionalPaths.includes(p));
			expect(stagedOptional.length).toBe(0);
		});

		it("should write updated version file with preserved optionalSelections", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient("v1.0.0");
			const engine = new FileMergeEngine(fs);
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(fs, engine, prompt, gitHub, comparator);

			const result = await useCase.execute("/tmp/project", { version: "1.0.0" });

			expect(result.ok).toBe(true);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.installedVersion).toBe("1.0.0");
			expect(versionData.optionalSelections).toEqual(["Justfile"]);
		});

		it("should handle version file write failure gracefully", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.writeVersionFile as ReturnType<typeof mockFn>).mockRejectedValue(new Error("Disk full"));
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient("v1.0.0");
			const engine = new FileMergeEngine(fs);
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(fs, engine, prompt, gitHub, comparator);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toContain("version file");
			expect(calls.cleanStaging).toBe(1);
		});
	});
});
