import { describe, expect, test } from "bun:test";
import { COMMAND_AGENT_MAP } from "../defaults";
import { SPANISH_INTENT_KEYWORDS } from "../spanishIntents";

describe("spanishIntents.ts — SPANISH_INTENT_KEYWORDS", () => {
	test("every key exists in COMMAND_AGENT_MAP (no orphan intents)", () => {
		// A Spanish intent for a command that is not routable would match but
		// never route anywhere — the key must reference a real command.
		for (const command of Object.keys(SPANISH_INTENT_KEYWORDS)) {
			expect(COMMAND_AGENT_MAP).toHaveProperty(command);
		}
	});

	test("every value is a non-empty keyword array", () => {
		for (const [command, keywords] of Object.entries(SPANISH_INTENT_KEYWORDS)) {
			expect(keywords.length, `${command} has no keywords`).toBeGreaterThan(0);
		}
	});

	test("no Spanish keyword equals a command name (cannot steal command-name intent)", () => {
		// The discovery collision guard excludes other commands' names from
		// derived keyword lists; the static Spanish map must uphold the same
		// invariant so first-match-wins cannot be hijacked.
		const allNames = new Set(Object.keys(COMMAND_AGENT_MAP).map((c) => c.slice(1)));
		for (const [command, keywords] of Object.entries(SPANISH_INTENT_KEYWORDS)) {
			const ownName = command.slice(1);
			for (const keyword of keywords) {
				expect(allNames.has(keyword), `${command} steals command name "${keyword}"`).toBe(false);
				expect(keyword, `${command} duplicates its own name`).not.toBe(ownName);
			}
		}
	});

	test("covers the six primary intents plus /deploy", () => {
		for (const command of ["/spec", "/plan", "/build", "/test", "/review", "/ship", "/deploy"]) {
			expect(SPANISH_INTENT_KEYWORDS[command]).toBeDefined();
		}
	});
});
