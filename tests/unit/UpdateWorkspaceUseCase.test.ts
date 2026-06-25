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
import { UpdateWorkspaceUseCase } from "../../src/application/use-cases/UpdateWorkspaceUseCase";
import type { IFileSystem } from "../../src/application/ports/IFileSystem";
import type { FileMergeEngine } from "../../src/domain/services/FileMergeEngine";
import type { IGitHubClient } from "../../src/application/ports/IGitHubClient";
import type { IUserPrompt } from "../../src/application/ports/IUserPrompt";
import type { VersionComparator } from "../../src/domain/services/VersionComparator";

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
	async getStagingPath(_targetPath: string): Promise<string> {
		return "/tmp/staging/" + _targetPath;
	}
	async stageFile(_path: string): Promise<void> {}
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

class CaptureMergeEngine implements FileMergeEngine {
	capturedRules: { path: string; category: string }[] = [];
	async execute(
		rules: readonly { readonly path: string; readonly category: string }[],
	): Promise<{ ok: true } | { ok: false; error: { message: string } }> {
		this.capturedRules = Array.from(rules);
		return { ok: true };
	}
}

class FakeGitHubClient implements IGitHubClient {
	async getLatestReleaseTag(): Promise<string | null> {
		return "v1.0.5";
	}
}

class FakeUserPrompt implements IUserPrompt {
	async confirm(_message: string, _default: boolean): Promise<boolean> {
		return true;
	}
	async showInfo(_message: string): Promise<void> {}
	async showWarning(_message: string): Promise<void> {}
	async showSuccess(_message: string): Promise<void> {}
	async showCancel(_message: string): Promise<void> {}
	async select(_message: string, _options: readonly string[]): Promise<string | null> {
		return null;
	}
	async multiselect(_message: string, _options: readonly string[]): Promise<string[]> {
		return [];
	}
}

class FakeVersionComparator implements VersionComparator {
	compare(
		_installed: string,
		_remote: string,
	):
		| { ok: true; value: "newer" | "older" | "equal" | "incompatible" }
		| { ok: false; error: Error } {
		return { ok: true, value: "newer" };
	}
	isUpdateAvailable(_installed: string, _remote: string): boolean {
		return true;
	}
	getReleaseType(_version: string): string {
		return "major";
	}
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("UpdateWorkspaceUseCase — Issue #2 (standard overwrite)", () => {
	test("should pass standard rules as 'standard' (not 'mandatory') to merge engine", async () => {
		const mergeEngine = new CaptureMergeEngine();
		const useCase = new UpdateWorkspaceUseCase(
			new FakeFileSystem(),
			mergeEngine,
			new FakeUserPrompt(),
			new FakeGitHubClient(),
			new FakeVersionComparator(),
		);

		await useCase.execute("/tmp/fake-dest", { force: true });

		// There should be at least one 'standard' rule (not converted to mandatory)
		const standardRules = mergeEngine.capturedRules.filter((r) => r.category === "standard");
		expect(standardRules.length).toBeGreaterThanOrEqual(1);
	});

	test("should pass obligatorio rules as 'mandatory' to merge engine", async () => {
		const mergeEngine = new CaptureMergeEngine();
		const useCase = new UpdateWorkspaceUseCase(
			new FakeFileSystem(),
			mergeEngine,
			new FakeUserPrompt(),
			new FakeGitHubClient(),
			new FakeVersionComparator(),
		);

		await useCase.execute("/tmp/fake-dest", { force: true });

		// Obligatorio rules should be passed as 'mandatory'
		const mandatoryRules = mergeEngine.capturedRules.filter((r) => r.category === "mandatory");
		expect(mandatoryRules.length).toBeGreaterThanOrEqual(1);
	});

	test("should exclude optional rules from update", async () => {
		const mergeEngine = new CaptureMergeEngine();
		const useCase = new UpdateWorkspaceUseCase(
			new FakeFileSystem(),
			mergeEngine,
			new FakeUserPrompt(),
			new FakeGitHubClient(),
			new FakeVersionComparator(),
		);

		await useCase.execute("/tmp/fake-dest", { force: true });

		// No optional rules should be passed to merge engine
		const optionalRules = mergeEngine.capturedRules.filter((r) => r.category === "optional");
		expect(optionalRules.length).toBe(0);
	});

	test("should not convert standard rules to mandatory (regression for Issue #2)", async () => {
		const mergeEngine = new CaptureMergeEngine();
		const useCase = new UpdateWorkspaceUseCase(
			new FakeFileSystem(),
			mergeEngine,
			new FakeUserPrompt(),
			new FakeGitHubClient(),
			new FakeVersionComparator(),
		);

		await useCase.execute("/tmp/fake-dest", { force: true });

		// All rules should be either 'mandatory' or 'standard', never 'optional'
		const allCategories = mergeEngine.capturedRules.map((r) => r.category);
		expect(allCategories.every((c) => c === "mandatory" || c === "standard")).toBe(true);

		// There should be at least one 'standard' rule (not converted to mandatory)
		const standardCount = allCategories.filter((c) => c === "standard").length;
		expect(standardCount).toBeGreaterThanOrEqual(1);
	});
});
