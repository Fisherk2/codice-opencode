// ---------------------------------------------------------------------------
// VALID_SUBAGENTS — Catalog of agents accepted by task() validation
//
// Single source of truth for the 6 primary agent names. VALID_SUBAGENTS is
// built from PRIMARY_AGENTS plus the known subagent catalog, so adding a
// primary agent only requires editing PRIMARY_AGENTS.
// ---------------------------------------------------------------------------

/**
 * The 6 primary agent names that are always valid — even when no corresponding
 * `.md` file exists in the user's `agents/` directory. This ensures the SDD
 * pipeline never rejects calls to built-in agents.
 */
export const PRIMARY_AGENTS: readonly string[] = [
	"huitzilopochtli",
	"quetzalcoatl",
	"moctezuma",
	"tlaloc",
	"mictlantecuhtli",
	"tezcatlipoca",
] as const;

/**
 * Valid subagent names for task() validation.
 *
 * Set of all known agents (subagents + 6 primary agents).
 * Used to validate task() calls at runtime — rejects invented or
 * misspelled subagent names before they reach the agent runtime.
 */
export const VALID_SUBAGENTS: ReadonlySet<string> = new Set([
	...PRIMARY_AGENTS,
	// Backend & APIs
	"backend-developer",
	"typescript-pro",
	"python-pro",
	"golang-pro",
	"rust-engineer",
	"java-architect",
	"csharp-developer",
	"fastapi-developer",
	"graphql-architect",
	"spring-boot-engineer",
	"django-developer",
	"laravel-specialist",
	"php-pro",
	"nextjs-developer",
	"elixir-expert",
	"ruby-pro",
	"kotlin-specialist",
	"websocket-engineer",
	"microservices-architect",
	"cpp-pro",
	"javascript-pro",
	"fullstack-developer",
	// Frontend & Mobile
	"angular-architect",
	"flutter-expert",
	"frontend-developer",
	"mobile-app-developer",
	"mobile-developer",
	"react-specialist",
	"swift-expert",
	"vue-expert",
	// Database & Data
	"database-optimizer",
	"postgres-pro",
	"sql-pro",
	"data-analyst",
	"data-engineer",
	"data-scientist",
	"data-researcher",
	"database-administrator",
	// DevOps & Infra
	"docker-expert",
	"kubernetes-specialist",
	"terraform-engineer",
	"devops-engineer",
	"build-engineer",
	"sre-engineer",
	"cloud-architect",
	"platform-engineer",
	"network-engineer",
	"azure-infra-engineer",
	"deployment-engineer",
	// Security
	"security-auditor",
	"dependency-manager",
	"legal-advisor",
	// Testing & QA
	"test-engineer",
	"code-reviewer",
	"accessibility-tester",
	"chaos-engineer",
	"refactorer",
	"error-detective",
	"error-coordinator",
	"web-performance-auditor",
	// Debugging
	"debugger",
	// AI / ML
	"ai-engineer",
	"llm-architect",
	"mlops-engineer",
	"machine-learning-engineer",
	"nlp-engineer",
	"prompt-engineer",
	// DX & Tooling
	"cli-developer",
	"tooling-engineer",
	"mcp-developer",
	"dx-optimizer",
	"context-manager",
	// Processes
	"git-workflow-manager",
	"incident-responder",
	"project-manager",
	"scrum-master",
	"legacy-modernizer",
	// Specialized Domains
	"fintech-engineer",
	"payment-integration",
	"blockchain-developer",
	"game-developer",
	"iot-engineer",
	"embedded-systems",
	// Documentation & Research
	"docs-writer",
	"research-analyst",
	"knowledge-synthesizer",
	"scientific-literature-researcher",
	"search-specialist",
	"obsidian-vault-writer", // (FEV-8) — Obsidian vault administration
	// Product & Business
	"business-analyst",
	"product-manager",
	"competitive-analyst",
	"content-marketer",
	"market-researcher",
	"sales-engineer",
	"seo-specialist",
	"trend-analyst",
	"ux-researcher",
]);
