---
description: Design UI/UX specifications — create structured specification documents for design systems, user flows, and component architectures for creative projects
agent: quetzalcoatl
---

Invoke @skills/ui-ux-design-pro/SKILL.md to begin the design process.

## Phase 0 — Pre-flight: Understand Design Scope

If the user's request is vague or missing key functional and non-functional requirements, invoke @skills/interview-me/SKILL.md to extract intent before proceeding.

If the user has a rough idea but needs to explore design variations, invoke @skills/idea-refine/SKILL.md to generate and evaluate options.

Use the `question` tool to clarify interactively:

1. **Project type** — New design system, component audit, landing page, dashboard, mobile app, etc.
2. **Target users** — Who will use this interface?
3. **Existing design** — Starting from scratch or evolving an existing system?
4. **Constraints** — Brand guidelines, accessibility requirements, tech stack

Use separate `question` tool calls for:
- **Visual style**: modern, minimal, corporate, playful?
- **Reference designs**: any inspiration or examples?
- **Platform**: web, mobile, desktop?

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

1. **User Experience** — Aggregate `ux-researcher` insights: personas, journeys, pain points, opportunities
2. **Technical Constraints** — Pull from `frontend-developer` and @skills/frontend-ui-engineering/SKILL.md for component architecture, state management, API needs, performance
3. **Accessibility** — Integrate `accessibility-tester` requirements: WCAG compliance, keyboard nav, screen readers
4. **Design System** — Define tokens, colors, typography, spacing, components using @skills/design-taste-frontend/SKILL.md for metric-based UI/UX rules
5. **User Flows** — Create flow diagrams using @skills/architecture-diagrams/SKILL.md, combining UX research and technical constraints

## Phase C — Save Design Specification

1. Save the design specification to @docs/DESIGN.md:

```markdown
# [Project Name] — Design Specification
## Overview
[Project description and goals]
## User Personas
[From ux-researcher output]
## User Flows
[Flow diagrams and user journeys]
## Design System
### Tokens
- Colors, typography, spacing, shadows
### Components
- Component hierarchy and states
### Patterns
- Interaction patterns and conventions
## Technical Constraints
[From frontend-developer output]
## Accessibility Requirements
[From accessibility-tester output]
## References
- [Inspiration links]
- [Brand guidelines]
```

2. Also create or update supporting files in @specs/design/

## Suggested Next Step

> Design specification is ready. Run `/plan` to create an execution plan for the implementation.

## Rules

1. Phase A personas run in parallel — never sequentially
2. Personas do not call each other; the main agent merges in Phase B
3. Always save the design specification to @docs/DESIGN.md
4. Create supporting files in @specs/design/ for detailed components, styles, and flows
5. Use the `question` tool to clarify in Phase 0 if the design scope is ambiguous
6. **Scope boundary**: This command only writes to @docs/DESIGN.md and @specs/design/. If other documentation files need updating (e.g. performance, security, architecture), use the `question` tool to explain the reason and confirm with the user before proceeding
