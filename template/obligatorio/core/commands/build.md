---
description: Implement the next task incrementally — build, test, verify, do atomic commit
agent: tlaloc
---

## Phase 1: Extract implementation plan

Pick the next pending @tasks/ from the plan. For each task:

1. Read the task's acceptance criteria
2. Load relevant context (existing code, patterns, types)
3. Understand the task's dependencies and constraints
4. Use `question` tool to ask for clarification if needed

**Important**: If `task/` directory does not exist or is empty, **STOP** and suggest to create a plan first with `/plan` command.

## Phase 2: Implement the task incrementally

**Load** `incremental-implementation` skill alongside `test-driven-development` skill. Then **Load** `source-driven-development` skill to ground all implementation.

1. **Delegate** to asigned subagents to implement the task with: task description, acceptance criteria, skills to load, tools to use, resources to consult, and project conventions (`AGENTS.md`, @docs/CODE_STYLE.md or similar documentation).
2. Subagents **should** write a failing test for the expected behavior (RED). **Load** `solid` skill for SOLID principles and clean test design
3. Subagents **should** implement the minimum code to pass the test (GREEN), **Always load** `clean-code` skill to follow clean code practices.
4. Run the full test suite to check for regressions.
5. Mark the task complete, then proceed to the next task and **repeat steps 1-5** until all tasks are complete.
6. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

**Important**: If you/subagents get stuck or the implementation fails, **STOP** and **Delegate** to `debugger` subagent and **Load** `debugging-and-error-recovery` skill to diagnose and fix issues. If the debugger can't resolve the issue, **Delegate** to `error-detective` subagent and **Load** `observability-and-instrumentation` skill to identify the root cause and implement a fix with appropriate subagents, always report to the user what is the issue and what you have to do to fix it, ask user for confirmation before proceeding with `question` tool.

## Rules

- If `task/` directory does not exist, don't implement anything. Suggest create implementation plan before doing any job.
- Always follow the rules of the project and plan files.
- You can stop and ask the user for clarification if you need more information to complete the task.
- Use the best available tools for the job.
- Research external resources every time, specially if you are stuck or the implementation fails.
- If `CODE_STYLE.md` does not exist, use the best practices and conventions of the project and write it in `docs/CODE_STYLE.md`.

## Suggested Next Step

> Implementation complete. Run `/test` to validate the implementation and check for regressions.

---

User context:

