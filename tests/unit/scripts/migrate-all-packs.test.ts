/**
 * migrate-all-packs — Bulk runner over the 8 pending packs (Fase 2).
 *
 * TDD: these tests are written BEFORE the script exists (RED),
 * then `scripts/migrate-all-packs.ts` is implemented to make them pass (GREEN).
 *
 * Contract:
 * - dry-run is the default (`--apply` opts into writing); never touches packs otherwise
 * - packs run in ascending size order; `--pack` / `--exclude` filter that order
 * - the per-file codemod is imported, never duplicated (injectable for tests)
 * - per-pack report carries exactly {pack, total, migrated, skipped, errors, warnings}
 */

import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	PENDING_PACKS,
	parseArgs,
	resolvePacks,
	runAllPacks,
	runCli,
} from "../../../scripts/migrate-all-packs";
import type { V2MigrationSummary } from "../../../scripts/migrate-v1-to-v2-permissions";

const V1_AGENT = `---
description: "Fixture Agent"
mode: subagent
tools:
  grep: allow
---
# Fixture
`;

let tmpRoot: string;

beforeAll(() => {
	tmpRoot = mkdtempSync(join(tmpdir(), "all-packs-"));
});

afterAll(() => {
	rmSync(tmpRoot, { recursive: true, force: true });
});

function writePack(pack: string, name: string, content: string): string {
	const dir = join(tmpRoot, pack);
	mkdirSync(dir, { recursive: true });
	const file = join(dir, name);
	writeFileSync(file, content);
	return file;
}

type MigrateFn = (dirs: readonly string[], opts?: { dryRun?: boolean }) => V2MigrationSummary;

describe("migrate-all-packs arg parsing", () => {
	it("defaults to dry-run with no pack filter", () => {
		const parsed = parseArgs([]);
		expect(parsed.dryRun).toBe(true);
		expect(parsed.packs).toEqual([]);
		expect(parsed.exclude).toEqual([]);
	});

	it("opts into writing only with --apply and honors --pack/--exclude", () => {
		const parsed = parseArgs([
			"--apply",
			"--pack=creative",
			"--pack=finance",
			"--exclude=business",
		]);
		expect(parsed.dryRun).toBe(false);
		expect(parsed.packs).toEqual(["creative", "finance"]);
		expect(parsed.exclude).toEqual(["business"]);
	});
});

describe("migrate-all-packs pack ordering", () => {
	it("lists the 8 pending packs in ascending size order", () => {
		expect([...PENDING_PACKS]).toEqual([
			"government-legal",
			"creative",
			"finance",
			"operations-support",
			"science-research",
			"hardware-emerging",
			"business",
			"software-development",
		]);
	});

	it("keeps pending order when filtering with --pack and --exclude", () => {
		const resolved = resolvePacks(tmpRoot, ["business", "creative"], ["creative"]);
		expect(resolved).toEqual(["business"]);
		const all = resolvePacks(tmpRoot, [], []);
		expect(all).toEqual([...PENDING_PACKS]);
	});
});

describe("migrate-all-packs runner", () => {
	it("dry-run reports migration without touching files", () => {
		const file = writePack("government-legal", "dry.md", V1_AGENT);
		const report = runAllPacks({ root: tmpRoot, packs: ["government-legal"], dryRun: true });
		expect(report.dryRun).toBe(true);
		expect(report.packs[0]?.migrated).toBe(1);
		expect(readFileSync(file, "utf-8")).toBe(V1_AGENT);
	});

	it("apply mode writes the V2 permissions list", () => {
		const file = writePack("creative", "apply.md", V1_AGENT);
		const report = runAllPacks({ root: tmpRoot, packs: ["creative"], dryRun: false });
		expect(report.packs[0]?.migrated).toBe(1);
		expect(readFileSync(file, "utf-8")).toContain("permissions:");
	});

	it("delegates to the codemod in ascending pack order", () => {
		const seen: string[] = [];
		const fake: MigrateFn = (dirs) => {
			for (const d of dirs) seen.push(d);
			return { migrated: 0, skipped: 0, errors: [], warnings: [] };
		};
		mkdirSync(join(tmpRoot, "operations-support"), { recursive: true });
		mkdirSync(join(tmpRoot, "business"), { recursive: true });
		runAllPacks({
			root: tmpRoot,
			packs: ["business", "operations-support"],
			dryRun: true,
			migrate: fake,
		});
		expect(seen).toEqual([join(tmpRoot, "operations-support"), join(tmpRoot, "business")]);
	});

	it("carries exactly the six report keys per pack", () => {
		writePack("finance", "keys.md", V1_AGENT);
		const report = runAllPacks({ root: tmpRoot, packs: ["finance"], dryRun: true });
		const packReport = report.packs[0];
		expect(Object.keys(packReport ?? {}).sort()).toEqual(
			["errors", "migrated", "pack", "skipped", "total", "warnings"].sort(),
		);
	});

	it("returns exit 1 on codemod errors in apply mode", () => {
		const failing: MigrateFn = () => ({
			migrated: 0,
			skipped: 0,
			errors: ["boom"],
			warnings: [],
		});
		mkdirSync(join(tmpRoot, "science-research"), { recursive: true });
		const code = runCli(["--apply", "--pack=science-research"], {
			root: tmpRoot,
			migrate: failing,
		});
		expect(code).toBe(1);
	});
});
