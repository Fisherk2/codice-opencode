/**
 * Unit tests for FileRuleManifest and FileRule helpers.
 *
 * Tests that the static manifest contains the correct 27+ paths,
 * categorized properly, without duplicates, and that lookup helpers
 * (createFileRule, getRulesByCategory, etc.) work correctly.
 */

import { describe, expect, test } from "bun:test";
import {
	FILE_RULE_MANIFEST,
	createFileRule,
	getRulesByCategory,
	getMandatoryRules,
	getStandardRules,
	getOptionalRules,
} from "../../../src/domain/entities/FileRuleManifest";

// ---- Manifest completeness ----

describe("FILE_RULE_MANIFEST completeness", () => {
	test("manifest is a non-empty array", () => {
		expect(FILE_RULE_MANIFEST.length).toBeGreaterThanOrEqual(27);
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

		expect(mandatory.length + standard.length + optional.length).toBe(
			FILE_RULE_MANIFEST.length,
		);
	});

	test("mandatory rules include core config files", () => {
		const mandatory = getMandatoryRules();
		const paths = mandatory.map((r) => r.path);
		expect(paths).toContain("opencode.json");
		expect(paths).toContain("skills-lock.json");
		expect(paths).toContain("agents");
		expect(paths).toContain("commands");
		expect(paths).toContain(".opencode");
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
});

// ---- createFileRule helper ----

describe("createFileRule helper", () => {
	test("returns FileRule for known mandatory path", () => {
		const rule = createFileRule("opencode.json");
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
		const rule = createFileRule("./opencode.json");
		expect(rule).not.toBeNull();
		expect(rule!.path).toBe("opencode.json");
	});

	test("path with trailing slash is handled", () => {
		const rule = createFileRule("agents/");
		expect(rule).not.toBeNull();
		expect(rule!.path).toBe("agents");
	});
});
