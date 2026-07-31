/**
 * Unit tests for computeStagePlan.
 *
 * Tests the domain-level staging plan builder used by FileMergeEngine
 * to pre-compute which rules should be staged before execution.
 *
 * Coverage:
 *   - Non-update mode: mandatory, standard, optional rules
 *   - Update mode: tree-level diff for standard directories
 *   - Edge cases: noTemplateCopy, empty rules, mixed categories
 */

import { describe, expect, test } from "bun:test";
import type { FileRule } from "../../../../src/domain/entities/FileRule";
import type { IFileSystem } from "../../../../src/domain/ports/IFileSystem";
import { computeStagePlan } from "../../../../src/domain/services/stagePlanner";

// ---- Mock IFileSystem factory ----

interface FsConfig {
	/** Map of path → destinationExists result. Default: false */
	exists?: Map<string, boolean>;
	/** Map of path → walkTemplateDirectory result. Default: [] */
	templateFiles?: Map<string, string[]>;
	/** Map of path → walkDestinationDirectory result. Default: [] */
	destFiles?: Map<string, string[]>;
}

function createMockFs(config: FsConfig = {}): IFileSystem {
	const exists = config.exists ?? new Map();
	const templateFiles = config.templateFiles ?? new Map();
	const destFiles = config.destFiles ?? new Map();

	return {
		readTemplateFile: async () => "",
		destinationExists: async (path: string): Promise<boolean> => {
			return exists.get(path) ?? false;
		},
		isWritable: async () => true,
		isEmpty: async () => true,
		writeVersionFile: async () => {},
		readVersionFile: async () => null,
		walkTemplateDirectory: async (path: string): Promise<readonly string[]> => {
			// Real implementation returns sorted arrays; sort to match the contract.
			return [...(templateFiles.get(path) ?? [])].sort();
		},
		walkDestinationDirectory: async (path: string): Promise<readonly string[]> => {
			return [...(destFiles.get(path) ?? [])].sort();
		},
	};
}

// ---- Test helpers ----

function rule(path: string, category: FileRule["category"], isDirectory = false): FileRule {
	return { path, category, isDirectory, description: `Rule for ${path}` };
}

function ruleWithNoTemplateCopy(
	path: string,
	category: FileRule["category"],
	isDirectory = false,
): FileRule {
	return {
		path,
		category,
		isDirectory,
		description: `Virtual rule for ${path}`,
		noTemplateCopy: true,
	};
}

// ---- Non-update mode: mandatory rules ----

describe("computeStagePlan — Non-update mode: mandatory rules", () => {
	test("always stages mandatory files even when destination exists", async () => {
		const fs = createMockFs({
			exists: new Map([["opencode.json", true]]),
		});

		const rules = [rule("opencode.json", "mandatory")];
		const result = await computeStagePlan(fs, rules, new Set(), false);

		expect(result.stageDecisions.get("opencode.json")).toBe(true);
		expect(result.total).toBe(1);
		expect(result.expandedDirs.size).toBe(0);
	});

	test("stages mandatory files when destination does NOT exist", async () => {
		const fs = createMockFs({
			exists: new Map([["opencode.json", false]]),
		});

		const rules = [rule("opencode.json", "mandatory")];
		const result = await computeStagePlan(fs, rules, new Set(), false);

		expect(result.stageDecisions.get("opencode.json")).toBe(true);
		expect(result.total).toBe(1);
	});

	test("stages multiple mandatory files", async () => {
		const fs = createMockFs();

		const rules = [rule("opencode.json", "mandatory"), rule("agents", "mandatory", true)];
		const result = await computeStagePlan(fs, rules, new Set(), false);

		expect(result.stageDecisions.get("opencode.json")).toBe(true);
		expect(result.stageDecisions.get("agents")).toBe(true);
		expect(result.stageDecisions.size).toBe(2);
		expect(result.total).toBe(2);
	});
});

// ---- Non-update mode: standard rules ----

describe("computeStagePlan — Non-update mode: standard rules", () => {
	test("stages standard file when destination does NOT exist", async () => {
		const fs = createMockFs({
			exists: new Map([["README.md", false]]),
		});

		const rules = [rule("README.md", "standard")];
		const result = await computeStagePlan(fs, rules, new Set(), false);

		expect(result.stageDecisions.get("README.md")).toBe(true);
		expect(result.total).toBe(1);
	});

	test("skips standard file when destination exists", async () => {
		const fs = createMockFs({
			exists: new Map([["README.md", true]]),
		});

		const rules = [rule("README.md", "standard")];
		const result = await computeStagePlan(fs, rules, new Set(), false);

		expect(result.stageDecisions.get("README.md")).toBe(false);
		expect(result.total).toBe(0);
	});

	test("skips standard directory when it exists in destination (non-update)", async () => {
		// In non-update mode, standard directories use shouldStage just like files,
		// NOT tree-level diff. isDirectory only triggers diff in update mode.
		const fs = createMockFs({
			exists: new Map([["docs", true]]),
		});

		const rules = [rule("docs", "standard", true)];
		const result = await computeStagePlan(fs, rules, new Set(), false);

		// Standard directory exists → should NOT be staged
		expect(result.stageDecisions.get("docs")).toBe(false);
		expect(result.total).toBe(0);
		// No expanded dirs because it's not update mode
		expect(result.expandedDirs.size).toBe(0);
	});
});

// ---- Non-update mode: optional rules ----

describe("computeStagePlan — Non-update mode: optional rules", () => {
	test("stages optional file when selected AND destination missing", async () => {
		const fs = createMockFs({
			exists: new Map([["Justfile", false]]),
		});

		const rules = [rule("Justfile", "optional")];
		const selected = new Set<string>(["Justfile"]);
		const result = await computeStagePlan(fs, rules, selected, false);

		expect(result.stageDecisions.get("Justfile")).toBe(true);
		expect(result.total).toBe(1);
	});

	test("skips optional file when NOT selected (even if missing)", async () => {
		const fs = createMockFs({
			exists: new Map([["Justfile", false]]),
		});

		const rules = [rule("Justfile", "optional")];
		// User did NOT select Justfile
		const result = await computeStagePlan(fs, rules, new Set(), false);

		expect(result.stageDecisions.get("Justfile")).toBe(false);
		expect(result.total).toBe(0);
	});

	test("skips optional file when selected but destination exists", async () => {
		const fs = createMockFs({
			exists: new Map([["Justfile", true]]),
		});

		const rules = [rule("Justfile", "optional")];
		const selected = new Set<string>(["Justfile"]);
		const result = await computeStagePlan(fs, rules, selected, false);

		expect(result.stageDecisions.get("Justfile")).toBe(false);
		expect(result.total).toBe(0);
	});

	test("handles optional file selected but not in exists map (defaults to false)", async () => {
		// No entry in exists map → destinationExists returns false
		const fs = createMockFs();

		const rules = [rule("CONTRIBUTING.md", "optional")];
		const selected = new Set<string>(["CONTRIBUTING.md"]);
		const result = await computeStagePlan(fs, rules, selected, false);

		expect(result.stageDecisions.get("CONTRIBUTING.md")).toBe(true);
		expect(result.total).toBe(1);
	});
});

// ---- Non-update mode: mixed categories ----

