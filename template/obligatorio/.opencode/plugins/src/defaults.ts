// ---------------------------------------------------------------------------
// DEFAULTS — SDD Pipeline Configuration
//
// This module contains all hardcoded configuration maps extracted from the
// sdd-pipeline plugin. These are the canonical defaults that the plugin
// falls back to when no overrides are provided in the opencode.json config.
//
// All exports are deeply readonly to prevent accidental mutation at runtime.
// ---------------------------------------------------------------------------

export { DESTRUCTIVE_PATTERNS } from "./destructivePatterns";

/**
 * Maps slash commands to their primary agent.
 *
 * When a user sends a slash command, the pipeline routes to the
 * corresponding agent. This is the authoritative mapping.
 */
export const COMMAND_AGENT_MAP: Readonly<Record<string, string>> = {
	"/spec": "quetzalcoatl",
	"/design": "quetzalcoatl",
	"/evolve": "quetzalcoatl",
	"/diagnosis": "quetzalcoatl",
	"/docs-update": "quetzalcoatl",
	"/plan": "moctezuma",
	"/build": "tlaloc",
	"/test": "mictlantecuhtli",
	"/review": "tezcatlipoca",
	"/ship": "mictlantecuhtli",
	"/code-simplify": "tlaloc",
	"/webperf": "mictlantecuhtli",
	"/help": "huitzilopochtli", // FEV-14 — onboarding command
} as const;

/**
 * Valid subagent names for task() validation.
 *
 * Set of all 104 known agents (98 subagents + 6 primary agents).
 * Used to validate task() calls at runtime — rejects invented or
 * misspelled subagent names before they reach the agent runtime.
 */
