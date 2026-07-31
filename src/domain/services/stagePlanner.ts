import type { FileRule } from "../entities/FileRule";
import type { IFileSystem } from "../ports/IFileSystem";
import { diffTrees } from "./treeDiff";

/**
 * Pre-compute staging plan: stage decisions, expanded dirs (tree-level diffs
 * in update mode), and accurate progress total. Extracted from FileMergeEngine
 * to keep the class under the 200-line convention.
 */
export async function computeStagePlan(
	fileSystem: IFileSystem,
	rules: readonly FileRule[],
	selected: Set<string>,
	isUpdateMode: boolean,
): Promise<{
	stageDecisions: Map<string, boolean>;
	expandedDirs: Map<string, readonly string[]>;
	total: number;
}> {
	const expandedDirs = new Map<string, readonly string[]>();
	const stageDecisions = new Map<string, boolean>();

	for (const rule of rules) {
		if (rule.noTemplateCopy) continue;

		if (isUpdateMode && rule.isDirectory && rule.category === "standard") {
			// Tree-level diff: stage only files new in template but missing in dest
			const newFiles = await diffTrees(fileSystem, rule.path, rule.path);
			if (newFiles.length > 0) {
				expandedDirs.set(rule.path, newFiles);
			}
			stageDecisions.set(rule.path, newFiles.length > 0);
		} else {
			stageDecisions.set(rule.path, await shouldStage(rule, fileSystem, selected));
		}
	}

	// Compute total: expanded directories contribute per-file count,
	// regular rules contribute 1 each.
	let total = 0;
	for (const [path, decision] of stageDecisions) {
		if (decision === true) {
			const expanded = expandedDirs.get(path);
			total += expanded?.length ?? 1;
		}
	}

	return { stageDecisions, expandedDirs, total };
}

/** Classify whether a rule's file should be staged based on category and state. */
async function shouldStage(
	rule: FileRule,
	fileSystem: IFileSystem,
	selected: Set<string>,
): Promise<boolean> {
	if (rule.category === "mandatory") return true;

	if (rule.category === "standard") {
		const exists = await fileSystem.destinationExists(rule.path);
		return !exists;
	}

	if (rule.category === "optional") {
		if (!selected.has(rule.path)) return false;
		const exists = await fileSystem.destinationExists(rule.path);
		return !exists;
	}

	return false;
}
