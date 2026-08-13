// ---------------------------------------------------------------------------
// intentDiscovery.test.ts — Unit tests for intent discovery + merge layers
//
// Covers:
//   - normalizeText / compileIntentPatterns / detectIntentFromMessage
//     (diacritics-insensitive matching, FEV review finding 4 + 7)
//   - mergeIntentKeywordLayers 3-layer semantics against the REAL template
//     command descriptions (review finding 3)
//   - override footgun warning when a command's own name keyword is dropped
//     (review finding 6)
// ---------------------------------------------------------------------------

import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { compileIntentPatterns, detectIntentFromMessage, normalizeText } from "../chatMessage";
import { discoverIntentPatterns, mergeIntentKeywordLayers } from "../intentDiscovery";
import { SPANISH_INTENT_KEYWORDS } from "../spanishIntents";

// The unit suite lives under the plugin src tree; the template command
// descriptions are the live data the merge assertions are meant to guard.
const templateCommandsDir = join(import.meta.dir, "..", "..", "..", "..", "commands");

describe("normalizeText — diacritics-insensitive normalization", () => {
	test("strips accents: 'especificación' → 'especificacion'", () => {
		expect(normalizeText("especificación")).toBe("especificacion");
	});

	test("strips accents from mixed text: 'códice' → 'codice'", () => {
		expect(normalizeText("códice")).toBe("codice");
	});

	test("leaves plain ASCII unchanged", () => {
		expect(normalizeText("spec sync plan")).toBe("spec sync plan");
	});

	test("does not lowercase (case handled by the 'i' flag)", () => {
		expect(normalizeText("Especificación")).toBe("Especificacion");
	});
});

describe("compileIntentPatterns — precompiled keyword regexes", () => {
	test("returns a Map with the same command keys", () => {
		const compiled = compileIntentPatterns({ "/spec": ["spec"], "/build": ["build"] });
		expect([...compiled.keys()]).toEqual(["/spec", "/build"]);
	});

	test("values are precompiled RegExp instances (built once, not per message)", () => {
		const compiled = compileIntentPatterns({ "/spec": ["especificación"] });
		const patterns = compiled.get("/spec");
		expect(patterns).toBeDefined();
		expect(patterns![0]).toBeInstanceOf(RegExp);
	});

	test("compiled regexes match normalized text (accent-insensitive)", () => {
		const compiled = compileIntentPatterns({ "/spec": ["especificación"] });
		const patterns = compiled.get("/spec")!;
		// The regex is built from the accent-stripped keyword, so it matches
		// normalized text; detectIntentFromMessage normalizes the raw message
		// before testing (covered by the routing tests below).
		expect(patterns[0]!.test("especificacion")).toBe(true);
		expect(patterns[0]!.test(normalizeText("especificación"))).toBe(true);
	});
});

describe("detectIntentFromMessage — accent-insensitive routing", () => {
	// Spanish keyword "especificación" stored WITH accent must match a
	// user message typed WITHOUT accent — review finding 4.
	test("'especificacion' (no accent) routes to /spec", () => {
		const compiled = compileIntentPatterns({ "/spec": ["especificación"] });
		expect(detectIntentFromMessage("especificacion los requisitos", compiled)).toBe("/spec");
	});

	test("'especificación' (with accent) still routes to /spec", () => {
		const compiled = compileIntentPatterns({ "/spec": ["especificación"] });
		expect(detectIntentFromMessage("especificación los requisitos", compiled)).toBe("/spec");
	});

	test("no keyword match returns null", () => {
		const compiled = compileIntentPatterns({ "/spec": ["spec"] });
		expect(detectIntentFromMessage("irrelevant chatter", compiled)).toBeNull();
	});
});

describe("mergeIntentKeywordLayers — 3-layer merge against real template data", () => {
	// Review finding 3: the discovered + Spanish + user-override composition
	// must be exercised against the REAL template command descriptions, not a
	// hand-built fixture — a description edit would silently change semantics.
	const realDiscovered = discoverIntentPatterns(templateCommandsDir);

	test("override REPLACES the whole keyword list for the key (no keyword merge)", () => {
		const warnMessages: string[] = [];
		const merged = mergeIntentKeywordLayers(
			realDiscovered,
			SPANISH_INTENT_KEYWORDS,
			{ "/deploy": ["custom"] },
			(msg) => warnMessages.push(msg),
		);

		expect(merged["/deploy"]).toEqual(["custom"]);
		// Non-overridden commands keep discovered + Spanish keywords.
		expect(merged["/spec"]).toContain("spec");
		expect(merged["/spec"]).toContain("especificación");
		expect(merged["/sync"]).toContain("sync");
		// The override dropped /deploy's own name → footgun warning fires.
		expect(warnMessages.some((m) => m.includes("/deploy") && m.includes("deploy"))).toBe(true);
	});

	test("discovered baseline and Spanish extensions survive untouched overrides", () => {
		const merged = mergeIntentKeywordLayers(realDiscovered, SPANISH_INTENT_KEYWORDS, {});
		// English keyword from the description.
		expect(merged["/build"]).toContain("implement");
		// Spanish keyword appended by the extension layer.
		expect(merged["/build"]).toContain("construir");
	});

	test("real merged patterns route canonical English + Spanish phrases", () => {
		const merged = mergeIntentKeywordLayers(realDiscovered, SPANISH_INTENT_KEYWORDS, {});
		const compiled = compileIntentPatterns(merged);
		expect(detectIntentFromMessage("implement this feature", compiled)).toBe("/build");
		expect(detectIntentFromMessage("desplegar a producción", compiled)).toBe("/deploy");
	});
});

describe("mergeIntentKeywordLayers — override footgun warning (finding 6)", () => {
	test("warns when an override omits the command's own name keyword", () => {
		const warnMessages: string[] = [];
		mergeIntentKeywordLayers({}, {}, { "/spec": ["especificar"] }, (msg) => warnMessages.push(msg));
		expect(warnMessages.length).toBe(1);
		expect(warnMessages[0]).toContain("/spec");
		expect(warnMessages[0]).toContain("spec");
	});

	test("no warning when the override keeps the command's own name keyword", () => {
		const warnMessages: string[] = [];
		mergeIntentKeywordLayers({}, {}, { "/spec": ["spec", "especificar"] }, (msg) =>
			warnMessages.push(msg),
		);
		expect(warnMessages).toEqual([]);
	});

	test("case-insensitive: 'Spec' counts as the own name keyword", () => {
		const warnMessages: string[] = [];
		mergeIntentKeywordLayers({}, {}, { "/spec": ["Spec"] }, (msg) => warnMessages.push(msg));
		expect(warnMessages).toEqual([]);
	});

	test("warns for custom commands whose synonyms omit the command name", () => {
		const warnMessages: string[] = [];
		mergeIntentKeywordLayers({}, {}, { "/my-cmd": ["custom"] }, (msg) => warnMessages.push(msg));
		expect(warnMessages.length).toBe(1);
		expect(warnMessages[0]).toContain("my-cmd");
	});
});
