/**
 * Hybrid unit/integration tests for the DI container (createDependencies).
 *
 * NOTE: These tests instantiate real adapters (BunFileSystem, TemplateResolver,
 * BunSymlinkCreator) and therefore perform real filesystem probes. While they
 * live in tests/unit/ for discoverability, they are not pure unit tests — they
 * depend on the project directory layout (template/ must exist at repo root).
 *
 * Strategy: Test structural wiring — returned object shape, instance types,
 * and that the factory doesn't throw under valid configurations. Deep I/O
 * behavior (staging, symlink creation, gitignore generation) is verified by
 * the dedicated integration and E2E suites.
 */

import { describe, expect, it, mock as mockFn } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { CleanInstallUseCase } from "../../../src/application/use-cases/CleanInstallUseCase";
import { ProjectInstallUseCase } from "../../../src/application/use-cases/ProjectInstallUseCase";
import { UpdateWorkspaceUseCase } from "../../../src/application/use-cases/UpdateWorkspaceUseCase";
import type { Dependencies } from "../../../src/cli/container";
import { createDependencies } from "../../../src/cli/container";
import { BunFileSystem } from "../../../src/infrastructure/adapters/BunFileSystem";
import { ClackPromptsAdapter } from "../../../src/infrastructure/adapters/ClackPromptsAdapter";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Run createDependencies with default args and verify it does not throw.
 * Side effect: TemplateResolver.detectTemplateRoot() probes the filesystem,
 * but the template directory exists at the project root in all environments.
 */
function createDefault(): Dependencies {
	return createDependencies();
}

