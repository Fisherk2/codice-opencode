---
description: Run the pre-launch checklist.
agent: tezcatlipoca
---

**Load** `shipping-and-launch` skill.

## Phase 0 — Pre-flight: Detect project type

Before spawning subagents, detect whether the project has UI components. Check for files matching:

```
**/*.{html,htm,jsx,tsx,vue,svelte,astro}
**/*.{css,scss,less}
**/components/**/*
**/pages/**/*
**/views/**/*
```

- **If UI files exist** → spawn all 5 subagents (including `accessibility-tester`)
- **If NO UI files** → spawn only 4 subagents (skip `accessibility-tester`)

## Phase A — Parallel fan-out

The personas operate independently — no shared state, no ordering — which is what makes parallel execution safe and useful here.

Spawn subagents concurrently using the Agent tool. **Issue all Agent tool calls in a single assistant turn so they execute in parallel** — sequential calls defeat the purpose of this command:

1. **`code-reviewer`** — Run a five-axis review (correctness, readability, architecture, security, performance) on the staged changes or recent commits. Output the standard review template.
2. **`security-auditor`** — Run a vulnerability and threat-model pass. Check OWASP Top 10, secrets handling, auth/authz. Output the standard audit report.
3. **`test-engineer`** — Analyze test coverage for the change. Identify gaps in happy path, edge cases, error paths, and concurrency scenarios. Output the standard coverage analysis.
4. **`dependency-manager`** — Audit dependencies for CVEs, outdated packages, license issues, and unused deps. Output a prioritized remediation list.
5. **`accessibility-tester`** *(only if UI detected in Phase 0)* — Audit UI components for WCAG 2.1 AA/AAA compliance, keyboard navigation, screen reader support, and inclusive design. Output the standard accessibility report.

In other harnesses without an Agent tool, invoke each persona's system prompt sequentially and treat their outputs as if returned in parallel — the merge phase still works. Each subagent gets its own context window and returns only its report to this main session.

## Phase B — Merge in main context

Once all reports are back, the main agent (not a sub-persona) synthesizes them:

1. **Code Quality** — Aggregate Critical/Important findings from `code-reviewer` and any failing tests, lint, or build output. Resolve duplicates between reviewers.
2. **Security** — Promote any Critical/High `security-auditor` findings to launch blockers. Cross-reference with `code-reviewer`'s security axis.
3. **Dependencies** — Promote any Critical/High `dependency-manager` findings (CVEs, outdated packages) to launch blockers. Flag license compliance issues.
4. **Performance** — Pull from `code-reviewer`'s performance axis; cross-check Core Web Vitals if applicable.
5. **Accessibility** *(only if `accessibility-tester` was spawned)* — Aggregate findings. Promote Critical WCAG violations to launch blockers.
6. **Infrastructure** — Env vars, migrations, monitoring, feature flags. **Load** `observability-and-instrumentation` skill for logging, metrics, tracing, and alerting. **Load** `bash-defensive-patterns` for robust CI/CD deployment scripts.
7. **Documentation** — README, ADRs, changelog. **Load** `crafting-effective-readmes` skill for README, `architecture-diagrams` skill for architecture diagrams, and `changelog-generate` skill for changelog updates.

## Phase C — Decision and rollback

Before make output review, use the `question` tool to resolve ambiguities:
- Flag findings that could be **false positives** — ask the user to confirm
- Ask if any observation is **intentional** — the user may have a valid reason
- Let the user dismiss, accept, or modify each disputed finding

1. Produce a single output for user review:

```markdown
## Ship Decision: GO | NO-GO

### Blockers (must fix before ship)
- [Source persona: Critical finding + file:line]

### Recommended fixes (should fix before ship)
- [Source persona: Important finding + file:line]

### Acknowledged risks (shipping anyway)
- [Risk + mitigation]

### Rollback plan
- Trigger conditions: [what signals would prompt rollback]
- Rollback procedure: [exact steps]
- Recovery time objective: [target]

### Specialist reports (full)
- [code-reviewer report]
- [security-auditor report]
- [test-engineer report]
- [dependency-manager report]
- [accessibility-tester report] *(if UI detected)*
```

2. Use the `question` tool to ask the user to confirm the reports before proceeding with fixes.
3. If user confirms, **Delegate** `minimal-change-engineer` subagent and **Load** `incremental-implementation` skill to apply all observations incrementally, **Load** `solid` skill to maintain SOLID principles — run tests after each change, if tests fail after a change, revert that change and reconsider.
4. **Delegate** `code-reviewer` subagent and **Load** `code-review-and-quality` skill to review the corrected code. For UI tasks, also verify **Loading** `browser-testing-with-devtools` skill
5. Fix any discrepancies found during review before proceeding and run test after each change.
6. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

If agents are stuck or the corrections process fails, **Delegate** to `debugger` subagent and **Load** `debugging-and-error-recovery` skill to diagnose and fix issues. If the debugger can't resolve the issue, **Delegate** to `error-detective` subagent and **Load** `observability-and-instrumentation` skill to identify the root cause and implement a fix with appropriate subagents.

7. **Stop** when all issues are resolved and the code is ready for deployment.

## Rules

- The rollback plan is mandatory before any GO decision.
- If any persona returns a Critical finding, the default verdict is NO-GO unless the user explicitly accepts the risk.
- **Skip the fan-out only if all of the following are true:** the change touches 2 files or fewer, the diff is under 50 lines, and it does not touch auth, payments, data access, or config/env. Otherwise, default to fan-out. `/ship` is designed for production-bound changes — when the blast radius is non-trivial, run the parallel review even if the diff looks small.
- **Skip `accessibility-tester`** if Phase 0 detects no UI files. Do not spawn accessibility checks for CLI tools, APIs, libraries, or other non-UI projects.

## Suggested Next Step

> Ship evaluation and corrections are complete. if you are not ready to launch, run `/ship` again when ready. Run `/deploy` to deploy the changes to production.
