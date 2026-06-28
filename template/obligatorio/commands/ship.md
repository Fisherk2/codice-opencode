---
description: Run the pre-launch checklist via parallel fan-out to specialist personas, then synthesize a go/no-go decision
agent: mictlantecuhtli
---

Invoke @skills/shipping-and-launch/SKILL.md.

`/ship` is a **fan-out orchestrator**. It runs specialist personas in parallel against the current change, then merges their reports into a single go/no-go decision with a rollback plan. The personas operate independently — no shared state, no ordering — which is what makes parallel execution safe and useful here.

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

This avoids wasting tokens on accessibility audits for CLI tools, APIs, libraries, and other non-UI projects.

## Phase A — Parallel fan-out

Spawn subagents concurrently using the Agent tool. **Issue all Agent tool calls in a single assistant turn so they execute in parallel** — sequential calls defeat the purpose of this command.

In OpenCode, each call passes `subagent_type` matching the persona's `name` field:

1. **`code-reviewer`** — Run a five-axis review (correctness, readability, architecture, security, performance) on the staged changes or recent commits. Output the standard review template.
2. **`security-auditor`** — Run a vulnerability and threat-model pass. Check OWASP Top 10, secrets handling, auth/authz. Output the standard audit report.
3. **`test-engineer`** — Analyze test coverage for the change. Identify gaps in happy path, edge cases, error paths, and concurrency scenarios. Output the standard coverage analysis.
4. **`dependency-manager`** — Audit dependencies for CVEs, outdated packages, license issues, and unused deps. Output a prioritized remediation list.
5. **`accessibility-tester`** *(only if UI detected in Phase 0)* — Audit UI components for WCAG 2.1 AA/AAA compliance, keyboard navigation, screen reader support, and inclusive design. Output the standard accessibility report.

In other harnesses without an Agent tool, invoke each persona's system prompt sequentially and treat their outputs as if returned in parallel — the merge phase still works.

Constraints (from OpenCode's subagent model):
- Subagents cannot spawn other subagents — do not let one persona delegate to another.
- Each subagent gets its own context window and returns only its report to this main session.
- If you need teammates that talk to each other instead of just reporting back, use Claude Code Agent Teams and reference these personas as teammate types (see @docs/opencode/02-orchestration-patterns.md).

**Persona resolution.** If you've defined your own `code-reviewer`, `security-auditor`, `test-engineer`, `dependency-manager`, or `accessibility-tester` in `.opencode/agents/` or `~/.opencode/agents/`, those take precedence over this plugin's versions — `/ship` picks up your customizations automatically. This is intentional: plugin subagents sit at the bottom of Open Code's scope priority table, so user-level definitions win by design.

## Phase B — Merge in main context

Once all reports are back, the main agent (not a sub-persona) synthesizes them:

1. **Code Quality** — Aggregate Critical/Important findings from `code-reviewer` and any failing tests, lint, or build output. Resolve duplicates between reviewers.
2. **Security** — Promote any Critical/High `security-auditor` findings to launch blockers. Cross-reference with `code-reviewer`'s security axis.
3. **Dependencies** — Promote any Critical/High `dependency-manager` findings (CVEs, outdated packages) to launch blockers. Flag license compliance issues.
4. **Performance** — Pull from `code-reviewer`'s performance axis; cross-check Core Web Vitals if applicable.
5. **Accessibility** *(only if `accessibility-tester` was spawned)* — Aggregate findings. Promote Critical WCAG violations to launch blockers.
6. **Infrastructure** — Env vars, migrations, monitoring, feature flags. Use @skills/observability-and-instrumentation/SKILL.md for logging, metrics, tracing, and alerting. Use @skills/bash-defensive-patterns/SKILL.md for robust CI/CD deployment scripts.
7. **Documentation** — README, ADRs, changelog. Use @skills/crafting-effective-readmes/SKILL.md for README, @skills/architecture-diagrams/SKILL.md for architecture diagrams, and @skills/changelog-generate/SKILL.md for changelog updates.

## Phase C — Decision and rollback

Produce a single output:

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

## Rules

1. The Phase A personas run in parallel — never sequentially.
2. Personas do not call each other. The main agent merges in Phase B.
3. The rollback plan is mandatory before any GO decision.
4. If any persona returns a Critical finding, the default verdict is NO-GO unless the user explicitly accepts the risk.
5. **Skip the fan-out only if all of the following are true:** the change touches 2 files or fewer, the diff is under 50 lines, and it does not touch auth, payments, data access, or config/env. Otherwise, default to fan-out. `/ship` is designed for production-bound changes — when the blast radius is non-trivial, run the parallel review even if the diff looks small.
6. **Skip `accessibility-tester`** if Phase 0 detects no UI files. Do not spawn accessibility checks for CLI tools, APIs, libraries, or other non-UI projects.
7. After launch, if an incident occurs, follow @skills/incident-response/SKILL.md for triage, communication, and blameless postmortems.

## Suggested Next Step

> Ship evaluation complete. Run `/docs-update`, `/diagnosis`, or `/evolve` for maintenance. If you are not ready to launch, run `/ship` again when ready.