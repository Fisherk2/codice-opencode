---
description: Simplify code for clarity and maintainability.
agent: tlaloc
---

Invoke @skills/code-simplification/SKILL.md.

Simplify and refactory code to improve readability and maintainability on recently changed code (or the specified scope) while preserving exact behavior:

1. Read `AGENTS.md` or @docs/CODE_STYLE.md and check project conventions
2. Identify the target code — recent changes unless a broader scope is specified
3. Understand the code's purpose, callers, edge cases, and test coverage before touching it
4. **Delegate** to `code-reviewer`, `codebase-archaeologist` and appropriate subagents in parallel — pass the code scope, simplification goals, skills to load, and project conventions from `AGENTS.md` or @docs/CODE_STYLE.md
5. Subagents should scan for simplification opportunities loading `clean-code` skill for readability principles and `refactoring-patterns` skill for named refactoring transformations:
   - Deep nesting → guard clauses or extracted helpers
   - Long functions → split by responsibility
   - Nested ternaries → if/else or switch
   - Generic names → descriptive names
   - Duplicated logic → shared functions
   - Dead code → remove after confirming
6. After subagents find simplification opportunities, **Delegate** `refactorer` subagent to apply each simplification incrementally via @skills/incremental-implementation/SKILL.md using @skills/solid/SKILL.md to maintain SOLID principles — run tests after each change, if tests fail after a simplification, revert that change and reconsider.
7. **Delegate** `code-reviewer` subagent to run the full test suite to check for regressions and **Load** `code-review-and-quality` skill to review the result. For UI tasks, also verify **loading** `browser-testing-with-devtools` skill
8. Fix any discrepancies found during review before proceeding and run test after each change.
9. Commit atomic changes with a descriptive message following @skills/git-workflow-and-versioning/SKILL.md conventions.

If agents are stuck or the simplification process fails, **Delegate** to `debugger` subagent and follow @skills/debugging-and-error-recovery/SKILL.md to diagnose and fix issues. If the debugger can't resolve the issue, **Delegate** to `error-detective` subagent and **Load** `observability-and-instrumentation` skill to identify the root cause and implement a fix with appropriate subagents.

## Suggested Next Step

> Code simplified. Run `/review` to review the latest implementations and ensure quality.
