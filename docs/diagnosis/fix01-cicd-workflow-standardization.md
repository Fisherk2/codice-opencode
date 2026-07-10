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

## Clarification (2026-07-09)

> **Scope confirmed:** Issue #23 requires **documentation + workflow changes** — not just CONTRIBUTING.md but also `.github/workflows/` infrastructure. The 3-stage process must be implemented in the actual CI/CD pipelines, not only documented.

## Proposed Solution

Implementation is split into two tracks: **infrastructure** (workflow files) and **documentation** (CONTRIBUTING.md).

### Track A: Infrastructure — Modify `.github/workflows/`

#### A1. `ci.yml` — Add `develop` branch support

**Current:** Triggers only on `push` and `pull_request` to `main`.

**Required change:** Add `develop` to branch triggers so CI runs on all PRs targeting `develop`:

```yaml
on:
  push:
    branches: [main, develop]
    tags: ['v*']
  pull_request:
    branches: [main, develop]
```

**Rationale:** Without this, PRs to `develop` would not run tests, lint, or E2E — defeating the purpose of the staging branch.

#### A2. `release.yml` — Add test publishing support (pre-release tags)

**Current:** Publishes to npm as `latest` on any `v*` tag. No distinction between production and test releases.

**Required changes:**

1. **Detect pre-release vs. production tag** — Tags matching `v*-beta.*` or `v*-rc.*` should publish with `npm publish --tag beta` (or `--tag rc`) instead of `latest`.

2. **Skip GitHub Release for pre-releases** — Test publishes should create a GitHub Pre-release, not a full Release. The `softprops/action-gh-release` action supports `prerelease: true`.

3. **Simplified release.yml structure:**
   ```yaml
   on:
     push:
       tags:
         - 'v*'
   
   jobs:
     build:
       # ... same as current, matrix build for 3 platforms
   
     release:
       needs: build
       steps:
         # Validate version, extract CHANGELOG, publish to npm
         # If tag is v*-beta.* or v*-rc.* → npm publish --tag <prerelease>
         # If tag is vX.Y.Z (no suffix) → npm publish (as latest)
         # GitHub Release: prerelease=true for beta/rc, false for production
   ```

**Tag convention for test publishes:**
| Release type | Tag format | npm dist-tag | GitHub Release |
|-------------|------------|-------------|----------------|
| Production | `v1.0.14` | `latest` | Full Release |
| Beta | `v1.0.14-beta.1` | `beta` | Pre-release |
| Release Candidate | `v1.0.14-rc.1` | `rc` | Pre-release |

#### A3. Create `develop` branch

The `develop` branch must exist in the repository for the workflow to work. GitHub Actions only triggers on branches that exist.

**Action:** Create `develop` from `main` at the current commit.

### Track B: Documentation — Update `CONTRIBUTING.md`

#### B1. Document the Git Workflow

- Add a "Git Workflow" section explaining the branch strategy:
  - `main` — Production-ready code. Only merged via release PRs.
  - `develop` — Integration branch for features. PR target for all feature/fix branches.
  - `feature/*` or `feat/*` — New features. PR to `develop`.
  - `fix/*` — Bug fixes. PR to `develop`.
  - `release/*` or `release-v*` — Release preparation. PR to `develop` first (test), then PR to `main` (production).
- Document the 3-stage release process:
  - Stage 1: feature/fix branches → PR to `develop`
  - Stage 2: release branch → PR to `develop` (npm test publish with `-beta.*` or `-rc.*` tag)
  - Stage 3: release branch → PR to `main` (npm publish as `latest` + GitHub Release)
- Include branch naming conventions and PR requirements.

#### B2. Define npm Test Publish Nomenclature

- Versioning scheme: `1.0.14-beta.1`, `1.0.14-rc.1`, `1.0.14-beta.2`, etc.
- Document how to create a test publish tag:
  ```bash
  git tag v1.0.14-beta.1
  git push origin v1.0.14-beta.1
  ```
- Document how to verify the test package:
  ```bash
  npm view @fisherk2-dev/codice@beta
  bunx @fisherk2-dev/codice@beta --version
  ```
- Note: npm allows overwriting pre-release tags, but not `latest`. Test publishes can be overwritten with a new beta/rc version.

#### B3. Update CI/CD Pipeline Documentation

- Add a "CI/CD Pipeline" section explaining each workflow.
- Document triggers, differences between ci.yml and release.yml.
- Add troubleshooting section for common CI/CD issues.

#### B4. Create Release Checklist

- Pre-release checks: tests pass, coverage maintained, CHANGELOG updated, version bumped.
- Release steps: create tag, push tag, verify CI, verify npm package, verify GitHub Release.
- Post-release steps: merge to `develop` if needed, update documentation.

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
