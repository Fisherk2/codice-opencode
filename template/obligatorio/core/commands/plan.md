---
description: Break down the spec into small, verifiable tasks with acceptance criteria
agent: moctezuma
---

Read the existing specs (@SPEC.md, @specs/, @docs/WORKFLOW.md, @docs/TECH_DEBT.md or equivalent) and the relevant codebase sections.

If the spec or requirements are unclear, load `interview-me` skill and ask the user to clarify intent before breaking down tasks.

Then invoke @skills/planning-and-task-breakdown/SKILL.md.

1. Enter plan mode — read only, no code changes
2. Identify the dependency graph between components. If the project uses DDD or Clean Architecture, use `clean-ddd-hexagonal` skill for domain-driven module decomposition
3. Slice work vertically (one complete path per task, not horizontal layers)
4. Write tasks with acceptance criteria and verification steps. Load `design-patterns` skill when planning which GoF or enterprise patterns to apply in each task
5. Add checkpoints between phases within @tasks/plan.md — quality gates that must pass before moving to the next phase
6. Present a brief summary of the plan for human review before saving. For complex plans, visualize dependencies and flows using @skills/architecture-diagrams/SKILL.md
7. Use the `question` tool to confirm with the user before saving to @tasks/plan.md and @tasks/todo.md
8. Commit all changes with a descriptive message following @skills/git-workflow-and-versioning/SKILL.md conventions.

## Suggested Next Step

> The plan is ready. Run `/build` to start implementing the first task from the plan.
