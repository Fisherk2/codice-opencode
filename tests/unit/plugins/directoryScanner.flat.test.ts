/**
 * Unit tests for directoryScanner — scanMarkdownFiles (flat directory scanning).
 *
 * Validates that the flat scanner returns .md basenames, ignores non-.md files,
 * ignores subdirectories, and handles empty/missing directories.
 *
 * Uses real temporary directories (no mocks) since the module operates
 * directly on the filesystem via node:fs.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanMarkdownFiles } from "../../../template/obligatorio/core/.opencode/plugins/src/directoryScanner";

let tmpDir: string;

beforeAll(async () => {
	tmpDir = join(tmpdir(), `dirscan-flat-${Date.now()}`);
	await mkdir(tmpDir, { recursive: true });
});

afterAll(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("scanMarkdownFiles", () => {
	test("returns empty array for non-existent directory", () => {
		const result = scanMarkdownFiles("/tmp/definitely-not-a-real-dir-12345");
		expect(result).toEqual([]);
	});

	test("returns basenames of .md files in a flat directory", async () => {
		const dir = join(tmpDir, "flat-md");
		await mkdir(dir);
		await writeFile(join(dir, "spec.md"), "# Spec");
		await writeFile(join(dir, "build.md"), "# Build");
		await writeFile(join(dir, "deploy.md"), "# Deploy");

		const result = scanMarkdownFiles(dir);

		expect(result).toEqual(expect.arrayContaining(["spec", "build", "deploy"]));
		expect(result.length).toBe(3);
	});

	test("ignores non-.md files", async () => {
		const dir = join(tmpDir, "mixed-ext");
		await mkdir(dir);
		await writeFile(join(dir, "readme.md"), "# Readme");
		await writeFile(join(dir, "notes.txt"), "some notes");
		await writeFile(join(dir, "config.json"), "{}");

		const result = scanMarkdownFiles(dir);

		expect(result).toEqual(["readme"]);
	});

	test("ignores subdirectories", async () => {
		const dir = join(tmpDir, "with-subdir");
		await mkdir(dir);
		await writeFile(join(dir, "top.md"), "# Top");
		await mkdir(join(dir, "nested"));
		await writeFile(join(dir, "nested", "deep.md"), "# Deep");

		const result = scanMarkdownFiles(dir);

		expect(result).toEqual(["top"]);
	});

	test("returns empty array for an empty directory", async () => {
		const dir = join(tmpDir, "empty");
		await mkdir(dir);

		const result = scanMarkdownFiles(dir);

		expect(result).toEqual([]);
	});
});
