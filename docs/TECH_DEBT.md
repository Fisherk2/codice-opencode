# Technical Debt — Códice

**Last updated:** 2026-07-30
**Status:** Active reference for improvement planning
**Current version:** v1.2.0 (844 tests, 0 fail)

---

## Resolved

### v1.1.0 (FEV-10 — 2026-07-10)

| ID | Item | Resolution |
|----|------|------------|
| **TD-1.1** | `src/cli/main.ts` coverage | ✅ 33.04% → 86.21% lines (100% functions). 13 new integration tests with mock process.exit, process.on, and real --clean/--update flows. Interactive mode (lines 138-144) and catch block (lines 160-163) remain uncovered — require TTY interaction or unexpected runtime throws. |
| **TD-2.1** | IFileSystem split (ISP) | ✅ Split into `IFileSystem` (6 methods) + `IStagingSystem` (4 methods). `BunFileSystem` implements both. 15 files modified. |
| **TD-3.1** | TypeScript 6.x upgrade | ✅ 5.9.3 → 6.0.3. No breaking changes (modern tsconfig avoids all deprecated options). |
| **TD-3.2** | Biome 2.x update | ✅ Already done before FEV-10 (`^2.5.3`, schema 2.5.0). |
| **TD-5.3** | npm packaging integration tests | ✅ 5 new tests (A-E) using `bun pm pack` to validate tarball structure, symlink exclusion, gitignore exclusion, --version, and clean install from extracted package. |

### v1.1.1 (2026-07-11)

| ID | Item | Resolution |
|----|------|------------|
| **TD-CR-1** | Code review fixes: GitHubRestClient catch simplification, UpdateWorkspaceUseCase helper normalization, Windows SYSTEM_DIRS, resolveWithinRoot normalization, VERSION module extraction, AtomicStager fs.copyFile, CleanInstall/ProjectInstall duplication documented | ✅ All 11 code review findings resolved (4 Important, 7 Suggestions) |

### FEV-13 — Documentation Overhaul + SDD Plugin Decoupling (2026-07-29)

| ID | Item | Resolution |
|----|------|------------|
| **Issue #53** | SDD plugin coupling — 6 hardcoded maps (`COMMAND_AGENT_MAP`, `VALID_SUBAGENTS`, `AGENT_MENTION_PATTERNS`, `INTENT_PATTERNS`, `COMMAND_PHASE_MAP`, `PHASE_SUGGESTIONS`) required manual editing of `sdd-pipeline.ts` for every new command/agent/skill | ✅ Extracted to `autoDiscovery.ts` (filesystem scanning) + `defaults.ts` (config-driven defaults). Auto-discovery detects commands/agents from filesystem; config loaded from `opencode.json` `sddPipeline` section. Plugin reduced from 665→<400 lines. |
| **Issue #51** | Documentation outdated in `docs/` and `template/estandar/docs/`; Wiki pages referenced internal implementation details ("edit sdd-pipeline.ts") | ✅ 8 Wiki pages rewritten for end users. WORKFLOW.md, CHANGELOG.md, SPEC.md under target line counts. ADR-013 created. |

### FEV-14 — UX Enhancements (2026-07-30)

| ID | Item | Resolution |
|----|------|------------|
| **CRITICAL-1** | Progress bar re-created on every `stage_start` event | ✅ Added `barStarted` closure flag in `createProgressCallback()`. Bar initializes once on first `stage_start`, advances on subsequent events. |
| **CRITICAL-2** | Symlink/gitignore log events emitted BEFORE operations | ✅ Moved 4 log event lines from `CleanInstallUseCase` and `ProjectInstallUseCase` into `postInstall.ts:runPostInstallSteps()` — each log now emits AFTER the corresponding operation completes. |
| **IMPORTANT-1** | Progress `total` included skipped files, never reaching 100% | ✅ `FileMergeEngine` pre-computes `stageDecisions` Map; `total` counts only files that pass `shouldStage`. `current++` moved after the check. |
| **IMPORTANT-2** | Inline `import()` types in test file | ✅ Top-level `import type { ProgressEvent }` added; 6 inline references replaced. |
| **IMPORTANT-3** | DRY violation — 4 log event lines duplicated in 2 use cases | ✅ Resolved by CRITICAL-2 fix (events now live in shared `postInstall.ts`). |
| **SUGGESTION-1** | Redundant `completeProgress()` calls in 3 use cases | ✅ Removed 3 redundant calls — callback already handles via `error`/`commit_complete` events. |

### FEV-15 — Community Standards (2026-07-30)

| ID | Item | Resolution |
|----|------|------------|
| **Issue #55** | Community standards — project lacks Code of Conduct | ✅ `CODE_OF_CONDUCT.md` created (Contributor Covenant v2.1). `template/estandar/CODE_OF_CONDUCT.md` created as customizable placeholder. Manifest entry added in `FileRuleManifestData.ts`. Cross-references in `CONTRIBUTING.md` and `README.md`. E2E test extended. |

### FEV-16 — Pre-release Tech Debt Closure (2026-07-30)

| ID | Item | Resolution |
|----|------|------------|
| **TD-1.1** | `src/cli/main.ts` coverage gap (interactive mode + catch block) | ✅ `resolveInteractiveMode()` extracted. 10 new tests (9 unit + 1 mock.module). Coverage 86.21% → 98.90%. |
| **TD-2.1** | CleanInstall/ProjectInstall duplicación (~80 líneas) | ✅ Template Method pattern. `InstallUseCaseBase` created. 313 → 145 lines (-168). |
| **TD-5.1** | E2E Coverage Not Captured by `bun --coverage` | ✅ `c8` evaluated (incompatible with Bun/JSC™). Native Bun coverage + CI gate ≥95%. |
| **TD-5.2** | No Performance Benchmarks | ✅ `just bench` + 3 standalone scripts + `assert-no-regression.sh`. SC-9/10/11 benchmarked. |
| **TD-6.2** | Standard Directory Updates Are All-or-Nothing | ✅ Tree-level diff (`diffTrees()`) in FileMergeEngine. New files delivered, existing files preserved. 11+3+1 tests. |

**Known test pattern** (2026-07-30): `MinimalInstallUseCase` test stub uses `{} as any` for 7 dependency mocks in `install-use-case-base.test.ts`. Acceptable for now — the stub is minimal, the `eslint-disable` comment is clear, and full mocks would bloat the test. Revisit if this pattern spreads to other test files.

### Prior (v1.0.11)

All resolved debt from v1.0.11 and earlier removed. For historical reference, see git history.

---

## 1. Coverage Gaps

### 1.1 `src/cli/main.ts` — 86.21% lines (100.00% functions)

| Item | Detail |
|------|--------|
| **Uncovered lines** | 85, 138–144, 160–161, 163 |
| **What's there** | Line 85: re-export. Lines 138-144: interactive mode (@clack/prompts blocks in non-TTY). Lines 160-161, 163: catch block (defensive, only triggers on unexpected throws). |
| **Risk** | Low. All three modes (clean, project, update) tested via E2E. Interactive mode tested via `promptForMode` export. Catch block is defense-in-depth. |
| **Recommendation** | Extract interactive mode body into a testable exported function. Subscribe to TTY-aware test patterns. |
| **Target** | Future (v1.2.0+) |
| **Effort** | 2h |

### 1.2 Coverage artifacts (no real debt)

`VersionComparator.ts` (83.33% functions) and `ClackPromptsAdapter.ts` (93.75% functions) show incomplete function coverage due to implicit constructors counted as separate functions by Bun. Both have 100% line coverage. These are **Bun coverage tool artifacts**, not real debt.

---

## 2. Architectural Debt

### 2.1 CleanInstallUseCase / ProjectInstallUseCase duplicación (~80 líneas)

