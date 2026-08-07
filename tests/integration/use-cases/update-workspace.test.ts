import { describe, expect, it, mock as mockFn } from "bun:test";
import type { IGitHubClient } from "../../../src/application/ports/IGitHubClient";
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import { UpdateWorkspaceUseCase } from "../../../src/application/use-cases/UpdateWorkspaceUseCase";
import type { FileRule } from "../../../src/domain/entities/FileRule";
import {
	FILE_RULE_MANIFEST,
	filterByPacks,
	getRulesByCategory,
} from "../../../src/domain/entities/FileRuleManifest";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";
import type { IStagingSystem } from "../../../src/domain/ports/IStagingSystem";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";
import { VersionComparator } from "../../../src/domain/services/VersionComparator";

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
		destinationExists: mockFn(() => Promise.resolve(false)),
		stageFile: mockFn(async (path: string) => {
			calls.stageFile.push(path);
		}) as (path: string, destPath?: string, excludeSubDirs?: Set<string>) => Promise<void>,
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
					version: "2.0.0",
					installedPacks: ["software-development"],
					installedAt: "2026-01-01T00:00:00.000Z",
					optionalSelections: ["Justfile"],
				}),
			),
		),
		// Provide realistic file lists for standard directories so that
		// tree-level diffing (diffTrees) works correctly in update mode.
		// Each standard directory contributes exactly 1 file, matching the old
		// per-directory count so total staged file counts remain backward compatible.
		walkTemplateDirectory: mockFn(async (path: string) => {
			if (path === "docs") return ["APPFLOW.md"];
			if (path === "specs") return ["spec-template.md"];
			if (path === "tasks") return ["plan.md"];
			return [];
		}),
		walkDestinationDirectory: mockFn(() => Promise.resolve([])),
	};

	return { stub, calls };
}

function createMockPrompt(): IUserPrompt {
	return {
		showWarning: mockFn(() => {}),
		showInfo: mockFn(() => {}),
		confirm: mockFn(() => Promise.resolve(true)),
		selectOptional: mockFn((_options: FileRule[]) => Promise.resolve([])),
		showProgressBar: mockFn(() => {}),
		updateProgress: mockFn(() => {}),
		completeProgress: mockFn(() => {}),
		logProgressEvent: mockFn(() => {}),
		showIntro: mockFn(() => {}),
		showSuccess: mockFn(() => {}),
		showCancel: mockFn(() => {}),
		showError: mockFn(() => {}),
		promptForMode: mockFn(() => Promise.resolve<"clean" | "project" | "update" | null>(null)),
		selectPacks: mockFn(() => Promise.resolve(["software-development"] as const)),
		showVersionInfo: mockFn(() => {}),
		selectUpdateOption: mockFn(() =>
			Promise.resolve<"current" | "add" | "cancel" | null>("current"),
		),
		showInstallSummary: mockFn(() => {}),
	};
}

function createMockGitHubClient(tagName: string | null = "v1.0.0"): IGitHubClient {
	return {
		getLatestReleaseTag: mockFn(() => Promise.resolve(tagName)),
	};
}

/** Packs seeded in the mock `.codice-version` (v2.0 format). */
const INSTALLED_PACKS_SEED = ["software-development"] as const;

/**
 * Bundled template version used in the tests. Must be NEWER than the seeded
 * v2.0.0 install so the update proceeds (installed >= bundled short-circuits).
 * The real package VERSION (1.2.0) would block every merge assertion, so the
 * tests model the post-v2.0.0 release state here.
 */
const BUNDLED_TEST_VERSION = "2.1.0";

/**
 * Non-optional rules that the update merges when scoped to the seeded packs.
 * The update now applies filterByPacks(manifest minus optional, installedPacks),
 * so pack rules outside the installed set are excluded from staging counts.
 */
const nonOptionalCount = filterByPacks(
	FILE_RULE_MANIFEST.filter((r) => r.category !== "optional"),
	INSTALLED_PACKS_SEED,
).length;

