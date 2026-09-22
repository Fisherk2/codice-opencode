---
description: Implement the next task incrementally — build, test, verify, do atomic commit
agent: tlaloc
---

**Load** `incremental-implementation` skill alongside `test-driven-development` skill. Then **Load** `source-driven-development` skill to ground all implementation.

Pick the next pending @tasks/ from the plan. For each task:

1. Read the task's acceptance criteria
2. Load relevant context (existing code, patterns, types)
3. **Delegate** to asigned subagents to implement the task with: task description, acceptance criteria, skills to load, and project conventions (`AGENTS.md`, @docs/CODE_STYLE.md or similar).
4. Subagents **should** write a failing test for the expected behavior (RED). **Load** `solid` skill for SOLID principles and clean test design
5. Subagents **should** implement the minimum code to pass the test (GREEN), **Always load** `clean-code` skill to follow clean code practices.
6. Review the subagent's work — **Delegate** `code-reviewer` subagent to verify tests pass, code follows conventions, no unintended changes
7. Fix any discrepancies found during review before proceeding.
8. Run the full test suite to check for regressions. If applicable, **Load** `browser-testing-with-devtools` skill for UI tasks
9. Mark the task complete, then proceed to the next task and **repeat steps 3-9** until all tasks are complete.
10. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

If agents are stuck or the implementation fails, **Delegate** to `debugger` subagent and **Load** `debugging-and-error-recovery` skill to diagnose and fix issues. If the debugger can't resolve the issue, **Delegate** to `error-detective` subagent and **Load** `observability-and-instrumentation` skill to identify the root cause and implement a fix with appropriate subagents.

## Suggested Next Step

> Implementation complete. Run `/test` to validate the implementation and check for regressions.
