---
description: Update and sync documentation with code changes
agent: quetzalcoatl
---

## Pre-Flight: Analyze Documentation State

Scan the project for existing documentation and identify what's present, what's missing, and what may be outdated:

1. Read @SPEC.md — does it reflect current project scope?
2. Scan @docs/ — list all documents with last-modified dates
3. Read @CHANGELOG.md — what recent changes might need documentation updates?
4. Read @README.md - does it updated with respect current project?
5. Read @CONTRIBUTING.md - does it written with a workflow appropriate to contributors?
6. Check @specs/ and @specs/adr/ — any ADRs that should be created or updated?
7. Read @AGENTS.md — does it reference files or conventions that no longer exist?

Output a summary:

```
DOCUMENTATION STATE DETECTED:
- SPEC.md: [up to date / outdated / missing]
- docs/: [list with N docs, M potentially outdated]
- CHANGELOG.md: [up to date / outdated / missing]
- README.md: [up to date / outdated / missing]
- CONTRIBUTING.md: [up to date / outdated / missing]
- specs/: [N spec files, M ADRs]
- AGENTS.md: [references correct / has dead links / missing]
```

Use the `question` tool to let the user choose the scope — never decide automatically:

- Which documents to update?
- Which documents to create?
- Which contradictions to resolve first?

## Phase 0: Resolve Contradictions

If the user's request is vague or missing key details, invoke @skills/interview-me/SKILL.md to extract the full intent before proceeding.

**Before writing anything**, use the `question` tool to resolve any contradictions found between code/configuration and current documentation:

1. Does @docs/ARCHITECTURE.md reflect the actual architecture?
2. Does @SPEC.md match the current project scope?
3. Are there code changes that need corresponding documentation?
4. Are there specs or tech debt that need documenting?

## Phase 1: Synchronize Documentation

1. **Update existing docs** to reflect current codebase state:
   - @docs/ARCHITECTURE.md — update ADR index, layer descriptions, component diagrams
   - @docs/SCHEMA.md — update if data models changed
   - @docs/DESIGN.md - update if UI/UX project changed
   - @docs/APPFLOW.md — update if user flows changed
   - @docs/CODE_STYLE.md — refine conventions based on actual code patterns
   - @docs/SECURITY.md - update if security policy needs more information about how to report critical issues
2. **Create missing docs** if gaps were identified:
   - @docs/ARCHITECTURE.md if missing
   - @docs/SCHEMA.md if missing
   - @docs/SECURITY.md if missing
   - @docs/CODE_STYLE.md if missing
   - @specs/ if missing specs to document
   - @specs/adr/ ADRs for significant decisions
3. **Create ADRs** for significant decisions made since last documentation pass (use @skills/documentation-and-adrs/SKILL.md)
4. If @SPEC.md or @AGENTS.md exceeds **200 lines**, invoke @skills/agent-md-refactor/SKILL.md to modularize into @specs/
5. Use the `question` tool to confirm changes with the user before writing

## Rules

1. **RESTRICTIONS:**
   - Do NOT write to `tasks/` (exclusive to `/plan`).
   - Do NOT implement code (exclusive to `/build`).
   - Only write to documentation files (`docs/`, `specs/`, `README.md`, etc.).
2. Never overwrite existing documentation without user confirmation — always show the diff or changes first.
3. Use the `question` tool before writing any file to confirm with the user.
4. When updating specs, preserve previous versions or document the change history.

## Suggested Next Step

> Documentation is up to date. Run `/evolve` to create new specs, or run `/plan` if code changes are needed based on updated documentation.
