# Workspace Structure

The Códice workspace template installs a complete OpenCode project environment organized into categories: always-present files, merge-safe defaults, and optional add-ons. This page describes what you get and how each piece fits together.

> For an overview of the OpenCode workspace system, see [opencode.ai/docs/workspace](https://opencode.ai/docs/workspace).

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
├── agents/               # AI agent definitions (~103 files)
├── commands/             # Slash command workflows (12 files)
├── skills/               # Specialized knowledge domains (~46 dirs)
├── docs/                 # Project documentation
├── specs/                # Modular specifications + ADRs
├── tasks/                # Execution tasks (SDD pipeline)
├── references/           # Shared reference library
├── .opencode/            # OpenCode runtime configuration
├── .devin/               # Devin compatibility layer (optional)
└── .gitignore            # Standard ignore patterns
```

---

## Directory Guide

### `agents/` — AI Agent Definitions

This is the largest directory, containing **103 agent files** that define AI personas. Each file is a Markdown document with YAML frontmatter describing an agent's role, permissions, and behavior.

**Six primary agents** serve as the main entry points:

| Agent | Role | Purpose |
|-------|------|---------|
| `huitzilopochtli.md` | Commander-in-Chief | Delegates tasks, manages workflows, orchestrates subagents |
| `quetzalcoatl.md` | Visionary Sage | Defines specs, architecture, and project direction |
| `moctezuma.md` | Strategic Planner | Breaks specifications into executable task plans |
| `tlaloc.md` | Builder and Artisan | Implements code, runs builds, fixes issues |
| `mictlantecuhtli.md` | Guardian of the Underworld | Reviews code, runs audits, enforces quality gates |
| `tezcatlipoca.md` | Mirror of Truth | Provides adversarial review and critical analysis |

The remaining **~97 subagents** are domain specialists — frontend developers, database administrators, security auditors, Rust engineers, and so on. Each subagent is an expert in one area and is invoked from primary agents via `task()` delegation.

Agent files use a consistent frontmatter format:

```yaml
---
description: "Short role description"
mode: primary | subagent
permission:
  write: allow | deny
  edit: allow | deny
  bash:
    "*": allow | ask | deny
  read:
    "*": allow | deny
---
```

### `commands/` — Slash Command Workflows

The **12 slash commands** map to the Source-Driven Development (SDD) lifecycle. Each is a Markdown file defining a workflow that a primary agent executes when the user types `/command-name`.

| Command | Agent | Phase |
|---------|-------|-------|
| `spec.md` | quetzalcoatl | Define project specification |
| `design.md` | quetzalcoatl | Establish UI/UX and architecture |
| `plan.md` | moctezuma | Break spec into executable tasks |
| `build.md` | tlaloc | Implement the plan |
| `test.md` | tlaloc | Validate implementation |
| `code-simplify.md` | tlaloc | Refactor and simplify code |
| `webperf.md` | tlaloc | Optimize web performance |
| `review.md` | mictlantecuhtli | Review and audit code quality |
| `ship.md` | tezcatlipoca | Prepare for launch |
| `docs-update.md` | quetzalcoatl | Synchronize documentation with code |
| `diagnosis.md` | quetzalcoatl | Analyze issues and document technical findings |
| `evolve.md` | quetzalcoatl | Define new specs for mature projects |

Each command file contains numbered steps, `question` tool prompts at decision points, and references to skills (`@skills/skill-name/SKILL.md`). A YAML frontmatter block specifies the target agent and a verb-driven description.

### `skills/` — Specialized Knowledge Domains

Skills are the workspace's knowledge base — **46 skill directories**, each containing a `SKILL.md` file that teaches an agent how to perform a specific task domain:

| Skill | Purpose |
|-------|---------|
| `clean-code/` | Write readable, maintainable code |
| `test-driven-development/` | Drive development with tests |
| `security-and-hardening/` | Harden code against vulnerabilities |
| `architecture-diagrams/` | Create Mermaid and C4 diagrams |
| `ci-cd-and-automation/` | Set up build and deployment pipelines |
| ... | *(46 total skills)* |

Skills are referenced inline by commands and agents using the `@skills/skill-name/SKILL.md` path. This keeps workflows composable — a single command may invoke multiple skills at different steps.

### `references/` — Shared Reference Library

A flat directory of **59 reference documents** covering software engineering best practices:

- Architecture patterns (C4 diagrams, deployment diagrams, sequence diagrams)
- Design patterns (SOLID principles, DDD tactical/strategic, hexagonal architecture)
- Code quality (clean code, code smells, refactoring catalog, testing patterns)
- UI/UX (typography, color systems, icon patterns, spacing and layout)
- README standards (art of README, standard-readme spec, maximal/minimal examples)
- Security checklists, performance checklists, accessibility guidelines

These references are imported by agents via `read()` when they need authoritative guidance on a topic.

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

This directory grows as your project matures. The `evolve/` command creates new specs here, and each ADR documents a resolved architectural decision with its context, options, and rationale.

### `tasks/` — Execution Tasks

Used by the SDD pipeline to track implementation progress. When `plan/` breaks a spec into work units, the resulting tasks are written here as numbered Markdown files. This directory is managed exclusively by the `moctezuma` agent during planning and by `tlaloc` during execution.

### `.opencode/` — Runtime Configuration

OpenCode's internal configuration directory:

```
.opencode/
├── agents/             # Agent definitions (symlinked from agents/)
├── commands/           # Command definitions (symlinked from commands/)
├── skills/             # Skill definitions (symlinked from skills/)
├── plugins/            # SDD pipeline plugin
│   ├── sdd-pipeline.ts
│   └── README.md
└── .gitignore
```

The `plugins/sdd-pipeline.ts` file contains the Source-Driven Development orchestration logic — command routing, agent identity detection, and phase transitions. This is an always-present file (obligatorio) that gets updated with template releases.

### `.devin/` — Devin Compatibility Layer (Optional)

When selected during installation, the template adds a `.devin/` directory that makes the workspace compatible with Devin-style agent runners:

```
.devin/
├── rules/              # Hardcoded Devin rules
├── skills/             # Symlink to skills/
└── workflows/          # Symlink to commands/
```

This is an optional component — it is only installed if you explicitly choose it from the optional files menu.

---

## File Classification

The template organizes files into three categories that determine how they behave during installation and updates:

| Category | Behavior | Examples |
|----------|----------|----------|
| **Obligatorio** | Always present, updated on every install | `opencode.json`, `agents/`, `commands/`, `skills/`, `.opencode/plugins/` |
| **Estándar** | Created if missing, preserved if present | `README.md`, `CONTRIBUTING.md`, `docs/`, `specs/`, `tasks/` |
| **Opcional** | Installed only if you choose them | `.devin/`, `Dockerfile`, `Justfile`, `.gitmessage` |

This means you can customize `README.md` or `docs/ARCHITECTURE.md` without fear of them being overwritten — the installer respects your existing content.

---

## Workflow: How Agents and Commands Fit Together

The workspace is designed around a **cycle** that repeats as your project evolves:

1. You type a slash command (e.g., `/spec`)
2. OpenCode routes the command to the target primary agent
3. The agent reads the command file from `commands/` and follows its steps
4. At each step, the agent may invoke skills from `skills/` or reference documents from `references/`
5. The agent may delegate sub-tasks to subagents defined in `agents/`
6. The result is written to the appropriate directory (`specs/`, `docs/`, `tasks/`, `src/`, etc.)
7. The command suggests the next logical command in the cycle

---

## File Sizes and Composition

| Directory | Files | Purpose |
|-----------|-------|---------|
| `agents/` | ~103 | AI agent persona definitions |
| `commands/` | 12 | Slash command workflows |
| `skills/` | 46 | Specialized knowledge domains |
| `references/` | 59 | Engineering reference library |
| `docs/` | 5+ | Project documentation |
| `specs/` | 3+ | Modular specs and ADRs |

Total template footprint: ~230+ files providing a complete AI-assisted development environment.

---

## See Also

- [Configuration](Configuration) — Configuring the workspace via `opencode.json`
- [opencode.ai/docs/workspace](https://opencode.ai/docs/workspace) — Official OpenCode workspace documentation
