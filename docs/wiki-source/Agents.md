# Agents — Códice Workspace Agent Architecture

The Códice workspace defines a two-tier agent hierarchy that governs how AI assists your development workflow. Every command, every task, and every delegation flows through this system — understanding it is key to using the workspace effectively.

## Architecture Overview

The workspace ships with **103 agents** organized into two levels:

| Level | Count | Role | How They're Invoked |
|-------|-------|------|---------------------|
| **Primary Agents** | 6 | Entry points for slash commands | Via `/command` from the user |
| **Subagents** | ~97 | Domain specialists | Via `task()` from a primary agent |

### Two-Tier Model

**Primary agents** are the generals. Each owns a set of slash commands and is responsible for orchestrating work. They delegate to subagents rather than doing everything themselves, because a primary agent's context window fills quickly:

- Huitzilopochtli delegates implementation to tlaloc.
- Quetzalcoatl delegates documentation to docs-writer, research to research-analyst, and security analysis to security-auditor.
- Mictlantecuhtli fans out to code-reviewer, test-engineer, dependency-manager, and security-auditor in parallel during `/ship`.

**Subagents** are domain experts with deep knowledge of a specific area: a programming language, an architectural pattern, a tool, or a process. They are invoked via the `task()` mechanism when a primary agent needs specialized work done. Each subagent runs in its own context window and returns its output to the calling primary agent.

The division exists because no single AI context window can hold expertise across 97 domains. A Python developer doesn't need Kubernetes configs in its context; a security auditor doesn't need React component patterns. The two-tier model keeps each agent focused and its context clean.

### File Count and Distribution

Agents are organized by domain in the `agents/` directory:

```
agents/
├── huitzilopochtli.md, quetzalcoatl.md, moctezuma.md
├── tlaloc.md, mictlantecuhtli.md, tezcatlipoca.md
├── backend-developer.md, typescript-pro.md, python-pro.md
├── golang-pro.md, rust-engineer.md, java-architect.md
├── docker-expert.md, kubernetes-specialist.md
├── security-auditor.md, test-engineer.md, debugger.md
├── ...
```

