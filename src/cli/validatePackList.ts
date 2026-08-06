/**
 * Pack-list validation for CLI flags (FEV-21 Phase 5).
 *
 * --packs and --update-add-packs accept comma-separated pack IDs. A bogus
 * ID would silently install zero packs (filterByPacks drops unmatched rules)
 * and persist a ghost pack into .codice-version, so IDs are validated against
 * the manifest at parse time — the same protection the wizard gets for free.
 */

import { getPackRules, packIdFromPath } from "../domain/entities/FileRuleManifest";

/** All valid pack IDs (e.g. "software-development", "business"). */
const VALID_PACK_IDS: ReadonlySet<string> = new Set(
	getPackRules().map((rule) => packIdFromPath(rule.path)),
);

/**
 * Validate a raw comma-separated pack list.
 * Returns the raw value when every entry is a known pack ID, null otherwise.
 *
 * @param raw - Raw flag value (may be undefined when the flag is absent).
 * @returns The validated raw value, or null on invalid/unknown pack IDs.
 */
export function validatePackList(raw: string | undefined): string | null {
	if (raw === undefined) return null;
	const entries = raw.split(",").map((entry) => entry.trim());
	if (entries.some((entry) => entry === "")) return null;
	if (entries.some((entry) => !VALID_PACK_IDS.has(entry))) return null;
	return raw;
}
