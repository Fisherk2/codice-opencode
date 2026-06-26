# Technical Debt — Códice v1.0.10 (planned)

**Generated:** 2026-06-26
**Status:** Live reference for improvement planning
**Coverage:** 97.66% functions / 96.52% lines (465 tests, 0 fail, 986 expects)
**Notes:** v1.0.10 will address FEV-2-D: directory support in TemplateResolver + optional files menu in Clean Install. This document tracks both resolved debt and newly discovered fragilities.

---

## 1. Coverage Gaps (Production Code)

### 1.1 `src/cli/main.ts` — 33.04% lines (66.67% functions)

| Item | Detail |
|------|--------|
| **Uncovered lines** | 85, 93–165 |
| **What's there** | Runtime execution path: dependency creation (`createDependencies`), mode dispatch (`runMode`), signal handling (SIGINT), error display, exit code logic |
| **Why it's low** | CLI entry point is intentionally thin (wiring + orchestration). It is tested via **6 E2E scenarios** (clean install, project install, update, optional skip, atomic rollback, path traversal) but Bun's `--coverage` only measures unit/integration tests, not E2E. All core logic lives in use cases and adapters which have 100% coverage. |
| **Risk** | Low. Every line is exercised during E2E. Manual smoke test also validates `--version`, `--help`, `--force`, `--verbose`, `--dest` flags. |
| **Recommendation** | Add integration tests that exercise the full `main()` flow via mock dependencies. This would bring coverage to ~100% lines. |

### 1.2 `src/domain/services/VersionComparator.ts` — 83.33% functions (100% lines)

| Item | Detail |
|------|--------|
| **Gap** | Implicit constructor counted by Bun coverage but not tracked as covered |
| **Why** | The class has no explicit constructor. Bun's coverage tool treats the synthetic `constructor()` as a separate function. All 5 explicit functions (`validateVersion`, `validateVersions`, `compare`, `isUpdateAvailable`, `getReleaseType`) are covered by 29 tests. All lines (1–112) are at 100%. |
| **Risk** | None. This is a **Bun coverage artifact**, not real tech debt. The constructor runs on every `new VersionComparator()` call in tests (line 12 of test file). |
| **Recommendation** | Accept as tool limitation. If needed for metrics, add an explicit no-op constructor to make it detectable as covered. |

### 1.3 `src/infrastructure/adapters/ClackPromptsAdapter.ts` — 93.75% functions (100% lines)

| Item | Detail |
|------|--------|
| **Gap** | Implicit constructor (same pattern as VersionComparator) |
| **Why** | Same Bun coverage artifact. All 11 explicit methods are covered by 19 tests. All lines at 100%. |
| **Risk** | None. Same artifact as §1.2. |
| **Recommendation** | Accept as tool limitation. |

---

## 2. Architectural Debt

### 2.1 `IFileSystem` Port — Staging Methods

| Item | Detail |
|------|--------|
| **Problem** | `IFileSystem` port (in `src/application/ports/IFileSystem.ts`) includes staging methods (`stageFile`, `commitStaging`, `cleanStaging`) alongside filesystem methods. Per Clean Architecture's Interface Segregation Principle (ISP), these should ideally live in a separate `IStagingSystem` or `IAtomicWriter` port. |
| **Why it's here** | Early design consolidated all filesystem operations into one interface for simplicity. The current design is functional and all 3 use cases consume the same interface. Separating would require updating all 3 use cases and their tests. |
| **Risk** | Low. Cohesion is high — staging IS a filesystem concern. The violation is minor. |
| **Recommendation** | Plan for v1.1.0 if the interface grows beyond 5 methods. Currently at 12 methods, which is acceptable. |

### 2.2 `pathResolver.ts` — Defense-in-Depth Guard (100% lines now)

| Item | Detail |
|------|--------|
| **Lines** | 23–26 (`if (!resolved.startsWith(rootWithSep))` throw) |
| **Status** | ✅ **Covered** as of 2026-06-16 (test with `"."` input) |
| **Note** | The guard is a safety net for future changes in path resolution behavior. It is technically unreachable with current Node.js/Bun `path.resolve()` behavior for any input that passes the first guard. Now documented and tested. |
| **Risk** | None. |

---

## 3. Dependency Debt

### 3.1 TypeScript 6.x Upgrade

| Item | Detail |
|------|--------|
| **Current** | `"typescript": "^5"` in `package.json` (resolves to ~5.8.x) |
| **Available** | TS 6.x is published and stable |
| **Impact** | Major version bump. TS 6.x introduces breaking changes in type inference, decorators, and module resolution. Requires thorough `tsc --noEmit` verification across the entire codebase. |
| **Risk** | Medium. TypeScript is a dev dependency only (runtime is Bun), so no production impact. But breaking changes could require code changes. |
| **Recommendation** | Defer to v1.1.0. Pin to `^5` for v1.0.x patch releases. |

### 3.2 Biome Version

| Item | Detail |
|------|--------|
| **Current** | `"@biomejs/biome": "^1"` (resolves to ~1.9.x → 2.5.0 as of 2026-06) |
| **Note** | Biome 2.x has new linter rules (`noForEach`, `useTopLevelRegex`, etc.) and assist features. Weekly lockfile updates keep us current within the `^1` range. |
| **Risk** | Low. Major bump to biome 2+ would be needed for new rules but is backward-compatible for formatting. |
| **Recommendation** | Update to `^2` range in v1.1.0 to get `organizeImports` assist and new lint rules. |

---

## 4. Test Infrastructure Debt

### 4.1 `tests/unit/setup/helpers.ts` — 83.33% lines (test file, not production)

| Item | Detail |
|------|--------|
| **Uncovered lines** | 88–90 (fallback path) |
| **Why** | Test helper for CI workflow schema validation. Lines 88–90 are a defensive fallback that only runs if `yaml.parse()` returns an unexpected structure. All normal paths are covered. |
| **Risk** | None. This is a test file; not shipped to production. |
| **Recommendation** | Accept as-is. Test infrastructure doesn't need 100% coverage. |

---

## 5. Process Debt

### 5.1 E2E Coverage Not Captured by `bun --coverage`

| Item | Detail |
|------|--------|
| **Problem** | Bun's `--coverage` flag only instruments code loaded during `bun test` (unit + integration). The 6 E2E scenarios that exercise `main.ts` (33% line coverage) and full binary paths are invisible to the coverage report. |
| **Impact** | `main.ts` shows 33% coverage despite being fully exercised in every E2E run. |
| **Mitigation** | E2E smoke gate in CI (`just test-e2e`) runs separately and must pass before any merge. Coverage targets are defined only for unit+integration tiers. |
| **Recommendation** | Explore NYC (Istanbul) instrumentation for E2E coverage if this becomes a reporting requirement. Currently not justified — E2E scenarios cover all critical paths. |

### 5.2 No Performance Benchmarks

| Item | Detail |
|------|--------|
| **Problem** | SPEC.md defines performance criteria (SC-9: local install < 5s, SC-10: API query < 3s, SC-11: TUI < 100ms) but no automated benchmarks enforce them. |
| **Risk** | Low. Current performance far exceeds thresholds (local install ~200ms, API query ~500ms with mock). Risk is regression if template size grows. |
| **Recommendation** | Add `just bench` recipe with `hyperfine` or `bun:bench` when template grows > 10MB or file count > 200. |

### 5.3 No Isolated Integration Test for npm Packaging

| Item | Detail |
|------|--------|
| **Problem** | Current integration tests use the local `template/` directory, which masks packaging issues that only appear in the published npm tarball (`bunx @fisherk2-dev/codice`). Two critical issues (FEV-2-B: symlinks, FEV-2-C: gitignore) were only detected AFTER release because the local test environment differs from the npm package. |
| **Proposed Solution (v1.1.0)** | Create an isolated integration test that: (1) builds the npm package with `bun pm pack`, (2) installs it in a temp directory, (3) runs the binary, (4) verifies template resolution, gitignore, and symlinks all work. |
| **Why it matters** | FEV-2-B and FEV-2-C were both npm packaging bugs that no test caught before release. An isolated test would detect these BEFORE shipping. |
| **Effort** | 4-6h for initial implementation. |
| **Risk** | Medium. Current workaround is to validate manually with `bunx` before release, but this is error-prone. |
| **Reference** | FEV-2-C plan (FE2C-T14), `docs/TECH_DEBT.md` section for v1.1.0 |

