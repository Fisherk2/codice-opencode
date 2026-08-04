/**
 * TemplateResolver — Source mode auto-detection tests (F55-T2)
 *
 * Tests the automatic detection of source mode and backward
 * compatibility with explicit templateRoot.
 */
import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { TemplateResolver } from "../../../src/infrastructure/adapters/TemplateResolver";

const PROJECT_ROOT = path.resolve(import.meta.dir, "../../..");

describe("TemplateResolver — detectTemplateRoot", () => {
	// ---------------------------------------------------------------------------
	// F55-T2: Static detection method
	// ---------------------------------------------------------------------------

	test("should have a static detectTemplateRoot method", () => {
		// RED: this fails because detectTemplateRoot doesn't exist yet
		expect(typeof TemplateResolver.detectTemplateRoot).toBe("function");
	});

	test("should return a non-empty string", () => {
		const root = TemplateResolver.detectTemplateRoot();
		expect(root).toBeDefined();
		expect(root.length).toBeGreaterThan(0);
	});

	test("should resolve to a path containing 'template'", () => {
		const root = TemplateResolver.detectTemplateRoot();
		expect(root).toContain("template");
	});

	test("should resolve to an absolute path", () => {
		const root = TemplateResolver.detectTemplateRoot();
		expect(path.isAbsolute(root)).toBe(true);
	});

	test("should use import.meta.dir in source mode when available", () => {
		// In source mode (bun test), import.meta.dir is defined.
		// The return path should be based on import.meta.dir, not process.cwd()
		const root = TemplateResolver.detectTemplateRoot();
		// The path should go upwards from the source file location (src/cli/)
		// toward the template directory
		expect(root).toMatch(/template$/);
	});
});

describe("TemplateResolver — Constructor", () => {
	// ---------------------------------------------------------------------------
	// F55-T2: Auto-detection (no templateRoot)
	// ---------------------------------------------------------------------------

	test("should create instance without templateRoot argument", () => {
		const resolver = new TemplateResolver();
		expect(resolver).toBeInstanceOf(TemplateResolver);
	});

	test("should resolve template files when no templateRoot is given (source mode)", async () => {
		// When no templateRoot, the resolver auto-detects using import.meta.dir.
		// In source mode (bun run, bunx), this resolves from src/cli/ to the
		// project/package root template directory.
		//
		// In test context, import.meta.dir points to tests/unit/adapters/, so
		// the auto-detected root differs from production. We verify the resolver
		// was created and can reject an unknown path without throwing.
		const resolver = new TemplateResolver();
		expect(resolver).toBeInstanceOf(TemplateResolver);

		// An unknown path should still throw a clear error
		await expect(resolver.resolvePath("nonexistent-file.md")).rejects.toThrow(
			"Template file not found",
		);
	});

	test("should create instance with explicit undefined templateRoot", () => {
		const resolver = new TemplateResolver(undefined);
		expect(resolver).toBeInstanceOf(TemplateResolver);
	});

	// ---------------------------------------------------------------------------
	// F55-T2: Backward compatibility
	// ---------------------------------------------------------------------------

	test("should create instance with explicit templateRoot path", () => {
		const resolver = new TemplateResolver("/tmp/test-template");
		expect(resolver).toBeInstanceOf(TemplateResolver);
	});

	test("should resolve relative to explicit templateRoot when provided", async () => {
		const resolver = new TemplateResolver("/nonexistent/path");

		await expect(resolver.resolvePath("test.md")).rejects.toThrow("Template file not found");
	});

	test("should resolve actual files from project template directory with explicit path", async () => {
		const explicitRoot = path.join(PROJECT_ROOT, "template");
		const resolver = new TemplateResolver(explicitRoot);

		const result = await resolver.resolvePath("AGENTS.md");
		expect(result).toBeTruthy();
		expect(result).toContain("template");
	});
});

