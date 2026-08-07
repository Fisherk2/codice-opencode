# Technical Debt — Códice

**Last updated:** 2026-08-07
**Status:** FEV-23 complete — v2.0.0 release-ready (1880 tests, 30/30 E2E, coverage 93.78% overall / 99.48% production src/)
**Current version:** v2.0.0 (1880 tests, 0 fail)
**Next version:** v2.2.0 (pack removal mechanism — TD-V2-6, i18n, alternative package managers)

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
| **CR-Fixes** | Code review fixes (post-FEV-16): error context enrichment (`wrapMergeError`), standard `Result` from `stageOne`, exhaustiveness guard in `shouldStage` | ✅ `MergeError` phase/path preserved in user messages; `stageOne` returns `Result<void, MergeError>` (no null sentinel); compile-time guard for new `RuleCategory` values. |

**Known test pattern** (2026-07-30): `MinimalInstallUseCase` test stub uses `{} as any` for 7 dependency mocks in `install-use-case-base.test.ts`. Acceptable for now — the stub is minimal, the `eslint-disable` comment is clear, and full mocks would bloat the test. Revisit if this pattern spreads to other test files.

### Prior (v1.0.11)

All resolved debt from v1.0.11 and earlier removed. For historical reference, see git history.

---

## 1. Coverage Gaps

### 1.1 `src/cli/main.ts` — RESOLVED in FEV-16 (98.90% lines)

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

### 2.1 CleanInstallUseCase / ProjectInstallUseCase duplicación (~80 líneas) — RESOLVED in FEV-16 (Template Method)

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

### 5.1 E2E Coverage Not Captured by `bun --coverage` — RESOLVED in FEV-16 (CI gate ≥95%)

| Item | Detail |
|------|--------|
| **Problem** | Bun's `--coverage` only instruments code loaded during `bun test`. The 14 E2E scenarios exercising `main.ts` are invisible to coverage reports. |
| **Impact** | `main.ts` shows 33% coverage despite being fully exercised in every E2E run. |
| **Mitigation** | E2E smoke gate in CI (`just test-e2e`) runs separately and must pass before merge. |
| **Recommendation** | Explore NYC (Istanbul) instrumentation for E2E coverage if reporting requirement emerges. |
| **Target** | Future (v1.2.0+) |
| **Effort** | 8h |

### 5.2 No Performance Benchmarks — RESOLVED in FEV-16 (just bench + assert-no-regression)

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

npm excludes `.gitignore` files at any depth. Files like `template/obligatorio/core/skills/ui-ux-design-pro/cli/.gitignore` are not in the published tarball. These serve internal skill development purposes, not user-facing workspace. If a future skill needs its `.gitignore` shipped, apply the rename pattern: `file.gitignore` → `file_gitignore` with post-install generation. (REF: FEV-2-C code review S7)

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

### 7.2 Tarball Size vs SC-15 — KNOWN DEVIATION (FEV-18)

| Item | Detail |
|------|--------|
| **Problem** | SC-15 requires npm tarball < 5MB. FEV-18 added 355 agent files (~4MB), bringing the tarball to **8.0MB** (797 files, unpacked). |
| **Root cause** | The pack system (ADR-014) deliberately ships all 8 selectable packs in the template. ADR-014 anticipated this: *"The npm package grows from ~2MB to an estimated ~5-8MB with all packs"*. |
| **Decision** | **Accepted 2026-08-04 (user).** The deviation is documented as a known trade-off of the pack system. SC-15 remains the target for the core package; pack weight is expected and will be revisited if distribution size becomes a user concern (e.g., lazy-download of packs in a future release). |
| **Mitigation options (future)** | (a) Exclude non-default packs from the tarball and download on demand (breaks offline install); (b) gzip-compress agent bodies and decompress post-install (complex, risk); (c) split packs into separate npm packages (rejected in ADR-014 §Alternatives). |

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

### v2.0.0 — Agent Pack System & Installer UX v2

> **FEV-17 (Template Directory Restructuring) ✅ complete (2026-08-04):** `template/obligatorio/` restructured to `core/` + `packs/{main,writers,sin-clasificar,<8 empty>}/`. `FileRuleManifestData` collapsed 7 mandatory entries to 4 source groupings with `destPath` support (flat destination preserved). 910 tests, 16/16 E2E, `just check` clean.

> **FEV-18 (Agent Classification & Migration) ✅ complete (2026-08-04):** 352 unique agents distributed across 8 selectable packs + 2 mandatory. 257 new agents reformatted to v2.0 (YAML + `## COMPOSITION`), 95 legacy distributed in v1.x format, 10 REDUNDANT resolved (legacy wins). `FileRuleManifestData` 4 → 11 mandatory entries. `packs/sin-clasificar/` removed. Huitzilopochtli catalog ~96 → ~355 subagents. 986 tests, 16/16 E2E, `just check` clean. **Known deviation:** npm tarball 8.0MB exceeds SC-15 (<5MB) — ADR-014 anticipated 5-8MB with all packs; accepted 2026-08-04 (see §7.2).

Specs drafted: [spec-agent-packs.md](../specs/spec-agent-packs.md), [spec-installer-ux-v2.md](../specs/spec-installer-ux-v2.md), [ADR-014](../specs/adr/adr-014-agent-pack-system.md), [ADR-015](../specs/adr/adr-015-installer-ux-v2.md).

> **FEV-19 (Permission Unification & Subagent Table Removal) ✅ complete (2026-08-05):** TD-V2-2, TD-V2-3, TD-V2-4 closed. 106 explicit allow-list entries removed (quetzalcoatl 21, tlaloc 73, mictlantecuhtli 12); 4 primary delegators now use `"*": allow` + deny 5 other primaries. **Scope expansion (user decision): ALL 6 primary agents lost their subagent index** — huitzilopochtli's ~355-subagent catalog included; RULES reference `agents/` ("use ANY subagents in `agents/`"). CONTRIBUTING "Add a New Agent" 5→3 steps; Wiki Agents.md count 104→~355, file tree `agents/`→`packs/`, "Step 4: Update Delegation Tables" removed. 991 tests, 16/16 E2E, `just check` clean. **Note:** this amends ADR-014 §Subagent Table Removal — huitzilopochtli no longer retains the catalog.

> **FEV-20 (Plugin VALID_SUBAGENTS Removal) ✅ complete (2026-08-05):** TD-V2-1, TD-V2-5 closed. `VALID_SUBAGENTS` Set (~110 entries) deleted from `validSubagents.ts`; `PRIMARY_AGENTS` (6) is the only hardcoded list. `defaults.ts` cleaned (5 maps). `sdd-pipeline.ts` fallback → `new Set(PRIMARY_AGENTS)`; error message → "agents/ directory"; validation case-insensitive. `discoverValidSubagents()` recursive (skips hidden entries, lowercases names); `directoryScanner.ts` extracted. Tests: -2 assertions, +4 auto-discovery tests, `toolExecuteBefore.test.ts` rewritten. Wiki `SDD-Pipeline.md` + plugin README updated. 51 plugin tests + 1747 suite + 16/16 E2E + 3/3 plugin E2E, `just check` + `just check-plugin` clean. Post-review hardening: maxDepth=10 + duplicate-basename warning in scanner, absolute-path error messages, noUncheckedIndexedAccess in plugin tsconfig, `tsc` added to `just check-plugin`.

