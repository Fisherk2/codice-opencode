# Diagnosis Directory

This directory contains technical diagnoses for issues, bugs, and problems discovered in the Códice project.

## Purpose

When you investigate a problem, document the diagnosis here. This creates a knowledge base of:
- Root causes and their symptoms
- Solutions that worked (and those that didn't)
- Patterns that recur across different issues
- Context for future maintainers facing similar problems

## When to Create a Diagnosis

| Situation | Action |
|-----------|--------|
| New symptom, component unknown | Create `fix01-<short-description>.md` |
| Known symptom, variation | Update existing file, add "Recurrences" section |
| Temporary workaround | Document with ⚠️ WORKAROUND banner |
| Pattern repeats ≥3 times | Suggest automation (script, test, alert) |

## Naming Convention

Use the format: `fixNN-<short-description>.md`

Examples:
- `fix01-cicd-workflow-standardization.md`
- `fix02-github-wiki-implementation.md`
- `fix03-template-resolution-bunx.md`

## What NOT to Document Here

- ❌ `TECH_DEBT.md` — Intentional architectural decisions, not debugging
- ❌ `README.md` — User-facing documentation, not technical analysis
- ❌ Code comments — Line-level "why", not procedural "how"

## Template

Use `diagnosis-template.md` as a starting point. Required sections:
- Summary
- Symptoms
- Root Cause
- Impact
- Proposed Solution (steps, not code)
- References

## Workflow

1. Run `/diagnosis` command to analyze an issue
2. Create diagnosis file in this directory
3. Commit the diagnosis
4. Run `/plan` to create implementation tasks based on the diagnosis
5. Update the diagnosis file if the fix reveals additional insights

---

_If you investigated a problem, document it here. Future you (and other maintainers) will thank you._
