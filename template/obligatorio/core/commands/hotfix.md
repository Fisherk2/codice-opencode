---
description: Rapid hotfix workflow combining diagnosis, plan, build, test, review and ship for tickets resolvable in under 3 hours.
agent: tlaloc
---

## Pre-Flight: Obtain project context and detect it state

**Delegate** `codebase-onboarding-engineer` subagent and **Load** `codebase-onboarding` skill to understand the project's structure and determine whether it is brownfield or greenfield.

Then, output a summary:

```
PROJECT STATE DETECTED:
- Metadata/dependencies files: [exists / missing]
- Version history: [N releases / tags]
- SPEC.md: [exists with real content / exists but placeholder / missing]
- README.md: [exists with real content / exists but placeholder / missing]
- CHANGELOG.md: [exists with real content / exists but placeholder / missing]
- CONTRIBUTING.md: [exists with real content / exists but placeholder / missing]
- docs/SECURITY.md: [exists with real content / exists but placeholder / missing]
- docs/: [list of docs with real content]
- Recent activity: [summary of last N commits]
- STATUS: [BROWNFIELD / GREENFIELD / EMPTY]
```

If is a empty project (no documentation, no code, just placeholders), **STOP**, and suggest using `/spec` or `/docs-update` instead.

## Phase 1: Identify the Problem, analyze and make diagnosis

**Delegate** `debugger` subagent and **Load** `debugging-and-error-recovery` skill to reproduce the defect and reach its root cause, not its first symptom. If the root cause stays hidden after one pass, escalate with the paragraph below the phases.

1. Reproduce the defect and capture the exact commands, inputs and output.
2. Trace it to the file and line where the wrong behavior originates, not where it surfaces.
3. Measure the blast radius: callers, tests and user-facing paths that depend on the broken behavior.
4. Write `docs/diagnosis/<slug>.md` following `docs/diagnosis/diagnosis-template.md` with real **Summary**, **Symptoms** (including the reproduction steps), **Root Cause**, **Impact** (the affected scope) and **Proposed Solution** (steps, no code), plus `file:line` references.
5. If a fix for this problem is already in progress, **update that file instead of creating a new one** — append the new evidence under **Recurrences**.
6. Use the `question` tool to confirm the diagnosis before planning the fix.

**STOP** if the root cause cannot be stated in one sentence — the fix is not ready to be planned.

## Phase 2: Update WORKFLOW.md and write a structured incremental plan

**Delegate** `moctezuma` subagent and **Load** `planning-and-task-breakdown` alongside `codebase-design` skill.

1. Update `docs/WORKFLOW.md` with the fix scope and its status.
2. Write `tasks/plan.md` and `tasks/todo.md` with per-task acceptance criteria and verification steps, sliced vertically.
3. Present the plan with the `question` tool and wait for explicit approval before executing it.
4. **Load** `vertical-slice-architecture` skill and use the `question` tool to set the scope and its phase budget: **Prototype** (1-3 phases), **MVP** (4-6 phases), **Enterprise** (7+ phases).
5. **Delegate** `software-architect` subagent loading `vertical-slice-architecture` skill to slice the fix vertically and write the phase roadmap into `docs/WORKFLOW.md`.

## Phase 3: Execute the implementation plan

**Delegate** `tlaloc` subagent and **Load** `incremental-implementation` alongside `test-driven-development` skill. Every task from the plan lands as its own verifiable increment.

1. Write the failing test that reproduces the defect first — it must fail for the reason the diagnosis states (RED). Do not touch production code before that test is red.
2. Apply the minimum fix that turns it green (GREEN), **Load** `solid` alongside `clean-code` skill to keep the design intact.
3. Leave no test gap outside the fix: every behavior the diagnosis identified — each symptom, edge case and error path — gets a test in the same increment.
4. Run the test suite after each increment; a red suite stops the loop and sends you back to the diagnosis.
5. Mark the task done in `tasks/todo.md` and record progress in `docs/WORKFLOW.md`, then repeat steps 1-5 for the next task.
6. Make atomic commits for each meaningful change with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow the project's conventions.

