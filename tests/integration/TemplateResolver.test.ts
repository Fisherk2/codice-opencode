/**
 * TemplateResolver — template root detection tests
 *
 * Tests the detection cascade:
 * 1. Source/bunx mode: import.meta.dir + '../../template/'
 * 2. Compiled mode: process.argv[0] + '../template/'
 * 3. Fallback: process.cwd() + 'template/'
 *
 * Issue #6 (v1.0.5): bunx mode was not detecting the template root.
 * Resolution: the source mode path (../../template/) works for both
 * local development and bunx/npm execution.
 */

import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { TemplateResolver } from "../../src/infrastructure/adapters/TemplateResolver";

const PROJECT_ROOT = path.resolve(import.meta.dir, "../..");

describe("TemplateResolver — template root detection", () => {
	test("resolves paths with explicit template root (source mode)", async () => {
		const explicitRoot = path.join(PROJECT_ROOT, "template");
		const resolver = new TemplateResolver(explicitRoot);
		const resolved = await resolver.resolvePath("AGENTS.md");
		expect(resolved).toBeTruthy();
		expect(resolved).toContain("template");
		expect(resolved).toContain("AGENTS.md");
	});

	test("resolves paths with explicit template root (compiled mode simulation)", async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codice-compiled-test-"));
		try {
			const binaryDir = path.join(tempDir, "dist");
			const templateDir = path.join(tempDir, "template");
			fs.mkdirSync(binaryDir, { recursive: true });
			fs.mkdirSync(path.join(templateDir, "obligatorio"), { recursive: true });
			fs.writeFileSync(path.join(templateDir, "obligatorio", "test.txt"), "compiled");

			const resolver = new TemplateResolver(templateDir);
			const resolved = await resolver.resolvePath("test.txt");
			expect(resolved).toBeTruthy();
			expect(resolved).toContain("template");
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	// -----------------------------------------------------------------------
	// Direct detectTemplateRoot() tests — calls the static method that
	// implements the actual detection cascade (not via constructor with
	// explicit path). These verify that auto-detection works in dev mode.
	// -----------------------------------------------------------------------

	test("detectTemplateRoot() returns an existing path containing 'template'", () => {
		const root = TemplateResolver.detectTemplateRoot();
		expect(root).toBeTruthy();
		expect(root).toContain("template");
		expect(fs.existsSync(root)).toBe(true);
	});

	test("detectTemplateRoot() finds a directory with obligatorio subdirectory", () => {
		const root = TemplateResolver.detectTemplateRoot();
		expect(fs.existsSync(path.join(root, "obligatorio"))).toBe(true);
	});

	test("detectTemplateRoot() returns an absolute path", () => {
		const root = TemplateResolver.detectTemplateRoot();
		// Verify it returns a valid absolute path
		expect(path.isAbsolute(root)).toBe(true);
	});

	test("detectTemplateRoot() returns the template directory in the project", () => {
		const root = TemplateResolver.detectTemplateRoot();
		// Verify it resolves to the correct project template directory
		const expectedRoot = path.resolve(PROJECT_ROOT, "template");
		expect(root).toBe(expectedRoot);
	});
});
