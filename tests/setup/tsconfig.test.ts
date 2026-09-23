/**
 * Tsconfig.json Configuration Tests
 */

import { beforeAll, describe, expect, test } from "bun:test";
import { readTextFile } from "./helpers";

describe("Tsconfig.json Configuration", () => {
	let tsconfigRaw: string;

	beforeAll(() => {
		tsconfigRaw = readTextFile("tsconfig.json");
	});

	test("has strict mode enabled", () => {
		expect(tsconfigRaw).toContain('"strict": true');
	});

	test("has target set to ESNext", () => {
		expect(tsconfigRaw).toContain('"target": "ESNext"');
	});

	test("includes src directory", () => {
		expect(tsconfigRaw).toContain('"src/**/*.ts"');
	});

	test("includes tests directory", () => {
		expect(tsconfigRaw).toContain('"tests/**/*.ts"');
	});

	test("excludes skills directory", () => {
		expect(tsconfigRaw).toContain('"skills"');
	});

	test("excludes template directory", () => {
		expect(tsconfigRaw).toContain('"template"');
	});
});
