# SDD Pipeline Plugin

The SDD (Spec-Driven Development) Pipeline is an OpenCode plugin that orchestrates the development lifecycle. It uses auto-discovery and configuration-driven behavior to manage state, validate actions, and guide the workflow.

> **Source:** `sdd-pipeline.ts` (385 lines) + 11 modules in `src/` (1112 lines) = **1497 lines total**
>
> **SDK:** `@opencode-ai/plugin` — see [opencode.ai/docs/plugins](https://opencode.ai/docs/plugins/) for the plugin API reference.

---

## Design Principle

**The plugin only handles what OpenCode cannot manage natively.**

OpenCode already manages permissions, agent configs, skills, and commands via YAML frontmatter and `opencode.json`. The plugin does not duplicate this logic:

| Managed by OpenCode | Managed by this plugin |
|---------------------|------------------------|
| Agent permissions (write, edit, patch, task, bash) | SDD pipeline state (current phase, tasks, spec status) |
| Agent model, temperature, steps | Slash command → agent routing |
| Skill loading and discovery | Intent detection from free-text messages |
| Command definitions (YAML frontmatter) | Destructive command blocking (safety net) |
| Bash permission rules | Subagent name validation (catalog integrity) |
| Subagent delegation rules | Phase suggestions (advisory next-step hints) |

---

## Implemented Hooks

| Hook | Purpose |
|------|---------|
| `experimental.chat.system.transform` | Injects SDD pipeline state + intent suggestions into the system prompt at session start |
| `chat.message` | Detects agent mentions (`@tlaloc`), slash commands (`/build`), and user intent. Commands take priority over mentions |
| `tool.execute.before` | Blocks destructive commands and validates subagent names before execution |
| `tool.execute.after` | Audits tool usage with automatic log rotation |
| `experimental.session.compacting` | Re-injects SDD state into compacted context to prevent state loss during compaction |

---

## What the Plugin Enforces

### 1. Destructive Command Blocking

The plugin blocks dangerous commands for ALL agents — a global safety net that OpenCode's per-agent permissions don't cover. It covers **53 bash command patterns** across **15 categories** (filesystem, git, SQL, Docker, Kubernetes, permissions, process, network, package managers, environment, disk, IaC, cloud, databases, PostgreSQL CLI).

Commands are normalized before pattern matching: comments are stripped and whitespace is collapsed. This prevents common evasion techniques like inline comments (`rm -rf && # safe`). The full pattern list is in `src/destructivePatterns.ts`.

> **Note:** This is independent of `opencode.json`'s `permission.bash` settings. The plugin blocks these patterns at the tool execution level, before OpenCode's permission system evaluates them.

### 2. Subagent Name Validation

When an agent uses `task()` to delegate to a subagent, the plugin validates that the subagent name exists in the catalog (**~360 agents**: ~355 subagents discovered from the `agents/` directory + 6 primary + 4 writer agents). If the LLM invents a name, it receives an error:

```
Unknown subagent: "python-wizard". Create an .md file in /path/to/project/agents/ or use a primary agent.
```

Subagent names are **auto-discovered from the filesystem** — there is no hardcoded subagent catalog. At session start, the plugin recursively scans the `agents/` directory (including subdirectories, skipping hidden entries) and treats every `*.md` file as a registered subagent. Adding a new agent requires only creating `agents/<name>.md`; no plugin changes are needed. Names match case-insensitively.

The validation checks these `task()` parameter fields for the agent name: `subagent_type`, `agent`, `name`, `type`, and `subagent`.

### 3. SDD Phase Suggestions

When an agent is used outside its typical phase, the plugin suggests the correct command:

```
> **Suggestion:** Consider /build first to implement code.
```

Suggestions are **advisory only** — they never block or override the agent.

---

## Agent Detection

The plugin tracks which agent is currently active through two mechanisms:

### Agent Mentions (user messages)

When a user mentions an agent by name or handle:

```
@tlaloc, build this feature
agente tezcatlipoca, revisa este codigo
```

The plugin updates the active agent for the session. Mention patterns follow the format `@agentname` or `agente agentname`.

### Command-Agent Map (slash commands)

Slash commands are mapped to their corresponding primary agent:

| Command | Agent |
|---------|-------|
| `/spec` | quetzalcoatl |
| `/evolve` | quetzalcoatl |
| `/design` | quetzalcoatl |
| `/docs-update` | quetzalcoatl |
| `/diagnosis` | quetzalcoatl |
| `/plan` | moctezuma |
| `/build` | tlaloc |
| `/code-simplify` | tlaloc |
| `/test` | mictlantecuhtli |
| `/webperf` | mictlantecuhtli |
| `/ship` | mictlantecuhtli |
| `/review` | tezcatlipoca |
| `/help` | huitzilopochtli |
| `/sync` | tlaloc |
| `/migrate` | quetzalcoatl |
| `/deploy` | mictlantecuhtli |
| `/analyze` | quetzalcoatl |

**Complete detection flow:**

1. `chat.message` hook fires on every user message
2. Detects mentions (`@agent`), then checks for slash commands (commands take priority)
3. Updates the active agent in memory for the session duration
4. On compaction, state is re-injected into the new context

---

## Subagent Delegation

Primary agents can delegate to subagents via `task()` only if their agent file's YAML frontmatter permits it. The plugin validates the subagent name but does **not** enforce which agents can delegate to which subagents — that is configured per agent:

| Primary agent | Can delegate? | Where configured |
|---------------|:---:|---|
| huitzilopochtli | Yes | Agent YAML frontmatter (`agents/huitzilopochtli.md`) |
| quetzalcoatl | Yes | Agent YAML frontmatter |
| moctezuma | No | Agent YAML frontmatter |
| tlaloc | Yes | Agent YAML frontmatter |
| mictlantecuhtli | Yes | Agent YAML frontmatter |
| tezcatlipoca | No | Agent YAML frontmatter |

> **Note:** Each subagent operates in an isolated subcontext with its **own permissions**, not the parent agent's permissions.

---

## Module Architecture

The plugin uses a 3-pillar architecture to minimize hardcoded configuration:

### Pillar 1: Auto-discovery (`autoDiscovery.ts`)

Scans `commands/*.md` frontmatter and `agents/*.md` filenames to derive configuration. Falls back to `DEFAULTS` when directories do not exist.

> **Note (FEV-20):** The `agents/` scan is **recursive** — subdirectories (e.g., `agents/packs/<pack-name>/`) are also scanned, and hidden entries (`.git`, `.opencode`, dot-files) are skipped. The 6 primary agents (`PRIMARY_AGENTS`) are the only hardcoded names; when no `agents/` directory exists, validation falls back to just those 6.

> **Note (v2.1):** Intent keywords are now **auto-discovered** from `commands/*.md` frontmatter, replacing the previously hardcoded `INTENT_PATTERNS` map. The plugin also supports **bilingual intent detection** (EN/ES) — Spanish keywords like "especificar" route to `/spec`, "sincronizar" routes to `/sync`. Unicode-aware tokenization with stopword filtering handles the translation.

### Pillar 2: Config-driven (`configLoader.ts` + `defaults.ts`)

Loads overrides from `opencode.json` `sddPipeline` section, merged with defaults. Only three maps are user-configurable: `commandPhaseMap`, `intentPatterns`, `phaseSuggestions`. Invalid entries are skipped with a warning.

### Pillar 3: Quality infrastructure

Biome linting/formatting, unit + integration tests, strict TypeScript with no `any`.

### Source files

| File | Lines | Responsibility |
|------|:-----:|----------------|
| `sdd-pipeline.ts` | 385 | Plugin entry point, hook implementations |
| `src/autoDiscovery.ts` | 159 | Filesystem scanning for commands and agents |
| `src/configLoader.ts` | 228 | opencode.json config loading with defaults merge |
| `src/defaults.ts` | 156 | All hardcoded configuration maps (VALID_SUBAGENTS removed in FEV-20) |
| `src/destructivePatterns.ts` | 95 | Blocked command patterns (safety boundary) |
| `src/directoryScanner.ts` | 99 | Flat + recursive markdown file scanners with maxDepth guard and duplicate-basename warning (extracted in FEV-20) |
| `src/normalizeBash.ts` | 40 | Bash command normalization for pattern matching |
| `src/types.ts` | 60 | TypeScript type definitions |

---

## Customizing the Plugin

The plugin is an **obligatorio** file — it will be overwritten on template updates. Configuration happens at two levels:

### Automatic (no manual edits needed)

- **New commands:** Create `commands/<name>.md` with `agent:` in YAML frontmatter. Auto-discovered on startup.
- **New agents:** Create `agents/<name>.md`. Auto-discovered on startup.

> **Official docs:** [opencode.ai/docs/plugins](https://opencode.ai/docs/plugins/) — OpenCode plugin SDK reference.

---

## See Also

- [Configuration](Configuration#agent-configuration) — Per-agent model, temperature, and step configuration
- [Commands](Commands) — Slash command definitions and how to add new ones
- [Agents](Agents) — Agent definitions, subagent catalog, and delegation rules
- [MCP Servers](MCP-Servers) — MCP server configuration and per-agent tool control
- [opencode.ai/docs/plugins](https://opencode.ai/docs/plugins/) — Official OpenCode plugin documentation
