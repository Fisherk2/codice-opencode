import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { getMandatoryRules } from "../../../src/domain/entities/FileRuleManifest";
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
		const mandatoryPaths = getMandatoryRules().map((r) => r.path);
		for (const pack of EXPECTED_PACKS) {
			expect(mandatoryPaths).toContain(`packs/${pack}`);
		}
	});

	it("manifest has exactly 11 mandatory entries (core + 2 mandatory + 8 selectable)", () => {
		const mandatory = getMandatoryRules();
		expect(mandatory.length).toBe(11);
	});

	it("all pack manifest entries use destPath='agents'", () => {
		const packRules = FILE_RULE_MANIFEST.filter((r) => r.path.startsWith("packs/"));
		expect(packRules.length).toBe(10);
		for (const rule of packRules) {
			expect(rule.destPath).toBe("agents");
		}
	});
});
