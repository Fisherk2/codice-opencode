# FEV-11 Todo List — Binary Removal (v1.2.0)

**Phase:** FEV-11 (v1.2 Phase 1)
**Issue:** [#46](https://github.com/fisherk2/codice-opencode/issues/46)
**Date:** 2026-07-27
**Full plan:** [plan.md](./plan.md)

---

## Phase 1: Foundation

- [ ] **Task 1.1:** Audit binary-related code → `docs/diagnosis/fix04-audit-results.md`
- [ ] **Task 1.2:** Add ADR-011 → `specs/adr/adr-011-binary-removal.md`
- [ ] **Task 1.3:** Update SPEC.md (remove SC-15, update SC-16) → `SPEC.md`

**Checkpoint:** Review audit, ADR-011, SPEC.md updates with human before Phase 2

---

## Phase 2: Source Code Removal

- [ ] **Task 2.1:** Remove binary compilation from `src/` (verify no changes needed)
- [ ] **Task 2.2:** Remove `dist/` references from src/, tests, package.json
- [ ] **Task 2.3:** Update `package.json` (remove bin, scripts.build, files)

**Checkpoint:** `bun run tsc --noEmit` + `bun test tests/unit/` pass

---

## Phase 3: Build System

- [ ] **Task 3.1:** Remove Justfile recipes (build, build-all, release) → `Justfile`
- [ ] **Task 3.2:** Update CI workflow (remove binary steps) → `.github/workflows/ci.yml`
- [ ] **Task 3.3:** Update Release workflow (remove binary jobs) → `.github/workflows/release.yml`

**Checkpoint:** `just --list` shows clean recipe list, yamllint passes

---

## Phase 4: Tests

- [ ] **Task 4.1:** Migrate E2E tests to `bunx`/`bun run` → `tests/e2e/*.sh` (16 files)
- [ ] **Task 4.2:** Remove binary-specific E2E tests → `tests/e2e/` (2-5 files)
- [ ] **Task 4.3:** Verify all tests pass (≥585 tests, 15/15 E2E, 5/5 packaging)

**Checkpoint:** `just check && just test && just test-e2e` all pass

---

## Phase 5: Documentation

- [ ] **Task 5.1:** Update README.md (remove binary install) → `README.md`
- [ ] **Task 5.2:** Update CONTRIBUTING.md (remove build instructions) → `CONTRIBUTING.md`
- [ ] **Task 5.3:** Update Wiki (Getting-Started.md) → `docs/wiki-source/`
- [ ] **Task 5.4:** Update TECH_DEBT.md (resolve Section 7.1) → `docs/TECH_DEBT.md`
- [ ] **Task 5.5:** Update CHANGELOG.md (v1.2.0 entry) → `CHANGELOG.md`

**Checkpoint:** All docs render correctly, no binary references

---

## Phase 6: Release

- [ ] **Task 6.1:** Bump version to 1.2.0 → `package.json`
- [ ] **Task 6.2:** Create release PR (feat/v1.2-fev-11 → main)
- [ ] **Task 6.3:** Tag v1.2.0 (with breaking change notice)
- [ ] **Task 6.4:** Publish to npm (verify `npm view @fisherk2-dev/codice@1.2.0`)

**Checkpoint:** v1.2.0 published, all DoD items completed ✅

---

## DoD Checklist

- [ ] All binary compilation code removed from `src/`
- [ ] Binary-specific tests removed
- [ ] CI/CD workflows no longer generate binaries
- [ ] README and documentation updated (no binary references)
- [ ] TECH_DEBT.md Section 7.1 removed/resolved
- [ ] SPEC.md updated (SC-15 removed, SC-16 updated)
- [ ] CONTRIBUTING.md updated
- [ ] ADR-011 documented
- [ ] `bun test`: 0 fail, no regression (≥585 tests passing)
- [ ] `just check`: 0 errors
- [ ] `bunx @fisherk2-dev/codice` works correctly
- [ ] v1.2.0 released to npm with breaking change notice

---

**Estimated effort:** 11h + 1h buffer = 12h total
**Dependencies:** All tasks sequential except Phase 1 (parallel) and Phase 5 (parallel)
