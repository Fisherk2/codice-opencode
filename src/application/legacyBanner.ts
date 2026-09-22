/**
 * Opencode Legacy detection (FEV-30 Task 3.1).
 *
 * The V1 plugin was removed from the template, so workspaces installed by the
 * retired Opencode Legacy line (<= 2.1.2) silently lose plugin support. The
 * detection banner shown before the mode menu nudges those users toward
 * >= 2.1.4 (native Opencode V2 support) — a single source owned by
 * versionInfoMessages. This module provides the threshold predicate and the
 * shared message that banner consumes.
 */

import { VersionComparator } from "../domain/services/VersionComparator";

/** Last Códice version shipped on the retired Opencode Legacy runtime. */
const LEGACY_MAX_VERSION = "2.1.2";

export const LEGACY_BANNER_MESSAGE =
	"⚠ Opencode Legacy only — upgrade to ≥ 2.1.4 for native Opencode V2 support";

/**
 * Is the given installed version on the retired legacy line (at or below
 * the threshold)?
 *
 * compare() reports from the remote's perspective: with the threshold as
 * "remote", "ahead" (threshold > installed) and "equal" both mean the
 * install sits on the legacy line and deserves the warning. Invalid
 * versions fail the comparison and degrade to false (fail-open).
 */
export function isLegacyVersion(version: string): boolean {
	const comparison = new VersionComparator().compare(version, LEGACY_MAX_VERSION);
	return comparison.ok && (comparison.value === "ahead" || comparison.value === "equal");
}
