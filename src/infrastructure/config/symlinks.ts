import type { SymlinkSpec } from "../../application/ports/ISymlinkCreator";

/**
 * The 3 symlinks in .opencode/ that exist in the local dev template
 * but are resolved by npm when packaging.
 *
 * These are recreated post-installation so the user's workspace
 * matches the dev structure exactly.
 *
 * Reference: ADR-FEV2B-1, ADR-FEV2B-3
 */
export const OPENCODE_SYMLINKS: readonly SymlinkSpec[] = [
	{ target: "../agents", linkPath: ".opencode/agents" },
	{ target: "../commands", linkPath: ".opencode/commands" },
	{ target: "../skills", linkPath: ".opencode/skills" },
];
