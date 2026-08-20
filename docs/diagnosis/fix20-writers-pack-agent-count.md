# Diagnosis: Writers Pack Agent Count Mismatch

**ID:** TD-V2-91
**Date:** 2026-08-19
**Severity:** low
**Status:** diagnosed

---

## Summary

The manifest describes "2 writer agents" but the directory contains 4 agents. This is a documentation inconsistency that affects the install summary display.

## Symptoms

- Install summary shows "writers pack (2 agents)" but 4 agent files are copied
- Users may notice the discrepancy if they count the files manually
- No functional impact — all 4 agents are installed correctly

## Root Cause

The agent count in `FileRuleManifestData.ts` was not updated when agents were added to the writers pack. The count is hardcoded in the manifest description.

**Why does this happen?** → Manual tracking of agent counts is error-prone. When agents are added, the manifest description is not always updated.

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

1. **Count the actual agent files** in `template/obligatorio/packs/writers/` (currently 4).
2. **Update the manifest description** in `FileRuleManifestData.ts` to reflect the correct count (change "2 writer agents" to "4 writer agents").
3. **Add a test** to verify the manifest count matches the actual file count (prevent regression).

## Workarounds

None — this is a cosmetic issue.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-08-19 | Initial report | Writers pack count mismatch (2 vs 4) |

## References

- TD-V2-91 in `docs/TECH_DEBT.md`
- `src/domain/entities/FileRuleManifestData.ts` (line 48 — writers pack description)
- `template/obligatorio/packs/writers/` (4 agent files)

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
