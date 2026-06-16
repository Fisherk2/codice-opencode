/**
 * Static classification manifest for the OpenCode workspace template.
 *
 * Maps every known path in the template/ directory to a FileRule
 * (Mandatory / Standard / Optional). The manifest is hardcoded per
 * release and reflects the current template structure.
 *
 * Mixed-category directories (docs/, specs/, .opencode/) are handled
 * by listing the directory itself plus any exception children.
 * Non-exception children inherit the parent's category at runtime.
 */

import type { FileRule, RuleCategory } from "./FileRule";
import { FILE_RULE_MANIFEST } from "./FileRuleManifestData";

// Re-export so consumers can import from a single location
export { FILE_RULE_MANIFEST } from "./FileRuleManifestData";

// ---- Lookup helpers ----

/**
 * Find the FileRule for a given path.
 * Normalizes paths (removes leading "./", trailing "/").
 * Returns null if the path is not in the manifest.
 */
export function createFileRule(path: string): FileRule | null {
	const normalized = normalizePath(path);
	const rule = FILE_RULE_MANIFEST.find((r) => r.path === normalized);
	return rule ? { ...rule } : null; // Return a copy to prevent mutation
}

/**
 * Filter the manifest by category.
 */
export function getRulesByCategory(category: RuleCategory): readonly FileRule[] {
	return FILE_RULE_MANIFEST.filter((r) => r.category === category);
}

/**
 * Get all mandatory (obligatorio) rules.
 */
export function getMandatoryRules(): readonly FileRule[] {
	return getRulesByCategory("mandatory");
}

/**
 * Get all standard (estandar) rules.
 */
export function getStandardRules(): readonly FileRule[] {
	return getRulesByCategory("standard");
}

/**
 * Get all optional (opcional) rules.
 */
export function getOptionalRules(): readonly FileRule[] {
	return getRulesByCategory("optional");
}

// ---- Internal helpers ----

/**
 * Normalize a path for manifest lookup:
 * - Remove leading "./"
 * - Remove trailing "/"
 * - Convert backslashes to forward slashes
 */
function normalizePath(path: string): string {
	let normalized = path.replace(/\\/g, "/");
	if (normalized.startsWith("./")) {
		normalized = normalized.slice(2);
	}
	if (normalized.endsWith("/") && normalized.length > 1) {
		normalized = normalized.slice(0, -1);
	}
	return normalized;
}
