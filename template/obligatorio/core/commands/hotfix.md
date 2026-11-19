---
description: Quick hotfix one phase workflow for tickets resolvable in under 3 hours.
agent: huitzilopochtli
---
## Pre-Flight: Detect project state and scope

**Delegate** `codebase-onboarding-engineer` subagent; **load** `codebase-onboarding` skill. Hints: all project docs, especially @SPEC.md, @docs/WORKFLOW.md. Classify if the project is BROWNFIELD / GREENFIELD / EMPTY.

```
PROJECT STATE DETECTED:
- Metadata, deps, tags, docs (SPEC/README/CHANGELOG/CONTRIBUTING/SECURITY): [real / placeholder / missing]
- Quality infra + test dirs: [present / missing]
- UI detected: [yes / no]
- STATUS: [BROWNFIELD / GREENFIELD / EMPTY]
```

## Phase 1 — Diagnosis

1. **Delegate** analysis subagents by problem type. No implementation — **analysis only**. For multi-domain problems, **delegate** in parallel and **load** skills on demand; synthesize before documenting. Use terminal tools: logs, configs, components, diagnostics.

| Problem type | Subagent | Skill |
|---|---|---|
| Error / crash / stack trace | `error-detective` | `debugging-and-error-recovery` |
| Code quality / logic bug | `code-reviewer` | `code-review-and-quality` |
| Security vulnerability | `security-auditor` | `security-and-hardening` |
| Performance issue | `performance-benchmarker` or/and `web-performance-auditor` | `performance-analysis` |
| Database / query problem | `database-optimizer` | `performance-analysis` |
| Dependency issue (CVE, license) | `dependency-manager` | `dependency-audit` |

Confirm target, symptoms, severity and scope before continuing; if the fix needs ≥2 development phases to complete, **STOP** and hand off to `/diagnosis` instead.

2. **Delegate** `docs-writer` subagent to create the diagnosis in `docs/diagnosis/` using @docs/diagnosis/diagnosis-template.md.
| Situation | Action |
|---|---|
| New symptom | Create `fix01-<short-description>.md` |
| Known symptom, variation | Update existing file, add "Recurrences" |
| Workaround only | Banner `⚠️ WORKAROUND` |
| Pattern ≥3 times | Suggest automation |
Required sections: Summary, Symptoms, Root Cause, Impact, Proposed Solution (steps, no code), file:lines, References. If project skills are missing, defer installation to /diagnosis — project level only, never global, never invent names.

Use the `question` tool at every suggestion/decision point; never decide automatically, even for trivial inputs.

## Phase 2 — Planning

1. **Delegate** `software-architect` subagent; **load** `vertical-slice-architecture`, `clean-ddd-hexagonal`, `codebase-design` skills once.
- Cut into vertical slices ordered by risk and dependency; **plan exactly one phase**.
- One phase = one user-visible, demoable capability with acceptance test, touched files and outcome.
- Reject any phase that cannot be demoed or whose only output is another plan (cascade anti-pattern).
- Confirm with `question` tool before saving to `docs/WORKFLOW.md`.

2. **Delegate** `docs-writer` subagent to update `docs/WORKFLOW.md` with that single phase.

3. **Delegate** `multi-agent-systems-architect` subagent; **load** `planning-and-task-breakdown` skill (reuse loaded `codebase-design`, `clean-ddd-hexagonal` skills).
4. Read the new `docs/WORKFLOW.md` phase; gather every referenced file, doc and code section.
5. Enter plan mode — **read only**, no code changes. Map the component dependency graph; slice vertically (one complete path per task, not horizontal layers).
6. **Delegate** `docs-writer` subagent to write tasks. **Load** `design-patterns` skill for GoF/enterprise choices; **load** `architecture-diagrams` + `markdown-mermaid-writing` skills for component diagrams.
7. Each task: acceptance criteria, verification steps and deterministic instructions.
8. For each task, assign in a table `subagents | criteria | skills | tools | resources | conventions`:
   - Subagents: assign **ONLY subagents**, NOT main agents; parallel or sequential — if sequential, state the order.
   - Skills: scan available skills, assign the most appropriate per task, possibly none.
   - Tools: scan MCPs/plugins configured in the workspace; assign as needed, possibly none.
   - Resources: establish external references to consult per task, possibly none.

9. Add checkpoints between phases in `tasks/plan.md` and `tasks/todo.md` — quality gates that must pass before the next phase.

## Phase 3 — Implementation

Pick the next pending `tasks/`. For each task: read acceptance criteria, research relevant context (code, patterns, types), map dependencies and constraints; clarify with `question` tool to the user if needed.

**Load** `incremental-implementation`, `test-driven-development`, `source-driven-development`, `solid`, `clean-code` skills once.

1. **Delegate** to the assigned subagent with this contract:
   - Deterministic: task description + acceptance criteria + verification steps.
   - Skills: the skills assigned for task number.
   - Tools: the tools/MCPs assigned for task number.
   - Resources: the resources established for task number.
   - Conventions: `AGENTS.md`, @docs/CODE_STYLE.md or equivalent.
2. Write a failing test for the expected behaviour (RED).
3. Implement the minimum code to pass the test (GREEN).
4. Run the full test suite for regressions; mark complete; repeat for every pending task.
5. Commit atomically per meaningful change.

