---
description: Analyze problems and document technical diagnoses
agent: quetzalcoatl
---

## Pre-Flight: Identify the Problem

Detect input type:

- **Remote issue** — user provided a GitHub/GitLab URL or issue number → fetch and summarize
- **Local bug** — user describes symptoms or error messages → use as-is
- **Vague report** — load `interview-me` skill to extract: symptoms, when it started, expected vs actual behavior.

**Also check for `docs/TECH_DEBT.md` (if it exists):**

If `docs/TECH_DEBT.md` exists, read it and consider its findings as additional context:

- Critical/High findings in TECH_DEBT are likely related to the problem
- Reference specific TECH_DEBT entries (e.g., TD-001) in the diagnosis document
- Use TECH_DEBT findings to inform the severity assessment

**Always use the `question` tool to let the user confirm what problem they want to analyze — never decide automatically, even if the issue or symptoms seem clear or trivial.** The user must answer doubts, suggestions, and ambiguities before proceeding.

Output summary:

```
TARGET: [issue #NNN | local bug | error report]
Symptoms: [brief description]
Severity: [critical / high / medium / low]
```

Do not proceed without a clear target.

## Phase 1: Analyze

**Delegate** to analysis subagents based on problem type. **No implementation — analysis only.**

| Problem type | Subagent | Skill |
|-------------|----------|-------|
| Error / crash / stack trace | `error-detective` | `debugging-and-error-recovery` |
| Code quality / logic bug | `code-reviewer` | `code-review-and-quality` |
| Security vulnerability | `security-auditor` | `security-and-hardening` |
| Performance issue | `web-performance-auditor` | `performance-analysis` |
| Database / query problem | `database-optimizer` | — |
| Dependency issue (CVE, license) | — | `dependency-audit` |

For problems spanning multiple domains, invoke subagents **sequentially** and load skills **on demand**. Synthesize findings before documenting.

Use terminal tools to investigate: check logs, inspect config, test components, run diagnostics.

Invoke `question-tool` to ask clarifying questions if needed before proceeding to Phase 2.

## Phase 2: Document

Create diagnosis in `docs/diagnosis/` using @docs/diagnosis/diagnosis-template.md

| Situation | Action |
|-----------|--------|
| New symptom | Create `fix01-<short-description>.md` |
| Known symptom, variation | Update existing file, add "Recurrences" |
| Workaround only | Banner `⚠️ WORKAROUND` |
| Pattern ≥3 times | Suggest automation |

**Required sections:** Summary, Symptoms, Root Cause, Impact, Proposed Solution (steps, no code), References.

**Restrictions:**
- ❌ Do NOT implement fixes — only document diagnosis
- ❌ Do NOT write to `tasks/`, task files are managed by command `/plan`
- ❌ Do NOT copy full issue content — link to remote issue instead
- If the diagnosis reveals an existing fix in progress, update the existing diagnosis instead of creating a new one

Invoke `question-tool` to confirm the diagnosis or ask for clarification if needed to make changes before proceeding with plan creation.

Finally, commit atomic changes with a descriptive message following @skills/git-workflow-and-versioning/SKILL.md conventions.

## Suggested Next Step

> Diagnosis documented in `docs/diagnosis/`. Run `/plan` to create an execution plan for implementing the fix.
