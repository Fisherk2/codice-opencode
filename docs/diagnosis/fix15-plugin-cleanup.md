# Diagnosis: Plugin Cleanup — Keep Only Destructive Command Restrictions

**Issue:** [#80](https://github.com/Fisherk2/codice-opencode/issues/80) — Limpieza del plugin
**Date:** 2026-08-19
**Severity:** medium
**Status:** diagnosed

---

## Summary

The SDD plugin maintains hardcoded agent lists, command registries, and intent patterns that must be updated every time the template changes. This creates a maintenance burden for contributors and end users. The only unique value the plugin provides is blocking destructive shell commands (e.g., `rm -rf /`, `git push --force`) as a safety net when `opencode.json` permissions are accidentally removed.

## Symptoms

- Every agent/command addition requires plugin updates
- Plugin maintenance is tedious and error-prone
- Contributors must keep plugin in sync with template changes
- Plugin duplicates logic already handled by `opencode.json` permissions

## Root Cause

The SDD plugin was designed before `opencode.json` had robust permission support. Now that OpenCode has mature permission governance, the plugin's agent/command/intent enforcement is redundant. Only the destructive command block provides unique security value.

**Why does this happen?** → The plugin grew organically as a catch-all governance layer. With `opencode.json` now handling permissions, most of its responsibilities are obsolete.

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All (maintenance burden), no functional impact |
| Functionality | Degraded — plugin will lose features, but core security remains |
| Data integrity | Safe — no data operations affected |
| Reproducibility | N/A — refactoring task |

## Environment

- **Platform:** All
- **Version:** v2.1.0+
- **Configuration:** SDD plugin in `template/obligatorio/core/opencode.json`

## Proposed Solution

1. **Identify the destructive command block logic.** Locate the code that intercepts and blocks destructive shell commands.
2. **Remove all other plugin implementations.** Delete agent lists, command registries, intent patterns, and any logic that duplicates `opencode.json` configuration.
3. **Keep only the destructive command restriction.** Ensure this logic is isolated and well-documented.
4. **Update documentation.** Remove references to deleted plugin features from `AGENTS.md`, `CONTRIBUTING.md`, and the plugin's own documentation.
5. **Add a test.** Verify the destructive command block still works after cleanup.

## Workarounds

None — this is a refactoring, not a bug.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-08-19 | #80 | Initial report |

## References

- [Issue #80](https://github.com/Fisherk2/codice-opencode/issues/80)
- SDD plugin source code
- `opencode.json` permission system documentation

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
