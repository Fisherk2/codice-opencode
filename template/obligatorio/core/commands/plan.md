---
description: Break down the specs into small, verifiable tasks with acceptance criteria.
agent: moctezuma
---

Read the existing specs (@SPEC.md, @specs/, @docs/WORKFLOW.md, @docs/TECH_DEBT.md, or equivalent files) and the relevant codebase sections.

If the specs or requirements are unclear, **Load** `interview-me` skill and use `question` tool to ask the user to clarify intent before breaking down tasks.

Then **Load** `planning-and-task-breakdown` skill.

1. Enter plan mode — read only, no code changes
2. Identify the dependency graph between components. If the project uses DDD or Clean Architecture, **Load** `clean-ddd-hexagonal` skill for domain-driven module decomposition
3. Slice work vertically (one complete path per task, not horizontal layers)
4. Write tasks with acceptance criteria and verification steps. **Load** `design-patterns` skill when planning which GoF or enterprise patterns to apply in each task. **Load** `architecture-diagrams` skill to draw diagrams and components.
5. Suggest what subagents should invoke the main agents to complete each task, analyze `agents/` directory to asign the most appropriate subagents and write them to `tasks/` files, can be multiple subagents per task (parallel/sequential) or none, **ONLY** subagents, **NOT** main agents (huitzilopochtli, quetzalcoatl, etc).
6. Add checkpoints between phases within `tasks/plan.md` and `tasks/todo.md` — quality gates that must pass before moving to the next phase
7. Present a brief summary of the plan for human review before saving.
8. **Planification is done — do NOT touch or implement anything. Only plan and write to `tasks/` files.**
9. Use the `question` tool to confirm plan with the user before saving to `tasks/plan.md` and `tasks/todo.md`
10. Commit all changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

## Suggested Next Step

> The plan is ready. Run `/build` to start implementing the first task from the plan.
