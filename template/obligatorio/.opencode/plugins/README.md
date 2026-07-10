# SDD Pipeline Plugin

OpenCode plugin that hooks into the lifecycle of the actual SDK API `@opencode-ai/plugin`.

## Design Principle

**The plugin only handles what OpenCode cannot manage natively.**

OpenCode already manages permissions, agent configs, skills, and commands via YAML frontmatter and `opencode.json`. The plugin should NOT duplicate this logic. When agents, skills, or commands change, you only update the OpenCode configs — not the plugin.

| Managed by OpenCode | Managed by this plugin |
|---------------------|----------------------|
| Agent permissions (write/edit/patch/task/bash) | SDD pipeline state (phase, tasks, spec) |
| Agent model, temperature, steps | Slash command → agent mapping |
| Skill loading and discovery | Intent detection from free text |
| Command definitions | Destructive command blocking (safety net) |
| Bash permission rules | Subagent name validation (catalog integrity) |
| Subagent delegation rules | Phase suggestions (advisory) |

## Implemented Hooks

| Event (actual API) | Purpose |
|---|---|
| `experimental.chat.system.transform` | Injects SDD pipeline state + intent suggestions in system prompt |
| `chat.message` | Detects agent mentions, slash commands, and user intent. Commands have priority over mentions |
| `tool.execute.before` | Blocks destructive commands + validates subagent names |
| `tool.execute.after` | Tool auditing with automatic rotation |
| `experimental.session.compacting` | Re-injects SDD state into compacted context |

## Runtime Files

- `.opencode/plugins/.sdd-audit.log` — audit trace with automatic rotation (>500 lines → truncates to 250)

Ignored by git.

## What the Plugin Enforces

### 1. Destructive Command Blocking

The plugin blocks destructive commands for ALL agents — a global safety net that OpenCode's per-agent permissions don't cover:

```typescript
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
```

Commands are normalized before matching: comments stripped, whitespace collapsed.

### 2. Subagent Name Validation

The plugin validates that subagent names in `task()` exist in the catalog (**103 agents**: 97 subagents + 6 primary). If the LLM invents a name, it receives an error:

```
Unknown subagent: "python-wizard". Use an agent from the VALID_SUBAGENTS catalog.
```

The `VALID_SUBAGENTS` Set contains all valid agent names organized by domain:

| Domain | Count | Agents |
|--------|:-----:|--------|
| Primary | 6 | huitzilopochtli, quetzalcoatl, moctezuma, tlaloc, mictlantecuhtli, tezcatlipoca |
| Backend & APIs | 22 | backend-developer, typescript-pro, python-pro, golang-pro, rust-engineer, java-architect, csharp-developer, fastapi-developer, graphql-architect, spring-boot-engineer, django-developer, laravel-specialist, php-pro, nextjs-developer, elixir-expert, ruby-pro, kotlin-specialist, websocket-engineer, microservices-architect, cpp-pro, javascript-pro, fullstack-developer |
| Frontend & Mobile | 8 | angular-architect, flutter-expert, frontend-developer, mobile-app-developer, mobile-developer, react-specialist, swift-expert, vue-expert |
| Database & Data | 8 | database-optimizer, postgres-pro, sql-pro, data-analyst, data-engineer, data-scientist, data-researcher, database-administrator |
| DevOps & Infra | 11 | docker-expert, kubernetes-specialist, terraform-engineer, devops-engineer, build-engineer, sre-engineer, cloud-architect, platform-engineer, network-engineer, azure-infra-engineer, deployment-engineer |
| Security | 3 | security-auditor, dependency-manager, legal-advisor |
| Testing & QA | 8 | test-engineer, code-reviewer, accessibility-tester, chaos-engineer, refactorer, error-detective, error-coordinator, web-performance-auditor |
| Debugging | 1 | debugger |
| AI / ML | 6 | ai-engineer, llm-architect, mlops-engineer, machine-learning-engineer, nlp-engineer, prompt-engineer |
| DX & Tooling | 5 | cli-developer, tooling-engineer, mcp-developer, dx-optimizer, context-manager |
| Processes | 5 | git-workflow-manager, incident-responder, project-manager, scrum-master, legacy-modernizer |
| Specialized Domains | 6 | fintech-engineer, payment-integration, blockchain-developer, game-developer, iot-engineer, embedded-systems |
| Documentation & Research | 5 | docs-writer, research-analyst, knowledge-synthesizer, scientific-literature-researcher, search-specialist |
| Product & Business | 9 | business-analyst, product-manager, competitive-analyst, content-marketer, market-researcher, sales-engineer, seo-specialist, trend-analyst, ux-researcher |