Each agent file follows the same structure (see [Agent File Pattern](#agent-file-pattern) below).

## Primary Agents

The six primary agents form the backbone of the workspace's SDD (Spec-driven Development) lifecycle.

| Agent | Role | Domain | Permission Model | Key Commands |
|-------|------|--------|-----------------|--------------|
| **huitzilopochtli** | Commander-in-Chief | Coordination & delegation | Read-only (writes denied). Delegates everything via `task()`. | `/ship` |
| **quetzalcoatl** | Visionary Sage | Planning & documentation | Writes only to markdown files. Cannot write code or tasks. | `/spec`, `/design`, `/evolve`, `/docs-update`, `/diagnosis` |
| **moctezuma** | Strategic Planner | Task breakdown & execution | Writes only to `tasks/` directory. Everything else read-only. | `/plan` |
| **tlaloc** | Builder and Artisan | Implementation & testing | Full write + edit permissions across all files. Can delegate to any subagent. | `/build`, `/code-simplify` |
| **mictlantecuhtli** | Guardian of the Underworld | Security, quality & review | Write + edit allowed. Delegates to quality-focused subagents (code-reviewer, security-auditor, test-engineer, etc.). | `/test`, `/ship`, `/webperf` |
| **tezcatlipoca** | Mirror of Truth | Reflection & analysis | Purely read-only + analysis tools. Cannot write or edit any file. Cannot delegate to subagents. | `/review` |

### Agent File Pattern

Every agent file follows the same structure:

1. **YAML frontmatter** — Agent metadata and permissions.
2. **Markdown body** — Role definition, domain knowledge, rules, and behavioral constraints.
3. **`## Composition` block** — Explicit invocation rules at the end of the file.

Here is the frontmatter structure for a primary agent:

```yaml
---
description: "Agent Name - Role Title"
mode: primary
permission:
  write: deny
  edit: allow
  grep: allow
  glob: allow
  lsp: allow
  task:
    "*": deny
    "specific-subagent": allow
  todowrite: allow
  webfetch: allow
  websearch: allow
  question: allow
  bash:
    "* > *": deny
    "* >> *": deny
    "touch *": deny
    "mkdir *": deny
    "cp *": deny
    "mv *": deny
    "rm *": deny
    "chmod *": deny
    "chown *": deny
    "ln *": deny
---
```

And for a subagent:

```yaml
---
description: Clear, one-line description of what this agent does
mode: subagent
temperature: 0.1
color: "#hexcolor"
hidden: true
permission:
  write: allow
  edit: allow
  bash:
    "go *": allow
    "npm *": allow
    ...
  grep: allow
  glob: allow
  lsp: allow
  skill: allow
  task:
    "*": deny
  todowrite: allow
  webfetch: allow
  websearch: allow
  question: allow
---
```

The `## Composition` block at the end of every agent file follows a standard format:

```markdown
## COMPOSITION

- **Invoke directly when:** [Circumstances where a user would call this agent directly.]
- **Invoke via:** [Primary agents (via task delegation)] or specific commands.
- **Do not invoke from:** [What not to use this agent for.]
```

### Permission Model

The permission system controls what tools each agent can use. There are three key axes:

| Axis | Values | Description |
|------|--------|-------------|
| **write** | `allow` / `deny` | Controls file creation |
| **edit** | `allow` / `deny` | Controls file modification |
| **bash** | `allow` / `deny` + patterns | Controls shell command execution. Patterns like `"* > *": deny` block redirect operators. |

The `task` section controls which subagents a primary agent can delegate to:

```yaml
task:
  "*": deny            # Block all subagents by default
  "docs-writer": allow # Except docs-writer
```

## Subagents

Subagents cover 97+ domain specialties organized into categories:

| Category | Example Agents | Count |
|----------|---------------|-------|
| Backend & APIs | backend-developer, typescript-pro, python-pro, golang-pro, rust-engineer, java-architect, fastapi-developer, graphql-architect, django-developer | ~20 |
| Frontend & Mobile | frontend-developer, react-specialist, vue-expert, angular-architect, flutter-expert, swift-expert, mobile-developer | ~9 |
| Database & Data | postgres-pro, sql-pro, data-analyst, data-engineer, data-scientist, database-optimizer | ~7 |
| DevOps & Infra | docker-expert, kubernetes-specialist, terraform-engineer, devops-engineer, sre-engineer, cloud-architect, platform-engineer | ~12 |
| Security | security-auditor, dependency-manager, legal-advisor | ~3 |
| Testing & QA | test-engineer, code-reviewer, accessibility-tester, chaos-engineer, web-performance-auditor | ~7 |
| AI / ML | ai-engineer, llm-architect, mlops-engineer, machine-learning-engineer, nlp-engineer, prompt-engineer | ~6 |
| DX & Tooling | cli-developer, tooling-engineer, mcp-developer, dx-optimizer, context-manager | ~5 |
| Documentation & Research | docs-writer, research-analyst, knowledge-synthesizer, scientific-literature-researcher | ~5 |
| Product & Business | product-manager, business-analyst, competitive-analyst, content-marketer, seo-specialist, ux-researcher | ~9 |
| Specialized Domains | fintech-engineer, payment-integration, blockchain-developer, game-developer, iot-engineer, embedded-systems | ~6 |
| Processes | git-workflow-manager, incident-responder, project-manager, scrum-master, legacy-modernizer | ~5 |

Subagents are registered in the `VALID_SUBAGENTS` Set within `.opencode/plugins/sdd-pipeline.ts`. This set is used to validate all `task()` calls — if you try to delegate to an agent name not in this set, the SDD plugin rejects it with an error. This prevents the AI from inventing non-existent agent names.

## How to Add a New Subagent

Adding a new agent to the workspace requires updating the agent definition, the validation set, and the agent index. Follow these steps:

### Step 1: Determine Agent Type

Decide whether your new agent is a **subagent** (domain expert, invoked via `task()`) or a **primary agent** (entry point for slash commands). Most new agents should be subagents — primary agents are reserved for major workflow roles.

For this guide, we will create a **subagent** called `joke-teller`.

### Step 2: Create the Agent File

Create `agents/joke-teller.md` with YAML frontmatter and a markdown body:

```markdown
---
description: Tells programming jokes to lighten the mood during development sessions
mode: subagent
temperature: 0.7
color: "#ffd700"
hidden: true
permission:
  write: deny
  edit: deny
  grep: allow
  glob: allow
  lsp: allow
  skill: allow
  task:
    "*": deny
  todowrite: allow
  question: allow
  bash:
    "curl *": allow
    "wget *": allow
---

# JOKE TELLER — MORALE BOOSTER

## Role & Directive

You are a programming joke teller. Your sole purpose is to bring levity
to the development process. When invoked, you:

1. Detect the user's current tech stack from the project context.
2. Fetch a programming-appropriate joke from an API or built-in list.
3. Deliver the joke with a punny punchline.

## Knowledge

- A curated list of programming jokes organized by language/framework.
- The JokeAPI endpoint for fetching random programming jokes.

## Composition

- **Invoke directly when:** The user wants a programming joke or needs a mood boost.
- **Invoke via:** Primary agents (via task delegation) during long build sessions.
- **Do not invoke from:** Another persona. This agent works standalone.
```

### Step 3: Register in VALID_SUBAGENTS

Open `.opencode/plugins/sdd-pipeline.ts` and find the `VALID_SUBAGENTS` Set (around line 163). Add your agent name to the appropriate category section:

```typescript
const VALID_SUBAGENTS = new Set([
  // ... existing agents ...
  // DX & Tooling
  'cli-developer', 'tooling-engineer', 'mcp-developer', 'dx-optimizer', 'context-manager',
  'joke-teller',  // <-- add here
  // ...
])
```

### Step 4: Update Delegation Tables

If the new subagent should be delegatable by primary agents, update the `task:` permission section in those primary agent files. For example, to allow tlaloc to delegate to joke-teller:

```yaml
# In agents/tlaloc.md
task:
  "*": ask
  "joke-teller": allow
```

### Step 5: Update the Agent Index

Add the new agent to the global catalog in `docs/opencode/03-agent-index.md` (or equivalent agent index) under the appropriate domain section.

### Step 6: Restart OpenCode

Restart your OpenCode session so it recognizes the new agent. Without a restart, `task("joke-teller")` will fail because OpenCode only loads agent files at startup.

## Composition Block Reference

Every agent file ends with a `## Composition` block that defines its invocation rules. The format is:

| Directive | Purpose | Example |
|-----------|---------|---------|
| **Invoke directly when** | When a user would call this agent directly | "Invoke directly when building CLI tools, MCP servers, or refactoring legacy code." |
| **Invoke via** | How primary agents delegate to this subagent | "Invoke via: Primary agents (via task delegation)" |
| **Do not invoke from** | Restrictions on who can call this agent | "Do not invoke from: Another persona without a specific task requiring this specialization." |

## Links

- [OpenCode Agent Documentation](https://opencode.ai/docs/agents) — Official OpenCode agent configuration guide.
- [Command Reference](Commands) — Slash commands that invoke primary agents.
- [SDD Pipeline Plugin](https://github.com/fisherk2/codice-opencode) — Source for the agent validation logic.
