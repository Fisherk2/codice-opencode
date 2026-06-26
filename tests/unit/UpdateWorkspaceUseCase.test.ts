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
import type { IGitHubClient } from "../../src/application/ports/IGitHubClient";
import type { IUserPrompt } from "../../src/application/ports/IUserPrompt";
import { UpdateWorkspaceUseCase } from "../../src/application/use-cases/UpdateWorkspaceUseCase";
import type { FileRule } from "../../src/domain/entities/FileRule";
import type { IFileMergeEngine } from "../../src/domain/ports/IFileMergeEngine";
import type { IFileSystem } from "../../src/domain/ports/IFileSystem";
import type { IVersionComparator, ReleaseType } from "../../src/domain/ports/IVersionComparator";
import type { MergeError } from "../../src/domain/types/MergeError";
import { type Result, success } from "../../src/domain/types/Result";
import type { ComparisonResult } from "../../src/domain/types/version";

// ---------------------------------------------------------------------------
// Minimal test doubles
// ---------------------------------------------------------------------------

class FakeFileSystem implements IFileSystem {
	async readTemplateFile(_path: string): Promise<string> {
		return "";
	}
	async destinationExists(_path: string): Promise<boolean> {
		return false;
	}
	getStagingPath(relativePath: string): string {
		return `/tmp/staging/${relativePath}`;
	}
	async stageFile(_path: string, _excludeSubDirs?: Set<string>): Promise<void> {}
	async commitStaging(): Promise<void> {}
	async cleanStaging(): Promise<void> {}
	async isWritable(): Promise<boolean> {
		return true;
	}
	async isEmpty(): Promise<boolean> {
		return true;
	}
	async writeVersionFile(_content: string): Promise<void> {}
	async readVersionFile(): Promise<string | null> {
		return null;
	}
}

class CaptureMergeEngine implements IFileMergeEngine {
	capturedRules: { path: string; category: string }[] = [];
	async execute(
		rules: readonly FileRule[],
		_selectedOptionals?: readonly string[],
	): Promise<Result<void, MergeError>> {
		this.capturedRules = Array.from(rules);
		return success(undefined);
	}
}

class FakeGitHubClient implements IGitHubClient {
	async getLatestReleaseTag(): Promise<string | null> {
		return "v1.0.5";
	}
	async getLatestReleaseNotes(): Promise<string | null> {
		return null;
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
	showSpinner(_message: string): void {}
	stopSpinner(): void {}
	showIntro(_title: string): void {}
	showSuccess(_message: string): void {}
	showCancel(_message: string): void {}
	showError(_message: string): void {}
	async promptForMode(): Promise<"clean" | "project" | "update" | null> {
		return null;
	}
}

class FakeVersionComparator implements IVersionComparator {
	compare(_installed: string, _remote: string): Result<ComparisonResult, Error> {
		return success("newer");
	}
	isUpdateAvailable(_installed: string, _remote: string): boolean {
		return true;
	}
	getReleaseType(_local: string, _remote: string): Result<ReleaseType, Error> {
		return success("major" as ReleaseType);
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
): UpdateWorkspaceUseCase {
	return new UpdateWorkspaceUseCase(
		new FakeFileSystem(),
		mergeEngine,
		new FakeUserPrompt(),
		gitHub ?? new FakeGitHubClient(),
		versionComparator ?? new FakeVersionComparator(),
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

		// All rules should be either 'mandatory' or 'standard', never 'optional'
		const allCategories = mergeEngine.capturedRules.map((r) => r.category);
		expect(allCategories.every((c) => c === "mandatory" || c === "standard")).toBe(true);

		// There should be at least one 'standard' rule (not converted to mandatory)
		const standardCount = allCategories.filter((c) => c === "standard").length;
		expect(standardCount).toBeGreaterThanOrEqual(1);
	});
});
