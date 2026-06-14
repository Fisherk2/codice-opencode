import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
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
		tmpDir = await fs.mkdtemp("codice-test-");

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

	describe("readTemplateFile", () => {
		it("should read from obligatorio/ subdirectory", async () => {
			const content = await fsAdapter.readTemplateFile("config.json");
			expect(content).toBe('{"version": 1}');
		});

		it("should read from estandar/ subdirectory", async () => {
			const content = await fsAdapter.readTemplateFile("README.md");
			expect(content).toBe("# Test Project");
		});

		it("should read from opcional/ subdirectory", async () => {
			const content = await fsAdapter.readTemplateFile("Justfile");
			expect(content).toBe("default:\n\t@echo hi");
		});

		it("should read nested template files", async () => {
			const content = await fsAdapter.readTemplateFile(path.join("nested", "deep.txt"));
			expect(content).toBe("deep file content");
		});

		it("should throw on missing file", async () => {
			expect(fsAdapter.readTemplateFile("nonexistent.md")).rejects.toThrow(
				"Template file not found",
			);
		});
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

		it("should reject path traversal attempts", async () => {
			expect(fsAdapter.destinationExists("../outside.txt")).rejects.toThrow("Path traversal");
		});
	});

	describe("getStagingPath", () => {
		it("should return path inside staging dir", () => {
			const stagingPath = fsAdapter.getStagingPath("config.json");
			expect(stagingPath).toBe(path.resolve(destDir, STAGING_DIR_NAME, "config.json"));
		});

		it("should handle nested paths", () => {
			const stagingPath = fsAdapter.getStagingPath(path.join("subdir", "file.txt"));
			expect(stagingPath).toBe(path.resolve(destDir, STAGING_DIR_NAME, "subdir", "file.txt"));
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

	describe("path traversal prevention", () => {
		it("should reject absolute paths in destinationExists", async () => {
			expect(fsAdapter.destinationExists("/etc/passwd")).rejects.toThrow("Path traversal");
		});

		it("should reject parent directory traversal", async () => {
			expect(fsAdapter.destinationExists("../../outside")).rejects.toThrow("Path traversal");
		});

		it("should allow normal subdirectory paths", async () => {
			await fs.mkdir(path.join(destDir, "valid-sub"), { recursive: true });
			await Bun.write(path.join(destDir, "valid-sub", "test.txt"), "content");
			const exists = await fsAdapter.destinationExists(path.join("valid-sub", "test.txt"));
			expect(exists).toBe(true);
		});
	});
});
