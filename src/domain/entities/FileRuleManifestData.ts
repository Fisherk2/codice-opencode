import type { FileRule } from "./FileRule";

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
	{
		path: "packs/sin-clasificar",
		destPath: "agents",
		category: "mandatory",
		isDirectory: true,
		description: "95 unclassified agents pending FEV-18 classification (temporary pack)",
	},

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
