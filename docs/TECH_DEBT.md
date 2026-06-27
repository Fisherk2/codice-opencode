# Technical Debt — Códice

**Last updated:** 2026-06-26
**Status:** Active reference for improvement planning
**Current version:** v1.0.11 (476 tests, 0 fail, 1032 expects, 97.66% funcs / 96.52% lines)

---

## Resolved

All resolved debt has been removed from this document. For historical reference, see git history prior to v1.0.11.

---

## 1. Coverage Gaps

### 1.1 `src/cli/main.ts` — 33.04% lines (66.67% functions)

| Item | Detail |
|------|--------|
| **Uncovered lines** | 85, 93–165 |
| **What's there** | Runtime execution path: dependency creation, mode dispatch, signal handling, error display, exit code logic |
| **Why it's low** | CLI entry point is intentionally thin (wiring + orchestration). It is tested via **15 E2E scenarios** but Bun's `--coverage` only measures unit/integration tests. All core logic lives in use cases and adapters which have 100% coverage. |
| **Risk** | Low. Every line is exercised during E2E. |
| **Recommendation** | Add integration tests that exercise the full `main()` flow via mock dependencies. Coverage → ~95% lines. |
| **Target** | v1.1.0 |
| **Effort** | 4h |

### 1.2 Coverage artifacts (no real debt)

`VersionComparator.ts` (83.33% functions) and `ClackPromptsAdapter.ts` (93.75% functions) show incomplete function coverage due to implicit constructors counted as separate functions by Bun. Both have 100% line coverage. These are **Bun coverage tool artifacts**, not real debt.

---

## 2. Architectural Debt

### 2.1 `IFileSystem` Port — Staging Methods

| Item | Detail |
|------|--------|
| **Problem** | `IFileSystem` includes staging methods (`stageFile`, `commitStaging`, `cleanStaging`) alongside filesystem methods. Per ISP, these should live in a separate `IStagingSystem` port. |
| **Why it's here** | Early design consolidated operations for simplicity. All 3 use cases consume the same interface. |
| **Risk** | Low. Cohesion is high — staging IS a filesystem concern. Currently 12 methods. |
| **Recommendation** | Split into `IFileSystem` + `IStagingSystem` when interface grows beyond 5 methods or when adding a 4th use case. |
| **Target** | v1.1.0 |
| **Effort** | 3h |

---

## 3. Dependency Debt

### 3.1 TypeScript 6.x Upgrade

| Item | Detail |
|------|--------|
| **Current** | `"typescript": "^5"` (~5.8.x) |
| **Available** | TS 6.x (stable) |
| **Impact** | Major version bump. Breaking changes in type inference, decorators, module resolution. Requires thorough `tsc --noEmit` verification. |
| **Risk** | Medium. Dev dependency only (runtime is Bun). No production impact. |
| **Recommendation** | Pin to `^5` for v1.0.x patches. Upgrade to `^6` in v1.1.0 after verification. |
| **Target** | v1.1.0 |
| **Effort** | 2h |

### 3.2 Biome `^2` Range Update

| Item | Detail |
|------|--------|
| **Current** | `"@biomejs/biome": "^1"` (~1.9.x) |
| **Available** | Biome 2.x (stable, new linter rules + `organizeImports` assist) |
| **Risk** | Low. Backward-compatible for formatting. |
| **Recommendation** | Update to `^2` range in v1.1.0. |
| **Target** | v1.1.0 |
| **Effort** | 30min |

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

### 5.3 No Isolated Integration Test for npm Packaging

| Item | Detail |
|------|--------|
| **Problem** | Local tests use `template/` directly, masking packaging issues that only appear in the npm tarball. FEV-2-B (symlinks) and FEV-2-C (gitignore) were both caught AFTER release. |
| **Proposed solution** | Test that: (1) builds npm package with `bun pm pack`, (2) installs in temp dir, (3) runs binary, (4) verifies template resolution, gitignore, and symlinks work. |
| **Risk** | Medium. Current workaround: manual `bunx` validation before release (error-prone). |
| **Target** | v1.1.0 |
| **Effort** | 6h |

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

### v1.1.0

| Item | Effort | Impact |
|------|--------|--------|
| Isolated integration test for npm packaging | 6h | Catches packaging bugs before release |
| Integration tests for `main.ts` | 4h | Coverage 33% → 95% lines |
| TypeScript 6.x upgrade | 2h | Modern TS features |
| Biome `^2` range update | 30min | New linter rules + organize imports assist |
| `IFileSystem` port split (ISP) | 3h | Interface Segregation Principle compliance |
| Explicit constructors in `VersionComparator` + `ClackPromptsAdapter` | 15min | Silence coverage artifact |

### Future (v1.2.0+)

| Item | Effort | Impact |
|------|--------|--------|
| Binary size reduction (74MB → <20MB) | 8-12h | 73% smaller downloads, faster installs, lower CDN costs |
| E2E coverage instrumentation | 8h | Accurate coverage for entry point |
| `just bench` performance benchmarks | 4h | Regression detection for SC-9/10/11 |

---

*Maintained by Códice team. Update when tech debt items are added or resolved.*
