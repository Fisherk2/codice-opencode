# Workspace Structure

The Códice workspace template installs a complete OpenCode project environment organized into categories: always-present files, merge-safe defaults, and optional add-ons. This page describes what you get and how each piece fits together.

> For an overview of how OpenCode discovers project configuration (`.opencode/`, `opencode.json`), see [opencode.ai/v2/docs/config#locations](https://opencode.ai/v2/docs/config/#locations). V2 has no dedicated "workspace" page.

---

## Top-Level Layout

```
workspace/
├── AGENTS.md             # Primary agent instructions
├── CONTRIBUTING.md       # Contribution guidelines
├── README.md             # Project README
├── CHANGELOG.md          # Release history
├── SPEC.md               # Project specification
├── LICENSE               # Open-source license
├── opencode.json         # OpenCode configuration
├── .env.example          # Environment template
├── agents/               # AI agent definitions (359 across 10 packs)
├── commands/             # Slash command workflows (17 files)
├── skills/               # Specialized knowledge domains (51 dirs)
├── docs/                 # Project documentation
├── specs/                # Modular specifications + ADRs
├── tasks/                # Execution tasks (SDD pipeline)
├── .opencode/            # OpenCode runtime configuration
└── .gitignore            # Standard ignore patterns
```

---

## Directory Guide

### `agents/` — AI Agent Definitions

This is the largest directory, containing **359 agent files across 10 packs** that define AI personas. Each file is a Markdown document with YAML frontmatter describing an agent's role, permissions, and behavior.

**Six primary agents** serve as the main entry points:

| Agent | Role | Purpose |
|-------|------|---------|
| `huitzilopochtli.md` | Commander-in-Chief | Delegates tasks, manages workflows, orchestrates subagents |
| `quetzalcoatl.md` | Visionary Sage | Defines specs, architecture, and project direction |
| `moctezuma.md` | Strategic Planner | Breaks specifications into executable task plans |
| `tlaloc.md` | Builder and Artisan | Implements code, runs builds, writes tests and docs |
| `mictlantecuhtli.md` | Guardian of the Underworld | Runs tests, validates quality, syncs git, deploys to production |
| `tezcatlipoca.md` | Mirror of Truth | Reviews code, analyzes architecture, and delegates corrections to specialists |

The remaining **349 subagents (8 selectable packs)** are domain specialists — frontend developers, database administrators, security auditors, Rust engineers, and so on. Each subagent is an expert in one area and is invoked from primary agents through the `subagent` tool (V1's `task()`/`task` naming is legacy; V2 renamed the action and tool to `subagent`).

The template keeps pack source under `template/obligatorio/packs/` (10 packs: 2 mandatory — main + writers — and 8 selectable); the installer copies selected packs into the flat `agents/` directory. The install wizard lets you choose packs and shows a summary with per-pack agent counts.

Agent files use a consistent frontmatter format:

```yaml
---
description: "Short role description"
mode: primary | subagent
permissions:
  - action: edit
    resource: "*"
    effect: allow | ask | deny
  - action: subagent
    resource: "*"
    effect: allow | deny
  - action: shell
    resource: "git status"
    effect: allow
---
```

> This is the native V2 shape (ordered `{action, resource, effect}` rules, last-match-wins). V1's `tools:`/`permission:` maps — with keys like `write`, `bash`, and `task` — are legacy names that V2 translates automatically; new files in the template use `permissions:`.

### `commands/` — Slash Command Workflows

The **17 slash commands** map to the Spec-Driven Development (SDD) lifecycle. Each is a Markdown file defining a workflow that a primary agent executes when the user types `/command-name`.

| Command | Agent | Phase |
|---------|-------|-------|
| `help.md` | huitzilopochtli | Onboarding — welcome, guide, and explain Códice |
| `spec.md` | quetzalcoatl | Define project specification |
| `design.md` | quetzalcoatl | Establish UI/UX and architecture |
| `plan.md` | moctezuma | Break spec into executable tasks |
| `build.md` | tlaloc | Implement the plan |
| `sync.md` | mictlantecuhtli | Bidirectional git sync with conflict resolution |
| `migrate.md` | quetzalcoatl | Generate technology stack migration plans |
| `test.md` | mictlantecuhtli | Validate implementation (TDD) |
| `code-simplify.md` | tezcatlipoca | Refactor and simplify code, then verify corrections |
| `webperf.md` | tezcatlipoca | Audit web performance, then apply corrections |
| `review.md` | tezcatlipoca | Five-axis code review, then delegate corrections |
| `ship.md` | tezcatlipoca | Pre-launch checklist, go/no-go decision, then corrections |
| `deploy.md` | mictlantecuhtli | Git workflow and CI/CD execution (post-ship) |
| `analyze.md` | tezcatlipoca | Multi-dimensional architectural analysis |
| `docs-update.md` | quetzalcoatl | Synchronize documentation with code |
| `diagnosis.md` | tezcatlipoca | Suggest fixes and document technical findings |
| `evolve.md` | quetzalcoatl | Define new specs for mature projects |

Each command file contains numbered steps, `question` tool prompts at decision points, and skill loading (`**Load** `skill-name` skill`). A YAML frontmatter block specifies the target agent and a verb-driven description.

### `skills/` — Specialized Knowledge Domains

Skills are the workspace's knowledge base — **51 skill directories**, each containing a `SKILL.md` file that teaches an agent how to perform a specific task domain. 18 of those include a `references/` subdirectory with extended reference material co-located with the skill:

| Skill | Purpose |
|-------|---------|
| `clean-code/` | Write readable, maintainable code |
| `clean-code/references/` | Code smells, naming conventions, formatting, functions, testing principles |
| `test-driven-development/` | Drive development with tests |
| `test-driven-development/references/` | Testing patterns reference |
| `security-and-hardening/` | Harden code against vulnerabilities |
| `security-and-hardening/references/` | Security checklist |
| `architecture-diagrams/` | Create Mermaid and C4 diagrams |
| `architecture-diagrams/references/` | 10 diagram reference documents |
| ... | *(51 total skills, 18 with references/ subdirectories)* |

Skills are loaded by commands and agents with `**Load** `skill-name` skill`. This keeps workflows composable — a single command may invoke multiple skills at different steps. Reference material within `skills/<name>/references/` is exposed through the `references` section in `opencode.json`: described entries are advertised to agents with their alias and resolved path, and the client attaches a reference by its alias.

### Reference Files — Co-located with Skills

The template ships **64 reference documents** covering software engineering best practices. Unlike the original centralized model, references are now **co-located** with their primary skill:

| Reference File | Located In |
|---------------|------------|
| Architecture diagrams (arch-*.md) | `skills/architecture-diagrams/references/` |
| DDD tactical, strategic, hexagonal | `skills/clean-ddd-hexagonal/references/` |
| Clean code, code smells, naming | `skills/clean-code/references/` |
| Refactoring techniques (6 files) | `skills/refactoring-patterns/references/` |
| UI/UX system (13 files) | `skills/ui-ux-design-pro/references/` |
| SOLID, object design, TDD | `skills/solid/references/` |
| README standards | `skills/crafting-effective-readmes/references/` |
| Security, performance, error handling | Each in its respective skill's `references/` |

This co-location makes skills **self-contained**: installing a skill also installs its reference material. References are exposed via OpenCode's native `references` section in `opencode.json`, advertised by alias, and attached from the client.

### `docs/` — Project Documentation

Standard project documentation shipped with the template:

| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | System architecture and ADR index |
| `WORKFLOW.md` | Implementation plan and release phases |
| `CODE_STYLE.md` | Code style conventions |
| `TECH_DEBT.md` | Known technical debt and improvement priorities |
| `diagnosis/` | Technical diagnoses organized as `fixNN-slug.md` |

This directory is merge-safe (standard classification) — it will only be created if it doesn't already exist in your project, preserving any custom documentation you've written.

### `specs/` — Modular Specifications

Contains architecture decision records (ADRs) and modular specification documents:

```
specs/
├── adr/               # Architecture Decision Records
│   ├── adr-001-xxx.md
│   └── ...
├── spec-file-rules.md
└── spec-cli-commands.md
```

This directory grows as your project matures. The `/evolve` command creates new specs here, and each ADR documents a resolved architectural decision with its context, options, and rationale.

### `tasks/` — Execution Tasks

Used by the SDD pipeline to track implementation progress. When `/plan` breaks a spec into work units, the resulting tasks are written here as numbered Markdown files. This directory is managed exclusively by the `moctezuma` agent during planning and by `tlaloc` during execution.

### `.opencode/` — Runtime Configuration

OpenCode's internal configuration directory:

```
.opencode/
├── agents/             # Agent definitions (symlinked from agents/)
├── commands/           # Command definitions (symlinked from commands/)
├── skills/             # Skill definitions (symlinked from skills/)
└── .gitignore
```

Destructive-command blocking is enforced through the `permissions` rules in `opencode.json` rather than a plugin.

---

## File Classification

The template organizes files into three categories that determine how they behave during installation and updates:

| Category | Behavior | Examples |
|----------|----------|----------|
| **Obligatorio** | Always present, updated on every install | `opencode.json`, `agents/`, `commands/`, `skills/` |
| **Estándar** | Created if missing, preserved if present | `README.md`, `CONTRIBUTING.md`, `docs/`, `specs/`, `tasks/` |
| **Opcional** | Installed only if you choose them | `Dockerfile`, `Justfile`, `.gitmessage` |

This means you can customize `README.md` or `docs/ARCHITECTURE.md` without fear of them being overwritten — the installer respects your existing content.

---

## Workflow: How Agents and Commands Fit Together

The workspace is designed around a **cycle** that repeats as your project evolves:

1. You type a slash command (e.g., `/spec`)
2. OpenCode routes the command to the target primary agent
3. The agent reads the command file from `commands/` and follows its steps
4. At each step, the agent may invoke skills from `skills/` or access reference material from `skills/<name>/references/` via the `references` section
5. The agent may delegate sub-tasks to subagents defined in `agents/`
6. The result is written to the appropriate directory (`specs/`, `docs/`, `tasks/`, `src/`, etc.)
7. The command suggests the next logical command in the cycle

---

## File Sizes and Composition

| Directory | Files | Purpose |
|-----------|-------|---------|
| `agents/` | 359 | AI agent persona definitions |
| `commands/` | 17 | Slash command workflows |
| `skills/` | 51 + 64 refs | Specialized knowledge domains with co-located reference material |
| `docs/` | 5+ | Project documentation |
| `specs/` | 3+ | Modular specs and ADRs |

Total template footprint: ~500+ files providing a complete AI-assisted development environment.

---

## See Also

- [Configuration](Configuration) — Configuring the workspace via `opencode.json`
- [opencode.ai/v2/docs/config](https://opencode.ai/v2/docs/config/#locations) — Official OpenCode configuration guide (project config locations, `.opencode/` discovery)
