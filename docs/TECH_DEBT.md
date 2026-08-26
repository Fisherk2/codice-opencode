# Technical Debt — Códice

**Last updated:** 2026-08-25
**Status:** v2.1.1 Released (2026-08-25) — FEV-26 ✅ + FEV-27 ✅ + FEV-28 ✅ + code review hardened — 1935 tests, 31/31 E2E, 55/55 plugin integration, coverage ≥95% production `src/`
**Current version:** v2.1.1
**Next version:** v2.1.2 (planned)

---

## Resolved Debt (v1.x → v2.0.0)

All technical debt from v1.x and v2.0.0 development has been resolved. For historical reference:

| Version | Key Resolutions |
|---------|-----------------|
| **v1.1.0** | IFileSystem port split (ISP), TypeScript 6.x upgrade, npm packaging tests |
| **v1.1.1** | Code review fixes (11 findings), documentation synchronization |
| **v1.2.0** | Binary removal (ADR-011), references restructuring, documentation overhaul, UX enhancements (progress bar, /help), community standards (Code of Conduct) |
| **v2.0.0** | Agent pack system (FEV-17/18), permission unification (FEV-19), plugin auto-discovery (FEV-20), installer UX v2 (FEV-21/22), testing closure (FEV-23) |
| **v2.1.0-beta.1** | 4 slash commands (`/sync`, `/migrate`, `/deploy`, `/analyze`), SDD intent auto-discovery, bilingual intents, agent delegation protocol (FEV-25), CI/CD hardening (SHA-pins, branch protection, PR/issue templates, npm provenance), SPEC.md modularization (ADR-020) |
| **v2.1.1** | Bug #79 regression test, shell injection fix (TD-V2-70), manifest count corrections (TD-V2-90/91), FileMergeEngine comment refresh (TD-V2-93), injection guard hardening, plugin cleanup (#80), external directory permissions (#81), backup integrity (TD-V2-9), staging cleanup event (TD-V2-51), CI/CD SHA-pin bumps to Node 24 (TD-V2-7), parsed-semver cache in VersionComparator (TD-V2-61), code review findings resolved |

**Resolved in v2.0.0 (FEV-17 to FEV-23):**
- Template directory restructuring → pack-based organization
- 351 agents across 10 packs (8 selectable + 2 mandatory)
- Permission unification (106 allow-list entries removed)
- VALID_SUBAGENTS hardcoded set removed (auto-discovery)
- Pack selection wizard + version-gated updates
- Install summary screen
- Coverage gate achieved (95.68% overall)
- 30/30 E2E scenarios passing

**Resolved in v2.1.0-beta.1 (FEV-24 to FEV-25):**
- 4 new slash commands (`/sync`, `/migrate`, `/deploy`, `/analyze`)
- SDD plugin intent auto-discovery (replaces hardcoded INTENT_PATTERNS)
- Bilingual intent support (EN/ES)
- Agent delegation protocol for 6 primary agents (FEV-25)
- CI/CD hardening: SHA-pinned actions, branch protection, PR/issue templates
- npm provenance SLSA v1 on publish
- SPEC.md modularized (441 → 44 lines + 8 sub-specs, ADR-020) (TD-V2-8)
- 2052 tests / 0 fail, 31/31 E2E

**Resolved in v2.1.1 (FEV-26):**
- Bug #79: regression test guards `.codice-version` version passthrough (integration + E2E)
- TD-V2-70: shell injection via `github.ref_name` → `$GITHUB_REF_NAME` in release.yml
- TD-V2-90: business pack agent count 92→91 (manifest + tests)
- TD-V2-91: writers pack agent count 2→4 (manifest + tests)
- TD-V2-93: FileMergeEngine comments refreshed (WHAT→WHY)
- Injection guard test hardened (asserts against actual `${{ }}` pattern)
- Doc sync: wiki, specs, TECH_DEBT counts corrected
- 1935 tests / 0 fail, 31/31 E2E

**Resolved in v2.1.1 (FEV-27 + code review):**
- TD-V2-51: staging_cleanup event emitted in --verbose mode (ProgressEvent + AtomicStager)
- #81: External directory permissions — deny-by-default + allowlist in opencode.json
- TD-V2-9: Backup integrity — .codice-backup-intent marker prevents overwrite on interrupted commits
- #80: SDD plugin reduced to destructive-command block only (13 modules deleted, ~1200 lines removed)
- **Code review hardening (commit `a2964fd`):**
  - C1: `extractBashCommand` reads `output.args.command` (plugin gate was non-functional)
  - I1: 5 new integration tests invoking actual plugin hook with correct shape
  - I2: AtomicStager removes marker on handled failure (only hard-kill leaves orphan)
  - I3: Added `rm -r -f` and `rm -f -r` split-flag patterns
  - I4: Flag-based guard replaces fragile string-matching for orphan detection
  - S1: Removed dead `staging_cleanup` variant from ProgressCallback
  - S2: Added staging/backup patterns to `template/estandar/gitignore`
- 1935 tests / 0 fail, 31/31 E2E, 55/55 plugin integration, coverage ≥95%

---

## Known Limitations

### Tarball Size (8.0MB vs SC-15 <5MB)

SC-15 requires npm tarball < 5MB. The pack system (ADR-014) deliberately ships all 8 selectable packs, bringing the tarball to **8.0MB** (797 files). This deviation was accepted 2026-08-04 as a trade-off of the pack system. Will be revisited if distribution size becomes a user concern.

**Mitigation options (future):** (a) Lazy-download packs; (b) gzip-compress agent bodies; (c) split packs into separate npm packages.

### Nested `.gitignore` Files Excluded by npm

npm excludes `.gitignore` files at any depth. Files like `template/obligatorio/core/skills/ui-ux-design-pro/cli/.gitignore` are not in the published tarball. These serve internal skill development purposes only.

---

## Backlog by Version

### v2.1.1 Released (FEV-26 ✅ + FEV-27 ✅ + FEV-28 ✅ — code review hardened)

#### FEV-26: Quick Wins ✅ Resuelto (2026-08-20)

| ID | Item | Type | Effort | Risk | Diagnóstico |
|----|------|------|--------|------|-------------|
| **#79** | `.codice-version` regression test | Bug | 2-3h | High | `fix14-clean-install-version-file.md` |
| **TD-V2-70** | Shell injection → `$GITHUB_REF_NAME` | Debt | 0.5h | Medium | `fix17-shell-injection-github-ref-name.md` |
| **TD-V2-90** | Business pack count 92→91 | Debt | 0.5h | Low | `fix25-business-pack-agent-count.md` |
| **TD-V2-91** | Writers pack count 2→4 | Debt | 0.5h | Low | `fix20-writers-pack-agent-count.md` |
| **TD-V2-93** | FileMergeEngine comments | Debt | 1h | Low | `fix24-outdated-comments-file-merge-engine.md` |

#### FEV-27: Security & Observability ✅ Resuelto (2026-08-21, code review hardened)

| ID | Item | Type | Effort | Risk | Diagnóstico |
|----|------|------|--------|------|-------------|
| **#80** | Limpieza del plugin (solo bloqueo destructivo) | Feature | 3-4h → 2h | Medium | `fix15-plugin-cleanup.md` |
| **#81** | Permisos directorios externos (deny-by-default) | Feature | 1-2h → 0.5h | Medium | `fix16-external-directory-permissions.md` |
| **TD-V2-9** | SIGINT mid-commit backup overwrite | Debt | 2-3h → 1h | Low | `fix19-sigint-backup-overwrite.md` |
| **TD-V2-51** | Missing staging_cleanup event | Debt | 1h → 0.5h | Low | `fix21-missing-staging-cleanup-event.md` |

**Code review (commit `a2964fd`):** 1 Critical + 4 Important + 3 Suggestions — todos aplicados.
**Metrics finales:** 1935 tests, 31/31 E2E, 55/55 plugin integration, just check 0 errors.

#### FEV-28: Infrastructure & Performance ✅ Completo (2026-08-21)

