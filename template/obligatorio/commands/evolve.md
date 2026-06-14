---
description: Evolve an existing project — update living documentation, resolve issues, establish new specs or modify existing ones
agent: quetzalcoatl
---

## Pre-Flight: Detect Project State

1. Read @SPEC.md — does it exist? Has real content or placeholders?
2. Read @docs/ (skip @opencode/) — what documentation exists? Has real content?
3. Read @specs/ if it exists — any modular specs?
4. Check git log for recent activity, open issues, ongoing work

Output a summary:
```
PROJECT STATE DETECTED:
- SPEC.md: [exists with real content / exists but placeholder / missing]
- docs/: [list of docs with real content]
- specs/: [exists with N specs / not yet modularized]
- Recent activity: [summary of last N commits]
```

## Phase 0: Determine Goal

If the user's request is vague or missing key details, invoke @skills/interview-me/SKILL.md to extract the full intent before proceeding.

**Always use the `question` tool to let the user choose a route — never decide automatically, even if the request seems clear or trivial.** The user must explicitly select a route before proceeding. Present these options:

- **A) Update living documentation** — Refresh existing docs, add ADRs, sync docs with current codebase state
- **B) Resolve an issue or bug** — Address a specific problem, bug fix, or feature request
- **C) New or modified specs** — Add new features, change existing behavior, respond to new requirements
- **D) Something else** — Let the user describe a different goal

If the detected state is incomplete (e.g. @SPEC.md missing but docs exist), flag it and recommend the appropriate route in the first option.

## Phase 1: Execute Based on Goal

### Route A — Update Living Documentation

1. **Audit current docs** — identify what's outdated, missing, or inconsistent with the codebase
2. **Update or create**:
   - @docs/ARCHITECTURE.md — reflect current architecture decisions
   - @docs/SCHEMA.md — update if DB schema changed
   - @docs/APPFLOW.md — update if user flows changed
   - @docs/CODE_STYLE.md — refine conventions based on actual code patterns
3. **Create ADRs** for significant decisions made since last documentation pass (use @skills/documentation-and-adrs/SKILL.md)
4. **Update SPEC.md** if the project scope or direction has shifted
5. If @SPEC.md exceeds 200 lines, invoke @skills/agent-md-refactor/SKILL.md to modularize into @specs/
6. Use the `question` tool to confirm changes with the user before writing

### Route B — Resolve an Issue

1. **Understand the issue** — read the issue description, reproduction steps, expected vs actual behavior
2. If the issue is unclear, invoke @skills/interview-me/SKILL.md to extract full context
3. **Analyze impact** — what parts of the codebase/docs/specs are affected?
4. **Propose a solution** — present options with tradeoffs
5. For non-trivial changes, invoke @skills/doubt-driven-development/SKILL.md to stress-test the approach
6. **Update specs/documentation** if the resolution changes established behavior
7. Recommend the user run `/build` if coding is required — do NOT delegate to Tlaloc via `task()`. Primary agents are invoked by the user, not by other agents.

### Route C — New or Modified Specs

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

## Rules

1. `/evolve` is for **existing projects only**. If no documentation exists (greenfield project), redirect to `/spec`.
2. Use the `question` tool before overwriting any existing documentation — always show the diff or changes first and confirm.
3. When modifying specs, preserve previous versions or document the change history.
4. Every evolution should leave the project in a consistent, documented state.
5. Use @SPEC.md as the single source of truth for project scope and direction.
6. If the project has no @SPEC.md but has real docs, recommend Route A first to establish it.
