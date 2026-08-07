/**
 * Unit tests for directoryScanner — scanMarkdownFilesRecursive (tree scanning).
 *
 * Validates recursive scanning, hidden-entry skipping, maxDepth enforcement,
 * and duplicate-basename detection. These tests cover the scanTree function
 * (lines 73-97) and the scanMarkdownFilesRecursive wrapper (lines 56-64).
 *
 * Uses real temporary directories (no mocks) since the module operates
 * directly on the filesystem via node:fs.
 */

import { afterAll, beforeAll, describe, expect, spyOn, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanMarkdownFilesRecursive } from "../../../template/obligatorio/core/.opencode/plugins/src/directoryScanner";

let tmpDir: string;

beforeAll(async () => {
	tmpDir = join(tmpdir(), `dirscan-recursive-${Date.now()}`);
	await mkdir(tmpDir, { recursive: true });
});

afterAll(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("scanMarkdownFilesRecursive", () => {
	test("returns empty array for non-existent directory", () => {
		const result = scanMarkdownFilesRecursive("/tmp/no-such-dir-99999");
		expect(result).toEqual([]);
	});

	test("returns basenames from a flat directory of .md files", async () => {
		const dir = join(tmpDir, "flat");
		await mkdir(dir);
		await writeFile(join(dir, "agent-a.md"), "# A");
		await writeFile(join(dir, "agent-b.md"), "# B");

		const result = scanMarkdownFilesRecursive(dir);

		expect(result).toEqual(expect.arrayContaining(["agent-a", "agent-b"]));
		expect(result.length).toBe(2);
	});

	test("skips hidden files (dot-prefixed)", async () => {
		const dir = join(tmpDir, "hidden-files");
		await mkdir(dir);
		await writeFile(join(dir, ".gitkeep"), "");
		await writeFile(join(dir, ".agent.md"), "# Hidden");
		await writeFile(join(dir, "visible.md"), "# Visible");

		const result = scanMarkdownFilesRecursive(dir);

		expect(result).toEqual(["visible"]);
	});

	test("skips hidden directories (dot-prefixed)", async () => {
		const dir = join(tmpDir, "hidden-dirs");
		await mkdir(dir);
		await mkdir(join(dir, ".git"));
		await writeFile(join(dir, ".git", "config"), "stuff");
		await mkdir(join(dir, ".opencode"));
		await writeFile(join(dir, ".opencode", "agent.md"), "# Internal");
		await writeFile(join(dir, "real-agent.md"), "# Real");

		const result = scanMarkdownFilesRecursive(dir);

		expect(result).toEqual(["real-agent"]);
	});

	test("skips non-.md files even in nested directories", async () => {
		const dir = join(tmpDir, "skip-nonmd");
		await mkdir(join(dir, "pack-a"), { recursive: true });
		await writeFile(join(dir, "pack-a", "agent.md"), "# Agent");
		await writeFile(join(dir, "pack-a", "readme.txt"), "ignored");
		await writeFile(join(dir, "pack-a", "config.json"), "{}");

		const result = scanMarkdownFilesRecursive(dir);

		expect(result).toEqual(["agent"]);
	});

	test("recurses into subdirectories", async () => {
		const dir = join(tmpDir, "recurse-sub");
		await mkdir(join(dir, "pack-a"), { recursive: true });
		await writeFile(join(dir, "pack-a", "writer.md"), "# Writer");
		await mkdir(join(dir, "pack-b"), { recursive: true });
		await writeFile(join(dir, "pack-b", "reviewer.md"), "# Reviewer");

		const result = scanMarkdownFilesRecursive(dir);

		expect(result).toEqual(expect.arrayContaining(["writer", "reviewer"]));
		expect(result.length).toBe(2);
	});

	test("stops recursing at maxDepth=0 (skips all subdirectories)", async () => {
		const dir = join(tmpDir, "maxdepth-zero");
		await mkdir(dir);
		await writeFile(join(dir, "root-file.md"), "# Root");
		await mkdir(join(dir, "sub"));
		await writeFile(join(dir, "sub", "nested.md"), "# Nested");

		const spy = spyOn(console, "debug");
		try {
			const result = scanMarkdownFilesRecursive(dir, 0);

			expect(result).toEqual(["root-file"]);
			const debugCalls = spy.mock.calls.flat().map(String);
			expect(debugCalls.some((c) => c.includes("Max depth exceeded"))).toBe(true);
		} finally {
			spy.mockRestore();
		}
	});

	test("stops recursing at maxDepth=1 (descends one level only)", async () => {
		const dir = join(tmpDir, "maxdepth-one");
		await mkdir(dir);
		await writeFile(join(dir, "root.md"), "# Root");
		await mkdir(join(dir, "level1"));
		await writeFile(join(dir, "level1", "l1.md"), "# L1");
		await mkdir(join(dir, "level1", "level2"));
		await writeFile(join(dir, "level1", "level2", "l2.md"), "# L2");

		const spy = spyOn(console, "debug");
		try {
			const result = scanMarkdownFilesRecursive(dir, 1);

			expect(result).toEqual(expect.arrayContaining(["root", "l1"]));
			expect(result).not.toEqual(expect.arrayContaining(["l2"]));
			expect(spy).toHaveBeenCalled();
		} finally {
			spy.mockRestore();
		}
	});

	test("detects duplicate basenames across subdirectories", async () => {
		const dir = join(tmpDir, "duplicate-names");
		await mkdir(join(dir, "pack-a"), { recursive: true });
		await writeFile(join(dir, "pack-a", "agent.md"), "# Agent A");
		await mkdir(join(dir, "pack-b"), { recursive: true });
		await writeFile(join(dir, "pack-b", "agent.md"), "# Agent B");

		const spy = spyOn(console, "debug");
		try {
			const result = scanMarkdownFilesRecursive(dir);

			expect(result.filter((n) => n === "agent").length).toBe(2);
			const debugCalls = spy.mock.calls.flat().map(String);
			expect(debugCalls.some((c) => c.includes('Duplicate agent basename "agent"'))).toBe(true);
		} finally {
			spy.mockRestore();
		}
	});

	test("returns empty array for an empty directory", async () => {
		const dir = join(tmpDir, "recursive-empty");
		await mkdir(dir);

		const result = scanMarkdownFilesRecursive(dir);

		expect(result).toEqual([]);
	});
});
