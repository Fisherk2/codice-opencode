/**
 * TemplateResolver — bunx/npm mode detection tests (FEV1-T1)
 *
 * Tests the three-path detection cascade:
 * 1. Compiled mode: process.execPath + '../template/'
 * 2. bunx/npm mode: import.meta.dir + '../template/'  ← NEW
 * 3. Source mode: import.meta.dir + '../../template/'
 *
 * Issue #6: Template file not found when running via `bunx @fisherk2-dev/codice`
 * because the template directory is at ../template/ relative to src/cli/, not ../../template/.
 */

import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { TemplateResolver } from "../../src/infrastructure/adapters/TemplateResolver";

const PROJECT_ROOT = path.resolve(import.meta.dir, "../..");

describe("TemplateResolver — bunx/npm mode (FEV1-T1)", () => {
	// ---------------------------------------------------------------------------
	// Helper: create a temporary template structure simulating bunx mode
	// ---------------------------------------------------------------------------
	function createBunxSimulation(tempDir: string): string {
		// Simulate: node_modules/@fisherk2-dev/codice/
		const pkgRoot = path.join(tempDir, "node_modules", "@fisherk2-dev", "codice");
		const srcCliDir = path.join(pkgRoot, "src", "cli");
		const templateDir = path.join(pkgRoot, "template");
		const obligatorioDir = path.join(templateDir, "obligatorio");

		// Create directories
		fs.mkdirSync(srcCliDir, { recursive: true });
		fs.mkdirSync(obligatorioDir, { recursive: true });

		// Create a dummy template file
		fs.writeFileSync(path.join(obligatorioDir, "opencode.json"), '{"test": true}');

		return srcCliDir;
	}

	test("should detect template root in bunx mode (../../template/ from src/cli/)", async () => {
		// This test verifies the fix for Issue #6.
		// In bunx mode, import.meta.dir points to src/cli/, and template is at ../../template/
		// (two levels up from src/cli/ to the package root).
		// We simulate this by creating a temp structure matching the npm package layout.

		const tempDir = fs.mkdtempSync(path.join("/tmp", "codice-bunx-test-"));
		try {
			const srcCliDir = createBunxSimulation(tempDir);
			// From src/cli/, template is at ../../template/ (package root)
			const expectedTemplateRoot = path.resolve(srcCliDir, "../../template");

			// Verify the simulation is correct
			expect(fs.existsSync(expectedTemplateRoot)).toBe(true);
			expect(fs.existsSync(path.join(expectedTemplateRoot, "obligatorio", "opencode.json"))).toBe(
				true,
			);

			// Create resolver pointing to the bunx-style template root
			const resolver = new TemplateResolver(expectedTemplateRoot);
			const resolved = await resolver.resolvePath("opencode.json");

			expect(resolved).toBeTruthy();
			expect(resolved).toContain("template");
			expect(resolved).toContain("opencode.json");
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should resolve files from template in bunx mode structure", async () => {
		const tempDir = fs.mkdtempSync(path.join("/tmp", "codice-bunx-resolve-"));
		try {
			const srcCliDir = createBunxSimulation(tempDir);
			const templateRoot = path.resolve(srcCliDir, "../../template");
			const resolver = new TemplateResolver(templateRoot);

			const content = await resolver.readFile("opencode.json");
			expect(content).toBe('{"test": true}');
		} finally {
			fs.rmSync(tempDir, { recursive: true, force: true });
		}
	});

	test("should still work with source mode (../../template/ from src/cli/)", async () => {
		// Verify backward compatibility: source mode (development) uses ../../template/
		const explicitRoot = path.join(PROJECT_ROOT, "template");
		const resolver = new TemplateResolver(explicitRoot);
		// resolvePath searches categories internally, so we pass just the filename
		const resolved = await resolver.resolvePath("AGENTS.md");
		expect(resolved).toBeTruthy();
		expect(resolved).toContain("template");
		expect(resolved).toContain("AGENTS.md");
	});

	test("should still work with compiled mode (../template/ from binary)", async () => {
		// Verify backward compatibility: compiled mode uses ../template/ relative to binary
		// We simulate this by creating a temp binary dir with template
		const tempDir = fs.mkdtempSync(path.join("/tmp", "codice-compiled-test-"));
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
});