## Phase 4 — Testing

1. **Delegate** `test-engineer` subagent to scan the scoped hotfix phase for coverage gaps; run `git diff` against the integration branch, cross-reference existing tests, count source/test/doc files and estimate LOC.
Classify each gap in a table by category (Feature / Bug Fix) and pyramid level (Unit / Integration / E2E).
| Category | Pyramid level | Gap |
|---|---|---|

2. Confirm scope with `question` tool to the user.

3. **Load** `test-driven-development` skill. Write tests per the Feature/Bug classification:
- New features — **delegate** `test-engineer` subagent; tests describe expected behaviour and must FAIL; implement to pass; refactor (**Load** `refactoring-patterns` skill) with tests green.
- Bug fixes (Prove-It) — **delegate** `chaos-engineer` reproducer must FAIL; confirm failure; **Load** `debugger` (or `error-detective`) skill, fixes it; confirm pass; run full suite.

**Load** these skills on subagents as needed, per demand: `error-handling-patterns`, `refactoring-patterns`, `debugging-and-error-recovery`, `performance-analysis`, `security-and-hardening`, `design-taste-frontend`, `browser-testing-with-devtools`.

4. Run ALL quality checks:
- Full test suite — 0 failures.
- Linter — 0 errors (report warnings).
- Formatter CHECK — 0 unformatted files.
- Typechecker — 0 type errors.

If ANY check fails, revert and reconsider.

Corrector: fix each discrepancy, re-run the test after each change, revert any change that fails. Commit atomically per meaningful change.

## Phase 5 — Checks and Corrections

**Load** `shipping-and-launch` skill once. **Skip** fan-out only if ≤2 files, <50 lines, no auth/payments/data/config; otherwise fan out.

1. Fan out in a SINGLE assistant turn so reviewers run in parallel:
- `code-reviewer` — five-axis review (correctness, readability, architecture, security, performance); standard template.
- `security-auditor` — OWASP Top 10, secrets, auth/authz; standard audit report.
- `test-engineer` — coverage gaps; reuse the Phase 4 analysis instead of re-running.
- `dependency-manager` — CVEs, outdated packages, licenses, unused deps; prioritized list.
- `accessibility-tester` — WCAG 2.1 AA/AAA, keyboard, screen readers; **ONLY if UI detected** in Pre-Flight.
Without an Agent tool, invoke each persona sequentially in its own context; the merge still works.

2. Main agent (not a sub-persona) merges reports:
- Code Quality + Security — Critical/Important findings, failing tests/lint/build; promote Critical/High security to blockers; dedupe.
- Dependencies + Performance — CVEs/licenses → blockers; Core Web Vitals from code-reviewer.
- Accessibility + Infrastructure — Critical WCAG → blockers; env vars, migrations, monitoring, feature flags.
- Documentation — README, ADRs, changelog, project documentation in general.

Output: Ship Decision: GO | NO-GO
- Blockers (must fix): [Source: Critical + file:line]
- Recommended fixes: [Source: Important + file:line]
- Acknowledged risks: [Risk + mitigation]
- Rollback plan (mandatory before GO): triggers / exact procedure / recovery time objective
- Specialist reports (full): [code-reviewer | security-auditor | test-engineer | dependency-manager | accessibility-tester (if UI)]

A Critical finding defaults to NO-GO unless the user explicitly accepts it; confirm with `question` tool to user.
3. Apply observations, **Delegate** `minimal-change-engineer` subagent and **Load** `incremental-implementation` + `solid` skills.
Corrector: fix, test after each change, revert failures; commit atomically.

## Phase 6 — Close ticket and update docs

1. Close the ticket referencing `docs/diagnosis/<slug>.md` and the verification numbers recorded there.
2. Update affected project docs and mark this hotfix complete in `docs/WORKFLOW.md`.
3. Add an entry to `CHANGELOG.md` under the unreleased section and record all changes since the last release.
4. **STOP** when all issues are resolved and the code is ready for deployment.

## Rules

- Always follow project rules; use the best available tools and research external resources, especially when stuck.
- If `docs/diagnosis/diagnosis-template.md`, `tasks/` or `docs/WORKFLOW.md` is missing, create it first.
- If a diagnosis already exists for the symptom, update it instead of creating a new one.
- Do not modify `CODE_STYLE.md` if it exists; create `docs/CODE_STYLE.md` with project conventions if missing.
- Load each skill once at first use; reuse it afterwards. Never invent skill names.
- Commit atomically per meaningful change with a descriptive message; **load** `git-workflow-and-versioning` skill once.
- Rollback plan is mandatory before any GO; a Critical finding means NO-GO unless explicitly accepted for user.
- Confirm with every time with `question` tool; never decide automatically. **Do not deploy** to production.

## Escalation

If stuck or a check fails: **Delegate** `debugger` subagent and **load** `debugging-and-error-recovery` skill; if unresolved: **Delegate** `error-detective` subagent and **load** `observability-and-instrumentation`. On a production incident (users affected, service degradation): **Delegate** `error-coordinator` and **load** `incident-response` for triage, communication and postmortem.
Report the issue and the planned fix to the user; confirm with `question` tool.

## Suggested Next Step

> Hotfix completed, ticket closed and documented in `docs/diagnosis/`. Run /deploy to launch the hotfix.

---

User context:

