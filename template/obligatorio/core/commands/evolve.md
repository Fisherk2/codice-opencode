---
description: Establish new specs or modify existing ones for mature projects.
agent: quetzalcoatl
---

## Pre-Flight: Detect Project Maturity

**Delegate** `codebase-onboarding-engineer` subagent to understand the project's structure and determine whether it is mature enough. A mature project must have all of:

1. **`package.json` (or equivalent)** — project metadata and dependencies
2. **Version history** — at least one published release or tag
3. **Existing documentation** — @SPEC.md, @docs/ or any other documentation with real content (not placeholders)
4. **Active development** — recent commits, open issues, or ongoing work

Output a summary:

```
PROJECT STATE DETECTED:
- package.json: [exists / missing]
- Version history: [N releases / tags]
- SPEC.md: [exists with real content / exists but placeholder / missing]
- README.md: [exists with real content / exists but placeholder / missing]
- CHANGELOG.md: [exists with real content / exists but placeholder / missing]
- CONTRIBUTING.md: [exists with real content / exists but placeholder / missing]
- docs/SECURITY.md: [exists with real content / exists but placeholder / missing]
- docs/: [list of docs with real content]
- Recent activity: [summary of last N commits]
- MATURITY: [MATURE / IMMATURE]
```

**If the project is NOT mature**, stop and suggest using `/spec` or `/docs-update` instead.

**If the project IS mature**, proceed to the goal determination phase.

## Phase 0: Refine specs and user stories

Use the `question` tool to clarify interactively:

- **New specs** — Add new features, respond to new requirements, or add new constraints.
- **Modified specs** — Change existing behavior, respond to new requirements or improve existing ones.
- **Something else** — Let the user describe a different goal

If the user's request is vague or missing key functional and non-functional requirements, **Load** the `interview-me` skill to extract intent before proceeding.

If the user has a rough idea but needs to explore alternatives or variations, **Load** `idea-refine` skill to generate and evaluate options.

**Always use the `question` tool to let the user confirm what specs or requirements they needs include in the project — never decide automatically, even if the specifications or user histories seem clear or trivial.** The user must answer doubts, suggestions, and ambiguities before proceeding.

## Phase 1: Execute — New or Modified Specs

1. **Select subagents** — inspect available subagents for requirement analysis and `docs-writer` for spec drafting.
4. **Fan out analysis** — **Delegate** in parallel appropriate subagents to analyze requirements and refine specs.
5. **Generate specs** — **Delegate** `docs-writer` subagent and **Load** `spec-driven-development` skill to generate structured specs for the new or changed requirements in `specs/` using @specs/spec-template.md as a template.
6. **Determine scope** — does this change existing specs or create new ones?
   - New feature → create `specs/spec-<feature>.md`
   - Modify existing → update relevant spec files
7. **Document architecture impact** — update or add ADRs using @specs/adr/adr-template.md in `specs/adr/` if the change affects architecture
8. **Load** `architecture-diagrams` skill to include updated architecture diagrams 
9. For non-trivial decisions, **Load** `doubt-driven-development` skill
10. If @SPEC.md or @AGENTS.md exceeds **200 lines**, **Load** `agent-md-refactor`skill to modularize into @specs/
11. **Spec update done — do NOT touch or implement code files.**
12. Use the `question` tool to confirm with the user before proceeding.
13. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

## Rules

- `/evolve` is for **existing, mature projects only**. If the project is new, lacks version history, or lacks comprehensive documentation, suggest running `/spec` or `/docs-update` instead.
- Use the `question` tool before overwriting any existing documentation — always show the diff or changes first and confirm.
- When modifying specs, preserve previous versions or document the change history.
- Every evolution should leave the project in a consistent, documented state.
- Use @SPEC.md as the single source of truth for project scope and direction.
- **Never** write to `tasks/` directories (use `/plan` for that).
- **Never** implement code changes.
- **Never** update documentation (use `/docs-update` for that).
- **Never** resolve issues (use `/diagnosis` for that).

## Suggested Next Step

After completing the spec update:

> Your specs are ready. Run `/plan` to create an execution plan, and run `/build` to start implementing specs.
