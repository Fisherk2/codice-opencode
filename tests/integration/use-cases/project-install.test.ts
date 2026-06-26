import { describe, expect, it, mock as mockFn } from "bun:test";
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import { ProjectInstallUseCase } from "../../../src/application/use-cases/ProjectInstallUseCase";
import type { FileRule } from "../../../src/domain/entities/FileRule";
import {
	FILE_RULE_MANIFEST,
	getRulesByCategory,
} from "../../../src/domain/entities/FileRuleManifest";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";

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

	const stub: IFileSystem = {
		readTemplateFile: mockFn(() => Promise.resolve("")),
		destinationExists: mockFn(async (path: string) => {
			calls.destinationExists.push(path);
			return false;
		}),
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

/**
 * Create a mock IUserPrompt with configurable return values.
 */
function createMockPrompt(): IUserPrompt {
	return {
		showWarning: mockFn(() => {}),
		showInfo: mockFn(() => {}),
		confirm: mockFn(() => Promise.resolve(true)),
		selectOptional: mockFn((options: FileRule[]) => Promise.resolve(options.map((o) => o.path))),
		showSpinner: mockFn(() => {}),
		stopSpinner: mockFn(() => {}),
		showIntro: mockFn(() => {}),
		showSuccess: mockFn(() => {}),
		showCancel: mockFn(() => {}),
		showError: mockFn(() => {}),
		promptForMode: mockFn(() => Promise.resolve<"clean" | "project" | "update" | null>(null)),
	};
}

const optionalRules = getRulesByCategory("optional");

describe("ProjectInstallUseCase", () => {
	describe("constructor", () => {
		it("should create an instance when given valid dependencies", () => {
			const { stub: fs } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const useCase = new ProjectInstallUseCase(fs, engine, prompt);
			expect(useCase).toBeInstanceOf(ProjectInstallUseCase);
		});
	});

	describe("execute", () => {
		it("should copy all files respecting category rules when destination is empty", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const useCase = new ProjectInstallUseCase(fs, engine, prompt);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// All manifest files should be staged (category rules handle filtering)
			expect(calls.stageFile.length).toBe(FILE_RULE_MANIFEST.length);
			// Commit should have been called
			expect(calls.commitStaging).toBe(1);
			// Version file should be written
			expect(calls.writeVersionFile.length).toBe(1);
		});

		it("should return an error when destination is not writable", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.isWritable as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const useCase = new ProjectInstallUseCase(fs, engine, prompt);

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
			const useCase = new ProjectInstallUseCase(fs, engine, prompt);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.confirm).toHaveBeenCalledTimes(1);
			expect(calls.stageFile.length).toBe(FILE_RULE_MANIFEST.length);
		});

		it("should skip installation when user rejects the confirmation", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.isEmpty as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const prompt = createMockPrompt();
			(prompt.confirm as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const engine = new FileMergeEngine(fs);
			const useCase = new ProjectInstallUseCase(fs, engine, prompt);

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
			const useCase = new ProjectInstallUseCase(fs, engine, prompt);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			expect(prompt.confirm).not.toHaveBeenCalled();
			expect(prompt.selectOptional).not.toHaveBeenCalled();
			// Only non-optional files should be staged (mandatory + standard)
			const nonOptionalCount = FILE_RULE_MANIFEST.length - optionalRules.length;
			expect(calls.stageFile.length).toBe(nonOptionalCount);
		});

		it("should present optional files checkbox and use selected paths", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			// User selects only the first optional file
			const firstOptional = optionalRules[0]!;
			(prompt.selectOptional as ReturnType<typeof mockFn>).mockResolvedValue([firstOptional.path]);
			const engine = new FileMergeEngine(fs);
			const useCase = new ProjectInstallUseCase(fs, engine, prompt);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// selectOptional should have been called with optional rules
			expect(prompt.selectOptional).toHaveBeenCalledTimes(1);
			const selectArgs = (prompt.selectOptional as ReturnType<typeof mockFn>).mock.calls[0]!;
			expect(selectArgs[0].length).toBe(optionalRules.length);
			// Only one optional file was selected, so non-selected optional files are skipped
			// Mandatory + standard + selected optional = (FILE_RULE_MANIFEST.length - optionalRules.length) + 1
			expect(calls.stageFile.length).toBe(FILE_RULE_MANIFEST.length - optionalRules.length + 1);
		});

		it("should skip optional files when user selects none", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			(prompt.selectOptional as ReturnType<typeof mockFn>).mockResolvedValue([]);
			const engine = new FileMergeEngine(fs);
			const useCase = new ProjectInstallUseCase(fs, engine, prompt);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Only mandatory + standard files should be staged
			const nonOptionalCount = FILE_RULE_MANIFEST.length - optionalRules.length;
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
			const useCase = new ProjectInstallUseCase(fs, engine, prompt);

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
			const useCase = new ProjectInstallUseCase(fs, engine, prompt);

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
			const useCase = new ProjectInstallUseCase(fs, engine, prompt);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// The selected optional file should NOT be staged because it already exists
			const stagedOptional = calls.stageFile.filter((p) => p === firstOptional.path);
			expect(stagedOptional.length).toBe(0);
			// But mandatory + standard files (minus existing standard) should still be staged
			// Since destinationExists returns true for the optional path only, standard files
			// that don't exist should still be staged
			const mandatoryCount = getRulesByCategory("mandatory").length;
			const standardCount = getRulesByCategory("standard").length;
			expect(calls.stageFile.length).toBe(mandatoryCount + standardCount);
		});

		it("should return error and clean staging when merge engine fails", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			// Make stageFile throw to trigger a merge engine failure
			(fs.stageFile as ReturnType<typeof mockFn>).mockRejectedValue(
				new Error("Disk full during staging"),
			);
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const useCase = new ProjectInstallUseCase(fs, engine, prompt);

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
			(fs.writeVersionFile as ReturnType<typeof mockFn>).mockRejectedValue(
				new Error("Permission denied"),
			);
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const useCase = new ProjectInstallUseCase(fs, engine, prompt);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toContain("version file");
			expect(calls.cleanStaging).toBe(1);
		});
	});
});
