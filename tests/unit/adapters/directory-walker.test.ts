/**
 * Unit tests for directoryWalker — walkDirectory().
 *
 * Validates recursive traversal, symlink skipping (security),
 * and handling of mixed directory entries.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { walkDirectory } from "../../../src/infrastructure/adapters/directoryWalker";

let tmpDir: string;

beforeAll(async () => {
	tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "dirwalk-test-"));
});

afterAll(async () => {
	await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("walkDirectory", () => {
	// ---------------------------------------------------------------------------
	// Happy paths
	// ---------------------------------------------------------------------------

	test("returns files in a flat directory", async () => {
		const dir = path.join(tmpDir, "flat");
		await fs.mkdir(dir);
		await fs.writeFile(path.join(dir, "a.txt"), "a");
		await fs.writeFile(path.join(dir, "b.txt"), "b");

		const files = await walkDirectory(dir);
		expect(files.sort()).toEqual([path.join(dir, "a.txt"), path.join(dir, "b.txt")]);
	});

	test("recurses into subdirectories", async () => {
		const dir = path.join(tmpDir, "nested");
		await fs.mkdir(path.join(dir, "sub"), { recursive: true });
		await fs.writeFile(path.join(dir, "root.txt"), "r");
		await fs.writeFile(path.join(dir, "sub", "child.txt"), "c");

		const files = await walkDirectory(dir);
		expect(files.sort()).toEqual([path.join(dir, "root.txt"), path.join(dir, "sub", "child.txt")]);
	});

	test("returns empty array for empty directory", async () => {
		const dir = path.join(tmpDir, "empty");
		await fs.mkdir(dir);

		const files = await walkDirectory(dir);
		expect(files).toEqual([]);
	});

	// ---------------------------------------------------------------------------
	// Security: symlink skipping (lines 17-20)
	// ---------------------------------------------------------------------------

	test("skips symbolic links to files", async () => {
		const dir = path.join(tmpDir, "symlink-file");
		await fs.mkdir(dir);
		await fs.writeFile(path.join(dir, "real.txt"), "content");
		await fs.symlink(path.join(dir, "real.txt"), path.join(dir, "link.txt"));

		const files = await walkDirectory(dir);
		const names = files.map((f) => path.basename(f));
		expect(names).toContain("real.txt");
		expect(names).not.toContain("link.txt");
	});

	test("skips symbolic links to directories", async () => {
		const dir = path.join(tmpDir, "symlink-dir");
		const target = path.join(tmpDir, "symlink-dir-target");
		await fs.mkdir(dir);
		await fs.mkdir(target);
		await fs.writeFile(path.join(target, "secret.txt"), "secret");
		await fs.symlink(target, path.join(dir, "linked-dir"));

		const files = await walkDirectory(dir);
		expect(files).toEqual([]);
	});

	test("skips dangling symbolic links without error", async () => {
		const dir = path.join(tmpDir, "dangling");
		await fs.mkdir(dir);
		await fs.symlink("/nonexistent/path", path.join(dir, "dangling-link"));

		const files = await walkDirectory(dir);
		expect(files).toEqual([]);
	});

	// ---------------------------------------------------------------------------
	// Mixed entries
	// ---------------------------------------------------------------------------

	test("handles mix of files, dirs, and symlinks", async () => {
		const dir = path.join(tmpDir, "mixed");
		const sub = path.join(dir, "sub");
		await fs.mkdir(sub, { recursive: true });
		await fs.writeFile(path.join(dir, "a.txt"), "a");
		await fs.writeFile(path.join(sub, "b.txt"), "b");
		await fs.symlink(path.join(dir, "a.txt"), path.join(dir, "link-a.txt"));

		const files = await walkDirectory(dir);
		const names = files.map((f) => path.basename(f)).sort();
		expect(names).toEqual(["a.txt", "b.txt"]);
	});

	// ---------------------------------------------------------------------------
	// Exclusion: excludeSubPaths parameter
	// ---------------------------------------------------------------------------

	test("excludes a named subdirectory when excludeSubPaths contains its name", async () => {
		const dir = path.join(tmpDir, "excl-single");
		const sub = path.join(dir, "excluded");
		const keep = path.join(dir, "kept");
		await fs.mkdir(sub, { recursive: true });
		await fs.mkdir(keep, { recursive: true });
		await fs.writeFile(path.join(dir, "root.txt"), "root");
		await fs.writeFile(path.join(sub, "secret.txt"), "secret");
		await fs.writeFile(path.join(keep, "visible.txt"), "visible");

		const files = await walkDirectory(dir, false, new Set(["excluded"]));
		const names = files.map((f) => path.basename(f)).sort();
		expect(names).toEqual(["root.txt", "visible.txt"]);
	});

	test("excludes multiple subdirectories when excludeSubPaths contains several names", async () => {
		const dir = path.join(tmpDir, "excl-multi");
		await fs.mkdir(path.join(dir, "a"), { recursive: true });
		await fs.mkdir(path.join(dir, "b"), { recursive: true });
		await fs.mkdir(path.join(dir, "c"), { recursive: true });
		await fs.writeFile(path.join(dir, "root.txt"), "root");
		await fs.writeFile(path.join(dir, "a", "1.txt"), "a1");
		await fs.writeFile(path.join(dir, "b", "2.txt"), "b2");
		await fs.writeFile(path.join(dir, "c", "3.txt"), "c3");

		const files = await walkDirectory(dir, false, new Set(["a", "b"]));
		const names = files.map((f) => path.basename(f)).sort();
		expect(names).toEqual(["3.txt", "root.txt"]);
	});

	test("returns all files when excludeSubPaths is empty", async () => {
		const dir = path.join(tmpDir, "excl-empty");
		await fs.mkdir(path.join(dir, "sub"), { recursive: true });
		await fs.writeFile(path.join(dir, "root.txt"), "root");
		await fs.writeFile(path.join(dir, "sub", "child.txt"), "child");

		const files = await walkDirectory(dir, false, new Set());
		const names = files.map((f) => path.basename(f)).sort();
		expect(names).toEqual(["child.txt", "root.txt"]);
	});

	test("returns all files when excludeSubPaths is undefined (backward compat)", async () => {
		const dir = path.join(tmpDir, "excl-undef");
		await fs.mkdir(path.join(dir, "sub"), { recursive: true });
		await fs.writeFile(path.join(dir, "root.txt"), "root");
		await fs.writeFile(path.join(dir, "sub", "child.txt"), "child");

		const files = await walkDirectory(dir, false, undefined);
		const names = files.map((f) => path.basename(f)).sort();
		expect(names).toEqual(["child.txt", "root.txt"]);
	});

	test("exclusion does not affect top-level files with similar names", async () => {
		const dir = path.join(tmpDir, "excl-toplevel");
		await fs.mkdir(path.join(dir, "docs"), { recursive: true });
		await fs.writeFile(path.join(dir, "docs.txt"), "a file named docs");
		await fs.writeFile(path.join(dir, "docs", "readme.md"), "inside docs dir");

		// Excluding "docs" should only skip the directory, not the file
		const files = await walkDirectory(dir, false, new Set(["docs"]));
		const names = files.map((f) => path.basename(f));
		expect(names).toEqual(["docs.txt"]);
	});
});
