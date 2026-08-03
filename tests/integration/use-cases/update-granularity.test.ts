/**
 * Integration tests for tree-level diff in update mode.
 *
 * Uses real temporary directories and BunFileSystem to verify that
 * FileMergeEngine with isUpdateMode=true stages only new files within
 * standard directories instead of skipping the entire directory.
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import type { FileRule } from "../../../src/domain/entities/FileRule";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";
import { BunFileSystem } from "../../../src/infrastructure/adapters/BunFileSystem";

/**
 * Helper: check if a file exists.
 */
async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Helper: read file content.
 */
async function readFile(filePath: string): Promise<string> {
	return Bun.file(filePath).text();
}

describe("Update granularity — tree-level diff via real filesystem", () => {
	let tmpDir: string;
	let templateDir: string;
	let destDir: string;

	beforeEach(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "codice-granularity-"));
		templateDir = path.join(tmpDir, "template");
		destDir = path.join(tmpDir, "dest");

		// Create template category directories
		await fs.mkdir(path.join(templateDir, "obligatorio"), { recursive: true });
		await fs.mkdir(path.join(templateDir, "estandar"), { recursive: true });
		await fs.mkdir(path.join(templateDir, "opcional"), { recursive: true });

		// Create destination directory
		await fs.mkdir(destDir, { recursive: true });
	});

	afterEach(async () => {
		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	function makeDirRule(
		relativePath: string,
		category: "mandatory" | "standard" | "optional",
	): FileRule {
		return {
			path: relativePath,
			category,
			isDirectory: true,
			description: `Test dir rule for ${relativePath}`,
		};
	}

	// =========================================================================
	// Scenario 1: Pre-populate dest/docs/ with file1.md.
	// Template has file1.md (unchanged) + file2.md (new).
	// Run update. Assert file2.md exists + file1.md content unchanged.
	// =========================================================================

	it("should stage new file in existing standard directory, preserve existing", async () => {
		// Create template files: estandar/docs/file1.md and estandar/docs/file2.md
		const templateDocs = path.join(templateDir, "estandar", "docs");
		await fs.mkdir(templateDocs, { recursive: true });
		await Bun.write(path.join(templateDocs, "file1.md"), "# File 1 (template)");
		await Bun.write(path.join(templateDocs, "file2.md"), "# File 2 (template)");

		// Pre-populate destination with only file1.md (different content — user modified)
		const destDocs = path.join(destDir, "docs");
		await fs.mkdir(destDocs, { recursive: true });
		await Bun.write(path.join(destDocs, "file1.md"), "# File 1 (user modified)");

		// Create BunFileSystem and merge engine
		const fsAdapter = new BunFileSystem(templateDir, destDir);
		const engine = new FileMergeEngine(fsAdapter);

		const rules: FileRule[] = [makeDirRule("docs", "standard")];

		const result = await engine.execute(rules, { updateMode: true });

		expect(result.ok).toBe(true);
		await expect(fileExists(path.join(destDir, "docs", "file2.md"))).resolves.toBe(true);
		const file1Content = await readFile(path.join(destDir, "docs", "file1.md"));
		expect(file1Content).toBe("# File 1 (user modified)");
	});

	// =========================================================================
	// Scenario 2: Template has no new files. Run update. Assert no changes.
	// =========================================================================

	it("should make no changes when template has no new files", async () => {
		// Template has docs/file1.md
		const templateDocs = path.join(templateDir, "estandar", "docs");
		await fs.mkdir(templateDocs, { recursive: true });
		await Bun.write(path.join(templateDocs, "file1.md"), "# File 1 (template)");

		// Destination has docs/file1.md (same name, user modified content)
		const destDocs = path.join(destDir, "docs");
		await fs.mkdir(destDocs, { recursive: true });
		await Bun.write(path.join(destDocs, "file1.md"), "# File 1 (user modified)");

		// Walk destination to see current state
		const destFilesBefore = (await fs.readdir(path.join(destDir, "docs"))).sort();

		const fsAdapter = new BunFileSystem(templateDir, destDir);
		const engine = new FileMergeEngine(fsAdapter);

		const rules: FileRule[] = [makeDirRule("docs", "standard")];

		const result = await engine.execute(rules, { updateMode: true });

		expect(result.ok).toBe(true);
		// Destination should have same files as before
		const destFilesAfter = (await fs.readdir(path.join(destDir, "docs"))).sort();
		expect(destFilesAfter).toEqual(destFilesBefore);
		// Content should be preserved (user modification)
		const file1Content = await readFile(path.join(destDir, "docs", "file1.md"));
		expect(file1Content).toBe("# File 1 (user modified)");
	});

	// =========================================================================
	// Scenario 3: Dest empty. Run update. Assert ALL template files arrive.
	// =========================================================================

	it("should stage all template files when destination directory is empty", async () => {
		// Template has docs/file1.md and docs/file2.md
		const templateDocs = path.join(templateDir, "estandar", "docs");
		await fs.mkdir(templateDocs, { recursive: true });
		await Bun.write(path.join(templateDocs, "file1.md"), "# File 1");
		await Bun.write(path.join(templateDocs, "file2.md"), "# File 2");

		// Destination docs/ does NOT exist at all
		const fsAdapter = new BunFileSystem(templateDir, destDir);
		const engine = new FileMergeEngine(fsAdapter);

		const rules: FileRule[] = [makeDirRule("docs", "standard")];

		const result = await engine.execute(rules, { updateMode: true });

		expect(result.ok).toBe(true);
		await expect(fileExists(path.join(destDir, "docs", "file1.md"))).resolves.toBe(true);
		await expect(fileExists(path.join(destDir, "docs", "file2.md"))).resolves.toBe(true);
	});
});