describe("computeStagePlan — Non-update mode: mixed categories", () => {
	test("computes correct total across mandatory + standard + optional", async () => {
		const fs = createMockFs({
			exists: new Map([
				["opencode.json", false], // mandatory → always staged (1)
				["README.md", false], // standard, missing → staged (1)
				["CHANGELOG.md", true], // standard, exists → skipped (0)
				["Justfile", false], // optional, selected in this test
			]),
		});

		const rules = [
			rule("opencode.json", "mandatory"),
			rule("README.md", "standard"),
			rule("CHANGELOG.md", "standard"),
			rule("Justfile", "optional"),
		];
		const selected = new Set<string>(["Justfile"]);
		const result = await computeStagePlan(fs, rules, selected, false);

		expect(result.stageDecisions.get("opencode.json")).toBe(true);
		expect(result.stageDecisions.get("README.md")).toBe(true);
		expect(result.stageDecisions.get("CHANGELOG.md")).toBe(false);
		expect(result.stageDecisions.get("Justfile")).toBe(true);
		// 3 staged: mandatory + standard(missing) + optional(selected,missing)
		expect(result.total).toBe(3);
	});

	test("all mandatory files staged regardless of mixed categories", async () => {
		const fs = createMockFs({
			exists: new Map([
				["a.json", true],
				["b.json", true],
				["c.json", true],
			]),
		});

		const rules = [
			rule("a.json", "mandatory"),
			rule("b.json", "standard"),
			rule("c.json", "optional"),
		];
		const result = await computeStagePlan(fs, rules, new Set(), false);

		// Only mandatory is staged; standard/optional exist → skipped
		expect(result.stageDecisions.get("a.json")).toBe(true);
		expect(result.stageDecisions.get("b.json")).toBe(false);
		expect(result.stageDecisions.get("c.json")).toBe(false);
		expect(result.total).toBe(1);
	});
});

// ---- noTemplateCopy rules ----

describe("computeStagePlan — noTemplateCopy rules", () => {
	test("completely skips noTemplateCopy rules (not in stageDecisions, not in total)", async () => {
		const fs = createMockFs();

		const rules = [ruleWithNoTemplateCopy(".devin", "optional", true)];
		const selected = new Set<string>([".devin"]);
		const result = await computeStagePlan(fs, rules, selected, false);

		expect(result.stageDecisions.has(".devin")).toBe(false);
		expect(result.total).toBe(0);
		expect(result.expandedDirs.size).toBe(0);
	});

	test("noTemplateCopy rules skipped but regular rules processed normally", async () => {
		const fs = createMockFs({
			exists: new Map([
				["opencode.json", false],
				["Justfile", false],
			]),
		});

		const rules: FileRule[] = [
			rule("opencode.json", "mandatory"),
			ruleWithNoTemplateCopy(".devin", "optional", true),
			rule("Justfile", "optional"),
		];
		const selected = new Set<string>([".devin", "Justfile"]);
		const result = await computeStagePlan(fs, rules, selected, false);

		// opencode.json: mandatory → staged
		expect(result.stageDecisions.get("opencode.json")).toBe(true);
		// Justfile: optional, selected, missing → staged
		expect(result.stageDecisions.get("Justfile")).toBe(true);
		// .devin: noTemplateCopy → not in stageDecisions
		expect(result.stageDecisions.has(".devin")).toBe(false);
		expect(result.stageDecisions.size).toBe(2);
		expect(result.total).toBe(2);
	});

	test("noTemplateCopy mandatory rule is still skipped (flag takes precedence)", async () => {
		// Even mandatory rules with noTemplateCopy should be skipped
		const fs = createMockFs();

		const rules = [ruleWithNoTemplateCopy("virtual-mandatory", "mandatory")];
		const result = await computeStagePlan(fs, rules, new Set(), false);

		expect(result.stageDecisions.has("virtual-mandatory")).toBe(false);
		expect(result.total).toBe(0);
	});
});

// ---- Update mode: standard directory tree diff ----

