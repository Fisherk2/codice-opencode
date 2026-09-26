---
description: Simplify code for clarity and maintainability.
agent: tezcatlipoca
---

**Load** `code-simplification` skill to perform code refactoring and simplification.

Simplify and refactory code to improve readability and maintainability on recently changed code (or the specified scope) while preserving exact behavior:

1. Read `AGENTS.md`, @docs/CODE_STYLE.md or similar documents and check project conventions
2. Identify the target code — recent changes unless a broader scope is specified
3. Understand the code's purpose, callers, edge cases, and test coverage before touching it
4. **Delegate** to `code-reviewer`, `codebase-archaeologist` and appropriate subagents in parallel — pass the code scope, simplification goals, skills to load, and project conventions from `AGENTS.md`, @docs/CODE_STYLE.md or similar project convention documents.
5. Subagents should scan for simplification opportunities, **Load** `clean-code` skill for readability principles and `refactoring-patterns` skill for named refactoring transformations:
   - Deep nesting → guard clauses or extracted helpers
   - Long functions → split by responsibility
   - Nested ternaries → if/else or switch
   - Generic names → descriptive names
   - Duplicated logic → shared functions
   - Dead code → remove after confirming
6. After subagents find simplification opportunities, **Delegate** `refactorer` subagent and **Load** `incremental-implementation` skill to apply all opportunities incrementally, **Load** `solid` skill to maintain SOLID principles — run tests after each change, if tests fail after a change, revert that change and reconsider.
7. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

If agents are stuck or the simplification process fails, **Delegate** to `debugger` subagent and **Load** `debugging-and-error-recovery` skill to diagnose and fix issues. If the debugger can't resolve the issue, **Delegate** to `error-detective` subagent and **Load** `observability-and-instrumentation` skill to identify the root cause and implement a fix with appropriate subagents.

## Suggested Next Step

> Code simplified. Run `/review` to review the latest implementations and ensure quality.