| Item | Detail |
|------|--------|
| **Problem** | `CleanInstallUseCase` (162 líneas) y `ProjectInstallUseCase` (139 líneas) comparten same constructor signature (7 parámetros idénticos), mismo flujo `execute()` (checkWritable → confirmOverwrite → selectOptionals → merge → postInstall), y métodos `confirmOverwrite()`/`runPostInstall()` casi idénticos. |
| **Differences** | (1) `buildRules()`: Clean convierte todo a mandatory; Project pasa manifest tal cual. (2) `selectOptionals()`: Clean con force selecciona todos; Project retorna vacío. (3) Mensajes de confirmación/éxito. |
| **Proposed fix** | Template Method pattern: extraer clase base `InstallUseCaseBase` con flujo común y hooks para las 3 variaciones. |
| **Risk** | Low. La duplicación es explícita y ambas clases ya delegaron la lógica compartida a `helpers.ts` y `postInstall.ts`. |
| **Recommendation** | Aplicar Rule of Three: esperar a un cuarto modo de instalación antes de refactorizar. |
| **Target** | v1.2.0+ (o cuando surja un nuevo modo) |
| **Effort** | 4h |

---

## 3. Dependency Debt

*(No dependency debt items currently open.)*

---

## 4. Test Infrastructure

### 4.1 `tests/unit/setup/helpers.ts` — 83.33% lines

| Item | Detail |
|------|--------|
| **Uncovered lines** | 88–90 (defensive fallback for unexpected `yaml.parse()` structure) |
| **Risk** | None. Test file, not shipped to production. |
| **Recommendation** | Accept as-is. Test infrastructure doesn't need 100% coverage. |

---

## 5. Process Debt

### 5.1 E2E Coverage Not Captured by `bun --coverage`

| Item | Detail |
|------|--------|
| **Problem** | Bun's `--coverage` only instruments code loaded during `bun test`. The 14 E2E scenarios exercising `main.ts` are invisible to coverage reports. |
| **Impact** | `main.ts` shows 33% coverage despite being fully exercised in every E2E run. |
| **Mitigation** | E2E smoke gate in CI (`just test-e2e`) runs separately and must pass before merge. |
| **Recommendation** | Explore NYC (Istanbul) instrumentation for E2E coverage if reporting requirement emerges. |
| **Target** | Future (v1.2.0+) |
| **Effort** | 8h |

### 5.2 No Performance Benchmarks

| Item | Detail |
|------|--------|
| **Problem** | SPEC.md defines performance criteria (SC-9: <5s, SC-10: <3s, SC-11: <100ms) but no automated benchmarks enforce them. |
| **Risk** | Low. Current performance far exceeds thresholds. Risk is regression if template grows. |
| **Recommendation** | Add `just bench` recipe with `hyperfine` when template grows > 10MB or file count > 200. |
| **Target** | Future (v1.2.0+) |
| **Effort** | 4h |

---

---



## 6. Known Limitations

### 6.1 Nested `.gitignore` files excluded by npm

npm excludes `.gitignore` files at any depth. Files like `template/obligatorio/skills/ui-ux-design-pro/cli/.gitignore` are not in the published tarball. These serve internal skill development purposes, not user-facing workspace. If a future skill needs its `.gitignore` shipped, apply the rename pattern: `file.gitignore` → `file_gitignore` with post-install generation. (REF: FEV-2-C code review S7)

### 6.2 Standard Directory Updates Are All-or-Nothing

Standard directories (`docs/`, `specs/`, `tasks/`) are treated as a single unit
during Update Workspace. If the directory exists in the destination, the
entire directory is skipped — new files added to that directory in a
template update won't reach existing users. This is consistent with SPEC
("Estándar copied only if missing") but operates at directory granularity,
not file granularity.

| Item | Detail |
|------|--------|
| **Problem** | `FileMergeEngine.shouldStage()` checks `destinationExists(directory)` and skips the entire directory rule if it exists. New files within a standard directory are never delivered to existing users. |
| **Root cause** | Standard rules are path-level, not file-level. A rule for `docs/` stages the entire `docs/` tree or skips it entirely. |
| **Impact** | Low. Users can manually copy new standard files if needed. Template authors should place new content in new directories to ensure delivery. |
| **Recommendation** | Implement tree-level diffing for standard directories during Update mode: compare template and destination file lists, then stage only new/missing files. |
| **Target** | v1.2.0+ |
| **Effort** | 6h |

---

## 7. Performance & Distribution

### 7.1 Binary Size Reduction — RESOLVED in v1.2.0