describe("computeStagePlan — Update mode: standard directory tree diff", () => {
	test("populates expandedDirs with new files when diffTrees finds missing files", async () => {
		// Template has [a.md, b.md, c.md], destination has [a.md]
		// → new files = [b.md, c.md]
		const fs = createMockFs({
			exists: new Map([["docs", true]]), // destination dir exists
			templateFiles: new Map([["docs", ["a.md", "b.md", "c.md"]]]),
			destFiles: new Map([["docs", ["a.md"]]]),
		});

		const rules = [rule("docs", "standard", true)];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		expect(result.stageDecisions.get("docs")).toBe(true);
		expect(result.expandedDirs.size).toBe(1);
		expect(result.expandedDirs.get("docs")).toEqual(["b.md", "c.md"]);
		expect(result.total).toBe(2); // per-file count
	});

	test("does NOT populate expandedDirs when diffTrees returns empty array", async () => {
		// Template and destination have the same files → no new files
		const fs = createMockFs({
			exists: new Map([["docs", true]]), // destination dir exists
			templateFiles: new Map([["docs", ["a.md", "b.md"]]]),
			destFiles: new Map([["docs", ["a.md", "b.md"]]]),
		});

		const rules = [rule("docs", "standard", true)];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		expect(result.stageDecisions.get("docs")).toBe(false);
		expect(result.expandedDirs.has("docs")).toBe(false);
		expect(result.total).toBe(0);
	});

	test("includes all template files when destination directory does not exist", async () => {
		// destinationExists("docs") returns false → diffTrees returns all template files
		const fs = createMockFs({
			exists: new Map([["docs", false]]), // destination dir does NOT exist
			templateFiles: new Map([["docs", ["a.md", "b.md"]]]),
		});

		const rules = [rule("docs", "standard", true)];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		expect(result.stageDecisions.get("docs")).toBe(true);
		expect(result.expandedDirs.get("docs")).toEqual(["a.md", "b.md"]);
		expect(result.total).toBe(2);
	});

	test("handles single new file in standard directory", async () => {
		const fs = createMockFs({
			exists: new Map([["specs", true]]),
			templateFiles: new Map([["specs", ["design.md", "adr.md"]]]),
			destFiles: new Map([["specs", ["design.md"]]]),
		});

		const rules = [rule("specs", "standard", true)];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		expect(result.stageDecisions.get("specs")).toBe(true);
		expect(result.expandedDirs.get("specs")).toEqual(["adr.md"]);
		expect(result.total).toBe(1);
	});

	test("marks standard directory as not staged when all files already present", async () => {
		const fs = createMockFs({
			exists: new Map([["docs", true]]),
			templateFiles: new Map([["docs", ["a.md"]]]),
			destFiles: new Map([["docs", ["a.md"]]]),
		});

		const rules = [rule("docs", "standard", true)];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		expect(result.stageDecisions.get("docs")).toBe(false);
		expect(result.expandedDirs.has("docs")).toBe(false);
		expect(result.total).toBe(0);
	});
});

// ---- Update mode: non-directory and non-standard rules ----

describe("computeStagePlan — Update mode: non-directory fallthrough", () => {
	test("non-directory standard file in update mode uses shouldStage, not tree diff", async () => {
		const fs = createMockFs({
			exists: new Map([["README.md", false]]), // missing → staged
		});

		// isDirectory=false → shouldStage path, even in update mode
		const rules = [rule("README.md", "standard", false)];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		expect(result.stageDecisions.get("README.md")).toBe(true);
		expect(result.expandedDirs.size).toBe(0);
		expect(result.total).toBe(1);
	});

	test("non-directory standard file skipped when present in update mode", async () => {
		const fs = createMockFs({
			exists: new Map([["README.md", true]]),
		});

		const rules = [rule("README.md", "standard", false)];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		expect(result.stageDecisions.get("README.md")).toBe(false);
		expect(result.expandedDirs.size).toBe(0);
		expect(result.total).toBe(0);
	});

	test("mandatory rule in update mode uses shouldStage (always staged)", async () => {
		const fs = createMockFs({
			exists: new Map([["opencode.json", true]]),
		});

		// Even though it's an update, mandatory is always staged via shouldStage
		const rules = [rule("opencode.json", "mandatory")];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		expect(result.stageDecisions.get("opencode.json")).toBe(true);
		expect(result.expandedDirs.size).toBe(0);
		expect(result.total).toBe(1);
	});

	test("optional rule in update mode still respects selected set", async () => {
		const fs = createMockFs({
			exists: new Map([["Justfile", false]]),
		});

		const rules = [rule("Justfile", "optional")];
		// Not selected in update mode → should be skipped
		const result = await computeStagePlan(fs, rules, new Set(), true);

		expect(result.stageDecisions.get("Justfile")).toBe(false);
		expect(result.total).toBe(0);
	});

	test("mandatory directory in update mode uses shouldStage, not tree diff", async () => {
		// mandatory category + isDirectory=true still uses shouldStage
		// because the update-mode tree-diff path only applies to standard directories
		const fs = createMockFs({
			exists: new Map([["agents", true]]),
		});

		const rules = [rule("agents", "mandatory", true)];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		// mandatory → always true, even exists
		expect(result.stageDecisions.get("agents")).toBe(true);
		// No expandedDirs because it's mandatory, not standard
		expect(result.expandedDirs.size).toBe(0);
		expect(result.total).toBe(1);
	});
});

