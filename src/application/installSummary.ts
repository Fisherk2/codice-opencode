/**
 * Pre-install summary helpers for the installer wizard (spec §3.3).
 * Pure functions — no I/O, no side effects.
 */

import type { FileRule } from "../domain/entities/FileRule";
import { packIdFromPath } from "../domain/entities/FileRuleManifest";
import type { InstallSummaryInfo } from "./ports/IUserPrompt";

/**
 * Rough estimate of files contributed by each mandatory directory.
 *
 * Derivation: mandatory directories (core/, packs/) each contain a handful of
 * top-level entries — opencode.json, commands/, skills/, .opencode/, agents/
 * — so 5 approximates the non-agent file count. The summary is labeled "~"
 * and informational only (spec §3.3); exact counts would require walking the
 * template, which the pre-install summary intentionally avoids.
 */
const ESTIMATED_FILES_PER_MANDATORY_DIR = 5;

/**
 * Build the pre-install summary data from selected rules.
 * Aggregates pack agent counts (from FileRule.agentCount, defaulting to 0).
 *
 * @param packRules - Pack rules from getPackRules() (for pack lookup).
 * @param selectedPacks - Pack IDs the user selected.
 * @param selectedOptionals - Optional file paths the user selected.
 * @param allRules - Full rule set (for mandatory directory detection).
 * @returns InstallSummaryInfo suitable for IUserPrompt.showInstallSummary.
 */
export function buildInstallSummary(
	packRules: readonly FileRule[],
	selectedPacks: readonly string[],
	selectedOptionals: readonly string[],
	allRules: readonly FileRule[],
): InstallSummaryInfo {
	// Dedupe selected packs: filterByPacks merges duplicates via a Set, so the
	// summary must match — otherwise a duplicate id double-counts its agents.
	const rulesByPack = new Map(packRules.map((rule) => [packIdFromPath(rule.path), rule]));
	// Map lookup key already IS the pack id — no need to re-derive it from the
	// rule path; unknown ids drop out via the empty-array branch.
	const packs = [...new Set(selectedPacks)].flatMap((id) => {
		const rule = rulesByPack.get(id);
		return rule ? [{ id, agentCount: rule.agentCount ?? 0 }] : [];
	});
	const totalAgents = packs.reduce((sum, pack) => sum + pack.agentCount, 0);
	const mandatoryDirs = allRules
		.filter((rule) => rule.category === "mandatory" && rule.isDirectory)
		.map((rule) => rule.path);
	return {
		packs,
		mandatoryDirs,
		optionalFiles: [...selectedOptionals],
		totalAgents,
		// Rough estimate: each mandatory directory contributes a few files.
		totalFiles:
			totalAgents +
			mandatoryDirs.length * ESTIMATED_FILES_PER_MANDATORY_DIR +
			selectedOptionals.length,
	};
}

/** Format InstallSummaryInfo as a multi-line string for clack.note(). */
export function formatInstallSummary(info: InstallSummaryInfo): string {
	const lines = [
		`Packs: ${info.packs.map((pack) => `${pack.id} (${pack.agentCount} agents)`).join(", ")}`,
	];
	if (info.mandatoryDirs.length > 0) {
		lines.push(`Mandatory: ${info.mandatoryDirs.join(", ")}`);
	}
	if (info.optionalFiles.length > 0) {
		lines.push(`Optional: ${info.optionalFiles.length} file(s)`);
	}
	lines.push(`Total: ~${info.totalAgents} agents | ~${info.totalFiles} files`);
	return lines.join("\n");
}
