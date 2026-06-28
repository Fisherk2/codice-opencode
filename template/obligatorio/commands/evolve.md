---
description: Establish new specs or modify existing ones for mature projects
agent: quetzalcoatl
---

## Pre-Flight: Detect Project Maturity

Determine whether the project is mature enough for `/evolve`. A mature project must have all of:

1. **`package.json` (or equivalent)** — project metadata and dependencies
2. **Version history** — at least one published release or tag
3. **Existing documentation** — `SPEC.md` or `docs/` with real content (not placeholders)
4. **Active development** — recent commits, open issues, or ongoing work

Output a summary:

```
PROJECT STATE DETECTED:
- package.json: [exists / missing]
- Version history: [N releases / tags]
- SPEC.md: [exists with real content / exists but placeholder / missing]
- docs/: [list of docs with real content]
- Recent activity: [summary of last N commits]
- MATURITY: [MATURE / IMMATURE]
```

**If the project is NOT mature**, suggest using `/spec` instead:

> This project does not appear mature enough for `/evolve`. `/evolve` is designed for projects with established versions, documentation, and active development. Use `/spec` to create initial specifications for a new project.

**If the project IS mature**, proceed to the goal determination phase.

## Phase 0: Determine Goal

If the user's request is vague or missing key details, invoke @skills/interview-me/SKILL.md to extract the full intent before proceeding.

**Always use the `question` tool to let the user choose a route — never decide automatically, even if the request seems clear or trivial.** The user must explicitly select a route before proceeding. Present these options:

- **A) New or modified specs** — Add new features, change existing behavior, respond to new requirements
- **B) Something else** — Let the user describe a different goal

> **Note:** If you need to update living documentation, invoke `/docs-update`. If you need to resolve an issue or bug, invoke `/diagnosis`. This command focuses exclusively on creating and modifying specs for mature projects.

## Phase 1: Execute — New or Modified Specs

1. **Clarify intent** — what's the new requirement? Why is it changing?
2. If requirements are vague, invoke @skills/interview-me/SKILL.md first to extract intent, then @skills/idea-refine/SKILL.md to explore variations
3. Use @skills/spec-driven-development/SKILL.md to generate structured specs for the new or changed requirements
4. **Determine scope** — does this change existing specs or create new ones?
   - New feature → create `specs/spec-<feature>.md`
   - Modify existing → update relevant spec files
5. **Document architecture impact** — update @specs/adr/ if the change affects architecture
6. Include updated architecture diagrams using @skills/architecture-diagrams/SKILL.md
7. For non-trivial decisions, invoke @skills/doubt-driven-development/SKILL.md
8. **Spec update done — do NOT touch code files.** Now hand off implementation:
   - If the change is simple (single file, limited scope): tell the user to run `/build`
   - If the change is complex (multi-file, needs planning): tell the user to run `/plan` then `/build`
   - Do not invoke other primary agents (Tlaloc, Moctezuma, etc.) via `task()`
9. Use the `question` tool to confirm with the user before proceeding

## Suggested Next Step

After completing the spec update:

> Your spec is ready. Run `/plan` to create an execution plan, or run `/build` to start implementing directly for simple changes.

## Rules

1. `/evolve` is for **existing, mature projects only**. If the project is new or lacks version history, redirect to `/spec`.
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
