# FEV-28 Todo List — Infrastructure & Performance

**Phase:** FEV-28 (v2.1.1) — ✅ Completo
**Branch:** `fix/tech-debt-2.1.1`
**Base:** `develop`
**Plan:** [plan.md](./plan.md)

---

## Phase 1 — TD-V2-7: SHA-pins → Node 24-compatible ✅ Completo

- [x] **Task 1.1** Bump SHA-pins en `.github/workflows/ci.yml` y `.github/workflows/release.yml`
  - [x] `ci.yml`: `actions/checkout` → `@3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1)
  - [x] `ci.yml`: `actions/cache` → `@55cc8345863c7cc4c66a329aec7e433d2d1c52a9` (v6.1.0)
  - [x] `ci.yml`: `extractions/setup-just` → `@53165ef7e734c5c07cb06b3c8e7b647c5aa16db3` (v4)
  - [x] `release.yml`: `actions/checkout` → `@3d3c42e5aac5ba805825da76410c181273ba90b1` (v7.0.1)
  - [x] `oven-sh/setup-bun` se mantiene (SHA `0c5077e5...` v2.2.0 ya es Node 24)
  - [x] `softprops/action-gh-release` → `@3d0d9888cb7fd7b750713d6e236d1fcb99157228` (v3.0.2)
  - [x] Commit: `0003316 chore(ci): bump GitHub Actions SHA-pins to Node 24-compatible majors`

**Checkpoint Phase 1:**
- [x] `just check` 0 errores, `just test` 1934 pass, 0 fail
- [x] SHA-pins validados via GitHub API (HTTP 200)

---

## Phase 2 — TD-V2-61: VersionComparator semver cache ✅ Completo

- [x] **Task 2.1** Añadir cache + test (TDD)
  - [x] `VersionComparator` class: `private readonly parsedCache = new Map<string, string>()`
  - [x] `compare()` — cache lookup → on miss: `validateVersions()` → set cache
  - [x] `validateVersion`/`validateVersions` remain pure (no cache)
  - [x] Constructor refactored for DI (optional `validateFn` param, backward-compatible)
  - [x] Class JSDoc updated to "memoized; no I/O"
  - [x] Commit: `4a43f91 perf(domain): add parsed-semver cache to VersionComparator`
  - [x] Commit: `61bce84 refactor(domain): simplify FEV-28 comments for clarity`
  - [x] Commit: `bcd9884 fix(domain): add DI-enabled cache verification test + bump action-gh-release`

- [x] **Task 2.2** Code review + quality gates
  - [x] `just check` 0 errores
  - [x] `just test` — 1934 pass, 0 fail
  - [x] Code review pass (5-axis: correctness, readability, architecture, security, performance)
  - [x] Spy-based cache verification test added (proves cache hit skips validation)

**Checkpoint Phase 2:**
- [x] `just check` 0 errores
- [x] `just test` 1934 pass, 0 fail
- [x] `git log --oneline -5` muestra los commits de FEV-28

---

## Code Review ✅ Completo

- [x] Multi-axis review (correctness, readability, architecture, security, performance)
- [x] All findings addressed (DI-enabled cache test, action-gh-release bump, JSDoc fix)

---

## Release ✅ Completo

- [x] v2.1.1-beta.1 docs actualizados (TECH_DEBT.md, WORKFLOW.md, SPEC.md, CHANGELOG.md)
- [x] `package.json` → `2.1.1-beta.1`
- [x] `git log --oneline -6` muestra el historial completo de FEV-28