## Phase 4: Test and review all code changes

Run the project's quality gates in order and do not continue while any of them is red:

1. `just test` — full suite, 0 failures. A known pre-existing flake is re-run once and reported, never ignored.
2. `bun run tsc --noEmit` — 0 type errors.
3. `just test-e2e` when the change touches the CLI or the template; state why it was skipped otherwise.
4. The project's linter and formatter check (`biome ci src/ tests/` or equivalent) — 0 errors.

Then **Delegate** `code-reviewer` subagent and **Load** `code-review-and-quality` skill to review the hotfix diff only, with `file:line` references.

5. Correct every observation before continuing — Critical, Important and Suggestion. A dismissed observation needs the user's explicit decision via the `question` tool.
6. Re-run the gates after the last correction: a review fix is a code change like any other.
7. Record the final gate numbers in the diagnosis file so the ticket shows what was actually verified.

## Phase 5: Validate all changes for deployment

Decide with evidence, not optimism. This phase produces a verdict only — **it does not deploy**; deployment belongs to `/deploy`.

Check every criterion:

| Criterion | Required |
|-----------|----------|
| `just test` | 0 failures |
| `bun run tsc --noEmit` | 0 errors |
| Linter and formatter check | 0 errors |
| Code review observations | all closed, or explicitly accepted by the user |
| Files changed | only those the diagnosis scoped — no unrelated files |
| Diagnosis | `docs/diagnosis/<slug>.md` updated with the fix and the gate numbers |
| Rollback path | known and written down: how to revert the fix if it misbehaves |

Output the verdict:

```markdown
## Hotfix Decision: GO | NOT-GO

### Evidence
- Gates: [commands and final numbers]
- Review: [observations open / closed]
- Scope: [files changed vs files scoped]
- Rollback: [how to revert]

### Blockers (NOT-GO only)
- [Criterion that failed and why]

### Verdict
GO — ready for `/deploy`. | NOT-GO — [reason]
```

Any failing criterion defaults to **NOT-GO**. Report the verdict to the user and ask for confirmation before handing off to `/deploy`.

## Phase 6: Close the ticket and update the documentation

1. Close the ticket referencing `docs/diagnosis/<slug>.md` and the verification numbers recorded there.
2. Update the documentation the fix invalidated — `README.md`, the affected API docs and `CHANGELOG.md` under the unreleased section.
3. Mark every task done in `tasks/todo.md` and record the closure status in `docs/WORKFLOW.md`.
4. Confirm the `## Suggested Next Step` at the end of this command still points to `/deploy`.

## Rules

- If the diagnosis reveals an existing fix in progress, update the existing diagnosis instead of creating a new one
- If `docs/diagnosis/diagnosis-template.md`, `task/` or `docs/WORKFLOW.md` does not exist, create it first.
- Always follow the rules of the project.
- You can stop and ask the user for clarification if you need more information to complete the ticket.
- Use the best available tools for the job.
- Research external resources every time, specially if you are stuck or the hotfix is failing.
- If `CODE_STYLE.md` does not exist, use the best practices and conventions of the project and write it in `docs/CODE_STYLE.md`.

**Important**: If you/subagents get stuck or the hotfix fails, **STOP** and **Delegate** to `debugger` subagent and **Load** `debugging-and-error-recovery` skill to diagnose and fix issues. If the debugger can't resolve the issue, **Delegate** to `error-detective` subagent and **Load** `observability-and-instrumentation` skill to identify the root cause and implement a fix with appropriate subagents, always report to the user what is the issue and what you have to do to fix it, ask user for confirmation before proceeding with `question` tool.

## Suggested Next Step

> Hotfix completed, ticket closed are documented in `docs/diagnosis/`. Run `/deploy` to deploy the hotfix.

---

User instructions:

