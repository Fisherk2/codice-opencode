/**
 * Biome.json Configuration Tests
 *
 * Note: noExplicitAny is OFF in biome because TypeScript strict mode
 * enforces this at compile time via @typescript-eslint/no-explicit-any.
 */

import { beforeAll, describe, expect, test } from "bun:test";
import { type BiomeJson, readJsonFile } from "./helpers";

describe("Biome.json Configuration", () => {
	let biomeConfig: BiomeJson;

	beforeAll(() => {
		biomeConfig = readJsonFile<BiomeJson>("biome.json");
	});

	test("has VCS enabled with git client kind", () => {
		expect(biomeConfig.vcs.enabled).toBe(true);
		expect(biomeConfig.vcs.clientKind).toBe("git");
	});

	test("has formatter enabled", () => {
		expect(biomeConfig.formatter.enabled).toBe(true);
	});

	test("has correct indent style (tab)", () => {
		expect(biomeConfig.formatter.indentStyle).toBe("tab");
	});

	test("has correct line width (100)", () => {
		expect(biomeConfig.formatter.lineWidth).toBe(100);
	});

	test("has correct quote style (double)", () => {
		expect(biomeConfig.javascript.formatter.quoteStyle).toBe("double");
	});

	test("has recommended preset in rules", () => {
		expect(biomeConfig.linter.rules.preset).toBe("recommended");
	});

	test("has strict style rules", () => {
		expect(biomeConfig.linter.rules.style.useConst).toBe("error");
	});

	test("has strict complexity rules", () => {
		expect(biomeConfig.linter.rules.complexity.noUselessLoneBlockStatements).toBe("error");
	});

	test("has strict correctness rules", () => {
		expect(biomeConfig.linter.rules.correctness.noUnusedVariables).toBe("error");
	});

	test("has import sorting enabled via assist", () => {
		expect(biomeConfig.assist.enabled).toBe(true);
		expect(biomeConfig.assist.actions.source.organizeImports).toBe("on");
	});
});
