/**
 * Unit tests for autoDiscovery — discoverAgentMentionPatterns().
 *
 * Generates regex mention patterns for primary agents only.
 * Tests cover: primary-only input, non-primary-only, mixed set,
 * empty set, and pattern matching behavior.
 */

import { describe, expect, test } from "bun:test";
import { discoverAgentMentionPatterns } from "../../../template/obligatorio/core/.opencode/plugins/src/autoDiscovery";
import { PRIMARY_AGENTS } from "../../../template/obligatorio/core/.opencode/plugins/src/validSubagents";

describe("discoverAgentMentionPatterns", () => {
	test("generates patterns for primary agents present in the set", () => {
		const agents = new Set(["quetzalcoatl", "tlaloc"]);
		const result = discoverAgentMentionPatterns(agents);

		expect(Object.keys(result)).toEqual(expect.arrayContaining(["quetzalcoatl", "tlaloc"]));
		expect(result.quetzalcoatl).toHaveLength(2);
		expect(result.tlaloc).toHaveLength(2);
	});

	test("returns empty record when no primary agents are in the set", () => {
		const agents = new Set(["custom-subagent", "another-sub"]);
		const result = discoverAgentMentionPatterns(agents);

		expect(result).toEqual({});
	});

	test("filters out non-primary agents even if present in the set", () => {
		const agents = new Set([...PRIMARY_AGENTS, "my-custom-agent", "beta-tester"]);
		const result = discoverAgentMentionPatterns(agents);

		expect(Object.keys(result).length).toBe(PRIMARY_AGENTS.length);
		for (const agent of PRIMARY_AGENTS) {
			expect(result[agent]).toBeDefined();
			expect(result[agent]).toHaveLength(2);
		}
		expect(result["my-custom-agent"]).toBeUndefined();
		expect(result["beta-tester"]).toBeUndefined();
	});

	test("each pattern is a RegExp that matches the @name syntax", () => {
		const agents = new Set(["tlaloc"]);
		const result = discoverAgentMentionPatterns(agents);

		const patterns = result.tlaloc;
		expect(patterns).toBeDefined();
		expect(patterns).toHaveLength(2);

		// @tlaloc should match
		expect(patterns?.[0]?.test("@tlaloc")).toBe(true);
		expect(patterns?.[0]?.test("@tlaloc!")).toBe(true);
		// agente tlaloc should match
		expect(patterns?.[1]?.test("agente tlaloc")).toBe(true);
		expect(patterns?.[1]?.test("agente  tlaloc")).toBe(true);
		// Partial matches should not match
		expect(patterns?.[0]?.test("tlaloc")).toBe(false);
		expect(patterns?.[1]?.test("tlaloc")).toBe(false);
		// Word boundary: trailing letters break the @match, and the agent
		// pattern must not match a different agent name.
		expect(patterns?.[0]?.test("@tlalocX")).toBe(false);
		expect(patterns?.[1]?.test("agente quetzalcoatl")).toBe(false);
	});

	test("returns empty record for empty set", () => {
		const result = discoverAgentMentionPatterns(new Set());
		expect(result).toEqual({});
	});
});