> **FEV-21 (Installer UX: Pack Selection & Version Detection) ✅ complete (2026-08-06):** Pack selection wizard (8 selectable packs, `software-development` default, min 1, cancel aborts). Version gate in Update (blocks missing / < 2.0.0). `.codice-version` v2.0 format `{ version, installedPacks, installedAt, optionalSelections? }` (backward-compatible with `installedVersion`). Update Option A (current packs) / Option B (add packs, installed LOCKED) + `--update-add-packs`. 3 new CLI flags, 3 new `IUserPrompt` methods, `RuleCategory "pack"` (8 entries migrated from `"mandatory"`). 1822 unit+integration tests, 23 E2E scripts, 7 atomic commits on `feat/new-agents`. **Transition resolved in FEV-23** — the update-merge no-op noted here was removed when the bundled version reached 2.0.0; merge is now fully functional (see FEV-23 below). **Opened:** [TD-V2-6](#td-v2-6-no-pack-removal-mechanism) (no pack removal — deferred to v2.2.0).

> **FEV-22 (Installer UX Enhancements) ✅ complete (2026-08-06):** `FileRule.agentCount?` metadata for the 8 selectable packs (146, 92, 36, 31, 18, 11, 10, 8) + `toPackOptions()` reads `agentCount ?? 0`. Install summary screen (spec §3.3) between pack selection and merge (Clean/Project only): `IUserPrompt.showInstallSummary()` (method 16) + pure `buildInstallSummary`/`formatInstallSummary` helpers + `ClackPromptsAdapter` via `clack.note()`. Informational only (no confirm — decision #5). Wiki synced to v2.0 (~360 agents in 10 packs, pushed 602ba26). Full suite 1872 tests (0 fail), 25 E2E scripts; `just check` clean. Code simplification + 5-axis code review (APPROVE, 3 nits fixed). No new tech debt; TD-V2-6 remains OPEN (deferred v2.2.0). No version bump.

> **FEV-23 (v2.0.0 Testing & Integration — Release Closure) ✅ complete (2026-08-07):** Version bumped 1.2.0 → 2.0.0 (`VERSION` auto-derived from `package.json`; no code change). 5 new E2E scripts (`26-update-blocked-pre-1.2.0`, `27-update-option-b`, `28-flat-agents-destination`, `29-non-interactive-packs`, `30-project-install-packs`) bring the E2E suite to **30/30**. 8 new unit/integration tests (Option B cancel path, pack-aware project install, clean-install summary passthrough, version-context classification) bring the full suite to **1880 tests, 0 failures**. E2E 23 rewritten as a **real Option A pack-scoped merge** — the FEV-21 transitional no-op is removed and the update merge is now functional with the bundled v2.0.0 template. E2E 04/15/16 comment-only cleanup + E2E 10 fixed: the equal-version "already up to date" short-circuit is permanent behavior, not a transitional workaround. `just check` clean; coverage 93.78% overall / **99.48% production `src/`** — the overall 95% gate was already missed at the FEV-22 baseline (gap introduced by FEV-17→22 counting template plugins, test helpers, dev scripts, and Windows-only branches; see [TD-V2-7](#td-v2-7-coverage-gate-below-95)). **v2.0.0 RELEASE-READY** (release coordination — merge to main, tag, npm publish — is a separate process). No new tech debt beyond TD-V2-7; TD-V2-6 remains OPEN (deferred v2.2.0).

| ID | Item | Effort | Risk | Description |
|----|------|--------|------|-------------|
| ~~**TD-V2-1**~~ | ~~Remove hardcoded `VALID_SUBAGENTS`~~ | ~~2h~~ | Low | ✅ **Resolved FEV-20 (2026-08-05):** deleted `VALID_SUBAGENTS` Set from `validSubagents.ts` (~110 entries); kept `PRIMARY_AGENTS` (6) as single hardcoded source. `defaults.ts` imports/re-exports/DEFAULTS cleaned (5 maps). `sdd-pipeline.ts` fallback → `new Set(PRIMARY_AGENTS)`; error message → "agents/ directory". `discoverValidSubagents()` recursive + case-insensitive. Post-review: `directoryScanner` hardened (maxDepth=10, duplicate-basename warning); plugin tsconfig `noUncheckedIndexedAccess: true`; `just check-plugin` runs `tsc`. |
| ~~**TD-V2-2**~~ | ~~Unify `task:` permissions for 4 primary agents~~ | ~~1h~~ | Medium | ✅ **Resolved FEV-19 (2026-08-05):** quetzalcoatl, tlaloc, mictlantecuhtli unified to `"*": allow` + deny 5 primaries. Huitzilopochtli already unified in FEV-18. 106 explicit allow entries removed. Moctezuma and tezcatlipoca unchanged. |
| ~~**TD-V2-3**~~ | ~~Remove AVAILABLE SUBAGENTS sections~~ | ~~1h~~ | Low | ✅ **Resolved FEV-19 (2026-08-05):** sections removed from quetzalcoatl, tlaloc, mictlantecuhtli **AND huitzilopochtli** (scope expansion — no subagent index in any of the 6 primary agents; RULES reference `agents/`). |
| ~~**TD-V2-4**~~ | ~~Update CONTRIBUTING.md and Wiki Agents.md~~ | ~~1h~~ | Low | ✅ **Resolved FEV-19 (2026-08-05):** CONTRIBUTING "Add a New Agent" 5→3 steps (removed delegation tables + huitzilopochtli catalog + persona updates). Wiki Agents.md: count 104→~355, file tree `agents/`→`packs/`, permission model examples, "Step 4: Update Delegation Tables" removed. README count 98→355. |
| ~~**TD-V2-5**~~ | ~~Update SDD-Pipeline.md wiki and error messages~~ | ~~0.5h~~ | Low | ✅ **Resolved FEV-20 (2026-08-05):** Wiki `SDD-Pipeline.md` updated — agent count 104→~361, error message example ("VALID_SUBAGENTS catalog" → "agents/ directory"), recursive-scan note in Pillar 1, module table (defaults.ts 529→156, +directoryScanner.ts 63). `Agents.md` audited (no changes needed — FEV-19 already current). Plugin README updated with auto-discovery model. Post-review: error message now shows absolute path; README wording corrected (hidden entries, not just directories); wiki module table updated (directoryScanner 99 lines). |
| **TD-V2-6** | No pack removal mechanism | 4-6h | Medium | **OPEN (added FEV-21, 2026-08-06):** Once installed, agents from a pack persist in destination. Users cannot remove a pack without reinstalling Códice from scratch. Requires new installer mode or `--remove-pack <id>` flag. **Deferred to v2.2.0** (see §v2.2.0 Package Deletion Mechanism below). |
| ~~**TD-V2-7**~~ | ~~Coverage gate below 95%~~ | ~~2-4h~~ | Low | ✅ **Resolved FEV-23 (2026-08-07):** 33 unit tests added for plugin source (`directoryScanner.ts`, `autoDiscovery.ts`) covering scanTree recursion, duplicate detection, maxDepth guard, discoverValidSubagents, discoverAgentMentionPatterns, and discoverCommandAgentMap error paths. Overall coverage recovered from 93.78% → **95.60%** (2957/3093). Production `src/` at 99.48%. Remaining sub-95% files are platform-conditional (parse-args.ts Windows-only SYSTEM_DIRS, main.ts import.meta.main guard) — untestable on Linux CI. |

### v2.2.0

The following items are planned for v2.2.0 and beyond. No specs have been created yet.

#### Alternative Package Managers — Issue #24

| Item | Detail |
|------|--------|
| **Issue** | [#24](https://github.com/fisherk2/codice-opencode/issues/24) — Añadir mas opciones de instalacion |
| **Description** | Implement and maintain alternative package managers to npm in case of incidents. Proposals: uv with pip, cargo, composer, pnpm, yarn. |
| **Risk** | Medium. Multiple package managers increase maintenance burden and testing complexity. |
| **Target** | v2.2.0 |
| **Effort** | 8-12h (including testing across multiple package managers) |

#### Internationalization (i18n) — Issue #22

| Item | Detail |
|------|--------|
| **Issue** | [#22](https://github.com/fisherk2/codice-opencode/issues/22) — Añadir accesibilidad de idiomas |
| **Description** | Add language selection at CLI startup. Options: (1) Manual selection from 5 languages (English, Spanish, + 3 more), (2) Automatic detection based on host locale. All interactive menu text must be translated. |
| **Risk** | Medium. Requires i18n infrastructure, translation files, and locale detection logic. |
| **Target** | v2.2.0 |
| **Effort** | 6-10h (including translation infrastructure and 5 language translations) |

#### Package Deletion Mechanism — tracked as [TD-V2-6](#td-v2-6-no-pack-removal-mechanism)

| Item | Detail |
|------|--------|
| **Description** | No mechanism to remove packs once installed. Agents from a deselected pack persist in the destination `agents/` directory. Users must manually delete agent files or reinstall Códice from scratch. |
| **Risk** | Medium. Requires a new installer mode or flag (e.g., `--remove-pack business`) that identifies and deletes agents belonging to a specific pack. Must handle agents that exist in multiple packs (single-assignment rule simplifies this). |
| **Target** | v2.2.0 |
| **Effort** | 4-6h |

#### Automatic Pack Updates Detection

| Item | Detail |
|------|--------|
| **Description** | When a pack's agents change between versions (new agents added, agents removed, agents modified), the updater should show a diff or changelog specific to the user's installed packs. Currently, update is a blind overwrite of agents from installed packs. |
| **Risk** | Low. Requires comparing template pack contents against destination `agents/` directory and generating a human-readable diff. |
| **Target** | v2.2.0 |
| **Effort** | 3-4h |

---

*Maintained by Códice team. Update when tech debt items are added or resolved.*