export const VALID_SUBAGENTS: ReadonlySet<string> = new Set([
	// Primary agents
	"huitzilopochtli",
	"quetzalcoatl",
	"moctezuma",
	"tlaloc",
	"mictlantecuhtli",
	"tezcatlipoca",
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

/**
 * Maps natural-language intent keywords to slash commands.
 *
 * Used to detect what the user wants to do from their message content
 * (e.g., "implement this feature" → /build). Each command has an array
 * of trigger phrases in both English and Spanish.
 */
export const INTENT_PATTERNS: Readonly<Record<string, readonly string[]>> = {
	"/spec": [
		"nueva feature",
		"requisito",
		"idea",
		"necesito",
		"quiero crear",
		"new feature",
		"requirement",
		"spec",
		"especificacion",
		"especifica",
		"create",
		"define",
		"write spec",
		"specification",
		"what should",
		"proposal",
		"need a feature",
	],
	"/design": [
		"design",
		"diseña",
		"diseñar",
		"ui",
		"ux",
		"interface",
		"interfaz",
		"mockup",
		"wireframe",
		"layout",
		"component design",
		"design system",
		"user experience",
		"user interface",
		"visual",
		"frontend design",
	],
	"/evolve": [
		"evolucion",
		"evolve",
		"evolucionar",
		"proyecto existente",
		"documentacion viva",
		"living documentation",
		"actualizar docs",
		"modificar spec",
		"nuevo requisito",
		"cambio de requisitos",
		"refinar specs",
		"resolver issue",
		"mantenimiento evolutivo",
		"cliente cambio",
		"client change",
		"nueva funcionalidad",
		"cambiar arquitectura",
		"update documentation",
	],
	"/plan": [
		"planifica",
		"divide",
		"tasks",
		"plan",
		"divide en tareas",
		"divide en",
		"desglosa",
		"breakdown",
		"task breakdown",
		"planning",
		"organize",
		"steps",
		"milestones",
		"task list",
		"todos",
		"to-do",
		"story points",
		"estimate",
	],
	"/build": [
		"implementa",
		"codifica",
		"construye",
		"implement",
		"build",
		"code",
		"escribe el codigo",
		"escribe codigo",
		"write code",
		"create file",
		"add functionality",
		"make",
		"generate",
		"develop",
		"produce",
		"set up",
		"scaffold",
		"boilerplate",
		"create function",
		"create class",
		"create module",
		"create component",
	],
	"/test": [
		"test",
		"prueba",
		"pruebas",
		"testing",
		"unit test",
		"integration test",
		"e2e",
		"specs",
		"coverage",
		"assert",
		"mock",
		"stub",
		"tdd",
		"red-green",
	],
	"/review": [
		"revisa",
		"review",
		"codigo",
		"code review",
		"revisar codigo",
		"code quality",
		"audit",
		"inspect",
		"check code",
		"verify code",
		"static analysis",
		"lint",
		"clean code",
		"best practices",
	],
	"/ship": [
		"ship",
		"deploy",
		"lanza",
		"lanzamiento",
		"deployment",
		"publicar",
		"release",
		"publish",
		"launch",
		"go live",
		"rollout",
		"staging",
		"production",
		"ci/cd",
		"pipeline",
		"deliver",
	],
	"/code-simplify": [
		"simplifica",
		"refactor",
		"limpia",
		"simplify",
		"simplificar",
		"simplify code",
		"clean up",
		"refactor code",
		"improve code",
		"technical debt",
		"complex",
		"duplicate",
		"extract method",
		"reduce complexity",
		"make it simpler",
		"cleanup",
	],
	"/webperf": [
		"performance",
		"rendimiento",
		"core web vitals",
		"lighthouse",
		"web performance",
		"cargar",
		"lcp",
		"inp",
		"cls",
		"performance audit",
		"speed",
		"velocidad",
		"optimizar pagina",
		"page speed",
		"carga de pagina",
		"optimizar rendimiento",
	],
	"/diagnosis": [
		"diagnostico",
		"diagnosis",
		"diagnosticar",
		"analyze issue",
		"analizar problema",
		"investigar",
		"bug report",
		"issue analysis",
		"root cause",
		"causa raiz",
		"por que falla",
		"why is it failing",
		"revisar issue",
		"check issue",
		"troubleshoot",
		"solucionar",
	],
	"/docs-update": [
		"actualizar docs",
		"update docs",
		"update documentation",
		"sync docs",
		"sincronizar documentacion",
		"docs outdated",
		"migrar docs",
		"migrate docs",
		"actualizar documentacion",
		"sync documentation",
		"documentacion desactualizada",
		"regenerar docs",
		"regenerate docs",
		"docs update",
	],
	"/help": [
		// FEV-14 — onboarding command
		"help",
		"ayuda",
		"como uso",
		"how to use",
		"what is",
		"que es",
		"show commands",
		"list commands",
		"menu",
		"onboarding",
		"getting started",
		"como empezar",
		"donde empiezo",
		"documentation",
		"docs",
		"manual",
	],
} as const;

/**
 * Maps slash commands to their SDD pipeline phase.
 *
 * Defines which SDD phase a command belongs to. Used for phase
 * validation and transition logic in the pipeline.
 */
export const COMMAND_PHASE_MAP: Readonly<Record<string, string>> = {
	"/spec": "define",
	"/design": "define",
	"/evolve": "define",
	"/diagnosis": "define",
	"/docs-update": "define",
	"/plan": "plan",
	"/build": "build",
	"/test": "verify",
	"/review": "review",
	"/ship": "ship",
	"/code-simplify": "review",
	"/webperf": "review",
	"/help": "idle", // FEV-14 — informational command
} as const;

/**
 * SDD Phase Suggestions — advisory prompts shown to users.
 *
 * Each phase contains per-agent suggestions that appear in the system
 * prompt to guide the user toward the next appropriate command.
 * These are non-enforcing hints, not hard rules.
 */
export const PHASE_SUGGESTIONS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
	idle: {
		huitzilopochtli:
			"Consider /help to discover available commands, or /spec to start a new project.", // FEV-14 — onboarding command
	},
	define: {
		moctezuma:
			"Consider /spec, /evolve, /design, /diagnosis, or /docs-update to define requirements.",
		tlaloc: "Consider /spec, /evolve, /diagnosis, or /docs-update to define requirements.",
		mictlantecuhtli: "Consider /spec, /evolve, /diagnosis, or /docs-update to define requirements.",
		tezcatlipoca: "Consider /spec, /evolve, /diagnosis, or /docs-update to define requirements.",
	},
	plan: {
		quetzalcoatl: "Consider /spec or /design first to define requirements.",
		tlaloc: "Consider /plan first to break work into tasks.",
		mictlantecuhtli: "Consider /plan first to break work into tasks.",
		tezcatlipoca: "Consider /plan first to break work into tasks.",
	},
	build: {
		huitzilopochtli: "Consider delegating implementation to tlaloc via /build.",
		quetzalcoatl: "Consider /spec or /design first, then /plan.",
		moctezuma: "Consider /plan first, then /build.",
		mictlantecuhtli: "Consider /build first to implement code.",
		tezcatlipoca: "Consider /build first to implement code.",
	},
	verify: {
		huitzilopochtli: "Consider /build first to implement code.",
		quetzalcoatl: "Consider /spec → /plan → /build before testing.",
		moctezuma: "Consider /build first, then /test.",
		tlaloc: "Consider /test to verify your implementation.",
		tezcatlipoca: "Consider /test to verify code quality.",
	},
	review: {
		huitzilopochtli: "Consider /test first to verify code quality.",
		quetzalcoatl: "Consider /spec → /plan → /build → /test before review.",
		moctezuma: "Consider /test first, then /review.",
		tlaloc: "Consider /test first, then /review.",
		mictlantecuhtli: "Consider /review to audit code quality.",
	},
	ship: {
		huitzilopochtli: "Consider /test and /review before shipping.",
		quetzalcoatl: "Consider full SDD cycle before shipping.",
		moctezuma: "Consider /test and /review before shipping.",
		tlaloc: "Consider /test and /review before shipping.",
		// tezcatlipoca: read-only agent, cannot ship — no suggestion
	},
} as const;

/**
 * Agent mention patterns — detect agent switches from user messages.
 *
 * Each primary agent has one or more RegExp patterns that match when
 * a user @mentions or references them by name, triggering an agent
 * switch in the pipeline.
 */
export const AGENT_MENTION_PATTERNS: Readonly<Record<string, readonly RegExp[]>> = {
	huitzilopochtli: [/@huitzilopochtli\b/i, /agente\s+huitzilopochtli/i],
	quetzalcoatl: [/@quetzalcoatl\b/i, /agente\s+quetzalcoatl/i],
	moctezuma: [/@moctezuma\b/i, /agente\s+moctezuma/i],
	tlaloc: [/@tlaloc\b/i, /agente\s+tlaloc/i],
	mictlantecuhtli: [/@mictlantecuhtli\b/i, /agente\s+mictlantecuhtli/i],
	tezcatlipoca: [/@tezcatlipoca\b/i, /agente\s+tezcatlipoca/i],
} as const;

/**
 * Aggregated DEFAULTS object containing all 6 configuration maps.
 *
 * This is the canonical defaults object used by the SDD pipeline plugin.
 * Consumers can import individual named exports or the entire DEFAULTS object.
 *
 * NOTE: DESTRUCTIVE_PATTERNS is intentionally omitted from this object —
 * it is a safety boundary and must remain hardcoded per OQ-4.
 */
export const DEFAULTS: Readonly<{
	COMMAND_AGENT_MAP: typeof COMMAND_AGENT_MAP;
	VALID_SUBAGENTS: typeof VALID_SUBAGENTS;
	INTENT_PATTERNS: typeof INTENT_PATTERNS;
	COMMAND_PHASE_MAP: typeof COMMAND_PHASE_MAP;
	PHASE_SUGGESTIONS: typeof PHASE_SUGGESTIONS;
	AGENT_MENTION_PATTERNS: typeof AGENT_MENTION_PATTERNS;
}> = {
	COMMAND_AGENT_MAP,
	VALID_SUBAGENTS,
	INTENT_PATTERNS,
	COMMAND_PHASE_MAP,
	PHASE_SUGGESTIONS,
	AGENT_MENTION_PATTERNS,
} as const;