| ID | Item | Type | Effort | Risk | Diagnóstico |
|----|------|------|--------|------|-------------|
| **TD-V2-7** | Action SHA-pins force Node 24 (deprecated) | Debt | 1-2h | Low | `fix23-action-sha-pins-node24.md` |
| **TD-V2-61** | No caching for version comparison | Debt | 1h | Low | `fix22-no-caching-version-comparison.md` |

### v2.1.2 (Medium Effort — 9 items, 18-24h total)

| ID | Item | Type | Effort | Risk | Description |
|----|------|------|--------|------|-------------|
| — | Pack Update Diff | Feature | 3-4h | Low | Show changelog for user's installed packs during update |
| **TD-V2-10** | Domain layer imports semver directly | Debt | 2-3h | Medium | WorkspaceVersion entity imports semver directly, violating Clean Architecture. Inject comparison logic or move to VersionComparator. |
| **TD-V2-11** | Application layer instantiates infrastructure adapters | Debt | 1-2h | Medium | Use cases directly instantiate BunFileSystem, GitHubRestClient. Move to DI container (container.ts). |
| **TD-V2-21** | GitHubRestClient returns null on all errors | Debt | 1-2h | Medium | getLatestVersion() returns `string | null` instead of `Result`. Cannot distinguish "no release" from "network error". |
| **TD-V2-22** | FileMergeEngine uses intersection type | Debt | 1h | Low | Constructor requires `IFileSystem & IStagingSystem`. Accept two separate dependencies for ISP. |
| **TD-V2-30** | Strategy pattern implementation is implicit | Debt | 2h | Low | File merge rules use if/else instead of explicit Strategy. Extract to Strategy classes. |
| **TD-V2-50** | No structured error context in progress events | Debt | 2h | Low | ProgressEvent lacks error field. Add `error?: Error` for verbose debugging. |
| **TD-V2-81** | Missing integration tests for error paths | Debt | 2h | Low | Some error paths lack integration test coverage. |
| **TD-V2-92** | Missing JSDoc for some public methods | Debt | 2h | Low | Some public methods in ports/services lack JSDoc. |

### v2.1.3 (Larger Refactoring — 4 items, 12-16h total)

| ID | Item | Type | Effort | Risk | Description |
|----|------|------|--------|------|-------------|
| **TD-V2-20** | IFileSystem port is too large | Debt | 2-3h | Medium | Split into IFileReader, IFileWriter, IDirectoryWalker. |
| **TD-V2-31** | Missing Factory pattern for use case creation | Debt | 3h | Low | Extract UseCaseFactory for better extensibility. |
| **TD-V2-60** | Directory walking is synchronous | Debt | 4-6h | Medium | Convert directoryWalker to async operations. |
| **TD-V2-80** | Some use cases are hard to test | Debt | 3-4h | Medium | Refactor use cases to accept all dependencies via constructor. |

### v2.3 (3 items, 18-28h total)

| ID | Item | Type | Effort | Risk | Description |
|----|------|------|--------|------|-------------|
| **TD-V2-6** | No pack removal mechanism | Debt | 4-6h | Medium | `--remove-pack <id>` flag for removing installed packs. |
| [#24](https://github.com/fisherk2/codice-opencode/issues/24) | Alternative Package Managers | Feature | 8-12h | High | uv, cargo, composer, pnpm, yarn support. |
| [#22](https://github.com/fisherk2/codice-opencode/issues/22) | Internationalization (i18n) | Feature | 6-10h | High | Language selection (English, Spanish, +3 more). |

---

## Summary

| Category | Status |
|----------|--------|
| v1.x debt | ✅ All resolved |
| v2.0.0 debt | ✅ All resolved |
| v2.1.0 debt | ✅ All resolved (4 new commands, SDD intent auto-discovery, bilingual intents, agent delegation, CI/CD hardening) |
| v2.1.1 | ✅ Released — FEV-26+27+28 — 1935 tests, 55/55 plugin integration |
| v2.1.2 backlog | 9 items (8 debt + 1 feature) — 18-24h |
| v2.1.3 backlog | 4 items (4 debt) — 12-16h |
| v2.3 backlog | 3 items (1 debt + 2 features) — 18-28h |

---

## Deep Audit Results (2026-08-19)

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
*Last updated: 2026-08-25*
*Next deep audit: after v2.1.3 release*