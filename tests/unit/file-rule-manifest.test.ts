/**
 * FileRuleManifest completeness tests
 *
 * FEV-2 (Issue #8): The manifest was missing 4 entries from template/opcional/.
 * This test ensures every manifest entry corresponds to an actual file/dir
 * in the template directory, and vice-versa.
 */

import { describe, expect, test } from "bun:test";
import * as fs from "node:fs";
import * as path from "node:path";
import { FILE_RULE_MANIFEST } from "../../src/domain/entities/FileRuleManifestData";

const PROJECT_ROOT = path.resolve(import.meta.dir, "../..");
const OPCIONAL_DIR = path.join(PROJECT_ROOT, "template", "opcional");

/**
 * Recursively collect all files and directories from a path.
 * Returns absolute paths.
 */
function collectEntries(
	dir: string,
	relativeTo: string,
	prefix: string = "",
): string[] {
	const entries: string[] = [];
	if (!fs.existsSync(dir)) return entries;

	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
		const absPath = path.join(dir, entry.name);

		// Add this entry (both files and dirs)
		entries.push(relPath);

		// Recurse into directories (not too deep, skip hidden)
		if (
			entry.isDirectory() &&
			!entry.name.startsWith(".") &&
			!entry.name.startsWith("node_modules")
		) {
			entries.push(...collectEntries(absPath, relativeTo, relPath));
		}
	}
	return entries;
}

describe("FileRuleManifest — completeness (FEV-2)", () => {
	test("all optional manifest entries correspond to existing files or directories", () => {
		const optionalEntries = FILE_RULE_MANIFEST.filter(
			(r) => r.category === "optional",
		);

		for (const entry of optionalEntries) {
			const fullPath = path.join(OPCIONAL_DIR, entry.path);
			expect(fs.existsSync(fullPath)).toBe(true);
		}
	});

	test("all top-level template/opcional entries have a manifest representation", () => {
		const optionalEntries = FILE_RULE_MANIFEST.filter(
			(r) => r.category === "optional",
		);
		const manifestPaths = new Set(optionalEntries.map((r) => r.path));

		// Collect top-level entries and their direct children
		const topLevel = fs
			.readdirSync(OPCIONAL_DIR, { withFileTypes: true })
			.filter((e) => !e.name.startsWith("."));

		for (const entry of topLevel) {
			// Top-level entries must be in the manifest
			if (manifestPaths.has(entry.name)) continue;

			// Sub-items of dirs might be in the manifest (e.g. docs/DESIGN.md)
			if (entry.isDirectory()) {
				const subItems = collectEntries(
					path.join(OPCIONAL_DIR, entry.name),
					OPCIONAL_DIR,
					entry.name, // prefix with parent dir name
				);
				const covered = subItems.some((sub) => manifestPaths.has(sub));
				if (!covered) {
					// If the directory itself is in the manifest, that's fine
					expect(manifestPaths.has(entry.name)).toBe(true);
				}
			} else {
				// File not covered by manifest
				expect(manifestPaths.has(entry.name)).toBe(true);
			}
		}
	});

	test("optional manifest count is at least the number of top-level files and dirs in template/opcional/", () => {
		const optionalEntries = FILE_RULE_MANIFEST.filter(
			(r) => r.category === "optional",
		);

		const topLevelCount = fs
			.readdirSync(OPCIONAL_DIR, { withFileTypes: true }).length;

		expect(optionalEntries.length).toBeGreaterThanOrEqual(topLevelCount);
	});

	test("all 13 optional manifest entries have unique paths", () => {
		const optionalEntries = FILE_RULE_MANIFEST.filter(
			(r) => r.category === "optional",
		);
		const paths = optionalEntries.map((r) => r.path);
		const uniquePaths = new Set(paths);
		expect(uniquePaths.size).toBe(paths.length);
	});

	test.each([
		["optional", 13],
		["standard", 11],
		["mandatory", 11],
	])("category '%s' has %i entries", (category, expectedCount) => {
		const count = FILE_RULE_MANIFEST.filter(
			(r) => r.category === category,
		).length;
		if (category === "optional") {
			// Optional entries may grow as new files are added, check minimum
			expect(count).toBeGreaterThanOrEqual(expectedCount);
		} else {
			// Standard and mandatory counts are stable
			expect(count).toBe(expectedCount);
		}
	});
});
