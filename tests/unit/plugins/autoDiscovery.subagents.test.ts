/**
 * Unit tests for autoDiscovery — discoverValidSubagents().
 *
 * Scans the user's agents directory tree and returns the set of valid
 * subagent names merged with PRIMARY_AGENTS. Tests cover: missing dir,
 * empty dir, file discovery with lowercasing, nested pack directories.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverValidSubagents } from "../../../template/obligatorio/core/.opencode/plugins/src/autoDiscovery";
import { PRIMARY_AGENTS } from "../../../template/obligatorio/core/.opencode/plugins/src/validSubagents";

let tmpDir: string;

beforeAll(async () => {
	tmpDir = join(tmpdir(), `auto-disc-agents-${Date.now()}`);
	await mkdir(tmpDir, { recursive: true });
});

afterAll(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("discoverValidSubagents", () => {
	test("returns empty Set for non-existent directory", () => {
		const result = discoverValidSubagents("/tmp/no-agents-dir-99999");
		expect(result).toEqual(new Set());
	});

	test("includes all PRIMARY_AGENTS even with no filesystem files", async () => {
		const dir = join(tmpDir, "agents-empty");
		await mkdir(dir);

		const result = discoverValidSubagents(dir);

		for (const agent of PRIMARY_AGENTS) {
			expect(result.has(agent)).toBe(true);
		}
	});

	test("adds discovered filenames (lowercased) to PRIMARY_AGENTS set", async () => {
		const dir = join(tmpDir, "agents-discover");
		await mkdir(dir);
		await writeFile(join(dir, "custom-agent.md"), "# Custom");
		await writeFile(join(dir, "another-agent.md"), "# Another");

		const result = discoverValidSubagents(dir);

		expect(result.has("custom-agent")).toBe(true);
		expect(result.has("another-agent")).toBe(true);
		expect(result.has("quetzalcoatl")).toBe(true);
		expect(result.has("tlaloc")).toBe(true);
	});

	test("lowercases discovered names regardless of filesystem casing", async () => {
		const dir = join(tmpDir, "agents-case");
		await mkdir(dir);
		await mkdir(join(dir, "PascalCase"));
		await writeFile(join(dir, "PascalCase", "MyAgent.md"), "# PascalCase agent");

		const result = discoverValidSubagents(dir);

		expect(result.has("myagent")).toBe(true);
	});

	test("recurses into nested pack directories", async () => {
		const dir = join(tmpDir, "agents-nested");
		await mkdir(dir);
		await mkdir(join(dir, "pack-a"));
		await writeFile(join(dir, "pack-a", "writer.md"), "# Writer");
		await mkdir(join(dir, "pack-b"));
		await writeFile(join(dir, "pack-b", "reviewer.md"), "# Reviewer");

		const result = discoverValidSubagents(dir);

		expect(result.has("writer")).toBe(true);
		expect(result.has("reviewer")).toBe(true);
	});
});
