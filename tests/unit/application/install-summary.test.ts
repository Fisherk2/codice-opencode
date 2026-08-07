/**
 * Unit tests for installSummary.ts — pre-install summary building and formatting.
 *
 * buildInstallSummary aggregates pack agent counts and file totals from the
 * rule set; formatInstallSummary renders the data for clack.note() (spec §3.3).
 */

import { describe, expect, test } from "bun:test";
import { buildInstallSummary, formatInstallSummary } from "../../../src/application/installSummary";
import type { FileRule } from "../../../src/domain/entities/FileRule";

// ---- Shared fixtures (plain objects) ----

const SOFTWARE_RULE: FileRule = {
	path: "packs/software-development",
	destPath: "agents",
	category: "pack",
	isDirectory: true,
	description: "Software development pack",
	agentCount: 146,
};

const BUSINESS_RULE: FileRule = {
	path: "packs/business",
	destPath: "agents",
	category: "pack",
	isDirectory: true,
	description: "Business pack",
	agentCount: 92,
};

const NO_COUNT_RULE: FileRule = {
	path: "packs/creative",
	destPath: "agents",
	category: "pack",
	isDirectory: true,
	description: "Pack without agent count",
};

const CORE_DIR_RULE: FileRule = {
	path: "core",
	category: "mandatory",
	isDirectory: true,
	description: "Core infrastructure",
};

const MAIN_DIR_RULE: FileRule = {
	path: "packs/main",
	category: "mandatory",
	isDirectory: true,
	description: "Primary agents",
};

const WRITERS_DIR_RULE: FileRule = {
	path: "packs/writers",
	category: "mandatory",
	isDirectory: true,
	description: "Writer agents",
};

const STANDARD_FILE_RULE: FileRule = {
	path: "README.md",
	category: "standard",
	isDirectory: false,
	description: "Readme",
};

describe("buildInstallSummary", () => {
	test("aggregates agent counts from selected packs", () => {
		const info = buildInstallSummary(
			[SOFTWARE_RULE, BUSINESS_RULE],
			["software-development", "business"],
			[],
			[],
		);

		expect(info.totalAgents).toBe(238);
		expect(info.packs).toEqual([
			{ id: "software-development", agentCount: 146 },
			{ id: "business", agentCount: 92 },
		]);
	});

	test("returns 0 total when no packs selected", () => {
		const info = buildInstallSummary([], [], [], []);

		expect(info.totalAgents).toBe(0);
		expect(info.packs).toEqual([]);
	});

	test("skips packs that don't have a matching rule", () => {
		const info = buildInstallSummary([BUSINESS_RULE], ["software-development", "business"], [], []);

		expect(info.packs).toHaveLength(1);
		expect(info.packs[0]?.id).toBe("business");
		expect(info.totalAgents).toBe(92);
	});

	test("dedupes duplicate pack ids so agent counts are not double-counted", () => {
		const info = buildInstallSummary(
			[SOFTWARE_RULE, BUSINESS_RULE],
			["software-development", "software-development", "business"],
			[],
			[],
		);

		expect(info.packs).toEqual([
			{ id: "software-development", agentCount: 146 },
			{ id: "business", agentCount: 92 },
		]);
		expect(info.totalAgents).toBe(238);
	});

	test("defaults agent count to 0 when rule has no agentCount", () => {
		const info = buildInstallSummary([NO_COUNT_RULE], ["creative"], [], []);

		expect(info.packs[0]?.agentCount).toBe(0);
	});

	test("lists mandatory directories from allRules", () => {
		const info = buildInstallSummary(
			[],
			[],
			[],
			[CORE_DIR_RULE, MAIN_DIR_RULE, WRITERS_DIR_RULE, STANDARD_FILE_RULE],
		);

		expect(info.mandatoryDirs).toEqual(["core", "packs/main", "packs/writers"]);
	});

	test("estimates total files from agents, mandatory dirs, and optionals", () => {
		const info = buildInstallSummary(
			[SOFTWARE_RULE],
			["software-development"],
			["Justfile", "Dockerfile"],
			[CORE_DIR_RULE, MAIN_DIR_RULE, WRITERS_DIR_RULE],
		);

		expect(info.totalFiles).toBe(146 + 3 * 5 + 2);
	});
});

describe("formatInstallSummary", () => {
	test("formats packs with agent counts", () => {
		const text = formatInstallSummary({
			packs: [{ id: "software-development", agentCount: 146 }],
			mandatoryDirs: [],
			optionalFiles: [],
			totalAgents: 146,
			totalFiles: 150,
		});

		expect(text).toContain("software-development (146 agents)");
		expect(text).toContain("~146 agents");
	});

	test("includes mandatory and optional lines when present", () => {
		const text = formatInstallSummary({
			packs: [],
			mandatoryDirs: ["core", "packs/main"],
			optionalFiles: ["Justfile", "Dockerfile"],
			totalAgents: 0,
			totalFiles: 12,
		});

		expect(text).toContain("Mandatory: core, packs/main");
		expect(text).toContain("Optional: 2 file(s)");
	});

	test("omits mandatory/optional lines when empty", () => {
		const text = formatInstallSummary({
			packs: [],
			mandatoryDirs: [],
			optionalFiles: [],
			totalAgents: 0,
			totalFiles: 0,
		});

		expect(text).not.toContain("Mandatory:");
		expect(text).not.toContain("Optional:");
	});
});
