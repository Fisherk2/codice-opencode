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

/**
 * The 7 symlinks in .devin/ that exist in the local dev template
 * but are resolved by npm when packaging.
 *
 * 2 at the directory level: .devin/skills, .devin/workflows
 * 5 inside .devin/rules/: CODE_STYLE.md, CONTRIBUTING.md,
 *   code-review-and-quality.md, incremental-implementation.md,
 *   test-driven-development.md
 *
 * Reference: ADR-FEV2B-10
 */
export const DEVIN_SYMLINKS: readonly SymlinkSpec[] = [
	{ target: "../skills", linkPath: ".devin/skills" },
	{ target: "../commands", linkPath: ".devin/workflows" },
	{ target: "../../docs/CODE_STYLE.md", linkPath: ".devin/rules/CODE_STYLE.md" },
	{ target: "../../CONTRIBUTING.md", linkPath: ".devin/rules/CONTRIBUTING.md" },
	{
		target: "../../skills/code-review-and-quality/SKILL.md",
		linkPath: ".devin/rules/code-review-and-quality.md",
	},
	{
		target: "../../skills/incremental-implementation/SKILL.md",
		linkPath: ".devin/rules/incremental-implementation.md",
	},
	{
		target: "../../skills/test-driven-development/SKILL.md",
		linkPath: ".devin/rules/test-driven-development.md",
	},
];
