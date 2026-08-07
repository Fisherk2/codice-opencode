# Diagnosis: [Short Description]

**Issue:** [#NNN](url) — _Title of the issue_
**Date:** YYYY-MM-DD
**Severity:** [critical / high / medium / low]
**Status:** [diagnosed / in-progress / resolved]

---

## Summary

One-paragraph description of the problem.

## Symptoms

- What the user observes
- What the system logs show
- Any error messages, stack traces, or screenshots

## Root Cause

The underlying cause of the issue (not just where it manifests).

> Why does this happen? → _Keep asking until reaching the actual cause._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | [all / subset / none] |
| Functionality | [broken / degraded / cosmetic] |
| Data integrity | [at risk / safe / unknown] |
| Reproducibility | [always / intermittent / environment-specific] |

## Environment

- **Platform:** [OS, browser, device, etc.]
- **Version:** [build number, commit SHA, tag]
- **Configuration:** [relevant config values]

## Proposed Solution

Implementation steps (not code — just what needs to change and why):

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Workarounds

If a temporary workaround exists, document it here with a ⚠️ banner:

> ⚠️ **WORKAROUND**
> Steps to mitigate while the proper fix is being implemented.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| YYYY-MM-DD | Link | Description |

_If this pattern occurs 3+ times, consider suggesting automation._

## References

- [Link to remote issue](url)
- [Related code files](path)
- [Related stack traces](path)
- [Related diagnosis](path)

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