/**
 * Paths always staged in update mode regardless of destination state:
 * mandatory (always overwrite) + pack rules scoped to the seeded packs.
 * Standard rules are skipped when they already exist in the destination,
 * so they are excluded from this always-staged set.
 */
const alwaysStagedPaths = [
	...getRulesByCategory("mandatory").map((r) => r.path),
	...filterByPacks(getRulesByCategory("pack"), INSTALLED_PACKS_SEED).map((r) => r.path),
];

describe("UpdateWorkspaceUseCase", () => {
	describe("constructor", () => {
		it("should create an instance when given valid dependencies", () => {
			const { stub: fs } = createMockFileSystem();
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient();
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);
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
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

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
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(prompt.confirm).toHaveBeenCalledTimes(1);
			// Confirmation mentions the installed packs and defaults to Yes
			expect(prompt.confirm).toHaveBeenCalledWith(
				expect.stringContaining("Packs: software-development"),
				true,
			);
			expect(calls.stageFile.length).toBe(nonOptionalCount);
		});

		it("should skip confirmation when directory is empty (no prompt)", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			// Override: fs.isEmpty defaults to false in this file, set to true for this test
			(fs.isEmpty as ReturnType<typeof mockFn>).mockResolvedValue(true);
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient("v1.0.0");
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Should NOT have asked for confirmation (isEmpty short-circuits)
			expect(prompt.confirm).not.toHaveBeenCalled();
			// Operation proceeds normally
			expect(calls.stageFile.length).toBe(nonOptionalCount);
			expect(calls.commitStaging).toBe(1);
		});

		it("should skip installation when user rejects confirmation", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			(prompt.confirm as ReturnType<typeof mockFn>).mockResolvedValue(false);
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient();
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			expect(calls.stageFile.length).toBe(0);
			expect(prompt.showCancel).toHaveBeenCalledWith("Update cancelled by user.");
		});

		it("should skip confirmation when force=true", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient();
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			expect(prompt.confirm).not.toHaveBeenCalled();
			expect(calls.stageFile.length).toBe(nonOptionalCount);
		});

		it("should inform user when already up to date and skip copying", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.readVersionFile as ReturnType<typeof mockFn>).mockResolvedValue(
				JSON.stringify({
					version: BUNDLED_TEST_VERSION,
					installedPacks: ["software-development"],
					installedAt: "2026-01-01T00:00:00.000Z",
					optionalSelections: [],
				}),
			);
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient("v1.0.0");
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

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
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

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
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Only non-optional files should be staged
			expect(calls.stageFile.length).toBe(nonOptionalCount);
			// No optional file should be in staged files
			const optionalPaths = getRulesByCategory("optional").map((r) => r.path);
			const stagedOptional = calls.stageFile.filter((p) => optionalPaths.includes(p));
			expect(stagedOptional.length).toBe(0);
		});

		it("should NOT overwrite standard files that already exist (REGRESSION: FEV-1 #2)", async () => {
			const standardPaths = getRulesByCategory("standard").map((r) => r.path);

			const { stub: fs, calls } = createMockFileSystem();
			// Simulate existing standard files — destinationExists returns true for standard paths
			(fs.destinationExists as ReturnType<typeof mockFn>).mockImplementation(async (path: string) =>
				standardPaths.includes(path),
			);
			// When a standard directory exists in destination, its files must also exist
			// so that tree-level diffing (diffTrees) correctly identifies nothing is new.
			(fs.walkDestinationDirectory as ReturnType<typeof mockFn>).mockImplementation(
				async (path: string) => {
					if (path === "docs") return ["APPFLOW.md"];
					if (path === "specs") return ["spec-template.md"];
					if (path === "tasks") return ["plan.md"];
					return [];
				},
			);
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient("v1.0.0");
			const engine = new FileMergeEngine(fs);
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			// Only mandatory + pack files should be staged (standard files already exist)
			expect(calls.stageFile.length).toBe(alwaysStagedPaths.length);
			// Each staged file should be mandatory or pack
			for (const staged of calls.stageFile) {
				expect(alwaysStagedPaths).toContain(staged);
			}
			// Standard files should NOT be staged
			const stagedStandard = calls.stageFile.filter((p) => standardPaths.includes(p));
			expect(stagedStandard.length).toBe(0);
		});

		it("should overwrite mandatory files even when they already exist (REGRESSION: FEV-1 #2)", async () => {
			// Everything non-optional is simulated as existing; mandatory + pack
			// must still be staged (standard is skipped because it exists).
			const allPaths = FILE_RULE_MANIFEST.filter((r) => r.category !== "optional").map(
				(r) => r.path,
			);

			const { stub: fs, calls } = createMockFileSystem();
			// Simulate ALL files existing — mandatory should still be staged
			(fs.destinationExists as ReturnType<typeof mockFn>).mockImplementation(async (path: string) =>
				allPaths.includes(path),
			);
			// When standard directories exist in destination, their files must also exist
			// so tree-level diffing correctly identifies nothing is new.
			(fs.walkDestinationDirectory as ReturnType<typeof mockFn>).mockImplementation(
				async (path: string) => {
					if (path === "docs") return ["APPFLOW.md"];
					if (path === "specs") return ["spec-template.md"];
					if (path === "tasks") return ["plan.md"];
					return [];
				},
			);
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient("v1.0.0");
			const engine = new FileMergeEngine(fs);
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			// Mandatory + pack files are always staged regardless of existence
			expect(calls.stageFile.length).toBe(alwaysStagedPaths.length);
			// Each staged file should be mandatory or pack
			for (const staged of calls.stageFile) {
				expect(alwaysStagedPaths).toContain(staged);
			}
		});

		it("should stage only new files when standard directory already exists (tree-level diff)", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			// Simulate: "docs" directory exists (return true), everything else missing
			(fs.destinationExists as ReturnType<typeof mockFn>).mockImplementation(
				async (path: string) => path === "docs",
			);
			// Simulate that "APPFLOW.md" already exists in destination
			(fs.walkDestinationDirectory as ReturnType<typeof mockFn>).mockImplementation(
				async (path: string) => {
					if (path === "docs") return ["APPFLOW.md"];
					return [];
				},
			);
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient("v1.0.0");
			const engine = new FileMergeEngine(fs);
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			// The "docs" directory exists and APPFLOW.md exists in dest → nothing should be staged from docs
			const stagedDocs = calls.stageFile.filter(
				(p: string) => p === "docs" || p.startsWith("docs/"),
			);
			expect(stagedDocs.length).toBe(0);
		});

		it("should write v2.0 version file with installed packs (opcional skipped)", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient("v1.0.0");
			const engine = new FileMergeEngine(fs);
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project", { version: "1.0.0" });

			expect(result.ok).toBe(true);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.version).toBe("1.0.0");
			expect(versionData.installedPacks).toEqual(["software-development"]);
			// Update skips opcional entirely (spec §6.1), so selections reset
			expect(versionData.optionalSelections).toEqual([]);
		});

		it("should return error and clean staging when merge engine fails", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			// Make stageFile throw to trigger a merge engine failure
			(fs.stageFile as ReturnType<typeof mockFn>).mockRejectedValue(
				new Error("Disk full during staging"),
			);
			const engine = new FileMergeEngine(fs);
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient("v1.0.0");
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toContain("staging");
			// Staging should have been cleaned after the merge failure
			expect(calls.cleanStaging).toBeGreaterThanOrEqual(1);
			// Version file should NOT have been written
			expect(calls.writeVersionFile.length).toBe(0);
		});

		it("should skip update when local version is ahead of bundled", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.readVersionFile as ReturnType<typeof mockFn>).mockResolvedValue(
				JSON.stringify({
					version: "99.99.99",
					installedPacks: ["software-development"],
					installedAt: "2026-01-01T00:00:00.000Z",
					optionalSelections: [],
				}),
			);
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient("v0.5.0");
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			// Should inform user that local is ahead of bundled
			expect(prompt.showInfo).toHaveBeenCalled();
			// No files should be staged
			expect(calls.stageFile.length).toBe(0);
		});

		it("should block update when local version is invalid semver (treated as missing)", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.readVersionFile as ReturnType<typeof mockFn>).mockResolvedValue(
				JSON.stringify({
					version: "not-a-version",
					installedAt: "2026-01-01T00:00:00.000Z",
					optionalSelections: [],
				}),
			);
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient("v1.0.0");
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project", { force: true });

			// WorkspaceVersion.fromJSON throws on invalid semver → version gate blocks
			expect(result.ok).toBe(true);
			expect(prompt.showWarning).toHaveBeenCalledWith(
				expect.stringContaining("No previous Códice installation found"),
			);
			expect(calls.stageFile.length).toBe(0);
		});

		it("should NOT generate or warn about .gitignore (update mode preserves user customization)", async () => {
			// UpdateWorkspaceUseCase does not have a gitignoreCreator dependency.
			// This ensures .gitignore is never generated/overwritten during update,
			// preserving the user's existing .gitignore customization.
			const { stub: fs } = createMockFileSystem();
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient("v1.0.0");
			const engine = new FileMergeEngine(fs);
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// No warnings should contain .gitignore (no gitignore operations in update mode)
			const warningCalls = (prompt.showWarning as ReturnType<typeof mockFn>).mock.calls;
			const gitignoreWarnings = warningCalls.filter(
				(call: unknown[]) =>
					typeof call[0] === "string" && (call[0] as string).includes(".gitignore"),
			);
			expect(gitignoreWarnings.length).toBe(0);
		});

		it("should fall back to '0.0.0' when bundledVersion is invalid semver", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient("v0.5.0");
			const engine = new FileMergeEngine(fs);
			const comparator = new VersionComparator();
			// Pass invalid semver as bundledVersion to trigger fallback
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				"not-a-valid-version",
			);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			// Version file should contain the fallback "0.0.0"
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.version).toBe("0.0.0");
		});

		it("should handle version file write failure gracefully", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.writeVersionFile as ReturnType<typeof mockFn>).mockRejectedValue(new Error("Disk full"));
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient("v1.0.0");
			const engine = new FileMergeEngine(fs);
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toContain("version file");
			expect(calls.cleanStaging).toBe(1);
		});

		it("should emit progress events during merge", async () => {
			const { stub: fs } = createMockFileSystem();
			const prompt = createMockPrompt();
			const gitHub = createMockGitHubClient("v1.0.0");
			const engine = new FileMergeEngine(fs);
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Progress bar should have been initialized with the correct label
			expect(prompt.showProgressBar).toHaveBeenCalled();
			expect(prompt.showProgressBar).toHaveBeenCalledWith(expect.any(Number), "Updating files...");
			// Progress updates should have been sent
			expect(prompt.updateProgress).toHaveBeenCalled();
			// Commit log event should have been emitted
			expect(prompt.logProgressEvent).toHaveBeenCalledWith(
				expect.stringContaining("commit: Committing"),
			);
			expect(prompt.logProgressEvent).toHaveBeenCalledWith(expect.stringContaining("commit:"));
			// Progress should have been completed
			expect(prompt.completeProgress).toHaveBeenCalled();
		});

		it("should block update when .codice-version is missing", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.readVersionFile as ReturnType<typeof mockFn>).mockResolvedValue(null);
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient("v1.0.0");
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			expect(prompt.showWarning).toHaveBeenCalledWith(
				expect.stringContaining("No previous Códice installation found"),
			);
			expect(calls.stageFile.length).toBe(0);
			expect(calls.writeVersionFile.length).toBe(0);
		});

		it("should block update when version < 2.0.0", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.readVersionFile as ReturnType<typeof mockFn>).mockResolvedValue(
				JSON.stringify({ version: "1.2.0", installedAt: "2026-01-01T00:00:00.000Z" }),
			);
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient("v1.0.0");
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			expect(prompt.showWarning).toHaveBeenCalledWith(
				expect.stringContaining("update system has changed"),
			);
			expect(calls.stageFile.length).toBe(0);
			expect(calls.writeVersionFile.length).toBe(0);
		});

		it("should allow update when version >= 2.0.0", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient("v1.0.0");
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project", { force: true });

			expect(result.ok).toBe(true);
			expect(calls.writeVersionFile.length).toBe(1);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.version).toBe(BUNDLED_TEST_VERSION);
			expect(versionData.installedPacks).toEqual(["software-development"]);
		});

		it("should update only installed packs on Option A", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.readVersionFile as ReturnType<typeof mockFn>).mockResolvedValue(
				JSON.stringify({
					version: "2.0.0",
					installedPacks: ["software-development", "business"],
					installedAt: "2026-01-01T00:00:00.000Z",
				}),
			);
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient("v1.0.0");
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			// Interactive path: default selectUpdateOption resolves "current" → Option A
			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.installedPacks).toEqual(["software-development", "business"]);
		});

		it("should add new packs on Option B with installed packs locked", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.readVersionFile as ReturnType<typeof mockFn>).mockResolvedValue(
				JSON.stringify({
					version: "2.0.0",
					installedPacks: ["software-development", "business"],
					installedAt: "2026-01-01T00:00:00.000Z",
				}),
			);
			const prompt = createMockPrompt();
			(prompt.selectUpdateOption as ReturnType<typeof mockFn>).mockResolvedValue("add");
			(prompt.selectPacks as ReturnType<typeof mockFn>).mockResolvedValue([
				"software-development",
				"business",
				"creative",
			]);
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient("v1.0.0");
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.installedPacks).toEqual(["software-development", "business", "creative"]);

			// Installed packs are locked so they cannot be deselected in Option B
			const packOptions = (prompt.selectPacks as ReturnType<typeof mockFn>).mock
				.calls[0]![0] as readonly {
				id: string;
				locked?: boolean;
			}[];
			const lockedIds = packOptions.filter((option) => option.locked).map((option) => option.id);
			expect(lockedIds).toEqual(["software-development", "business"]);
		});

		it("should keep installed packs even when user deselects them in Option B (hard lock)", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			(fs.readVersionFile as ReturnType<typeof mockFn>).mockResolvedValue(
				JSON.stringify({
					version: "2.0.0",
					installedPacks: ["software-development", "business"],
					installedAt: "2026-01-01T00:00:00.000Z",
				}),
			);
			const prompt = createMockPrompt();
			(prompt.selectUpdateOption as ReturnType<typeof mockFn>).mockResolvedValue("add");
			// User toggles OFF the installed packs — only creative stays selected
			(prompt.selectPacks as ReturnType<typeof mockFn>).mockResolvedValue(["creative"]);
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient("v1.0.0");
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project");

			expect(result.ok).toBe(true);
			// Lock is a hard guarantee: installed packs survive deselection
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.installedPacks).toEqual(["software-development", "business", "creative"]);
		});

		it("should add packs non-interactively via addPacks option", async () => {
			const { stub: fs, calls } = createMockFileSystem();
			const prompt = createMockPrompt();
			const engine = new FileMergeEngine(fs);
			const gitHub = createMockGitHubClient("v1.0.0");
			const comparator = new VersionComparator();
			const useCase = new UpdateWorkspaceUseCase(
				fs,
				engine,
				prompt,
				gitHub,
				comparator,
				BUNDLED_TEST_VERSION,
			);

			const result = await useCase.execute("/tmp/project", {
				force: true,
				addPacks: ["creative"],
			});

			expect(result.ok).toBe(true);
			const versionData = JSON.parse(calls.writeVersionFile[0]!);
			expect(versionData.installedPacks).toEqual(["software-development", "creative"]);
			// Non-interactive add must not show the Option A/B menu
			expect(prompt.selectUpdateOption).not.toHaveBeenCalled();
		});
	});
});
