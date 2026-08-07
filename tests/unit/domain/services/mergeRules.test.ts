/**
 * Unit tests for mergeRules — extracted helpers from FileMergeEngine.
 *
 * Tests skipReason() and computeExclusions() as pure functions,
 * covering all branches and edge cases that the engine-level tests
 * exercise only indirectly.
 *
 * FEV-17: These functions were extracted to keep FileMergeEngine under
 * the 200-line convention. Dedicated tests ensure the extraction did
 * not introduce regressions and document edge-case behavior.
 */

import { describe, expect, test } from "bun:test";
import type { FileRule } from "../../../../src/domain/entities/FileRule";
import { computeExclusions, skipReason } from "../../../../src/domain/services/mergeRules";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function rule(path: string, category: FileRule["category"], isDirectory = false): FileRule {
	return { path, category, isDirectory, description: `Rule for ${path}` };
}

// ===========================================================================
// skipReason
// ===========================================================================

describe("skipReason", () => {
	// ---- Standard category ----

	describe("standard category", () => {
		test('returns "No new files in directory" for standard directory in update mode', () => {
			const r = rule("docs", "standard", true);
			expect(skipReason(r, new Set(), true)).toBe("No new files in directory");
		});

		test('returns "Destination already exists" for standard directory in non-update mode', () => {
			const r = rule("docs", "standard", true);
			expect(skipReason(r, new Set(), false)).toBe("Destination already exists");
		});

		test('returns "Destination already exists" for standard file (not directory)', () => {
			const r = rule("README.md", "standard", false);
			expect(skipReason(r, new Set(), false)).toBe("Destination already exists");
		});

		test('returns "Destination already exists" for standard file in update mode', () => {
			// Standard files (not directories) don't get the update-mode branch
			const r = rule("README.md", "standard", false);
			expect(skipReason(r, new Set(), true)).toBe("Destination already exists");
		});

		test("does not depend on selected set for standard category", () => {
			const r = rule("docs", "standard", true);
			const selected = new Set(["docs"]);
			expect(skipReason(r, selected, false)).toBe("Destination already exists");
		});
	});

	// ---- Optional category ----

	describe("optional category", () => {
		test('returns "Not selected by user" when optional is not in selected set', () => {
			const r = rule("Justfile", "optional", false);
			expect(skipReason(r, new Set(), false)).toBe("Not selected by user");
		});

		test('returns "Not selected by user" when selected set is empty', () => {
			const r = rule("Justfile", "optional", false);
			expect(skipReason(r, new Set([]), false)).toBe("Not selected by user");
		});

		test('returns "Destination already exists" when optional is selected', () => {
			const r = rule("Justfile", "optional", false);
			expect(skipReason(r, new Set(["Justfile"]), false)).toBe("Destination already exists");
		});

		test('returns "Destination already exists" for optional directory when selected', () => {
			const r = rule("scripts", "optional", true);
			expect(skipReason(r, new Set(["scripts"]), false)).toBe("Destination already exists");
		});

		test("isUpdateMode does not change optional behavior", () => {
			const r = rule("Justfile", "optional", false);
			// Not selected — same result regardless of update mode
			expect(skipReason(r, new Set(), true)).toBe("Not selected by user");
			// Selected — same result regardless of update mode
			expect(skipReason(r, new Set(["Justfile"]), true)).toBe("Destination already exists");
		});
	});

	// ---- Mandatory category (dead code path) ----

	describe("mandatory category", () => {
		test('returns "Skipped by classification rule" for mandatory', () => {
			// Mandatory rules are always staged, so this branch is never hit
			// in practice. Tested for completeness of the exhaustive switch.
			const r = rule("opencode.json", "mandatory", false);
			expect(skipReason(r, new Set(), false)).toBe("Skipped by classification rule");
		});

		test("mandatory is not affected by selected set", () => {
			const r = rule("opencode.json", "mandatory", false);
			expect(skipReason(r, new Set(["opencode.json"]), false)).toBe(
				"Skipped by classification rule",
			);
		});
	});

	// ---- Default parameter ----

	describe("default isUpdateMode parameter", () => {
		test("isUpdateMode defaults to false", () => {
			const r = rule("docs", "standard", true);
			// When isUpdateMode is omitted, should behave as false
			expect(skipReason(r, new Set())).toBe("Destination already exists");
		});
	});
});

// ===========================================================================
// computeExclusions
// ===========================================================================

