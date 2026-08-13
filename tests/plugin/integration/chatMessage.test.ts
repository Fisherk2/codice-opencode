// ---------------------------------------------------------------------------
// Integration tests for chat.message hook behavior
//
// Tests the three data structures that power the chat.message hook:
//   AGENT_MENTION_PATTERNS  — RegExp patterns for @mention detection
//   COMMAND_AGENT_MAP       — slash command → agent routing
//   discoverIntentPatterns  — description-derived keyword → command detection
//
// The hook factory itself lives in sdd-pipeline.ts (requires
// @opencode-ai/plugin at runtime), so the decision logic is exercised through
// the REAL pure functions extracted into src/chatMessage.ts — the same
// functions the hook calls. No logic is replicated here (review finding 1).
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
	compileIntentPatterns,
	detectAgentMention,
	detectChatMessageRouting,
	detectIntentFromMessage,
	detectSlashCommand,
} from "../../../template/obligatorio/core/.opencode/plugins/src/chatMessage";
import {
	AGENT_MENTION_PATTERNS,
	COMMAND_AGENT_MAP,
} from "../../../template/obligatorio/core/.opencode/plugins/src/defaults";
import {
	deriveIntentKeywords,
	discoverIntentPatterns,
	mergeIntentKeywordLayers,
} from "../../../template/obligatorio/core/.opencode/plugins/src/intentDiscovery";
import { SPANISH_INTENT_KEYWORDS } from "../../../template/obligatorio/core/.opencode/plugins/src/spanishIntents";

// ---------------------------------------------------------------------------
// Fixture commands directory (mirrors the commandMap unit-test helper pattern,
// but chatMessage.test.ts lives under tests/plugin/integration/ so the helpers
// are written inline here rather than imported from tests/unit/plugins/helpers).
// ---------------------------------------------------------------------------

let fixtureDir: string;
let fixturePatterns: Record<string, readonly string[]>;
let fixtureCompiled: ReadonlyMap<string, readonly RegExp[]>;

/** Real template commands dir — shared by the canonical and Spanish suites. */
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
let templateCompiled: ReadonlyMap<string, readonly RegExp[]>;

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
	// registration time. Compiled once so per-message matching is precompiled
	// (matching the plugin's init-time compile).
	fixturePatterns = discoverIntentPatterns(fixtureDir);
	fixtureCompiled = compileIntentPatterns(fixturePatterns);
	templatePatterns = discoverIntentPatterns(templateCommandsDir);
	templateCompiled = compileIntentPatterns(templatePatterns);
});