/** Run an async fn with console.warn replaced by a spy; returns the spy. */
async function withWarnSpy(fn: () => Promise<void>): Promise<ReturnType<typeof mockFn>> {
	const warnSpy = mockFn((..._args: unknown[]) => {});
	// biome-ignore lint/suspicious/noConsole: test code — mocking console.warn to verify verbose wiring
	const originalWarn = console.warn;
	console.warn = warnSpy as unknown as typeof console.warn;
	try {
		await fn();
	} finally {
		console.warn = originalWarn;
	}
	return warnSpy;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("createDependencies (DI container)", () => {
	// -----------------------------------------------------------------------
	// Shape tests — verify the returned object has all expected keys
	// -----------------------------------------------------------------------

	describe("returned object shape", () => {
		it("should return an object with fileSystem, userPrompt, cleanInstall, projectInstall, and updateWorkspace keys", () => {
			const deps = createDefault();
			expect(deps).toBeDefined();
			expect(deps).toHaveProperty("fileSystem");
			expect(deps).toHaveProperty("userPrompt");
			expect(deps).toHaveProperty("cleanInstall");
			expect(deps).toHaveProperty("projectInstall");
			expect(deps).toHaveProperty("updateWorkspace");
		});

		it("should have exactly 5 top-level keys", () => {
			const deps = createDefault();
			expect(Object.keys(deps)).toHaveLength(5);
		});

		it("should have all expected properties defined at runtime", () => {
			const deps = createDefault();
			// All properties should be defined and non-writable in spirit
			// (readonly TypeScript type is compile-time; verify runtime presence)
			for (const key of Object.keys(deps)) {
				expect(deps[key as keyof Dependencies]).toBeDefined();
			}
		});
	});

	// -----------------------------------------------------------------------
	// Instance type tests — verify each key is the correct concrete class
	// -----------------------------------------------------------------------

	describe("concrete adapter instantiation", () => {
		it("should wire fileSystem as a BunFileSystem instance", () => {
			const deps = createDefault();
			expect(deps.fileSystem).toBeInstanceOf(BunFileSystem);
		});

		it("should wire userPrompt as a ClackPromptsAdapter instance", () => {
			const deps = createDefault();
			expect(deps.userPrompt).toBeInstanceOf(ClackPromptsAdapter);
		});

		it("should wire cleanInstall as a CleanInstallUseCase instance", () => {
			const deps = createDefault();
			expect(deps.cleanInstall).toBeInstanceOf(CleanInstallUseCase);
		});

		it("should wire projectInstall as a ProjectInstallUseCase instance", () => {
			const deps = createDefault();
			expect(deps.projectInstall).toBeInstanceOf(ProjectInstallUseCase);
		});

		it("should wire updateWorkspace as an UpdateWorkspaceUseCase instance", () => {
			const deps = createDefault();
			expect(deps.updateWorkspace).toBeInstanceOf(UpdateWorkspaceUseCase);
		});
	});

	// -----------------------------------------------------------------------
	// Constructor parameter tests — verify optional args don't throw
	// -----------------------------------------------------------------------

	describe("optional constructor parameters", () => {
		it("should not throw when called with no arguments (defaults to process.cwd())", () => {
			// process.cwd() is the project root — template/ exists
			expect(() => createDependencies()).not.toThrow();
		});

		it("should not throw when called with a custom destination path that exists (/tmp)", () => {
			// /tmp exists on all Unix systems and is a safe test target.
			// BunSymlinkCreator validates fs.existsSync(workspaceRoot),
			// BunFileSystem creates AtomicStager which only stores the path.
			expect(() => createDependencies("/tmp")).not.toThrow();
		});

		it("should not throw when called with verbose=true", () => {
			// Verbose flag is forwarded to BunSymlinkCreator and BunGitignoreCreator.
			// Neither constructor performs writes that could fail.
			expect(() => createDependencies(undefined, true)).not.toThrow();
		});

		it("should not throw when called with custom destination and verbose=true", () => {
			expect(() => createDependencies("/tmp", true)).not.toThrow();
		});
	});

	// -----------------------------------------------------------------------
	// Idempotency and isolation tests
	// -----------------------------------------------------------------------

	describe("idempotency and isolation", () => {
		it("should return distinct Dependencies objects on each call", () => {
			const deps1 = createDefault();
			const deps2 = createDefault();
			expect(deps1).not.toBe(deps2); // different references
			expect(deps1.fileSystem).not.toBe(deps2.fileSystem); // new BunFileSystem each time
			expect(deps1.cleanInstall).not.toBe(deps2.cleanInstall); // new use case each time
		});

		it("should not share mutable state between calls", () => {
			const deps1 = createDefault();
			const deps2 = createDefault();
			// Each call creates fresh instances — no cross-contamination
			expect(deps1.userPrompt).not.toBe(deps2.userPrompt);
			expect(deps1.projectInstall).not.toBe(deps2.projectInstall);
			expect(deps1.updateWorkspace).not.toBe(deps2.updateWorkspace);
		});
	});

	// -----------------------------------------------------------------------
	// VerboseLogger wiring — guards against a regression where the logger
	// is constructed but never injected into the adapter graph.
	// -----------------------------------------------------------------------

	describe("VerboseLogger wiring", () => {
		it("emits timestamped log lines through adapters when verbose=true", async () => {
			const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "codice-container-"));
			try {
				const deps = createDependencies(tmpDir, true);
				const warnSpy = await withWarnSpy(() => deps.fileSystem.cleanStaging());

				expect(warnSpy).toHaveBeenCalled();
				const [firstLine] = warnSpy.mock.calls[0]!;
				expect(String(firstLine)).toMatch(
					/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\] clean:/,
				);
			} finally {
				await fs.rm(tmpDir, { recursive: true, force: true });
			}
		});

		it("stays silent through adapters when verbose=false", async () => {
			const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "codice-container-"));
			try {
				const deps = createDependencies(tmpDir, false);
				const warnSpy = await withWarnSpy(() => deps.fileSystem.cleanStaging());

				expect(warnSpy).not.toHaveBeenCalled();
			} finally {
				await fs.rm(tmpDir, { recursive: true, force: true });
			}
		});
	});
});
