---
description: Rapid hotfix one phase workflow for tickets resolvable in under 3 hours.
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

## Phase 1: Identify the Problem, analyze and make diagnosis

1. **Delegate** to analysis subagents based on problem type. **No implementation — analysis only.**

For problems spanning multiple domains, **Delegate** subagents **in parallel** and **Load** skills **on demand**. Synthesize findings before documenting.

| Problem type | Subagent | Skill |
|-------------|----------|-------|
| Error / crash / stack trace | `error-detective` | `debugging-and-error-recovery` |
| Code quality / logic bug | `code-reviewer` | `code-review-and-quality` |
| Security vulnerability | `security-auditor` | `security-and-hardening` |
| Performance issue | `performance-benchmarker` or/and `web-performance-auditor` | `performance-analysis` |
| Database / query problem | `database-optimizer` | `performance-analysis` |
| Dependency issue (CVE, license) | `dependency-manager` | `dependency-audit` |

2. Use terminal tools to investigate: check logs, inspect config, test components, run diagnostics.
3. Analyze all the information gathered, if this diagnosis is better to be solved in 2 or more phases, use the `question` tool, the user may choose continue or not. if the user chooses to continue, **proceed to the next step**, else **STOP** and generate a output with a summary of the diagnosis, then recommend the user to use `/diagnosis` instead with the information gathered.
4. Use `question` tool to ask clarifying questions if needed before proceeding to document the diagnosis.

5. **Delegate** to `docs-writer` subagent and create diagnosis in `docs/diagnosis/` using @docs/diagnosis/diagnosis-template.md

| Situation | Action |
|-----------|--------|
| New symptom | Create `fix01-<short-description>.md` |
| Known symptom, variation | Update existing file, add "Recurrences" |
| Workaround only | Banner `⚠️ WORKAROUND` |
| Pattern ≥3 times | Suggest automation |

**Required sections:** Summary, Symptoms, Root Cause, Impact, Proposed Solution (steps, no code), file:lines, References.

5. Invoke `question` tool to confirm the diagnosis or ask for clarification if needed to make changes before proceeding with plan creation.

## Phase 3: Update the implementation roadmap and write a structured incremental planning

1. **Delegate** `software-architect` subagent and **Load** `vertical-slice-architecture`, `clean-ddd-hexagonal` and `codebase-design` skills to cut the work into vertical slices and order them by risk and dependency, **plan only and exclusively one phase**, it means, the next phase stablished in the roadmap.
2. Present a brief summary of the VSA plan for human review before saving.
3. Use the `question` tool to confirm VSA plan with the user before saving to `docs/WORKFLOW.md`
4. If user approves, **Delegate** to `docs-writer` subagent and update `docs/WORKFLOW.md`: one phase per user-visible capability, each with its acceptance test, files touched and demoable outcome. Reject any phase that cannot be demoed on its own, or whose only output is another plan — that is the cascade anti-pattern the skill names.
5. **Delegate** `multi-agent-systems-architect` and **Load** `planning-and-task-breakdown` along side `codebase-design` skill, read new phase generated in `docs/WORKFLOW.md` and recopilate all references files, documentation and code of that new phase.

- Enter plan mode — read only, no code changes
- Identify the dependency graph between components. If the project uses DDD or Clean Architecture, **Load** `clean-ddd-hexagonal` skill for domain-driven module decomposition
- Slice work vertically (one complete path per task, not horizontal layers)

6. **Delegate** to `docs-writer` subagent and write tasks with acceptance criteria and verification steps. **Load** `design-patterns` skill when planning which GoF or enterprise patterns to apply in each task. **Load** `architecture-diagrams` alongside `markdown-mermaid-writing` skill to draw diagrams and components.