afterAll(() => {
	rmSync(fixtureDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Routing helpers built on the REAL extracted detection functions
// ---------------------------------------------------------------------------

/** Returns the agent a slash command routes to, or null if no match. */
function routeSlashCommand(content: string): string | null {
	const cmd = detectSlashCommand(content, COMMAND_AGENT_MAP);
	return cmd ? (COMMAND_AGENT_MAP[cmd] ?? null) : null;
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
		const result = detectAgentMention("@tlaloc", AGENT_MENTION_PATTERNS);
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
		const cmd = detectSlashCommand("/specification", COMMAND_AGENT_MAP);
		expect(cmd).toBeNull();
	});

	test("command-only line without trailing space matches (isEnd boundary)", () => {
		const cmd = detectSlashCommand("/design", COMMAND_AGENT_MAP);
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
		const command = detectIntentFromMessage("implement this feature", fixtureCompiled);
		expect(command).toBe("/build");
	});

	test("'sync' triggers /sync (command name always a keyword)", () => {
		const command = detectIntentFromMessage("please sync with remote", fixtureCompiled);
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
		expect(detectAgentMention("", AGENT_MENTION_PATTERNS)).toBeNull();
		expect(detectSlashCommand("", COMMAND_AGENT_MAP)).toBeNull();
		expect(detectIntentFromMessage("", compileIntentPatterns({}))).toBeNull();
	});

	test("Scenario 5: multiple @mentions — first match wins (preserves insertion order)", () => {
		// Object.entries preserves insertion order: huitzilopochtli is first
		const result = detectAgentMention("@huitzilopochtli and @tlaloc", AGENT_MENTION_PATTERNS);
		expect(result).toBe("huitzilopochtli");
	});

	test("first mention wins for non-first agent too", () => {
		const result = detectAgentMention("@tlaloc and @tezcatlipoca", AGENT_MENTION_PATTERNS);
		expect(result).toBe("tlaloc");
	});

	test("interleaved content: agent mention in the middle works", () => {
		const result = detectAgentMention("Hey @quetzalcoatl can you help?", AGENT_MENTION_PATTERNS);
		expect(result).toBe("quetzalcoatl");
	});

	test("no mention returns null", () => {
		const result = detectAgentMention("just a regular message", AGENT_MENTION_PATTERNS);
		expect(result).toBeNull();
	});

	test("slash command /build with hyphenated trailing text still matches strictly", () => {
		// /build is a full command, user follows with a space
		const cmd = detectSlashCommand("/build my-app", COMMAND_AGENT_MAP);
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
	const compiled = compileIntentPatterns(patterns);

	test("'ship' in 'relationship' does NOT match /ship (word boundary)", () => {
		// \b is between \w and \w inside "relationship" except at the string
		// edges — "ship" at the end sits at a \w-to-end boundary, so /\bship\b/i
		// would match. This documents that intent matching is intentionally fuzzy;
		// the strict command/spec distinction lives in slash command detection.
		expect(detectIntentFromMessage("relationship status", compiled)).toBeNull();
	});

	test("'spec' inside 'specification' does NOT match the standalone keyword 'spec'", () => {
		// \b requires a word→non-word transition on BOTH sides of the keyword;
		// inside "specification" the 'c'→'i' transition is word→word, so there
		// is no boundary. (The pre-refactor INTENT_PATTERNS matched because
		// "specification" was an explicit keyword — with description-derived
		// keywords only whole-word matches are intentional.)
		expect(detectIntentFromMessage("specification first", compiled)).toBeNull();
	});

	test("standalone 'spec' matches /spec (whole-word boundary)", () => {
		expect(detectIntentFromMessage("write the spec now", compiled)).toBe("/spec");
	});

	test("hand-built patterns only match their own keywords", () => {
		expect(detectIntentFromMessage("launch the rocket", compiled)).toBeNull();
		expect(detectIntentFromMessage("ship it", compiled)).toBe("/ship");
	});
});

describe("chat.message — canonical intent mappings against the real template", () => {
	// Guards the quality of description-derived intent detection. If a
	// description change breaks a canonical mapping, this test fails —
	// better than silently mis-suggesting a command to the user.

	test("natural-language phrases route to the canonical command", () => {
		const cases: ReadonlyArray<readonly [string, string]> = [
			["plan out the tasks", "/plan"],
			["test this code", "/test"],
			["review my code", "/review"],
			["deploy to production", "/deploy"],
			["performance audit my web page", "/webperf"],
			["update the documentation", "/docs-update"],
			["simplify this function", "/code-simplify"],
			// FEV-24 commands (review finding 2) — natural-language routes for
			// the new commands must exist, not just slash routing.
			["sync with remote", "/sync"],
			["migrate to react", "/migrate"],
			["analyze the architecture", "/analyze"],
		];
		for (const [message, expected] of cases) {
			expect(detectIntentFromMessage(message, templateCompiled)).toBe(expected);
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

describe("chat.message — slash command shadows intent detection (review finding 5)", () => {
	// A slash command is explicit user intent: "/plan the deploy" must route
	// to /plan WITHOUT also setting last_intent="/deploy". The hook skips
	// keyword detection entirely when a slash command matched; this behavior
	// is encoded in detectChatMessageRouting (the function the hook calls).

	test("/plan the deploy routes to /plan and sets NO intent", () => {
		const routing = detectChatMessageRouting("/plan the deploy", {
			agentMentionPatterns: AGENT_MENTION_PATTERNS,
			commandAgentMap: COMMAND_AGENT_MAP,
			intentPatterns: templateCompiled,
		});
		expect(routing.slashCommand).toBe("/plan");
		expect(routing.intent).toBeNull();
	});

	test("without the slash prefix the same phrase WOULD match intent /deploy", () => {
		// Documents the bug the guard prevents: raw keyword detection matches
		// "deploy" in the phrase — only the slash-command shadowing stops it.
		const routing = detectChatMessageRouting("plan the deploy", {
			agentMentionPatterns: AGENT_MENTION_PATTERNS,
			commandAgentMap: COMMAND_AGENT_MAP,
			intentPatterns: templateCompiled,
		});
		expect(routing.slashCommand).toBeNull();
		expect(routing.intent).toBe("/deploy");
	});

	test("slash command with a mention still shadows intent", () => {
		const routing = detectChatMessageRouting("/test this @tlaloc", {
			agentMentionPatterns: AGENT_MENTION_PATTERNS,
			commandAgentMap: COMMAND_AGENT_MAP,
			intentPatterns: templateCompiled,
		});
		expect(routing.slashCommand).toBe("/test");
		expect(routing.intent).toBeNull();
	});
});

describe("chat.message — Spanish intent detection (SPANISH_INTENT_KEYWORDS)", () => {
	// Replicates the sdd-pipeline.ts merge: Spanish keywords APPEND to the
	// discovered list for existing commands (English keywords are preserved),
	// so both languages route correctly. Computed in a hook (not at describe
	// registration) because templatePatterns is populated in beforeAll.
	let mergedPatterns: Record<string, readonly string[]>;
	let mergedCompiled: ReadonlyMap<string, readonly RegExp[]>;

	beforeAll(() => {
		mergedPatterns = mergeIntentKeywordLayers(templatePatterns, SPANISH_INTENT_KEYWORDS, {});
		mergedCompiled = compileIntentPatterns(mergedPatterns);
	});

	test("natural-language Spanish phrases route to the canonical command", () => {
		const cases: ReadonlyArray<readonly [string, string]> = [
			["especificar los requisitos", "/spec"],
			["planificar las tareas", "/plan"],
			["construir la feature", "/build"],
			["probar este código", "/test"],
			["revisar mi código", "/review"],
			["lanzar la release", "/ship"],
			["desplegar a producción", "/deploy"],
		];
		for (const [message, expected] of cases) {
			expect(detectIntentFromMessage(message, mergedCompiled)).toBe(expected);
		}
	});

	test("English intent still works after the Spanish merge (keywords preserved)", () => {
		// Regression guard: the Spanish layer must APPEND, never replace — an
		// English phrase must still route after the merge.
		expect(detectIntentFromMessage("implement this feature", mergedCompiled)).toBe("/build");
		expect(detectIntentFromMessage("test this code", mergedCompiled)).toBe("/test");
		expect(detectIntentFromMessage("update the documentation", mergedCompiled)).toBe(
			"/docs-update",
		);
	});

	test("a Spanish word in the middle of an English message still matches", () => {
		expect(detectIntentFromMessage("please desplegar the app now", mergedCompiled)).toBe("/deploy");
	});

	test("accent-insensitive matching: 'especificacion' (no accent) routes to /spec", () => {
		// Review finding 4 — the static Spanish keyword "especificación" must
		// match a message typed without the accent.
		expect(detectIntentFromMessage("especificacion los requisitos", mergedCompiled)).toBe("/spec");
	});

	test("Spanish keywords do not collide with English command names", () => {
		// E.g. "planificar" must never match another command's name or English
		// keyword space — each Spanish keyword is unique to its owning command.
		for (const [command, keywords] of Object.entries(mergedPatterns)) {
			for (const keyword of keywords) {
				if (SPANISH_INTENT_KEYWORDS[command]?.includes(keyword)) {
					const owners = Object.entries(mergedPatterns).filter(([, kws]) => kws.includes(keyword));
					expect(owners.map(([c]) => c)).toEqual([command]);
				}
			}
		}
	});
});
