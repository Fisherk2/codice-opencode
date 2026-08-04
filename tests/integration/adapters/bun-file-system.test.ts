import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import type { FileRule } from "../../../src/domain/entities/FileRule";
import { FileMergeEngine } from "../../../src/domain/services/FileMergeEngine";
import { BunFileSystem } from "../../../src/infrastructure/adapters/BunFileSystem";
import { STAGING_DIR_NAME, VERSION_FILE_NAME } from "../../../src/infrastructure/config/constants";

/**
 * Check if a directory exists (fs.access works for dirs; Bun.file().exists() does not).
 */
async function dirExists(dirPath: string): Promise<boolean> {
	try {
		await fs.access(dirPath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Integration tests for BunFileSystem.
 * Uses real temporary directories to verify filesystem behavior.
 */
describe("BunFileSystem", () => {
	let tmpDir: string;
	let templateDir: string;
	let destDir: string;
	let fsAdapter: BunFileSystem;

	beforeAll(async () => {
		// Create temp directory hierarchy
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "codice-test-"));

		templateDir = path.join(tmpDir, "template");
		destDir = path.join(tmpDir, "dest");

		await fs.mkdir(templateDir, { recursive: true });
		await fs.mkdir(destDir, { recursive: true });

		// Create template category subdirectories with test files
		const obligatorio = path.join(templateDir, "obligatorio");
		const estandar = path.join(templateDir, "estandar");
		const opcional = path.join(templateDir, "opcional");
		await fs.mkdir(obligatorio, { recursive: true });
		await fs.mkdir(estandar, { recursive: true });
		await fs.mkdir(opcional, { recursive: true });

		// Create test template files in each category
		await Bun.write(path.join(obligatorio, "config.json"), '{"version": 1}');
		await Bun.write(path.join(estandar, "README.md"), "# Test Project");
		await Bun.write(path.join(opcional, "Justfile"), "default:\n\t@echo hi");

		// Create nested directory structure
		await fs.mkdir(path.join(obligatorio, "nested"), { recursive: true });
		await Bun.write(path.join(obligatorio, "nested", "deep.txt"), "deep file content");

		// Create subdirectory inside estandar
		await fs.mkdir(path.join(estandar, "subdir"), { recursive: true });
		await Bun.write(path.join(estandar, "subdir", "helper.md"), "# helper");

		// Initialize BunFileSystem with temporaries
		fsAdapter = new BunFileSystem(templateDir, destDir);
	});

	afterAll(async () => {
		// Clean up temp directory
		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	describe("destinationExists", () => {
		it("should return false for missing destination path", async () => {
			const exists = await fsAdapter.destinationExists("config.json");
			expect(exists).toBe(false);
		});

		it("should return true for existing destination path", async () => {
			await Bun.write(path.join(destDir, "existing.txt"), "content");
			const exists = await fsAdapter.destinationExists("existing.txt");
			expect(exists).toBe(true);
		});

		it("should return true for existing directory (REGRESSION: FEV-1 Issue #2)", async () => {
			const dirPath = path.join(destDir, "test-dir");
			await fs.mkdir(dirPath, { recursive: true });
			const exists = await fsAdapter.destinationExists("test-dir");
			expect(exists).toBe(true);
		});

		it("should return false for non-existing directory", async () => {
			const exists = await fsAdapter.destinationExists("nonexistent-dir");
			expect(exists).toBe(false);
		});

		it("should return true when fs.access throws EACCES (permission denied) — exists but can't read", async () => {
			if (process.platform === "win32") return; // Windows uses ACLs, not POSIX chmod; chmod 0o000 has no effect
			// Make a subdirectory inaccessible so access() inside it throws EACCES
			const restrictedDir = path.join(destDir, "no-access-dir");
			await fs.mkdir(restrictedDir, { recursive: true });
			await fs.chmod(restrictedDir, 0o000);
			try {
				const exists = await fsAdapter.destinationExists("no-access-dir/file.txt");
				// EACCES = path exists but no read permission → true (staging will surface the real error)
				expect(exists).toBe(true);
			} finally {
				// Restore permissions so cleanup can remove the directory
				await fs.chmod(restrictedDir, 0o755);
			}
		});

		it("should return true for symlink pointing to existing target", async () => {
			if (process.platform === "win32") return; // Windows requires elevated privileges for symlinks
			const target = path.join(destDir, "symlink-target.txt");
			await Bun.write(target, "symlink target content");
			const link = path.join(destDir, "symlink.txt");
			await fs.symlink(target, link);
			const exists = await fsAdapter.destinationExists("symlink.txt");
			expect(exists).toBe(true);
		});

		it("should return false for broken symlink", async () => {
			if (process.platform === "win32") return; // Windows requires elevated privileges for symlinks
			const link = path.join(destDir, "broken-symlink.txt");
			await fs.symlink(path.join(destDir, "nonexistent-target"), link);
			const exists = await fsAdapter.destinationExists("broken-symlink.txt");
			expect(exists).toBe(false);
		});

		it("should reject path traversal attempts", async () => {
			expect(fsAdapter.destinationExists("../outside.txt")).rejects.toThrow("Path traversal");
		});
	});

	describe("stageFile and commitStaging", () => {
		it("should stage a file to staging directory", async () => {
			await fsAdapter.stageFile("config.json");
			const stagingPath = path.join(destDir, STAGING_DIR_NAME, "config.json");
			const exists = await Bun.file(stagingPath).exists();
			expect(exists).toBe(true);

			const content = await Bun.file(stagingPath).text();
			expect(content).toBe('{"version": 1}');
		});

		it("should commit staged files to destination", async () => {
			// Stage a file
			await fsAdapter.stageFile("README.md");
			// Commit
			await fsAdapter.commitStaging();

			const destPath = path.join(destDir, "README.md");
			const exists = await Bun.file(destPath).exists();
			expect(exists).toBe(true);

			const content = await Bun.file(destPath).text();
			expect(content).toBe("# Test Project");

			// Staging directory should be removed after commit
			const stagingExists = await dirExists(path.join(destDir, STAGING_DIR_NAME));
			expect(stagingExists).toBe(false);
		});

		it("should stage and commit nested files", async () => {
			await fsAdapter.stageFile(path.join("nested", "deep.txt"));
			await fsAdapter.commitStaging();

			const destPath = path.join(destDir, "nested", "deep.txt");
			const exists = await Bun.file(destPath).exists();
			expect(exists).toBe(true);

			const content = await Bun.file(destPath).text();
			expect(content).toBe("deep file content");
		});
	});

	describe("cleanStaging", () => {
		it("should remove staging directory", async () => {
			// Stage a file first
			await fsAdapter.stageFile("config.json");
			const stagingDir = path.join(destDir, STAGING_DIR_NAME);
			let stagingExists = await dirExists(stagingDir);
			expect(stagingExists).toBe(true);

			// Clean
			await fsAdapter.cleanStaging();

			stagingExists = await dirExists(stagingDir);
			expect(stagingExists).toBe(false);
		});

		it("should not throw if staging does not exist", async () => {
			// Staging was cleaned in previous test, so this should be a no-op
			await expect(fsAdapter.cleanStaging()).resolves.toBeUndefined();
		});
	});

	describe("isWritable", () => {
		it("should return true for writable directory", async () => {
			const writable = await fsAdapter.isWritable();
			expect(writable).toBe(true);
		});
	});

	describe("isEmpty", () => {
		it("should return true for empty destination", async () => {
			// Create a fresh empty directory for this test
			const emptyDest = path.join(tmpDir, "empty-dest");
			await fs.mkdir(emptyDest, { recursive: true });
			const emptyFs = new BunFileSystem(templateDir, emptyDest);

			const empty = await emptyFs.isEmpty();
			expect(empty).toBe(true);
		});

		it("should return false for non-empty destination", async () => {
			// destDir has files from previous tests
			const nonEmpty = await fsAdapter.isEmpty();
			expect(nonEmpty).toBe(false);
		});

		it("should ignore .git and .codice-version", async () => {
			const gitDest = path.join(tmpDir, "git-dest");
			await fs.mkdir(gitDest, { recursive: true });
			await fs.mkdir(path.join(gitDest, ".git"), { recursive: true });
			await Bun.write(path.join(gitDest, ".codice-version"), "v1.0.0");

			const gitFs = new BunFileSystem(templateDir, gitDest);
			const empty = await gitFs.isEmpty();
			expect(empty).toBe(true);
		});
	});

	describe("version file operations", () => {
		it("should write a version file", async () => {
			await fsAdapter.writeVersionFile("v1.0.0");
			const versionPath = path.join(destDir, VERSION_FILE_NAME);
			const exists = await Bun.file(versionPath).exists();
			expect(exists).toBe(true);

			const content = await Bun.file(versionPath).text();
			expect(content).toBe("v1.0.0");
		});

		it("should read a version file", async () => {
			const version = await fsAdapter.readVersionFile();
			expect(version).toBe("v1.0.0");
		});

		it("should return null when no version file exists", async () => {
			const noVersionDest = path.join(tmpDir, "no-version");
			await fs.mkdir(noVersionDest, { recursive: true });
			const noVersionFs = new BunFileSystem(templateDir, noVersionDest);

			const version = await noVersionFs.readVersionFile();
			expect(version).toBeNull();
		});
	});

	describe("template path traversal prevention", () => {
		it("should reject traversal in stageFile", async () => {
			expect(fsAdapter.stageFile("../../malicious")).rejects.toThrow("Invalid template path");
		});
	});

	describe("backup and rollback", () => {
		it("should create backup and clean it up on successful commit", async () => {
			// Seed destination with original content
			await Bun.write(path.join(destDir, "cleanup-test.txt"), "ORIGINAL");
			// Create matching template file
			await Bun.write(path.join(templateDir, "obligatorio", "cleanup-test.txt"), "NEW");
			// Stage
			await fsAdapter.stageFile("cleanup-test.txt");
			// Commit
			await fsAdapter.commitStaging();
			// Destination updated
			const content = await Bun.file(path.join(destDir, "cleanup-test.txt")).text();
			expect(content).toBe("NEW");
			// No .codice-backup files remain
			const entries = await fs.readdir(destDir);
			expect(entries.filter((f) => f.endsWith(".codice-backup"))).toEqual([]);
		});

		it("should roll back all files when commit fails mid-way", async () => {
			// Create two destination files with original content
			await Bun.write(path.join(destDir, "rollback-a.txt"), "ORIGINAL_A");
			const subdir = path.join(destDir, "rollback-sub");
			await fs.mkdir(subdir, { recursive: true });
			await Bun.write(path.join(subdir, "rollback-b.txt"), "ORIGINAL_B");

			// Create template files — second file inside a subdirectory
			await Bun.write(path.join(templateDir, "obligatorio", "rollback-a.txt"), "NEW_A");
			const templateSub = path.join(templateDir, "obligatorio", "rollback-sub");
			await fs.mkdir(templateSub, { recursive: true });
			await Bun.write(path.join(templateSub, "rollback-b.txt"), "NEW_B");

			// Stage both files — second file uses subdirectory relative path
			await fsAdapter.stageFile("rollback-a.txt");
			await fsAdapter.stageFile("rollback-sub/rollback-b.txt");

			// Make subdir read-only so rename of rollback-b.txt fails
			// (555 = r-xr-xr-x: no write, so directory entries can't be modified)
			await fs.chmod(subdir, 0o555);

			// Commit should fail
			await expect(fsAdapter.commitStaging()).rejects.toThrow("Failed to commit staged files");

			// Restore permissions so cleanup works
			await fs.chmod(subdir, 0o755);

			// Both files should still have original content (rollback restored them)
			const contentA = await Bun.file(path.join(destDir, "rollback-a.txt")).text();
			expect(contentA).toBe("ORIGINAL_A");

			const contentB = await Bun.file(path.join(subdir, "rollback-b.txt")).text();
			expect(contentB).toBe("ORIGINAL_B");

			// Staging directory should be cleaned up
			const stagingExists = await dirExists(path.join(destDir, STAGING_DIR_NAME));
			expect(stagingExists).toBe(false);

			// No .codice-backup files should remain
			const allEntries = await fs.readdir(destDir, { recursive: true });
			const codiceBackups = allEntries.filter((f) => f.endsWith(".codice-backup"));
			expect(codiceBackups).toEqual([]);
		});
	});

	describe("isEmpty safe default", () => {
		it("should return false when destination does not exist", async () => {
			// A non-existent directory triggers ENOENT in readdir,
			// which exercises the catch block that returns false (safe default)
			const nonExistentDir = path.join(tmpDir, "does-not-exist-12345");
			const nonExistentFs = new BunFileSystem(templateDir, nonExistentDir);
			const empty = await nonExistentFs.isEmpty();
			expect(empty).toBe(false);
		});
	});
});

// -----------------------------------------------------------------------
// FEV-17 (v2.0 template restructuring): destPath override in stageFile.
// The template source is grouped (core/, packs/*) but the destination stays
// flat — core/* spreads to root, packs/* merge into agents/. These tests
// exercise BunFileSystem.stageFile(sourcePath, destPath) end-to-end.
// -----------------------------------------------------------------------

describe("BunFileSystem — FEV-17 destPath (core/packs → flat destination)", () => {
	let tmpDir: string;
	let templateDir: string;
	let destDir: string;
	let fsAdapter: BunFileSystem;

	beforeAll(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "codice-fev17-"));
		templateDir = path.join(tmpDir, "template");
		destDir = path.join(tmpDir, "dest");
		await fs.mkdir(destDir, { recursive: true });

		// v2.0 source grouping: core/ holds workspace infrastructure,
		// packs/{main,writers,sin-clasificar} hold agents.
		const coreDir = path.join(templateDir, "obligatorio", "core");
		const packsDir = path.join(templateDir, "obligatorio", "packs");
		await fs.mkdir(path.join(coreDir, "commands"), { recursive: true });
		await fs.mkdir(path.join(coreDir, ".opencode", "plugins"), { recursive: true });
		await fs.mkdir(path.join(coreDir, "skills"), { recursive: true });
		await fs.mkdir(path.join(packsDir, "main"), { recursive: true });
		await fs.mkdir(path.join(packsDir, "writers"), { recursive: true });
		await fs.mkdir(path.join(packsDir, "sin-clasificar"), { recursive: true });

		await Bun.write(path.join(coreDir, "opencode.json"), '{"version": "v2"}');
		await Bun.write(path.join(coreDir, "skills-lock.json"), "{}");
		await Bun.write(path.join(coreDir, "commands", "build.md"), "# build");
		await Bun.write(path.join(coreDir, ".opencode", "plugins", "plugin.ts"), "export {}");
		await Bun.write(path.join(coreDir, "skills", "review.md"), "# review");
		await Bun.write(path.join(packsDir, "main", "huitzilopochtli.md"), "# Huitzilopochtli");
		await Bun.write(path.join(packsDir, "writers", "docs-writer.md"), "# Docs Writer");
		await Bun.write(
			path.join(packsDir, "sin-clasificar", "backend-developer.md"),
			"# Backend Developer",
		);

		fsAdapter = new BunFileSystem(templateDir, destDir);
	});

	afterAll(async () => {
		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	it("stages core/ content to staging root when destPath is empty string", async () => {
		await fsAdapter.stageFile("core", "");

		const stagingRoot = path.join(destDir, STAGING_DIR_NAME);
		expect(await Bun.file(path.join(stagingRoot, "opencode.json")).exists()).toBe(true);
		expect(await Bun.file(path.join(stagingRoot, "skills-lock.json")).exists()).toBe(true);
		expect(await Bun.file(path.join(stagingRoot, "commands", "build.md")).exists()).toBe(true);
		expect(
			await Bun.file(path.join(stagingRoot, ".opencode", "plugins", "plugin.ts")).exists(),
		).toBe(true);
		// core/ must not appear as a directory in the staging root
		expect(await dirExists(path.join(stagingRoot, "core"))).toBe(false);

		await fsAdapter.cleanStaging();
	});

	it("stages packs/main to staging agents/ when destPath is 'agents'", async () => {
		await fsAdapter.stageFile("packs/main", "agents");

		const stagingRoot = path.join(destDir, STAGING_DIR_NAME);
		expect(await Bun.file(path.join(stagingRoot, "agents", "huitzilopochtli.md")).exists()).toBe(
			true,
		);
		// packs/ must not appear as a directory in the staging root
		expect(await dirExists(path.join(stagingRoot, "packs"))).toBe(false);

		await fsAdapter.cleanStaging();
	});

	it("clean install of the 4 mandatory rules produces a flat destination", async () => {
		const mandatoryRules: readonly FileRule[] = [
			{
				path: "core",
				destPath: "",
				category: "mandatory",
				isDirectory: true,
				description: "Core workspace infrastructure",
			},
			{
				path: "packs/main",
				destPath: "agents",
				category: "mandatory",
				isDirectory: true,
				description: "Primary agents",
			},
			{
				path: "packs/writers",
				destPath: "agents",
				category: "mandatory",
				isDirectory: true,
				description: "Writer agents",
			},
			{
				path: "packs/sin-clasificar",
				destPath: "agents",
				category: "mandatory",
				isDirectory: true,
				description: "Unclassified agents",
			},
		];

		const engine = new FileMergeEngine(fsAdapter);
		const result = await engine.execute(mandatoryRules);
		expect(result.ok).toBe(true);

		// Destination root is flat: opencode.json, commands/, agents/, .opencode/
		expect(await Bun.file(path.join(destDir, "opencode.json")).exists()).toBe(true);
		expect(await Bun.file(path.join(destDir, "commands", "build.md")).exists()).toBe(true);
		expect(await Bun.file(path.join(destDir, "agents", "huitzilopochtli.md")).exists()).toBe(true);
		expect(await Bun.file(path.join(destDir, "agents", "docs-writer.md")).exists()).toBe(true);
		expect(await Bun.file(path.join(destDir, "agents", "backend-developer.md")).exists()).toBe(
			true,
		);

		// Source grouping directories must NOT leak into the destination
		expect(await dirExists(path.join(destDir, "core"))).toBe(false);
		expect(await dirExists(path.join(destDir, "packs"))).toBe(false);
	});
});
