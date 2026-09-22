/**
 * Justfile Configuration Tests
 */

import { beforeAll, describe, expect, test } from "bun:test";
import { readTextFile } from "./helpers";

describe("Justfile Configuration", () => {
	let justfile: string;

	beforeAll(() => {
		justfile = readTextFile("Justfile");
	});

	test("has setup recipe", () => {
		expect(justfile).toMatch(/^setup:/m);
	});

	test("has dev recipe", () => {
		expect(justfile).toMatch(/^dev:/m);
	});

	test("has lint recipe", () => {
		expect(justfile).toMatch(/^lint:/m);
	});

	test("has format recipe", () => {
		expect(justfile).toMatch(/^format:/m);
	});

	test("has check recipe", () => {
		expect(justfile).toMatch(/^check:/m);
	});

	test("has test recipe", () => {
		expect(justfile).toMatch(/^test:/m);
	});

	test("test-setup recipe runs only the setup test directory", () => {
		const match = justfile.match(/^test-setup:\r?\n([\s\S]*?)(?=^\w)/m);
		expect(match).not.toBeNull();
		expect(match![1]).toContain("bun test tests/setup/");
	});

	test("coverage-check accepts args and delegates to the script with them", () => {
		// Signature is variadic so `just coverage-check 90` can override the
		// global threshold without a hardcoded default in the Justfile.
		expect(justfile).toMatch(/^coverage-check \*args:/m);
		const match = justfile.match(/^coverage-check \*args:\r?\n([\s\S]*?)(?=^\w)/m);
		expect(match).not.toBeNull();
		expect(match![1]).toContain("bash scripts/coverage-check.sh {{args}}");
	});

	test("build recipe is removed (binary compilation removed in v1.2.0)", () => {
		expect(justfile).not.toMatch(/^build:/m);
		expect(justfile).not.toMatch(/^build-all:/m);
		expect(justfile).not.toMatch(/bun build --compile/);
	});

	test("lint recipe uses bunx @biomejs/biome", () => {
		// Find the lint recipe block using simple section-based parsing
		const lintMatch = justfile.match(/^lint:\r?\n([\s\S]*?)(?=^\w)/m);
		expect(lintMatch).not.toBeNull();
		expect(lintMatch![1]).toContain("bunx @biomejs/biome");
	});

	test("format recipe uses bunx @biomejs/biome", () => {
		// Find the format recipe block using simple section-based parsing
		const formatMatch = justfile.match(/^format:\r?\n([\s\S]*?)(?=^\w)/m);
		expect(formatMatch).not.toBeNull();
		expect(formatMatch![1]).toContain("bunx @biomejs/biome");
	});
});
