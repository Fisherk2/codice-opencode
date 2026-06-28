---
description: Simplify code for clarity and maintainability — reduce complexity without changing behavior
agent: tlaloc
---

Invoke @skills/code-simplification/SKILL.md.

Simplify recently changed code (or the specified scope) while preserving exact behavior:

1. Read @AGENTS.md or @docs/CODE_STYLE.md and check project conventions
2. Identify the target code — recent changes unless a broader scope is specified
3. Understand the code's purpose, callers, edge cases, and test coverage before touching it
4. Scan for simplification opportunities using @skills/clean-code/SKILL.md for readability principles and @skills/refactoring-patterns/SKILL.md for named refactoring transformations:
   - Deep nesting → guard clauses or extracted helpers
   - Long functions → split by responsibility
   - Nested ternaries → if/else or switch
   - Generic names → descriptive names
   - Duplicated logic → shared functions
   - Dead code → remove after confirming
5. Apply each simplification incrementally via @skills/incremental-implementation/SKILL.md using @skills/solid/SKILL.md to maintain SOLID principles — run tests after each change
6. Verify all tests pass, the build succeeds, and the diff is clean

If tests fail after a simplification, revert that change and reconsider. Use @skills/code-review-and-quality/SKILL.md to review the result.

## Suggested Next Step

> Code simplified. Run `/review` to review the latest implementations and ensure quality.
