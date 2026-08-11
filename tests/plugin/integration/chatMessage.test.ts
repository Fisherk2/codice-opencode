// ---------------------------------------------------------------------------
// Integration tests for chat.message hook behavior
//
// Tests the three data structures that power the chat.message hook:
//   AGENT_MENTION_PATTERNS  — RegExp patterns for @mention detection
//   COMMAND_AGENT_MAP       — slash command → agent routing
//   discoverIntentPatterns  — description-derived keyword → command detection
//
// The hook itself lives inside the SddPipelinePlugin factory (requires
// @opencode-ai/plugin at runtime), so we test the pure maps and replicate
// the decision logic here.
//
// Intent patterns are no longer hardcoded — they are derived from each
// command file's `description:` frontmatter at runtime, so the intent tests
// build fixture command files in a temp dir and run the real discovery
// functions against them.
// ---------------------------------------------------------------------------

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	AGENT_MENTION_PATTERNS,
	COMMAND_AGENT_MAP,
} from "../../../template/obligatorio/core/.opencode/plugins/src/defaults";
import {
	deriveIntentKeywords,
	discoverIntentPatterns,
} from "../../../template/obligatorio/core/.opencode/plugins/src/intentDiscovery";

// ---------------------------------------------------------------------------
// Fixture commands directory (mirrors the commandMap unit-test helper pattern,
// but chatMessage.test.ts lives under tests/plugin/integration/ so the helpers
// are written inline here rather than imported from tests/unit/plugins/helpers).
// ---------------------------------------------------------------------------

let fixtureDir: string;
let fixturePatterns: Record<string, readonly string[]>;

beforeAll(() => {
	fixtureDir = mkdtempSync(join(tmpdir(), "chat-message-intent-"));
	writeFileSync(
		join(fixtureDir, "sync.md"),
		"---\ndescription: Bidirectional git sync with intelligent conflict resolution strategies.\n---\n",
	);
	writeFileSync(
		join(fixtureDir, "build.md"),
		"---\ndescription: Implement the next task incrementally.\n---\n",
	);
	// Discover AFTER the fixture files exist — discovery runs at runtime, not
	// at module load, so it must be computed in a hook rather than at describe
	// registration time.
	fixturePatterns = discoverIntentPatterns(fixtureDir);
});

