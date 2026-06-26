import type { FileRule } from "./FileRule";

/**
 * The complete manifest of classification rules.
 * Ordered: mandatory → standard → optional for readability.
 */
export const FILE_RULE_MANIFEST: readonly FileRule[] = [
	// =============================================
	// OBLIGATORIO (Mandatory) — always copied
	// =============================================
	{
		path: "opencode.json",
		category: "mandatory",
		isDirectory: false,
		description: "Core workspace configuration; must stay in sync with installer",
	},
	{
		path: "skills-lock.json",
		category: "mandatory",
		isDirectory: false,
		description: "Lockfile for reproducible skill resolution; managed by installer",
	},
	{
		path: "agents",
		category: "mandatory",
		isDirectory: true,
		description: "Agent definitions managed by installer",
	},
	{
		path: "commands",
		category: "mandatory",
		isDirectory: true,
		description: "Command schemas managed by installer",
	},
	{
		path: ".opencode",
		category: "mandatory",
		isDirectory: true,
		description: "Core OpenCode configuration directory",
	},
	{
		path: ".opencode/plugins",
		category: "mandatory",
		isDirectory: true,
		description: "Plugin definitions managed by installer",
	},
	{
		path: ".opencode/agents",
		category: "mandatory",
		isDirectory: true,
		description: "Agent configuration under .opencode",
	},
	{
		path: ".opencode/commands",
		category: "mandatory",
		isDirectory: true,
		description: "Command configuration under .opencode",
	},
	{
		path: ".opencode/skills",
		category: "mandatory",
		isDirectory: true,
		description: "Skill definitions under .opencode",
	},
	// NOTE: .opencode/config.json removed — does not exist in template
	// The .opencode directory is already listed as mandatory above, so
	// actual files within it (e.g., .gitignore, plugins/) will be
	// included when the directory is walked at stage time.
	{
		path: "skills",
		category: "mandatory",
		isDirectory: true,
		description: "Skill definitions managed by installer",
	},
	{
		path: "references",
		category: "mandatory",
		isDirectory: true,
		description: "Reference files managed by installer",
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
	{
		path: ".gitignore",
		category: "standard",
		isDirectory: false,
		description: "Git ignore rules; user may extend for project needs",
	},
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
		path: ".devin/rules",
		category: "optional",
		isDirectory: true,
		description: "Devin rules for AI agent; team-specific customization",
	},
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
		path: "docs/opencode",
		category: "optional",
		isDirectory: true,
		description: "Complete OpenCode configuration guides; user may not need all guides",
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
