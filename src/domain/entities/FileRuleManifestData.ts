import type { FileRule } from "./FileRule";

/**
 * Build a selectable pack rule. All packs share the same destination
 * mapping and category; only the path, description, and agent count vary.
 */
function pack(path: string, description: string, agentCount: number): FileRule {
	return { path, destPath: "agents", category: "pack", isDirectory: true, description, agentCount };
}

/**
 * The complete manifest of classification rules.
 * Ordered: mandatory → standard → optional for readability.
 */
export const FILE_RULE_MANIFEST: readonly FileRule[] = [
	// =============================================
	// OBLIGATORIO (Mandatory) — always copied
	// =============================================
	// v2.0 (FEV-17): the 7 standalone mandatory entries (opencode.json,
	// skills-lock.json, agents, commands, .opencode, .opencode/plugins, skills)
	// collapsed into 4 SOURCE GROUPINGS. The destination stays flat via
	// destPath: core/* spreads to root (destPath ""), packs/* merge into
	// agents/. Symlinks .opencode/{agents,commands,skills} are still generated
	// post-installation (ADR-008), so they are not staged from source.
	{
		path: "core",
		destPath: "",
		category: "mandatory",
		isDirectory: true,
		description:
			"Core workspace infrastructure — spreads to destination root (opencode.json, commands/, skills/, .opencode/, skills-lock.json)",
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
			"2 writer agents (docs-writer, obsidian-vault-writer) — scientific-literature-researcher moved to science-research pack in FEV-18",
	},
	// v2.0 (FEV-18/FEV-21): 8 selectable agent packs. Category "pack" marks
	// them as wizard-selectable: the installer asks the user which packs to
	// install and filters the manifest with filterByPacks() before staging.
	// They live under obligatorio/ so TemplateResolver can still discover them.
	pack(
		"packs/software-development",
		"Software development pack (default ON, 146 agents: backend, frontend, mobile, DevOps, databases, AI/ML, security, testing)",
		146,
	),
	pack(
		"packs/business",
		"Business pack (92 agents: marketing, sales, product, project management, operations)",
		92,
	),
	pack(
		"packs/hardware-emerging",
		"Hardware-emerging pack (36 agents: IoT, embedded, blockchain, XR/spatial, game development)",
		36,
	),
	pack(
		"packs/science-research",
		"Science-research pack (31 agents: academic, GIS, healthcare, research, scientific-literature-researcher)",
		31,
	),
	pack(
		"packs/operations-support",
		"Operations-support pack (18 agents: customer support, IT ops, HR, translation)",
		18,
	),
	pack(
		"packs/finance",
		"Finance pack (11 agents: financial analysis, fintech, payments, accounting)",
		11,
	),
	pack("packs/creative", "Creative pack (10 agents: design, UI/UX, brand, motion)", 10),
	pack(
		"packs/government-legal",
		"Government-legal pack (8 agents: legal, compliance, privacy, regulatory)",
		8,
	),

	// =============================================
	// ESTANDAR (Standard) — copied only if missing
	// =============================================
	{
		path: "AGENTS.md",
		category: "standard",
		isDirectory: false,
		description: "Project-specific agent instructions; user may customize",
	},
	{
		path: "CHANGELOG.md",
		category: "standard",
		isDirectory: false,
		description: "Project changelog; user owns content",
	},
	{
		path: "CONTRIBUTING.md",
		category: "standard",
		isDirectory: false,
		description: "Contribution guidelines; user may tailor",
	},
	{
		path: "CODE_OF_CONDUCT.md",
		category: "standard",
		isDirectory: false,
		description: "Code of conduct for contributors (placeholder, customize for your project)",
	},
	{
		path: "LICENSE",
		category: "standard",
		isDirectory: false,
		description: "License text; user may replace",
	},
	{
		path: "README.md",
		category: "standard",
		isDirectory: false,
		description: "Project readme; user will overwrite with project content",
	},
	{
		path: "SPEC.md",
		category: "standard",
		isDirectory: false,
		description: "Specification document; user may extend",
	},
	{
		path: ".env.example",
		category: "standard",
		isDirectory: false,
		description: "Environment variable template; user may expand",
	},
	// NOTE: .gitignore renamed to gitignore (no dot). npm excludes .gitignore
	// from packages. Generated post-install by BunGitignoreCreator (ADR-009).
	{
		path: "docs",
		category: "standard",
		isDirectory: true,
		description: "Documentation directory — standard by default, with optional exceptions",
	},
	{
		path: "specs",
		category: "standard",
		isDirectory: true,
		description: "Specifications directory — standard by default, with optional exceptions",
	},
	{
		path: "tasks",
		category: "standard",
		isDirectory: true,
		description: "Task tracking directory; user may extend",
	},

	// =============================================
	// OPCIONAL (Optional) — only if user opts in
	// =============================================
	{
		path: ".gitmessage",
		category: "optional",
		isDirectory: false,
		description: "Git commit message template; team-specific customization",
	},
	{
		path: ".opencode/plugins/sdd-workflow-test.md",
		category: "optional",
		isDirectory: false,
		description: "SDD pipeline workflow test specs; only needed for plugin validation",
	},
	{
		path: "Justfile",
		category: "optional",
		isDirectory: false,
		description: "Just task runner; not all users need it",
	},
	{
		path: "Makefile",
		category: "optional",
		isDirectory: false,
		description: "Alternative task runner; mutually exclusive with Justfile for many teams",
	},
	{
		path: "requirements.txt",
		category: "optional",
		isDirectory: false,
		description: "Python dependencies; only relevant for Python-based workspaces",
	},
	{
		path: "scripts",
		category: "optional",
		isDirectory: true,
		description: "Utility scripts; user may add their own",
	},
	{
		path: "Dockerfile",
		category: "optional",
		isDirectory: false,
		description: "Docker container definition; only needed for containerized workflows",
	},
	{
		path: "docker-compose.yml",
		category: "optional",
		isDirectory: false,
		description: "Docker Compose service definitions",
	},
	{
		path: "docs/DESIGN.md",
		category: "optional",
		isDirectory: false,
		description: "Design documentation; user may prefer own format",
	},
	{
		path: "docs/SCHEMA.md",
		category: "optional",
		isDirectory: false,
		description: "Schema reference; user may generate from code",
	},
	{
		path: "specs/design",
		category: "optional",
		isDirectory: true,
		description: "Design-specific specs; user may manage design elsewhere",
	},
];
