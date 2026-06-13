import type { Plugin } from "@opencode-ai/plugin"
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs"
import { join } from "path"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SddState {
  pipeline_phase: string
  active_spec: string | null
  current_task: string | null
  completed_tasks: string[]
  pending_tasks: string[]
  agent_type: string
  last_intent: string | null
}

interface MessageEvent {
  message?: { content?: string }
  parts?: unknown[]
}

/** Typed error for SDD pipeline blocking — avoids string prefix coupling. */
class SddError extends Error {
  constructor(msg: string) {
    super(msg)
    this.name = "SddError"
  }
}

// Agent mention patterns — detect agent switches from user messages
const AGENT_MENTION_PATTERNS: Record<string, RegExp[]> = {
  huitzilopochtli: [/@huitzilopochtli\b/i, /agente\s+huitzilopochtli/i],
  quetzalcoatl:    [/@quetzalcoatl\b/i, /agente\s+quetzalcoatl/i],
  moctezuma:       [/@moctezuma\b/i, /agente\s+moctezuma/i],
  tlaloc:          [/@tlaloc\b/i, /agente\s+tlaloc/i],
  mictlantecuhtli: [/@mictlantecuhtli\b/i, /agente\s+mictlantecuhtli/i],
  tezcatlipoca:    [/@tezcatlipoca\b/i, /agente\s+tezcatlipoca/i],
}

