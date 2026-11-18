# Diagnosis: [Short Description]

**Issue:** [#NNN](url) — _Title of the issue_
**Date:** YYYY-MM-DD
**Severity:** [critical / high / medium / low]
**Status:** [diagnosed / in-progress / resolved]
<!-- Delete all HTML comments once the placeholders are filled. -->

---

<!-- Summarize the problem in one paragraph, without the root cause. -->
## Summary

One-paragraph description of the problem.

<!-- List what was observed by users, in logs and in error output. -->
## Symptoms

- What the user observes
- What the system logs show
- Any error messages, stack traces, or screenshots

<!-- Explain the underlying cause, not just where it manifests. -->
## Root Cause

The underlying cause of the issue (not just where it manifests).

> Why does this happen? → _Keep asking until reaching the actual cause._

<!-- Fill one row per affected dimension with the assessed impact. -->
## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | [all / subset / none] |
| Functionality | [broken / degraded / cosmetic] |
| Data integrity | [at risk / safe / unknown] |
| Reproducibility | [always / intermittent / environment-specific] |

<!-- Record the platform, version and configuration where the issue occurs. -->
## Environment

- **Platform:** [OS, browser, device, etc.]
- **Version:** [build number, commit SHA, tag]
- **Configuration:** [relevant config values]

<!-- Describe what must change and why; keep this to steps, not code. -->
## Proposed Solution

Implementation steps (not code — just what needs to change and why):

1. [Step 1]
2. [Step 2]
3. [Step 3]

<!-- Document a temporary workaround only if one exists. -->
## Workarounds

If a temporary workaround exists, document it here with a ⚠️ banner:

> ⚠️ **WORKAROUND**
> Steps to mitigate while the proper fix is being implemented.

<!-- One row per similar past issue; note how this case differs. -->
## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| YYYY-MM-DD | Link | Description |

_If this pattern occurs 3+ times, consider suggesting automation._

<!-- Link the remote issue, relevant code, traces and earlier diagnoses. -->
## References

- [Link to remote issue](url)
- [Related code files](path)
- [Related stack traces](path)
- [Related diagnosis](path)

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
