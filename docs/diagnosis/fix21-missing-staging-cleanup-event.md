# Diagnosis: Missing Event for Staging Directory Cleanup

**Issue:** TD-V2-51 — Missing event for staging directory cleanup
**Date:** 2026-08-19
**Severity:** low
**Status:** diagnosed

---

## Summary

No `ProgressEvent` is emitted when the staging directory is cleaned up after a successful commit or failed rollback. This reduces observability — users running with `--verbose` cannot see when cleanup occurs, making it harder to debug installation issues.

## Symptoms

- Verbose logs show staging, commit, and rollback events
- No log entry for staging directory cleanup
- Users cannot verify cleanup completed successfully
- Debugging installation failures lacks visibility into cleanup phase

## Root Cause

The `ProgressEvent` discriminated union does not include a `staging_cleanup` event type. `AtomicStager.cleanStaging()` performs the cleanup but does not emit progress events.

**Why does this happen?** → The event system was designed for user-facing progress (file staging, commit), not infrastructure operations. Cleanup was considered an implementation detail.

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | Developers debugging installation issues |
| Functionality | Safe — no functional impact |
| Data integrity | Safe — cleanup still occurs |
| Reproducibility | N/A — observability gap |

## Environment

- **Platform:** All
- **Version:** v2.1.0+
- **Configuration:** `src/domain/types/ProgressEvent.ts`, `src/infrastructure/adapters/AtomicStager.ts`

## Proposed Solution

1. **Add `staging_cleanup` event type** to `ProgressEvent` discriminated union:
   ```typescript
   | { readonly type: "staging_cleanup"; readonly stagingPath: string; readonly success: boolean }
   ```
2. **Emit event in `AtomicStager.cleanStaging()`** after cleanup completes (success or failure)
3. **Emit event in `AtomicStager.commitStaging()`** after successful commit (cleanup is implicit)
4. **Update verbose logger** to display `staging_cleanup` events with path and status

## Workarounds

None — this is an observability enhancement.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-08-19 | Initial report | Missing cleanup event |

## References

- `TECH_DEBT.md` TD-V2-51
- `src/domain/types/ProgressEvent.ts`
- `src/infrastructure/adapters/AtomicStager.ts`

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
