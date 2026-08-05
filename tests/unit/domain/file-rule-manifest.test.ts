/**
 * Unit tests for FileRuleManifest and FileRule helpers.
 *
 * Tests that the static manifest contains the correct 27+ paths,
 * categorized properly, without duplicates, and that lookup helpers
 * (createFileRule, getRulesByCategory, etc.) work correctly.
 */

import { describe, expect, test } from "bun:test";
import {
	createFileRule,
	FILE_RULE_MANIFEST,
	getMandatoryRules,
	getOptionalRules,
	getRulesByCategory,
	getStandardRules,
	isRuleSelected,
} from "../../../src/domain/entities/FileRuleManifest";

// ---- Manifest completeness ----

describe("FILE_RULE_MANIFEST completeness", () => {
	test("manifest is a non-empty array", () => {
		// FEV-17 collapsed mandatory from 7 to 4 source groupings (29 → 26).
		expect(FILE_RULE_MANIFEST.length).toBeGreaterThanOrEqual(26);
	});

	test("no duplicate paths in manifest", () => {
		const paths = FILE_RULE_MANIFEST.map((r) => r.path);
		const unique = new Set(paths);
		expect(unique.size).toBe(paths.length);
	});

	test("every rule has a valid category", () => {
		const validCategories = ["mandatory", "standard", "optional"];
		for (const rule of FILE_RULE_MANIFEST) {
			expect(validCategories).toContain(rule.category);
		}
	});

	test("every rule has a non-empty description", () => {
		for (const rule of FILE_RULE_MANIFEST) {
			expect(rule.description.length).toBeGreaterThan(0);
		}
	});
});

// ---- Category distribution ----

describe("Category distribution", () => {
	test("getMandatoryRules returns only mandatory rules", () => {
		const rules = getMandatoryRules();
		expect(rules.length).toBeGreaterThan(0);
		for (const r of rules) {
			expect(r.category).toBe("mandatory");
		}
	});

	test("getStandardRules returns only standard rules", () => {
		const rules = getStandardRules();
		expect(rules.length).toBeGreaterThan(0);
		for (const r of rules) {
			expect(r.category).toBe("standard");
		}
	});

	test("getOptionalRules returns only optional rules", () => {
		const rules = getOptionalRules();
		expect(rules.length).toBeGreaterThan(0);
		for (const r of rules) {
			expect(r.category).toBe("optional");
		}
	});

	test("getRulesByCategory filters correctly", () => {
		const mandatory = getRulesByCategory("mandatory");
		const standard = getRulesByCategory("standard");
		const optional = getRulesByCategory("optional");

		expect(mandatory.length + standard.length + optional.length).toBe(FILE_RULE_MANIFEST.length);
	});

	test("mandatory rules include core and all pack source groupings (FEV-18)", () => {
		const mandatory = getMandatoryRules();
		const paths = mandatory.map((r) => r.path);
		// v2.0 collapsed 7 standalone mandatory entries into source groupings.
		// core/ spreads to destination root; packs/* merge into destination agents/.
		// FEV-18 added 8 selectable packs (sin-clasificar removed).
		expect(paths).toContain("core");
		expect(paths).toContain("packs/main");
		expect(paths).toContain("packs/writers");
		expect(paths).toContain("packs/software-development");
		expect(paths).toContain("packs/business");
		expect(paths).toContain("packs/hardware-emerging");
		expect(paths).toContain("packs/science-research");
		expect(paths).toContain("packs/operations-support");
		expect(paths).toContain("packs/finance");
		expect(paths).toContain("packs/creative");
		expect(paths).toContain("packs/government-legal");
		expect(paths).not.toContain("packs/sin-clasificar");
	});

	test("mandatory core rule has destPath='' (spreads to destination root)", () => {
		const coreRule = FILE_RULE_MANIFEST.find((r) => r.path === "core");
		expect(coreRule).toBeDefined();
		expect(coreRule!.destPath).toBe("");
	});

	test("mandatory pack rules have destPath='agents' (merge into flat agents/)", () => {
		const packPaths = [
			"packs/main",
			"packs/writers",
			"packs/software-development",
			"packs/business",
			"packs/hardware-emerging",
			"packs/science-research",
			"packs/operations-support",
			"packs/finance",
			"packs/creative",
			"packs/government-legal",
		];
		for (const packPath of packPaths) {
			const packRule = FILE_RULE_MANIFEST.find((r) => r.path === packPath);
			expect(packRule).toBeDefined();
			expect(packRule!.destPath).toBe("agents");
		}
	});

	test("standard rules have no destPath (use path as-is)", () => {
		const standard = getStandardRules();
		for (const r of standard) {
			expect(r.destPath).toBeUndefined();
		}
	});

	test("optional rules have no destPath (use path as-is)", () => {
		const optional = getOptionalRules();
		for (const r of optional) {
			expect(r.destPath).toBeUndefined();
		}
	});

	test("standard rules include documentation files", () => {
		const standard = getStandardRules();
		const paths = standard.map((r) => r.path);
		expect(paths).toContain("AGENTS.md");
		expect(paths).toContain("README.md");
		expect(paths).toContain("SPEC.md");
		expect(paths).toContain("docs");
	});

	test("optional rules include Justfile and scripts", () => {
		const optional = getOptionalRules();
		const paths = optional.map((r) => r.path);
		expect(paths).toContain("Justfile");
		expect(paths).toContain("scripts");
	});

	test("standard rules include CODE_OF_CONDUCT.md", () => {
		const standard = getStandardRules();
		const paths = standard.map((r) => r.path);
		expect(paths).toContain("CODE_OF_CONDUCT.md");
	});

	test("CODE_OF_CONDUCT.md rule has correct category and attributes", () => {
		const rule = createFileRule("CODE_OF_CONDUCT.md");
		expect(rule).not.toBeNull();
		expect(rule!.category).toBe("standard");
		expect(rule!.isDirectory).toBe(false);
	});
});

