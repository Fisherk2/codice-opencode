# Technical Debt — Códice

**Last updated:** 2026-08-19
**Status:** v2.1.0 released — 2052 tests, 31/31 E2E, coverage ≥95% production `src/`
**Current version:** v2.1.0
**Next version:** v2.1.1 (action pins, pack removal)

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

**Resolved in v2.0.0 (FEV-17 to FEV-23):**
- Template directory restructuring → pack-based organization
- 352 agents across 10 packs (8 selectable + 2 mandatory)
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

---

## Known Limitations

### Tarball Size (8.0MB vs SC-15 <5MB)

SC-15 requires npm tarball < 5MB. The pack system (ADR-014) deliberately ships all 8 selectable packs, bringing the tarball to **8.0MB** (797 files). This deviation was accepted 2026-08-04 as a trade-off of the pack system. Will be revisited if distribution size becomes a user concern.

**Mitigation options (future):** (a) Lazy-download packs; (b) gzip-compress agent bodies; (c) split packs into separate npm packages.

### Nested `.gitignore` Files Excluded by npm

npm excludes `.gitignore` files at any depth. Files like `template/obligatorio/core/skills/ui-ux-design-pro/cli/.gitignore` are not in the published tarball. These serve internal skill development purposes only.

---

## Open Debt by Version

### v2.1.1 (Quick Fixes - < 2h each)

| ID | Item | Effort | Risk | Description |
|----|------|--------|------|-------------|
| **TD-V2-6** | No pack removal mechanism | 4-6h | Medium | Once installed, agents from a pack persist in destination. Users cannot remove a pack without reinstalling from scratch. Requires `--remove-pack <id>` flag or new installer mode. |
| **TD-V2-7** | Action SHA-pins force Node 24 (deprecated) | 1-2h | Low | `actions/cache`, `actions/checkout`, `extractions/setup-just` pins target Node 20; GitHub forces Node 24. Update to latest majors that support Node 24 to suppress deprecation warnings. |
| **TD-V2-9** | SIGINT mid-commit backup overwrite | 2-4h | Low | `AtomicStager.commitStaging()` overwrites `.codice-backup` originals if interrupted mid-commit; next run's backups hold the mixed state, losing true pre-interrupt originals. Deliberate and documented; consider persisting rollback intent across runs. |
| **TD-V2-70** | GitHub Actions shell injection via github.ref_name | 0.5h | Medium | Release workflow uses `${{ github.ref_name }}` directly in shell scripts. Attacker with write access could create malicious tag to execute arbitrary commands. Fix: use environment variables instead of direct interpolation. |
| **TD-V2-90** | Business pack agent count mismatch | 0.5h | Low | Manifest declares 92 agents but only 91 files exist in `template/obligatorio/packs/business/`. Update manifest or add missing agent. |
| **TD-V2-91** | Writers pack agent count mismatch | 0.5h | Low | Manifest describes "2 writer agents" but directory contains 4 agents. Update description in FileRuleManifestData.ts. |
| **TD-V2-51** | Missing event for staging directory cleanup | 1h | Low | No ProgressEvent emitted when staging directory is cleaned up. Add `staging_cleanup` event for better observability. |
| **TD-V2-61** | No caching for version comparison | 1h | Low | VersionComparator performs semver parsing on every call. Cache parsed versions for repeated comparisons. |
| **TD-V2-93** | Outdated comments in FileMergeEngine | 1h | Low | Some inline comments reference old implementation details. Update comments to match current code. |

### v2.1.2 (Medium Effort - 2-4h each)

| ID | Item | Effort | Risk | Description |
|----|------|--------|------|-------------|
| **TD-V2-10** | Domain layer imports semver directly | 2-3h | Medium | WorkspaceVersion entity imports semver directly, violating Clean Architecture "zero external dependencies" rule. Inject comparison logic or move comparison to VersionComparator service. |
| **TD-V2-11** | Application layer instantiates infrastructure adapters | 1-2h | Medium | Use cases directly instantiate BunFileSystem, GitHubRestClient, etc. Move instantiation to DI container (container.ts) for better testability. |
| **TD-V2-21** | GitHubRestClient returns null on all errors | 1-2h | Medium | getLatestVersion() returns `string | null` instead of `Result<string | null, Error>`. Caller cannot distinguish "no release found" from "network error". Return Result type for better error context. |
| **TD-V2-22** | FileMergeEngine uses intersection type | 1h | Low | Constructor requires `IFileSystem & IStagingSystem` intersection type. Accept two separate dependencies for better ISP compliance and easier testing. |
| **TD-V2-30** | Strategy pattern implementation is implicit | 2h | Low | File merge rules (Obligatorio/Estándar/Opcional) use if/else instead of explicit Strategy pattern. Extract to Strategy classes for better extensibility. |
| **TD-V2-50** | No structured error context in progress events | 2h | Low | ProgressEvent lacks error context field. Add optional `error?: Error` field for better debugging in verbose mode. |
| **TD-V2-81** | Missing integration tests for error paths | 2h | Low | Some error paths in use cases lack integration test coverage. Add tests for network failures, file permission errors, etc. |
| **TD-V2-92** | Missing JSDoc for some public methods | 2h | Low | Some public methods in ports and services lack JSDoc. Add comprehensive JSDoc for all public APIs. |

### v2.1.3 (Larger Refactoring - 4-6h each)

| ID | Item | Effort | Risk | Description |
|----|------|--------|------|-------------|
| **TD-V2-20** | IFileSystem port is too large | 2-3h | Medium | IFileSystem has 10+ methods violating ISP. Split into IFileReader, IFileWriter, IDirectoryWalker for better separation of concerns. |
| **TD-V2-31** | Missing Factory pattern for use case creation | 3h | Low | Use cases are instantiated directly in main.ts. Extract UseCaseFactory for better extensibility and testability. |
| **TD-V2-60** | Directory walking is synchronous | 4-6h | Medium | directoryWalker uses synchronous fs operations. Convert to async for better performance on large workspaces. |
| **TD-V2-80** | Some use cases are hard to test | 3-4h | Medium | CleanInstallUseCase and ProjectInstallUseCase have tight coupling to infrastructure. Refactor to accept all dependencies via constructor for easier mocking. |

## Planned Features by Version

### v2.1.1

| Feature | Issue | Effort | Description |
|---------|-------|--------|-------------|
| **Pack Update Diff** | — | 3-4h | Show changelog for user's installed packs during update |
| **Action SHA-pins Update** | TD-V2-7 | 1-2h | Pin to latest Node 24-compatible majors |
| **Shell Injection Fix** | TD-V2-70 | 0.5h | Use environment variables instead of direct interpolation in GitHub Actions |
| **Agent Count Corrections** | TD-V2-90, TD-V2-91 | 1h | Fix manifest agent counts for business and writers packs |
| **Progress Event Enhancement** | TD-V2-51 | 1h | Add staging_cleanup event for better observability |
| **Version Comparison Caching** | TD-V2-61 | 1h | Cache parsed semver versions for repeated comparisons |
| **Documentation Cleanup** | TD-V2-93 | 1h | Update outdated comments in FileMergeEngine |

### v2.1.2

| Feature | Issue | Effort | Description |
|---------|-------|--------|-------------|
| **Domain Layer Purification** | TD-V2-10 | 2-3h | Remove semver import from WorkspaceVersion entity |
| **DI Container Enhancement** | TD-V2-11 | 1-2h | Move adapter instantiation to DI container |
| **Error Handling Improvement** | TD-V2-21 | 1-2h | Return Result type from GitHubRestClient.getLatestVersion() |
| **ISP Compliance** | TD-V2-22 | 1h | Split FileMergeEngine constructor dependencies |
| **Strategy Pattern Extraction** | TD-V2-30 | 2h | Extract file merge rules to Strategy classes |
| **Progress Event Error Context** | TD-V2-50 | 2h | Add error field to ProgressEvent |
| **Integration Test Coverage** | TD-V2-81 | 2h | Add tests for error paths in use cases |
| **JSDoc Completion** | TD-V2-92 | 2h | Add JSDoc to all public methods |

### v2.1.3

| Feature | Issue | Effort | Description |
|---------|-------|--------|-------------|
| **IFileSystem Port Split** | TD-V2-20 | 2-3h | Split into IFileReader, IFileWriter, IDirectoryWalker |
| **Use Case Factory** | TD-V2-31 | 3h | Extract UseCaseFactory for better extensibility |
| **Async Directory Walking** | TD-V2-60 | 4-6h | Convert directoryWalker to async operations |
| **Use Case Testability** | TD-V2-80 | 3-4h | Refactor use cases for easier mocking |

### v2.3

| Feature | Issue | Effort | Description |
|---------|-------|--------|-------------|
| **Pack Removal** | TD-V2-6 | 4-6h | `--remove-pack <id>` flag |
| **Alternative Package Managers** | [#24](https://github.com/fisherk2/codice-opencode/issues/24) | 8-12h | uv, cargo, composer, pnpm, yarn support |
| **Internationalization (i18n)** | [#22](https://github.com/fisherk2/codice-opencode/issues/22) | 6-10h | Language selection (English, Spanish, +3 more) — partial progress in bilingual intents |

---

## Summary

| Category | Status |
|----------|--------|
| v1.x debt | ✅ All resolved |
| v2.0.0 debt | ✅ All resolved |
| v2.1.0 debt | ✅ All resolved (4 new commands, SDD intent auto-discovery, bilingual intents, agent delegation, CI/CD hardening) |
| v2.1.1 open debt | 9 items (3 legacy + 6 from deep audit) — quick fixes < 2h each |
| v2.1.2 open debt | 8 items — medium effort 2-4h each |
| v2.1.3 open debt | 4 items — larger refactoring 4-6h each |
| v2.1.1 planned features | 7 items (2 legacy + 5 from deep audit) |
| v2.1.2 planned features | 8 items (from deep audit) |
| v2.1.3 planned features | 4 items (from deep audit) |
| v2.3 planned features | 3 items (1 legacy + 2 from GitHub issues #22, #24) |

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
*Last updated: 2026-08-19*
*Next deep audit: after v2.1.3 release*