/**
 * Unit tests for autoDiscovery — discoverValidSubagents().
 *
 * Scans the user's agents directory tree and returns the set of valid
 * subagent names merged with PRIMARY_AGENTS. Tests cover: missing dir,
 * empty dir, file discovery with lowercasing, nested pack directories.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { discoverValidSubagents } from "../../../template/obligatorio/core/.opencode/plugins/src/autoDiscovery";
import { PRIMARY_AGENTS } from "../../../template/obligatorio/core/.opencode/plugins/src/validSubagents";
import { cleanupTestDir, createTestDir } from "./helpers";

let tmpDir: string;

beforeAll(async () => {
	tmpDir = await createTestDir("auto-disc-agents");
});

afterAll(async () => {
	await cleanupTestDir(tmpDir);
});

describe("discoverValidSubagents", () => {
	test("returns empty Set for non-existent directory", () => {
		const result = discoverValidSubagents(join(tmpDir, "missing-dir"));
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

	test("set size equals discovered files plus PRIMARY_AGENTS", async () => {
		const dir = join(tmpDir, "agents-count");
		await mkdir(dir);
		const discovered = [
			"typescript-pro",
			"golang-pro",
			"docker-expert",
			"docs-writer",
			"test-engineer",
		];
		for (const name of discovered) {
			await writeFile(join(dir, `${name}.md`), `# ${name}`);
		}

		const result = discoverValidSubagents(dir);

		expect(result.size).toBe(discovered.length + PRIMARY_AGENTS.length);
	});

	test("ignores non-.md files while keeping PRIMARY_AGENTS", async () => {
		const dir = join(tmpDir, "agents-nonmd");
		await mkdir(dir);
		await writeFile(join(dir, "rust-engineer.md"), "# Rust");
		await writeFile(join(dir, "readme.txt"), "not an agent");
		await writeFile(join(dir, "config.yaml"), "not an agent");

		const result = discoverValidSubagents(dir);

		expect(result.size).toBe(1 + PRIMARY_AGENTS.length);
		expect(result.has("rust-engineer")).toBe(true);
	});

	test("skips hidden directories like .git and .opencode", async () => {
		const dir = join(tmpDir, "agents-hidden-dirs");
		await mkdir(dir);
		await writeFile(join(dir, "visible-agent.md"), "# Visible");
		await mkdir(join(dir, ".git"));
		await writeFile(join(dir, ".git", "should-be-ignored.md"), "# Ignored");
		await mkdir(join(dir, ".opencode"));
		await writeFile(join(dir, ".opencode", "internal-agent.md"), "# Internal");

		const result = discoverValidSubagents(dir);

		expect(result.size).toBe(1 + PRIMARY_AGENTS.length);
		expect(result.has("visible-agent")).toBe(true);
		expect(result.has("should-be-ignored")).toBe(false);
		expect(result.has("internal-agent")).toBe(false);
	});

	test("skips hidden dot-files like .agent.md and .gitkeep", async () => {
		const dir = join(tmpDir, "agents-hidden-files");
		await mkdir(dir);
		await writeFile(join(dir, "visible-agent.md"), "# Visible");
		await writeFile(join(dir, ".agent.md"), "# Hidden agent");
		await writeFile(join(dir, ".gitkeep"), "");

		const result = discoverValidSubagents(dir);

		expect(result.size).toBe(1 + PRIMARY_AGENTS.length);
		expect(result.has("visible-agent")).toBe(true);
	});
});