Validation checks `args.subagent_type`, `args.agent`, `args.name`, `args.type`, or `args.subagent` for the name.

## What OpenCode Manages (not the plugin)

These are configured in agent file YAML frontmatter and `opencode.json`:

- **Agent permissions**: write, edit, patch, task, bash per agent
- **Agent models**: which model each agent uses
- **Skill loading**: which skills are available
- **Command definitions**: slash command definitions
- **Bash rules**: per-agent bash permission patterns
- **Subagent delegation**: which agents can delegate to which subagents (configured per agent, not enforced by the plugin)

## SDD Phase Suggestions

When an agent is used outside its typical phase, the plugin suggests using the correct command. Example:

```
> **Suggestion:** Consider /build first to implement code.
```

Suggestions are **advisory only** — they never block the agent.

## How it works

1. **On session start**: `experimental.chat.system.transform` injects the SDD pipeline state + intent suggestions in the system prompt. State is in-memory only — no persistence between sessions.
2. **Each message**: `chat.message` detects agent mentions, slash commands, and intent. Commands have priority over mentions. When it detects a mention or command, it updates the active agent in memory.
3. **Before each tool**: `tool.execute.before` blocks destructive commands and validates subagent names.
4. **After each tool**: `tool.execute.after` logs to the audit log.
5. **On compaction**: `experimental.session.compacting` re-injects the SDD state into the compacted context.

> The meta-skill (`using-agent-skills`) is **not** injected automatically to save tokens (~4,000 per call). OpenCode exposes it as an available skill; agents load it on demand with the `skill` tool.

## Agent Detection

The plugin tracks the active agent via two mechanisms:

### 1. Agent Mention Patterns (user messages)
Detection of mentions in user messages:
```
@tlaloc, agente tezcatlipoca → updates active agent
```

### 2. Command-Agent Map (slash commands)
Mapping of slash commands to their primary agent:
```
/build → tlaloc
/code-simplify → tlaloc
/design → quetzalcoatl
/evolve → quetzalcoatl
/plan → moctezuma
/review → tezcatlipoca
/ship → mictlantecuhtli
/spec → quetzalcoatl
/test → mictlantecuhtli
/webperf → mictlantecuhtli
```

**Complete flow:**
1. `chat.message` detects mentions and commands in user messages (commands > mentions)
2. State lives in memory for the session duration

## Subagent Delegation

Primary agents can delegate to subagents via `task()`. Each subagent operates in an isolated subcontext with its **own permissions**, not the parent's. Delegation rules are configured in each agent file's YAML frontmatter — the plugin only validates the subagent name exists in the catalog, it does not enforce which agents can delegate to which subagents.

| Primary agent | Can delegate? | Config source |
|----------------|:---:|---|
| huitzilopochtli | ✅ | Agent YAML frontmatter |
| quetzalcoatl | ✅ | Agent YAML frontmatter |
| moctezuma | ❌ | Agent YAML frontmatter |
| tlaloc | ✅ | Agent YAML frontmatter |
| mictlantecuhtli | ✅ | Agent YAML frontmatter |
| tezcatlipoca | ❌ | Agent YAML frontmatter |

## Source

Plugin: `sdd-pipeline.ts` (~574 lines)
