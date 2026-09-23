import { afterAll, afterEach, beforeAll, describe, expect, it, spyOn } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { AtomicStager } from "../../../src/infrastructure/adapters/AtomicStager";
import { walkDirectory } from "../../../src/infrastructure/adapters/directoryWalker";
import { VerboseLogger } from "../../../src/infrastructure/adapters/VerboseLogger";
import { BACKUP_INTENT_FILE, STAGING_DIR_NAME } from "../../../src/infrastructure/config/constants";

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

	let warnSpy: ReturnType<typeof spyOn>;

	afterEach(async () => {
		warnSpy?.mockRestore();
		// Clean up intent marker left by failed commits so subsequent tests start clean
		await fs.unlink(path.join(destDir, BACKUP_INTENT_FILE)).catch(() => {});
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

	it("emits staging_cleanup event on verbose logger during cleanStaging", async () => {
		const verboseStager = new AtomicStager(destDir, new VerboseLogger(true));
		warnSpy = spyOn(console, "warn").mockImplementation(() => {});

		const src = path.join(templateDir, "verbose.txt");
		await fs.writeFile(src, "VERBOSE");

		await verboseStager.stageFile(src, "verbose.txt");
		await verboseStager.commitStaging();

		const calls = warnSpy.mock.calls.map((call: readonly unknown[]) => String(call[0]));
		expect(calls.some((line: string) => line.includes("staging_cleanup"))).toBe(true);
	});

	it("writes .codice-backup-intent marker during commitStaging and removes it on success", async () => {
		const src = path.join(templateDir, "intent.txt");
		await fs.writeFile(src, "INTENT");

		const intentPath = path.join(destDir, BACKUP_INTENT_FILE);

		// Intent marker should not exist before commit
		expect(await Bun.file(intentPath).exists()).toBe(false);

		await stager.stageFile(src, "intent.txt");
		await stager.commitStaging();

		// Intent marker should be removed after successful commit
		expect(await Bun.file(intentPath).exists()).toBe(false);
		expect(await Bun.file(path.join(destDir, "intent.txt")).text()).toBe("INTENT");
	});

	it("throws when .codice-backup-intent exists from interrupted commit", async () => {
		// Simulate interrupted commit by creating intent marker
		const intentPath = path.join(destDir, BACKUP_INTENT_FILE);
		await fs.writeFile(intentPath, "2026-08-20T12:00:00.000Z", "utf-8");

		const src = path.join(templateDir, "retry.txt");
		await fs.writeFile(src, "RETRY");
		await stager.stageFile(src, "retry.txt");

		await expect(stager.commitStaging()).rejects.toThrow(/Previous commit was interrupted/);
	});

	it("never overwrites a destination file whose backup cannot be created", async () => {
		const destFile = path.join(destDir, "locked.txt");
		await fs.writeFile(destFile, "PRECIOUS");
		// A non-empty directory occupying the backup path makes copyFile fail
		// (EISDIR/ENOTEMPTY). Previously the failure was swallowed and the
		// destination got overwritten anyway — a data-loss path.
		const backupDir = path.join(destDir, "locked.txt.codice-backup");
		await fs.mkdir(path.join(backupDir, "payload"), { recursive: true });
		const src = path.join(templateDir, "locked.txt");
		await fs.writeFile(src, "NEW");

		try {
			await stager.stageFile(src, "locked.txt");
			await expect(stager.commitStaging()).rejects.toThrow(/back up existing destination/i);

			expect(await Bun.file(destFile).text()).toBe("PRECIOUS");
			expect(await dirExists(path.join(destDir, STAGING_DIR_NAME))).toBe(false);
		} finally {
			await fs.rm(backupDir, { recursive: true, force: true });
		}
	});

	it("removes newly promoted files from the destination when rollback runs", async () => {
		// aaa_new.txt sorts before zzz/ so it is promoted (no backup — new file)
		// before the mid-commit failure forces a rollback.
		const zzzFile = path.join(destDir, "zzz");
		await fs.writeFile(zzzFile, "I AM A FILE, NOT A DIR");
		const srcNew = path.join(templateDir, "aaa_new.txt");
		await fs.writeFile(srcNew, "FRESH");
		const srcBroken = path.join(templateDir, "zzz", "broken.txt");
		await fs.mkdir(path.dirname(srcBroken), { recursive: true });
		await fs.writeFile(srcBroken, "SHOULD NOT LAND");

		await stager.stageFile(srcNew, "aaa_new.txt");
		await stager.stageFile(srcBroken, "zzz/broken.txt");

		await expect(stager.commitStaging()).rejects.toThrow(/Failed to commit staged files/);

		// The earlier rename created a fresh destination file with no backup —
		// a backup-only rollback cannot undo it, so rollback must unlink it.
		expect(await Bun.file(path.join(destDir, "aaa_new.txt")).exists()).toBe(false);
	});

	it("refuses to write into a pre-existing symlinked staging directory", async () => {
		// Attacker-controlled or corrupted destination: .codice-staging is a
		// symlink pointing somewhere else (e.g., the home dir or /etc).
		const outsideDir = await fs.mkdtemp(path.join(tmpDir, "outside-"));
		const evilDestDir = await fs.mkdtemp(path.join(tmpDir, "dest-evil-"));
		await fs.symlink(outsideDir, path.join(evilDestDir, STAGING_DIR_NAME));
		const evilStager = new AtomicStager(evilDestDir);

		const src = path.join(templateDir, "symlink.txt");
		await fs.writeFile(src, "SMUGGLED");

		await expect(evilStager.stageFile(src, "payload.txt")).rejects.toThrow(/symbolic link/i);

		// Nothing was written through the link — outside dir stays empty.
		const outsideEntries = await fs.readdir(outsideDir);
		expect(outsideEntries).toEqual([]);
		await fs.rm(evilDestDir, { recursive: true, force: true });
		await fs.rm(outsideDir, { recursive: true, force: true });
	});

	it("refuses to write a backup through a pre-existing symlinked backup path", async () => {
		const destFile = path.join(destDir, "victim.txt");
		await fs.writeFile(destFile, "OLD");
		const outsideTarget = path.join(tmpDir, "outside-target.txt");
		await fs.writeFile(outsideTarget, "KEEP ME");
		// ".codice-backup" suffix matches AtomicStager's private BACKUP_SUFFIX
		await fs.symlink(outsideTarget, `${destFile}.codice-backup`);

		const src = path.join(templateDir, "victim.txt");
		await fs.writeFile(src, "NEW");
		await stager.stageFile(src, "victim.txt");

		await expect(stager.commitStaging()).rejects.toThrow(/symbolic link/i);

		// copyFile follows destination symlinks — the commit must abort before
		// it can clobber the symlink's external target.
		expect(await Bun.file(outsideTarget).text()).toBe("KEEP ME");
		expect(await Bun.file(destFile).text()).toBe("OLD");
		await fs.unlink(`${destFile}.codice-backup`).catch(() => {});
	});
});
