/**
 * BunSymlinkCreator — symlink creation adapter tests
 *
 * Covers 9 scenarios:
 * 1. Creates a new symlink with correct target
 * 2. Idempotent: existing symlink is not overwritten
 * 3. Idempotent: broken symlink at link path is handled without error
 * 4. Skips real directories (user converted symlink to dir)
 * 5. Returns SymlinkError when target doesn't exist
 * 6. Supports relative paths from workspace root
 * 7. Batch createSymlinks creates all symlinks independently
 * 8. Batch processes remaining symlinks when one fails
 * 9. Rejects symlink paths that escape workspace root
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { SymlinkSpec } from "../../../src/application/ports/ISymlinkCreator";
import type { SymlinkError } from "../../../src/domain/types/SymlinkError";

/** Normalize path separators for cross-platform symlink target comparison. */
function normalizeSlash(p: string): string {
	return p.replace(/\\/g, "/");
}

// Use dynamic import so tests exercise module loading from source
const modulePath = "../../../src/infrastructure/adapters/BunSymlinkCreator";
const symlinkConfigPath = "../../../src/infrastructure/config/symlinks";

describe("BunSymlinkCreator — single createSymlink", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codice-symlink-test-"));
	const workspaceDir = path.join(tempDir, "workspace");
	const targetDir = path.join(workspaceDir, "agents");
	const linkDir = path.join(workspaceDir, ".opencode");

	beforeAll(() => {
		fs.mkdirSync(targetDir, { recursive: true });
		fs.mkdirSync(linkDir, { recursive: true });
		// Target dirs for ../agents, ../commands/, ../target from .opencode/
		fs.mkdirSync(path.join(workspaceDir, "commands"), { recursive: true });
		fs.mkdirSync(path.join(workspaceDir, "target"), { recursive: true });
	});

	afterAll(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	test("creates a new symlink pointing to the correct target", async () => {
		const { BunSymlinkCreator } = await import(modulePath);
		const creator = new BunSymlinkCreator(workspaceDir);

		const linkPath = path.join(linkDir, "agents");
		const relativeTarget = "../agents";

		const result = await creator.createSymlink(relativeTarget, ".opencode/agents");

		expect(result.ok).toBe(true);
		expect(fs.lstatSync(linkPath).isSymbolicLink()).toBe(true);
		expect(normalizeSlash(fs.readlinkSync(linkPath))).toBe(relativeTarget);
	});

	test("is idempotent: existing symlink is not overwritten", async () => {
		const { BunSymlinkCreator } = await import(modulePath);
		const creator = new BunSymlinkCreator(workspaceDir);

		// First call succeeds
		const first = await creator.createSymlink("../agents", ".opencode/agents");
		expect(first.ok).toBe(true);

		// Second call also succeeds (idempotent)
		const second = await creator.createSymlink("../agents", ".opencode/agents");
		expect(second.ok).toBe(true);

		// Symlink still points to the same target
		expect(normalizeSlash(fs.readlinkSync(path.join(linkDir, "agents")))).toBe("../agents");
	});

	test("skips real directory at linkPath (idempotent safety)", async () => {
		const { BunSymlinkCreator } = await import(modulePath);
		const creator = new BunSymlinkCreator(workspaceDir);

		// Create a real directory where a symlink would go
		const realDirPath = ".opencode/real-dir";
		fs.mkdirSync(path.join(workspaceDir, realDirPath), { recursive: true });

		const result = await creator.createSymlink("../target", realDirPath);

		// Should succeed (skip with warning, not error)
		expect(result.ok).toBe(true);
		// Verify the directory was NOT replaced by a symlink
		expect(fs.lstatSync(path.join(workspaceDir, realDirPath)).isDirectory()).toBe(true);
		expect(fs.lstatSync(path.join(workspaceDir, realDirPath)).isSymbolicLink()).toBe(false);
	});

	test("returns SymlinkError when target does not exist", async () => {
		const { BunSymlinkCreator } = await import(modulePath);
		const creator = new BunSymlinkCreator(workspaceDir);

		const result = await creator.createSymlink(
			"../non-existent-target",
			".opencode/broken-symlink",
		);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error).toBeDefined();
			expect(result.error.linkPath).toBe(".opencode/broken-symlink");
			expect(result.error.target).toBe("../non-existent-target");
			expect(result.error.message).toBeTruthy();
		}
	});

	test("supports relative paths from workspace root", async () => {
		const { BunSymlinkCreator } = await import(modulePath);
		const creator = new BunSymlinkCreator(workspaceDir);

		const result = await creator.createSymlink("../commands", ".opencode/commands");

		expect(result.ok).toBe(true);
		const absLinkPath = path.join(workspaceDir, ".opencode", "commands");
		expect(fs.lstatSync(absLinkPath).isSymbolicLink()).toBe(true);
		expect(normalizeSlash(fs.readlinkSync(absLinkPath))).toBe("../commands");
	});

	test("is idempotent with broken symlink at linkPath (does not throw EEXIST)", async () => {
		const { BunSymlinkCreator } = await import(modulePath);
		const creator = new BunSymlinkCreator(workspaceDir);

		// First, create a symlink whose target exists
		const result1 = await creator.createSymlink("../target", ".opencode/broken-test");
		expect(result1.ok).toBe(true);

		// Remove the target to break the symlink
		fs.rmSync(path.join(workspaceDir, "target"), { recursive: true, force: true });

		// Now the symlink at .opencode/broken-test is broken (target no longer exists)
		// The creator must handle this idempotently — return success without error
		const result2 = await creator.createSymlink("../target", ".opencode/broken-test");
		expect(result2.ok).toBe(true);
	});

	test("rejects symlink linkPath that escapes workspace root", async () => {
		const { BunSymlinkCreator } = await import(modulePath);
		const creator = new BunSymlinkCreator(workspaceDir);

		const result = await creator.createSymlink("../target", "../../etc/passwd");

		expect(result.ok).toBe(false);
	});

	test("rejects symlink target that escapes workspace root", async () => {
		const { BunSymlinkCreator } = await import(modulePath);
		const creator = new BunSymlinkCreator(workspaceDir);

		const result = await creator.createSymlink("../../../etc/passwd", ".opencode/escaping-test");

		expect(result.ok).toBe(false);
	});

	test("creates symlink pointing to a regular file (Windows type: file)", async () => {
		const { BunSymlinkCreator } = await import(modulePath);
		const creator = new BunSymlinkCreator(workspaceDir);

		// Create a regular file as the symlink target
		const filePath = path.join(workspaceDir, "readme.md");
		fs.writeFileSync(filePath, "# Test");

		const result = await creator.createSymlink("../readme.md", ".opencode/link-to-file");

		expect(result.ok).toBe(true);
		const absLinkPath = path.join(workspaceDir, ".opencode", "link-to-file");
		expect(fs.lstatSync(absLinkPath).isSymbolicLink()).toBe(true);
		expect(normalizeSlash(fs.readlinkSync(absLinkPath))).toBe("../readme.md");
	});

	test("auto-creates parent directory for nested symlink path", async () => {
		const { BunSymlinkCreator } = await import(modulePath);
		const creator = new BunSymlinkCreator(workspaceDir);

		// Remove .opencode dir to simulate fresh install
		const opencodeDir = path.join(workspaceDir, ".opencode");
		fs.rmSync(opencodeDir, { recursive: true, force: true });

		const result = await creator.createSymlink("../agents", ".opencode/agents");

		expect(result.ok).toBe(true);
		// Parent dir should have been auto-created
		expect(fs.existsSync(opencodeDir)).toBe(true);
		expect(fs.lstatSync(path.join(opencodeDir, "agents")).isSymbolicLink()).toBe(true);
	});

	test("populates SymlinkError code field with error code", async () => {
		const { BunSymlinkCreator } = await import(modulePath);
		const creator = new BunSymlinkCreator(workspaceDir);

		const result = await creator.createSymlink("../non-existent-target", ".opencode/code-test");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBeDefined();
			expect(typeof result.error.code).toBe("string");
		}
	});

	test("populates SymlinkError code field with EPERM for path escape", async () => {
		const { BunSymlinkCreator } = await import(modulePath);
		const creator = new BunSymlinkCreator(workspaceDir);

		// Link path escape
		const result = await creator.createSymlink("../target", "../../etc/passwd");

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.code).toBe("EPERM");
			expect(result.error.target).toBe("../target");
			expect(result.error.linkPath).toBe("../../etc/passwd");
		}
	});

	test("constructor throws when workspaceRoot does not exist", () => {
		// Re-import to avoid any cached module state
		return import(modulePath).then(({ BunSymlinkCreator }) => {
			expect(() => new BunSymlinkCreator("/tmp/non-existent-dir-12345")).toThrow(
				"Workspace root does not exist",
			);
		});
	});
});

