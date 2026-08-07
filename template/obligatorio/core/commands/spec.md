---
description: Establish specs, documentation, and project conventions from scratch
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

**Delegate** appropriate subagents to analyze and refine the user requirements.
If the user has a rough idea but needs to explore variations, load `idea-refine` skill to generate and evaluate options.

Use the `question` tool to clarify interactively:
1. **Objective and target users** — what does success look like? Who is this for?
2. **Core features and acceptance criteria** — must-have vs nice-to-have?
3. **Tech stack preferences and constraints** — any existing commitments?
4. **Boundaries** — what to always do, ask first about, and never do

## Phase 2: Generate Initial Documentation

Invoke `docs-writer` subagent and load @skills/spec-driven-development/SKILL.md to scaffold the project's initial documentation following these files and directories:

1. **AGENTS.md** — Project-level rules, standards, and metadata for AI agents working on this project
2. **SPEC.md** — Central specification covering objective, commands, project structure, code style, testing strategy, and boundaries. References modular specs in @specs/
3. **docs/** — Initial scaffold: @docs/ARCHITECTURE.md (with ADR index), @docs/SCHEMA.md, @docs/APPFLOW.md, @docs/CODE_STYLE.md, @docs/SECURITY.md, @docs/TECH_DEBT.md
4. **specs/spec-<feature>.md** — One modular spec per feature or domain, use @specs/spec-template.md as template; @SPEC.md references these
5. **specs/adr/adr-<nnn>.md** — ADRs for key architecture decisions, linked from @docs/ARCHITECTURE.md, use @specs/adr/adr-template.md as template, then, invoke @skills/documentation-and-adrs/SKILL.md to generate ADRs.

During Phase 2, load the following supporting skills as needed:
- `api-and-interface-design` skill when defining API contracts
- `architecture-diagrams` skill for system architecture diagrams
- `clean-ddd-hexagonal` skill if using Clean Architecture or DDD
- `design-patterns` skill when applying GoF or enterprise patterns
- `api-spec-generation` skill for OpenAPI or AsyncAPI specs

Do **not** touch `specs/design/` or 
`docs/DESIGN.md` — those belong to `/design`.  workspace documentation is managed separately.

6. If @AGENTS.md or @SPEC.md exceeds **200 lines**, load `agent-md-refactor` skill to modularize into progressive disclosure files in @specs/

7. Commit atomic changes with a descriptive message following @skills/git-workflow-and-versioning/SKILL.md conventions.

## Rules

1. `/spec` is for **projects in conception or design phase**. If the project already has stable code, active versions, or production commits, redirect to `/evolve`
2. Never overwrite existing files without user confirmation — always show changes first
3. @SPEC.md is the single source of truth; modular specs in @specs/ extend it
4. Use the `question` tool to confirm all changes with the user before writing any file

## Suggested Next Step

> Your project specs are ready. Run `/plan` to create an execution plan, or run `/design` to establish the UI/UX design of the project.
