---
description: Run TDD workflow — write failing tests, implement, verify. For bugs, use the Prove-It pattern.
agent: mictlantecuhtli
---

Invoke @skills/test-driven-development/SKILL.md.

## Escalation to Incident Response

If debugging detects a **production incident** (e.g., users affected, service degradation), escalate to:
- @skills/incident-response/SKILL.md — Incident triage, communication, and postmortem workflow

---

For new features:

1. Write tests that describe the expected behavior (they should FAIL). Use @skills/error-handling-patterns/SKILL.md for error paths and resilience tests
2. Implement the code to make them pass
3. Refactor while keeping tests green using @skills/refactoring-patterns/SKILL.md

For bug fixes (Prove-It pattern):

1. Write a test that reproduces the bug (must FAIL). If hard to reproduce, use @skills/debugging-and-error-recovery/SKILL.md
2. Confirm the test fails
3. Implement the fix
4. Confirm the test passes
5. Run the full test suite for regressions

For browser-related issues, also invoke @skills/browser-testing-with-devtools/SKILL.md to verify with Chrome DevTools MCP.

After all tests pass, invoke @skills/code-review-and-quality/SKILL.md for a multi-axis review of correctness, readability, architecture, security, and performance.

During testing, invoke supporting skills as the task requires:
- @skills/performance-analysis/SKILL.md if tests reveal performance concerns
- @skills/security-and-hardening/SKILL.md when testing security-sensitive features
- @skills/design-taste-frontend/SKILL.md to verify visual consistency in frontend
