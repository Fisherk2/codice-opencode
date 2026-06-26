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

// -----------------------------------------------------------------------
// FEV-2 (Issue #8): bunx template path arithmetic
// detectTemplateRoot() in TemplateResolver.ts uses path.resolve() with
// import.meta.dir. Since the method is defined in src/infrastructure/adapters/,
// not src/cli/, the relative path `../../template` resolves incorrectly.
// -----------------------------------------------------------------------

describe("FEV-2 — bunx template path resolution", () => {
	test("../../template from src/infrastructure/adapters resolves to src/template (BUG)", () => {
		// Simulate the npm package structure:
		// node_modules/@fisherk2-dev/codice/src/infrastructure/adapters/TemplateResolver.ts
		const adapterDir = path.join("/tmp", "codice-package", "src", "infrastructure", "adapters");
		// BUG: ../../template from adapters/ reaches src/template, not template/
		const badPath = path.resolve(adapterDir, "../../template");
		// The template dir should be at the package root:
		const pkgRoot = path.resolve(adapterDir, "../../..");
		const correctPath = path.resolve(pkgRoot, "template");

		// BUG proof: ../../template from adapters/ is inside src/, not at root
		// Normalize to forward slashes for cross-platform comparison
		expect(badPath).not.toBe(correctPath);
		expect(badPath.replace(/\\/g, "/")).toContain("/src/template");

		// FIX: ../../../template from adapters/ reaches the root's template/
		const fixedPath = path.resolve(adapterDir, "../../../template");
		expect(fixedPath).toBe(correctPath);
	});

	test("detectTemplateRoot current path '../../template' is wrong for npm package structure", () => {
		// Simulate npm package: template/ at root, adapters/ in src/
		const packageRoot = path.resolve(os.tmpdir(), "codice-issue8-test");
		try {
			fs.mkdirSync(path.join(packageRoot, "template", "obligatorio"), {
				recursive: true,
			});
			fs.writeFileSync(path.join(packageRoot, "template", "obligatorio", "opencode.json"), "{}");

			// TemplateResolver location in npm package:
			const resolverDir = path.join(packageRoot, "src", "infrastructure", "adapters");

			// BUG path: ../../template from adapters/ = src/template
			const sourcePath = path.resolve(resolverDir, "../../template");
			expect(sourcePath).toBe(path.join(packageRoot, "src", "template"));
			// This does not exist
			expect(fs.existsSync(sourcePath)).toBe(false);

			// FIX path: ../../../template from adapters/ = template/
			const fixPath = path.resolve(resolverDir, "../../../template");
			expect(fixPath).toBe(path.join(packageRoot, "template"));
			// This does exist
			expect(fs.existsSync(fixPath)).toBe(true);
		} finally {
			fs.rmSync(packageRoot, { recursive: true, force: true });
		}
	});
});

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

// -----------------------------------------------------------------------
// FEV-2-B (Issue #8 residual): npm resolves symlinks when packaging.
// The template has symlinks .opencode/{agents,commands,skills} → ../{agents,commands,skills}/.
// npm dereferences these symlinks → paths don't exist in the published tarball.
// This test reproduces the bug: resolvePath(".opencode/agents") fails when the
// structure mirrors the npm package (no symlinks).
// -----------------------------------------------------------------------

