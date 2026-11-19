---
description: Suggest fixes for problems and document technical diagnoses.
agent: tezcatlipoca
---

## Pre-Flight: Identify the Problem

**Delegate** `error-coordinator` subagent to detect input type:

- **Remote issue** — user provided a GitHub/GitLab URL or issue number → fetch and summarize
- **Local bug** — user describes symptoms or error messages → use as-is
- **Technical debt** - TD findings in @docs/TECH_DEBT.md are likely related to the problem
- **Vague report** — load `interview-me` skill to extract: symptoms, when it started, expected vs actual behavior.

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

For problems spanning multiple domains, **Delegate** subagents **in parallel** and **Load** skills **on demand**. Synthesize findings before documenting.

| Problem type | Subagent | Skill |
|-------------|----------|-------|
| Error / crash / stack trace | `error-detective` | `debugging-and-error-recovery` |
| Code quality / logic bug | `code-reviewer` | `code-review-and-quality` |
| Security vulnerability | `security-auditor` | `security-and-hardening` |
| Performance issue | `performance-benchmarker` or/and `web-performance-auditor` | `performance-analysis` |
| Database / query problem | `database-optimizer` | `performance-analysis` |
| Dependency issue (CVE, license) | `dependency-manager` | `dependency-audit` |

Use terminal tools to investigate: check logs, inspect config, test components, run diagnostics.

Use `question` tool to ask clarifying questions if needed before proceeding to next phase.

## Phase 2: Document Diagnosis

**Delegate** to `docs-writer` subagent and create diagnosis in `docs/diagnosis/` using @docs/diagnosis/diagnosis-template.md

| Situation | Action |
|-----------|--------|
| New symptom | Create `fix01-<short-description>.md` |
| Known symptom, variation | Update existing file, add "Recurrences" |
| Workaround only | Banner `⚠️ WORKAROUND` |
| Pattern ≥3 times | Suggest automation |

**Required sections:** Summary, Symptoms, Root Cause, Impact, Proposed Solution (steps, no code), file:lines, References.

Invoke `question` tool to confirm the diagnosis or ask for clarification if needed to make changes before proceeding with plan creation.

## Phase 3: Vertical Slice Architecture — Update the implementation roadmap

1. Use the `question` tool to set the VSA plan's scope and its phase budget (recommend scope to user depending diagnosis files generated): 
- **Quickly-ticket** (1 phase): Issues that can be resolved in a single sprint.
- **Medium-ticket** (2-3 phases): Issues that require multiple sprints but can be resolved within a few development cycles. 
- **Long-ticket** (4+ phases): Complex issues that require significant effort and multiple development cycles.

2. **Delegate** `software-architect` subagent and **Load** `vertical-slice-architecture`, `clean-ddd-hexagonal` and `codebase-design` skills to cut the work into vertical slices and order them by risk and dependency.
3. Present a brief summary of the VSA plan for human review before saving.
4. Use the `question` tool to confirm VSA plan with the user before saving to `docs/WORKFLOW.md`
5. If user approves, **Delegate** to `docs-writer` subagent and update `docs/WORKFLOW.md`: one phase per user-visible capability, each with its acceptance test, files touched and demoable outcome.
6. Reject any phase that cannot be demoed on its own, or whose only output is another plan — that is the cascade anti-pattern the skill names.

## Phase 4: Install the project skills (optional)

Use the `question` tool to ask the user if they want to install the skills for this project. if they say no, **skip** this phase.

Once the target is clear, find the skills that raise the quality of this work.

1. **Load** `find-skills` skill and search by the diagnosis purpose and technology stack. If `find-skills` is not installed, use the documented fallback: `npx skills use "https://github.com/vercel-labs/skills" --skill "find-skills"`.
2. Present the candidate skills in a table: **name** · what it covers · why it fits this task.
3. Use the `question` tool to ask the user to choose the skills to install (or skip).
4. Install the chosen skills at project level — **NEVER global**. Project scope keeps the workspace reproducible and leaves the user's machine untouched.

Never invent a skill name: if the search returns nothing, say so and continue without skills.

## Phase 5: Finalize

1. **Diagnosis documentation is complete — do NOT touch or implement code files.**
2. Use the `question` tool to confirm with the user before proceeding.
3. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

## Rules

- **Do NOT** implement fixes — only document diagnosis
- Do NOT write to `tasks/`, task files are managed by command `/plan`
- Do NOT copy full issue content — link to remote issue instead
- If the diagnosis reveals an existing fix in progress, update the existing diagnosis instead of creating a new one
- If `docs/diagnosis/diagnosis-template.md` or `docs/WORKFLOW.md` does not exist, create it first.
- Always follow the rules of the project.
- You can stop and ask the user for clarification if you need more information to complete the diagnosis.
- Use the best available tools for the job.
- Research external resources every time, specially if you are stuck or the diagnosis is complex. 

## Suggested Next Step

> Diagnosis documented in `docs/diagnosis/`. Run `/plan` to create an execution plan for implementing the fix.

---

User context:

