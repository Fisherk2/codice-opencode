---
description: Implement the next task incrementally — build, test, verify, commit
agent: tlaloc
---

Invoke @skills/incremental-implementation/SKILL.md alongside @skills/test-driven-development/SKILL.md. Ground all implementation in @skills/source-driven-development/SKILL.md.

Pick the next pending @tasks/ from the plan. For each task:

1. Read the task's acceptance criteria
2. Load relevant context (existing code, patterns, types)
3. Write a failing test for the expected behavior (RED). Use @skills/solid/SKILL.md for SOLID principles and clean test design
4. Implement the minimum code to pass the test (GREEN). Invoke supporting skills as the task requires:
   - @skills/clean-ddd-hexagonal/SKILL.md for domain logic
   - @skills/error-handling-patterns/SKILL.md for error handling
   - @skills/security-and-hardening/SKILL.md for auth, input, or data security
   - @skills/ui-ux-design-pro/SKILL.md and @skills/design-taste-frontend/SKILL.md for UI
   - @skills/bash-defensive-patterns/SKILL.md for shell scripts
   - @skills/performance-analysis/SKILL.md for performance-sensitive code
5. Run the full test suite to check for regressions. For UI tasks, also verify with @skills/browser-testing-with-devtools/SKILL.md
6. Run the build to verify compilation
7. Commit with a descriptive message following @skills/git-workflow-and-versioning/SKILL.md
8. Mark the task complete and move to the next one

If any step fails, follow @skills/debugging-and-error-recovery/SKILL.md
