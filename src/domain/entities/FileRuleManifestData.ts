import type { FileRule } from "./FileRule";

/**
 * Build a selectable pack rule. All packs share the same destination
 * mapping and category; only the path, description, and agent count vary.
 * agentCount is the single source of truth for the wizard label and install
 * summary — the description stays clean (no count suffix) to avoid
 * duplicating the count in the pack wizard (label already shows it).
 * Validated by pack-agent-counts.test.
 */
function packRule(path: string, description: string, agentCount: number): FileRule {
	return {
		path,
		destPath: "agents",
		category: "pack",
		isDirectory: true,
		description,
		agentCount,
	};
}

/** Build a standard rule (copied only if missing). */
function standardRule(path: string, description: string, isDirectory = false): FileRule {
	return { path, category: "standard", isDirectory, description };
}

/** Build an optional rule (copied only if user opts in). */
function optionalRule(path: string, description: string, isDirectory = false): FileRule {
	return { path, category: "optional", isDirectory, description };
}

/**
 * The complete manifest of classification rules.
 * Ordered: mandatory → standard → optional for readability.
 *
 * Note: FileRule.noTemplateCopy (ADR-010) is intentionally NOT used by the
 * current manifest — it is reserved for future virtual entries (e.g. .devin/
 * symlinks) whose content is generated post-installation. The merge engine
 * and stage planner already handle the flag; a manifest entry will activate
 * it when such an entry is added.
 */
export const FILE_RULE_MANIFEST: readonly FileRule[] = [
	// =============================================
	// OBLIGATORIO (Mandatory) — always copied
	// =============================================
	// v2.0 (FEV-17): the standalone mandatory entries (opencode.json,
	// agents, commands, .opencode, skills)
	// collapsed into SOURCE GROUPINGS. The destination stays flat via
	// destPath: core/* spreads to root (destPath ""), packs/* merge into
	// agents/. Symlinks .opencode/{agents,commands,skills} are still generated
	// post-installation (ADR-008), so they are not staged from source.
	{
		path: "core",
		destPath: "",
		category: "mandatory",
		isDirectory: true,
		description:
			"Core workspace infrastructure — spreads to destination root (opencode.json, commands/, skills/ with per-skill SKILL.md sets, .opencode/)",
	},
	{
		path: "packs/main",
		destPath: "agents",
		category: "mandatory",
		isDirectory: true,
		description:
			"6 primary agents (huitzilopochtli, quetzalcoatl, moctezuma, tlaloc, mictlantecuhtli, tezcatlipoca)",
	},
	{
		path: "packs/writers",
		destPath: "agents",
		category: "mandatory",
		isDirectory: true,
		description:
			"4 writer agents (docs-writer, obsidian-vault-writer, technical-writer, document-generator)",
	},
	// v2.0 (FEV-18/FEV-21): 8 selectable agent packs. Category "pack" marks
	// them as wizard-selectable: the installer asks the user which packs to
	// install and filters the manifest with filterByPacks() before staging.
	// They live under obligatorio/ so TemplateResolver can still discover them.
	packRule(
		"packs/software-development",
		"Software development pack (default ON: backend, frontend, mobile, DevOps, databases, AI/ML, security, testing)",
		144,
	),
	packRule(
		"packs/business",
		"Business pack (marketing, sales, product, project management, operations)",
		91,
	),
	packRule(
		"packs/hardware-emerging",
		"Hardware-emerging pack (IoT, embedded, blockchain, XR/spatial, game development)",
		36,
	),
	packRule(
		"packs/science-research",
		"Science-research pack (academic, GIS, healthcare, research, scientific-literature-researcher)",
		31,
	),
	packRule(
		"packs/operations-support",
		"Operations-support pack (customer support, IT ops, HR, translation)",
		18,
	),
	packRule("packs/finance", "Finance pack (financial analysis, fintech, payments, accounting)", 11),
	packRule("packs/creative", "Creative pack (design, UI/UX, brand, motion)", 10),
	packRule(
		"packs/government-legal",
		"Government-legal pack (legal, compliance, privacy, regulatory)",
		8,
	),

	// =============================================
	// ESTANDAR (Standard) — copied only if missing
	// =============================================
	standardRule("AGENTS.md", "Project-specific agent instructions; user may customize"),
	standardRule("CHANGELOG.md", "Project changelog; user owns content"),
	standardRule("CONTRIBUTING.md", "Contribution guidelines; user may tailor"),
	standardRule(
		"CODE_OF_CONDUCT.md",
		"Code of conduct for contributors (placeholder, customize for your project)",
	),
	standardRule("LICENSE", "License text; user may replace"),
	standardRule("README.md", "Project readme; user will overwrite with project content"),
	standardRule("SPEC.md", "Specification document; user may extend"),
	standardRule(".env.example", "Environment variable template; user may expand"),
	// NOTE: .gitignore renamed to gitignore (no dot). npm excludes .gitignore
	// from packages. Generated post-install by BunGitignoreCreator (ADR-009).
	standardRule(
		"docs",
		"Documentation directory — standard by default, with optional exceptions",
		true,
	),
	standardRule(
		"specs",
		"Specifications directory — standard by default, with optional exceptions",
		true,
	),
	standardRule("tasks", "Task tracking directory; user may extend", true),

	// =============================================
	// OPCIONAL (Optional) — only if user opts in
	// =============================================
	optionalRule("Justfile", "Just task runner; not all users need it"),
	optionalRule(
		"Makefile",
		"Alternative task runner; mutually exclusive with Justfile for many teams",
	),
	optionalRule("Cargo.toml", "Rust project manifest; only relevant for Rust-based workspaces"),
	optionalRule(
		"package.json",
		"Node.js project manifest; only relevant for JavaScript/TypeScript workspaces",
	),
	optionalRule(
		"pyproject.toml",
		"Python project manifest; only relevant for Python-based workspaces",
	),
	optionalRule("scripts", "Utility scripts; user may add their own", true),
	optionalRule(
		"Dockerfile",
		"Docker container definition; only needed for containerized workflows",
	),
	optionalRule("docker-compose.yml", "Docker Compose service definitions"),
	optionalRule("docs/DESIGN.md", "Design documentation; user may prefer own format"),
	optionalRule("docs/SCHEMA.md", "Schema reference; user may generate from code"),
	optionalRule("specs/design", "Design-specific specs; user may manage design elsewhere", true),
];
