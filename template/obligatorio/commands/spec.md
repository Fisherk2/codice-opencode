---
description: Init a new project — establish specs, documentation, and project conventions from scratch
agent: quetzalcoatl
---

## Pre-Flight: Detect Project State

1. Read @AGENTS.md — real project-specific rules or placeholder?
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

If the project already has stable code, active versions, or production commits, redirect to `/evolve` — `/spec` is for projects in conception or design phase, even if documentation already exists.

## Phase 0: Clarify Intent

If the user's request is vague or missing key details (who it's for, what success looks like, why now), invoke @skills/interview-me/SKILL.md to extract intent before proceeding.

## Phase 1: Refine Requirements

If the user has a rough idea but needs to explore variations, invoke @skills/idea-refine/SKILL.md to generate and evaluate options.

Use the `question` tool to clarify interactively:
1. **Objective and target users** — what does success look like? Who is this for?
2. **Core features and acceptance criteria** — must-have vs nice-to-have?
3. **Tech stack preferences and constraints** — any existing commitments?
4. **Boundaries** — what to always do, ask first about, and never do

## Phase 2: Generate Initial Documentation

Invoke @skills/spec-driven-development/SKILL.md to scaffold the project's initial documentation:

1. **@AGENTS.md** — Project-level rules, standards, and metadata for AI agents working on this project
2. **@SPEC.md** — Central specification covering objective, commands, project structure, code style, testing strategy, and boundaries. References modular specs in @specs/
3. **@docs/** — Initial scaffold: @docs/ARCHITECTURE.md (with ADR index), @docs/SCHEMA.md, @docs/APPFLOW.md, @docs/CODE_STYLE.md
4. **@specs/spec-<feature>.md** — One modular spec per feature or domain; @SPEC.md references these
5. **@specs/adr/adr-<nnn>.md** — ADRs for key architecture decisions, linked from @docs/ARCHITECTURE.md (use @skills/documentation-and-adrs/SKILL.md)
6. If @AGENTS.md or @SPEC.md exceeds **200 lines**, invoke @skills/agent-md-refactor/SKILL.md to modularize into progressive disclosure files

During Phase 2, invoke supporting skills as needed:
- @skills/api-and-interface-design/SKILL.md when defining API contracts
- @skills/architecture-diagrams/SKILL.md for system architecture diagrams
- @skills/clean-ddd-hexagonal/SKILL.md if using Clean Architecture or DDD
- @skills/design-patterns/SKILL.md when applying GoF or enterprise patterns
- @skills/api-spec-generation/SKILL.md for OpenAPI or AsyncAPI specs

Do **not** touch @specs/design/ or @docs/DESIGN.md — those belong to `/design`.  workspace documentation is managed separately.

## Rules

1. `/spec` is for **projects in conception or design phase**. If the project already has stable code, active versions, or production commits, redirect to `/evolve`
2. Never overwrite existing files without user confirmation — always show changes first
3. @SPEC.md is the single source of truth; modular specs in @specs/ extend it
4. Use the `question` tool to confirm all changes with the user before writing any file

## Suggested Next Step

> Your project specs are ready. Run `/plan` to create an execution plan, or run `/design` to establish the UI/UX design of the project.
