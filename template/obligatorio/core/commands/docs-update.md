---
description: Update and sync documentation with code changes.
agent: quetzalcoatl
---

## Pre-Flight: Analyze Documentation State

Scan the project for existing documentation and identify what's present, what's missing, and what may be outdated:

1. Read @SPEC.md — does it reflect current project scope? exceeds >200 lines?
2. Scan @docs/ — list all documents with last-modified dates
3. Read @CHANGELOG.md — what recent changes might need documentation updates?
4. Read @README.md — is it up to date with respect to the current project?
5. Read @CONTRIBUTING.md — is it written with a workflow appropriate for contributors with respect @skills/git-workflow-and-versioning/SKILL.md conventions?
6. Check @specs/ and @specs/adr/ — any ADRs that should be created or updated?
7. Read @AGENTS.md — exceeds >200 lines? Has dead links? Is it up to date with respect to the current project?

Output a summary:

```
DOCUMENTATION STATE DETECTED:
- SPEC.md: [up to date / has >200 lines or outdated / missing]
- docs/: [list with N docs, M potentially outdated]
- CHANGELOG.md: [up to date / outdated / missing]
- README.md: [up to date / outdated / missing]
- CONTRIBUTING.md: [up to date / outdated / missing]
- specs/: [N spec files, M ADRs]
- AGENTS.md: [references correct / has >200 lines or outdated / missing]
```

## Phase 0: Resolve Contradictions

**Before writing anything**, use the `question` tool to resolve any contradictions found between code/configuration and current documentation. Let the user choose the scope — never decide automatically:

- Which documents to update?
- Which documents to create?
- Which contradictions to resolve first?

## Phase 1: Synchronize Documentation

**Delegate** to appropriate subagents for each documentation area:

1. **Update existing docs** — @docs/ARCHITECTURE.md, @docs/SCHEMA.md, @docs/DESIGN.md, @docs/APPFLOW.md, @docs/CODE_STYLE.md, @docs/SECURITY.md, @docs/TECH_DEBT.md, @docs/SECURITY.md
2. **Create missing docs** if gaps were identified:
   - @docs/ARCHITECTURE.md if missing
   - @docs/SCHEMA.md if missing
   - @docs/SECURITY.md if missing
   - @CODE_OF_CONDUCT.md if missing
   - @docs/CODE_STYLE.md if missing
   - @specs/ if missing specs to document
   - @specs/adr/ ADRs for significant decisions
3. **Create ADRs** for significant decisions (**Load** @skills/documentation-and-adrs/SKILL.md)
4. If @SPEC.md or/and @AGENTS.md exceeds **200 lines**, **Load** `agent-md-refactor` skill to modularize into @specs/
5. Use the `question` tool to confirm changes with the user before writing
6. Commit atomic changes with a descriptive message following @skills/git-workflow-and-versioning/SKILL.md conventions.

## Rules

1. **RESTRICTIONS:**
   - Do NOT write to `tasks/` (exclusive to `/plan`).
   - Do NOT implement code (exclusive to `/build`).
   - Only write to documentation files (`docs/`, `specs/`, `README.md`, etc.).
2. Never overwrite existing documentation without user confirmation — always show the diff or changes first.
3. Use the `question` tool before writing any file to confirm with the user.
4. When updating specs, preserve previous versions or document the change history.

## Suggested Next Step

> Documentation is up to date. Run `/evolve` to create new specs. Run `/plan` to create an execution plan for new implementation specs.
