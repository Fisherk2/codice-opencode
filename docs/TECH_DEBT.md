# Technical Debt — Códice

**Last updated:** 2026-07-11
**Status:** Active reference for improvement planning
**Current version:** v1.1.1 (586 tests, 0 fail, 1255 expects, 100.00% funcs / 98.08% lines)

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

### 7.1 Binary Size Reduction — 74MB → <20MB

| Item | Detail |
|------|--------|
| **Problem** | Compiled binaries are too large: `codice-linux` is **74MB** (ELF x64). macOS and Windows builds are similar. This exceeds reasonable download sizes for a CLI tool and bloats GitHub Release assets. |
| **Root cause** | Bun's `--compile` bundles the entire runtime + all dependencies + the embedded template directory into a single executable. The template alone (agents, skills, commands, docs) is substantial, and Bun includes its full JS runtime regardless of what's used. |
| **Impact** | Users downloading via `curl` or GitHub Releases wait longer. npm package size also increases. CDN and storage costs grow. Competing CLI tools (e.g., `gh`, `rg`) ship binaries <10MB. |
| **Target** | <20MB per platform binary (73% reduction from current 74MB). |
| **Proposed strategies** | 1. **Externalize template**: Ship template as a separate npm package or downloadable tarball instead of embedding in the binary. Binary becomes a pure installer/downloader. 2. **Bun tree-shaking**: Investigate `--minify` and dead code elimination flags. 3. **UPX compression**: Compress binaries with UPX (adds runtime decompression, ~30-50% reduction). 4. **Lazy template fetch**: Binary fetches template from GitHub Releases API on first run, caching locally. |
| **Trade-offs** | Externalizing template adds a network dependency on first install. UPX adds antivirus false positives. Lazy fetch requires internet. Best approach: externalize template + keep offline fallback via `--offline` flag using embedded template. |
| **Risk** | Medium. Externalizing template changes the distribution model. Requires ADR before implementation. |
| **Target release** | v1.2.0 |
| **Effort** | 8-12h (including ADR, implementation, and cross-platform testing) |

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

### Future (v1.2.0+)

| Item | Effort | Impact |
|------|--------|--------|
| Binary size reduction (74MB → <20MB) | 8-12h | 73% smaller downloads, faster installs, lower CDN costs |
| E2E coverage instrumentation | 8h | Accurate coverage for entry point |
| `just bench` performance benchmarks | 4h | Regression detection for SC-9/10/11 |
| CleanInstall/ProjectInstall Template Method refactor | 4h | Eliminate ~80 lines duplication, prepare for new install modes |

---

*Maintained by Códice team. Update when tech debt items are added or resolved.*
