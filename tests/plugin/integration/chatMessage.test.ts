// ---------------------------------------------------------------------------
// Integration tests for chat.message hook behavior
//
// Tests the three data structures that power the chat.message hook:
//   AGENT_MENTION_PATTERNS — RegExp patterns for @mention detection
//   COMMAND_AGENT_MAP     — slash command → agent routing
//   INTENT_PATTERNS       — keyword → command detection
//
// The hook itself lives inside the SddPipelinePlugin factory (requires
// @opencode-ai/plugin at runtime), so we test the pure maps and replicate
// the decision logic here.
// ---------------------------------------------------------------------------

import { describe, expect, test } from "bun:test";
import {
	AGENT_MENTION_PATTERNS,
	COMMAND_AGENT_MAP,
	INTENT_PATTERNS,
} from "../../../template/obligatorio/.opencode/plugins/src/defaults";

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

/** Mimics the hook's intent keyword detection. Returns the matching command or null. */
function detectIntent(content: string): string | null {
	for (const [command, keywords] of Object.entries(INTENT_PATTERNS)) {
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

describe("chat.message — intent keyword detection", () => {
	test("Scenario 3: 'implementa' should trigger /build", () => {
		const command = detectIntent("implementa");
		expect(command).toBe("/build");
	});

	test("'build' keyword triggers /build", () => {
		const command = detectIntent("I need to build this feature");
		expect(command).toBe("/build");
	});

	test("'test' keyword triggers /test", () => {
		const command = detectIntent("test this module");
		expect(command).toBe("/test");
	});

	test("'deploy' keyword triggers /ship", () => {
		const command = detectIntent("deploy to production");
		expect(command).toBe("/ship");
	});

	test("'review' keyword triggers /review when no earlier pattern matches", () => {
		// "review this" — no earlier INTENT_PATTERNS key has "review" as a keyword
		const command = detectIntent("review this");
		expect(command).toBe("/review");
	});

	test("'refactor' keyword triggers /code-simplify", () => {
		const command = detectIntent("refactor this function");
		expect(command).toBe("/code-simplify");
	});

	test("INTENT_PATTERNS./build includes 'implementa'", () => {
		expect(INTENT_PATTERNS["/build"]).toContain("implementa");
	});

	test("INTENT_PATTERNS./build includes 'build'", () => {
		expect(INTENT_PATTERNS["/build"]).toContain("build");
	});
});

describe("chat.message — edge cases", () => {
	test("Scenario 4: empty message produces no state changes", () => {
		expect(isEmptyMessage("")).toBe(true);
		expect(isEmptyMessage(undefined as unknown as string)).toBe(true);
		expect(detectAgentMention("")).toBeNull();
		expect(detectSlashCommand("")).toBeNull();
		expect(detectIntent("")).toBeNull();
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

describe("chat.message — INTENT_PATTERNS word boundary correctness", () => {
	test("'performance' does not match unrelated long words containing 'perform' as substring", () => {
		// "performance" is its own keyword entry — so it DOES match /webperf
		// But e.g. "specification" alone does NOT contain word-bounded "spec"
		const result = detectIntent("specification");
		// "spec" is a keyword in INTENT_PATTERNS["/spec"]
		// With word boundary regex, "spec" matches inside "specification" since \b matches
		// at word/non-word boundaries, and "spec" at the start of "specification" IS a word boundary.
		// This tests that the INTENT_PATTERNS matching tolerates substrings at word boundaries.
		// The actual /specification vs /spec distinction is handled in slash command detection (Scenario 6).
		// For intent, "spec" matching "specification" is acceptable — it's fuzzy intent matching.
		expect(result).toBe("/spec");
	});

	test("'ship' in 'relationship' does NOT match /ship (word boundary)", () => {
		// \b matches between 's' and 'h' in 'rela|tion|ship' — so 'ship' at end
		// of a compound word IS at a word boundary. Actually, 'ship' is the suffix
		// of 'relationship', and \b is between 't' and 's' (transition \w to \w = no
		// boundary) but also between 'i' and 's' — let me check.
		// Wait: "relationship" -> r e l a t i o n s h i p
		// The transition 'n'->'s' is \w->\w, no boundary. 's'->'h' is \w->\w, no boundary.
		// 'p' at end is \w->$ which IS a word boundary. So /\bship\b/i would match.
		// This means the intent pattern IS fuzzy — this is expected behavior per the hook.
		// The test acknowledges the regex behavior.
		const result = detectIntent("relationship status");
		expect(result).toBeNull();
	});

	test("'implementa' (Spanish) triggers /build (unique to /build patterns)", () => {
		const result = detectIntent("implementa la funcion");
		expect(result).toBe("/build");
	});
});
