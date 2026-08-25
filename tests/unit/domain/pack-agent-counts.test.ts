import { describe, expect, it } from "bun:test";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { FILE_RULE_MANIFEST } from "../../../src/domain/entities/FileRuleManifestData";

/**
 * Pack agent count validation (FEV-26 regression guard).
 * FILE_RULE_MANIFEST.agentCount is the source of truth: every pack rule is
 * checked EXACTLY against the .md files on disk, with no tolerance. The old
 * ±20% tolerance let stale counts (TD-V2-90/91: business 92, writers 3) pass
 * undetected — an exact match fails the moment manifest and filesystem drift.
 */

const PACKS_ROOT = resolve(import.meta.dir, "../../../template/obligatorio/packs");

/** Selectable packs are manifest rules with category "pack". */
const packRules = FILE_RULE_MANIFEST.filter(
	(rule): rule is (typeof FILE_RULE_MANIFEST)[number] & { agentCount: number } =>
		rule.category === "pack" && typeof rule.agentCount === "number",
);
/** Mandatory packs that ship agent files (main, writers). */
const mandatoryPackRules = FILE_RULE_MANIFEST.filter(
	(rule) => rule.category === "mandatory" && rule.path.startsWith("packs/"),
);

/** Strip the "packs/" prefix to get the on-disk directory name (e.g. "packs/writers" → "writers"). */
function countAgents(packId: string): number {
	return readdirSync(resolve(PACKS_ROOT, packId)).filter((f) => f.endsWith(".md")).length;
}

describe("pack agent counts (manifest vs filesystem)", () => {
	describe("selectable packs", () => {
		for (const rule of packRules) {
			const packId = rule.path.replace(/^packs\//, "");
			it(`pack '${packId}' has exactly ${rule.agentCount} agents`, () => {
				expect(countAgents(packId)).toBe(rule.agentCount);
			});
		}
	});

	describe("mandatory packs", () => {
		it("descriptions state the actual agent count", () => {
			for (const rule of mandatoryPackRules) {
				const packId = rule.path.replace(/^packs\//, "");
				expect(rule.description).toContain(String(countAgents(packId)));
			}
		});

		it("writers pack description states 4 writer agents", () => {
			const writers = mandatoryPackRules.find((rule) => rule.path === "packs/writers");
			expect(writers).toBeDefined();
			expect(writers?.description).toContain("4 writer agents");
		});
	});
});
