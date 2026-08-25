# Diagnosis: Outdated Comments in FileMergeEngine

**ID:** TD-V2-93
**Date:** 2026-08-19
**Severity:** low
**Status:** diagnosed

---

## Summary

Some inline comments in `FileMergeEngine.ts` reference old implementation details (e.g., "staging path ensures atomicity" when the staging logic has been refactored). These comments are misleading and reduce code clarity.

## Symptoms

- Comments in `FileMergeEngine.ts` describe implementation details that no longer match the code
- Developers reading the code may be confused by outdated comments
- No functional impact — comments are documentation, not code

## Root Cause

The `FileMergeEngine` was refactored to use the `AtomicStager` pattern (ADR-003), but some comments were not updated to reflect the new implementation.

**Why does this happen?** → Refactoring focused on behavior, not documentation. Comments were not reviewed as part of the refactoring process.

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | Developers reading the code |
| Functionality | Safe — no functional impact |
| Data integrity | Safe — no data operations affected |
| Reproducibility | N/A — this is a documentation issue |

## Environment

- **Platform:** All
- **Version:** v2.0.0+
- **Configuration:** `src/domain/services/FileMergeEngine.ts`

## Proposed Solution

1. **Review all comments** in `FileMergeEngine.ts`.
2. **Update or remove comments** that no longer match the implementation.
3. **Ensure comments explain "why" not "what"** (per CODE_STYLE.md).
4. **Add a pre-commit check** to flag comments that reference removed functions or classes.

## Workarounds

None — this is a documentation issue.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-08-19 | Initial report | Outdated comments in FileMergeEngine |

## References

- TD-V2-93 in `docs/TECH_DEBT.md`
- `src/domain/services/FileMergeEngine.ts`
- ADR-003 (Atomic File Operations)

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
