# Implementation Plan – Códice v1.0.0 → v2.1.5
**Date:** 2026-06-15 | **Last updated:** 2026-11-19 (v2.1.5 **ready for stable deployment — not yet published**, `latest` still at 2.1.4; v2.1.5-beta.1 published under dist-tag `beta` 2026-11-18 — release run 44443767080 success, 2027 tests, 31/31 e2e, tsc 0, lint 0) | **Methodology:** Iterative TDD

## 1. Phase Vision

| Phase | Goal | Deliverables | Status |
|------|----------|-------------|--------|
| F0 | Preparation | environment, conventions, CI/CD | ✅ Complete |
| F1 | Infrastructure | BunFileSystem, GitHubRestClient, ClackPromptsAdapter | ✅ Complete |
| F2 | Core/Domain | FileMergeEngine, VersionComparator, Result type | ✅ Complete |
| F3 | Interfaces | CLI, DI, Use Cases, integration tests | ✅ Complete |
| F4 | Testing | E2E (6 scenarios), CI integration, coverage gaps | ✅ Complete |
| F4.5 | Secure workspace | `--dest` flag, `tests/fixtures/workspace/`, `just dev` protected | ✅ Complete |
| F5 | CI/CD + Cross-platform | Multi-platform builds, release automation | ✅ Complete |
| F5.5 | npm + bunx publishing | npm package @fisherk2-dev/codice, installation via bunx | ✅ Complete |
| F6 | Documentation | README, CHANGELOG, final ADRs | ✅ Complete |
| F6.5 | Tech Debt + Coverage Gap Closure | VersionComparator refactor, pathResolver defense-in-depth, TECH_DEBT.md | ✅ Complete |
| FEV-1 to FEV-23 | See section 3 | Critical issues, SDD refactor, CI/CD, docs, agent packs, installer UX | ✅ Complete |
| FEV-24 | New v2.1 commands: `/sync`, `/migrate`, `/deploy`, `/analyze` + SDD plugin refactor | #68, #67, #64, #57 | ✅ Complete (2026-08-11) |
| FEV-25 | Delegation rules in primary agents | #69 | ✅ Complete (2026-08-11) |
| FEV-26 | Quick Wins: Bug fixes + Security patches + Documentation | #79, TD-V2-70, TD-V2-90, TD-V2-91, TD-V2-93 | ✅ Complete (2026-08-20) |
| FEV-27 | Security & Observability: Plugin cleanup + Permissions + Backup safety | #80, #81, TD-V2-9, TD-V2-51 | ✅ Complete (2026-08-20) |
| FEV-28 | Infrastructure & Performance: CI SHA-pins Node 24 + VersionComparator cache | TD-V2-7, TD-V2-61 | ✅ 2026-08-21 (1935 tests) |
| FEV-29 | Migration `permission:`/`tools:` → `permissions:` (native V2 list) in the remaining agent packs (Opencode V2) | #91 | ✅ Complete (2026-09-22) — 349 files, 8 commits per pack |
| FEV-30 | SDD plugin removal + Legacy banner + hardening review (5 axes) | #90 | ✅ Complete (2026-09-22) — 20 commits, 1865 tests, 31/31 e2e |
| FEV-31 | Issues #111–#116 + repair of orphan references + payload registration out of scope | #111 #112 #113 #114 #115 #116 | ✅ Complete (2026-11-17) — 2027 tests, 31/31 e2e |

## 2. Initial Phases (F0 – F6.5)

| Phase | Description | Key Results | Date |
|------|-------------|------------------|-------|
| **F0** | Environment setup | TypeScript strict, Biome, Just, CI/CD matrix | 2026-06-15 |
| **F1** | Base infrastructure | BunFileSystem, GitHubRestClient, ClackPromptsAdapter | 2026-06-16 |
| **F2** | Domain and services | FileMergeEngine, VersionComparator, Result type | 2026-06-16 |
| **F3** | CLI and use cases | main.ts, DI container, 3 modes, parse-args | 2026-06-16 |
| **F4** | E2E + CI | 6 scenarios, CI matrix, coverage ~89% | 2026-06-17 |
| **F4.5** | Secure workspace | `--dest` flag, fixtures, ADR-005 | 2026-06-17 |
| **F4.6** | Code review post-F4 | TemplateResolver + AtomicStager extracted, critical bugs | 2026-06-17 |
| **F5** | Complete CI/CD | Multi-platform builds, release automation | 2026-06-25 |
| **F5.5** | npm publishing | @fisherk2-dev/codice, bunx support | 2026-06-25 |
| **F6** | Documentation | README, CHANGELOG, CONTRIBUTING, ARCHITECTURE | 2026-06-26 |
| **F6.5** | Tech debt closure | Coverage gaps closed, benchmarks, TECH_DEBT.md | 2026-06-26 |

**F0–F6.5 metrics:** 284 tests, 0 fail, 593 expects, coverage ~89%, 15/15 E2E

## 3. Evolutionary Phases (FEV-1 to present)

All evolutionary phases, completed and pending. Summary by version:

| Version | FEVs | Key deliverable | Result |
|---------|------|------------------|-----------|
| v1.0.x | FEV-1–5 | Critical issues, bunx resolution, post-install symlink/gitignore, SDD refactor, CI/CD | 487 tests, 15/15 E2E, 98.13% coverage |
| v1.1.x | FEV-6–10 | Quick config, agent governance, Obsidian subagent, MCP, TypeScript 6.x | 581 tests, 15/15 E2E, 98.13% coverage |
| v1.2.0 | FEV-11–16 | Binary removal (npm-only), references, UX, community standards, debt closure | 844 tests, 15/15 E2E, 98.1% coverage |
| v2.0.0 | FEV-17–23 | Template packs, agent classification, permission unification, pack wizard, install summary | 1920 tests, 30/30 E2E, 95.68% overall / 99.12% src |
| v2.1.0 | FEV-24–25 | `/sync`, `/migrate`, `/deploy`, `/analyze` + agent delegation protocol | 2052 tests, 31/31 E2E, ≥95% coverage |
| v2.1.1 | FEV-26–28 | Bug #79, security patches, plugin cleanup, external permissions, CI Node 24, semver cache | 1935 tests, 31/31 E2E, ≥95% coverage |
| v2.1.2 | Hotfix (no FEV) | docs-update delegation fix + debt reorganization | 1935 tests, 31/31 E2E, ≥95% coverage |
| v2.1.3-beta.1 | FEV-29–30 | Native V2 `permissions:` migration (349 files), SDD plugin removal + legacy banner | 1865 tests, 31/31 E2E, ≥95% coverage |
| v2.1.5 | FEV-31 + pre-launch + docs pass | Issues #111–#116, orphan references repaired; beta published under dist-tag `beta`, stable **ready for deployment (not published)** | 2027 tests, 31/31 E2E, 96.95% coverage (local) |

## 4. Testing Strategy by Phase

| Type | Scope | Tool | Success Criteria |
|------|---------|-------------|-------------------|
| Unit | Domain (entities, services, types) | Bun test | 100% func lines |
| Integration | Adapters, Use Cases, CLI | Bun test | > 95% func/lines |
| E2E | 31 CLI scenarios in isolated directories | bash + fixtures | 31/31 passing |
| Packaging | npm tarball structure | Bun test | 5/5 scenarios |
| Coverage | Overall coverage | bun test --coverage | ≥95% lines, ≥95% funcs |

## 5. Progress Metrics

### v2.0.0 (final release — 2026-08-07)

- **Total tests:** 1920 tests, 0 fail
- **E2E tests:** 30/30 passing
- **Coverage:** 95.68% overall / 99.12% production `src/`
- **`just check`:** 0 errors
- **FEV-17 to FEV-23:** All complete
- **Total v2.0.0 effort:** ~41h implementation + ~9h overhead (code reviews, wiki sync, release)

### v2.1.0 (FEV-24 and FEV-25 complete — 2026-08-12)

- **Total tests:** 2052 tests, 0 fail
- **E2E tests:** 31/31 passing (v2.1 added scenario 31)
- **`just check`:** 0 errors (146 files)
- **Coverage:** ≥95% lines, ≥95% funcs (production `src/`)
- **FEV-24:** Complete (8 sub-phases: 4 commands + docs + plugin + integration + review)
- **FEV-25:** Complete — delegation protocol in 6 primary agents (Issue #69)
- **SDD plugin:** INTENT_PATTERNS removed → auto-discovery + SPANISH_INTENT_KEYWORDS overlay
- **CI/CD:** Real branch protection (main/develop), SHA-pinned actions, PR/issue templates, npm provenance SLSA v1
- **Release:** v2.1.0-beta.1 published to npm (dist-tag beta), tag v2.1.0-beta.1

### Release history

| Release | Tests | E2E | Coverage | Date |
|---------|-------|-----|----------|-------|
| v1.0.3 | 343 | 6/6 | ~89% | 2026-06-16 |
| v1.0.11 | 476 | 15/15 | ~89% | 2026-06-26 |
| v1.0.14 | 487 | 15/15 | 98.13% | 2026-07-09 |
| v1.1.0 | 581 | 15/15 | 98.13% | 2026-07-10 |
| v1.2.0 | 844 | 15/15 | 98.1% | 2026-08-03 |
| v2.0.0 | 1920 | 30/30 | 95.68% | 2026-08-07 |
| v2.1.0-beta.1 | 2052 | 31/31 | ≥95% | 2026-08-12 |
| v2.1.1 | 1935 | 31/31 | ≥95% | 2026-08-25 |
| v2.1.2 | 1935 | 31/31 | ≥95% | 2026-08-28 |
| v2.1.3-beta.1 | 1865 | 31/31 | ≥95% | 2026-09-22 |
| v2.1.3 (stable) | 1959 | 31/31 | 96.39% | 2026-09-23 |
| v2.1.4 (hotfix, npm `latest`) | 1959 | 31/31 | ≥95% | 2026-09-25 |
| v2.1.5-beta.1 (published, dist-tag `beta`) | 2027 | 31/31 | 96.95% (local) | 2026-11-18 |
| v2.1.5 (ready — stable not yet published, `latest` at 2.1.4) | 2027 | 31/31 | 96.95% (local) | 2026-11-19 |