describe("FEV-2-B — npm package structure (no symlinks) resolution", () => {
	test("resolvePath('.opencode/agents') throws when symlinks do not exist (RED: reproduces npm package bug)", async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codice-fev2b-"));
		try {
			// Simulate npm package structure: template root with categories but
			// WITHOUT the .opencode/{agents,commands,skills} symlinks.
			// npm resolves symlinks during packaging, so these paths are absent.
			const obligatorioDir = path.join(tempDir, "obligatorio");
			fs.mkdirSync(path.join(obligatorioDir, "agents"), { recursive: true });
			fs.mkdirSync(path.join(obligatorioDir, "commands"), { recursive: true });
			fs.mkdirSync(path.join(obligatorioDir, "skills"), { recursive: true });
			fs.mkdirSync(path.join(obligatorioDir, ".opencode", "plugins"), { recursive: true });

			// CRITICAL: DO NOT create .opencode/{agents,commands,skills}
			// These are symlinks → ../{agents,commands,skills}/ that npm
			// resolves during packaging. They are absent in the published tarball.

			const resolver = new TemplateResolver(tempDir);

			// This call must throw because .opencode/agents doesn't exist
			// in any category directory (obligatorio, estandar, opcional).
			// This reproduces the npm package bug.
			await expect(resolver.resolvePath(".opencode/agents")).rejects.toThrow(
				"Template file not found",
			);
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("resolvePath('agents') succeeds when root agents directory exists (the real directory)", async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codice-fev2b-"));
		try {
			const obligatorioDir = path.join(tempDir, "obligatorio");
			fs.mkdirSync(path.join(obligatorioDir, "agents"), { recursive: true });
			fs.writeFileSync(path.join(obligatorioDir, "agents", "test-agent.md"), "# Test Agent");

			const resolver = new TemplateResolver(tempDir);

			// agents/ at the root template level IS in the manifest and DOES exist
			const resolved = await resolver.resolvePath("agents");
			expect(resolved).toBeTruthy();
			expect(resolved).toContain("obligatorio");
			expect(resolved).toContain("agents");
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});

// -----------------------------------------------------------------------
// FEV-2-C (Issue #11): npm excludes .gitignore from packages even when
// listed in package.json "files". The file template/estandar/.gitignore
// exists in the repo (2930 bytes) but is NOT included in the published
// npm tarball. See docs/TECH_DEBT.md §7.1 for root cause analysis.
//
// Solution: Rename .gitignore → gitignore (so npm includes it) and
// generate the .gitignore file post-installation (Clean + Project modes).
// -----------------------------------------------------------------------

describe("FEV-2-C — npm package structure (no .gitignore) resolution", () => {
	test("resolvePath('.gitignore') throws when .gitignore does not exist (RED: reproduces npm package bug)", async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codice-fev2c-"));
		try {
			// Simulate npm package structure: template root with categories but
			// WITHOUT .gitignore in any category. npm hard-excludes .gitignore from
			// packages regardless of package.json "files" or ".npmignore" settings.
			const estandarDir = path.join(tempDir, "estandar");
			fs.mkdirSync(estandarDir, { recursive: true });
			// CRITICAL: DO NOT create .gitignore in estandar/
			// npm excludes .gitignore from tarballs — this simulates that.

			// Add obligatorio directory with a known file
			const obligatorioDir = path.join(tempDir, "obligatorio");
			fs.mkdirSync(obligatorioDir, { recursive: true });
			fs.writeFileSync(path.join(obligatorioDir, "opencode.json"), "{}");

			const resolver = new TemplateResolver(tempDir);

			// This must throw because .gitignore doesn't exist in any category.
			// This reproduces the npm package bug: trying to resolve a path
			// that npm excluded from the tarball.
			await expect(resolver.resolvePath(".gitignore")).rejects.toThrow("Template file not found");
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("resolvePath('gitignore') succeeds when gitignore (no dot) exists in estandar/ (GREEN: post-fix behavior)", async () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "codice-fev2c-"));
		try {
			// After the fix, the file is renamed from .gitignore → gitignore
			// to avoid npm's hardcoded .gitignore exclusion behavior.
			const estandarDir = path.join(tempDir, "estandar");
			fs.mkdirSync(estandarDir, { recursive: true });
			fs.writeFileSync(
				path.join(estandarDir, "gitignore"),
				"# Renamed to avoid npm exclusion\nnode_modules/\n",
			);

			// Add obligatorio directory with a known file
			const obligatorioDir = path.join(tempDir, "obligatorio");
			fs.mkdirSync(obligatorioDir, { recursive: true });
			fs.writeFileSync(path.join(obligatorioDir, "opencode.json"), "{}");

			const resolver = new TemplateResolver(tempDir);

			// gitignore (no dot) should resolve successfully from estandar/
			const resolved = await resolver.resolvePath("gitignore");
			expect(resolved).toBeTruthy();
			expect(resolved.replace(/\\/g, "/")).toContain("estandar");
			expect(resolved.replace(/\\/g, "/")).toContain("gitignore");
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});
});
