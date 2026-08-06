/**
 * postInstall.ts — shared post-installation orchestration tests
 *
 * Covers 10 scenarios:
 * 1. createGitignoreSafe — success → no warning shown
 * 2. createGitignoreSafe — failure → warning shown
 * 3. createSymlinksWithWarning — success → no warning
 * 4. createSymlinksWithWarning — failure without retryHint → no re-run hint
 * 5. createSymlinksWithWarning — failure with retryHint → re-run hint present
 * 6. runPostInstallSteps — version defaults to "0.0.0" when undefined
 * 7. runPostInstallSteps — version file success → showSuccess called
 * 8. runPostInstallSteps — version file failure → returns Failure, no success
 * 9. runPostInstallSteps — gitignore fails → continues to symlinks + version file
 * 10. runPostInstallSteps — retryHint=true → re-run hint in opencode warning
 * 11. runPostInstallSteps — writes installedPacks from selectedPacks (v2.0 format)
 */

import { describe, expect, mock as mockFn, test } from "bun:test";
import type { IGitignoreCreator } from "../../../src/application/ports/IGitignoreCreator";
import type { ISymlinkCreator, SymlinkSpec } from "../../../src/application/ports/ISymlinkCreator";
import type { IUserPrompt } from "../../../src/application/ports/IUserPrompt";
import {
	createGitignoreSafe,
	createSymlinksWithWarning,
	type PostInstallOptions,
	runPostInstallSteps,
} from "../../../src/application/postInstall";
import type { IFileSystem } from "../../../src/domain/ports/IFileSystem";
import type { IStagingSystem } from "../../../src/domain/ports/IStagingSystem";
import type { GitignoreError } from "../../../src/domain/types/GitignoreError";
import type { Result } from "../../../src/domain/types/Result";
import type { SymlinkError } from "../../../src/domain/types/SymlinkError";

// ── Shared test data ──────────────────────────────────────────────

const MOCK_OPENCODE_SYMLINKS: readonly SymlinkSpec[] = [
	{ linkPath: ".opencode/agents", target: "../agents" },
	{ linkPath: ".opencode/commands", target: "../commands" },
	{ linkPath: ".opencode/skills", target: "../skills" },
];

// ── Mock factory helpers ──────────────────────────────────────────

function createMockPrompt(): { stub: IUserPrompt; warnings: string[]; successes: string[] } {
	const warnings: string[] = [];
	const successes: string[] = [];
	return {
		warnings,
		successes,
		stub: {
			showWarning: mockFn((msg: string) => {
				warnings.push(msg);
			}) as (msg: string) => void,
			showSuccess: mockFn((msg: string) => {
				successes.push(msg);
			}) as (msg: string) => void,
			showInfo: mockFn(() => {}),
			confirm: mockFn(() => Promise.resolve(true)),
			selectOptional: mockFn(() => Promise.resolve([])),
			showProgressBar: mockFn(() => {}),
			updateProgress: mockFn(() => {}),
			completeProgress: mockFn(() => {}),
			logProgressEvent: mockFn(() => {}),
			showIntro: mockFn(() => {}),
			showCancel: mockFn(() => {}),
			showError: mockFn(() => {}),
			promptForMode: mockFn(() => Promise.resolve<"clean" | "project" | "update" | null>(null)),
			selectPacks: mockFn(() => Promise.resolve(["software-development"] as const)),
			showVersionInfo: mockFn(() => {}),
			selectUpdateOption: mockFn(() =>
				Promise.resolve<"current" | "add" | "cancel" | null>("current"),
			),
		},
	};
}

function createMockGitignoreCreator(shouldFail = false): IGitignoreCreator & { calls: number } {
	let count = 0;
	return {
		get calls() {
			return count;
		},
		createGitignore: mockFn(async (_destPath: string) => {
			count++;
			if (shouldFail) {
				return {
					ok: false as const,
					error: { message: "Permission denied" } as GitignoreError,
				};
			}
			return { ok: true as const, value: undefined };
		}) as (destPath: string) => Promise<Result<void, GitignoreError>>,
	};
}

function createMockSymlinkCreator(shouldFail = false): ISymlinkCreator & { calls: number } {
	let count = 0;
	return {
		get calls() {
			return count;
		},
		createSymlink: mockFn(() =>
			Promise.resolve({ ok: true, value: undefined } as Result<void, SymlinkError>),
		) as (linkTarget: string, linkName: string) => Promise<Result<void, SymlinkError>>,
		createSymlinks: mockFn(async (_symlinks: readonly SymlinkSpec[]) => {
			count++;
			if (shouldFail) {
				return {
					ok: false as const,
					error: [
						{ target: ".opencode/agents", linkPath: ".opencode/agents", message: "Symlink failed" },
					] satisfies SymlinkError[],
				};
			}
			return { ok: true as const, value: undefined };
		}) as (symlinks: readonly SymlinkSpec[]) => Promise<Result<void, SymlinkError[]>>,
	};
}

function createMockFileSystem(writeVersionShouldFail = false): IFileSystem & IStagingSystem {
	return {
		destinationExists: mockFn(() => Promise.resolve(false)),
		stageFile: mockFn(async () => {}),
		commitStaging: mockFn(async () => {}),
		cleanStaging: mockFn(async () => {}),
		isWritable: mockFn(() => Promise.resolve(true)),
		isEmpty: mockFn(() => Promise.resolve(true)),
		writeVersionFile: mockFn(async (_data: string) => {
			if (writeVersionShouldFail) {
				throw new Error("Disk full");
			}
		}),
		readVersionFile: mockFn(() => Promise.resolve(null)),
		walkTemplateDirectory: mockFn(() => Promise.resolve([])),
		walkDestinationDirectory: mockFn(() => Promise.resolve([])),
	};
}

function createDefaultPostInstallOptions(
	overrides?: Partial<PostInstallOptions>,
): PostInstallOptions {
	const prompt = createMockPrompt();
	return {
		fileSystem: createMockFileSystem(),
		gitignoreCreator: createMockGitignoreCreator(),
		symlinkCreator: createMockSymlinkCreator(),
		userPrompt: prompt.stub,
		opencodeSymlinks: MOCK_OPENCODE_SYMLINKS,
		destinationPath: "/tmp/project",
		selectedPacks: [],
		selectedOptionals: [],
		version: "1.0.0",
		operationLabel: "Installation",
		successMessage: "Installation complete.",
		...overrides,
	};
}

// ── createGitignoreSafe tests ─────────────────────────────────────

describe("createGitignoreSafe", () => {
	test("returns without warning on success", async () => {
		const prompt = createMockPrompt();
		const creator = createMockGitignoreCreator(false);

		await createGitignoreSafe(creator, prompt.stub, "/tmp/project");

		expect(creator.calls).toBe(1);
		expect(prompt.warnings).toHaveLength(0);
	});

	test("shows warning on failure with actionable message", async () => {
		const prompt = createMockPrompt();
		const creator = createMockGitignoreCreator(true);

		await createGitignoreSafe(creator, prompt.stub, "/tmp/project");

		expect(creator.calls).toBe(1);
		expect(prompt.warnings).toHaveLength(1);
		expect(prompt.warnings[0]).toContain(".gitignore");
		expect(prompt.warnings[0]).toContain("--verbose");
	});
});

// ── createSymlinksWithWarning tests ───────────────────────────────

describe("createSymlinksWithWarning", () => {
	test("returns without warning on success", async () => {
		const prompt = createMockPrompt();
		const creator = createMockSymlinkCreator(false);

		await createSymlinksWithWarning(creator, prompt.stub, MOCK_OPENCODE_SYMLINKS, "opencode");

		expect(creator.calls).toBe(1);
		expect(prompt.warnings).toHaveLength(0);
	});

	test("shows warning without re-run hint when retryHint is not set", async () => {
		const prompt = createMockPrompt();
		const creator = createMockSymlinkCreator(true);

		await createSymlinksWithWarning(creator, prompt.stub, MOCK_OPENCODE_SYMLINKS, "opencode");

		expect(creator.calls).toBe(1);
		expect(prompt.warnings).toHaveLength(1);
		expect(prompt.warnings[0]).toContain(".opencode/");
		expect(prompt.warnings[0]).toContain("--verbose");
		expect(prompt.warnings[0]).not.toContain("Re-run the installer");
	});

	test("shows warning with re-run hint when retryHint is true", async () => {
		const prompt = createMockPrompt();
		const creator = createMockSymlinkCreator(true);

		await createSymlinksWithWarning(creator, prompt.stub, MOCK_OPENCODE_SYMLINKS, "opencode", true);

		expect(creator.calls).toBe(1);
		expect(prompt.warnings).toHaveLength(1);
		expect(prompt.warnings[0]).toContain(".opencode/");
		expect(prompt.warnings[0]).toContain("Re-run the installer to retry symlink creation");
	});
});

// ── runPostInstallSteps tests ─────────────────────────────────────

describe("runPostInstallSteps", () => {
	test("uses '0.0.0' as default version when version is undefined", async () => {
		const fs = createMockFileSystem(false);
		const writeVersionFile = fs.writeVersionFile as ReturnType<typeof mockFn>;
		const options = createDefaultPostInstallOptions({
			fileSystem: fs,
			version: undefined,
		});

		await runPostInstallSteps(options);

		expect(writeVersionFile).toHaveBeenCalledTimes(1);
		const writtenData = JSON.parse(writeVersionFile.mock.calls[0]?.[0] ?? "{}");
		expect(writtenData.version).toBe("0.0.0");
		expect(writtenData.installedPacks).toEqual([]);
	});

	test("calls showSuccess when version file write succeeds", async () => {
		const prompt = createMockPrompt();
		const options = createDefaultPostInstallOptions({
			userPrompt: prompt.stub,
		});

		const result = await runPostInstallSteps(options);

		expect(result.ok).toBe(true);
		expect(prompt.successes).toHaveLength(1);
		expect(prompt.successes[0]).toBe("Installation complete.");
	});

	test("returns Failure and does NOT call showSuccess when version file write fails", async () => {
		const prompt = createMockPrompt();
		const fs = createMockFileSystem(true); // writeVersionFile throws
		const options = createDefaultPostInstallOptions({
			fileSystem: fs,
			userPrompt: prompt.stub,
		});

		const result = await runPostInstallSteps(options);

		expect(result.ok).toBe(false);
		expect(prompt.successes).toHaveLength(0);
	});

	test("continues to symlinks and version file when gitignore creation fails", async () => {
		const prompt = createMockPrompt();
		const gitignoreCreator = createMockGitignoreCreator(true);
		const symlinkCreator = createMockSymlinkCreator(false);
		const fs = createMockFileSystem(false);
		const writeVersionFile = fs.writeVersionFile as ReturnType<typeof mockFn>;

		const options = createDefaultPostInstallOptions({
			gitignoreCreator,
			symlinkCreator,
			fileSystem: fs,
			userPrompt: prompt.stub,
		});

		const result = await runPostInstallSteps(options);

		expect(result.ok).toBe(true);
		// Gitignore warning was shown
		expect(prompt.warnings).toHaveLength(1);
		expect(prompt.warnings[0]).toContain(".gitignore");
		// Symlinks still created (opencode)
		expect(symlinkCreator.calls).toBe(1);
		// Version file still written
		expect(writeVersionFile).toHaveBeenCalledTimes(1);
	});

	test("shows re-run hint in opencode warning when retryHint is true", async () => {
		const prompt = createMockPrompt();
		const symlinkCreator = createMockSymlinkCreator(true);

		const options = createDefaultPostInstallOptions({
			symlinkCreator,
			userPrompt: prompt.stub,
			retryHint: true,
		});

		const result = await runPostInstallSteps(options);

		expect(result.ok).toBe(true);
		// Warning shown with re-run hint
		expect(prompt.warnings).toHaveLength(1);
		expect(prompt.warnings[0]).toContain("Re-run the installer to retry symlink creation");
	});

	test("writes installedPacks from selectedPacks in v2.0 format", async () => {
		const fs = createMockFileSystem(false);
		const writeVersionFile = fs.writeVersionFile as ReturnType<typeof mockFn>;
		const options = createDefaultPostInstallOptions({
			fileSystem: fs,
			selectedPacks: ["software-development", "business"],
		});

		const result = await runPostInstallSteps(options);

		expect(result.ok).toBe(true);
		expect(writeVersionFile).toHaveBeenCalledTimes(1);
		const writtenData = JSON.parse(writeVersionFile.mock.calls[0]?.[0] ?? "{}");
		// v2.0 writer emits "version" (not legacy "installedVersion") plus installedPacks
		expect(writtenData.version).toBe("1.0.0");
		expect(writtenData.installedVersion).toBeUndefined();
		expect(writtenData.installedPacks).toEqual(["software-development", "business"]);
		expect(writtenData.optionalSelections).toEqual([]);
	});
});
