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
	let total = 0;

	for (const rule of rules) {
		if (rule.noTemplateCopy) continue;

		if (isUpdateMode && rule.isDirectory && rule.category === "standard") {
			// Tree-level diff: stage only files new in template but missing in dest.
			// NOTE: Uses rule.path for BOTH source and dest walking. This is correct
			// because standard rules currently never set destPath (only mandatory rules
			// use it for core/→root and packs/*→agents/ mappings). If a future change
			// adds destPath to a standard rule, this call must be updated to walk the
			// destination directory at rule.destPath instead of rule.path.
			const newFiles = await diffTrees(fileSystem, rule.path, rule.path);
			const hasNewFiles = newFiles.length > 0;
			if (hasNewFiles) {
				expandedDirs.set(rule.path, newFiles);
			}
			stageDecisions.set(rule.path, hasNewFiles);
			// Expanded directories contribute per-file count to the total.
			total += newFiles.length;
		} else {
			const decision = await shouldStage(rule, fileSystem, selected);
			stageDecisions.set(rule.path, decision);
			if (decision) total += 1;
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

	// Pack rules behave like mandatory inside the merge engine: pack selection
	// happens earlier in the installer wizard (filterByPacks), so any pack rule
	// that reaches the engine must be staged regardless of destination state.
	if (rule.category === "pack") return true;

	if (rule.category === "standard") {
		const exists = await fileSystem.destinationExists(rule.path);
		return !exists;
	}

	if (rule.category === "optional") {
		if (!selected.has(rule.path)) return false;
		const exists = await fileSystem.destinationExists(rule.path);
		return !exists;
	}

	// All three categories are handled above; TypeScript narrows
	// rule.category to never here, so this is a compile-time guard.
	return assertNever(rule.category);
}

/** Fail at compile time if a new RuleCategory is added without handling. */
function assertNever(value: never): never {
	throw new Error(`Unhandled rule category: ${String(value)}`);
}
