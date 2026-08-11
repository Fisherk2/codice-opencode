---
description: Establish specs, documentation, and project conventions from scratch
agent: quetzalcoatl
---

## Pre-Flight: Detect Project State

**Delegate** `codebase-onboarding-engineer` subagent to understand the project's structure and determine whether it is mature enough:

1. Read `AGENTS.md` — real project-specific rules or placeholder?
2. Read @SPEC.md — real content or missing?
3. Scan @docs/ — real documentation or empty templates?
4. Check @specs/ and @specs/adr/ — any existing modular files?

Output a summary:

```
PROJECT STATE DETECTED:
- AGENTS.md: [real content / placeholder / missing]
- SPEC.md: [real content / placeholder / missing]
- docs/: [real content / empty templates / missing]
- specs/: [exists with N modules / missing]
- specs/adr/: [exists with N ADRs / missing]
```

**If the project IS mature**, stop and suggest using `/evolve` instead to create or modify existing specs.

**If the project is not mature**, proceed to the clarification phase.

## Phase 0: Clarify Intent

1. **Load** the `interview-me` skill to extract user's request, histories, key functional and non-functional requirements, and constraints.

2. **Delegate** appropriate subagents to analyze and refine the user requirements.

## Phase 1: Refine Requirements

To explore alternatives or variations, **Load** `idea-refine` skill to generate and evaluate options.

Use the `question` tool to clarify interactively:
1. **Objective and target users** — what does success look like? Who is this for?
2. **Core features and acceptance criteria** — must-have vs nice-to-have?
3. **Tech stack preferences and constraints** — any existing commitments?
4. **Boundaries** — what to always do, ask first about, and never do

**Always use the `question` tool to let the user confirm what specs or requirements they needs include in the project — never decide automatically, even if the specifications or user histories seem clear or trivial.** The user must answer doubts, suggestions, and ambiguities before proceeding.

## Phase 2: Generate Initial Documentation

**Delegate** `docs-writer` subagent and **Load** @skills/spec-driven-development/SKILL.md to scaffold the project's initial documentation, for non-trivial decisions, **Load** @skills/doubt-driven-development/SKILL.md.

Write the following files and directories:

1. **AGENTS.md** — Project-level rules, standards, and metadata for AI agents working on this project
2. **SPEC.md** — Central specification covering objective, commands, project structure, code style, testing strategy, and boundaries. References modular specs in @specs/
3. **docs/** — Initial scaffold: `docs/ARCHITECTURE.md` (with ADR index), `docs/SCHEMA.md`, `docs/APPFLOW.md`, `docs/CODE_STYLE.md`, `docs/SECURITY.md`, `docs/TECH_DEBT.md`, `docs/CODE_OF_CONDUCT.md`
4. **specs/spec-<feature>.md** — One modular spec per feature or domain, use @specs/spec-template.md as template; `SPEC.md` references these
5. **specs/adr/adr-<nnn>.md** — ADRs for key architecture decisions, linked from `docs/ARCHITECTURE.md`, use @specs/adr/adr-template.md as template, then, **Load** @skills/documentation-and-adrs/SKILL.md to generate ADRs.
6. **docs/WORKFLOW.md** — Progress tracking divided into phases, with clear boundaries and dependencies between phases, metrics, objectives and completion criteria.

During documentation drafting, **Load** the following supporting skills as needed:
- `api-and-interface-design` skill when defining API contracts
- `architecture-diagrams` skill for system architecture diagrams
- `clean-ddd-hexagonal` skill if using Clean Architecture or DDD
- `design-patterns` skill when applying GoF or enterprise patterns
- `api-spec-generation` skill for OpenAPI or AsyncAPI specs

Do **not** touch `specs/design/` or 
`docs/DESIGN.md` — those belong to `/design`.  workspace documentation is managed separately.

7. If @AGENTS.md and/or @SPEC.md exceeds **200 lines**, **Load** `agent-md-refactor` skill to modularize into progressive disclosure files in @specs/
8. **When Specs created — do NOT touch or implement code files.**
9. Use the `question` tool to confirm with the user before proceeding.
10. Commit atomic changes with a descriptive message following @skills/git-workflow-and-versioning/SKILL.md conventions.

## Rules

1. `/spec` is for **projects in conception or design phase**. If the project already has stable code, active versions, or production commits, redirect to `/evolve`
2. Never overwrite existing files without user confirmation — always show changes first
3. `SPEC.md` is the single source of truth; modular specs in @specs/ extend it
4. Use the `question` tool to confirm all changes with the user before writing any file

## Suggested Next Step

> Your project specs are ready. Run `/plan` to create an execution plan, or run `/design` to establish the UI/UX design of the project.