---

## 6. Resolved in v1.0.5

### 6.1 Issue #6 — Template Resolution in bunx/npm Mode (CRITICAL)

| Item | Detail |
|------|--------|
| **Problem** | `TemplateResolver.detectTemplateRoot()` failed when running via `bunx @fisherk2-dev/codice` because the template directory is located at `../template/` relative to `src/cli/main.ts`, not `../../template/` |
| **Root Cause** | Only two detection paths existed: compiled mode (`process.execPath`) and source mode (`import.meta.dir + '../../template/'`). The bunx/npm mode requires a third path: `import.meta.dir + '../template/'` |
| **Resolution** | Added third detection path in `TemplateResolver.detectTemplateRoot()`: `path.resolve(import.meta.dir, '../template/')` |
| **Files Changed** | `src/infrastructure/adapters/TemplateResolver.ts`, `tests/integration/TemplateResolver.test.ts` |
| **Status** | ✅ Fixed in v1.0.5 |

### 6.2 Issue #2 — Update Workspace Overwrites Standard Files (CRITICAL)

| Item | Detail |
|------|--------|
| **Problem** | `UpdateWorkspaceUseCase.buildUpdateRules()` converted ALL non-optional rules to `mandatory`, including `standard` rules. This caused `FileMergeEngine.shouldStage()` to skip the `destinationExists()` check, overwriting existing user files |
| **Root Cause** | Overly aggressive rule transformation: `rule.type === 'opcional' ? rule : new FileRule({ ...rule, type: 'mandatory' })` |
| **Resolution** | Modified transformation to only convert `obligatorio` to `mandatory`. `standard` rules retain their original type, preserving the `destinationExists()` check |
| **Files Changed** | `src/application/use-cases/UpdateWorkspaceUseCase.ts`, `tests/integration/UpdateWorkspaceUseCase.test.ts` |
| **Status** | ✅ Fixed in v1.0.5 |

### 6.3 Issue #3 — Credential File Permissions (MEDIUM)

| Item | Detail |
|------|--------|
| **Problem** | The AI agent's `permissions.read.deny` list in `opencode.json` only excluded `.env`, leaving other credential files (`.npmrc`, `.pem`, `*.key`, etc.) readable |
| **Resolution** | Extended deny list to include: `.env*`, `.npmrc`, `.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials.json`, `service-account*.json` |
| **Files Changed** | `template/obligatorio/opencode.json` |
| **Status** | ✅ Fixed in v1.0.5 |

### 6.4 Issue #4 — Broken Internal Links in Template Docs (MEDIUM)

| Item | Detail |
|------|--------|
| **Problem** | After reorganizing template into `obligatorio/`, `estandar/`, `opcional/` directories, relative links in markdown files broke (e.g., `skills/xlsx/SKILL.md` should be `../obligatorio/skills/xlsx/SKILL.md` from `estandar/`) |
| **Resolution** | Updated all internal links in `template/estandar/README.md`, `template/estandar/CONTRIBUTING.md`, and `template/obligatorio/AGENTS.md` to use correct relative paths |
| **Files Changed** | `template/estandar/README.md`, `template/estandar/CONTRIBUTING.md`, `template/obligatorio/AGENTS.md` |
| **Status** | ✅ Fixed in v1.0.5 |

### 6.5 Issue #5 — TECH_DEBT.md Missing from Template (LOW)

| Item | Detail |
|------|--------|
| **Problem** | `TECH_DEBT.md` exists in the repository's `docs/` but was not included in the installed template, so users couldn't access the technical debt catalog |
| **Resolution** | Created `template/estandar/TECH_DEBT.md` as a placeholder that references the canonical document in the repository |
| **Files Changed** | `template/estandar/TECH_DEBT.md` (new) |
| **Status** | ✅ Fixed in v1.0.5 |

### 6.6 Ship Review Observations (v1.0.5)

| # | Observation | Resolution | Files Changed |
|---|-------------|------------|---------------|
| I1 | `Dependencies` interface leaks concrete types (BunFileSystem, ClackPromptsAdapter) | Changed to `IFileSystem` / `IUserPrompt` port types. Added `promptForMode()` to `IUserPrompt` | container.ts, main.ts, IUserPrompt.ts, 4 test mocks |
| I2 | Bash deny patterns undocumented | Added `_comment` / `_comment_suffix` fields explaining `* .file` vs `* .file *` convention | opencode.json |
| M1 | CWD fallback silent in TemplateResolver | Added `console.warn` with Biome suppression | TemplateResolver.ts |
| M2 | `CODICE_GITHUB_API_URL` no validation | URL validated for HTTPS protocol + github.com hostname with fallback warning | constants.ts |
| S1 | FileRule category undocumented | Spanish→English mapping (obligatorio→mandatory, estandar→standard, opcional→optional) in JSDoc | FileRule.ts |
| S2 | Source-stubs missing interfaces | Added `IFileMergeEngine` and `IVersionComparator` entries | source-stubs.test.ts |
| S4 | commitStaging on empty undocumented | Clarifying comment added in FileMergeEngine | FileMergeEngine.ts |
| S6 | Symlink skip not logged | `verbose` parameter added to `walkDirectory()`; logs to stderr | directoryWalker.ts |
| S7 | Version file no validation | Field-level type guards on `.codice-version` JSON fields | UpdateWorkspaceUseCase.ts |
| S8 | Dependencies minor/patch stale | `bun update`: @biomejs/biome 2.5.0→2.5.1, @clack/prompts 1.5.1→1.6.0, semver 7.8.4→7.8.5 | package.json, bun.lock |

| **Verification** | `bun test`: 382 pass / 0 fail, `just check`: clean, E2E: 6/6 |
| **Status** | ✅ All 10 observations resolved in v1.0.5 |

### 6.7 Issue #11 — npm Excludes .gitignore from Package (CRITICAL, resolved in v1.0.9)

| Item | Detail |
|------|--------|
| **Problem** | `bunx @fisherk2-dev/codice` failed with `Template file not found: .gitignore` in all 3 install modes (Clean, Project, Update). |
| **Root Cause** | npm has hardcoded behavior that excludes `.gitignore` files from packages, even when listed in the `files` field of `package.json`. The file existed locally (2930 bytes) but was not in the published tarball. |
| **Evidence** | `npm pack --dry-run 2>&1 | grep gitignore` returned no output. |
| **Resolution** | Renamed `template/estandar/.gitignore` → `template/estandar/gitignore` (no dot prefix) and generate `.gitignore` post-installation via `BunGitignoreCreator` (same pattern as FEV-2-B symlinks). Created `IGitignoreCreator` port + `BunGitignoreCreator` adapter. |
| **Files Changed** | `template/estandar/gitignore` (renamed), `FileRuleManifestData.ts` (removed entry), `IGitignoreCreator.ts`, `GitignoreError.ts`, `BunGitignoreCreator.ts`, `CleanInstallUseCase.ts`, `ProjectInstallUseCase.ts`, `container.ts`, 4 test files, 2 E2E scripts |
| **Status** | ✅ Fixed in v1.0.9 |
| **Verification** | `bun test`: 457 pass / 0 fail, `just check`: clean, E2E: 12/12 |

**Known limitation:** npm also excludes `.gitignore` files nested at any depth (e.g., `template/obligatorio/skills/ui-ux-design-pro/cli/.gitignore`). These files are not part of the user-facing workspace template — they serve internal skill development purposes — so they are currently unaddressed. If a future skill or feature needs its `.gitignore` shipped in the npm package, apply the same rename pattern: `file.gitignore` → `file_gitignore` with post-install generation. (REF: FEV-2-C code review S7)

### 6.8 Ship Review Observations (v1.0.9)

| # | Observation | Resolution | Files Changed |
|---|-------------|------------|---------------|
| I1/M1 | Path containment defense-in-depth missing in BunGitignoreCreator | Added `workspaceRoot` parameter + `startsWith()` containment check consistent with BunSymlinkCreator pattern | BunGitignoreCreator.ts, container.ts, 1 test file |
| I2 | Directory-skip warning gated behind verbose | Made unconditional — anomalous condition should always be visible | BunGitignoreCreator.ts |
| G1 | ProjectInstallUseCase gitignore error handling untested | Added test verifying warning shown without install failure | project-install.test.ts |
| G2 | Verbose parameter untested in BunGitignoreCreator | Added 2 tests: verbose=true emits `console.warn`, verbose=undefined defaults to false | bun-gitignore-creator.test.ts |
| G3 | Update mode gitignore exclusion untested | Added test verifying no `.gitignore` warnings in update mode | update-workspace.test.ts |
| G4 | E2E content validation shallow | Enhanced to compare header against template + check multiple signature patterns | 11-gitignore-clean-install.sh |
| G5 | No E2E for directory at .gitignore path | Added Test 3: pre-existing dir is skipped gracefully | 12-gitignore-project-install.sh |
| S4 | gitignoreTemplateNotFoundError message hardcoded path | Added optional `templatePath` parameter for dynamic message | GitignoreError.ts, BunGitignoreCreator.ts |
| S5 | Warning text lacks `--verbose` hint | Appended `"Run with --verbose for details."` to gitignore warnings | CleanInstallUseCase.ts, ProjectInstallUseCase.ts |
| S7 | Nested .gitignore files excluded by npm | Documented in TECH_DEBT.md `§6.7 Known limitation` | TECH_DEBT.md |
| SecLow | validateDestPath system dir check uses exact match | Improved to prefix-based matching | parse-args.ts |

| **Verification** | `bun test`: >457 pass / 0 fail, `just check`: clean, E2E: 12/12 |
| **Status** | ✅ All 11 observations resolved in v1.0.9 |

### 6.9 FEV-2-D Issues (v1.0.10)

| Item | Detail |
|------|--------|
| **Problem 1** | `.devin` directory not found in Clean Install and Project Install modes. |
| **Root Cause** | `FileRuleManifestData.ts` has an entry for `.devin` as if it were a file, but it's actually a directory containing `rules/`, `skills` (symlink), and `workflows` (symlink). `TemplateResolver.resolvePath()` is designed to resolve files, not directories. |
| **Impact** | Users cannot install the `.devin` optional directory in either Clean Install or Project Install mode. |
| **Resolution** | Implement native directory support in `TemplateResolver`: detect directories via `fs.stat()`, copy recursively using `BunFileSystem.copyDirectoryRecursive()`. |
| **Status** | 🟡 In progress (FEV-2-D) |

| Item | Detail |
|------|--------|
| **Problem 2** | Clean Install copies all optional files automatically without showing the selection menu. |
| **Root Cause** | `CleanInstallUseCase` is designed to copy everything (obligatorio + estándar + opcional) without user interaction. This is inconsistent with `ProjectInstallUseCase` which shows the optional files selection menu. |
| **Impact** | Inconsistent UX between Clean Install and Project Install. Users have no control over which optional files to include in Clean Install. |
| **Resolution** | Modify `CleanInstallUseCase` to show the same optional files selection menu as `ProjectInstallUseCase`. |
| **Status** | 🟡 In progress (FEV-2-D) |

---

## 7. Summary & Prioritization

### Planned (v1.0.10)
| Item | Effort | Impact |
|------|--------|--------|
| Directory support in TemplateResolver (FEV-2-D) | 4h | Fixes `.devin` directory resolution |
| Optional files menu in Clean Install (FEV-2-D) | 2h | Consistent UX with Project Install |
| ADR-010: Directory support in template system | 1h | Document architectural decision |

### Planned (v1.1.0)
| Item | Effort | Impact |
|------|--------|--------|
| Isolated integration test for npm packaging (simulate `bunx` from temp dir) | 6h | Catches packaging bugs before release |
| Integration tests for `main.ts` | 4h | Coverage 33% → 95% lines |
| Explicit constructors in `VersionComparator` + `ClackPromptsAdapter` | 15min | Silence coverage artifact |
| TypeScript 6.x upgrade | 2h | Modern TS features |
| Biome `^2` range update | 30min | New linter rules + organize imports assist |
| `IFileSystem` port split | 3h | ISP compliance |

### Future (v1.2.0+)
| Item | Effort | Impact |
|------|--------|--------|
| E2E coverage instrumentation | 8h | Accurate coverage for entry point |
| `just bench` performance benchmarks | 4h | Regression detection for SC-9/10/11 |

---

*Maintained by Códice team. Update when tech debt items are added or resolved.*
