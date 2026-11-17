---
description: Update and sync documentation respect to current project state.
agent: quetzalcoatl
---

## Pre-Flight: Analyze Documentation State

**Delegate** `codebase-onboarding-engineer` subagent and **Load** `codebase-onboarding` skill to scan the project for existing documentation and identify what's present, what's missing, and what may be outdated respect to the current project state:

1. Read @SPEC.md — does it reflect current project scope? exceeds >200 lines?
2. Scan @docs/ — list all documents with last-modified dates
3. Read @CHANGELOG.md — what recent changes might need documentation updates?
4. Read @README.md — is it up to date with respect to the current project?
5. **Load** `git-workflow-and-versioning` skill and read @CONTRIBUTING.md — is it written with a workflow appropriate for contributors with respect git workflow and versioning conventions?
6. Check @docs/adr/ — any ADRs that should be created or updated?
7. Check @specs/ — any specs that should be created or updated?
8. Read @AGENTS.md — exceeds >200 lines? Has dead links? Is it up to date with respect to the current project?
9. Check @docs/BACKLOG.md (or backlog directory) — Exceeds >500 lines? Has dead links? Is it up to date with respect to the current project?

Output a summary:

```
DOCUMENTATION STATE DETECTED:
- SPEC.md: [up to date / has >200 lines or outdated / missing]
- docs/: [list with N docs, M potentially outdated]
- ARCHITECTURE.md: [up to date / outdated / missing]
- SECURITY.md: [up to date / outdated / missing]
- CODE_STYLE.md: [up to date / outdated / missing]
- BACKLOG files: [up to date / has >500 lines or outdated / missing]
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

**Delegate** to `docs-writer` and `technical-writer` subagents for each documentation area, and **Load** `documentation-and-adrs` alongside `markdown-mermaid-writing` skill to write and update docs:

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
   - @docs/adr/ ADRs for significant decisions
3. If @SPEC.md or/and @AGENTS.md exceeds **200 lines**, **Load** `agent-md-refactor` skill to modularize into @specs/
4. If @docs/BACKLOG.md (or any other backlog file) exceeds **500 lines**, split and refactor large backlogs into @docs/backlog/

## Phase 2: Finalize

1. **Documentation are updated — do NOT touch or implement code files.**
2. Use the `question` tool to confirm with the user before proceeding.
3. Commit all changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

## Rules

- **Never** write to `tasks/` directory.
- **Never** implement code, only write documentation.
- **Never** overwrite existing documentation without user confirmation — **Always** show the diff or changes first.
- Use the `question` tool before writing any file to confirm with the user.
- When updating specs, preserve previous versions or document the change history.
- You can stop and ask the user for clarification if you need more information to complete the update.
- Use the best available tools for the job.
- Research external resources every time, specially if you are stuck or the updated documentation is not correct. 

## Suggested Next Step

> Documentation is up to date. Run `/feature` to create new specs. Run `/plan` to create an execution plan for new implementation specs.

---

User instructions:

