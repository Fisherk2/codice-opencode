# Technical Debt — Códice

**Last updated:** 2026-11-19
**Status:** v2.1.5 FEV-31 COMPLETED (2026-11-17) + pre-launch review 2026-11-18 + post-beta docs pass done — 2027 tests, 31/31 E2E, `tsc --noEmit` 0, lint 0 · beta.1 **published 2026-11-18** under dist-tag `beta` (release run 44443767080 success; `just verify-release` OK) · stable **v2.1.5 ready for deployment 2026-11-19, not yet published** (`latest` intact at 2.1.4) · issues #111/#112/#114/#115/#116 closed + orphan references repaired · adjacent out-of-scope payload registered in `docs/WORKFLOW.md` · 4 deferred Phase-2 findings + TD-V2-97 remain open (below)
**Current version:** v2.1.5 — ready for stable deployment, not yet published (`latest` still at 2.1.4). Beta history: annotated tag `926006f` on the `main` tip (`c579948`), after PR #119 squash `3883288` (`hotfix/update-payload` → `develop`) + sync `d03191a` + PR #121 squash (`develop` → `main`); route proven via `gh pr view --json headRefName,mergeCommit` (a squash does not preserve lineage — `merge-base --is-ancestor` proves nothing here). The local-only `release/v2.1.5` was cut after the tag from `81a360d` for the stable promotion — never pushed during the beta; it is now the branch preparing the stable release
**Next version:** v2.2.0 (Medium Effort — 9 items, 18-24h)

---

## Resolved Debt

All v1.x and v2.0.0 debt is resolved. Version summary:

| Version | Key Resolutions |
|---------|-----------------|
| **v1.1.0** | IFileSystem port split (ISP), TypeScript 6.x upgrade, npm packaging tests |
| **v1.1.1** | Code review fixes (11 findings), documentation synchronization |
| **v1.2.0** | Binary removal (ADR-011), references restructuring, documentation overhaul, UX enhancements (progress bar, /help), community standards (Code of Conduct) |
| **v2.0.0** | Agent pack system (FEV-17/18), permission unification (FEV-19), plugin auto-discovery (FEV-20), installer UX v2 (FEV-21/22), testing closure (FEV-23) |
| **v2.1.0-beta.1** | 4 slash commands (`/sync`, `/migrate`, `/deploy`, `/analyze`), SDD intent auto-discovery, bilingual intents, agent delegation protocol (FEV-25), CI/CD hardening (SHA-pins, branch protection, PR/issue templates, npm provenance), SPEC.md modularization (ADR-020) |
| **v2.1.1** | Bug #79 regression test, shell injection fix (TD-V2-70), manifest count corrections (TD-V2-90, TD-V2-91), FileMergeEngine comment refresh (TD-V2-93), injection guard hardening, plugin cleanup (#80), external directory permissions (#81), backup integrity (TD-V2-9), staging cleanup event (TD-V2-51), CI/CD SHA-pin bumps to Node 24 (TD-V2-7), parsed-semver cache in VersionComparator (TD-V2-61), code review findings resolved |
| **v2.1.5** | FEV-31: issues #111/#112/#114/#115/#116 closed (delegation scan, `/hotfix` phases, background ban, `find-skills` setup, VSA skill + phases), orphan references repaired (ADR move to `docs/adr/`, `skills-lock.json`/`.gitmessage` mentions), 100/120/none prompt-budget contradiction unified at 180 lines |

**Resolved in v2.0.0:** coverage gate 95.68% overall, 30/30 E2E; 351 agents in 10 packs (8 selectable + 2 mandatory), 106 allow-list entries removed, VALID_SUBAGENTS set removed, pack wizard + version-gated updates, install summary screen.

**Resolved in v2.1.0-beta.1:** npm provenance SLSA v1 on publish; SPEC.md 441 → 44 lines + 8 sub-specs (TD-V2-8); 2052 tests / 0 fail, 31/31 E2E.

**Resolved in v2.1.1:** code review hardening (commit `a2964fd`) — 1 Critical + 4 Important + 3 Suggestions: `extractBashCommand` reads `output.args.command`, 5 new hook integration tests, backup marker removed on handled failure, `rm -r -f`/`rm -f -r` patterns, flag-based orphan guard, dead `staging_cleanup` variant removed, staging/backup gitignore patterns; 1935 tests / 0 fail, 31/31 E2E, coverage ≥95%.

**Resolved in v2.1.5 (FEV-31):** completes the INCOMPLETE `1941ed3` stabilization (green gates, zero issue gaps closed; `docs/diagnosis/fix30-fev31-partial-issue-implementation.md` §4.1); 1991 tests / 0 fail, 31/31 E2E, `tsc --noEmit` 0, lint 0 (TD-V2-97 workaround). The adjacent out-of-scope payload of `hotfix/update-payload` (6 primary-agent model swaps, 6 plugins, ADR move, skills churn) is registered in `docs/WORKFLOW.md`, not tracked as debt here.

---

## Pending Debt

> Policy 2026-09-25: 2.1.x reserved for hotfixes; debt/features rescheduled to 2.2.x (v2.1.4→v2.2.0, v2.1.5→v2.3.0, v2.3→v2.5.0).

### v2.2.0 — next version to address

| ID | Item | Type | Effort | Short description |
|----|------|------|--------|-------------------|
| — | Pack Update Diff | Feature | 3-4h | Show changelog for user's installed packs during update |
| **TD-V2-10** | Domain layer imports semver directly | Debt | 2-3h | WorkspaceVersion imports semver, violating Clean Architecture; inject comparison via VersionComparator |
| **TD-V2-11** | Application instantiates infrastructure adapters | Debt | 1-2h | Use cases create BunFileSystem/GitHubRestClient directly; move to DI container |
| **TD-V2-21** | GitHubRestClient returns null on all errors | Debt | 1-2h | `string \| null` cannot distinguish no release from network error; return `Result` |
| **TD-V2-22** | FileMergeEngine uses intersection type | Debt | 1h | `IFileSystem & IStagingSystem` constructor; accept two deps for ISP |
| **TD-V2-30** | Strategy pattern implementation is implicit | Debt | 2h | Merge rules use if/else; extract to Strategy classes |
| **TD-V2-50** | No structured error context in progress events | Debt | 2h | Add `error?: Error` to ProgressEvent for verbose debugging |
| **TD-V2-81** | Missing integration tests for error paths | Debt | 2h | Some error paths lack integration test coverage |
| **TD-V2-92** | Missing JSDoc for some public methods | Debt | 2h | Some ports/services public methods lack JSDoc |
| **TD-V2-93-f2** | Non-atomic codemod writes | Debt | 1h | `writeFileSync` in-place can truncate files; write `.tmp` + `renameSync` |
| **TD-V2-95** | Brake-invariant blind spot | Debt | 1h | CI checks only existing `permissions:` blocks; `mode: subagent` without one escapes the gate |
| **TD-V2-97** | False-green local type-check (TS 7 on fuseblk/NTFS) | Debt | 1h | Mount ignores exec bit so Bun falls back to global tsc 6.0.3; non-blocking warning in `scripts/check-ts-version.sh` |
| **TD-V2-98** | Local coverage gate red under bun 1.4.4 | Debt | 1-2h | Denominator includes `tests/**` + `scripts/**` (94.24% global, `src/` 96.78%); CI pins bun 1.3 |
| **TD-V2-99** | Near-dead test-only exports | Debt | 1h | Four exports churn 4+ test files for no readability gain; deferred |
| **TD-V2-102** | lcov-vs-test mismatch for migration script | Debt | 0.5h | Test passes but lcov shows `0/266` (script not instrumented); related to TD-V2-98 |
| **TD-V2-108** | 5s-timeout flakes under load | Debt | 1-2h | npm-pack/TUI tests fail only when the suite runs >60s; raise hook timeouts to 15s |
| **TD-V2-110** | Pre-launch follow-ups (post-beta/GA) | Debt | 2-4h | 16 coverage gaps (rollback residue-reporting first), `engines: bun>=1.3`, SIGINT E2E advisory, wiki sync (`backup/pre-docs-sync`), TD-V2-98 drift |
| **TD-V2-111** | Pin 6 payload plugin versions | Debt | 1-2h | Plugins ship at `@latest` in `opencode.json`; ADR-025 accepted exception, pin + regression guard |
| **TD-V2-112** | No-`any` policy has no enforcement gate | Debt | 1h | `noExplicitAny` off, no ESLint, `strict` catches only implicit `any`; enable Biome rule or add guard test |

### v2.3.0 — following version to address

