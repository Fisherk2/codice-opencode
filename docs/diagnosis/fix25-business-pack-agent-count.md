# Diagnosis: Business Pack Agent Count Mismatch

**ID:** TD-V2-90
**Date:** 2026-08-19
**Severity:** low
**Status:** diagnosed

---

## Summary

The manifest declares 92 agents for the business pack, but only 91 files exist in `template/obligatorio/packs/business/`. This is a documentation/metadata inconsistency that affects the install summary display.

## Symptoms

- Install summary shows "business pack (92 agents)" but only 91 agent files are copied
- Users may notice the discrepancy if they count the files manually
- No functional impact — all existing agents are installed correctly

## Root Cause

The agent count in `FileRuleManifestData.ts` was not updated when an agent was removed from the business pack. The count is hardcoded in the manifest description.

**Why does this happen?** → Manual tracking of agent counts is error-prone. When agents are added or removed, the manifest description is not always updated.

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All users (cosmetic only) |
| Functionality | Cosmetic — install summary shows incorrect count |
| Data integrity | Safe — all agents are installed correctly |
| Reproducibility | Always — 100% reproducible |

## Environment

- **Platform:** All
- **Version:** v2.0.0+
- **Configuration:** `src/domain/entities/FileRuleManifestData.ts`

## Proposed Solution

1. **Count the actual agent files** in `template/obligatorio/packs/business/` (currently 91).
2. **Update the manifest description** in `FileRuleManifestData.ts` to reflect the correct count (change "92 agents" to "91 agents").
3. **Add a test** to verify the manifest count matches the actual file count (prevent regression).

## Workarounds

None — this is a cosmetic fix.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-08-19 | TD-V2-90 | Initial report |

## References

- `TECH_DEBT.md` TD-V2-90
- `src/domain/entities/FileRuleManifestData.ts` (business pack entry)
- `template/obligatorio/packs/business/` (91 files)

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