// Map slash commands to their primary agent
const COMMAND_AGENT_MAP: Record<string, string> = {
  "/spec": "quetzalcoatl",
  "/design": "quetzalcoatl",
  "/evolve": "quetzalcoatl",
  "/plan": "moctezuma",
  "/build": "tlaloc",
  "/test": "mictlantecuhtli",
  "/review": "tezcatlipoca",
  "/ship": "mictlantecuhtli",
  "/code-simplify": "tlaloc",
  "/webperf": "mictlantecuhtli",
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INTENT_PATTERNS: Record<string, string[]> = {
  "/spec": [
    "nueva feature", "requisito", "idea", "necesito", "quiero crear",
    "new feature", "requirement", "spec", "especificacion", "especifica",
    "create", "define", "write spec", "specification",
    "what should", "proposal", "need a feature",
  ],
  "/design": [
    "design", "diseña", "diseñar", "ui", "ux", "interface", "interfaz",
    "mockup", "wireframe", "layout", "component design", "design system",
    "user experience", "user interface", "visual", "frontend design",
  ],
  "/evolve": [
    "evolucion", "evolve", "evolucionar", "proyecto existente",
    "documentacion viva", "living documentation", "actualizar docs",
    "modificar spec", "nuevo requisito", "cambio de requisitos",
    "refinar specs", "resolver issue", "mantenimiento evolutivo",
    "cliente cambio", "client change", "nueva funcionalidad",
    "cambiar arquitectura", "update documentation",
  ],
  "/plan": [
    "planifica", "divide", "tasks", "plan", "divide en tareas",
    "divide en", "desglosa", "breakdown",
    "task breakdown", "planning", "organize", "steps", "milestones",
    "task list", "todos", "to-do", "story points", "estimate",
  ],
  "/build": [
    "implementa", "codifica", "construye", "implement", "build", "code",
    "escribe el codigo", "escribe codigo",
    "write code", "create file", "add functionality", "make", "generate",
    "develop", "produce", "set up", "scaffold", "boilerplate",
    "create function", "create class", "create module", "create component",
  ],
  "/test": [
    "test", "prueba", "pruebas", "testing",
    "unit test", "integration test", "e2e", "specs", "coverage",
    "assert", "mock", "stub", "tdd", "red-green",
  ],
  "/review": [
    "revisa", "review", "codigo", "code review", "revisar codigo",
    "code quality", "audit", "inspect", "check code", "verify code",
    "static analysis", "lint", "clean code", "best practices",
  ],
  "/ship": [
    "ship", "deploy", "lanza", "lanzamiento", "deployment", "publicar",
    "release", "publish", "launch", "go live", "rollout",
    "staging", "production", "ci/cd", "pipeline", "deliver",
  ],
  "/code-simplify": [
    "simplifica", "refactor", "limpia", "simplify", "simplificar",
    "simplify code", "clean up", "refactor code", "improve code",
    "technical debt", "complex", "duplicate", "extract method",
    "reduce complexity", "make it simpler", "cleanup",
  ],
  "/webperf": [
    "performance", "rendimiento", "core web vitals", "lighthouse",
    "web performance", "cargar", "lcp", "inp", "cls",
    "performance audit", "speed", "velocidad", "optimizar pagina",
    "page speed", "carga de pagina", "optimizar rendimiento",
  ],
}

/** Normalizes a bash command for safer regex matching — strips comments, collapses whitespace. */
const normalizeBash = (cmd: string): string =>
  cmd.replace(/#.*/g, '')           // strip comments
     .replace(/\s+/g, ' ')          // collapse whitespace
     .trim()

// Case-insensitive regex patterns for destructive commands
// NOTE: Use \s (single backslash) in regex literals — \\s matches literal backslash+letter
// NOTE: This is a safety net, not a security boundary. Advanced bypasses (variable expansion,
//       command substitution) are not covered. Use proper sandboxing for untrusted code.
const DESTRUCTIVE_PATTERNS: RegExp[] = [
  /rm\s+-[a-z]*r[a-z]*f\b/i,       // rm -r -f, rm -rf, rm -fir, etc.
  /rm\s+-[a-z]*f[a-z]*r\b/i,       // rm -f -r (reversed flag order)
  /git\s+push\s+(-f|--force)\b/i,   // git push -f, git push --force
  /drop\s+table\b/i,                // DROP TABLE (with or without IF EXISTS)
  /drop\s+database\b/i,             // DROP DATABASE
  /mkfs\b/i,                        // mkfs, mkfs.ext4 — disk formatting
  /dd\s+if=/i,                      // dd if=/dev/zero of=/dev/sda — disk destruction
  /chmod\s+-R\s+777\s+\//i,         // chmod -R 777 / — permission destruction
]

// Command → SDD phase mapping (module-level to avoid recreating the map on every call)
const COMMAND_PHASE_MAP: Record<string, string> = {
  "/spec": "define",
  "/design": "define",
  "/evolve": "define",
  "/plan": "plan",
  "/build": "build",
  "/test": "verify",
  "/review": "review",
  "/ship": "ship",
  "/code-simplify": "review",
  "/webperf": "review",
}

// ---------------------------------------------------------------------------
// Valid Subagent Names (for task() validation)
// ---------------------------------------------------------------------------

// All 102 agents: 96 subagents + 6 primary agents
// Used to validate task() calls — rejects invented subagent names
const VALID_SUBAGENTS = new Set([
  // Primary agents
  'huitzilopochtli', 'quetzalcoatl', 'moctezuma', 'tlaloc', 'mictlantecuhtli', 'tezcatlipoca',
  // Backend & APIs
  'backend-developer', 'typescript-pro', 'python-pro', 'golang-pro', 'rust-engineer',
  'java-architect', 'csharp-developer', 'fastapi-developer', 'graphql-architect',
  'spring-boot-engineer', 'django-developer', 'laravel-specialist', 'php-pro',
  'nextjs-developer', 'elixir-expert', 'ruby-pro', 'kotlin-specialist',
  'websocket-engineer', 'microservices-architect', 'cpp-pro', 'javascript-pro',
  'fullstack-developer',
  // Frontend & Mobile
  'angular-architect', 'flutter-expert', 'frontend-developer', 'mobile-app-developer',
  'mobile-developer', 'react-specialist', 'swift-expert', 'vue-expert',
  // Database & Data
  'database-optimizer', 'postgres-pro', 'sql-pro', 'data-analyst', 'data-engineer',
  'data-scientist', 'data-researcher', 'database-administrator',
  // DevOps & Infra
  'docker-expert', 'kubernetes-specialist', 'terraform-engineer', 'devops-engineer',
  'build-engineer', 'sre-engineer', 'cloud-architect', 'platform-engineer',
  'network-engineer', 'azure-infra-engineer', 'deployment-engineer',
  // Security
  'security-auditor', 'dependency-manager', 'legal-advisor',
  // Testing & QA
  'test-engineer', 'code-reviewer', 'accessibility-tester', 'chaos-engineer',
  'refactorer', 'error-detective', 'error-coordinator', 'web-performance-auditor',
  // Debugging
  'debugger',
  // AI / ML
  'ai-engineer', 'llm-architect', 'mlops-engineer', 'machine-learning-engineer',
  'nlp-engineer', 'prompt-engineer',
  // DX & Tooling
  'cli-developer', 'tooling-engineer', 'mcp-developer', 'dx-optimizer', 'context-manager',
  // Processes
  'git-workflow-manager', 'incident-responder', 'project-manager', 'scrum-master',
  'legacy-modernizer',
  // Specialized Domains
  'fintech-engineer', 'payment-integration', 'blockchain-developer', 'game-developer',
  'iot-engineer', 'embedded-systems',
  // Documentation & Research
  'docs-writer', 'research-analyst', 'knowledge-synthesizer',
  'scientific-literature-researcher', 'search-specialist',
  // Product & Business
  'business-analyst', 'product-manager', 'competitive-analyst', 'content-marketer',
  'market-researcher', 'sales-engineer', 'seo-specialist', 'trend-analyst', 'ux-researcher',
])

// ---------------------------------------------------------------------------
// Intent → Command mapping (for visible suggestions in system prompt)
// ---------------------------------------------------------------------------

// Maps keywords to their suggested command (reverse of INTENT_PATTERNS structure)
const INTENT_SUGGESTION_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(INTENT_PATTERNS).flatMap(([cmd, keywords]) =>
    keywords.map((kw) => [kw, cmd])
  ),
)

// ---------------------------------------------------------------------------
// SDD Phase Suggestions (advisory, not enforced)
// ---------------------------------------------------------------------------

const PHASE_SUGGESTIONS: Record<string, Record<string, string>> = {
  idle: {},
  define: {
    moctezuma: 'Consider /spec, /evolve, or /design to define requirements.',
    tlaloc: 'Consider /spec or /evolve first to define requirements.',
    mictlantecuhtli: 'Consider /spec or /evolve first to define requirements.',
    tezcatlipoca: 'Consider /spec or /evolve first to define requirements.',
  },
  plan: {
    quetzalcoatl: 'Consider /spec or /design first to define requirements.',
    tlaloc: 'Consider /plan first to break work into tasks.',
    mictlantecuhtli: 'Consider /plan first to break work into tasks.',
    tezcatlipoca: 'Consider /plan first to break work into tasks.',
  },
  build: {
    huitzilopochtli: 'Consider delegating implementation to tlaloc via /build.',
    quetzalcoatl: 'Consider /spec or /design first, then /plan.',
    moctezuma: 'Consider /plan first, then /build.',
    mictlantecuhtli: 'Consider /build first to implement code.',
    tezcatlipoca: 'Consider /build first to implement code.',
  },
  verify: {
    huitzilopochtli: 'Consider /build first to implement code.',
    quetzalcoatl: 'Consider /spec → /plan → /build before testing.',
    moctezuma: 'Consider /build first, then /test.',
    tlaloc: 'Consider /test to verify your implementation.',
    tezcatlipoca: 'Consider /test to verify code quality.',
  },
  review: {
    huitzilopochtli: 'Consider /test first to verify code quality.',
    quetzalcoatl: 'Consider /spec → /plan → /build → /test before review.',
    moctezuma: 'Consider /test first, then /review.',
    tlaloc: 'Consider /test first, then /review.',
    mictlantecuhtli: 'Consider /review to audit code quality.',
  },
  ship: {
    huitzilopochtli: 'Consider /test and /review before shipping.',
    quetzalcoatl: 'Consider full SDD cycle before shipping.',
    moctezuma: 'Consider /test and /review before shipping.',
    tlaloc: 'Consider /test and /review before shipping.',
    // tezcatlipoca: read-only agent, cannot ship — no suggestion
  },
}

const MAX_AUDIT_LINES = 500


// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export const SddPipelinePlugin: Plugin = async (ctx) => {
  const { directory } = ctx

  // ── Paths ────────────────────────────────────────────────────────────────
  const projectDir = directory || process.cwd()
  const pluginsDir = join(projectDir, ".opencode", "plugins")
  const auditLogPath = join(pluginsDir, ".sdd-audit.log")

  // ── In-memory SDD state (no persistence — detected fresh each session) ──
  const sddState: SddState = {
    pipeline_phase: "idle",
    active_spec: null,
    current_task: null,
    completed_tasks: [],
    pending_tasks: [],
    agent_type: "unknown",
    last_intent: null,
  }

  // ── Audit log helpers ────────────────────────────────────────────────────

  // [P1] In-memory line count — avoids re-reading the file on every append.
  //      Reset to 0 if file doesn't exist; set on init; tracked in audit().
  let auditLineCount = 0

  /** Reads the audit log, counts lines, and truncates to half if >= MAX_AUDIT_LINES. */
  const maybeRotateAuditLog = (): void => {
    if (!existsSync(auditLogPath)) {
      auditLineCount = 0
      return
    }
    const content = readFileSync(auditLogPath, "utf-8")
    const lines = content.split("\n")
    // Remove trailing empty line from split if file ends with newline
    auditLineCount = lines.length > 0 && lines[lines.length - 1] === "" ? lines.length - 1 : lines.length
    if (auditLineCount >= MAX_AUDIT_LINES) {
      const keep = lines.slice(-(MAX_AUDIT_LINES / 2))
      writeFileSync(auditLogPath, keep.join("\n") + "\n")
      auditLineCount = keep.length
      console.debug("[sdd-pipeline] Audit log truncated on init")
    }
  }

  // Init: rotate if needed and seed line count
  try {
    maybeRotateAuditLog()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.debug("[sdd-pipeline] Could not truncate audit log:", msg)
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Sanitizes a string for safe log entry — prevents newline injection. */
  const sanitize = (s: string): string => s.replace(/[\n\r]/g, '_')

  /** Writes a timestamped entry to the audit log file. Handles rotation when line count exceeds limit. */
  const audit = (source: string, detail: string): void => {
    try {
      const timestamp = new Date().toISOString()
      const entry = `[${timestamp}] [${source}] ${sanitize(detail)}\n`

      // [P1] Rotate only when in-memory count reaches threshold
      if (auditLineCount >= MAX_AUDIT_LINES) {
        maybeRotateAuditLog()
      }

      appendFileSync(auditLogPath, entry)
      auditLineCount++
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.debug("[sdd-pipeline] Could not write audit log:", msg)
    }
  }

  // ── Build injected context strings ───────────────────────────────────────

  /** Constructs the full SDD context string including pipeline state. */
  const buildSddContext = (): string => {
    const lines = [
      "## SDD Pipeline State",
      `- Phase: ${sddState.pipeline_phase}`,
      `- Active spec: ${sddState.active_spec ?? "none"}`,
      `- Current task: ${sddState.current_task ?? "none"}`,
      `- Agent type: ${sddState.agent_type}`,
      `- Completed: ${sddState.completed_tasks.join(", ") || "none"}`,
      `- Pending: ${sddState.pending_tasks.join(", ") || "none"}`,
    ]
    return lines.join("\n")
  }

  /** Maps a slash command to its corresponding SDD pipeline phase. */
  const commandToPhase = (command: string): string => COMMAND_PHASE_MAP[command] ?? "idle"

  // ── Hooks ────────────────────────────────────────────────────────────────

  return {

    /**
     * Fires before each LLM call to build the system prompt.
     * Injects SDD pipeline state so the agent
     * always has the orchestration guides available from the FIRST message.
     */
    "experimental.chat.system.transform": async (
      _input: unknown,
      output: unknown,
    ) => {
      try {
        const out = output as { system: string[] }

        // Inject SDD state at the beginning so it appears early in the system prompt
        const sddContext = buildSddContext()
        
        // Add phase suggestion if agent is used outside typical phase
        const suggestion = PHASE_SUGGESTIONS[sddState.pipeline_phase]?.[sddState.agent_type]
        const suggestionLine = suggestion ? `
> **Suggestion:** ${suggestion}` : ''
        
        // Add intent suggestion if detected in last user message (visible to model)
        let intentLine = ''
        if (sddState.last_intent) {
          intentLine = `\n> **Intent detected:** User wants to \`${sddState.last_intent}\`. Suggest they use the command.`
          sddState.last_intent = null // Consume intent after injecting
        }
        
        out.system.unshift(sddContext + suggestionLine + intentLine)
        audit("system.transform", `Injected SDD state (agent: ${sddState.agent_type}, phase: ${sddState.pipeline_phase})`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[sdd-pipeline] Error in system.transform:", msg)
      }
    },

    /**
     * Fires when a new message is received.
     * Detects user intent and suggests the matching SDD slash command.
     */
    "chat.message": async (
      _input: unknown,
      output: unknown,
    ) => {
      try {
        const out = output as MessageEvent
        const content = out?.message?.content ?? ""
        if (!content) return

        const lower = content.toLowerCase()

        // --- Detect agent mentions (e.g., "@tlaloc", "agente tezcatlipoca") ---
        for (const [agentType, patterns] of Object.entries(AGENT_MENTION_PATTERNS)) {
          if (patterns.some((p) => p.test(content))) {
            if (sddState.agent_type !== agentType) {
              sddState.agent_type = agentType
              audit("chat.message", `Agent switched via mention: ${agentType}`)
            }
            break
          }
        }

        // --- Detect slash commands that load specific agents ---
        // Commands override EVERYTHING — they represent explicit user intent.
        // Always set the agent, even if it's the same (ensures state is persisted
        // on the first command after session start when agent is "unknown").
        // Must be followed by space, EOL, or non-word char to avoid false matches
        // like "/specification" matching "/spec".
        for (const [command, agentType] of Object.entries(COMMAND_AGENT_MAP)) {
          if (lower.startsWith(command)) {
            const nextChar = lower[command.length]
            const isEnd = lower.length === command.length
            const hasBoundary = isEnd || !nextChar || /\s/.test(nextChar)
            if (!hasBoundary) continue
            const prev = sddState.agent_type
            sddState.agent_type = agentType
            sddState.pipeline_phase = commandToPhase(command)
            if (prev !== agentType) {
              audit("chat.message", `Agent switched via command ${command}: ${agentType}`)
            }
            break
          }
        }

        // --- Detect SDD intent keywords ---
        // Store intent so system.transform can inject a visible suggestion.
        // Uses word-boundary regex to avoid false positives on common English
        // substrings (e.g., "relationship status" should NOT match /ship,
        // "I protest this decision" should NOT match /test).
        for (const [command, keywords] of Object.entries(INTENT_PATTERNS)) {
          if (keywords.some((kw) => {
            const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            return new RegExp(`\\b${escaped}\\b`, 'i').test(content)
          })) {
            sddState.last_intent = command
            audit("chat.message", `intent=${command}`)
            break
          }
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[sdd-pipeline] Error in chat.message:", msg)
      }
    },

    /**
     * Fires before a tool executes.
     * Enforces tool permissions, bash write rules, and SDD phase enforcement.
     */
    "tool.execute.before": async (
      input: unknown,
      output: unknown,
    ) => {
      const inp = input as { tool?: string } | undefined
      const out = output as { args?: Record<string, unknown> } | undefined

      try {
        const tool = inp?.tool ?? ""
        const args = out?.args ?? {}

        // --- Always block destructive commands ---
        if (tool === "Bash" || tool === "bash") {
          // Normalize the command before checking: strip comments, collapse whitespace
          // This prevents bypasses like "rm  -rf" (double space) or "rm -r -f" (split flags)
          const cmd = normalizeBash((args.command as string) ?? "")
          for (const pattern of DESTRUCTIVE_PATTERNS) {
            if (pattern.test(cmd)) {
              audit("tool.before", `BLOCKED ${tool}: destructive command`)
              throw new SddError("Destructive command blocked. Use safe alternatives.")
            }
          }
        }

        // --- Task() Subagent Name Validation ---
        // [C2] Use .toLowerCase() to handle any case variant ("task", "Task", "TASK")
        if (tool.toLowerCase() === "task") {
          // Extract only the subagent identifier from known parameter keys.
          // Do NOT scan all string values — task() has other string params
          // (description, prompt, command) that are not subagent names.
          const subagentName = (args.subagent_type as string)
            ?? (args.agent as string)
            ?? (args.name as string)
            ?? (args.type as string)
            ?? (args.subagent as string)
            ?? ""

          if (!subagentName && Object.keys(args).length > 0) {
            console.debug("[sdd-pipeline] task() args have no recognizable subagent key:", Object.keys(args))
          }

          if (subagentName && !VALID_SUBAGENTS.has(subagentName)) {
            audit('tool.before', `BLOCKED task: unknown subagent "${subagentName}"`)
            throw new SddError(`Unknown subagent: "${subagentName}". Use an agent from the VALID_SUBAGENTS catalog.`)
          }
        }

      } catch (err: unknown) {
        // [R2] Re-throw our own SddError instances; log everything else
        if (err instanceof SddError) throw err
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[sdd-pipeline] Error in tool.before:", msg)
      }
    },

    /**
     * Fires after a tool returns a result.
     * Lightweight audit logging.
     */
    "tool.execute.after": async (
      input: unknown,
    ) => {
      try {
        const inp = input as { tool?: string } | undefined
        audit("tool.after", `${inp?.tool ?? "unknown"} completed`)
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[sdd-pipeline] Error in tool.after:", msg)
      }
    },

    /**
     * Fires during context compaction.
     * Re-injects SDD state into the compacted context.
     */
    "experimental.session.compacting": async (
      _input: unknown,
      output: unknown,
    ) => {
      try {
        const out = output as { context?: string[] }

        out.context?.push(buildSddContext())

        audit("session.compacting", "Injected SDD state")
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error("[sdd-pipeline] Error in session.compacting:", msg)
      }
    },
  }
}

export default SddPipelinePlugin
