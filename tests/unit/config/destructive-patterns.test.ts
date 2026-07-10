/**
 * Structural test for DESTRUCTIVE_PATTERNS in sdd-pipeline.ts
 *
 * FEV-7 (Issue #30): Ensures the runtime destructive command patterns
 * array contains ≥50 entries across 14+ categories.
 */

import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";

const PLUGIN_PATH = path.resolve(
	import.meta.dir,
	"../../..",
	"template/obligatorio/.opencode/plugins/sdd-pipeline.ts",
);

/**
 * Count entries in the DESTRUCTIVE_PATTERNS array by identifying
 * lines that start with regex patterns (/.../i,) within the array block.
 */
function countDestructivePatterns(fileContent: string): number {
	const lines = fileContent.split("\n");
	let inArray = false;
	let count = 0;

	for (const line of lines) {
		const trimmed = line.trim();

		// Detect start of DESTRUCTIVE_PATTERNS array
		if (trimmed.includes("DESTRUCTIVE_PATTERNS") && trimmed.includes("RegExp[]")) {
			inArray = true;
			continue;
		}

		// Detect end of array
		if (inArray && trimmed === "]") {
			break;
		}

		// Count regex entries (lines starting with a regex pattern /.../i and containing a comma)
		if (inArray && trimmed.startsWith("/") && /\/[a-z]*\s*,/.test(trimmed)) {
			count++;
		}
	}

	return count;
}

/**
 * Extract category headers from the DESTRUCTIVE_PATTERNS array.
 */
function countCategoryHeaders(fileContent: string): number {
	const lines = fileContent.split("\n");
	let inArray = false;
	let count = 0;

	for (const line of lines) {
		const trimmed = line.trim();

		if (trimmed.includes("DESTRUCTIVE_PATTERNS") && trimmed.includes("RegExp[]")) {
			inArray = true;
			continue;
		}

		if (inArray && trimmed === "]") {
			break;
		}

		// Count category comment headers
		if (inArray && /^\/\/\s*───/.test(trimmed)) {
			count++;
		}
	}

	return count;
}

describe("DESTRUCTIVE_PATTERNS", () => {
	let fileContent: string;

	test("plugin file exists", () => {
		expect(fs.existsSync(PLUGIN_PATH)).toBe(true);
	});

	// RED phase: this test will fail because we start with ~8 patterns
	test("contains ≥50 destructive command patterns", () => {
		fileContent = fs.readFileSync(PLUGIN_PATH, "utf-8");
		const count = countDestructivePatterns(fileContent);
		expect(count).toBeGreaterThanOrEqual(50);
	});

	test("patterns are organized in 14+ category blocks", () => {
		if (!fileContent) fileContent = fs.readFileSync(PLUGIN_PATH, "utf-8");
		const categories = countCategoryHeaders(fileContent);
		expect(categories).toBeGreaterThanOrEqual(14);
	});
});
