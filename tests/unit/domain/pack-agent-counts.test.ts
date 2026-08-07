import { describe, expect, it } from "bun:test";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

/**
 * FEV-18 Phase 5 — per-pack agent count validation.
 * Counts .md files in each pack directory and compares against the Phase 0
 * audit targets (docs/audit/audit-fev-18-summary.md) with a ±20% tolerance
 * (some agents may be merged/deleted during classification).
 */

const PACKS_ROOT = resolve(import.meta.dir, "../../../template/obligatorio/packs");

/** Expected agent counts per pack (Phase 0 audit, 2026-08-04). */
const EXPECTED_COUNTS: Record<string, number> = {
	main: 6,
	writers: 3,
	"software-development": 146,
	creative: 10,
	business: 92,
	finance: 11,
	"government-legal": 8,
	"science-research": 31,
	"hardware-emerging": 36,
	"operations-support": 18,
};

/** Count .md files in a directory (single level). */
function countAgents(pack: string): number {
	const dir = resolve(PACKS_ROOT, pack);
	try {
		return readdirSync(dir).filter((f) => f.endsWith(".md")).length;
	} catch {
		return 0;
	}
}

describe("pack agent counts (FEV-18)", () => {
	for (const [pack, expected] of Object.entries(EXPECTED_COUNTS)) {
		it(`pack '${pack}' has approximately ${expected} agents`, () => {
			const actual = countAgents(pack);
			const tolerance = Math.max(1, Math.floor(expected * 0.2));
			expect(actual).toBeGreaterThanOrEqual(expected - tolerance);
			expect(actual).toBeLessThanOrEqual(expected + tolerance);
		});
	}

	it("total agents across packs is between 330 and 380 (FEV-18 target ~355)", () => {
		let total = 0;
		for (const pack of Object.keys(EXPECTED_COUNTS)) {
			total += countAgents(pack);
		}
		expect(total).toBeGreaterThanOrEqual(330);
		expect(total).toBeLessThanOrEqual(380);
	});

	it("no pack is empty (all 10 packs populated)", () => {
		for (const pack of Object.keys(EXPECTED_COUNTS)) {
			expect(countAgents(pack)).toBeGreaterThan(0);
		}
	});
});