// ---- Update mode: mixed standard directories and other rules ----

describe("computeStagePlan — Update mode: mixed rule types", () => {
	test("mixes standard directory tree-diff with mandatory and optional rules", async () => {
		const fs = createMockFs({
			exists: new Map([
				["docs", true], // std dir exists in dest
				["opencode.json", false],
				["Justfile", false],
			]),
			templateFiles: new Map([["docs", ["a.md", "b.md", "c.md"]]]),
			destFiles: new Map([["docs", ["a.md"]]]), // b.md, c.md are new
		});

		const rules = [
			rule("docs", "standard", true), // tree diff → 2 new files
			rule("opencode.json", "mandatory"), // always staged → 1
			rule("Justfile", "optional"), // not selected → 0
		];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		expect(result.stageDecisions.get("docs")).toBe(true);
		expect(result.stageDecisions.get("opencode.json")).toBe(true);
		expect(result.stageDecisions.get("Justfile")).toBe(false);
		expect(result.expandedDirs.get("docs")).toEqual(["b.md", "c.md"]);
		// total = 2 (expanded dir files) + 1 (mandatory) + 0 (optional, not selected) = 3
		expect(result.total).toBe(3);
	});

	test("multiple standard directories with mixed diff results", async () => {
		const fs = createMockFs({
			exists: new Map([
				["docs", true],
				["specs", true],
			]),
			templateFiles: new Map([
				["docs", ["a.md", "b.md"]],
				["specs", ["x.md", "y.md", "z.md"]],
			]),
			destFiles: new Map([
				["docs", ["a.md"]], // b.md is new → 1
				["specs", ["x.md", "y.md", "z.md"]], // all present → 0
			]),
		});

		const rules = [rule("docs", "standard", true), rule("specs", "standard", true)];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		expect(result.stageDecisions.get("docs")).toBe(true);
		expect(result.stageDecisions.get("specs")).toBe(false);
		expect(result.expandedDirs.get("docs")).toEqual(["b.md"]);
		expect(result.expandedDirs.has("specs")).toBe(false);
		expect(result.total).toBe(1);
	});

	test("standard directory in update mode with optional file of same path", async () => {
		// Tests that a standard directory diff doesn't interfere with other
		// rules that might share similar paths (they are independent entries)
		const fs = createMockFs({
			exists: new Map([
				["docs", true],
				["docs/guide", false], // optional sub-path
			]),
			templateFiles: new Map([["docs", ["start.md", "guide.md"]]]),
			destFiles: new Map([["docs", ["start.md"]]]), // guide.md new
		});

		const rules = [
			rule("docs", "standard", true), // tree diff in update mode
			rule("docs/guide", "optional"), // optional file
		];
		const selected = new Set<string>(["docs/guide"]);
		const result = await computeStagePlan(fs, rules, selected, true);

		// docs: standard dir → tree diff → guide.md is new, stageDecision = true
		expect(result.stageDecisions.get("docs")).toBe(true);
		expect(result.expandedDirs.get("docs")).toEqual(["guide.md"]);
		// docs/guide: optional, selected, not in dest → staged
		expect(result.stageDecisions.get("docs/guide")).toBe(true);
		expect(result.total).toBe(2); // 1 (expanded file) + 1 (optional)
	});
});

