---
description: Create or edit structured specification documents for UI/UX.
agent: quetzalcoatl
---

## Pre-flight: Understand Design Scope

If the user's request is vague or missing key functional and non-functional requirements, **Load** the `interview-me` skill to extract intent before proceeding.

1. **Load** `idea-refine` alongside `brainstorming` and `ui-ux-design-pro` skill to begin the design process, generate and evaluate options to explore design variations.

2. Use the `question` tool to clarify interactively:

- **Project type** — New design system, component audit, landing page, dashboard, mobile app, etc.
- **Target users** — Who will use this interface?
- **Existing design** — Starting from scratch or evolving an existing system?
- **Constraints** — Brand guidelines, accessibility requirements, tech stack

3. Use separate `question` tool calls for:
- **Visual style**: modern, minimal, corporate, playful?
- **Reference designs**: any inspiration or examples?
- **Platform**: web, mobile, desktop?

**Always use the `question` tool to let the user confirm what UI/UX needs in the project — never decide automatically, even if the specifications or requirements seem clear or trivial.** The user must answer doubts, suggestions, and ambiguities before proceeding.

## Phase A — Parallel Fan-out

Spawn subagents concurrently. **Issue all Agent tool calls in a single assistant turn so they execute in parallel.**

1. **`ux-researcher`** — Conduct user research analysis. Define target personas, map user journeys, identify pain points and opportunities.
2. **`frontend-developer`** — Analyze technical feasibility. Evaluate component architecture, state management needs, API integration points, and performance constraints.
3. **`accessibility-tester`** — Define accessibility requirements. Map WCAG 2.1 AA/AAA compliance needs, keyboard navigation patterns, screen reader support, and color contrast requirements.

Without an Agent tool, invoke each persona's system prompt sequentially and treat outputs as if returned in parallel — the merge phase still works.

Constraints:
- Subagents cannot spawn other subagents
- Each subagent gets its own context window and returns only its report
- Custom personas defined in `.opencode/agents/` or `~/.opencode/agents/` take precedence

## Phase B — Merge in Main Context

Once all reports are back, synthesize into a comprehensive design specification:

1. **User Experience** — Aggregate `ux-researcher` subagent insights: personas, journeys, pain points, opportunities
2. **Technical Constraints** — Pull from `frontend-developer` subagent output and **Load** `frontend-ui-engineering` skill for component architecture, state management, API needs, performance
3. **Accessibility** — Integrate `accessibility-tester` subagent requirements: WCAG compliance, keyboard nav, screen readers
4. **Design System** — Define tokens, colors, typography, spacing, components **Loading** `design-taste-frontend` skill for metric-based UI/UX rules
5. **User Flows** — Create flow diagrams **Loading** `architecture-diagrams` skill, combining UX research and technical constraints

## Phase C — Save Design Specification

**Delegate** to `docs-writer` subagent and save the design specification to @docs/DESIGN.md with this requirements:

- Project Name and Version
- Overview - Project description and goals
- User Personas - From `ux-researcher` output
- User Flows - Flow diagrams and user journeys
- Design System 
- Tokens - Colors, typography, spacing, shadows
- Components - Component hierarchy and states
- Patterns - Interaction patterns and conventions
- Technical Constraints From `frontend-developer` output
- Accessibility Requirements - From `accessibility-tester` output
- References - Inspiration links, Brand guidelines 

Also create or update supporting files in @specs/design/

## Phase D: Finalize

1. **Design specification is done — do NOT touch or implement code files.**
2. Use the `question` tool to confirm with the user before proceeding.
3. Commit all changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

## Rules

- Phase A personas run in parallel — never sequentially
- Personas do not call each other; the main agent merges in Phase B
- Always save the design specification to @docs/DESIGN.md
- If `docs/DESIGN.md` and/or `specs/design/` does not exist, create it
- Create supporting files in @specs/design/ for detailed components, styles, and flows
- Use **always** the `question` tool to clarify in Phase 0, even if the design scope is ambiguous or clear.
- **Scope boundary**: This command only writes to @docs/DESIGN.md and @specs/design/. If other documentation files need updating (e.g. performance, security, architecture), use the `question` tool to explain the reason and confirm with the user before proceeding
- You can stop and ask the user for clarification if you need more information to proceed.
- Use the best available tools for the job.
- Research external resources every time, specially if you are stuck or unsure about something. 
- **Never** write to `tasks/` directories.
- **Never** implement code changes, only documentation.

## Suggested Next Step

> Design specification is ready. Run `/plan` to create an execution plan for the implementation.

---

User instructions:

