# Diagnosis: External Directory Permissions Governance

**Issue:** [#81](https://github.com/Fisherk2/codice-opencode/issues/81) — Permisos sobre directorios externos
**Date:** 2026-08-19
**Severity:** medium
**Status:** diagnosed

---

## Summary

Agents occasionally attempt to read/write external directories (outside the workspace). The current `opencode.json` template does not define external directory permissions, leaving the behavior to OpenCode defaults. The proposal is to deny all external directories by default and explicitly allow only safe, well-known paths.

## Symptoms

- Agents attempt to access directories like `/tmp/`, `~/.agents/`, `~/.bun/`, `~/.cargo/`, `~/go/`
- No explicit governance in `opencode.json` — behavior depends on OpenCode defaults
- Potential security risk if agents access sensitive external directories

## Root Cause

The `opencode.json` template installed by Códice does not include an `external_directory` permission block. OpenCode's default behavior for external directories is not explicitly documented, leaving a governance gap.

**Why does this happen?** → The template was designed before OpenCode added external directory permission support. Now that the feature exists, the template should define explicit rules.

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All users — agents may access unintended directories |
| Functionality | Degraded — no governance over external directory access |
| Data integrity | At risk — agents could write to sensitive locations |
| Reproducibility | Intermittent — depends on agent behavior |

## Environment

- **Platform:** All
- **Version:** v2.1.0+
- **Configuration:** `template/obligatorio/core/opencode.json`

## Proposed Solution

1. **Add `external_directory` permission block** to `template/obligatorio/core/opencode.json`:
   - Default: `"*": "deny"` (deny all external directories)
   - Allow list: `/tmp/opencode/*`, `~/.agents/*`, `~/.bun/*`, `~/.cargo/*`, `~/go/*`
2. **Document the permission model** in `AGENTS.md` and the GitHub Wiki.
3. **Add a test** to verify the permission block is present in the installed `opencode.json`.

## Workarounds

> ⚠️ **WORKAROUND**
> Users can manually add the `external_directory` permission block to their `opencode.json` as shown in the issue description.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-08-19 | #81 | Initial report |

## References

- [Issue #81](https://github.com/Fisherk2/codice-opencode/issues/81)
- [OpenCode Permissions Documentation](https://opencode.ai/docs/es/permissions/#directorios-externos)
- `template/obligatorio/core/opencode.json`

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
