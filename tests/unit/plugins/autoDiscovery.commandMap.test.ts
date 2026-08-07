/**
 * Unit tests for autoDiscovery — discoverCommandAgentMap().
 *
 * Maps command .md files to their agent field from YAML frontmatter.
 * Tests cover: valid mapping, missing agent field, missing frontmatter,
 * empty frontmatter, unreadable files (catch block), non-.md files,
 * and whitespace trimming.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chmod, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverCommandAgentMap } from "../../../template/obligatorio/core/.opencode/plugins/src/autoDiscovery";

let tmpDir: string;

beforeAll(async () => {
	tmpDir = join(tmpdir(), `auto-disc-cmd-${Date.now()}`);
	await mkdir(tmpDir, { recursive: true });
});

afterAll(async () => {
	await rm(tmpDir, { recursive: true, force: true });
});

describe("discoverCommandAgentMap", () => {
	test("returns empty object for non-existent directory", () => {
		const result = discoverCommandAgentMap("/tmp/non-existent-cmd-dir-99999");
		expect(result).toEqual({});
	});

	test("maps command names to agents from valid frontmatter", async () => {
		const dir = join(tmpDir, "cmd-valid");
		await mkdir(dir);
		await writeFile(join(dir, "spec.md"), "---\nagent: quetzalcoatl\n---\n# Spec Command");
		await writeFile(join(dir, "build.md"), "---\nagent: tlaloc\n---\n# Build Command");

		const result = discoverCommandAgentMap(dir);

		expect(result).toEqual({
			"/spec": "quetzalcoatl",
			"/build": "tlaloc",
		});
	});

	test("skips files without an agent field in frontmatter", async () => {
		const dir = join(tmpDir, "cmd-no-agent");
		await mkdir(dir);
		await writeFile(join(dir, "noagent.md"), "---\ntitle: My Command\n---\n# No Agent");
		await writeFile(join(dir, "hasagent.md"), "---\nagent: moctezuma\n---\n# Has Agent");

		const result = discoverCommandAgentMap(dir);

		expect(result).toEqual({ "/hasagent": "moctezuma" });
	});

	test("skips files without frontmatter delimiters", async () => {
		const dir = join(tmpDir, "cmd-no-frontmatter");
		await mkdir(dir);
		await writeFile(join(dir, "plain.md"), "# Just a heading\nNo frontmatter here.");

		const result = discoverCommandAgentMap(dir);

		expect(result).toEqual({});
	});

	test("skips files with empty frontmatter block", async () => {
		const dir = join(tmpDir, "cmd-empty-frontmatter");
		await mkdir(dir);
		await writeFile(join(dir, "emptyfm.md"), "---\n\n---\n# Content after empty frontmatter");

		const result = discoverCommandAgentMap(dir);

		expect(result).toEqual({});
	});

	test("skips unreadable files without throwing", async () => {
		const dir = join(tmpDir, "cmd-unreadable");
		await mkdir(dir);
		const unreadablePath = join(dir, "locked.md");
		await writeFile(unreadablePath, "---\nagent: mictlantecuhtli\n---\n# Locked");

		await chmod(unreadablePath, 0o000);

		const result = discoverCommandAgentMap(dir);

		expect(result).toEqual({});

		await chmod(unreadablePath, 0o644);
	});

	test("ignores non-.md files in commands directory", async () => {
		const dir = join(tmpDir, "cmd-nonmd");
		await mkdir(dir);
		await writeFile(join(dir, "valid.md"), "---\nagent: huitzilopochtli\n---\n# Valid");
		await writeFile(join(dir, "notes.txt"), "not a command");
		await writeFile(join(dir, "config.json"), '{"agent":"tezcatlipoca"}');

		const result = discoverCommandAgentMap(dir);

		expect(result).toEqual({ "/valid": "huitzilopochtli" });
	});

	test("trims whitespace from agent field value", async () => {
		const dir = join(tmpDir, "cmd-trim");
		await mkdir(dir);
		await writeFile(join(dir, "trimmed.md"), "---\nagent:   tlaloc   \n---\n# Trimmed");

		const result = discoverCommandAgentMap(dir);

		expect(result).toEqual({ "/trimmed": "tlaloc" });
	});
});
