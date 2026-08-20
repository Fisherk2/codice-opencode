# Diagnosis: No Caching for Version Comparison

**ID:** TD-V2-61
**Date:** 2026-08-19
**Severity:** low
**Status:** diagnosed

---

## Summary

`VersionComparator` performs semver parsing on every call. If the same versions are compared repeatedly (e.g., during batch operations or tests), the parsing overhead is duplicated. This is a minor performance issue, not a correctness problem.

## Symptoms

- `VersionComparator.compareVersions()` parses semver strings on every call
- Repeated comparisons of the same versions (e.g., in loops or tests) incur redundant parsing overhead
- No measurable performance impact in typical use cases (single comparison per install)

## Root Cause

`VersionComparator` does not cache parsed semver objects. Each call to `compareVersions()` re-parses the version strings using the `semver` library.

**Why does this happen?** → The comparator was designed for simplicity, not performance. The typical use case involves a single comparison per install, so caching was not considered necessary.

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | None (no measurable impact) |
| Functionality | Safe — no functional impact |
| Data integrity | Safe — no data operations affected |
| Reproducibility | N/A — this is a performance optimization |

## Environment

- **Platform:** All
- **Version:** v2.0.0+
- **Configuration:** `src/domain/services/VersionComparator.ts`

## Proposed Solution

1. **Add a simple cache** (Map) to `VersionComparator` that stores parsed semver objects.
2. **Key the cache** by version string.
3. **Invalidate the cache** when the comparator is destroyed (or use a weak reference).
4. **Benchmark** to verify the improvement (likely negligible for typical use cases).
5. **Add a test** to verify the cache works correctly.

## Workarounds

None — this is a performance optimization, not a bug.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-08-19 | Initial report | No caching in VersionComparator |

## References

- TD-V2-61 in `docs/TECH_DEBT.md`
- `src/domain/services/VersionComparator.ts`

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
