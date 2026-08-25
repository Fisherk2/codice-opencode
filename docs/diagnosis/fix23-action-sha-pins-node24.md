# Diagnosis: Action SHA-Pins Force Node 24 (Deprecated)

**Issue:** TD-V2-7 — Action SHA-pins force Node 24 (deprecated)
**Date:** 2026-08-19
**Severity:** low
**Status:** diagnosed

---

## Summary

GitHub Actions workflows use SHA-pinned versions of `actions/checkout`, `actions/cache`, and `extractions/setup-just` that target Node 20. GitHub is deprecating Node 20 in favor of Node 24, causing deprecation warnings in CI logs. The SHA-pins need to be updated to the latest majors that support Node 24.

## Symptoms

- CI logs show deprecation warnings: "Node.js 20 actions are deprecated"
- Warnings appear for `actions/checkout`, `actions/cache`, `extractions/setup-just`
- CI still passes but with noisy warnings
- Future GitHub runner updates may break these actions entirely

## Root Cause

The SHA-pins were set to versions that target Node 20. GitHub periodically deprecates older Node versions in Actions runners, requiring updates to the latest action majors.

**Why does this happen?** → SHA-pins provide security (immutable references) but require manual updates when actions release new majors. The project pinned to specific SHAs for security (ADR-019) but did not plan for Node version deprecation cycles.

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | None (CI/CD only) |
| Functionality | Degraded — CI logs are noisy with warnings |
| Data integrity | Safe — no data operations affected |
| Reproducibility | Always — 100% reproducible on every CI run |

## Environment

- **Platform:** GitHub Actions
- **Version:** Current `ci.yml` and `release.yml`
- **Configuration:** `.github/workflows/ci.yml`, `.github/workflows/release.yml`

## Proposed Solution

1. **Identify the latest SHA-pins** for each action that support Node 24:
   - `actions/checkout` → check releases for Node 24-compatible version
   - `actions/cache` → check releases for Node 24-compatible version
   - `extractions/setup-just` → check releases for Node 24-compatible version
2. **Update the SHA-pins** in both `ci.yml` and `release.yml`
3. **Test the workflows** to ensure no breaking changes
4. **Document the update process** in `CONTRIBUTING.md` for future maintainers

## Workarounds

None — this is a CI/CD maintenance task.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-08-19 | Initial report | Node 20 deprecation warnings |

## References

- `TECH_DEBT.md` TD-V2-7
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- Related: ADR-019 (CI/CD Hardening)

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
