import { describe, expect, test } from "bun:test";
import {
	AGENT_MENTION_PATTERNS,
	COMMAND_AGENT_MAP,
	COMMAND_PHASE_MAP,
	DEFAULTS,
	DESTRUCTIVE_PATTERNS,
	INTENT_PATTERNS,
	PHASE_SUGGESTIONS,
	PRIMARY_AGENTS,
} from "../defaults";

describe("defaults.ts — all 5 named exports exist and are non-empty", () => {
	test("COMMAND_AGENT_MAP is a non-empty Record<string, string>", () => {
		expect(COMMAND_AGENT_MAP).toBeDefined();
		expect(Object.keys(COMMAND_AGENT_MAP).length).toBeGreaterThan(0);
	});

	test("INTENT_PATTERNS is a non-empty Record<string, string[]>", () => {
		expect(INTENT_PATTERNS).toBeDefined();
		expect(Object.keys(INTENT_PATTERNS).length).toBeGreaterThan(0);
	});

	test("COMMAND_PHASE_MAP is a non-empty Record<string, string>", () => {
		expect(COMMAND_PHASE_MAP).toBeDefined();
		expect(Object.keys(COMMAND_PHASE_MAP).length).toBeGreaterThan(0);
	});

	test("PHASE_SUGGESTIONS is a non-empty Record<string, Record<string, string>>", () => {
		expect(PHASE_SUGGESTIONS).toBeDefined();
		expect(Object.keys(PHASE_SUGGESTIONS).length).toBeGreaterThan(0);
	});

	test("AGENT_MENTION_PATTERNS is a non-empty Record<string, RegExp[]>", () => {
		expect(AGENT_MENTION_PATTERNS).toBeDefined();
		expect(Object.keys(AGENT_MENTION_PATTERNS).length).toBeGreaterThan(0);
	});
});

describe("defaults.ts — DESTRUCTIVE_PATTERNS is exported separately (not in DEFAULTS)", () => {
	test("DESTRUCTIVE_PATTERNS is a non-empty readonly RegExp[]", () => {
		expect(DESTRUCTIVE_PATTERNS).toBeDefined();
		expect(DESTRUCTIVE_PATTERNS.length).toBeGreaterThan(0);
		// Verify all entries are RegExp instances
		for (const pattern of DESTRUCTIVE_PATTERNS) {
			expect(pattern).toBeInstanceOf(RegExp);
		}
	});

	test("DESTRUCTIVE_PATTERNS is NOT part of DEFAULTS", () => {
		const keys = Object.keys(DEFAULTS);
		expect(keys).not.toContain("DESTRUCTIVE_PATTERNS");
	});
});

describe("defaults.ts — DEFAULTS object exposes all 5 canonical maps", () => {
	test("DEFAULTS has exactly the expected keys", () => {
		const expected = [
			"COMMAND_AGENT_MAP",
			"INTENT_PATTERNS",
			"COMMAND_PHASE_MAP",
			"PHASE_SUGGESTIONS",
			"AGENT_MENTION_PATTERNS",
		] as const;
		for (const key of expected) {
			expect(DEFAULTS).toHaveProperty(key);
		}
		expect(Object.keys(DEFAULTS)).toHaveLength(expected.length);
	});
});

describe("defaults.ts — spot-check known keys", () => {
	test("COMMAND_AGENT_MAP has expected commands", () => {
		expect(COMMAND_AGENT_MAP["/spec"]).toBe("quetzalcoatl");
		expect(COMMAND_AGENT_MAP["/build"]).toBe("tlaloc");
		expect(COMMAND_AGENT_MAP["/ship"]).toBe("mictlantecuhtli");
	});

	test("COMMAND_PHASE_MAP has expected phase mappings", () => {
		expect(COMMAND_PHASE_MAP["/spec"]).toBe("define");
		expect(COMMAND_PHASE_MAP["/build"]).toBe("build");
		expect(COMMAND_PHASE_MAP["/ship"]).toBe("ship");
	});

	test("PRIMARY_AGENTS contains the canonical primary agents", () => {
		// Guards the only remaining hardcoded list — the 6 built-in agents
		// that stay valid even when no agents/ directory exists.
		expect(PRIMARY_AGENTS).toHaveLength(6);
		expect(PRIMARY_AGENTS).toContain("huitzilopochtli");
		expect(PRIMARY_AGENTS).toContain("quetzalcoatl");
		expect(PRIMARY_AGENTS).toContain("tlaloc");
	});

	test("INTENT_PATTERNS contains expected commands", () => {
		expect(INTENT_PATTERNS["/build"]).toBeDefined();
		expect(INTENT_PATTERNS["/build"].length).toBeGreaterThan(0);
		expect(INTENT_PATTERNS["/build"].includes("build")).toBe(true);
		expect(INTENT_PATTERNS["/test"].includes("test")).toBe(true);
	});

	test("AGENT_MENTION_PATTERNS contains expected agent keys", () => {
		expect(AGENT_MENTION_PATTERNS).toHaveProperty("huitzilopochtli");
		expect(AGENT_MENTION_PATTERNS).toHaveProperty("tezcatlipoca");
	});

	test("PHASE_SUGGESTIONS contains expected phase keys", () => {
		expect(PHASE_SUGGESTIONS).toHaveProperty("idle");
		expect(PHASE_SUGGESTIONS).toHaveProperty("define");
		expect(PHASE_SUGGESTIONS).toHaveProperty("build");
		expect(PHASE_SUGGESTIONS).toHaveProperty("ship");
	});
});

describe("defaults.ts — DESTRUCTIVE_PATTERNS spot-check", () => {
	const blocks = (cmd: string) => DESTRUCTIVE_PATTERNS.some((p) => p.test(cmd));

	test("blocks representative destructive commands", () => {
		// Filesystem
		expect(blocks("rm -rf /")).toBe(true);
		expect(blocks("shred file")).toBe(true);
		// Git
		expect(blocks("git push --force origin main")).toBe(true);
		// SQL
		expect(blocks("DROP TABLE users")).toBe(true);
	});

	test("allows non-destructive commands", () => {
		expect(blocks("ls -la")).toBe(false);
		expect(blocks("git push origin main")).toBe(false);
		expect(blocks("SELECT * FROM users")).toBe(false);
	});
});
