---
description: Write failing tests, implement, verify. For bugs, use the Prove-It pattern.
agent: mictlantecuhtli
---

Invoke @skills/test-driven-development/SKILL.md.

## Escalation to Incident Response

If debugging detects a **production incident** (e.g., users affected, service degradation), escalate to:
- Load `incident-response` skill — Incident triage, communication, and postmortem workflow

---

During testing, load any of the following supporting skills as the task requires:
- `performance-analysis` skill if tests reveal performance concerns
- `security-and-hardening` skill when testing security-sensitive features
- `design-taste-frontend` skill to verify visual consistency in frontend

For new features:

1. Write tests that describe the expected behavior (they should FAIL). Load `error-handling-patterns` skill for error paths and resilience tests
2. Implement the code to make them pass
3. Refactor while keeping tests green loading `refactoring-patterns` skill

For bug fixes (Prove-It pattern):

1. Write a test that reproduces the bug (must FAIL). If hard to reproduce, load `debugging-and-error-recovery` skill
2. Confirm the test fails
3. Implement the fix
4. Confirm the test passes
5. Run the full test suite for regressions

For browser-related issues, also load `browser-testing-with-devtools` skill to verify with `Chrome DevTools` MCP.

---
## Quick Code Review

1. After all tests pass, invoke `code-reviewer` subagent and load `code-review-and-quality` skill for a multi-axis review of correctness, readability, architecture, security, and performance 
2. Apply any suggested changes. Verify all tests pass after applying changes. 
3. If tests fail, revert that change and reconsider. If you're stuck, load `debugging-and-error-recovery` skill
4. Commit atomic changes with a descriptive message following @skills/git-workflow-and-versioning/SKILL.md conventions

## Suggested Next Step

> All tests pass. Run `/code-simplify` to refactor and simplify the code, or run `/webperf` if you want to optimize web performance.
