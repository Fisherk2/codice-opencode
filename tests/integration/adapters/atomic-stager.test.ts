import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { AtomicStager } from "../../../src/infrastructure/adapters/AtomicStager";
import { walkDirectory } from "../../../src/infrastructure/adapters/directoryWalker";
import { STAGING_DIR_NAME } from "../../../src/infrastructure/config/constants";

/** fs.access works for dirs; Bun.file().exists() does not. */
async function dirExists(dirPath: string): Promise<boolean> {
	try {
		await fs.access(dirPath);
		return true;
	} catch {
		return false;
	}
}

/** Recursively find residual .codice-backup files under a root. */
async function findBackups(root: string): Promise<string[]> {
	if (!(await dirExists(root))) return [];
	return (await walkDirectory(root)).filter((p) => p.endsWith(".codice-backup"));
}

/**
 * Dedicated integration tests for AtomicStager (previously only exercised
 * indirectly through BunFileSystem). Covers the rollback path, the
 * success-path backup sweep, and excludeNames directory staging.
 */
describe("AtomicStager", () => {
	let tmpDir: string;
	let destDir: string;
	let templateDir: string;
	let stager: AtomicStager;

	beforeAll(async () => {
		tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "codice-stager-"));
		destDir = path.join(tmpDir, "dest");
		templateDir = path.join(tmpDir, "template");
		await fs.mkdir(destDir, { recursive: true });
		await fs.mkdir(templateDir, { recursive: true });
		stager = new AtomicStager(destDir);
	});

	afterAll(async () => {
		await fs.rm(tmpDir, { recursive: true, force: true });
	});

	it("rejects commitStaging when nothing was staged", async () => {
		expect(stager.commitStaging()).rejects.toThrow(/No staged files found/);
	});

	it("stages and commits a file, leaving no staging or backup artifacts", async () => {
		const src = path.join(templateDir, "happy.txt");
		await fs.writeFile(src, "HAPPY");

		await stager.stageFile(src, "happy.txt");
		await stager.commitStaging();

		expect(await Bun.file(path.join(destDir, "happy.txt")).text()).toBe("HAPPY");
		expect(await dirExists(path.join(destDir, STAGING_DIR_NAME))).toBe(false);
		expect(await findBackups(destDir)).toEqual([]);
	});

	it("backs up and sweeps an overwritten destination file on success", async () => {
		const destFile = path.join(destDir, "existing.txt");
		await fs.writeFile(destFile, "OLD");
		const src = path.join(templateDir, "existing.txt");
		await fs.writeFile(src, "NEW");

		await stager.stageFile(src, "existing.txt");
		await stager.commitStaging();

		expect(await Bun.file(destFile).text()).toBe("NEW");
		expect(await findBackups(destDir)).toEqual([]);
		expect(await dirExists(path.join(destDir, STAGING_DIR_NAME))).toBe(false);
	});

	it("restores backed-up originals when a mid-commit rename fails", async () => {
		// dest/zzz is a FILE, so staging zzz/broken.txt forces an ENOTDIR/EEXIST
		// failure at commit time — the rollback path must run.
		const aaaDest = path.join(destDir, "aaa.txt");
		const zzzFile = path.join(destDir, "zzz");
		await fs.writeFile(aaaDest, "ORIGINAL_AAA");
		await fs.writeFile(zzzFile, "I AM A FILE, NOT A DIR");

		// Order-independence: whether aaa.txt is renamed before the failure or
		// never touched, the assertion (original preserved, no artifacts) holds.
		const srcAaa = path.join(templateDir, "aaa.txt");
		const srcBroken = path.join(templateDir, "zzz", "broken.txt");
		await fs.mkdir(path.dirname(srcBroken), { recursive: true });
		await fs.writeFile(srcAaa, "NEW_AAA");
		await fs.writeFile(srcBroken, "SHOULD NOT LAND");

		await stager.stageFile(srcAaa, "aaa.txt");
		await stager.stageFile(srcBroken, "zzz/broken.txt");

		await expect(stager.commitStaging()).rejects.toThrow(/Failed to commit staged files/);

		// Original content preserved — either restored from backup or untouched
		expect(await Bun.file(aaaDest).text()).toBe("ORIGINAL_AAA");
		expect(await dirExists(path.join(destDir, STAGING_DIR_NAME))).toBe(false);
		expect(await findBackups(destDir)).toEqual([]);
	});

	it("stages a directory recursively while honoring excludeNames", async () => {
		const srcDir = path.join(templateDir, "pkg");
		const keepFile = path.join(srcDir, "keep.txt");
		const depFile = path.join(srcDir, "node_modules", "dep.txt");
		await fs.mkdir(path.dirname(depFile), { recursive: true });
		await fs.writeFile(keepFile, "KEEP");
		await fs.writeFile(depFile, "DEP");

		await stager.stageFile(srcDir, "pkg", new Set(["node_modules"]));
		await stager.commitStaging();

		expect(await Bun.file(path.join(destDir, "pkg", "keep.txt")).text()).toBe("KEEP");
		expect(await Bun.file(path.join(destDir, "pkg", "node_modules", "dep.txt")).exists()).toBe(
			false,
		);
	});
});
