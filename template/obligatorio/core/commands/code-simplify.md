---
description: Simplify code for clarity and maintainability.
agent: tezcatlipoca
---

## Phase 1: Refactoring/simplification/optimization observations

1. Extract user intentions
2. Identify the target code — recent changes unless a broader scope is specified

3. **Delegate** to `codebase-archaeologist`, `code-reviewer` (and appropriate specialized subagents in parallel) to understand the code's purpose, callers, edge cases, and test coverage before touching it and pass the code scope, simplification goals, skills to load, resources to consult, and project conventions from `AGENTS.md`, @docs/CODE_STYLE.md or similar project convention documents. 

You should **Load** `clean-code` skill for readability principles and `refactoring-patterns` skill for named refactoring transformations:
   - Deep nesting → guard clauses or extracted helpers
   - Long functions → split by responsibility
   - Nested ternaries → if/else or switch
   - Generic names → descriptive names
   - Duplicated logic → shared functions
   - Dead code → remove after confirming

Subagents should scan for simplification/refactoring/optimization opportunities.

4. Make a report to the user of the target code (file:lines) and all the information gathered by `codebase-archaeologist` (and specialized subagents) and ask for confirmation using `question` tool what observations should be refactored/simplified/optimized and what should be ignored.

## Phase 2: Simplify, refactor and optimize reported code

If user confirms report, **Load** `code-simplification` skill to perform code refactoring and simplification to improve readability and maintainability on user decisions while preserving exact behavior:

1. Read `AGENTS.md`, @docs/CODE_STYLE.md or similar documents and check project conventions
2. Identify the reported target code (file:lines) and load it into the context
3. Understand the code's purpose, callers, edge cases, and test coverage before touching it
4. **Delegate** `refactorer` subagent and **Load** `incremental-implementation` skill to apply all reported refactoring/simplification/optimization opportunities incrementally, **Load** `solid` skill to maintain SOLID principles — run tests after each change, if tests fail after a change, revert that change and reconsider.
5. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

**Important**: If you/subagents get stuck or the implementation fails, **STOP** and **Delegate** to `debugger` subagent and **Load** `debugging-and-error-recovery` skill to diagnose and fix issues. If the debugger can't resolve the issue, **Delegate** to `error-detective` subagent and **Load** `observability-and-instrumentation` skill to identify the root cause and implement a fix with appropriate subagents, always report to the user what is the issue and what you have to do to fix it, ask user for confirmation before proceeding with `question` tool.

## Rules

- **Do not** modify `CODE_STYLE.md` if it exists, follow the conventions and best practices defined in it.
- If `CODE_STYLE.md` does not exist, use the best practices and conventions of the project and write it in `docs/CODE_STYLE.md`.
- Always follow the rules of the project and observations report.
- You can stop and ask the user for clarification if you need more information to complete the observation report.
- Use the best available tools for the job.
- Research external resources every time, specially if you are stuck or the refactor/simplification/optimization fails. 

## Suggested Next Step

> Code simplified. Run `/review` to check the scoped changes and ensure quality.

---

User context:

