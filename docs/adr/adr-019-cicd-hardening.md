# ADR-019: CI/CD Hardening

**Status:** Accepted

**Date:** 2026-08-07

**Author:** Fisherk2

**Reference:** FEV-24/FEV-25 — CI/CD Improvements | WORKFLOW §5, TECH_DEBT v2.1.0-beta.1

**Amendment:** 2026-11-18 — Phase 0 CI/CD hardening registered below (§Amendment). Original decisions stand unchanged.

## Context

The v2.0.0 CI pipeline (established in F5/FEV-5) provides quality, test, and release workflows. By v2.1.0 the pipeline needs hardening to meet supply-chain and collaboration standards:

1. **Unpinned actions** — GitHub Actions referenced by mutable tags (`@v4`) are vulnerable to tag-reuse and compromise. SLSA and OpenSSF recommend SHA pinning.
2. **Missing branch protection** — `main` and `develop` lack enforced status checks and review requirements. Direct pushes can bypass CI (violates CONTRIBUTING.md's 3-stage pipeline).
3. **Missing contribution scaffolding** — No PR or issue templates; contributors lack guidance on the `develop` → `main` flow, Conventional Commits, and `just check` pre-conditions.
4. **No publish provenance** — npm publishes lack attestation. Consumers cannot verify that the tarball was built by the expected CI workflow.

These gaps are low-effort, high-impact fixes that should be completed before the v2.1.0-beta.1 release.

## Decision

We apply four hardening measures:

### 1. SHA-Pinned GitHub Actions

All workflow steps pin actions to full commit SHAs (e.g., `actions/checkout@11bd71901bbe...`) instead of floating tags. Dependabot is configured to propose SHA updates. This follows SLSA Build L2 practices.

### 2. Branch Protection (main / develop)

* Require status checks: `quality (ubuntu-latest)`, `quality (macos-latest)`, `quality (windows-latest)`, `security` must pass (contexts corrected 2026-11-18 — see `scripts/setup-branch-protection.sh`).
* Require pull request reviews before merging.
* Block force pushes and direct pushes to both branches (enforced via `scripts/setup-branch-protection.sh`).

### 3. PR and Issue Templates

* `.github/pull_request_template.md` — checklist covering `just check`, `bun test`, branch naming, and linked issue.
* `.github/ISSUE_TEMPLATE/` — bug report and feature request templates with environment and reproduction fields.

### 4. npm Provenance (SLSA v1)

* Release workflow publishes with `--provenance` (OIDC-based attestation via GitHub Actions).
* Consumers can verify with `npm audit signatures` and Sigstore transparency log.

## Consequences

### Positive

* Supply-chain risk reduced: SHA pinning + provenance provides verifiable build integrity.
* Branch protection enforces the 3-stage pipeline (`develop` → `main` → tags) at the platform level, not just by convention.
* Templates lower the contribution barrier and reduce review cycles for external contributors.

### Negative

* SHA updates require Dependabot PRs (additional review overhead, but automated).
* Branch protection adds a mandatory review step even for single-maintainer changes (mitigated by self-review + CI gate).

### Neutral

* No application code change — purely CI/CD and repository configuration.
* Establishes the baseline for future SLSA L3 improvements (hermetic builds, if needed).

## Amendment (2026-11-18): Phase 0 CI/CD Hardening

**Amends:** ADR-019 (this record). The four decisions above stand as written; the following measures shipped in Phase 0 and are registered here so the record matches `.github/workflows/ci.yml` and `scripts/setup-branch-protection.sh`.

* **`paths-ignore` removed from the `pull_request` trigger** (`ci.yml:25-29`) — the four required contexts are enforced with `strict: true`, so a docs-only PR that skipped the workflow would hang forever with pending, unmergeable checks. Every PR now runs the workflow; the `push` trigger keeps its `paths-ignore` for `docs/**` and `CHANGELOG.md` (`ci.yml:21-24`).
* **`docs` job — informational Markdown gate** (`ci.yml:177-214`) — `just lint-docs` (markdownlint-cli2, config `.markdownlint-cli2.jsonc`) runs on every workflow invocation. It is deliberately *not* a branch-protection context, but because it has no event guard, `release.yml → quality` gates releases on it too (a reusable workflow only succeeds when every job inside it does).
* **`security` promoted to a required status check** (`scripts/setup-branch-protection.sh:41-47`) — the job (`ci.yml:114`) now runs `bun audit --audit-level=high` (`ci.yml:141`) against `bun.lock` on every PR to `main`/`develop`, failing the merge on high-severity advisories.
* **`.githooks/pre-commit` — local door** — `bun run tsc --noEmit` (blocking) plus `gitleaks protect --staged --no-banner` (blocking when gitleaks is installed; a one-line notice otherwise), enabled per clone via `git config core.hooksPath .githooks`, with a `SKIP=` escape hatch. CI remains the authoritative gate; this only moves feedback earlier.

## Related Decisions

* ADR-006 — npm Publication as Primary Distribution (provenance extends its trust model)
* ADR-011 — Binary Removal (npm/bunx as sole distribution — provenance is the natural next step)
* CONTRIBUTING.md — Git Workflow section now has platform enforcement, not just documentation
