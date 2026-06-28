---
description: Analyze issues and document technical diagnoses
agent: quetzalcoatl
---

## Pre-Flight: Identify the Target Issue

Determine which issue to diagnose:

1. **Check for a provided issue URL or number** — did the user provide a GitHub/GitLab issue link or ID?
2. **Scan remote repository** — if available, fetch open issues from the project's remote repository
3. **Read local issue references** — check @tasks/, @docs/diagnosis/, or other local references

Output a summary:

```
TARGET IDENTIFIED:
- Issue: [#NNN](url) — Title of the issue
- Repository: [org/repo]
- Symptoms: [brief description from issue]
- Severity: [critical / high / medium / low as reported]
```

If no issue is identified, ask the user to provide one. Do not proceed without a clear target.

## Phase 0: Understand the Issue

If the user's request is vague or missing key details, invoke @skills/interview-me/SKILL.md to extract full context before proceeding.

Use the `question` tool to clarify:

1. What are the exact symptoms or error messages?
2. When did this start? What changed before it started?
3. Is there a specific environment where it occurs?
4. What is the expected behavior vs actual behavior?

## Phase 1: Analyze and Diagnose

1. **Reproduce the issue** — if feasible, attempt to reproduce the problem locally
2. **Execute analysis commands** — use terminal tools to investigate:
   - Check logs, error outputs, stack traces
   - Inspect configuration files
   - Test suspected components
   - Run diagnostic tools
3. **Identify root cause** — determine what is causing the issue, not just where it manifests

## Phase 2: Document the Diagnosis

Create a diagnosis file in `docs/diagnosis/`. Use the template at `docs/diagnosis/diagnosis-template.md`.

**When to create vs. update:**

| Situation | Action |
|-----------|--------|
| New symptom, unknown component | Create `docs/diagnosis/fix01-<short-description>.md` |
| Known symptom, slight variation | Update existing file, add "Recurrences" section |
| Temporary workaround | Document with banner `⚠️ WORKAROUND` |
| Pattern recurring ≥3 times | Suggest automation: script, test, or alert |

**What to include in every diagnosis:**

1. **Summary** — one-line description of the problem
2. **Symptoms** — what the user or system observes
3. **Root cause** — the underlying issue (not just the symptom)
4. **Impact** — what is affected and how severely
5. **Proposed solution** — how to fix it (implementation steps, not code)
6. **References** — link to the remote issue, related files, stack traces

**Restrictions:**
- ❌ Do NOT write to `TECH_DEBT.md` (for intentional architectural decisions, not operational debugging).
- ❌ Do NOT write to `README.md` (saturates quickly).
- ❌ Do NOT write code comments with procedures (comments explain "why", not procedures).
- ❌ Do NOT implement the fix — only document the diagnosis.

## Suggested Next Step

> Diagnosis documented in `docs/diagnosis/`. Run `/plan` to create an execution plan for implementing the fix.

## Rules

1. **Link to the remote issue** — include the URL in the diagnosis file. Do NOT copy the full issue content.
2. **Diagnose only, never implement** — do not write fix code. Only document what needs to change and why.
3. Do NOT write to `tasks/` (exclusive to `/plan`).
4. If the diagnosis reveals an existing fix in progress, update the existing diagnosis instead of creating a new one.
5. Use the `question` tool to confirm the diagnosis with the user before writing the file.