- Suggest what subagents should invoke the main agent to complete each task, analyze and asign the most appropriate subagents and write them to `tasks/` files, can be multiple subagents per task (parallel/sequential) or none, you must explain what tasks should be delegate in parallel or sequentially (only if it's multiple subagents per task) and if it's a sequential delegation, you must explain the order of the subagents delegation. You should use **ONLY** subagents, **NOT** main agents, the available subagents are:

!`for d in agents .opencode/agents; do [ -d "$d" ] || continue; for f in "$d"/*.md; do [ -f "$f" ] || continue; printf '%s :: %.90s\n' "$(basename "$f" .md)" "$(sed -n '/^---$/,/^---$/p' "$f" | grep -m1 '^description: ' | sed 's/^description: //; s/^"//; s/"$//')"; done; done`

- Suggest what skills should load the subagents (or main builder if applicable) to complete each task, analyze and asign the most appropriate skills and write them to `tasks/` files, can be multiple skills per task or none.
- Detect and scan MCPs/Plugins configured in this workspace, and suggest what tools should use the subagents (or main agent if applicable) to complete each task, analyze and asign the most appropriate MCPs/Plugins and write them to `tasks/` files, can be multiple MCPs/Plugins per task or none.
- Establish external resources to consult for each task, analyze and asign the most appropriate external resources and write them to `tasks/` files, can be multiple resources to research per task or none.

7. The asignment of subagents, skills, tools and external resources to each task should be in a table format.
8. Add checkpoints between phases within `tasks/plan.md` and `tasks/todo.md` — quality gates that must pass before moving to the next phase
9. Present a brief summary of the plan for human review before saving.

## Phase 3: Execute the implementation plan

Pick the next pending `tasks/` from the plan. For each task:

1. Read the task's acceptance criteria
2. Load relevant context (existing code, patterns, types)
3. Understand the task's dependencies and constraints
4. Use `question` tool to ask for clarification if needed

**Load** `incremental-implementation` skill alongside `test-driven-development` skill. Then **Load** `source-driven-development` skill to ground all implementation.

5. **Delegate** to asigned subagents to implement the task with: task description, acceptance criteria, skills to load, tools to use, resources to consult, and project conventions (`AGENTS.md`, @docs/CODE_STYLE.md or similar documentation).
6. Subagents **should** write a failing test for the expected behavior (RED). **Load** `solid` skill for SOLID principles and clean test design
7. Subagents **should** implement the minimum code to pass the test (GREEN), **Always load** `clean-code` skill to follow clean code practices.
8. Run the full test suite to check for regressions.
9. Mark the task complete, then proceed to the next task and **repeat steps 5-9** until all tasks are complete.
10. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

## Phase 4: Test and review all code changes

**Delegate** `test-engineer` subagent and scan scoped hotfix phase to identify missing test coverage.

1. Output a summary of the files, commits, and/or changes to be tested.
2. Classify each gap by **category** (Feature / Bug Fix) and **pyramid level** (Unit / Integration / E2E) in a table.
3. Use the `question` tool to present the report and confirm which tests to implement.

**Load** `test-driven-development` skill and work on `test/` directories to follow the TDD process.

Write depending of phase 1 report:

**For new features:**

- **Delegate**  `test-engineer` subagent and **Load** `error-handling-patterns` skill to write tests that describe expected behavior (must FAIL).
- Implement code to make them pass
- **Load** `refactoring-patterns` skill to refactor while keeping tests green.

**For bug fixes (Prove-It pattern):**

- **Delegate** `chaos-engineer` subagent and write test that reproduces the bug (must FAIL). **Load** `debugging-and-error-recovery` skill if hard to reproduce.
- Confirm test fails
- **Delegate** `debugger` subagent to analyze and implement fix, if is hard to debug **Delegate** `error-detective` subagent.
- Confirm test passes
- Run full test suite for regressions

4. Run ALL quality checks:

- Run full test suite — must ALL pass (0 failures)
- Run linter — must have 0 errors (warnings OK but report them)
- Run formatter CHECK mode — must have 0 unformatted files
- Run typechecker — must have 0 type errors

**If ANY check fails, revert and reconsider:**

5. Fix any discrepancies found during testing before proceeding, and run the test after each change.
6. If agents are stuck or the testing process fails, **Delegate** to `debugger` subagent and **Load** `debugging-and-error-recovery` skill to diagnose and fix issues. If the debugger can't resolve the issue, **Delegate** to `error-detective` subagent and **Load** `observability-and-instrumentation` skill to identify the root cause and implement a fix with appropriate subagents.
7. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

### Escalation to Incident Response

If debugging detects a **production incident** (e.g., users affected, service degradation), escalate to:
- **Delegate** to `error-coordinator` subagent and **Load** `incident-response` skill — Incident triage, communication, and postmortem workflow 

## Phase 5: Validate all changes for deployment

1. **Load** `shipping-and-launch` skill and spawn subagents concurrently using the Agent tool. **Issue all Agent tool calls in a single assistant turn so they execute in parallel** — sequential calls defeat the purpose of this command:

- **`code-reviewer`** — Run a five-axis review (correctness, readability, architecture, security, performance) on the staged changes or recent commits. Output the standard review template.
- **`security-auditor`** — Run a vulnerability and threat-model pass. Check OWASP Top 10, secrets handling, auth/authz. Output the standard audit report.
- **`test-engineer`** — Analyze test coverage for the change. Identify gaps in happy path, edge cases, error paths, and concurrency scenarios. Output the standard coverage analysis.
- **`dependency-manager`** — Audit dependencies for CVEs, outdated packages, license issues, and unused deps. Output a prioritized remediation list.
- **`accessibility-tester`** *(only if UI detected in Phase 0)* — Audit UI components for WCAG 2.1 AA/AAA compliance, keyboard navigation, screen reader support, and inclusive design. Output the standard accessibility report.

2. Once all reports are back, the main agent (not a sub-persona) synthesizes them:

- **Code Quality** — Aggregate Critical/Important findings from `code-reviewer` and any failing tests, lint, or build output. Resolve duplicates between reviewers.
- **Security** — Promote any Critical/High `security-auditor` findings to launch blockers. Cross-reference with `code-reviewer`'s security axis.
- **Dependencies** — Promote any Critical/High `dependency-manager` findings (CVEs, outdated packages) to launch blockers. Flag license compliance issues.
- **Performance** — Pull from `code-reviewer`'s performance axis; cross-check Core Web Vitals if applicable.
- **Accessibility** *(only if `accessibility-tester` was spawned)* — Aggregate findings. Promote Critical WCAG violations to launch blockers.
- **Infrastructure** — Env vars, migrations, monitoring, feature flags. **Load** `observability-and-instrumentation` skill for logging, metrics, tracing, and alerting. **Load** `bash-defensive-patterns` for robust CI/CD deployment scripts.
- **Documentation** — README, ADRs, changelog. **Load** `crafting-effective-readmes` skill for README, `architecture-diagrams` skill for architecture diagrams, and `changelog-generate` skill for changelog updates.

3. Before make output review, use the `question` tool to resolve ambiguities:
- Flag findings that could be **false positives** — ask the user to confirm
- Ask if any observation is **intentional** — the user may have a valid reason
- Let the user dismiss, accept, or modify each disputed finding

4. Use the `question` tool to ask the user to confirm the reports before proceeding with fixes.
5. If user confirms, **Delegate** `minimal-change-engineer` subagent and **Load** `incremental-implementation` skill to apply all observations incrementally, **Load** `solid` skill to maintain SOLID principles.
6. Run tests after each change, if tests fail after a change, revert that change and reconsider.
7. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

## Phase 6: Close the ticket and update the documentation

1. Close the ticket referencing `docs/diagnosis/<slug>.md` and the verification numbers recorded there.
2. Update the project documentation and stablish this hotfix phase are completed — ADRs, the affected API docs, related documents.
3. Add new entry to `CHANGELOG.md` under the unreleased section.
4. Record the closure status in `docs/WORKFLOW.md`.
5. **Stop** when all issues are resolved and the code is ready for deployment.

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

User context:

