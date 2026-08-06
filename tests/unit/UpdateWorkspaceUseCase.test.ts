/**
 * UpdateWorkspaceUseCase — Issue #2 regression tests
 *
 * Bug: Update Workspace was overwriting Standard files because all
 * non-optional rules were converted to 'mandatory'.
 *
 * Expected behavior:
 * - Obligatorio rules → mandatory (always overwrite)
 * - Estándar rules → standard (respect destinationExists)
 * - Opcional rules → excluded entirely
 */

import { describe, expect, test } from "bun:test";
import { compare as semverCompare, valid } from "semver";
import type { IGitHubClient } from "../../src/application/ports/IGitHubClient";
import type { IUserPrompt } from "../../src/application/ports/IUserPrompt";
import { UpdateWorkspaceUseCase } from "../../src/application/use-cases/UpdateWorkspaceUseCase";
import { VERSION } from "../../src/cli/output";
import type { FileRule } from "../../src/domain/entities/FileRule";
import type { IFileMergeEngine } from "../../src/domain/ports/IFileMergeEngine";
import type { IFileSystem } from "../../src/domain/ports/IFileSystem";
import type { IVersionComparator } from "../../src/domain/ports/IVersionComparator";
import type { MergeError } from "../../src/domain/types/MergeError";
import type { ProgressCallback } from "../../src/domain/types/ProgressEvent";
import { type Result, success } from "../../src/domain/types/Result";
import type { ComparisonResult } from "../../src/domain/types/version";

// ---------------------------------------------------------------------------
// Minimal test doubles
// ---------------------------------------------------------------------------

class FakeFileSystem implements IFileSystem {
	async destinationExists(_path: string): Promise<boolean> {
		return false;
	}
	async stageFile(
		_path: string,
		_destPath?: string,
		_excludeSubDirs?: Set<string>,
	): Promise<void> {}
	async commitStaging(): Promise<void> {}
	async cleanStaging(): Promise<void> {}
	async isWritable(): Promise<boolean> {
		return true;
	}
	async isEmpty(): Promise<boolean> {
		return true;
	}
	lastWrittenVersion: string | null = null;
	async writeVersionFile(content: string): Promise<void> {
		this.lastWrittenVersion = content;
	}
	async readVersionFile(): Promise<string | null> {
		return null;
	}
	async walkTemplateDirectory(_path: string): Promise<readonly string[]> {
		return [];
	}
	async walkDestinationDirectory(_path: string): Promise<readonly string[]> {
		return [];
	}
}

class CaptureMergeEngine implements IFileMergeEngine {
	capturedRules: { path: string; category: string }[] = [];
	async execute(
		rules: readonly FileRule[],
		_options?: {
			selectedOptionals?: readonly string[];
			onProgress?: ProgressCallback;
			updateMode?: boolean;
		},
	): Promise<Result<void, MergeError>> {
		this.capturedRules = Array.from(rules);
		return success(undefined);
	}
}

class FakeGitHubClient implements IGitHubClient {
	async getLatestReleaseTag(): Promise<string | null> {
		return "v1.0.5";
	}
}

class FakeGitHubClientBadTag implements IGitHubClient {
	async getLatestReleaseTag(): Promise<string | null> {
		return "latest"; // not valid semver
	}
}

class FakeUserPrompt implements IUserPrompt {
	showWarning(_message: string): void {}
	showInfo(_message: string): void {}
	async confirm(_message: string, _default?: boolean): Promise<boolean> {
		return true;
	}
	async selectOptional(_options: readonly FileRule[]): Promise<string[]> {
		return [];
	}
	showProgressBar(_total: number, _label?: string): void {}
	updateProgress(_current: number, _filePath: string): void {}
	completeProgress(): void {}
	logProgressEvent(_message: string): void {}
	showIntro(_title: string): void {}
	showSuccess(_message: string): void {}
	showCancel(_message: string): void {}
	showError(_message: string): void {}
	async promptForMode(): Promise<"clean" | "project" | "update" | null> {
		return null;
	}
	async selectPacks(
		_options: readonly import("../../src/application/ports/IUserPrompt").PackOption[],
		_preSelected: readonly string[],
	): Promise<readonly string[]> {
		return ["software-development"];
	}
	showVersionInfo(
		_info: import("../../src/application/ports/IUserPrompt").VersionDisplayInfo,
	): void {}
	async selectUpdateOption(
		_options: readonly import("../../src/application/ports/IUserPrompt").UpdateOptionChoice[],
	): Promise<"current" | "add" | "cancel" | null> {
		return "current";
	}
}

class FakeVersionComparator implements IVersionComparator {
	compare(installed: string, remote: string): Result<ComparisonResult, Error> {
		const validInstalled = valid(installed);
		const validRemote = valid(remote);
		if (!validInstalled || !validRemote) {
			return success("incompatible" as ComparisonResult);
		}
		const cmp = semverCompare(validInstalled, validRemote);
		if (cmp < 0) return success("newer" as ComparisonResult);
		if (cmp > 0) return success("older" as ComparisonResult);
		return success("equal" as ComparisonResult);
	}
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a use-case instance with test doubles.
 * Test doubles structurally match the interface types (IFileMergeEngine,
 * IVersionComparator), so no cast is needed.
 */
function makeUseCase(
	mergeEngine: CaptureMergeEngine,
	gitHub?: FakeGitHubClient,
	versionComparator?: FakeVersionComparator,
	fileSystem?: FakeFileSystem,
	bundledVersion = VERSION,
): UpdateWorkspaceUseCase {
	return new UpdateWorkspaceUseCase(
		fileSystem ?? new FakeFileSystem(),
		mergeEngine,
		new FakeUserPrompt(),
		gitHub ?? new FakeGitHubClient(),
		versionComparator ?? new FakeVersionComparator(),
		bundledVersion,
	);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UpdateWorkspaceUseCase — Issue #2 (standard overwrite)", () => {
	test("should pass standard rules as 'standard' (not 'mandatory') to merge engine", async () => {
		const mergeEngine = new CaptureMergeEngine();
		const useCase = makeUseCase(mergeEngine);

		await useCase.execute("/tmp/fake-dest", { force: true });

		// There should be at least one 'standard' rule (not converted to mandatory)
		const standardRules = mergeEngine.capturedRules.filter((r) => r.category === "standard");
		expect(standardRules.length).toBeGreaterThanOrEqual(1);
	});

	test("should pass obligatorio rules as 'mandatory' to merge engine", async () => {
		const mergeEngine = new CaptureMergeEngine();
		const useCase = makeUseCase(mergeEngine);

		await useCase.execute("/tmp/fake-dest", { force: true });

		// Obligatorio rules should be passed as 'mandatory'
		const mandatoryRules = mergeEngine.capturedRules.filter((r) => r.category === "mandatory");
		expect(mandatoryRules.length).toBeGreaterThanOrEqual(1);
	});

	test("should exclude optional rules from update", async () => {
		const mergeEngine = new CaptureMergeEngine();
		const useCase = makeUseCase(mergeEngine);

		await useCase.execute("/tmp/fake-dest", { force: true });

		// No optional rules should be passed to merge engine
		const optionalRules = mergeEngine.capturedRules.filter((r) => r.category === "optional");
		expect(optionalRules.length).toBe(0);
	});

	test("should not convert standard rules to mandatory (regression for Issue #2)", async () => {
		const mergeEngine = new CaptureMergeEngine();
		const useCase = makeUseCase(mergeEngine);

		await useCase.execute("/tmp/fake-dest", { force: true });

		// All rules should be either 'mandatory', 'standard' or 'pack', never 'optional'
		const allCategories = mergeEngine.capturedRules.map((r) => r.category);
		expect(allCategories.every((c) => c === "mandatory" || c === "standard" || c === "pack")).toBe(
			true,
		);

		// There should be at least one 'standard' rule (not converted to mandatory)
		const standardCount = allCategories.filter((c) => c === "standard").length;
		expect(standardCount).toBeGreaterThanOrEqual(1);
	});

	test("should use bundled version when remote tag is not valid semver", async () => {
		const mergeEngine = new CaptureMergeEngine();
		const fs = new FakeFileSystem();
		const gitHub = new FakeGitHubClientBadTag();
		const useCase = makeUseCase(mergeEngine, gitHub, undefined, fs);

		await useCase.execute("/tmp/fake-dest", { force: true });

		expect(fs.lastWrittenVersion).not.toBeNull();
		const versionData = JSON.parse(fs.lastWrittenVersion!);
		expect(versionData.installedVersion).toBe(VERSION);
	});
});
