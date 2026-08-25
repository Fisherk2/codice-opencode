# Diagnosis: Shell Injection via github.ref_name in Release Workflow

**Issue:** TD-V2-70 — GitHub Actions shell injection via github.ref_name
**Date:** 2026-08-19
**Severity:** medium
**Status:** diagnosed

---

## Summary

The release workflow (`release.yml`) uses `${{ github.ref_name }}` directly in shell scripts at 4 locations (lines 38, 47, 63, 82). Although a validation regex exists at line 39, the template interpolation happens BEFORE the regex check, creating a shell injection vector. An attacker with write access could craft a malicious tag to execute arbitrary commands in the CI runner.

## Symptoms

- `release.yml` uses `${{ github.ref_name }}` in 4 shell script steps
- GitHub's own documentation warns against this pattern
- The validation regex (`^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$`) runs AFTER interpolation

## Root Cause

GitHub Actions template syntax `${{ }}` is interpolated by the Actions runner before the shell script executes. A malicious tag like `` `v1.0.0"; rm -rf /; echo "` `` would be interpolated into the shell script before any validation runs.

**Why does this happen?** → The workflow was designed with validation-first thinking, but the interpolation order means the validation cannot protect against injection.

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | None (CI/CD only) |
| Functionality | Safe — no functional impact on end users |
| Data integrity | At risk — attacker with write access could execute arbitrary commands in CI |
| Reproducibility | N/A — security vulnerability |

## Environment

- **Platform:** GitHub Actions
- **Version:** Current `release.yml`
- **Configuration:** `.github/workflows/release.yml`

## Proposed Solution

1. **Replace all `${{ github.ref_name }}` with `$GITHUB_REF_NAME`** (environment variable) in shell scripts.
2. GitHub Actions automatically sets `GITHUB_REF_NAME` as an environment variable — this is NOT subject to template interpolation.
3. The existing validation regex will work correctly with the environment variable.
4. Verify the fix by running the release workflow with a pre-release tag.

## Workarounds

None — this is a security patch that must be applied.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-08-19 | TD-V2-70 | Initial report |

## References

- `TECH_DEBT.md` TD-V2-70
- `.github/workflows/release.yml` (lines 38, 47, 63, 82)
- [GitHub Actions security hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
