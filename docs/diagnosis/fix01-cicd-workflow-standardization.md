# Diagnosis: CI/CD Workflow Standardization

**Issue:** [#23](https://github.com/fisherk2/codice-opencode/issues/23) — _Mejorar el flujo de trabajo CI/CD_
**Date:** 2026-07-09
**Severity:** medium
**Status:** diagnosed

---

## Summary

The project lacks a documented CI/CD workflow for contributors. While basic CI/CD infrastructure exists (ci.yml, release.yml), there is no standardized process documented in CONTRIBUTING.md that explains how contributors should work with branches, pull requests, and releases. This creates inconsistency and risk of improper releases.

## Symptoms

- Contributors don't know the proper workflow for submitting changes
- No documented process for testing npm packages before release
- Risk of inconsistent release practices
- Missing guidance on branch naming conventions and PR targets
- No clear separation between development, testing, and production releases

## Root Cause

The CI/CD workflow was implemented incrementally during project evolution (F5, F5.5, FEV phases) but was never documented as a standardized process for contributors. The focus was on making it work rather than documenting how to use it.

> Why is this undocumented? → _The project evolved rapidly through multiple phases (FEV-1 through FEV-4), each adding CI/CD capabilities. Documentation of the workflow was deferred in favor of functionality._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | Contributors and maintainers |
| Functionality | Degraded (workflow exists but is not documented) |
| Data integrity | Safe (no data risk) |
| Reproducibility | Always (documentation gap) |

## Environment

- **Platform:** GitHub Actions, npm registry
- **Version:** v1.0.13
- **Configuration:** ci.yml, release.yml, package.json

## Proposed Solution

Implementation steps:

1. **Document the Git Workflow in CONTRIBUTING.md**
   - Add a "Git Workflow" section explaining the branch strategy
   - Document the 3-stage release process:
     - Stage 1: fix/feature branches → PR to develop
     - Stage 2: release branches → PR to develop (npm test publish)
     - Stage 3: release branches → PR to main (production release)
   - Include branch naming conventions (fix/, feature/, release/)
   - Document PR requirements and review process

2. **Define npm Test Publish Nomenclature**
   - Establish versioning scheme for test publishes (e.g., 1.0.13-beta.1, 1.0.13-rc.1)
   - Document how to unpublish and republish test versions
   - Add examples to CONTRIBUTING.md

3. **Update CI/CD Documentation**
   - Add a "CI/CD Pipeline" section explaining what each workflow does
   - Document the triggers (push, PR, tag)
   - Explain the difference between ci.yml and release.yml
   - Add troubleshooting section for common CI/CD issues

4. **Create Release Checklist**
   - Add a release checklist template to CONTRIBUTING.md
   - Include pre-release checks (tests pass, coverage maintained, CHANGELOG updated)
   - Document post-release steps (verify npm package, verify GitHub release, update documentation)

5. **Consider Adding Branch Protection Rules**
   - Recommend branch protection for main and develop branches
   - Require PR reviews before merge
   - Require status checks to pass

## Workarounds

> ⚠️ **WORKAROUND**
> Currently, contributors can follow the existing CONTRIBUTING.md guidelines for PRs, but there is no explicit CI/CD workflow documentation. Maintainers manually verify releases.

## References

- [Issue #23](https://github.com/fisherk2/codice-opencode/issues/23)
- [CONTRIBUTING.md](../CONTRIBUTING.md)
- [.github/workflows/ci.yml](../.github/workflows/ci.yml)
- [.github/workflows/release.yml](../.github/workflows/release.yml)
- [WORKFLOW.md](../docs/WORKFLOW.md) — Internal development workflow (different from CI/CD)

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
