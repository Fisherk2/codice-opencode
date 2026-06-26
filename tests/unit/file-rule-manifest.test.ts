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
function collectEntries(dir: string, relativeTo: string, prefix: string = ""): string[] {
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
		const optionalEntries = FILE_RULE_MANIFEST.filter((r) => r.category === "optional");

		for (const entry of optionalEntries) {
			const fullPath = path.join(OPCIONAL_DIR, entry.path);
			expect(fs.existsSync(fullPath)).toBe(true);
		}
	});

	test("all top-level template/opcional entries have a manifest representation", () => {
		const optionalEntries = FILE_RULE_MANIFEST.filter((r) => r.category === "optional");
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
		const optionalEntries = FILE_RULE_MANIFEST.filter((r) => r.category === "optional");

		const topLevelCount = fs.readdirSync(OPCIONAL_DIR, { withFileTypes: true }).length;

		expect(optionalEntries.length).toBeGreaterThanOrEqual(topLevelCount);
	});

	test("'.devin' (not '.devin/rules') is in optional manifest entries (ADR-FEV2B-11)", () => {
		const optionalPaths = FILE_RULE_MANIFEST.filter((r) => r.category === "optional").map(
			(r) => r.path,
		);
		// ADR-FEV2B-11: renamed from .devin/rules to .devin for clearer UX
		expect(optionalPaths).toContain(".devin");
		expect(optionalPaths).not.toContain(".devin/rules");
	});

	test("removed .gitignore entry is NOT in standard manifest (FEV-2-C, Issue #11)", () => {
		const manifestPaths = FILE_RULE_MANIFEST.map((r) => r.path);
		// .gitignore was removed because npm excludes it from packages.
		// It is renamed to 'gitignore' (no dot) and generated post-installation
		// by BunGitignoreCreator. (REF: ADR-FEV2C-6)
		expect(manifestPaths).not.toContain(".gitignore");
	});

	test("gitignore file (renamed) exists in template/estandar/ filesystem for post-install generation (FEV-2-C)", () => {
		const estandarDir = path.resolve(PROJECT_ROOT, "template", "estandar");
		const gitignorePath = path.join(estandarDir, "gitignore");
		expect(fs.existsSync(gitignorePath)).toBe(true);
		// The file should have content (not empty)
		const content = fs.readFileSync(gitignorePath, "utf-8");
		expect(content.length).toBeGreaterThan(100);
	});

	test("removed symlink entries (.opencode/{agents,commands,skills}) are NOT in manifest (FEV-2-B)", () => {
		const manifestPaths = FILE_RULE_MANIFEST.map((r) => r.path);
		// These were symlinks → ../{agents,commands,skills}/ that npm resolves
		// during packaging. They are absent in the published tarball, so the
		// manifest entries were removed (ADR-FEV2B-1). Symlinks are generated
		// post-installation by BunSymlinkCreator.
		expect(manifestPaths).not.toContain(".opencode/agents");
		expect(manifestPaths).not.toContain(".opencode/commands");
		expect(manifestPaths).not.toContain(".opencode/skills");
	});

	test("all 13 optional manifest entries have unique paths", () => {
		const optionalEntries = FILE_RULE_MANIFEST.filter((r) => r.category === "optional");
		const paths = optionalEntries.map((r) => r.path);
		const uniquePaths = new Set(paths);
		expect(uniquePaths.size).toBe(paths.length);
	});

	test.each([
		["optional", 13],
		["standard", 10],
		["mandatory", 8],
	])("category '%s' has %i entries", (category, expectedCount) => {
		const count = FILE_RULE_MANIFEST.filter((r) => r.category === category).length;
		if (category === "optional") {
			// Optional entries may grow as new files are added, check minimum
			expect(count).toBeGreaterThanOrEqual(expectedCount);
		} else {
			// Standard and mandatory counts are stable
			expect(count).toBe(expectedCount);
		}
	});
});
