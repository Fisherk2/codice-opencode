---
description: Write failing tests, implement guardrails, verify. For bugs, use the Prove-It pattern.
agent: mictlantecuhtli
---

## Pre-Flight: Detect Project State

Detect the project's quality infrastructure:

1. **Test framework** — Check for test directories.
2. **Linter** — Check for linter configs.
3. **Formatter** — Check for formatter configs.
4. **Typechecker** — Check for typechecker configs.

Output summary:

```
PROJECT QUALITY STATE:
- Test framework: [exists at <path> / missing]
- Linter: [exists at <path> / missing]
- Formatter: [exists at <path> / missing]
- Typechecker: [exists at <path> / missing]
```

Use the `question` tool to report findings and ask user whether to:

- **A) Proceed** — run all quality checks with existing tools only and proceed with phase 1.
- **B) Setup missing guardrails** — proceed with phase 0 to install and configure missing tools first

## Phase 0: Guardrail Setup

*Only runs if user chose option B in Pre-Flight.*

For each missing tool, detect project language from `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml` `src/`, etc. and suggest the best and appropriate tools with `research-analyst` subagent. Use the `question` tool to confirm before installing.

For each confirmed tool:
- Install tool (if not already installed)
- Create minimal config file with sensible defaults
- Verify the tool works by running it once
- Update project documentation to include the new tool

## Phase 1: Audit & Analysis

**Delegate** `test-engineer`subagent and scan recent changes to identify missing test coverage.

1. Run `git diff` against the integration branch to detect new/modified code.
2. Cross-reference with existing test files to find gaps.
3. Classify each gap by **category** (Feature / Bug Fix) and **pyramid level** (Unit / Integration / E2E).
4. Use the `question` tool to present the report and confirm which tests to implement in Phase 2.

## Phase 2: Test-Driven Development

Load @skills/test-driven-development/SKILL.md skill to follow the TDD process.

**Supporting skills (load as needed):**

- `performance-analysis` — if tests reveal performance concerns
- `security-and-hardening` — when testing security-sensitive features
- `design-taste-frontend` — to verify visual consistency in frontend
- `browser-testing-with-devtools` — for browser-related issues

Write depending of phase 1 report:

**For new features:**

1. Load `error-handling-patterns` skill for error paths and resilience tests, then **delegate**  `test-engineer` subagent to write tests that describe expected behavior (must FAIL).
2. Implement code to make them pass
3. Refactor while keeping tests green. Load `refactoring-patterns` skill

**For bug fixes (Prove-It pattern):**

1. **Delegate** `chaos-engineer` subagent and write test that reproduces the bug (must FAIL). Load `debugging-and-error-recovery` skill if hard to reproduce.
2. Confirm test fails
3. **Delegate** `debugger` subagent to analyze and implement fix, if is hard to debug invoke `error-detective` subagent.
4. Confirm test passes
5. Run full test suite for regressions

## Phase 3: Final Quality Gate

1. Invoke `code-reviewer` subagent with `code-review-and-quality` skill for multi-axis review (correctness, readability, architecture, security, performance) to review implemented tests.
2. Apply suggested changes

After ALL tests changes, run ALL quality checks AGAIN:

2. Run full test suite — must ALL pass (0 failures)
3. Run linter — must have 0 errors (warnings OK but report them)
4. Run formatter CHECK mode — must have 0 unformatted files
5. Run typechecker — must have 0 type errors

**If ANY check fails:**

6. Revert and reconsider. Load `debugging-and-error-recovery` skill if stuck.
7. Commit atomic changes following @skills/git-workflow-and-versioning/SKILL.md

## Escalation to Incident Response

If debugging detects a **production incident** (e.g., users affected, service degradation), escalate to:
- Load `incident-response` skill and **delegate** to `error-coordinator` subagent — Incident triage, communication, and postmortem workflow 

## Suggested Next Step

> All tests pass. Run `/code-simplify` to refactor and simplify the code, or run `/webperf` if you want to optimize web performance.
