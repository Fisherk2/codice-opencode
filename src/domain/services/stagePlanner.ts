import type { FileRule } from "../entities/FileRule";
import type { IFileSystem } from "../ports/IFileSystem";
import { diffTrees } from "./treeDiff";

/**
 * Result of pre-computing the staging plan: stage decisions, expanded dirs
 * (tree-level diffs in update mode), and accurate progress total.
 */
export interface StagePlan {
	readonly stageDecisions: Map<string, boolean>;
	readonly expandedDirs: Map<string, readonly string[]>;
	readonly total: number;
}

/**
 * Pre-compute staging plan: stage decisions, expanded dirs (tree-level diffs
 * in update mode), and accurate progress total. Extracted from FileMergeEngine
 * to keep the class under the 200-line convention.
 */
export async function computeStagePlan(
	fileSystem: IFileSystem,
	rules: readonly FileRule[],
	selected: ReadonlySet<string>,
	isUpdateMode: boolean,
): Promise<StagePlan> {
	const expandedDirs = new Map<string, readonly string[]>();
	const stageDecisions = new Map<string, boolean>();
	let total = 0;

	for (const rule of rules) {
		if (rule.noTemplateCopy) continue;

		if (isUpdateMode && rule.isDirectory && rule.category === "standard") {
			// Tree-level diff: stage only files new in template but missing in dest.
			// Standard rules never set destPath — only mandatory rules use it for
			// core/→root and packs/*→agents/ mappings. Assert that invariant so a
			// future change adding destPath to a standard rule fails fast instead
			// of silently diffing the wrong destination directory.
			if (rule.destPath !== undefined) {
				throw new Error(
					`Standard rule "${rule.path}" must not set destPath (update diff walks rule.path)`,
				);
			}
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
	selected: ReadonlySet<string>,
): Promise<boolean> {
	// Mandatory and pack rules are staged unconditionally: pack selection
	// happens earlier in the installer wizard (filterByPacks), so any pack rule
	// that reaches the engine must be staged regardless of destination state.
	if (rule.category === "mandatory" || rule.category === "pack") return true;

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