// ---- createFileRule helper ----

describe("createFileRule helper", () => {
	test("returns FileRule for known mandatory path", () => {
		const rule = createFileRule("core");
		expect(rule).not.toBeNull();
		expect(rule!.category).toBe("mandatory");
	});

	test("returns FileRule for known standard path", () => {
		const rule = createFileRule("README.md");
		expect(rule).not.toBeNull();
		expect(rule!.category).toBe("standard");
	});

	test("returns FileRule for known optional path", () => {
		const rule = createFileRule("Justfile");
		expect(rule).not.toBeNull();
		expect(rule!.category).toBe("optional");
	});

	test("returns null for unknown path", () => {
		const rule = createFileRule("nonexistent-file.xyz");
		expect(rule).toBeNull();
	});

	test("returns null for empty string", () => {
		expect(createFileRule("")).toBeNull();
	});
});

// ---- Edge cases ----

describe("Edge cases", () => {
	test("path with leading ./ is normalized", () => {
		const rule = createFileRule("./core");
		expect(rule).not.toBeNull();
		expect(rule!.path).toBe("core");
	});

	test("path with trailing slash is handled", () => {
		const rule = createFileRule("core/");
		expect(rule).not.toBeNull();
		expect(rule!.path).toBe("core");
	});
});

// ---- isRuleSelected predicate ----

describe("isRuleSelected", () => {
	const mandatory = {
		path: "opencode.json",
		category: "mandatory" as const,
		isDirectory: false,
		description: "m",
	};
	const standard = {
		path: "README.md",
		category: "standard" as const,
		isDirectory: false,
		description: "s",
	};
	const optionalA = {
		path: "Justfile",
		category: "optional" as const,
		isDirectory: false,
		description: "o1",
	};
	const optionalB = {
		path: "scripts",
		category: "optional" as const,
		isDirectory: true,
		description: "o2",
	};

	test("keeps mandatory rules regardless of selection", () => {
		expect(isRuleSelected(mandatory, [])).toBe(true);
		expect(isRuleSelected(mandatory, ["Justfile"])).toBe(true);
	});

	test("keeps standard rules regardless of selection", () => {
		expect(isRuleSelected(standard, [])).toBe(true);
		expect(isRuleSelected(standard, ["Justfile"])).toBe(true);
	});

	test("keeps an optional rule when it is selected", () => {
		expect(isRuleSelected(optionalA, ["Justfile"])).toBe(true);
		expect(isRuleSelected(optionalB, ["Justfile", "scripts"])).toBe(true);
	});

	test("drops an optional rule when it is not selected", () => {
		expect(isRuleSelected(optionalA, [])).toBe(false);
		expect(isRuleSelected(optionalA, ["scripts"])).toBe(false);
		expect(isRuleSelected(optionalB, ["Justfile"])).toBe(false);
	});
});
