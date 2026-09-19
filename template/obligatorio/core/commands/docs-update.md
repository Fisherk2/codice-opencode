---
description: Update and sync documentation respect to current project state.
agent: quetzalcoatl
---

## Pre-Flight: Analyze Documentation State

**Delegate** `codebase-archaeologist` subagent to scan the project for existing documentation and identify what's present, what's missing, and what may be outdated respect to the current project state:

1. Read @SPEC.md — does it reflect current project scope? exceeds >200 lines?
2. Scan @docs/ — list all documents with last-modified dates
3. Read @CHANGELOG.md — what recent changes might need documentation updates?
4. Read @README.md — is it up to date with respect to the current project?
5. **Load** `git-workflow-and-versioning` skill and read @CONTRIBUTING.md — is it written with a workflow appropriate for contributors with respect git workflow and versioning conventions?
6. Check @specs/ and @specs/adr/ — any ADRs that should be created or updated?
7. Read @AGENTS.md — exceeds >200 lines? Has dead links? Is it up to date with respect to the current project?

Output a summary:

```
DOCUMENTATION STATE DETECTED:
- SPEC.md: [up to date / has >200 lines or outdated / missing]
- docs/: [list with N docs, M potentially outdated]
- ARCHITECTURE.md: [up to date / outdated / missing]
- SECURITY.md: [up to date / outdated / missing]
- CODE_STYLE.md: [up to date / outdated / missing]
- WORKFLOW.md: [up to date / outdated / missing]
- TECH_DEBT.md: [up to date / outdated / missing]
- PRD.md: [up to date / outdated / missing]
- TRD.md: [up to date / outdated / missing]
- CHANGELOG.md: [up to date / outdated / missing]
- README.md: [up to date / outdated / missing]
- CONTRIBUTING.md: [up to date / outdated / missing]
- CODE_OF_CONDUCT.md: [up to date / outdated / missing]
- specs/: [N spec files, M ADRs]
- AGENTS.md: [references correct / has >200 lines or outdated / missing]
```

## Phase 0: Resolve Contradictions

**Before writing anything**, use the `question` tool to resolve any contradictions found between code/configuration and current documentation. Let the user choose the scope — never decide automatically:

- Which documents to update?
- Which documents to create?
- Which contradictions to resolve first?

## Phase 1: Synchronize Documentation

**Delegate** to `docs-writer` and `technical-writer` subagents for each documentation area:

1. **Update existing docs**
2. **Create missing docs** if gaps were identified:
   - @docs/ARCHITECTURE.md if missing
   - @docs/SCHEMA.md if missing or needed.
   - @docs/SECURITY.md if missing
   - @CODE_OF_CONDUCT.md if missing
   - @docs/CODE_STYLE.md if missing
   - @docs/TRD.md if missing
   - @docs/PRD.md if missing
   - @specs/ if missing specs to document
   - @specs/adr/ ADRs for significant decisions
3. **Create ADRs** for significant decisions, **Load** `documentation-and-adrs` skill to write them.
4. If @SPEC.md or/and @AGENTS.md exceeds **200 lines**, **Load** `agent-md-refactor` skill to modularize into @specs/
5. Use the `question` tool to confirm changes with the user before writing
6. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

## Rules

- **Never** write to `tasks/` (exclusive to `/plan`).
- **Never** implement code (exclusive to `/build`).
- Only write to documentation files.
- **Never** overwrite existing documentation without user confirmation — **Always** show the diff or changes first.
- Use the `question` tool before writing any file to confirm with the user.
- When updating specs, preserve previous versions or document the change history.

## Suggested Next Step

> Documentation is up to date. Run `/evolve` to create new specs. Run `/plan` to create an execution plan for new implementation specs.
