// ---------------------------------------------------------------------------
// configLoader.test.ts — Unit tests for loadSddConfig()
//
// Uses real temp directories (no mocks) to verify filesystem interactions,
// and captures process.stderr.write for validation warning checking —
// logWarning() writes to stderr (not console.warn) to satisfy the
// noConsole lint rule.
// ---------------------------------------------------------------------------

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSddConfig } from "../configLoader";
import { DEFAULT_SDD_PIPELINE_CONFIG } from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Writes a JSON file at path relative to tempDir. */
function writeJson(relativePath: string, data: unknown): void {
	writeFileSync(join(tempDir, relativePath), JSON.stringify(data, null, 2));
}

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

let tempDir: string;
let warnMessages: string[];
let origStderrWrite: typeof process.stderr.write;

beforeEach(() => {
	tempDir = mkdtempSync(join(tmpdir(), "config-loader-test-"));
	warnMessages = [];
	origStderrWrite = process.stderr.write;
	process.stderr.write = ((...args: unknown[]) => {
		warnMessages.push(args.map(String).join(" "));
		return true;
	}) as typeof process.stderr.write;
});

afterEach(() => {
	process.stderr.write = origStderrWrite;
	rmSync(tempDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("configLoader.ts — loadSddConfig()", () => {
	// ── Scenario 1: Valid full config ─────────────────────────────────────────
	test("1. Valid opencode.json with full sddPipeline → merged config", () => {
		writeJson("opencode.json", {
			sddPipeline: {
				commandPhaseMap: {
					"/spec": "plan",
					"/custom-cmd": "build",
				},
				intentPatterns: {
					"/custom-cmd": ["custom keyword", "otro keyword"],
					"/spec": ["override spec keyword"],
				},
				phaseSuggestions: {
					build: {
						tlaloc: "Custom build suggestion for tlaloc.",
					},
				},
			},
		});

		const result = loadSddConfig(tempDir);

		// commandPhaseMap: default keys preserved, user overrides applied, new keys added
		expect(result.commandPhaseMap!["/spec"]).toBe("plan"); // user override
		expect(result.commandPhaseMap!["/custom-cmd"]).toBe("build"); // new user entry
		expect(result.commandPhaseMap!["/build"]).toBe("build"); // default preserved
		expect(result.commandPhaseMap!["/test"]).toBe("verify"); // default preserved

		// intentPatterns: default keys preserved, user overrides applied, new keys added
		expect(result.intentPatterns!["/custom-cmd"]).toEqual(["custom keyword", "otro keyword"]);
		expect(result.intentPatterns!["/spec"]).toEqual(["override spec keyword"]);
		expect(result.intentPatterns!["/build"]).toBeDefined(); // default preserved
		expect(result.intentPatterns!["/build"]!.includes("build")).toBe(true);

		// phaseSuggestions: default keys preserved, user overrides applied at agent level
		expect(result.phaseSuggestions!.build!.tlaloc).toBe("Custom build suggestion for tlaloc.");
		expect(result.phaseSuggestions!.build!.huitzilopochtli).toBeDefined(); // default preserved
		expect(result.phaseSuggestions!.define).toBeDefined(); // default phase preserved
	});

	// ── Scenario 2: Partial config ────────────────────────────────────────────
	test("2. Valid opencode.json with partial sddPipeline → merged with defaults", () => {
		writeJson("opencode.json", {
			sddPipeline: {
				commandPhaseMap: {
					"/custom-cmd": "build",
				},
			},
		});

		const result = loadSddConfig(tempDir);

		// commandPhaseMap has defaults + user additions
		expect(result.commandPhaseMap!["/custom-cmd"]).toBe("build");
		expect(result.commandPhaseMap!["/spec"]).toBe("define");
		expect(result.commandPhaseMap!["/build"]).toBe("build");
		expect(result.commandPhaseMap!["/ship"]).toBe("ship");

		// intentPatterns = full defaults
		expect(result.intentPatterns!["/spec"]).toBeDefined();
		expect(result.intentPatterns!["/build"]!.includes("build")).toBe(true);

		// phaseSuggestions = full defaults
		expect(result.phaseSuggestions!.define).toBeDefined();
		expect(result.phaseSuggestions!.ship).toBeDefined();
	});

	// ── Scenario 3: Missing sddPipeline key ───────────────────────────────────
	test("3. opencode.json without sddPipeline key → returns defaults", () => {
		writeJson("opencode.json", {
			someOtherKey: "value",
			nested: { irrelevant: true },
		});

		const result = loadSddConfig(tempDir);

		expect(result).toEqual(DEFAULT_SDD_PIPELINE_CONFIG);
		expect(warnMessages.length).toBe(0);
	});

	// ── Scenario 4: Missing opencode.json ─────────────────────────────────────
	test("4. Missing opencode.json → returns defaults", () => {
		const result = loadSddConfig(tempDir);

		expect(result).toEqual(DEFAULT_SDD_PIPELINE_CONFIG);
		expect(warnMessages.length).toBe(0);
	});

	// ── Scenario 5: Invalid JSON ──────────────────────────────────────────────
	test("5. Invalid JSON in opencode.json → logs warning, returns defaults", () => {
		writeFileSync(join(tempDir, "opencode.json"), "this is not json {{{", "utf-8");

		const result = loadSddConfig(tempDir);

		expect(result).toEqual(DEFAULT_SDD_PIPELINE_CONFIG);
		expect(warnMessages.length).toBeGreaterThanOrEqual(1);
		expect(warnMessages[0]).toContain("Invalid or unreadable");
	});

	// ── Scenario 6: Invalid phase in commandPhaseMap ──────────────────────────
	test("6. Invalid phase in commandPhaseMap → skips entry, logs warning", () => {
		writeJson("opencode.json", {
			sddPipeline: {
				commandPhaseMap: {
					"/good-cmd": "build",
					"/bad-cmd": "invalid-phase",
					"/another-bad": "deploy",
				},
			},
		});

		const result = loadSddConfig(tempDir);

		// Valid entry is present
		expect(result.commandPhaseMap!["/good-cmd"]).toBe("build");
		// Invalid entries are skipped
		expect(result.commandPhaseMap!["/bad-cmd"]).toBeUndefined();
		expect(result.commandPhaseMap!["/another-bad"]).toBeUndefined();
		// Defaults preserved
		expect(result.commandPhaseMap!["/spec"]).toBe("define");
		// Warnings logged
		expect(warnMessages.length).toBeGreaterThanOrEqual(2);
		expect(warnMessages.some((m) => m.includes("invalid-phase"))).toBe(true);
		expect(warnMessages.some((m) => m.includes("deploy"))).toBe(true);
	});

	// ── Scenario 7: Intent pattern key without leading "/" ────────────────────
	test("7. Intent pattern key without leading / → skips entry, logs warning", () => {
		writeJson("opencode.json", {
			sddPipeline: {
				intentPatterns: {
					"/valid-cmd": ["some keyword"],
					"bad-key-no-slash": ["should be skipped"],
					another_bad: ["also skipped"],
				},
			},
		});

		const result = loadSddConfig(tempDir);

		// Valid entry present
		expect(result.intentPatterns!["/valid-cmd"]).toEqual(["some keyword"]);
		// Invalid entries skipped
		expect(result.intentPatterns!["bad-key-no-slash"]).toBeUndefined();
		expect(result.intentPatterns!.another_bad).toBeUndefined();
		// Defaults preserved
		expect(result.intentPatterns!["/spec"]).toBeDefined();
		// Warnings logged
		expect(warnMessages.length).toBeGreaterThanOrEqual(2);
		expect(warnMessages.some((m) => m.includes("bad-key-no-slash"))).toBe(true);
		expect(warnMessages.some((m) => m.includes("another_bad"))).toBe(true);
	});

	// ── Scenario 8: Invalid phase in phaseSuggestions ─────────────────────────
	test("8. Invalid phase in phaseSuggestions → skips entry, logs warning", () => {
		writeJson("opencode.json", {
			sddPipeline: {
				phaseSuggestions: {
					build: { tlaloc: "Custom build suggestion." },
					"not-a-phase": { someAgent: "Should be skipped" },
					"also-bad": { anotherAgent: "Also skipped" },
				},
			},
		});

		const result = loadSddConfig(tempDir);

		// Valid phase entry merged
		expect(result.phaseSuggestions!.build!.tlaloc).toBe("Custom build suggestion.");
		expect(result.phaseSuggestions!.build!.huitzilopochtli).toBeDefined(); // default preserved
		// Invalid entries skipped
		expect(result.phaseSuggestions!["not-a-phase"]).toBeUndefined();
		expect(result.phaseSuggestions!["also-bad"]).toBeUndefined();
		// Default phases preserved
		expect(result.phaseSuggestions!.define).toBeDefined();
		expect(result.phaseSuggestions!.ship).toBeDefined();
		// Warnings logged
		expect(warnMessages.length).toBeGreaterThanOrEqual(2);
		expect(warnMessages.some((m) => m.includes("not-a-phase"))).toBe(true);
		expect(warnMessages.some((m) => m.includes("also-bad"))).toBe(true);
	});

	// ── Scenario 9: Empty sddPipeline object ──────────────────────────────────
	test("9. Empty sddPipeline object → returns defaults", () => {
		writeJson("opencode.json", {
			sddPipeline: {},
		});

		const result = loadSddConfig(tempDir);

		expect(result).toEqual(DEFAULT_SDD_PIPELINE_CONFIG);
		expect(warnMessages.length).toBe(0);
	});

	// ── Scenario 10: sddPipeline: null ───────────────────────────────────────
	test("10. sddPipeline: null → returns defaults", () => {
		writeJson("opencode.json", {
			sddPipeline: null,
		});

		const result = loadSddConfig(tempDir);

		expect(result).toEqual(DEFAULT_SDD_PIPELINE_CONFIG);
		expect(warnMessages.length).toBe(0);
	});
});
