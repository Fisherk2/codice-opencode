# Implementation Plan: FEV-11 — Binary Removal (v1.2.0)

**Phase:** FEV-11 (v1.2 Phase 1)
**Issue:** [#46](https://github.com/fisherk2/codice-opencode/issues/46)
**Date:** 2026-07-27
**Author:** Moctezuma (Strategic Planner)
**Diagnosis:** [fix04-v1.2-phase1-binary-removal.md](../diagnosis/fix04-v1.2-phase1-binary-removal.md)
**Methodology:** Vertical slicing + Clean Architecture compliance

---

## Overview

Remove all binary compilation and distribution logic from Códice. The only installation method will be via package managers (npm/bunx). This simplifies the codebase, reduces maintenance burden by ~30%, and aligns with ADR-006 (npm-first distribution).

**Breaking change scope:** Affects <5% of users (air-gapped environments, users without Bun/Node.js). No functionality loss — npm/bunx provides identical features.

**Version:** v1.2.0 (minor bump, npm/bunx remains primary)

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Eliminate `build`/`build-all`/`release` recipes** | No binaries = no build commands. Justfile becomes dev/test focused. |
| **Migrate E2E to `bunx`/`bun run`** | Replace `bun build --compile` with `bunx @fisherk2-dev/codice` for published tests, `bun run src/cli/main.ts` for local dev. |
| **Keep historical binaries in past releases** | Don't break existing URLs. Only stop attaching binaries to v1.2.0+ releases. |
| **Remove SC-15 (binaries for 3 platforms)** | Success criteria no longer applies — npm is the only distribution. |
| **Update SC-16** | Replace "compiled binaries" with "npm tarball < 5MB" as the size criterion. |
| **Add ADR-011** | Document the binary removal as a formal architectural decision. |

---

## Dependency Graph

```
Phase 1: Foundation (no dependencies)
├── Task 1.1: Audit binary-related code
├── Task 1.2: Add ADR-011
└── Task 1.3: Update SPEC.md (SC-15, SC-16)

Phase 2: Source Code Removal (depends on 1.1)
├── Task 2.1: Remove binary compilation from src/
├── Task 2.2: Remove dist/ references
└── Task 2.3: Update package.json (remove bin, scripts.build)

Phase 3: Build System (depends on Phase 2)
├── Task 3.1: Remove Justfile recipes
├── Task 3.2: Update CI workflow (ci.yml)
└── Task 3.3: Update Release workflow (release.yml)

Phase 4: Tests (depends on Phase 3)
├── Task 4.1: Migrate E2E tests to bunx/bun run
├── Task 4.2: Remove binary-specific E2E tests
└── Task 4.3: Verify all tests pass

Phase 5: Documentation (depends on Phase 4)
├── Task 5.1: Update README.md
├── Task 5.2: Update CONTRIBUTING.md
├── Task 5.3: Update Wiki (Getting-Started.md)
├── Task 5.4: Update TECH_DEBT.md
└── Task 5.5: Update CHANGELOG.md

Phase 6: Release (depends on Phase 5)
├── Task 6.1: Bump version to 1.2.0
├── Task 6.2: Create release PR
├── Task 6.3: Tag v1.2.0
└── Task 6.4: Publish to npm
```

**Implementation order:** Build foundations first (audit), remove code, update build system, migrate tests, update docs, release.

---

## Task List

### Phase 1: Foundation

#### Task 1.1: Audit binary-related code
**Description:** Comprehensive search for all binary-related references in the codebase. Document findings in `docs/diagnosis/fix04-audit-results.md`.

**Acceptance criteria:**
- [ ] List of all files containing `bun build`, `compile`, `binary`, `dist/` references
- [ ] Identification of binary-specific tests in `tests/e2e/`
- [ ] Documentation of CI/CD binary generation steps
- [ ] Markdown table of all locations to be modified

**Verification:**
- [ ] `grep -r "bun build --compile" src/ tests/` returns no false negatives
- [ ] `grep -r "binary" docs/ README.md CONTRIBUTING.md` returns no false negatives
- [ ] Audit document is comprehensive (covers all 9 task areas from diagnosis)

**Dependencies:** None

**Files likely touched:**
- `docs/diagnosis/fix04-audit-results.md` (new)

**Estimated scope:** S (1-2 files)

---

#### Task 1.2: Add ADR-011 — Binary Removal
**Description:** Document the architectural decision to remove binary compilation as ADR-011 in `specs/adr/`.

**Acceptance criteria:**
- [ ] File `specs/adr/adr-011-binary-removal.md` created
- [ ] Status: Accepted
- [ ] Context: Why binaries were removed
- [ ] Decision: npm/bunx as sole distribution
- [ ] Consequences: Reduced maintenance, migration path for affected users
- [ ] References: Issue #46, ADR-006, diagnosis fix04

**Verification:**
- [ ] File follows ADR template structure
- [ ] Cross-references are valid
- [ ] `docs/ARCHITECTURE.md` updated to include ADR-011 in the table

**Dependencies:** None (can be parallel with 1.1)

**Files likely touched:**
- `specs/adr/adr-011-binary-removal.md` (new)
- `docs/ARCHITECTURE.md` (add ADR-011 entry)

**Estimated scope:** S (1-2 files)

---

#### Task 1.3: Update SPEC.md (SC-15, SC-16)
**Description:** Remove or update binary-related success criteria from SPEC.md.

**Acceptance criteria:**
- [ ] SC-15 removed: "Compiled binaries are produced for Linux, macOS, and Windows x64"
- [ ] SC-16 updated: Replace binary criteria with "npm tarball size < 5MB"
- [ ] SC-1, SC-2, SC-3 remain unchanged (functional criteria)
- [ ] Runtime Constraints section updated: remove "compiled binary must run on Linux/macOS/Windows"

**Verification:**
- [ ] SPEC.md grep for "binary" returns no results in criteria sections
- [ ] `bun run tsc --noEmit` passes (no broken type references)
- [ ] SPEC.md changelog notes the criteria update

**Dependencies:** None (can be parallel with 1.1, 1.2)

**Files likely touched:**
- `SPEC.md`

**Estimated scope:** S (1 file)

---

### Checkpoint: Foundation
- [ ] All audit findings documented
- [ ] ADR-011 created and cross-referenced
- [ ] SPEC.md updated
- [ ] No code changes yet (read-only audit)
- [ ] Review with human before proceeding to Phase 2

---

### Phase 2: Source Code Removal

#### Task 2.1: Remove binary compilation from src/
**Description:** Remove any binary compilation logic, build scripts, or compile-related code from `src/`.

**Acceptance criteria:**
- [ ] No `bun build --compile` references in `src/`
- [ ] No `compile` functions in `src/cli/` (verify with `ls src/cli/`)
- [ ] No binary-related comments in source files
- [ ] `src/cli/main.ts` remains the only entry point

**Verification:**
- [ ] `grep -r "compile\|build" src/` returns no false positives
- [ ] `bun run tsc --noEmit` passes
- [ ] `bun test tests/unit/` passes (no domain logic affected)
- [ ] `src/cli/` directory unchanged in structure (no files added/removed)

**Dependencies:** Task 1.1 (audit)

**Files likely touched:**
- Potentially `src/cli/main.ts` (if any binary logic exists)
- No file additions/removals expected

**Estimated scope:** XS (0-1 files, likely no changes)

---

#### Task 2.2: Remove dist/ references
**Description:** Remove references to `dist/` directory in source code, comments, and configuration.

**Acceptance criteria:**
- [ ] No `dist/` references in `src/` or `tests/`
- [ ] `package.json` does not include `dist/` in `files` field
- [ ] `.gitignore` still excludes `dist/` (correct behavior)

**Verification:**
- [ ] `grep -r "dist/" src/ tests/ package.json` returns no false positives
- [ ] `git ls-files | grep dist/` returns empty (except .gitkeep if exists)

**Dependencies:** Task 2.1

**Files likely touched:**
- `package.json` (files field)
- No file removals expected (dist/ is gitignored)

**Estimated scope:** XS (0-1 files)

---

#### Task 2.3: Update package.json
**Description:** Remove binary-related fields from `package.json`.

**Acceptance criteria:**
- [ ] `bin` field removed (no executable to install)
- [ ] `scripts.build` removed
- [ ] `scripts.build:all` removed
- [ ] `files` field updated (remove dist/ references)
- [ ] `main` field points to `src/cli/main.ts` for source distribution
- [ ] Version bumped to 1.2.0 (preparation for release)

**Verification:**
- [ ] `bun run tsc --noEmit` passes
- [ ] `npm pack --dry-run` shows only source files (no dist/)
- [ ] `package.json` is valid JSON
- [ ] No breaking changes to dependencies

**Dependencies:** Task 2.2

**Files likely touched:**
- `package.json`

**Estimated scope:** XS (1 file)

---

### Checkpoint: Source Code Clean
- [ ] No binary compilation code in src/
- [ ] No dist/ references
- [ ] package.json updated
- [ ] `bun run tsc --noEmit` passes
- [ ] `bun test tests/unit/` passes
- [ ] Review with human before proceeding to Phase 3

---

### Phase 3: Build System

#### Task 3.1: Remove Justfile recipes
**Description:** Remove `build`, `build-all`, and `release` recipes from Justfile. Update `test-e2e` to not depend on `build`.

**Acceptance criteria:**
- [ ] `build` recipe removed
- [ ] `build-all` recipe removed
- [ ] `release` recipe removed
- [ ] `test-e2e` recipe updated: `bunx @fisherk2-dev/codice` or `bun run src/cli/main.ts`
- [ ] `clean` recipe remains (or is updated to remove dist/)
- [ ] Justfile is still valid syntax

**Verification:**
- [ ] `just --list` shows no build/build-all/release recipes
- [ ] `just test-e2e` command syntax is valid
- [ ] `just --justfile` parses without errors

**Dependencies:** Task 2.3

**Files likely touched:**
- `Justfile`

**Estimated scope:** S (1 file)

---

#### Task 3.2: Update CI workflow (ci.yml)
**Description:** Remove binary generation steps from `.github/workflows/ci.yml`. Keep quality checks and npm publish prep.

**Acceptance criteria:**
- [ ] "Build binary" step removed
- [ ] "Smoke test binary" steps removed (macOS, Windows)
- [ ] "Set artifact binary name" step removed
- [ ] "Upload binary artifact" step removed
- [ ] Quality checks remain: lint, format, typecheck, test
- [ ] Matrix remains: ubuntu, macos, windows
- [ ] Workflow file is valid YAML

**Verification:**
- [ ] `yamllint .github/workflows/ci.yml` passes
- [ ] `grep -n "binary\|build" .github/workflows/ci.yml` returns no false positives
- [ ] Workflow structure: 3 jobs (lint, test, typecheck) on 3 OS

**Dependencies:** Task 3.1

**Files likely touched:**
- `.github/workflows/ci.yml`

**Estimated scope:** S (1 file)

---

#### Task 3.3: Update Release workflow (release.yml)
**Description:** Remove binary build and upload steps from `.github/workflows/release.yml`. Keep npm publish steps.

**Acceptance criteria:**
- [ ] `build` job removed
- [ ] "Download all binary artifacts" step removed
- [ ] "All-or-nothing" sha256sum check removed
- [ ] `release` job updated: only attach source tarball (optional)
- [ ] npm publish step remains and is tested
- [ ] Workflow triggers remain: tags v*, v*.*.*-beta.*, v*.*.*-rc.*
- [ ] Workflow file is valid YAML

**Verification:**
- [ ] `yamllint .github/workflows/release.yml` passes
- [ ] `grep -n "binary\|compile" .github/workflows/release.yml` returns no false positives
- [ ] npm publish step is intact and tested
- [ ] Release notes generation works (CHANGELOG extraction)

**Dependencies:** Task 3.2

**Files likely touched:**
- `.github/workflows/release.yml`

**Estimated scope:** M (1 file, complex changes)

---

### Checkpoint: Build System Clean
- [ ] Justfile recipes removed
- [ ] CI workflow updated
- [ ] Release workflow updated
- [ ] No binary generation in any workflow
- [ ] `just --list` shows clean recipe list
- [ ] Review with human before proceeding to Phase 4

---

### Phase 4: Tests

#### Task 4.1: Migrate E2E tests to bunx/bun run
**Description:** Update E2E tests to use `bunx @fisherk2-dev/codice` or `bun run src/cli/main.ts` instead of compiled binary.

**Acceptance criteria:**
- [ ] All E2E scripts in `tests/e2e/` use `bunx` or `bun run` instead of `./codice` or `dist/codice-*`
- [ ] Test infrastructure (`run-e2e.sh`) updated accordingly
- [ ] No E2E test depends on `just build`
- [ ] E2E tests can run locally without compilation step

**Verification:**
- [ ] `grep -r "dist/codice\|./codice" tests/e2e/` returns no results
- [ ] `just test-e2e` syntax is valid (no `just build` prefix)
- [ ] Local E2E test runs successfully: `bash tests/e2e/01-clean-install.sh`

**Dependencies:** Task 3.3

**Files likely touched:**
- `tests/e2e/*.sh` (15 scenarios)
- `tests/e2e/run-e2e.sh`

**Estimated scope:** M (16 files)

---

#### Task 4.2: Remove binary-specific E2E tests
**Description:** Delete E2E tests that specifically test binary behavior (e.g., binary size, binary execution permissions).

**Acceptance criteria:**
- [ ] No E2E tests for binary-specific behavior remain
- [ ] Test count reduced accordingly (596 → expected ~585)
- [ ] `tests/e2e/` directory contains only npm/bunx-based scenarios

**Verification:**
- [ ] `ls tests/e2e/` shows 15 scenarios (no binary-specific)
- [ ] `grep -l "binary\|chmod\|elf\|pe" tests/e2e/*.sh` returns empty
- [ ] `just test-e2e --list` (if supported) shows 15 tests

**Dependencies:** Task 4.1

**Files likely touched:**
- `tests/e2e/` (deletion of binary-specific scripts)

**Estimated scope:** S (2-5 files)

---

#### Task 4.3: Verify all tests pass
**Description:** Run the complete test suite to ensure no regressions.

**Acceptance criteria:**
- [ ] `bun test`: ≥585 pass, 0 fail
- [ ] `just test-unit`: 100% pass
- [ ] `just test-integration`: 100% pass
- [ ] `just test-e2e`: 15/15 scenarios passing
- [ ] `just test-packaging`: 5/5 tests passing
- [ ] `just check`: 0 errors (biome + tsc)
- [ ] Coverage: ≥98% functions, ≥96% lines

**Verification:**
- [ ] `just check && just test && just test-e2e` all pass
- [ ] Coverage report shows no degradation vs v1.1.3 baseline (100% funcs, 98.08% lines)

**Dependencies:** Task 4.2

**Files likely touched:**
- None (verification only)

**Estimated scope:** XS (0 files)

---

### Checkpoint: Tests Green
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass (15 scenarios)
- [ ] No regression in coverage
- [ ] `just check` clean
- [ ] Review with human before proceeding to Phase 5

---

### Phase 5: Documentation

#### Task 5.1: Update README.md
**Description:** Remove binary installation methods from README, keep only npm/bunx/npx.

**Acceptance criteria:**
- [ ] Section "If you don't have Bun installed or prefer a standalone binary" removed
- [ ] All `dist/codice-*` download links removed
- [ ] "Quick Install" section shows only `bunx @fisherk2-dev/codice`
- [ ] Troubleshooting section: remove "Permission denied (binary)" and "Binary not found after install" entries
- [ ] CI/CD badge remains (now reflects npm publish)

**Verification:**
- [ ] `grep -n "binary\|dist/codice" README.md` returns no false positives
- [ ] README renders correctly (markdown lint passes)
- [ ] Copy-paste installation commands work for non-technical users (SC-16)

**Dependencies:** Task 4.3

**Files likely touched:**
- `README.md`

**Estimated scope:** S (1 file)

---

#### Task 5.2: Update CONTRIBUTING.md
**Description:** Remove binary build instructions from CONTRIBUTING.md. Keep dev/test instructions.

**Acceptance criteria:**
- [ ] "Building" section: remove `just build` and `just build-all` instructions
- [ ] "Release Process" section: remove binary upload steps
- [ ] Keep: setup, test, lint, format, check, dev commands
- [ ] Conventional Commits guide remains
- [ ] PR process remains

**Verification:**
- [ ] `grep -n "build\|binary\|dist/" CONTRIBUTING.md` returns no false positives
- [ ] CONTRIBUTING.md is valid markdown
- [ ] Dev setup instructions are complete without binary references

**Dependencies:** Task 5.1

**Files likely touched:**
- `CONTRIBUTING.md`

**Estimated scope:** S (1 file)

---

#### Task 5.3: Update Wiki (Getting-Started.md)
**Description:** Remove binary references from GitHub Wiki pages synced from `docs/wiki-source/`.

**Acceptance criteria:**
- [ ] `docs/wiki-source/Getting-Started.md`: remove binary install section
- [ ] `docs/wiki-source/Installation.md` (if exists): remove binary references
- [ ] Wiki counts updated (no binary mention)
- [ ] Other Wiki pages checked for binary references

**Verification:**
- [ ] `grep -r "binary\|dist/codice" docs/wiki-source/` returns no false positives
- [ ] Wiki sync to `.wiki/` directory works: `rsync -a --delete --exclude='README.md' docs/wiki-source/*.md docs/wiki-source/.wiki/`
- [ ] Wiki is ready for commit/push to GitHub Wiki

**Dependencies:** Task 5.2

**Files likely touched:**
- `docs/wiki-source/Getting-Started.md`
- `docs/wiki-source/Installation.md` (if exists)

**Estimated scope:** S (1-2 files)

---

#### Task 5.4: Update TECH_DEBT.md
**Description:** Remove Section 7.1 (Binary Size Reduction) from TECH_DEBT.md since it's now resolved by FEV-11.

**Acceptance criteria:**
- [ ] Section 7.1 removed or marked as "RESOLVED in v1.2.0"
- [ ] "Resolved" section updated: add v1.2.0 entry with FEV-11 resolution
- [ ] Cross-reference to ADR-011 added
- [ ] Other sections unchanged

**Verification:**
- [ ] `grep -n "Binary Size" docs/TECH_DEBT.md` returns no active references
- [ ] TECH_DEBT.md is valid markdown
- [ ] v1.2.0 entry added to "Resolved" table

**Dependencies:** Task 5.3

**Files likely touched:**
- `docs/TECH_DEBT.md`

**Estimated scope:** XS (1 file)

---

#### Task 5.5: Update CHANGELOG.md
**Description:** Add v1.2.0 entry to CHANGELOG.md with breaking change notice.

**Acceptance criteria:**
- [ ] Section `[1.2.0] - 2026-XX-XX` added
- [ ] "Changed" subsection: "BREAKING: Binary compilation removed. Use `bunx @fisherk2-dev/codice` instead."
- [ ] "Removed" subsection: list of removed features
- [ ] "Added" subsection: ADR-011 documentation
- [ ] Migration instructions in "Changed" section

**Verification:**
- [ ] CHANGELOG.md follows Keep a Changelog format
- [ ] `grep -A 5 "1.2.0" CHANGELOG.md` shows complete entry
- [ ] Breaking change is clearly marked with `**BREAKING**`

**Dependencies:** Task 5.4

**Files likely touched:**
- `CHANGELOG.md`

**Estimated scope:** XS (1 file)

---

### Checkpoint: Documentation Updated
- [ ] README.md updated (no binary references)
- [ ] CONTRIBUTING.md updated
- [ ] Wiki pages updated
- [ ] TECH_DEBT.md updated (Section 7.1 resolved)
- [ ] CHANGELOG.md updated (v1.2.0 entry)
- [ ] All docs render correctly
- [ ] Review with human before proceeding to Phase 6

---

### Phase 6: Release

#### Task 6.1: Bump version to 1.2.0
**Description:** Update version number across all relevant files to 1.2.0.

**Acceptance criteria:**
- [ ] `package.json`: version = "1.2.0"
- [ ] No other version references to update (verified via grep)
- [ ] Version follows semver: minor bump (new feature: npm-only distribution)

**Verification:**
- [ ] `grep -r "1.1.3" package.json` returns no results
- [ ] `package.json` is valid JSON
- [ ] `git diff package.json` shows only version change

**Dependencies:** Task 5.5

**Files likely touched:**
- `package.json`

**Estimated scope:** XS (1 file)

---

#### Task 6.2: Create release PR
**Description:** Create a pull request from `feat/v1.2-fev-11` to `main` with all FEV-11 changes.

**Acceptance criteria:**
- [ ] Branch: `feat/v1.2-fev-11`
- [ ] All Phase 1-5 changes committed
- [ ] PR title: "feat(v1.2): remove binary compilation (FEV-11, Issue #46)"
- [ ] PR description includes:
  - Summary of changes
  - Breaking change notice
  - Migration path for affected users
  - Test results
  - Checklist of completed tasks
- [ ] CI passes on all 3 platforms

**Verification:**
- [ ] `gh pr list --head feat/v1.2-fev-11` shows PR
- [ ] CI status: ✅ all green
- [ ] PR description is complete and follows template

**Dependencies:** Task 6.1

**Files likely touched:**
- New branch `feat/v1.2-fev-11`
- All modified files from Phases 1-5

**Estimated scope:** M (PR creation, review, merge)

---

#### Task 6.3: Tag v1.2.0
**Description:** Create git tag v1.2.0 after PR is merged to main.

**Acceptance criteria:**
- [ ] Tag created: `v1.2.0`
- [ ] Tag annotation includes breaking change notice
- [ ] Tag is pushed to remote
- [ ] `git tag -l "v1.2*"` shows the tag

**Verification:**
- [ ] `git tag -l` includes v1.2.0
- [ ] `git ls-remote --tags origin | grep v1.2.0` shows remote tag
- [ ] Tag message is descriptive

**Dependencies:** Task 6.2

**Files likely touched:**
- None (git operation only)

**Estimated scope:** XS (1 command)

---

#### Task 6.4: Publish to npm
**Description:** Publish v1.2.0 to npm with `@latest` dist-tag. Release workflow handles this automatically on tag push.

**Acceptance criteria:**
- [ ] `release.yml` workflow triggers on v1.2.0 tag
- [ ] npm publish succeeds: `npm view @fisherk2-dev/codice@1.2.0` shows the version
- [ ] Package size < 5MB (SC-16 new criterion)
- [ ] `npm view @fisherk2-dev/codice dist-tags` shows `latest: 1.2.0`

**Verification:**
- [ ] `npm view @fisherk2-dev/codice@1.2.0` succeeds
- [ ] `bunx @fisherk2-dev/codice --version` shows 1.2.0
- [ ] Package tarball is available for download

**Dependencies:** Task 6.3

**Files likely touched:**
- None (automated by release.yml)

**Estimated scope:** XS (verification only)

---

### Checkpoint: Release Complete
- [ ] v1.2.0 published to npm
- [ ] Tag pushed to GitHub
- [ ] Release notes published (auto-generated from CHANGELOG)
- [ ] No binary artifacts attached
- [ ] Migration path documented
- [ ] **All FEV-11 DoD items completed** ✅

---

## DoD (Definition of Done) — FEV-11

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

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking change for <5% users | Medium | High | Document migration path in CHANGELOG, README, Wiki |
| E2E test failures after migration | Medium | Medium | Migrate incrementally, verify each scenario |
| CI/CD workflow errors | High | Low | Test on feature branch before merge |
| npm package size increase | Low | Low | Template files are small (<2MB), source is ~50KB |
| Wiki sync issues | Low | Low | Test rsync command locally before commit |
| Missing binary references in unexpected files | Medium | Medium | Comprehensive audit (Task 1.1) |

---

## Parallelization Opportunities

**Safe to parallelize:**
- Phase 1 tasks (1.1, 1.2, 1.3) — independent
- Phase 5 tasks (5.1, 5.2, 5.3, 5.4, 5.5) — independent docs updates
- Phase 2 tasks (2.1, 2.2, 2.3) — if no dependencies found

**Must be sequential:**
- Phase 2 → Phase 3 (build system depends on source code)
- Phase 3 → Phase 4 (tests depend on build system)
- Phase 4 → Phase 5 (docs depend on final code state)
- Phase 5 → Phase 6 (release depends on docs)

**Needs coordination:**
- CI/CD changes (3.2, 3.3) — test on feature branch first

---

## Open Questions

None. All decisions confirmed by user:
- ✅ Version: v1.2.0 (minor bump)
- ✅ E2E strategy: Eliminate + adapt (replace binary tests with bunx/bun run)
- ✅ GitHub Releases: Only stop adding new binaries (keep historical)
- ✅ Justfile: Remove build/build-all/release recipes

---

## Estimated Timeline

| Phase | Effort | Cumulative |
|-------|--------|------------|
| Phase 1: Foundation | 1.5h | 1.5h |
| Phase 2: Source Code | 1h | 2.5h |
| Phase 3: Build System | 2h | 4.5h |
| Phase 4: Tests | 3h | 7.5h |
| Phase 5: Documentation | 2.5h | 10h |
| Phase 6: Release | 1h | 11h |
| **Total** | **11h** | **11h** |

**Buffer:** +1h for unexpected issues = **12h total**

---

## Success Metrics

| Metric | Baseline (v1.1.3) | Target (v1.2.0) |
|--------|-------------------|-----------------|
| Tests passing | 596 / 0 fail | ≥585 / 0 fail |
| Coverage (functions) | 100% | ≥98% |
| Coverage (lines) | 98.08% | ≥96% |
| `just check` errors | 0 | 0 |
| E2E scenarios | 15/15 | 15/15 |
| npm package size | ~3MB | <5MB (new SC-16) |
| Binary artifacts in release | 3 (Linux, macOS, Windows) | 0 |
| Maintenance burden | Baseline | -30% (no cross-platform builds) |

---

## References

- **Issue:** [#46](https://github.com/fisherk2/codice-opencode/issues/46)
- **Diagnosis:** [fix04-v1.2-phase1-binary-removal.md](../diagnosis/fix04-v1.2-phase1-binary-removal.md)
- **ADR-006:** npm Publication as Primary Distribution
- **ADR-011:** Binary Removal (to be created in Task 1.2)
- **WORKFLOW.md:** FEV-11 phase definition
- **TECH_DEBT.md:** Section 7.1 (to be resolved)

---

_Plan created by Moctezuma (Strategic Planner) — 2026-07-27_
_Ready for human review via `question` tool_
