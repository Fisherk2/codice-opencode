// ---------------------------------------------------------------------------
// stopwords.test.ts — Unit tests for the STOPWORDS merged stopword set
//
// Directly validates the English + Spanish entries (previously only covered
// indirectly through deriveIntentKeywords) and proves the filtering contract:
// tokens < 3 chars are dropped by length, and function words are dropped by
// the set, while command-name keywords always survive.
// ---------------------------------------------------------------------------

import { describe, expect, test } from "bun:test";
import { STOPWORDS } from "../stopwords";

/**
 * Mirror of the production filter in intentDiscovery.ts (deriveIntentKeywords):
 * Unicode-aware tokenization, drop tokens shorter than 3 chars or in STOPWORDS.
 */
function filterSentence(sentence: string): string[] {
	return sentence
		.toLowerCase()
		.split(/[^\p{L}\p{N}]+/u)
		.filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("stopwords.ts — STOPWORDS set contents", () => {
	test("1. Exports a Set instance", () => {
		expect(STOPWORDS).toBeInstanceOf(Set);
	});

	test("2. Contains the documented English function words", () => {
		// Sample of the ENGLISH_STOPWORDS list — articles, prepositions,
		// pronouns, conjunctions, auxiliaries, and the generic nouns/verbs.
		for (const word of [
			"the",
			"and",
			"for",
			"with",
			"from",
			"into",
			"that",
			"this",
			"which",
			"would",
			"new",
			"run",
			"get",
			"use",
			"code",
			"how",
			"what",
			"about",
			"between",
			"every",
			"each",
			"should",
			"could",
			"also",
		]) {
			expect(STOPWORDS.has(word)).toBe(true);
		}
	});

	test("3. Contains the documented Spanish function words (with accents)", () => {
		// Sample of the SPANISH_STOPWORDS list — articles, prepositions,
		// conjunctions, and accent-carrying variants.
		for (const word of [
			"que",
			"para",
			"con",
			"por",
			"una",
			"los",
			"las",
			"del",
			"como",
			"más",
			"también",
			"solo",
			"sólo",
			"muy",
			"cada",
			"todo",
			"todos",
			"otro",
			"otros",
			"mismo",
			"misma",
			"nuevo",
			"nueva",
			"nuestro",
			"nuestra",
		]) {
			expect(STOPWORDS.has(word)).toBe(true);
		}
	});

	test("4. Merges both languages into one set", () => {
		expect(STOPWORDS.has("the")).toBe(true); // English
		expect(STOPWORDS.has("que")).toBe(true); // Spanish
		expect(STOPWORDS.has("with")).toBe(true); // English
		expect(STOPWORDS.has("desde")).toBe(true); // Spanish
	});

	test("5. Never contains command-name keywords (they anchor intent)", () => {
		// The v2.1.0 command names must survive the stopword filter or their
		// commands would lose their anchor keyword (see deriveIntentKeywords).
		for (const word of [
			"sync",
			"migrate",
			"deploy",
			"analyze",
			"build",
			"spec",
			"test",
			"plan",
			"review",
			"ship",
			"design",
			"evolve",
			"diagnosis",
		]) {
			expect(STOPWORDS.has(word)).toBe(false);
		}
	});

	test("6. Stores entries in lowercase", () => {
		for (const word of STOPWORDS) {
			expect(word).toBe(word.toLowerCase());
		}
	});
});

describe("stopwords.ts — sentence filtering", () => {
	test("7. Drops English function words, keeps meaningful tokens", () => {
		expect(filterSentence("deploy the new feature to production")).toEqual([
			"deploy",
			"feature",
			"production",
		]);
	});

	test("8. Drops Spanish function words, keeps meaningful tokens", () => {
		expect(filterSentence("desplegar la nueva versión para producción")).toEqual([
			"desplegar",
			"versión",
			"producción",
		]);
	});

	test("9. Drops tokens shorter than 3 chars by length, not by the set", () => {
		// "de" and "la" are NOT stopwords (2 chars) — they are filtered by the
		// length rule in deriveIntentKeywords, so the set omits them on purpose.
		expect(STOPWORDS.has("de")).toBe(false);
		expect(STOPWORDS.has("la")).toBe(false);
		expect(filterSentence("la de el un a en al")).toEqual([]);
	});

	test("10. Leaves accented command vocabulary untouched", () => {
		expect(filterSentence("especificación de requisitos")).toEqual([
			"especificación",
			"requisitos",
		]);
	});
});