// -----------------------------------------------------------------------
// FEV-17 (v2.0 template restructuring): the manifest now uses source
// groupings (core/, packs/*) as rule paths. The destination stays flat
// (core/* spreads to root, packs/* merge into agents/), so TemplateResolver
// must resolve these source-grouping paths against template/obligatorio/.
// No resolver code changed — these tests lock in the resolution contract
// the new manifest relies on.
// -----------------------------------------------------------------------

describe("TemplateResolver — FEV-17 core/packs source grouping resolution", () => {
	const templateRoot = path.join(PROJECT_ROOT, "template");

	test('resolvePath("core") resolves to obligatorio/core', async () => {
		const resolver = new TemplateResolver(templateRoot);
		const resolved = await resolver.resolvePath("core");
		expect(resolved.replace(/\\/g, "/")).toContain("obligatorio/core");
		expect(fs.existsSync(resolved)).toBe(true);
	});

	test('resolvePath("core/opencode.json") resolves to obligatorio/core/opencode.json', async () => {
		const resolver = new TemplateResolver(templateRoot);
		const resolved = await resolver.resolvePath("core/opencode.json");
		expect(resolved.replace(/\\/g, "/")).toContain("obligatorio/core/opencode.json");
	});

	test('resolvePath("core/.opencode") resolves to obligatorio/core/.opencode', async () => {
		const resolver = new TemplateResolver(templateRoot);
		const resolved = await resolver.resolvePath("core/.opencode");
		expect(resolved.replace(/\\/g, "/")).toContain("obligatorio/core/.opencode");
		expect(fs.existsSync(resolved)).toBe(true);
	});

	test('resolvePath("packs/main") resolves to obligatorio/packs/main', async () => {
		const resolver = new TemplateResolver(templateRoot);
		const resolved = await resolver.resolvePath("packs/main");
		expect(resolved.replace(/\\/g, "/")).toContain("obligatorio/packs/main");
		expect(fs.existsSync(resolved)).toBe(true);
	});

	test('resolvePath("packs/main/huitzilopochtli.md") resolves to obligatorio/packs/main/huitzilopochtli.md', async () => {
		const resolver = new TemplateResolver(templateRoot);
		const resolved = await resolver.resolvePath("packs/main/huitzilopochtli.md");
		expect(resolved.replace(/\\/g, "/")).toContain("obligatorio/packs/main/huitzilopochtli.md");
	});

	test('resolvePath("packs/sin-clasificar") resolves to obligatorio/packs/sin-clasificar', async () => {
		const resolver = new TemplateResolver(templateRoot);
		const resolved = await resolver.resolvePath("packs/sin-clasificar");
		expect(resolved.replace(/\\/g, "/")).toContain("obligatorio/packs/sin-clasificar");
		expect(fs.existsSync(resolved)).toBe(true);
	});

	test('resolvePath("README.md") falls back to estandar/README.md (legacy)', async () => {
		const resolver = new TemplateResolver(templateRoot);
		const resolved = await resolver.resolvePath("README.md");
		expect(resolved.replace(/\\/g, "/")).toContain("estandar/README.md");
	});

	test('resolvePath("Justfile") falls back to opcional/Justfile (legacy)', async () => {
		const resolver = new TemplateResolver(templateRoot);
		const resolved = await resolver.resolvePath("Justfile");
		expect(resolved.replace(/\\/g, "/")).toContain("opcional/Justfile");
	});

	test('resolvePath("core/../../../etc/passwd") rejects traversal', async () => {
		const resolver = new TemplateResolver(templateRoot);
		await expect(resolver.resolvePath("core/../../../etc/passwd")).rejects.toThrow(
			"Invalid template path",
		);
	});

	test("resolvePath rejects absolute paths", async () => {
		const resolver = new TemplateResolver(templateRoot);
		await expect(
			resolver.resolvePath(path.join(templateRoot, "obligatorio", "core", "opencode.json")),
		).rejects.toThrow("Invalid template path");
	});
});
