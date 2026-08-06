import { describe, expect, test } from "bun:test";
import { DEFAULT_PACKS, humanizePackId, toPackOptions } from "../../../src/application/packOptions";
import type { FileRule } from "../../../src/domain/entities/FileRule";
import { packIdFromPath } from "../../../src/domain/entities/FileRuleManifest";

// ── humanizePackId ────────────────────────────────────────────────

describe("humanizePackId", () => {
	test("capitalizes a single word", () => {
		expect(humanizePackId("dev")).toBe("Dev");
	});

	test("capitalizes each part of a kebab-case id", () => {
		expect(humanizePackId("software-development")).toBe("Software Development");
	});

	test("capitalizes a two-letter single-char word", () => {
		expect(humanizePackId("ai")).toBe("Ai");
	});

	test("handles a three-word id", () => {
		expect(humanizePackId("government-legal-compliance")).toBe("Government Legal Compliance");
	});

	test("handles id with no hyphens", () => {
		expect(humanizePackId("business")).toBe("Business");
	});
});

// ── toPackOptions ─────────────────────────────────────────────────

describe("toPackOptions", () => {
	test("returns empty array when given no rules", () => {
		expect(toPackOptions([])).toEqual([]);
	});

	test("maps a single pack rule to a PackOption", () => {
		const rule: FileRule = {
			path: "packs/software-development",
			category: "pack",
			isDirectory: true,
			description: "Software development agents",
		};

		const result = toPackOptions([rule]);

		expect(result).toHaveLength(1);
		expect(result[0]).toEqual({
			id: "software-development",
			name: "Software Development",
			description: "Software development agents",
			agentCount: 0,
		});
	});

	test("maps multiple rules preserving order", () => {
		const rules: FileRule[] = [
			{
				path: "packs/business",
				category: "pack",
				isDirectory: true,
				description: "Business agents",
			},
			{
				path: "packs/finance",
				category: "pack",
				isDirectory: true,
				description: "Finance agents",
			},
		];

		const result = toPackOptions(rules);

		expect(result).toHaveLength(2);
		expect(result[0]?.id).toBe("business");
		expect(result[0]?.name).toBe("Business");
		expect(result[1]?.id).toBe("finance");
		expect(result[1]?.name).toBe("Finance");
	});

	test("derives id from path using packIdFromPath", () => {
		const rule: FileRule = {
			path: "packs/government-legal",
			category: "pack",
			isDirectory: true,
			description: "Legal and compliance agents",
		};

		const result = toPackOptions([rule]);

		// Verify id matches packIdFromPath derivation
		expect(result[0]?.id).toBe(packIdFromPath(rule.path));
	});

	test("always sets agentCount to 0", () => {
		const rules: FileRule[] = [
			{
				path: "packs/software-development",
				category: "pack",
				isDirectory: true,
				description: "Software development agents",
			},
			{
				path: "packs/creative",
				category: "pack",
				isDirectory: true,
				description: "Creative agents",
			},
		];

		const result = toPackOptions(rules);

		for (const option of result) {
			expect(option.agentCount).toBe(0);
		}
	});

	test("preserves description from the rule", () => {
		const rule: FileRule = {
			path: "packs/science-research",
			category: "pack",
			isDirectory: true,
			description: "Science and research agents",
		};

		const result = toPackOptions([rule]);

		expect(result[0]?.description).toBe("Science and research agents");
	});
});

// ── DEFAULT_PACKS ─────────────────────────────────────────────────

describe("DEFAULT_PACKS", () => {
	test("contains software-development as the default", () => {
		expect(DEFAULT_PACKS).toContain("software-development");
	});

	test("is a readonly tuple (type-level check: has length 1)", () => {
		expect(DEFAULT_PACKS).toHaveLength(1);
	});
});
