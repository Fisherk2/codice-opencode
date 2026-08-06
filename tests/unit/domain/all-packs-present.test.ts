import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getMandatoryRules, getPackRules } from "../../../src/domain/entities/FileRuleManifest";
import { FILE_RULE_MANIFEST } from "../../../src/domain/entities/FileRuleManifestData";

/**
 * FEV-18 Phase 5 — pack directory presence validation.
 * Verifies the 10 pack directories (2 mandatory + 8 selectable) exist on disk
 * and that sin-clasificar was removed (FEV-18 cleanup).
 */

const PACKS_ROOT = resolve(import.meta.dir, "../../../template/obligatorio/packs");

const EXPECTED_PACKS = [
	"main",
	"writers",
	"software-development",
	"creative",
	"business",
	"finance",
	"government-legal",
	"science-research",
	"hardware-emerging",
	"operations-support",
] as const;

describe("pack directories (FEV-18)", () => {
	for (const pack of EXPECTED_PACKS) {
		it(`pack '${pack}' exists on disk`, () => {
			expect(existsSync(resolve(PACKS_ROOT, pack))).toBe(true);
		});
	}

	it("sin-clasificar directory does NOT exist (FEV-18 cleanup)", () => {
		expect(existsSync(resolve(PACKS_ROOT, "sin-clasificar"))).toBe(false);
	});

	it("manifest has an entry for every pack directory", () => {
		const packPaths = [...getMandatoryRules(), ...getPackRules()].map((r) => r.path);
		for (const pack of EXPECTED_PACKS) {
			expect(packPaths).toContain(`packs/${pack}`);
		}
	});

	it("manifest has exactly 3 mandatory + 8 pack entries (FEV-21)", () => {
		// FEV-21 moved the 8 selectable packs from mandatory to the "pack"
		// category; mandatory now holds only core + the 2 fixed pack groups.
		expect(getMandatoryRules().length).toBe(3);
		expect(getPackRules().length).toBe(8);
	});

	it("all pack manifest entries use destPath='agents'", () => {
		const packRules = FILE_RULE_MANIFEST.filter((r) => r.path.startsWith("packs/"));
		expect(packRules.length).toBe(10);
		for (const rule of packRules) {
			expect(rule.destPath).toBe("agents");
		}
	});
});
