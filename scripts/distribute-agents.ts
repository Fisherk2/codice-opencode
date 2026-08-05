import { cpSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { reformatAgent } from "./reformat-agent";

/**
 * FEV-18 Phase 2 — batch agent distribution.
 * Moves legacy agents (v1.x format preserved) and reformats new agents
 * (v2.0 format) from their sources into the 8 pack directories, using the
 * per-agent pack mapping produced by Phase 0 (docs/audit/audit-fev-18-pack-assignment.md).
 */

export const AGENCY_ROOT = "agency-agents-main";
export const SIN_CLASIFICAR = "template/obligatorio/packs/sin-clasificar";
export const PACKS_ROOT = "template/obligatorio/packs";
export const MAPPING_FILE = "docs/audit/audit-fev-18-pack-assignment.md";

export interface DistributionEntry {
	agent: string;
	source: "new" | "legacy";
	pack: string;
}

export interface DistributionResult {
	ok: boolean;
	movedLegacy: number;
	reformattedNew: number;
	errors: string[];
}

/** Parse the pack-assignment markdown into per-pack agent lists. */
export function parseMapping(mappingPath: string): DistributionEntry[] {
	const content = readFileSync(mappingPath, "utf-8");
	const entries: DistributionEntry[] = [];
	let currentPack: string | null = null;

	for (const line of content.split("\n")) {
		const packMatch = /^## Pack: `(.+)`$/.exec(line.trim());
		if (packMatch) {
			currentPack = packMatch[1] ?? null;
			continue;
		}
		if (currentPack === null) continue;

		const rowMatch = /^\| (new|legacy) \| `([^`]+)` \|/.exec(line.trim());
		if (rowMatch) {
			const agent = rowMatch[2] ?? "";
			const source = rowMatch[1] as "new" | "legacy";
			if (agent) {
				entries.push({ agent, source, pack: currentPack });
			}
		}
	}
	return entries;
}

/** Locate the source file for a new agent across agency-agents-main categories. */
function findNewSource(agentRoot: string, agent: string): string | null {
	for (const category of readdirSync(agentRoot, { withFileTypes: true })) {
		if (!category.isDirectory()) continue;
		const candidate = join(agentRoot, category.name, `${agent}.md`);
		try {
			readFileSync(candidate);
			return candidate;
		} catch {
			// Not in this category — keep searching.
		}
	}
	return null;
}

/**
 * Distribute all mapped agents into their pack directories.
 * @param entries - parsed distribution entries.
 * @param sinClasificarDir - legacy source directory.
 * @param packsDir - target pack root.
 * @param convert - conversion function (reformatAgent), injectable for tests.
 */
export function distribute(
	entries: DistributionEntry[],
	sinClasificarDir: string,
	packsDir: string,
	convert: (source: string, target: string) => { ok: boolean; error?: string },
): DistributionResult {
	const errors: string[] = [];
	let movedLegacy = 0;
	let reformattedNew = 0;

	for (const { agent, source, pack } of entries) {
		const packDir = join(packsDir, pack);
		mkdirSync(packDir, { recursive: true });
		const target = join(packDir, `${agent}.md`);

		if (source === "legacy") {
			const src = join(sinClasificarDir, `${agent}.md`);
			try {
				cpSync(src, target);
				movedLegacy++;
			} catch (err) {
				errors.push(`legacy ${agent}: ${err instanceof Error ? err.message : String(err)}`);
			}
		} else {
			const src = findNewSource(AGENCY_ROOT, agent);
			if (!src) {
				errors.push(`new ${agent}: source not found in ${AGENCY_ROOT}`);
				continue;
			}
			const result = convert(src, target);
			if (result.ok) {
				reformattedNew++;
			} else {
				errors.push(`new ${agent}: ${result.error}`);
			}
		}
	}

	return { ok: errors.length === 0, movedLegacy, reformattedNew, errors };
}

function main(): number {
	const entries = parseMapping(MAPPING_FILE);
	console.log(`Parsed ${entries.length} distribution entries from ${MAPPING_FILE}`);

	const result = distribute(entries, SIN_CLASIFICAR, PACKS_ROOT, reformatAgent);

	console.log(`Legacy moved (v1.x): ${result.movedLegacy}`);
	console.log(`New reformatted (v2.0): ${result.reformattedNew}`);
	console.log(`Errors: ${result.errors.length}`);
	for (const err of result.errors.slice(0, 20)) {
		console.error(`  ✖ ${err}`);
	}

	return result.ok ? 0 : 1;
}

// Run only when executed directly (not when imported by tests).
if (import.meta.main) {
	process.exit(main());
}
