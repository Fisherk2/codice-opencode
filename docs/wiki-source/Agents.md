# Agents — Códice Workspace Agent Architecture

The Códice workspace defines a two-tier agent hierarchy that governs how AI assists your development workflow. Every command, every task, and every delegation flows through this system — understanding it is key to using the workspace effectively.

## Architecture Overview

The workspace ships with **359 agents in 10 packs** organized into two levels:

| Level | Count | Role | How They're Invoked |
|-------|-------|------|---------------------|
| **Primary Agents** | 6 | Entry points for slash commands | Via `/command` from the user |
| **Subagents** | 349 | Domain specialists in 8 selectable packs | Via the `subagent` tool from a primary agent |

### Two-Tier Model

**Primary agents** are the generals. Each owns a set of slash commands and is responsible for orchestrating work. They delegate to subagents rather than doing everything themselves, because a primary agent's context window fills quickly:

- Huitzilopochtli delegates implementation to tlaloc.
- Quetzalcoatl delegates documentation to docs-writer, research to research-analyst, and security analysis to security-auditor.
- Tezcatlipoca fans out to code-reviewer, test-engineer, dependency-manager, and security-auditor in parallel during `/ship`, then delegates corrections to specialists.

**Subagents** are domain experts with deep knowledge of a specific area: a programming language, an architectural pattern, a tool, or a process. They are invoked via the `subagent` tool when a primary agent needs specialized work done. Each subagent runs in its own context window and returns its output to the calling primary agent.

The division exists because no single AI context window can hold expertise across 100+ domains. A Python developer doesn't need Kubernetes configs in its context; a security auditor doesn't need React component patterns. The two-tier model keeps each agent focused and its context clean.

### File Count and Distribution

Agents are organized by domain in the `template/obligatorio/packs/` directory:

```
packs/
├── main/                  (6 primary agents — MANDATORY)
├── writers/               (4 writer agents — MANDATORY)
├── software-development/  (144 agents — DEFAULT selected)
├── business/              (91 agents)
├── science-research/      (31 agents)
├── hardware-emerging/     (36 agents)
├── operations-support/    (18 agents)
├── finance/               (11 agents)
├── creative/              (10 agents)
└── government-legal/      (8 agents)
```

8 selectable packs = 349 agents; +6 primary + 4 writers = 359 total.

At install time, agents are copied to the flat `agents/` directory (pack is an installer concept — selected packs are chosen via the installer wizard; at runtime all agents are peers). Each agent file follows the same structure (see [Agent File Pattern](#agent-file-pattern) below).

## Primary Agents

The six primary agents form the backbone of the workspace's SDD (Spec-driven Development) lifecycle.

| Agent | Role | Domain | Permission Model | Key Commands |
|-------|------|--------|-----------------|--------------|
| **huitzilopochtli** | Commander-in-Chief | Coordination & delegation | Delegation-only (edits ask for approval). Delegates via the `subagent` tool (`subagent` `*` → `allow`, then explicit `deny` rules for the 5 other primaries). | `/help` |
| **quetzalcoatl** | Visionary Sage | Planning & documentation | Writes only to documentation formats (`*.md`, `*.txt`, `*.rst`, `*.adoc`). Cannot write code or tasks. Delegates via the unified `subagent` pattern. | `/spec`, `/design`, `/evolve`, `/docs-update`, `/migrate` |
| **moctezuma** | Strategic Planner | Task breakdown & execution | Writes only to `tasks/` directory. Everything else read-only. Does not delegate (`permissions` rule: `subagent` `*` → `deny`). | `/plan` |
| **tlaloc** | Builder and Artisan | Implementation & testing | Full write + edit permissions. Delegates via the unified `subagent` pattern. | `/build` |
| **mictlantecuhtli** | Guardian of the Underworld | Security, quality & review | Write + edit allowed. Delegates via the unified `subagent` pattern. | `/test`, `/deploy`, `/sync` |
| **tezcatlipoca** | Mirror of Truth | Reflection, analysis & correction | Write + edit allowed. Delegates via the unified `subagent` pattern (deny-list of 5 other primaries). Reviews, then delegates corrections to specialists. | `/review`, `/analyze`, `/diagnosis`, `/code-simplify`, `/ship`, `/webperf` |

### Agent File Pattern

Every agent file follows the same structure: YAML frontmatter, markdown body, and a `## COMPOSITION` block at the end. The complete specification — including field mapping, canonical permission blocks, and transformation rules — is documented in [specs/spec-agent-format-v2.md](../specs/spec-agent-format-v2.md). Primary agents additionally carry a protocol section between `### CAPABILITIES` and `### RULES` — `### DELEGATION PROTOCOL` when they can invoke the `subagent` tool, `### SKILL LOADING PROTOCOL` when they cannot (see §8 of the spec).

## How to Add a New Subagent

Adding a new agent only requires creating a single markdown file. OpenCode detects it automatically on the next session start.

### Step 1: Determine Agent Type

Decide whether your new agent is a **subagent** (domain expert, invoked via the `subagent` tool) or a **primary agent** (entry point for slash commands). Most new agents should be subagents — primary agents are reserved for major workflow roles.

For this guide, we will create a **subagent** called `joke-teller`.

### Step 2: Create the Agent File

Create `agents/joke-teller.md` with V2-native YAML frontmatter and a markdown body. OpenCode will discover this file and register `joke-teller` as a valid subagent automatically. Per the V2 agent configuration format, permissions are an ordered list of `{action, resource, effect}` rules — the legacy `tools:` map (with its `write`/`bash`/`task` keys) should not be used in new V2 agents:

```markdown
---
description: Tells programming jokes to lighten the mood during development sessions
mode: subagent
color: "#ffd700"
hidden: true
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: read
    resource: "*"
    effect: allow
  - action: grep
    resource: "*"
    effect: allow
  - action: glob
    resource: "*"
    effect: allow
  - action: skill
    resource: "*"
    effect: allow
  - action: question
    resource: "*"
    effect: allow
  - action: subagent
    resource: "*"
    effect: deny
  - action: shell
    resource: "curl *"
    effect: allow
  - action: shell
    resource: "wget *"
    effect: allow
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
- **Invoke via:** Primary agents (via subagent delegation) during long build sessions.
- **Do not invoke from:** Another persona. This agent works standalone.
```

### Step 3: Restart OpenCode

Restart your OpenCode session so it recognizes the new agent; until then, `joke-teller` may not appear as a selectable subagent via the `subagent` tool.

No delegation-table updates are needed: primary agents use unified `permissions` subagent rules (`subagent` `*` → `allow` with a deny-list of other primaries), so any new subagent in `agents/` is automatically delegatable.

## Links

- [OpenCode Agent Documentation](https://opencode.ai/v2/docs/agents/) — Official OpenCode V2 agent configuration guide.
- [Command Reference](Commands) — Slash commands that invoke primary agents.