| Item | Detail |
|------|--------|
| **Problem** | Compiled binaries are too large: `codice-linux` is **74MB** (ELF x64). macOS and Windows builds are similar. This exceeds reasonable download sizes for a CLI tool and bloats GitHub Release assets. |
| **Resolution** | **FEV-11 (Issue #46):** Remove all binary compilation and distribution logic. The only installation method will be via package managers (npm/bunx). This eliminates the binary size problem entirely by removing binaries. See [fix04-v1.2-phase1-binary-removal.md](diagnosis/fix04-v1.2-phase1-binary-removal.md). |

---

## Summary & Prioritization

### v1.1.1 ✅ All resolved

| Item | Resolution |
|------|------------|
| Isolated integration test for npm packaging | ✅ 5 tests (A-E) |
| Integration tests for `main.ts` | ✅ 33% → 86.21% lines (+13 tests) |
| TypeScript 6.x upgrade | ✅ 5.9.3 → 6.0.3 |
| Biome `^2` range update | ✅ Already `^2.5.3` |
| `IFileSystem` port split (ISP) | ✅ IFileSystem (6) + IStagingSystem (4) |
| Explicit constructors in `VersionComparator` + `ClackPromptsAdapter` | ✅ Resolved in FEV-6 (v1.1.0) |

### v1.2.0

| Item | Effort | Impact | Diagnosis |
|------|--------|--------|-----------|
| FEV-11: Binary removal (Issue #46) — BREAKING | — | ✅ npm-only distribution as per ADR-011. Binary compilation removed from build system, CI/CD, E2E tests, and docs. | [fix04-v1.2-phase1-binary-removal.md](diagnosis/fix04-v1.2-phase1-binary-removal.md) |
| FEV-12: References restructuring (Issues #54, #52) | 8h | ✅ Completado — Self-contained skills, configurable references | [fix05-v1.2-phase2-references.md](diagnosis/fix05-v1.2-phase2-references.md) |
| FEV-13: Documentation overhaul (Issues #51, #53) | 12h | ✅ Completado — Auto-discovery + config-driven + quality infra + Wiki rewrite | [fix06-v1.2-phase3-documentation.md](diagnosis/fix06-v1.2-phase3-documentation.md) |
| FEV-14: UX enhancements (Issues #47, #56) | 6h | ✅ Completado — Progress bar + /help command + 6 code review fixes | [fix07-v1.2-phase4-ux.md](diagnosis/fix07-v1.2-phase4-ux.md) |
| FEV-15: Community standards (Issue #55) | 2h | ✅ Completado — Code of conduct for project and template | [fix08-v1.2-phase5-community.md](diagnosis/fix08-v1.2-phase5-community.md) |
| FEV-16: Pre-release Tech Debt Closure | 24h | ✅ Completo — TD-1.1, 2.1, 5.1, 5.2, 6.2 | TD-1.1, 2.1, 5.1, 5.2, 6.2 |

### v1.3.0

The following items are planned for v1.3 and beyond. No diagnosis has been created yet — these will be addressed after v1.2 is complete.

#### Alternative Package Managers — Issue #24

| Item | Detail |
|------|--------|
| **Issue** | [#24](https://github.com/fisherk2/codice-opencode/issues/24) — Añadir mas opciones de instalacion |
| **Description** | Implement and maintain alternative package managers to npm in case of incidents. Proposals: uv with pip, cargo, composer, pnpm, yarn. |
| **Risk** | Medium. Multiple package managers increase maintenance burden and testing complexity. |
| **Target** | v1.3 |
| **Effort** | 8-12h (including testing across multiple package managers) |

#### Internationalization (i18n) — Issue #22

| Item | Detail |
|------|--------|
| **Issue** | [#22](https://github.com/fisherk2/codice-opencode/issues/22) — Añadir accesibilidad de idiomas |
| **Description** | Add language selection at CLI startup. Options: (1) Manual selection from 5 languages (English, Spanish, + 3 more), (2) Automatic detection based on host locale. All interactive menu text must be translated. |
| **Risk** | Medium. Requires i18n infrastructure, translation files, and locale detection logic. |
| **Target** | v1.3 |
| **Effort** | 6-10h (including translation infrastructure and 5 language translations) |

---

*Maintained by Códice team. Update when tech debt items are added or resolved.*
