/**
 * Unit tests for intentDiscovery — discoverIntentPatterns() and deriveIntentKeywords().
 *
 * Intent keywords are derived from each command file's `description:`
 * frontmatter plus the command name — replacing the hardcoded INTENT_PATTERNS
 * map. Tests cover: keyword derivation from description + name, stopword/short
 * word filtering, deduplication, null-description fallback, alphabetical
 * sorting, unreadable-file skipping, and missing-directory handling.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
	deriveIntentKeywords,
	discoverIntentPatterns,
	mergeIntentKeywordLayers,
} from "../../../template/obligatorio/core/.opencode/plugins/src/intentDiscovery";
import { cleanupTestDir, createTestDir } from "./helpers";

let tmpDir: string;
beforeAll(async () => {
	tmpDir = await createTestDir("auto-disc-intent");
});

afterAll(async () => {
	await cleanupTestDir(tmpDir);
});

describe("discoverIntentPatterns", () => {
	test("returns empty object for non-existent directory", () => {
		const result = discoverIntentPatterns(join(tmpDir, "missing-dir"));
		expect(result).toEqual({});
	});

	test("returns empty object for an existing empty directory", async () => {
		const dir = join(tmpDir, "intent-empty");
		await mkdir(dir);

		const result = discoverIntentPatterns(dir);

		expect(result).toEqual({});
	});

	test("derives keywords from description and command name", async () => {
		const dir = join(tmpDir, "intent-valid");
		await mkdir(dir);
		await writeFile(
			join(dir, "sync.md"),
			"---\ndescription: Bidirectional git sync with intelligent conflict resolution strategies.\n---\n",
		);

		const result = discoverIntentPatterns(dir);

		expect(result).toEqual({
			"/sync": [
				"sync",
				"bidirectional",
				"git",
				"intelligent",
				"conflict",
				"resolution",
				"strategies",
			],
		});
	});

	test("filters stopwords, short words, and dedupes duplicates", async () => {
		const dir = join(tmpDir, "intent-filter");
		await mkdir(dir);
		await writeFile(
			join(dir, "plan.md"),
			"---\ndescription: Plan the the tasks, plan and break the work down into steps\n---\n",
		);

		const result = discoverIntentPatterns(dir);

		// "the" (stopword), "and" (stopword), "into" (stopword) filtered;
		// "plan" deduped.
		expect(result["/plan"]).toEqual(["plan", "tasks", "break", "work", "down", "steps"]);
	});

	test("command name is always included even when description is missing", async () => {
		const dir = join(tmpDir, "intent-no-desc");
		await mkdir(dir);
		await writeFile(join(dir, "plain.md"), "---\nagent: tlaloc\n---\n# No description");

		const result = discoverIntentPatterns(dir);

		expect(result["/plain"]).toEqual(["plain"]);
	});

	test("description keywords are lowercased", async () => {
		const dir = join(tmpDir, "intent-lowercase");
		await mkdir(dir);
		await writeFile(join(dir, "spec.md"), "---\ndescription: SPEC From SCRATCH\n---\n");

		const result = discoverIntentPatterns(dir);

		// "from" is a stopword and is filtered; "SPEC"/"SCRATCH" are lowercased.
		expect(result["/spec"]).toEqual(["spec", "scratch"]);
	});

	test("results are alphabetically sorted by command key", async () => {
		const dir = join(tmpDir, "intent-sorted");
		await mkdir(dir);
		await writeFile(join(dir, "zeta.md"), "---\ndescription: Zeta command\n---\n");
		await writeFile(join(dir, "alpha.md"), "---\ndescription: Alpha command\n---\n");
		await writeFile(join(dir, "mid.md"), "---\ndescription: Mid command\n---\n");

		const result = discoverIntentPatterns(dir);

		expect(Object.keys(result)).toEqual(["/alpha", "/mid", "/zeta"]);
	});

	test("skips unreadable files without throwing", async () => {
		if (process.platform === "win32") return; // Windows uses ACLs, not POSIX chmod; chmod 0o000 has no effect
		const dir = join(tmpDir, "intent-unreadable");
		await mkdir(dir);
		const unreadablePath = join(dir, "locked.md");
		await writeFile(unreadablePath, "---\ndescription: Locked command\n---\n");
		await writeFile(join(dir, "open.md"), "---\ndescription: Open command\n---\n");

		await chmod(unreadablePath, 0o000);

		const result = discoverIntentPatterns(dir);

		expect(result).toEqual({ "/open": ["open", "command"] });

		await chmod(unreadablePath, 0o644);
	});
});

describe("deriveIntentKeywords", () => {
	test("normal description yields command name + filtered tokens", () => {
		expect(
			deriveIntentKeywords(
				"sync",
				"Bidirectional git sync with intelligent conflict resolution strategies.",
			),
		).toEqual([
			"sync",
			"bidirectional",
			"git",
			"intelligent",
			"conflict",
			"resolution",
			"strategies",
		]);
	});

	test("null description yields just the lowercased command name", () => {
		expect(deriveIntentKeywords("SYNC", null)).toEqual(["sync"]);
	});

	test("stopwords-only description yields just the command name", () => {
		expect(deriveIntentKeywords("build", "the and of at with for")).toEqual(["build"]);
	});

	test("duplicate words are deduplicated preserving first occurrence", () => {
		expect(deriveIntentKeywords("sync", "sync sync sync twice")).toEqual(["sync", "twice"]);
	});

	test("Unicode words stay intact (accented chars are not split)", () => {
		expect(deriveIntentKeywords("help", "Welcome the user, explain Códice")).toEqual([
			"help",
			"welcome",
			"user",
			"explain",
			"códice",
		]);
	});

	test("Spanish stopwords are filtered from Spanish descriptions", () => {
		expect(
			deriveIntentKeywords(
				"deploy",
				"Desplegar la aplicación a producción con el nuevo despliegue",
			),
		).toEqual(["deploy", "desplegar", "aplicación", "producción", "despliegue"]);
	});

	test("empty and whitespace-only descriptions yield just the command name", () => {
		expect(deriveIntentKeywords("sync", "")).toEqual(["sync"]);
		expect(deriveIntentKeywords("sync", "   ")).toEqual(["sync"]);
	});
});

describe("discoverIntentPatterns — command-name collision guard", () => {
	test("a command's description cannot steal another command's name keyword", async () => {
		const dir = join(tmpDir, "intent-collision");
		await mkdir(dir);
		// /migrate's description contains "plan" — that must NOT become a
		// keyword for /migrate, or "plan the work" would route to /migrate
		// via first-match-wins instead of /plan.
		await writeFile(
			join(dir, "migrate.md"),
			"---\ndescription: Generate a complete technology stack migration plan.\n---\n",
		);
		await writeFile(
			join(dir, "plan.md"),
			"---\ndescription: Break down the specs into small verifiable tasks.\n---\n",
		);

		const result = discoverIntentPatterns(dir);

		expect(result["/migrate"]).not.toContain("plan");
		expect(result["/plan"]).toContain("plan");
	});
});

describe("discoverIntentPatterns — real template commands", () => {
	const templateCommandsDir = join(
		import.meta.dir,
		"..",
		"..",
		"..",
		"template",
		"obligatorio",
		"core",
		"commands",
	);
	let patterns: Record<string, readonly string[]>;

	beforeAll(() => {
		patterns = discoverIntentPatterns(templateCommandsDir);
	});

	test("discovers all 17 template commands", () => {
		expect(Object.keys(patterns).length).toBeGreaterThanOrEqual(17);
	});

	test("canonical command names are always present as keywords", () => {
		for (const command of ["/sync", "/migrate", "/deploy", "/analyze", "/plan", "/build"]) {
			const name = command.slice(1); // "/sync" → "sync"
			expect(patterns[command]).toContain(name);
		}
	});

	test("no command's name is stolen by another command's description", () => {
		// The set of ALL command names must only appear as keywords under
		// their own command — the collision guard is enforced globally.
		const allNames = new Set(Object.keys(patterns).map((c) => c.slice(1)));
		for (const [command, keywords] of Object.entries(patterns)) {
			const ownName = command.slice(1);
			for (const keyword of keywords) {
				if (allNames.has(keyword)) {
					expect(keyword).toBe(ownName);
				}
			}
		}
	});
});

describe("mergeIntentKeywordLayers", () => {
	test("extensions append to existing commands, dedupe preserving first occurrence", () => {
		const result = mergeIntentKeywordLayers(
			{ "/test": ["test", "verify"], "/build": ["build"] },
			{ "/test": ["probar", "test"] },
			{},
		);
		expect(result["/test"]).toEqual(["test", "verify", "probar"]);
		expect(result["/build"]).toEqual(["build"]);
	});

	test("extensions ignore commands not in the discovered map (no orphan intents)", () => {
		const result = mergeIntentKeywordLayers({}, { "/ghost": ["fantasma"] }, {});
		expect(result["/ghost"]).toBeUndefined();
	});

	test("overrides replace the entire keyword list per key", () => {
		const warnMessages: string[] = [];
		const result = mergeIntentKeywordLayers(
			{ "/test": ["test", "write"] },
			{ "/test": ["probar"] },
			{ "/test": ["mi keyword"] },
			(msg) => warnMessages.push(msg),
		);
		expect(result["/test"]).toEqual(["mi keyword"]);
		// The override dropped the command's own name keyword — the replace
		// semantics warn about the footgun instead of silently regressing.
		expect(warnMessages.some((m) => m.includes("/test") && m.includes("test"))).toBe(true);
	});

	test("does not mutate the input maps", () => {
		const discovered = { "/test": ["test"] };
		const extensions = { "/test": ["probar"] };
		const overrides = { "/test": ["mi keyword"] };
		mergeIntentKeywordLayers(discovered, extensions, overrides, () => {});
		expect(discovered["/test"]).toEqual(["test"]);
		expect(extensions["/test"]).toEqual(["probar"]);
		expect(overrides["/test"]).toEqual(["mi keyword"]);
	});
});