// ---- Edge cases ----

describe("computeStagePlan — Edge cases", () => {
	test("returns empty maps and zero total for empty rules array", async () => {
		const fs = createMockFs();

		const result = await computeStagePlan(fs, [], new Set(), false);

		expect(result.stageDecisions.size).toBe(0);
		expect(result.expandedDirs.size).toBe(0);
		expect(result.total).toBe(0);
	});

	test("empty rules in update mode also returns empty state", async () => {
		const fs = createMockFs();

		const result = await computeStagePlan(fs, [], new Set(), true);

		expect(result.stageDecisions.size).toBe(0);
		expect(result.expandedDirs.size).toBe(0);
		expect(result.total).toBe(0);
	});

	test("multiple rules of the same category are processed independently", async () => {
		const fs = createMockFs({
			exists: new Map([
				["file1.md", false], // missing → staged
				["file2.md", true], // exists → skipped
				["file3.md", false], // missing → staged
			]),
		});

		const rules = [
			rule("file1.md", "standard"),
			rule("file2.md", "standard"),
			rule("file3.md", "standard"),
		];
		const result = await computeStagePlan(fs, rules, new Set(), false);

		expect(result.stageDecisions.get("file1.md")).toBe(true);
		expect(result.stageDecisions.get("file2.md")).toBe(false);
		expect(result.stageDecisions.get("file3.md")).toBe(true);
		expect(result.stageDecisions.size).toBe(3);
		expect(result.total).toBe(2);
	});

	test("multiple optional rules with mixed selection", async () => {
		const fs = createMockFs({
			exists: new Map([
				["opt1.md", false],
				["opt2.md", false],
				["opt3.md", false],
			]),
		});

		const rules = [
			rule("opt1.md", "optional"),
			rule("opt2.md", "optional"),
			rule("opt3.md", "optional"),
		];
		const selected = new Set<string>(["opt1.md", "opt3.md"]); // opt2 NOT selected
		const result = await computeStagePlan(fs, rules, selected, false);

		expect(result.stageDecisions.get("opt1.md")).toBe(true); // selected, missing
		expect(result.stageDecisions.get("opt2.md")).toBe(false); // not selected
		expect(result.stageDecisions.get("opt3.md")).toBe(true); // selected, missing
		expect(result.total).toBe(2);
	});

	test("all rules skipped produces zero total but correct stageDecisions", async () => {
		const fs = createMockFs({
			exists: new Map([
				["README.md", true], // standard, exists → skip
				["Justfile", true], // optional, exists → skip
				["CONTRIBUTING.md", true], // optional, exists → skip
			]),
		});

		const rules = [
			rule("README.md", "standard"),
			rule("Justfile", "optional"),
			rule("CONTRIBUTING.md", "optional"),
		];
		const selected = new Set<string>(["Justfile", "CONTRIBUTING.md"]);
		const result = await computeStagePlan(fs, rules, selected, false);

		expect(result.stageDecisions.get("README.md")).toBe(false);
		expect(result.stageDecisions.get("Justfile")).toBe(false);
		expect(result.stageDecisions.get("CONTRIBUTING.md")).toBe(false);
		expect(result.total).toBe(0);
	});

	test("empty selected set treats all optional rules as not selected", async () => {
		const fs = createMockFs({
			exists: new Map([
				["opt1.md", false],
				["opt2.md", false],
			]),
		});

		const rules = [rule("opt1.md", "optional"), rule("opt2.md", "optional")];
		const result = await computeStagePlan(fs, rules, new Set(), false);

		expect(result.stageDecisions.get("opt1.md")).toBe(false);
		expect(result.stageDecisions.get("opt2.md")).toBe(false);
		expect(result.total).toBe(0);
	});

	test("result object always contains stageDecisions and expandedDirs even when empty", async () => {
		const fs = createMockFs();

		const result = await computeStagePlan(fs, [], new Set(), false);

		expect(result).toHaveProperty("stageDecisions");
		expect(result).toHaveProperty("expandedDirs");
		expect(result).toHaveProperty("total");
		expect(result.stageDecisions instanceof Map).toBe(true);
		expect(result.expandedDirs instanceof Map).toBe(true);
		expect(result.total).toBe(0);
	});

	test("noTemplateCopy does not prevent other rules from being evaluated", async () => {
		const fs = createMockFs({
			exists: new Map([["real.md", false]]),
		});

		const rules: FileRule[] = [
			ruleWithNoTemplateCopy("virtual", "optional"),
			rule("real.md", "standard"),
		];
		const result = await computeStagePlan(fs, rules, new Set(), false);

		// real.md: standard, missing → staged
		expect(result.stageDecisions.has("real.md")).toBe(true);
		expect(result.stageDecisions.get("real.md")).toBe(true);
		// virtual: noTemplateCopy → not in stageDecisions
		expect(result.stageDecisions.has("virtual")).toBe(false);
		expect(result.total).toBe(1);
	});
});

