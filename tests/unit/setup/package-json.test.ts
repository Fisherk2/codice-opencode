/**
 * Package.json Configuration Tests
 */

import { beforeAll, describe, expect, test } from "bun:test";
import { type PackageJson, readJsonFile } from "./helpers";

describe("Package.json Configuration", () => {
	let pkg: PackageJson;

	beforeAll(() => {
		pkg = readJsonFile<PackageJson>("package.json");
	});

	test("has scoped npm package name", () => {
		expect(pkg.name).toBe("@fisherk2-dev/codice");
	});

	test("has correct version", () => {
		// Match whatever version is in package.json (no hardcoding)
		expect(pkg.version).toMatch(/^\d+\.\d+\.\d+$/);
	});

	test("has type module", () => {
		expect(pkg.type).toBe("module");
	});

	test("has lint script using bunx @biomejs/biome", () => {
		expect(pkg.scripts.lint).toContain("bunx @biomejs/biome");
		expect(pkg.scripts.lint).toContain("check");
	});

	test("has format script", () => {
		expect(pkg.scripts.format).toContain("bunx @biomejs/biome");
	});

	test("has check script", () => {
		expect(pkg.scripts.check).toContain("bunx @biomejs/biome");
	});

	test("has dependency on @clack/prompts", () => {
		expect(pkg.dependencies["@clack/prompts"]).toBeDefined();
	});

	test("has dependency on semver", () => {
		expect(pkg.dependencies.semver).toBeDefined();
	});

	test("has dev dependency on @biomejs/biome", () => {
		expect(pkg.devDependencies["@biomejs/biome"]).toBeDefined();
	});

	test("has bin entry for codice pointing to bin.js", () => {
		expect(pkg.bin).toBeDefined();
		expect(pkg.bin?.codice).toBe("./src/cli/bin.js");
	});

	test("has files array including src, template, package.json, and tsconfig.json", () => {
		expect(pkg.files).toBeDefined();
		expect(pkg.files).toContain("src/");
		expect(pkg.files).toContain("template/");
		expect(pkg.files).toContain("package.json");
		expect(pkg.files).toContain("tsconfig.json");
	});

	test("has publishConfig with public access", () => {
		expect(pkg.publishConfig).toBeDefined();
		expect(pkg.publishConfig?.access).toBe("public");
	});

	test("is not marked as private", () => {
		expect(pkg.private).toBeUndefined();
	});
});
