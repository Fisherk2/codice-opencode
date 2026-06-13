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

	test("has correct name", () => {
		expect(pkg.name).toBe("codice");
	});

	test("has correct version", () => {
		expect(pkg.version).toBe("1.0.0");
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
});
