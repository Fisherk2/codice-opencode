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

	test("has build recipe", () => {
		expect(justfile).toMatch(/^build:/m);
	});

	test("lint recipe uses bunx @biomejs/biome", () => {
		// Find the lint recipe block using simple section-based parsing
		const lintMatch = justfile.match(/^lint:\n([\s\S]*?)(?=^\w)/m);
		expect(lintMatch).not.toBeNull();
		expect(lintMatch![1]).toContain("bunx @biomejs/biome");
	});

	test("format recipe uses bunx @biomejs/biome", () => {
		// Find the format recipe block using simple section-based parsing
		const formatMatch = justfile.match(/^format:\n([\s\S]*?)(?=^\w)/m);
		expect(formatMatch).not.toBeNull();
		expect(formatMatch![1]).toContain("bunx @biomejs/biome");
	});
});
