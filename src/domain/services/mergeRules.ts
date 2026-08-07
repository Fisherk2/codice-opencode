import type { FileRule } from "../entities/FileRule";

/**
 * Compute the human-readable reason a rule was skipped during staging.
 * Used by FileMergeEngine to emit skip progress events. Pure helper —
 * no state, kept out of FileMergeEngine to respect the 200-line limit.
 *
 * @param rule - The classification rule being evaluated.
 * @param selected - Set of optional paths the user selected.
 * @param isUpdateMode - Whether the merge runs in update mode.
 * @returns The reason string for the skip event.
 */
export function skipReason(
	rule: FileRule,
	selected: ReadonlySet<string>,
	isUpdateMode = false,
): string {
	if (rule.category === "standard") {
		if (isUpdateMode && rule.isDirectory) {
			return "No new files in directory";
		}
		return "Destination already exists";
	}
	if (rule.category === "optional") {
		return selected.has(rule.path) ? "Destination already exists" : "Not selected by user";
	}
	return "Skipped by classification rule";
}

/**
 * Compute subdirectory exclusions when standard and optional directories
 * overlap. Only standard directories get exclusions; mandatory always
 * overwrites everything, so no exclusions are needed for them.
 *
 * @param rule - The standard directory rule being staged.
 * @param optionalPaths - Paths of all optional rules (to detect overlaps).
 * @returns Set of subdirectory names to exclude, or undefined when no overlap.
 */
export function computeExclusions(
	rule: FileRule,
	optionalPaths: string[],
): ReadonlySet<string> | undefined {
	if (!rule.isDirectory || rule.category !== "standard") {
		return undefined;
	}

	const dirPrefix = `${rule.path}/`;
	const overlapping = optionalPaths.filter((opt) => opt.startsWith(dirPrefix));
	if (overlapping.length === 0) {
		return undefined;
	}

	return new Set<string>(
		overlapping
			.map((opt) => {
				const rest = opt.slice(dirPrefix.length);
				return rest.split("/")[0] ?? "";
			})
			.filter((name) => name !== ""),
	);
}