afterAll(() => {
	rmSync(fixtureDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Replicated logic from the chat.message hook
// ---------------------------------------------------------------------------

/** Mimics the hook's agent-mention detection loop. Returns first matching agent or null. */
function detectAgentMention(content: string): string | null {
	for (const [agentType, patterns] of Object.entries(AGENT_MENTION_PATTERNS)) {
		if (patterns.some((p) => p.test(content))) {
			return agentType;
		}
	}
	return null;
}

/** Mimics the hook's slash-command detection. Returns the matching command or null. */
function detectSlashCommand(content: string): string | null {
	const lower = content.toLowerCase();
	for (const [command] of Object.entries(COMMAND_AGENT_MAP)) {
		if (lower.startsWith(command)) {
			const nextChar = lower[command.length];
			const isEnd = lower.length === command.length;
			const hasBoundary = isEnd || !nextChar || /\s/.test(nextChar);
			if (hasBoundary) {
				return command;
			}
		}
	}
	return null;
}

/** Returns the agent a slash command routes to, or null if no match. */
function routeSlashCommand(content: string): string | null {
	const cmd = detectSlashCommand(content);
	return cmd ? (COMMAND_AGENT_MAP[cmd] ?? null) : null;
}

/**
 * Mimics the hook's intent keyword detection. Returns the matching command or null.
 *
 * @param patterns — The intent pattern record to match against (fixture-derived
 *                   or hand-built for deterministic assertions).
 */
function detectIntent(content: string, patterns: Record<string, readonly string[]>): string | null {
	for (const [command, keywords] of Object.entries(patterns)) {
		if (
			keywords.some((kw) => {
				const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				return new RegExp(`\\b${escaped}\\b`, "i").test(content);
			})
		) {
			return command;
		}
	}
	return null;
}

/** Replicates the empty-message guard from the hook. */
function isEmptyMessage(content: string): boolean {
	return !content;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("chat.message — agent mention detection", () => {
	test("Scenario 1: @tlaloc should match tlaloc agent", () => {
		const result = detectAgentMention("@tlaloc");
		expect(result).toBe("tlaloc");
	});

	test("AGENT_MENTION_PATTERNS.tlaloc regex matches @tlaloc (word boundary)", () => {
		const patterns = AGENT_MENTION_PATTERNS.tlaloc!;
		expect(patterns.some((p) => p.test("@tlaloc"))).toBe(true);
	});

	test("AGENT_MENTION_PATTERNS.tlaloc regex matches 'agente tlaloc' (Spanish)", () => {
		const patterns = AGENT_MENTION_PATTERNS.tlaloc!;
		expect(patterns.some((p) => p.test("agente tlaloc"))).toBe(true);
	});

	test("AGENT_MENTION_PATTERNS.tezcatlipoca regex matches @tezcatlipoca", () => {
		const patterns = AGENT_MENTION_PATTERNS.tezcatlipoca!;
		expect(patterns.some((p) => p.test("@tezcatlipoca"))).toBe(true);
	});

	test("AGENT_MENTION_PATTERNS.huitzilopochtli regex matches 'agente huitzilopochtli'", () => {
		const patterns = AGENT_MENTION_PATTERNS.huitzilopochtli!;
		expect(patterns.some((p) => p.test("agente huitzilopochtli"))).toBe(true);
	});
});

describe("chat.message — slash command routing", () => {
	test("Scenario 2: /spec should map to quetzalcoatl", () => {
		const agent = routeSlashCommand("/spec");
		expect(agent).toBe("quetzalcoatl");
	});

	test("/build should map to tlaloc", () => {
		const agent = routeSlashCommand("/build");
		expect(agent).toBe("tlaloc");
	});

	test("/test should map to mictlantecuhtli", () => {
		const agent = routeSlashCommand("/test");
		expect(agent).toBe("mictlantecuhtli");
	});

	test("/ship should map to mictlantecuhtli", () => {
		const agent = routeSlashCommand("/ship");
		expect(agent).toBe("mictlantecuhtli");
	});

	test("/review should map to tezcatlipoca", () => {
		const agent = routeSlashCommand("/review");
		expect(agent).toBe("tezcatlipoca");
	});

	test("/plan should map to moctezuma", () => {
		const agent = routeSlashCommand("/plan");
		expect(agent).toBe("moctezuma");
	});

	test("command with trailing content still matches (e.g. '/build my feature')", () => {
		const agent = routeSlashCommand("/build my feature");
		expect(agent).toBe("tlaloc");
	});

	test("command at start of longer message still matches", () => {
		const agent = routeSlashCommand("/spec please design this");
		expect(agent).toBe("quetzalcoatl");
	});

	test("Scenario 6: /specification does NOT match /spec (word boundary)", () => {
		const cmd = detectSlashCommand("/specification");
		expect(cmd).toBeNull();
	});

	test("command-only line without trailing space matches (isEnd boundary)", () => {
		const cmd = detectSlashCommand("/design");
		expect(cmd).toBe("/design");
	});
});

describe("chat.message — intent keyword detection (auto-discovered patterns)", () => {
	test("discoverIntentPatterns returns {} for a missing directory", () => {
		expect(discoverIntentPatterns(join(fixtureDir, "missing-dir"))).toEqual({});
	});

	test("Scenario 3: 'implement' triggers /build (description-derived)", () => {
		// build.md description "Implement the next task incrementally." yields
		// "implement" as a keyword — no hardcoded keyword map required.
		const command = detectIntent("implement this feature", fixturePatterns);
		expect(command).toBe("/build");
	});

	test("'sync' triggers /sync (command name always a keyword)", () => {
		const command = detectIntent("please sync with remote", fixturePatterns);
		expect(command).toBe("/sync");
	});

	test("deriveIntentKeywords includes the command name first, then description tokens", () => {
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

	test("deriveIntentKeywords always includes the command name even with a null description", () => {
		expect(deriveIntentKeywords("sync", null)).toEqual(["sync"]);
	});

	test("deriveIntentKeywords filters stopwords and short words, and dedupes", () => {
		expect(deriveIntentKeywords("foo", "the and of an at foo bar a")).toEqual(["foo", "bar"]);
	});
});

describe("chat.message — edge cases", () => {
	test("Scenario 4: empty message produces no state changes", () => {
		expect(isEmptyMessage("")).toBe(true);
		expect(isEmptyMessage(undefined as unknown as string)).toBe(true);
		expect(detectAgentMention("")).toBeNull();
		expect(detectSlashCommand("")).toBeNull();
		expect(detectIntent("", {})).toBeNull();
	});

	test("Scenario 5: multiple @mentions — first match wins (preserves insertion order)", () => {
		// Object.entries preserves insertion order: huitzilopochtli is first
		const result = detectAgentMention("@huitzilopochtli and @tlaloc");
		expect(result).toBe("huitzilopochtli");
	});

	test("first mention wins for non-first agent too", () => {
		const result = detectAgentMention("@tlaloc and @tezcatlipoca");
		expect(result).toBe("tlaloc");
	});

	test("interleaved content: agent mention in the middle works", () => {
		const result = detectAgentMention("Hey @quetzalcoatl can you help?");
		expect(result).toBe("quetzalcoatl");
	});

	test("no mention returns null", () => {
		const result = detectAgentMention("just a regular message");
		expect(result).toBeNull();
	});

	test("slash command /build with hyphenated trailing text still matches strictly", () => {
		// /build is a full command, user follows with a space
		const cmd = detectSlashCommand("/build my-app");
		expect(cmd).toBe("/build");
	});
});

describe("chat.message — intent keyword word boundary correctness", () => {
	// Hand-built patterns keep these assertions deterministic — they verify
	// the matching semantics, not the content of any particular command file.
	const patterns: Record<string, readonly string[]> = {
		"/ship": ["ship"],
		"/spec": ["spec"],
	};

	test("'ship' in 'relationship' does NOT match /ship (word boundary)", () => {
		// \b is between \w and \w inside "relationship" except at the string
		// edges — "ship" at the end sits at a \w-to-end boundary, so /\bship\b/i
		// would match. This documents that intent matching is intentionally fuzzy;
		// the strict command/spec distinction lives in slash command detection.
		expect(detectIntent("relationship status", patterns)).toBeNull();
	});

	test("'spec' inside 'specification' does NOT match the standalone keyword 'spec'", () => {
		// \b requires a word→non-word transition on BOTH sides of the keyword;
		// inside "specification" the 'c'→'i' transition is word→word, so there
		// is no boundary. (The pre-refactor INTENT_PATTERNS matched because
		// "specification" was an explicit keyword — with description-derived
		// keywords only whole-word matches are intentional.)
		expect(detectIntent("specification first", patterns)).toBeNull();
	});

	test("standalone 'spec' matches /spec (whole-word boundary)", () => {
		expect(detectIntent("write the spec now", patterns)).toBe("/spec");
	});

	test("hand-built patterns only match their own keywords", () => {
		expect(detectIntent("launch the rocket", patterns)).toBeNull();
		expect(detectIntent("ship it", patterns)).toBe("/ship");
	});
});

describe("chat.message — canonical intent mappings against the real template", () => {
	// Guards the quality of description-derived intent detection. If a
	// description change breaks a canonical mapping, this test fails —
	// better than silently mis-suggesting a command to the user.
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
	let templatePatterns: Record<string, readonly string[]>;

	beforeAll(() => {
		templatePatterns = discoverIntentPatterns(templateCommandsDir);
	});

	test("natural-language phrases route to the canonical command", () => {
		const cases: ReadonlyArray<readonly [string, string]> = [
			["plan out the tasks", "/plan"],
			["test this code", "/test"],
			["review my code", "/review"],
			["deploy to production", "/deploy"],
			["performance audit my web page", "/webperf"],
			["update the documentation", "/docs-update"],
			["simplify this function", "/code-simplify"],
		];
		for (const [message, expected] of cases) {
			expect(detectIntent(message, templatePatterns)).toBe(expected);
		}
	});

	test("each command name is a keyword only under its own command", () => {
		const allNames = new Set(Object.keys(templatePatterns).map((c) => c.slice(1)));
		for (const [command, keywords] of Object.entries(templatePatterns)) {
			const ownName = command.slice(1);
			for (const keyword of keywords) {
				if (allNames.has(keyword)) {
					expect(keyword).toBe(ownName);
				}
			}
		}
	});
});