// ---- Update mode: edge cases for tree diff ----

describe("computeStagePlan — Update mode: tree diff edge cases", () => {
	test("no files in template directory yields zero total", async () => {
		const fs = createMockFs({
			exists: new Map([["empty-dir", true]]),
			templateFiles: new Map([["empty-dir", []]]),
			destFiles: new Map([["empty-dir", ["old.md"]]]),
		});

		const rules = [rule("empty-dir", "standard", true)];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		// Source has 0 files, nothing new → stageDecision=false
		expect(result.stageDecisions.get("empty-dir")).toBe(false);
		expect(result.expandedDirs.has("empty-dir")).toBe(false);
		expect(result.total).toBe(0);
	});

	test("destination directory does not exist — all template files included", async () => {
		const fs = createMockFs({
			exists: new Map([["new-dir", false]]), // dest dir doesn't exist
			templateFiles: new Map([["new-dir", ["intro.md", "advanced.md"]]]),
			// destFiles not needed: diffTrees returns walkTemplateDirectory result
			// when destinationExists returns false
		});

		const rules = [rule("new-dir", "standard", true)];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		expect(result.stageDecisions.get("new-dir")).toBe(true);
		expect(result.expandedDirs.get("new-dir")).toEqual(["advanced.md", "intro.md"]);
		expect(result.total).toBe(2);
	});

	test("lexicographic sorting of new files from diffTrees", async () => {
		// diffTrees returns sorted array; verify it appears sorted in expandedDirs
		const fs = createMockFs({
			exists: new Map([["docs", true]]),
			templateFiles: new Map([["docs", ["z.md", "a.md", "m.md"]]]),
			destFiles: new Map([["docs", []]]), // empty dest → all template files are "new"
		});

		const rules = [rule("docs", "standard", true)];
		const result = await computeStagePlan(fs, rules, new Set(), true);

		// diffTrees sorts the missing files, so expandedDirs should be sorted
		expect(result.expandedDirs.get("docs")).toEqual(["a.md", "m.md", "z.md"]);
		expect(result.total).toBe(3);
	});

	// ---- assertNever compile-time guard ----

	test("throws on unrecognized rule category (assertNever guard)", async () => {
		const fs = createMockFs();
		const bogusRule = {
			path: "test",
			category: "bogus" as FileRule["category"],
			isDirectory: false,
			description: "should trigger assertNever",
		};
		const rules: FileRule[] = [bogusRule];

		await expect(computeStagePlan(fs, rules, new Set(), false)).rejects.toThrow(
			"Unhandled rule category: bogus",
		);
	});
});
