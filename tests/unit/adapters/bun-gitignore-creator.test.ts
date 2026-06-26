/**
 * BunGitignoreCreator — gitignore generation adapter tests
 *
 * Covers 10 scenarios:
 * 1. Creates .gitignore new file with content from template
 * 2. Idempotent: skip if .gitignore already exists
 * 3. Skips directory at .gitignore path (user created it manually)
 * 4. Returns READ_FAILED when template gitignore file can't be read
 * 5. Returns WRITE_FAILED when destination is not writable
 * 6. Returns TEMPLATE_NOT_FOUND when template path doesn't exist
 * 7. Returns WRITE_FAILED when destination escapes workspace root (path traversal)
 * 8. Does NOT reject path when destPath equals workspace root (exact match allowed)
 * 9. Verbose mode emits creation log to stderr
 * 10. Verbose mode undefined defaults to false (no console.warn)
 */

import { afterAll, beforeAll, describe, expect, mock as mockFn, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// Dynamic import so tests exercise module loading from source
const modulePath = "../../../src/infrastructure/adapters/BunGitignoreCreator";

describe("BunGitignoreCreator — single createGitignore", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codice-gitignore-test-"));
	const workspaceDir = path.join(tempDir, "workspace");

	beforeAll(() => {
		fs.mkdirSync(workspaceDir, { recursive: true });
	});

	afterAll(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	test("creates .gitignore file with content from template", async () => {
		const { BunGitignoreCreator } = await import(modulePath);
		const templateDir = path.join(tempDir, "template", "estandar");

		// Create template gitignore file
		fs.mkdirSync(templateDir, { recursive: true });
		const templateContent = "# Generated .gitignore\nnode_modules/\n.env\n";
		fs.writeFileSync(path.join(templateDir, "gitignore"), templateContent);

		const creator = new BunGitignoreCreator(workspaceDir, templateDir);
		const result = await creator.createGitignore(workspaceDir);

		expect(result.ok).toBe(true);

		const gitignorePath = path.join(workspaceDir, ".gitignore");
		expect(fs.existsSync(gitignorePath)).toBe(true);
		const content = fs.readFileSync(gitignorePath, "utf-8");
		expect(content).toBe(templateContent);
	});

	test("is idempotent: skip if .gitignore already exists with content", async () => {
		const { BunGitignoreCreator } = await import(modulePath);
		const templateDir = path.join(tempDir, "template-idempotent", "estandar");
		const workspaceIdempDir = path.join(tempDir, "workspace-idempotent");

		fs.mkdirSync(templateDir, { recursive: true });
		fs.mkdirSync(workspaceIdempDir, { recursive: true });

		// Create template gitignore
		const templateContent = "# Template\nbuild/\n";
		fs.writeFileSync(path.join(templateDir, "gitignore"), templateContent);

		// Pre-create .gitignore with different content (user customization)
		const userContent = "# Custom gitignore\nbuild/\ndist/\n";
		fs.writeFileSync(path.join(workspaceIdempDir, ".gitignore"), userContent);

		const creator = new BunGitignoreCreator(workspaceIdempDir, templateDir);
		const result = await creator.createGitignore(workspaceIdempDir);

		// Idempotent: should succeed without overwriting
		expect(result.ok).toBe(true);

		// Must NOT be overwritten with template content
		const content = fs.readFileSync(path.join(workspaceIdempDir, ".gitignore"), "utf-8");
		expect(content).toBe(userContent);
		expect(content).not.toBe(templateContent);
	});

	test("skips real directory at .gitignore path (user may have created manually)", async () => {
		const { BunGitignoreCreator } = await import(modulePath);
		const templateDir = path.join(tempDir, "template-dir-skip", "estandar");
		const workspaceDirSkip = path.join(tempDir, "workspace-dir-skip");

		fs.mkdirSync(templateDir, { recursive: true });
		fs.writeFileSync(path.join(templateDir, "gitignore"), "# content");

		// Create a directory at the .gitignore path (user manually created directories)
		fs.mkdirSync(workspaceDirSkip, { recursive: true });
		fs.mkdirSync(path.join(workspaceDirSkip, ".gitignore"), { recursive: true });

		const creator = new BunGitignoreCreator(workspaceDirSkip, templateDir);
		const result = await creator.createGitignore(workspaceDirSkip);

		// Should succeed (skip with warning, not fail)
		expect(result.ok).toBe(true);

		// Must still be a directory, not a file
		const stat = fs.statSync(path.join(workspaceDirSkip, ".gitignore"));
		expect(stat.isDirectory()).toBe(true);
	});

	test("returns READ_FAILED when template gitignore file cannot be read", async () => {
		const { BunGitignoreCreator } = await import(modulePath);
		// Use template dir without the gitignore file
		const emptyTemplateDir = path.join(tempDir, "template-read-fail", "estandar");
		fs.mkdirSync(emptyTemplateDir, { recursive: true });
		// DO NOT create gitignore file — it's missing

		const workspaceReadFail = path.join(tempDir, "workspace-read-fail");
		fs.mkdirSync(workspaceReadFail, { recursive: true });

		const creator = new BunGitignoreCreator(workspaceReadFail, emptyTemplateDir);
		const result = await creator.createGitignore(workspaceReadFail);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("READ_FAILED");
			expect(result.error.destPath).toBe(workspaceReadFail);
		}
	});

	// chmod 0o444 doesn't make dirs unwritable on Windows (admins always have write access)
	test.skipIf(process.platform === "win32")("returns WRITE_FAILED when destination is not writable", async () => {
		const { BunGitignoreCreator } = await import(modulePath);
		const templateDir = path.join(tempDir, "template-write-fail", "estandar");
		fs.mkdirSync(templateDir, { recursive: true });
		fs.writeFileSync(path.join(templateDir, "gitignore"), "# content");

		const workspaceWriteFail = path.join(tempDir, "workspace-write-fail");
		fs.mkdirSync(workspaceWriteFail, { recursive: true });

		// Make workspace read-only (BunGitignoreCreator needs to handle EACCES)
		fs.chmodSync(workspaceWriteFail, 0o444);

		const creator = new BunGitignoreCreator(workspaceWriteFail, templateDir);
		const result = await creator.createGitignore(workspaceWriteFail);

		// Restore permissions for cleanup
		fs.chmodSync(workspaceWriteFail, 0o755);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			// Could be WRITE_FAILED for permission error
			expect(result.error.code).toBe("WRITE_FAILED");
			expect(result.error.destPath).toBe(workspaceWriteFail);
		}
	});

	test("returns TEMPLATE_NOT_FOUND when template directory does not exist", async () => {
		const { BunGitignoreCreator } = await import(modulePath);
		// Simulate a template path that was never created (entirely missing)
		const nonExistentDir = path.join(tempDir, "template-never-created", "estandar");

		const workspaceMissing = path.join(tempDir, "workspace-missing");
		fs.mkdirSync(workspaceMissing, { recursive: true });

		const creator = new BunGitignoreCreator(workspaceMissing, nonExistentDir);
		const result = await creator.createGitignore(workspaceMissing);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("TEMPLATE_NOT_FOUND");
			expect(result.error.destPath).toBe(workspaceMissing);
		}
	});

	test("returns WRITE_FAILED when destination path escapes workspace root (path traversal)", async () => {
		const { BunGitignoreCreator } = await import(modulePath);
		const templateDir = path.join(tempDir, "template-escape", "estandar");
		fs.mkdirSync(templateDir, { recursive: true });
		fs.writeFileSync(path.join(templateDir, "gitignore"), "# content");

		// Create a workspace root that is a subdirectory of tempDir
		const safeRoot = path.join(tempDir, "safe-project");
		fs.mkdirSync(safeRoot, { recursive: true });

		// Attempt to write outside safeRoot via path traversal
		const creator = new BunGitignoreCreator(safeRoot, templateDir);
		const result = await creator.createGitignore(tempDir); // tempDir is OUTSIDE safeRoot

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("WRITE_FAILED");
			expect(result.error.destPath).toBe(tempDir);
			expect(result.error.message).toContain("escapes workspace root");
		}
	});

	test("does NOT reject path when destPath equals workspace root", async () => {
		const { BunGitignoreCreator } = await import(modulePath);
		const templateDir = path.join(tempDir, "template-equal-root", "estandar");
		fs.mkdirSync(templateDir, { recursive: true });
		fs.writeFileSync(path.join(templateDir, "gitignore"), "# content");

		const root = path.join(tempDir, "exact-root");
		fs.mkdirSync(root, { recursive: true });

		// Writing to the exact root should succeed (not escape)
		const creator = new BunGitignoreCreator(root, templateDir);
		const result = await creator.createGitignore(root);

		expect(result.ok).toBe(true);
		const gitignorePath = path.join(root, ".gitignore");
		expect(fs.existsSync(gitignorePath)).toBe(true);
	});

	test("verbose mode calls console.warn on success", async () => {
		const { BunGitignoreCreator } = await import(modulePath);
		const templateDir = path.join(tempDir, "template-verbose", "estandar");
		fs.mkdirSync(templateDir, { recursive: true });
		fs.writeFileSync(path.join(templateDir, "gitignore"), "# verbose test\n");

		const verboseRoot = path.join(tempDir, "workspace-verbose");
		fs.mkdirSync(verboseRoot, { recursive: true });

		// Capture console.warn calls
		const warnCalls: unknown[][] = [];
		const originalWarn = console.warn;
		console.warn = mockFn((...args: unknown[]) => {
			warnCalls.push(args);
		});

		try {
			const creator = new BunGitignoreCreator(verboseRoot, templateDir, true);
			const result = await creator.createGitignore(verboseRoot);

			expect(result.ok).toBe(true);
			// Should have called console.warn with creation info
			expect(warnCalls.length).toBeGreaterThan(0);
			const creationMessage = warnCalls.find(
				(args) => typeof args[0] === "string" && (args[0] as string).includes("Created .gitignore"),
			);
			expect(creationMessage).toBeDefined();
		} finally {
			console.warn = originalWarn;
		}
	});

	test("verbose mode undefined defaults to false (no console.warn)", async () => {
		const { BunGitignoreCreator } = await import(modulePath);
		const templateDir = path.join(tempDir, "template-no-verbose", "estandar");
		fs.mkdirSync(templateDir, { recursive: true });
		fs.writeFileSync(path.join(templateDir, "gitignore"), "# no verbose\n");

		const noVerboseRoot = path.join(tempDir, "workspace-no-verbose");
		fs.mkdirSync(noVerboseRoot, { recursive: true });

		const warnCalls: unknown[][] = [];
		const originalWarn = console.warn;
		console.warn = mockFn((...args: unknown[]) => {
			warnCalls.push(args);
		});

		try {
			// verbose not passed → defaults to false
			const creator = new BunGitignoreCreator(noVerboseRoot, templateDir);
			const result = await creator.createGitignore(noVerboseRoot);

			expect(result.ok).toBe(true);
			// Should NOT have called console.warn with creation info
			const creationMessage = warnCalls.find(
				(args) => typeof args[0] === "string" && (args[0] as string).includes("Created .gitignore"),
			);
			expect(creationMessage).toBeUndefined();
		} finally {
			console.warn = originalWarn;
		}
	});
});
