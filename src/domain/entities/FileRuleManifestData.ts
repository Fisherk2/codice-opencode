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
	// NOTE: .opencode/{agents,commands,skills} were symlinks stripped by npm.
	// Real dirs listed above; symlinks generated post-install (ADR-008).
	{
		path: "skills",
		category: "mandatory",
		isDirectory: true,
		description: "Skill definitions managed by installer",
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

	// NOTE: .devin uses noTemplateCopy=true. Symlinks generated post-install
	// by BunSymlinkCreator. Entry exists only for UX selection tracking (ADR-010).
	{
		path: ".devin",
		category: "optional",
		isDirectory: true,
		noTemplateCopy: true,
		description:
			"Devin configuration directory (rules, skills, workflows); team-specific AI agent customization",
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
