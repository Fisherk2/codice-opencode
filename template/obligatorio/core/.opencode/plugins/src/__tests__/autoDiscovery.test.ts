import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
	discoverAgentMentionPatterns,
	discoverCommandAgentMap,
	discoverValidSubagents,
} from "../autoDiscovery";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Creates a temporary directory tree for testing filesystem discovery. */
function createTestFixture(baseDir: string): void {
	mkdirSync(baseDir, { recursive: true });
}

/** Writes a .md file with optional YAML frontmatter. */
function writeCommandFile(
	dir: string,
	name: string,
	frontmatter: Record<string, string> | null,
	body = "",
): void {
	let content = "";
	if (frontmatter !== null) {
		const yaml = Object.entries(frontmatter)
			.map(([k, v]) => `${k}: ${v}`)
			.join("\n");
		content = `---\n${yaml}\n---\n\n${body}`;
	} else {
		content = body;
	}
	writeFileSync(join(dir, name), content, "utf-8");
}

/** Writes a plain agent .md file (just frontmatter with role field). */
function writeAgentFile(dir: string, name: string): void {
	writeFileSync(
		join(dir, name),
		`---\nname: ${name.replace(".md", "")}\nrole: agent\n---\n`,
		"utf-8",
	);
}

/** Writes a non-.md file to test filtering. */
function writeNonMdFile(dir: string, name: string): void {
	writeFileSync(join(dir, name), "not a markdown file", "utf-8");
}

// ---------------------------------------------------------------------------
// Fixture paths
// ---------------------------------------------------------------------------

let fixtureDir: string;
let commandsDir: string;
let agentsDir: string;

beforeEach(() => {
	// Create unique temp directory for each test
	const timestamp = Date.now();
	const random = Math.random().toString(36).slice(2, 8);
	fixtureDir = `/tmp/codice-autodiscovery-test-${timestamp}-${random}`;
	commandsDir = join(fixtureDir, "commands");
	agentsDir = join(fixtureDir, "agents");
});

afterEach(() => {
	// Cleanup entire fixture tree
	if (existsSync(fixtureDir)) {
		rmSync(fixtureDir, { recursive: true, force: true });
	}
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("discoverCommandAgentMap()", () => {
	test("1. Valid commands dir with 3 commands returns correct map", () => {
		createTestFixture(commandsDir);
		writeCommandFile(commandsDir, "spec.md", { agent: "quetzalcoatl" });
		writeCommandFile(commandsDir, "build.md", { agent: "tlaloc" });
		writeCommandFile(commandsDir, "test.md", { agent: "mictlantecuhtli" });

		const result = discoverCommandAgentMap(commandsDir);

		expect(result).toEqual({
			"/spec": "quetzalcoatl",
			"/build": "tlaloc",
			"/test": "mictlantecuhtli",
		});
	});

	test("3. Missing commands dir returns empty object", () => {
		// commandsDir intentionally NOT created
		const result = discoverCommandAgentMap(commandsDir);

		expect(result).toEqual({});
	});

	test("5. Empty dir (exists but no .md files) returns empty", () => {
		createTestFixture(commandsDir);
		// No files written

		const result = discoverCommandAgentMap(commandsDir);

		expect(result).toEqual({});
	});

	test("6. Malformed YAML frontmatter skips the file", () => {
		createTestFixture(commandsDir);
		// File with malformed frontmatter (opening --- but no closing ---)
		writeFileSync(
			join(commandsDir, "broken.md"),
			"---\nagent: tlaloc\nno-closing-marker\n",
			"utf-8",
		);
		// Valid file alongside
		writeCommandFile(commandsDir, "spec.md", { agent: "quetzalcoatl" });

		const result = discoverCommandAgentMap(commandsDir);

		// Only the valid file should be present
		expect(result).toEqual({ "/spec": "quetzalcoatl" });
	});

	test("7. Missing agent: field skips the file", () => {
		createTestFixture(commandsDir);
		// File with frontmatter but no agent field
		writeCommandFile(commandsDir, "no-agent.md", { description: "a command" });
		// Valid file alongside
		writeCommandFile(commandsDir, "build.md", { agent: "tlaloc" });

		const result = discoverCommandAgentMap(commandsDir);

		expect(result).toEqual({ "/build": "tlaloc" });
	});

	test("8. Non-.md files are ignored", () => {
		createTestFixture(commandsDir);
		writeCommandFile(commandsDir, "spec.md", { agent: "quetzalcoatl" });
		writeNonMdFile(commandsDir, "notes.txt");
		writeNonMdFile(commandsDir, "data.json");

		const result = discoverCommandAgentMap(commandsDir);

		expect(result).toEqual({ "/spec": "quetzalcoatl" });
	});

	test("9. Unreadable .md file is silently skipped (catch block)", () => {
		createTestFixture(commandsDir);
		const unreadable = join(commandsDir, "unreadable.md");
		writeFileSync(unreadable, "secret", "utf-8");
		chmodSync(unreadable, 0o000);
		writeCommandFile(commandsDir, "build.md", { agent: "tlaloc" });

		const result = discoverCommandAgentMap(commandsDir);

		expect(result).toEqual({ "/build": "tlaloc" });

		// Restore permissions so the afterEach cleanup can delete the file.
		chmodSync(unreadable, 0o644);
	});

	test("10. Empty frontmatter (blank between --- delimiters) skips the file", () => {
		createTestFixture(commandsDir);
		writeFileSync(join(commandsDir, "empty-fm.md"), "---\n\n---\nagent: quetzalcoatl\n", "utf-8");
		writeCommandFile(commandsDir, "build.md", { agent: "tlaloc" });

		const result = discoverCommandAgentMap(commandsDir);

		expect(result).toEqual({ "/build": "tlaloc" });
	});
});

describe("discoverValidSubagents()", () => {
	/** The 6 primary agents always included in results. */
	const PRIMARY = [
		"huitzilopochtli",
		"quetzalcoatl",
		"moctezuma",
		"tlaloc",
		"mictlantecuhtli",
		"tezcatlipoca",
	] as const;

	test("2. Valid agents dir with 5 agents returns correct set (includes primaries)", () => {
		createTestFixture(agentsDir);
		writeAgentFile(agentsDir, "typescript-pro.md");
		writeAgentFile(agentsDir, "golang-pro.md");
		writeAgentFile(agentsDir, "docker-expert.md");
		writeAgentFile(agentsDir, "docs-writer.md");
		writeAgentFile(agentsDir, "test-engineer.md");

		const result = discoverValidSubagents(agentsDir);

		expect(result).toBeInstanceOf(Set);
		expect(result.size).toBe(5 + PRIMARY.length);
		expect(result.has("typescript-pro")).toBe(true);
		expect(result.has("golang-pro")).toBe(true);
		expect(result.has("docker-expert")).toBe(true);
		expect(result.has("docs-writer")).toBe(true);
		expect(result.has("test-engineer")).toBe(true);
		// All primaries are present even without files
		for (const name of PRIMARY) {
			expect(result.has(name)).toBe(true);
		}
	});

	test("4. Missing agents dir returns empty set (caller falls back to DEFAULTS)", () => {
		const result = discoverValidSubagents(agentsDir);

		expect(result).toBeInstanceOf(Set);
		expect(result.size).toBe(0);
	});

	test("5. Empty agents dir (exists but no .md files) returns set with only primaries", () => {
		createTestFixture(agentsDir);

		const result = discoverValidSubagents(agentsDir);

		expect(result).toBeInstanceOf(Set);
		expect(result.size).toBe(PRIMARY.length);
		for (const name of PRIMARY) {
			expect(result.has(name)).toBe(true);
		}
	});

	test("8. Non-.md files in agents dir are ignored (but primaries still included)", () => {
		createTestFixture(agentsDir);
		writeAgentFile(agentsDir, "rust-engineer.md");
		writeNonMdFile(agentsDir, "readme.txt");
		writeNonMdFile(agentsDir, "config.yaml");

		const result = discoverValidSubagents(agentsDir);

		expect(result.size).toBe(1 + PRIMARY.length);
		expect(result.has("rust-engineer")).toBe(true);
		for (const name of PRIMARY) {
			expect(result.has(name)).toBe(true);
		}
	});

	test("11. Nested subdirectories are scanned recursively", () => {
		createTestFixture(agentsDir);
		writeAgentFile(agentsDir, "top-level-agent.md");
		// One level deep: agents/packs/software-development/backend-developer.md
		mkdirSync(join(agentsDir, "packs", "software-development"), { recursive: true });
		writeAgentFile(join(agentsDir, "packs", "software-development"), "backend-developer.md");
		// Doubly nested: agents/legacy/deprecated/old-tool.md
		mkdirSync(join(agentsDir, "legacy", "deprecated"), { recursive: true });
		writeAgentFile(join(agentsDir, "legacy", "deprecated"), "old-tool.md");

		const result = discoverValidSubagents(agentsDir);

		expect(result).toBeInstanceOf(Set);
		expect(result.size).toBe(3 + PRIMARY.length);
		expect(result.has("top-level-agent")).toBe(true);
		expect(result.has("backend-developer")).toBe(true);
		expect(result.has("old-tool")).toBe(true);
		for (const name of PRIMARY) {
			expect(result.has(name)).toBe(true);
		}
	});

	test("12. Hidden directories are skipped", () => {
		createTestFixture(agentsDir);
		writeAgentFile(agentsDir, "visible-agent.md");
		// Hidden dirs like .git and .opencode must not contribute subagent names
		mkdirSync(join(agentsDir, ".git"), { recursive: true });
		writeAgentFile(join(agentsDir, ".git"), "should-be-ignored.md");
		mkdirSync(join(agentsDir, ".opencode"), { recursive: true });
		writeAgentFile(join(agentsDir, ".opencode"), "internal-agent.md");

		const result = discoverValidSubagents(agentsDir);

		expect(result).toBeInstanceOf(Set);
		expect(result.size).toBe(1 + PRIMARY.length);
		expect(result.has("visible-agent")).toBe(true);
		expect(result.has("should-be-ignored")).toBe(false);
		expect(result.has("internal-agent")).toBe(false);
		for (const name of PRIMARY) {
			expect(result.has(name)).toBe(true);
		}
	});
});

describe("discoverAgentMentionPatterns()", () => {
	test("9. Returns correct patterns for given agents", () => {
		const agents = new Set(["huitzilopochtli", "tlaloc", "tezcatlipoca"]);

		const result = discoverAgentMentionPatterns(agents);

		expect(result).toHaveProperty("huitzilopochtli");
		expect(result).toHaveProperty("tlaloc");
		expect(result).toHaveProperty("tezcatlipoca");

		// Check huitzilopochtli patterns
		const huitziPatterns = result.huitzilopochtli;
		expect(huitziPatterns).toHaveLength(2);
		expect(huitziPatterns[0]).toBeInstanceOf(RegExp);
		expect(huitziPatterns[1]).toBeInstanceOf(RegExp);

		// Verify patterns match correctly
		expect(huitziPatterns[0].test("@huitzilopochtli")).toBe(true);
		expect(huitziPatterns[0].test("@huitzilopochtli ")).toBe(true);
		expect(huitziPatterns[0].test("@huitzilopochtli!")).toBe(true);
		expect(huitziPatterns[0].test("@huitzilopochtliX")).toBe(false); // word boundary
		expect(huitziPatterns[1].test("agente huitzilopochtli")).toBe(true);
		expect(huitziPatterns[1].test("agente tlaloc")).toBe(false);
	});

	test("10. Works with empty set", () => {
		const result = discoverAgentMentionPatterns(new Set());

		expect(result).toEqual({});
	});
});