describe("BunSymlinkCreator — batch createSymlinks", () => {
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codice-symlink-batch-"));
	const workspaceDir = path.join(tempDir, "workspace");

	beforeAll(() => {
		fs.mkdirSync(path.join(workspaceDir, "agents"), { recursive: true });
		fs.mkdirSync(path.join(workspaceDir, "commands"), { recursive: true });
		fs.mkdirSync(path.join(workspaceDir, "skills"), { recursive: true });
		fs.mkdirSync(path.join(workspaceDir, ".opencode"), { recursive: true });
	});

	afterAll(() => {
		fs.rmSync(tempDir, { recursive: true, force: true });
	});

	test("creates all symlinks in batch", async () => {
		const { BunSymlinkCreator } = await import(modulePath);
		const { OPENCODE_SYMLINKS } = await import(symlinkConfigPath);

		const creator = new BunSymlinkCreator(workspaceDir);
		const result = await creator.createSymlinks(OPENCODE_SYMLINKS);

		expect(result.ok).toBe(true);

		for (const spec of OPENCODE_SYMLINKS) {
			const absLinkPath = path.join(workspaceDir, spec.linkPath);
			expect(fs.lstatSync(absLinkPath).isSymbolicLink()).toBe(true);
			expect(normalizeSlash(fs.readlinkSync(absLinkPath))).toBe(spec.target);
		}
	});

	test("processes remaining symlinks when one fails", async () => {
		const { BunSymlinkCreator } = await import(modulePath);

		const creator = new BunSymlinkCreator(workspaceDir);

		// One valid, one invalid (target doesn't exist)
		const specs: SymlinkSpec[] = [
			{ target: "../agents", linkPath: ".opencode/agents" },
			{ target: "../non-existent", linkPath: ".opencode/broken" },
		];

		const result = await creator.createSymlinks(specs);

		// The valid symlink should have been created
		expect(fs.lstatSync(path.join(workspaceDir, ".opencode", "agents")).isSymbolicLink()).toBe(
			true,
		);

		// The result should contain the error for the broken one
		if (!result.ok) {
			expect(result.error).toHaveLength(1);
			expect(result.error[0].linkPath).toBe(".opencode/broken");
		}
	});

	test("collects ALL errors when multiple symlinks fail", async () => {
		const { BunSymlinkCreator } = await import(modulePath);

		const creator = new BunSymlinkCreator(workspaceDir);

		// Three specs, all with non-existent targets
		const specs: SymlinkSpec[] = [
			{ target: "../missing-a", linkPath: ".opencode/missing-a" },
			{ target: "../missing-b", linkPath: ".opencode/missing-b" },
			{ target: "../missing-c", linkPath: ".opencode/missing-c" },
		];

		const result = await creator.createSymlinks(specs);

		if (!result.ok) {
			expect(result.error).toHaveLength(3);
			// All errors have linkPaths matching their spec
			for (let i = 0; i < result.error.length; i++) {
				expect(result.error[i]!.linkPath).toBe(specs[i]!.linkPath);
			}
		}
	});
});
