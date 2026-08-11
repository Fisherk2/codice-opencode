---
description: Implement the next task incrementally — build, test, verify, do atomic commit
agent: tlaloc
---

Invoke @skills/incremental-implementation/SKILL.md alongside @skills/test-driven-development/SKILL.md. Ground all implementation in @skills/source-driven-development/SKILL.md.

Pick the next pending @tasks/ from the plan. For each task:

1. Read the task's acceptance criteria
2. Load relevant context (existing code, patterns, types)
3. **Delegate** to an appropriate subagents to implement the task with: task description, acceptance criteria, skills to load, and project conventions from `AGENTS.md` or @docs/CODE_STYLE.md.
4. Subagents should write a failing test for the expected behavior (RED). Use @skills/solid/SKILL.md for SOLID principles and clean test design
5. Subagents should implement the minimum code to pass the test (GREEN), always load `clean-code` skill to follow clean code practices. Load these supporting skills as the task requires:
   - `clean-ddd-hexagonal` for domain logic
   - `error-handling-patterns` for error handling
   - `security-and-hardening` for auth, input, or data security
   - `ui-ux-design-pro` and `design-taste-frontend` for UI
   - `bash-defensive-patterns` for shell scripts
   - `performance-analysis` for performance-sensitive code
6. Review the subagent's work — invoke `code-reviewer` subagent to verify tests pass, code follows conventions, no unintended changes
7. Fix any discrepancies found during review before proceeding.
8. Run the full test suite to check for regressions. For UI tasks, also verify loading `browser-testing-with-devtools` skill
9. Mark the task complete, then proceed to the next task and repeat steps 3-9 until all tasks are complete.
10. Commit atomic changes with a descriptive message following @skills/git-workflow-and-versioning/SKILL.md conventions.

If agents are stuck or the implementation fails, **Delegate** to `debugger` subagent and follow @skills/debugging-and-error-recovery/SKILL.md to diagnose and fix issues. If the debugger can't resolve the issue, **Delegate** to `error-detective` subagent and **Load** `observality-and-instrumentation` skill to identify the root cause and implement a fix with appropriate subagents.

## Suggested Next Step

> Implementation complete. Run `/test` to validate the implementation and check for regressions.
