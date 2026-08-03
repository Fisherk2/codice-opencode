// ---------------------------------------------------------------------------
// Integration test: help command auto-discovery (FEV-14)
//
// Verifies that discoverCommandAgentMap correctly discovers the /help command
// from a commands/help.md file with valid frontmatter (agent: huitzilopochtli).
//
// This proves auto-discovery works without modifying plugin code — the /help
// command file is picked up purely from filesystem scanning.
// ---------------------------------------------------------------------------

import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { discoverCommandAgentMap } from "../../../template/obligatorio/.opencode/plugins/src/autoDiscovery";

// ---------------------------------------------------------------------------
// Fixture setup
// ---------------------------------------------------------------------------

const fixtureDir = "/tmp/codice-help-discovery-test";
const commandsDir = join(fixtureDir, "commands");

/**
 * Writes a command .md file with YAML frontmatter.
 * Matches the format used by writeCommandFile in autoDiscovery.test.ts.
 */
function writeCommandFile(
	dir: string,
	name: string,
	frontmatter: Record<string, string>,
	body = "",
): void {
	const yaml = Object.entries(frontmatter)
		.map(([k, v]) => `${k}: ${v}`)
		.join("\n");
	const content = `---\n${yaml}\n---\n\n${body}`;
	writeFileSync(join(dir, name), content, "utf-8");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("FEV-14 — help command auto-discovery", () => {
	test("1. /help command with agent: huitzilopochtli is discovered from commands directory", () => {
		// Arrange: create temp commands dir with help.md
		mkdirSync(commandsDir, { recursive: true });
		writeCommandFile(commandsDir, "help.md", {
			description: "Show interactive help menu",
			agent: "huitzilopochtli",
		});

		// Act
		const result = discoverCommandAgentMap(commandsDir);

		// Assert
		expect(result).toEqual({
			"/help": "huitzilopochtli",
		});
	});

	test("2. /help coexists with other commands in the same directory", () => {
		// Arrange: add help.md alongside spec.md and build.md
		mkdirSync(commandsDir, { recursive: true });
		writeCommandFile(commandsDir, "spec.md", { agent: "quetzalcoatl" });
		writeCommandFile(commandsDir, "build.md", { agent: "tlaloc" });
		writeCommandFile(commandsDir, "help.md", {
			description: "Show interactive help menu",
			agent: "huitzilopochtli",
		});

		// Act
		const result = discoverCommandAgentMap(commandsDir);

		// Assert
		expect(result).toEqual({
			"/spec": "quetzalcoatl",
			"/build": "tlaloc",
			"/help": "huitzilopochtli",
		});
	});

	test("3. Malformed frontmatter in help.md is skipped", () => {
		// Arrange: write help.md with missing closing ---
		mkdirSync(commandsDir, { recursive: true });
		writeFileSync(
			join(commandsDir, "help.md"),
			"---\nagent: huitzilopochtli\nno-closing-marker\n",
			"utf-8",
		);

		// Act
		const result = discoverCommandAgentMap(commandsDir);

		// Assert
		expect(result).toEqual({});
	});

	test("4. Missing agent: field in help.md is skipped", () => {
		// Arrange: write help.md with frontmatter but no agent field
		mkdirSync(commandsDir, { recursive: true });
		writeCommandFile(commandsDir, "help.md", { description: "a help command" });

		// Act
		const result = discoverCommandAgentMap(commandsDir);

		// Assert
		expect(result).toEqual({});
	});

	test("5. Empty commands directory returns empty map", () => {
		// Arrange: create dir but no files
		mkdirSync(commandsDir, { recursive: true });

		// Act
		const result = discoverCommandAgentMap(commandsDir);

		// Assert
		expect(result).toEqual({});
	});

	test("6. Non-existent commands directory returns empty map", () => {
		// Arrange: don't create the dir
		const missingDir = "/tmp/codice-nonexistent-commands";

		// Act
		const result = discoverCommandAgentMap(missingDir);

		// Assert
		expect(result).toEqual({});
	});

	// Cleanup after all tests
	afterEach(() => {
		if (existsSync(fixtureDir)) {
			rmSync(fixtureDir, { recursive: true, force: true });
		}
	});
});