describe("computeExclusions", () => {
	// ---- Non-standard categories ----

	describe("non-standard categories return undefined", () => {
		test("mandatory directory returns undefined", () => {
			const r = rule("agents", "mandatory", true);
			expect(computeExclusions(r, ["agents/expert"])).toBeUndefined();
		});

		test("mandatory file returns undefined", () => {
			const r = rule("opencode.json", "mandatory", false);
			expect(computeExclusions(r, ["opencode.json"])).toBeUndefined();
		});

		test("standard file (not directory) returns undefined", () => {
			const r = rule("README.md", "standard", false);
			expect(computeExclusions(r, ["README.md"])).toBeUndefined();
		});

		test("optional directory returns undefined", () => {
			const r = rule("scripts", "optional", true);
			expect(computeExclusions(r, ["scripts/build.sh"])).toBeUndefined();
		});
	});

	// ---- Standard directory with no overlap ----

	describe("standard directory with no overlapping optional paths", () => {
		test("returns undefined when no optional paths share the prefix", () => {
			const r = rule("docs", "standard", true);
			expect(computeExclusions(r, ["Justfile", "Makefile"])).toBeUndefined();
		});

		test("returns undefined when optionalPaths is empty", () => {
			const r = rule("docs", "standard", true);
			expect(computeExclusions(r, [])).toBeUndefined();
		});

		test("returns undefined when optional paths have similar but not matching prefix", () => {
			const r = rule("doc", "standard", true);
			// "docs/guide" does NOT start with "doc/" (note: no trailing slash)
			expect(computeExclusions(r, ["docs/guide"])).toBeUndefined();
		});
	});

	// ---- Standard directory with overlap ----

	describe("standard directory with overlapping optional paths", () => {
		test("returns single-element set for one overlapping optional", () => {
			const r = rule("docs", "standard", true);
			const result = computeExclusions(r, ["docs/guides"]);
			expect(result).toBeDefined();
			expect(result?.size).toBe(1);
			expect(result?.has("guides")).toBe(true);
		});

		test("returns set with all overlapping first segments", () => {
			const r = rule("specs", "standard", true);
			const result = computeExclusions(r, ["specs/design", "specs/adr", "specs/templates"]);
			expect(result).toBeDefined();
			expect(result?.size).toBe(3);
			expect(result?.has("design")).toBe(true);
			expect(result?.has("adr")).toBe(true);
			expect(result?.has("templates")).toBe(true);
		});

		test("extracts only the first segment from nested optional paths", () => {
			const r = rule("docs", "standard", true);
			// "docs/guides/sub/file.md" → first segment is "guides"
			const result = computeExclusions(r, ["docs/guides/sub/file.md"]);
			expect(result).toBeDefined();
			expect(result?.size).toBe(1);
			expect(result?.has("guides")).toBe(true);
		});

		test("deduplicates overlapping first segments", () => {
			const r = rule("docs", "standard", true);
			// Two optional paths with the same first segment
			const result = computeExclusions(r, ["docs/guides/intro.md", "docs/guides/advanced.md"]);
			expect(result).toBeDefined();
			expect(result?.size).toBe(1);
			expect(result?.has("guides")).toBe(true);
		});

		test("ignores non-overlapping optional paths", () => {
			const r = rule("docs", "standard", true);
			const result = computeExclusions(r, [
				"Justfile", // no overlap
				"docs/guides", // overlap
				"Makefile", // no overlap
			]);
			expect(result).toBeDefined();
			expect(result?.size).toBe(1);
			expect(result?.has("guides")).toBe(true);
		});
	});

	// ---- Edge cases ----

	describe("edge cases", () => {
		test("optional path exactly matching dir prefix (e.g., 'docs/') is filtered out", () => {
			// "docs/" sliced by dirPrefix "docs/" → rest = "" → split("/")[0] = ""
			// Filter removes empty strings, so this optional is ignored
			const r = rule("docs", "standard", true);
			const result = computeExclusions(r, ["docs/"]);
			expect(result).toBeDefined();
			expect(result?.size).toBe(0);
		});

		test("mixed overlapping and non-overlapping optional sub-paths", () => {
			const r = rule("docs", "standard", true);
			const result = computeExclusions(r, [
				"docs/guides",
				"docs/api/reference",
				"scripts/build.sh", // no overlap
			]);
			expect(result).toBeDefined();
			expect(result?.size).toBe(2);
			expect(result?.has("guides")).toBe(true);
			expect(result?.has("api")).toBe(true);
		});
	});
});
