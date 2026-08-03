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

import { describe, expect, it } from "bun:test";
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
});