| ID | Item | Type | Effort | Short description |
|----|------|------|--------|-------------------|
| **TD-V2-20** | IFileSystem port is too large | Debt | 2-3h | Split into IFileReader, IFileWriter, IDirectoryWalker |
| **TD-V2-31** | Missing Factory pattern for use case creation | Debt | 3h | Extract UseCaseFactory for better extensibility |
| **TD-V2-60** | Directory walking is synchronous | Debt | 4-6h | Convert directoryWalker to async operations |
| **TD-V2-80** | Some use cases are hard to test | Debt | 3-4h | Make use cases accept all dependencies via constructor |
| **TD-V2-94** | Hygiene-scan surface gap | Debt | 2-3h | `SCAN_ROOTS` omits shipped dirs (`template/estandar`, `core`, `opcional`); add extensionless allowlist |
| **TD-V2-96** | Parser cosmetic/semantic TODOs | Debt | 2h | Codemod drops internal blank lines; `tools: <scalar>` → `action: "*"` unverified against OpenCode V2 |
| **TD-V2-100** | Naming drift | Debt | 1-2h | `updateFlow`/`updateHelpers`, `versionGateMessages`/`versionInfoMessages`; renames churn imports |
| **TD-V2-101** | 5 files still >200 LOC | Debt | 2-3h | AtomicStager (610), FileMergeEngine (233), BunSymlinkCreator (228), BunFileSystem (206), ClackPromptsAdapter (204); splits deferred |
| **TD-V2-103** | win32-only branches untestable under lcov | Debt | 2-3h | `validateDestPath.ts` platform-gated lines stay ~71% in lcov; inject seam or drop branch |
| **TD-V2-106** | Hard-killed runs leave `.codice-staging-*` residue | Debt | 2-3h | Needs safe-sweep design (pid liveness) before deleting another run's dir |
| **TD-V2-107** | `AtomicStager.ts` grew to 610 LOC | Debt | 3-4h | One safety story by design; split prepare/promote/recover only with fresh integration coverage |

### v2.5.0 — later version to address

| ID | Item | Type | Effort | Short description |
|----|------|------|--------|-------------------|
| **TD-V2-6** | No pack removal mechanism | Debt | 4-6h | `--remove-pack <id>` flag for removing installed packs |
| [#24](https://github.com/fisherk2/codice-opencode/issues/24) | Alternative Package Managers | Feature | 8-12h | uv, cargo, composer, pnpm, yarn support |
| [#22](https://github.com/fisherk2/codice-opencode/issues/22) | Internationalization (i18n) | Feature | 6-10h | Language selection (English, Spanish, +3 more) |
| **TD-V2-104** | cwd-template fallback is intentional (ADR-007) | Decision/FYI — no action | — | Documented third rung of the detection cascade; no action |
| **TD-V2-105** | 0 required reviews on `develop` is policy | Decision/FYI — no action | — | Documented single-contributor policy; FYI only |
| **TD-V2-109** | update-gating logic in main.ts is sanctioned | Decision/FYI — no action | — | ARCHITECTURE.md assigns mode resolution to the CLI layer; FYI only |

---

## Known Limitations

### Tarball Size (8.0MB vs SC-15 <5MB)

SC-15 requires npm tarball < 5MB. The pack system (ADR-014) deliberately ships all 8 selectable packs, bringing the tarball to **8.0MB** (797 files). This deviation was accepted 2026-08-04 as a trade-off of the pack system. Will be revisited if distribution size becomes a user concern.

**Mitigation options (future):** (a) Lazy-download packs; (b) gzip-compress agent bodies; (c) split packs into separate npm packages.

### Nested `.gitignore` Files Excluded by npm

npm excludes `.gitignore` files at any depth. Files like `template/obligatorio/core/skills/ui-ux-design-pro/cli/.gitignore` are not in the published tarball. These serve internal skill development purposes only.

---

## Deep Audit Results

**Date:** 2026-08-19  
**Scan type:** Deep audit (all 8 dimensions)  
**Total findings:** 21 items across 8 dimensions

| Dimension | Findings | Critical | High | Medium | Low |
|-----------|----------|----------|------|--------|-----|
| 1. System Structure | 2 | 0 | 0 | 1 | 1 |
| 2. Backend Architecture | 3 | 0 | 0 | 2 | 1 |
| 3. Design Patterns | 2 | 0 | 0 | 1 | 1 |
| 4. Data Flow | 2 | 0 | 0 | 0 | 2 |
| 5. Scalability & Performance | 2 | 0 | 0 | 0 | 2 |
| 6. Security | 1 | 0 | 0 | 1 | 0 |
| 7. Testability | 2 | 0 | 0 | 0 | 2 |
| 8. Documentation | 4 | 0 | 2 | 0 | 2 |
| **Total** | **21** | **0** | **2** | **5** | **14** |

**Methodology:** 8 subagents analyzed the codebase in parallel across all dimensions, using clean-ddd-hexagonal, design-patterns, dependency-audit, observability-and-instrumentation, performance-analysis, security-and-hardening, test-driven-development, and documentation-and-adrs skills.

---

*Maintained by Códice team. Update when tech debt items are added or resolved.*
*Next deep audit: after v2.1.5 GA*
