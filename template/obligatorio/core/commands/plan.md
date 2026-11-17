---
description: Break down the specs into small, verifiable tasks with acceptance criteria.
agent: moctezuma
---

## Phase 1: Obtain project context, specs, and scoped phase requirements

**Load** `codebase-onboarding` skill to understand the project's structure.

1. Read the existing specs (@SPEC.md, @docs/adr, @docs/WORKFLOW.md, @docs/TECH_DEBT.md, or equivalent documentation files) 
2. Read and index the relevant codebase sections to understand the current state of the project. If the codebase is large, focus on the parts that are relevant to the current scoped phase.
3. If the specs or requirements are unclear, **Load** `interview-me` skill and use `question` tool to ask the user to clarify intent before breaking down tasks.

**Always use the `question` tool to let the user confirm what specs or requirements they needs include in the planning process — never decide automatically, even if the specifications or user histories seem clear or trivial.** The user must answer doubts, suggestions, and ambiguities before proceeding.

## Phase 2: Write a structured incremental planning

**Load** `planning-and-task-breakdown` along side `codebase-design` skill.

1. Enter plan mode — read only, no code changes
2. Identify the dependency graph between components. If the project uses DDD or Clean Architecture, **Load** `clean-ddd-hexagonal` skill for domain-driven module decomposition
3. Slice work vertically (one complete path per task, not horizontal layers)

4. Write tasks with acceptance criteria and verification steps. **Load** `design-patterns` skill when planning which GoF or enterprise patterns to apply in each task. **Load** `architecture-diagrams` alongside `markdown-mermaid-writing` skill to draw diagrams and components.

- Suggest what subagents should invoke the main agent to complete each task, analyze and asign the most appropriate subagents and write them to `tasks/` files, can be multiple subagents per task (parallel/sequential) or none, you must explain what tasks should be delegate in parallel or sequentially (only if it's multiple subagents per task) and if it's a sequential delegation, you must explain the order of the subagents delegation. You should use **ONLY** subagents, **NOT** main agents, the available subagents are:

!`for d in agents .opencode/agents; do [ -d "$d" ] || continue; for f in "$d"/*.md; do [ -f "$f" ] || continue; printf '%s :: %.90s\n' "$(basename "$f" .md)" "$(sed -n '/^---$/,/^---$/p' "$f" | grep -m1 '^description: ' | sed 's/^description: //; s/^"//; s/"$//')"; done; done`

- Suggest what skills should load the subagents (or main builder if applicable) to complete each task, analyze and asign the most appropriate skills and write them to `tasks/` files, can be multiple skills per task or none.
- Detect and scan MCPs/Plugins configured in this workspace, and suggest what tools should use the subagents (or main agent if applicable) to complete each task, analyze and asign the most appropriate MCPs/Plugins and write them to `tasks/` files, can be multiple MCPs/Plugins per task or none.
- Establish external resources to consult for each task, analyze and asign the most appropriate external resources and write them to `tasks/` files, can be multiple resources to research per task or none.

5. The asignment of subagents, skills, tools and external resources to each task should be in a table format.
6. Add checkpoints between phases within `tasks/plan.md` and `tasks/todo.md` — quality gates that must pass before moving to the next phase
7. Present a brief summary of the plan for human review before saving.

## Phase 3: Finalize

1. **Planification is done — do NOT touch or implement anything. Only plan and write to `tasks/` files.**
2. Use the `question` tool to confirm plan with the user before saving to `tasks/plan.md` and `tasks/todo.md`
3. Commit all changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

## Rules

- **Do NOT implement anything** — only plan and write to `tasks/` files.
- **Do NOT write any other file outside of `tasks/`** — only write to `tasks/` directory, if you need write to other files, suggest to user change other agents to do it.
- If `task/plan.md` and/or `task/todo.md` already exist, **overwrite** them, if not exist, create them.
- You can stop and ask the user for clarification if you need more information to proceed.
- Use the best available tools for the job.
- Research external resources every time, specially if you are stuck or scope requirements are unclear. 

## Suggested Next Step

> The plan is ready. Run `/build` to start implementing the phase from the plan.

---

User instructions: