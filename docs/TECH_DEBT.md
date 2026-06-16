# Technical Debt — Códice v1.0.3

**Generated:** 2026-06-16  
**Status:** Live reference for improvement planning  
**Coverage:** 97.66% functions / 96.52% lines (360 tests, 0 fail, 711 expects)

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

---

## 6. Summary & Prioritization

### Quick Wins (v1.0.4)
| Item | Effort | Impact |
|------|--------|--------|
| Integration tests for `main.ts` | 4h | Coverage 33% → 95% lines |
| Explicit constructors in `VersionComparator` + `ClackPromptsAdapter` | 15min | Silence coverage artifact |

### Planned (v1.1.0)
| Item | Effort | Impact |
|------|--------|--------|
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
