---
description: Establish new specs or modify existing ones for mature projects
agent: quetzalcoatl
---

## Pre-Flight: Detect Project Maturity

Determine whether the project is mature enough for `/evolve`. A mature project must have all of:

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

## Phase 0: Determine Goal

If the user's request is vague or missing key details, load `interview-me` skill to extract the full intent before proceeding.

**Always use the `question` tool to let the user choose a route — never decide automatically.** Present these options:

- **A) New or modified specs** — Add new features, change existing behavior, respond to new requirements
- **B) Something else** — Let the user describe a different goal

## Phase 1: Execute — New or Modified Specs

1. **Clarify intent** — what's the new requirement? Why is it changing?
2. If requirements are vague, load `interview-me` skill to extract intent, then load `idea-refine` skill to explore variations
3. **Select subagent** — inspect available subagents for requirement analysis and `docs-writer` for spec drafting.
4. **Delegate** — invoke appropriate subagents to analyze requirements and refine specs.
5. **Generate specs** — `docs-writer` should load @skills/spec-driven-development/SKILL.md to generate structured specs for the new or changed requirements in `specs/` using @specs/spec-template.md as a template.
6. **Determine scope** — does this change existing specs or create new ones?
   - New feature → create `specs/spec-<feature>.md`
   - Modify existing → update relevant spec files
7. **Document architecture impact** — update or add ADRs using @specs/adr/adr-template.md in `specs/adr/` if the change affects architecture
8. Include updated architecture diagrams using @skills/architecture-diagrams/SKILL.md
9. For non-trivial decisions, load @skills/doubt-driven-development/SKILL.md
10. If @SPEC.md or @AGENTS.md exceeds **200 lines**, load `agent-md-refactor`skill to modularize into @specs/
11. **Spec update done — do NOT touch code files.** Now hand off implementation:
   - If the change is simple (single file, limited scope): tell the user to run `/build`
   - If the change is complex (multi-file, needs planning): tell the user to run `/plan` then `/build`
   - Do not invoke other primary agents (Tlaloc, Moctezuma, etc.) via `task()`
12. Use the `question` tool to confirm with the user before proceeding.
13. Commit atomic changes with a descriptive message following @skills/git-workflow-and-versioning/SKILL.md conventions.

## Rules

1. `/evolve` is for **existing, mature projects only**. If the project is new, lacks version history, or lacks comprehensive documentation, suggest running `/spec` or `/docs-update` instead.
2. Use the `question` tool before overwriting any existing documentation — always show the diff or changes first and confirm.
3. When modifying specs, preserve previous versions or document the change history.
4. Every evolution should leave the project in a consistent, documented state.
5. Use @SPEC.md as the single source of truth for project scope and direction.
6. **RESTRICTIONS:**
   - Do NOT write to `tasks/` (exclusive to `/plan`).
   - Do NOT implement code (exclusive to `/build`).
   - Do NOT update documentation (use `/docs-update` for that).
   - Do NOT resolve issues (use `/diagnosis` for that).
7. If the user asks for documentation updates or issue resolution, redirect them to the appropriate command instead of attempting it yourself.

## Suggested Next Step

After completing the spec update:

> Your spec is ready. Run `/plan` to create an execution plan, or run `/build` to start implementing directly for simple changes.
