# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0-beta.2] — 2026-08-18

### Fixed
- **Review hardening (beta.1 → beta.2):** `BunSymlinkCreator.createLink` now guards `mkdir({recursive:true})` with try/catch returning `SymlinkError` so a parent-dir creation failure degrades gracefully as a warning (was an unhandled rejection → fatal crash). Added unit test for nested parent-dir creation (10 scenarios, 1692 pass). Added missing ADR-016..ADR-020 (new-commands, sdd-intent-auto-discovery, agent-delegation, cicd-hardening, spec-modularization) so `docs/ARCHITECTURE.md` links resolve.

## [2.1.0] — 2026-08-12

### Added
- **4 New Agent-Orchestration Commands:**
  - `/sync` (FEV-24-A, Issue #68) — Bidirectional git sync with 4 modes
    (full-sync, incremental-sync, dry-run, conflict-resolution) and 4 conflict
    resolution strategies (NEWER_WINS, GITHUB_WINS, LOCAL_WINS,
    INTELLIGENT_MERGE). Agent: `tlaloc`.
  - `/migrate` (FEV-24-B, Issue #67, **OPTIONAL**) — Technology stack migration
    planner with impact analysis, breaking change detection, and automatic
    documentation updates (`MIGRATION.md`, `WORKFLOW.md`, `specs/`). Agent:
    `quetzalcoatl`.
  - `/deploy` (FEV-24-C, Issue #64) — Git workflow and CI/CD configuration
    assistant. 3 modes (no workflow, betterable, established), generates
    branch protection rules, PR templates, and pipeline YAML. Agent:
    `mictlantecuhtli`.
  - `/analyze` (FEV-24-D, Issue #57) — Multi-dimensional architectural
    analysis (8 dimensions: system structure, design patterns, dependency
    architecture, data flow, scalability, security, testability, documentation).
    Generates prioritized `TECH_DEBT.md` with Critical/High/Medium/Low findings.
    Agent: `quetzalcoatl`.
- **SDD Plugin Intent Auto-Discovery (FEV-24, Issue #53):** Filesystem-based
  detection of command keywords replaces hardcoded `INTENT_PATTERNS` map.
  Auto-discovers keywords from `commands/*.md` frontmatter, merges with
  Spanish intent extensions and user overrides.
- **Bilingual Intent Support:** Spanish-language intent keywords for all
  17 commands. Keywords like "especificar" route to `/spec`, "sincronizar"
  routes to `/sync`. Uses Unicode-aware tokenization with stopword filtering.
- **FEV-24-D Integration:** `/diagnosis` now reads `docs/TECH_DEBT.md` as
  authoritative input for severity assessment and finding references.
- **Command Frontmatter Validation:** Schema-validated YAML frontmatter for all commands. New `commandFrontmatterValidator` ensures `description`, `agent`, and optional fields are correct. Tests in `tests/unit/domain/command-frontmatter-validation.test.ts` and `tests/unit/plugins/intentDiscovery.test.ts`.
- **Agent Delegation Protocol (FEV-25, Issue #69):** The six primary agents now
  analyze before acting — mapping the available subagents in `agents/` and the
  relevant skills in `skills/` before executing any instruction.
  - The four delegating agents (`huitzilopochtli`, `quetzalcoatl`, `tlaloc`,
    `mictlantecuhtli`) gained `### DELEGATION PROTOCOL`: every `task()` call must
    carry deterministic instructions, the skills the subagent must load, and a goal
    checklist the primary agent grades the returned work against.
  - The two non-delegating agents (`moctezuma`, `tezcatlipoca`) gained
    `### SKILL LOADING PROTOCOL`: the same up-front analysis without delegation,
    plus a self-review checklist.
  - Canonical contract documented in `specs/spec-agent-format-v2.md` §8.

### Changed
- **Command count:** 13 → 17 (4 new commands added to `template/obligatorio/core/commands/`)

### Deprecated
- N/A (no deprecations in v2.1.0)

### Removed
- N/A (no removals in v2.1.0)

### Fixed
- **Progress bar double-advance:** `createProgressCallback` now advances the progress bar once per staged file (on `stage_complete`) instead of twice (was advancing on both `stage_start` and `stage_complete`).
- **Confirm prompt default alignment:** `ClackPromptsAdapter.confirm()` now defaults to `No` when `defaultYes` is unspecified, matching `confirmOverwrite()`'s defensive default. `UpdateWorkspaceUseCase` explicitly passes `true` to preserve the update confirmation UX.
- **UpdateWorkspaceUseCase refactor:** Extracted `maybeConfirmUpdate` and `finishUpdate` to `updateHelpers.ts` for single-responsibility compliance.

### Security
- **Git-workflow-master permission tightening:** `write` and `edit` permissions changed from `allow` to `ask`. Bash allowlist restricted to safe read-only commands plus specific git operations.
- **Confirm-default-No safety:** Destructive operations default to "No" confirmation, preventing accidental overwrites.

## [2.1.0-beta.1] — 2026-08-12

Pre-release for v2.1.0. Package: `@fisherk2-dev/codice`. Previous stable release: v2.0.0.

This pre-release includes the full v2.1.0 feature set (4 new commands, SDD plugin intent auto-discovery, bilingual intents, agent delegation protocol) plus CI/CD hardening and security fixes: 2052 tests passing, 31/31 E2E scenarios.

### Added

- **4 New Agent-Orchestration Commands:** `/sync` (FEV-24-A), `/migrate` (FEV-24-B, OPTIONAL), `/deploy` (FEV-24-C), `/analyze` (FEV-24-D). Full details in the [2.1.0](#210--2026-08-12) section.
- **SDD Plugin Intent Auto-Discovery (FEV-24, Issue #53):** Filesystem-based detection of command keywords replaces hardcoded `INTENT_PATTERNS` map.
- **Bilingual Intent Support:** Spanish-language intent keywords for all 17 commands with Unicode-aware tokenization and stopword filtering.
- **Agent Delegation Protocol (FEV-25, Issue #69):** Six primary agents now analyze before acting — mapping subagents and skills before executing, with `task()` calls carrying deterministic instructions, skills to load, and goal checklists.
- **CI/CD Hardening:** Branch protection for `main` and `develop`, PR/Issue templates, pinned GitHub Actions by SHA, OIDC npm provenance, `just test-packaging` + `just check-plugin` + `just test-plugin-integration` wired into CI, `bun pm scan` security audit, reusable quality gate for releases, and post-publish smoke test verification.

### Changed

- **Command count:** 13 → 17 (4 new commands added to `template/obligatorio/core/commands/`).

### Fixed

- **Chrome DevTools MCP reference:** Broken `@anthropic/chrome-devtools-mcp@latest` reference replaced with pinned `chrome-devtools-mcp@1.7.0` (the `@anthropic/` scoped package returns 404 on npm).
- **Git workflow agent permissions:** Explicit git command allowlists with `git apply *` / `git am *` denied in `git-workflow-master.md` and `git-workflow-manager.md`.
- **Jupyter token handling:** `MCP_JUPYTER_TOKEN` moved to env indirection instead of a literal placeholder.
- **Sync command `lastCommit` validation:** Malformed or missing `lastCommit` rejected with actionable error.

### Security

- **Branch protection enforced** on `main` and `develop` (required status checks, no force pushes, PR flow required).
- **npm publish with provenance:** OIDC-based trusted publishing with `--provenance` replaces static token-only flow.

## [2.0.0] — 2026-08-07

Final release of v2.0.0. Package: `@fisherk2-dev/codice`. Previous stable release: v1.2.0.

This release includes all changes from [2.0.0-beta.1](#200-beta1--2026-08-07) plus final integration testing (FEV-23): 1920 tests, 30/30 E2E scenarios, coverage 95.68% overall / 99.12% production `src/`.

### Added (since beta.1)

- **5 new E2E scenarios** (26–30): update blocked pre-1.2.0, update Option B, flat agents destination, non-interactive packs, project install packs.
- **8 new unit/integration tests**: Option B cancel path, pack-aware project install, clean-install summary passthrough, version-context classification.
- **33 plugin source tests**: `directoryScanner.ts` and `autoDiscovery.ts` coverage (overall coverage 93.78% → 95.68%).

### Changed (since beta.1)

- **E2E 23 rewritten** as a real Option A pack-scoped merge — the FEV-21 transitional no-op removed; update merge is now functional with the bundled v2.0.0 template.
- **Version bumped** 1.2.0 → 2.0.0 for final release.

### Fixed (since beta.1)

- **E2E 10**: equal-version "already up to date" short-circuit confirmed as permanent behavior, not transitional workaround.
- **E2E 04/15/16**: comment-only cleanup.

## [2.0.0-beta.1] — 2026-08-07

Pre-release for v2.0.0. Package: `@fisherk2-dev/codice`. Previous stable release: v1.2.0.

### Added

- **Agent pack system** with 8 selectable packs (software-development, business, hardware-emerging, science-research, operations-support, finance, creative, government-legal) + 2 mandatory directories (main, writers). 352 unique agents distributed across packs. (`FEV-17`, `FEV-18`)
- **Installer UX v2** with pack selection wizard, version-gated updates, and install summary screen showing agent counts per pack. (`FEV-21`, `FEV-22`)
- **Update status check** — remote version comparison before update; Update mode blocked for installations older than v2.0.0 with specific migration guidance. (`FEV-21`)
- **SDD plugin auto-discovery** — filesystem-based detection of commands, agents, and intent patterns; config-driven behavior via optional `opencode.json` `sddPipeline` section. (`FEV-13`, ADR-013)
- **References co-located with skills** — 59 reference files moved from centralized `references/` to `skills/<name>/references/` for co-location. (`FEV-12`, ADR-012)
- **Post-installation symlink generation** — `ISymlinkCreator` port + `BunSymlinkCreator` adapter generates `.opencode/` symlinks after npm extraction. (`ADR-008`)
- **Post-installation gitignore generation** — `IGitignoreCreator` port + `BunGitignoreCreator` adapter generates `.gitignore` after npm extraction. (`ADR-009`)
- **`noTemplateCopy` flag** on `FileRule` for virtual manifest entries whose content is generated post-installation. (`ADR-010`)
- **Atomic staging with backup/rollback** — all writes go through staging directory + rename; interrupted operations leave destination untouched. (`ADR-003`)
- **Path traversal prevention** — all paths validated against destination boundary before any write operation. Exit code 1 on rejection.
- **SIGINT cleanup** — staging directories removed on normal exit and interrupt signal.
- **CLI flags:** `--version`, `--help`, `--verbose`, `--dest <path>`, `--force`, `--mode <mode>`, `--packs <list>`, `--packs-all`, `--update-add-packs <list>`.
- **Install summary screen** (`FEV-22`) — shows packs with agent counts, mandatory dirs, selected optionals, and total agents/files estimate before merge.
- **Update modes** (`FEV-21`) — Option A (current packs only) and Option B (add packs with installed packs locked).
- **Progress bar during installation** (`FEV-14`) — structured `ProgressEvent` union with `clack.progress()` rendering across all three modes.
- **`/help` slash command** (`FEV-14`) — interactive help menu with 6 onboarding options.
- **Permission unification** (`FEV-19`) — 4 primary delegators unified to `"*": allow` + deny pattern; 106 explicit allow-list entries removed.
- **Subagent table removal** (`FEV-19`) — all subagent index/catalog sections removed from 6 primary agents; RULES now reference `agents/` directory directly.
- **1920+ tests** (unit, integration, E2E, packaging) with 30/30 E2E scenarios passing.
- **Coverage:** 95.68% overall / 99.12% production `src/`.

### Changed

- **BREAKING: Binary compilation removed.** npm/bunx is the sole distribution method. Compiled binaries are no longer produced. See [ADR-011](specs/adr/adr-011-binary-removal.md) for migration details.
- **Template resolver extracted** to dedicated `TemplateResolver` class (was inline in `BunFileSystem`).
- **AtomicStager extracted** from `BunFileSystem` — separate class for staging, commit, and rollback operations.
- **`parse-args.ts` split** — `validateDestPath` extracted to its own module.
- **`UpdateWorkspaceUseCase` split** — `updateStatusCheck` extracted as a standalone function.
- **`main.ts` split** — signal handlers extracted to separate module.
- **`errorTypeGuards` relocated** to `src/domain/types/` for domain purity. (`ADR-010`)
- **`FileRuleManifestData`** restructured from flat mandatory entries to hierarchical `core/` + `packs/` groupings with `destPath` support.
- **`IFileMergeEngine.execute`** accepts `MergeExecuteOptions` object instead of positional parameters.
- **FileMergeEngine** — tree-level diff replaces directory-level skip for standard rules in update mode.
- **Coverage thresholds** — CI now enforces ≥95% lines/functions.

### Fixed

- **Pre-existing test flakiness** — `mock.module` leak and hardcoded `/tmp` paths resolved.
- **SIGINT during `commitStaging`** leaving residual artifacts — staging cleanup now runs on all exit paths.
- **Biome import ordering violations** — consistent import grouping enforced.
- **Domain purity** — `NodeJS.ErrnoException` reference removed from domain layer.
- **Progress bar re-creation** (`FEV-14`) — `showProgressBar()` was called on every event, orphaning previous instances. Fixed with `barStarted` closure flag.
- **Progress total included skipped files** (`FEV-14`) — `total` now reflects only staged files.
- **Symlink/gitignore logs emitted before operations** (`FEV-14`) — success logs moved inside `runPostInstallSteps()`.
- **Standard directory updates** (`FEV-16`) — new files in standard directories now reach existing users during update.

### Security

- **Path traversal rejection** validated via E2E tests — `../` sequences in destination paths cause exit code 1.
- **Staging directory cleanup** on normal exit and SIGINT — prevents residual artifacts in user projects.
- **Destructive command restrictions** (`FEV-7`) — 53 bash command patterns blocked at runtime and config level.
- **Windows system directory protection** — `C:\ProgramData`, `C:\Users`, and drive root check added to `--dest` validation blocklist.
- **Symlink path containment hardened** — `BunSymlinkCreator` normalizes `workspaceRoot` via `path.resolve()` before prefix matching.

## [1.2.0] — 2026-08-03

### Added

- **Review fixes from `/ship` v1.2.0-beta.1:** Security (URL validation gated behind `NODE_ENV=test`), path safety (`withTrailingSeparator` handles root), performance (`FileMergeEngine.execute` lazy allocation), comments (untrusted-input notes), tests (direct unit tests for `isPathWithin`/`withTrailingSeparator`).
- **Dependencies:** `@biomejs/biome` 2.5.3 → 2.5.6, `@types/semver` 7.7.1 → 7.8.0.
- **ADR-011:** Binary Removal — documents the architectural decision.
- **SDD Plugin Auto-Discovery** (`FEV-13`): 6 hardcoded maps extracted to `autoDiscovery.ts` — commands, agents, and intent patterns detected from filesystem.
- **Config-Driven Plugin Behavior** (`FEV-13`): `INTENT_PATTERNS`, `COMMAND_PHASE_MAP`, `PHASE_SUGGESTIONS` moved to `defaults.ts` with optional `opencode.json` override.
- **Progress bar during installation** (`FEV-14`): `ProgressEvent` discriminated union, `clack.progress()` rendering, `logProgressEvent()` dispatcher.
- **`/help` slash command** (`FEV-14`): Interactive help menu with 6 options assigned to Huitzilopochtli.
- **Spec/ADR templates** (`FEV-14`): MADR v4.0 ADR template and RFC-based spec template.
- **Project Code of Conduct** (`FEV-15`): `CODE_OF_CONDUCT.md` adapted from Contributor Covenant v2.1.
- **Template Code of Conduct** (`FEV-15`): `template/estandar/CODE_OF_CONDUCT.md` with placeholders.
- **Pre-release Tech Debt Closure** (`FEV-16`): 5 TECH_DEBT.md items resolved — coverage foundation, use case refactor (Template Method), performance benchmarks, update granularity, coverage instrumentation.
- **`/test` command:** Ensures `test/` directory with `unit/`, `integration/`, `e2e/` subdirectories; prompts to refactor existing tests.
- **`/ship` command:** Post-Phase-C incremental-fix phase for resolving review observations.

### Changed

- **BREAKING: Binary compilation removed.** See ADR-011 for details.
- **References Restructuring** (`FEV-12`): 59 reference files moved to `skills/<name>/references/` for co-location.
- **Wiki Rewrite** (`FEV-13`): 8 Wiki pages rewritten for end users.
- **Quality Infrastructure** (`FEV-13`): Biome config extended to plugin directories; Justfile targets added.
- **Documentation Reduction** (`FEV-13`): WORKFLOW.md, CHANGELOG.md, SPEC.md trimmed to target line counts.
- **DRY extraction** (`FEV-14`): `createProgressCallback()` shared helper; symlink/gitignore logs moved to `postInstall.ts`.
- **Coverage thresholds:** CI now enforces ≥95% lines/functions.
- **main.ts:** `runMode` restructured from switch to if/else for complete branch coverage.

### Fixed

- **Progress bar re-creation on every `stage_start`** (`FEV-14`): Orphaned `clack.progress()` instances.
- **Progress total included skipped files** (`FEV-14`): Bar always reaches 100%.
- **Symlink/gitignore logs emitted before operations** (`FEV-14`): False success on failure.
- **Standard directory updates** (`FEV-16`): New files in standard directories now reach existing users.
- **Error context enrichment:** `wrapMergeError()` preserves phase/path in user-facing messages.

### Removed

- **BREAKING: `.devin/` optional directory removed.** Compatibility layer no longer installed.

## [1.1.3] — 2026-07-11

### Fixed

- **Windows EPERM in `destinationExists()`:** `fs.access()` throws `EPERM` instead of `EACCES` on Windows with restricted permissions. Both now treated as "path exists but unreadable".

## [1.1.2] — 2026-07-11

### Changed

- **`confirmOverwrite()` DRY extraction:** Shared helper extracted from 3 use cases (~40 lines eliminated).
- **`VERSION` module extraction:** Moved from `output.ts` to `src/cli/version.ts` for layer boundary compliance.
- **`GitHubRestClient` error handling:** Consolidated HTTP error branches; removed dead `AbortError` branch.
- **`AtomicStager` I/O:** Switched from `Bun.file().text()` + `Bun.write()` to `fs.copyFile()` for kernel-level copy.

### Fixed

- **Windows system directory validation:** Path prefix matching uses `path.sep` instead of hardcoded `/`.
- **`AtomicStager` backup detection:** `Bun.file().exists()` returns `false` for directories — switched to `fs.access()`.

### Security

- **Windows system directory protection expanded:** Added `C:\ProgramData`, `C:\Users`, and drive root check.
- **Symlink path containment hardened:** `workspaceRoot` normalized via `path.resolve()`.

## [1.1.1] — 2026-07-11

### Added

- **Documentation synchronization:** Comprehensive audit across 14 files — SPEC.md, README.md, CONTRIBUTING.md, ARCHITECTURE.md, Wiki pages all updated.

### Fixed

- **Update Workspace version comparison:** Now compares against bundled template version instead of GitHub remote API.
- **CI version validation:** Pre-release suffix stripped before comparing tag vs package.json version.

## [1.1.0] — 2026-07-10

### Added

- **Agent Governance** (`#26`): No-assumption and delegation-first rules merged into primary agents.
- **Destructive Command Restrictions** (`#30`): 53 bash command patterns restricted in defense-in-depth configuration.
- **Step counts** (`#27`): Adjusted for 6 primary agents.
- **SECURITY.md** (`#28`): Created at `docs/SECURITY.md` and `template/estandar/docs/SECURITY.md`.
- **5 new MCP servers** (`#29`): tavily, firecrawl, vercel-grep, gitmcp; total now 9.
- **Agent KNOWLEDGE chain updated** (`#29`): All 6 primary agents reference MCP server category.
- **npm packaging integration tests** (`TD-5.3`): 5 scenarios validating tarball structure.
- **Obsidian subagent** (`#21`): `obsidian-vault-writer` with 3 Obsidian skills.
- **Wiki expansion** (`#29`): `MCP-Servers.md` extended to 9 pre-configured servers.

### Changed

- **`opencode.json` mcp section** (`#29`): Now lists 9 MCP servers.
- **`IFileSystem` port split** (`TD-2.1`): Interface Segregation — `IFileSystem` reduced from 10 to 6 methods; new `IStagingSystem` port extracted.
- **TypeScript 6.0.3 upgrade** (`TD-3.1`): No breaking changes.
- **Regex hardening:** `chmod 777`, `find -exec`, `export PATH=` patterns broadened and refined.

### Fixed

- **Side-effect tarball cleanup:** `bun pm pack` artifact cleaned in test teardown.

### Security

- **Destructive command hardening** (`#30`): rm -rf, git push --force, DROP DATABASE, and 40+ patterns blocked.
- **Bypass vector closure:** `chmod 0777` (leading octal zero) and `find -execdir` variants closed.

## [1.0.15] — 2026-07-09

### Fixed

- Wiki README removed from GitHub Wiki; npm republish blocked.

### Changed

- Wiki repo cloned inside project (`docs/wiki-source/.wiki/`).

## [1.0.14] — 2026-07-09

### Added

- GitHub Wiki (9 end-user pages), pre-release tag support (beta/rc).

### Changed

- `ci.yml` triggers on `develop` branch; `release.yml` detects pre-release tags.

### Removed

- `docs/opencode/` from project root and template.

## [1.0.13] — 2026-06-27

### Added

- `docs-update/` command, `diagnosis/` command.

### Changed

- `evolve/` command simplified; agent governance strengthened.

## [1.0.12] — 2026-06-27

### Fixed

- Windows CI symlink test skipped on Windows; E2E stdout verification.

## [1.0.11] — 2026-06-26

### Fixed

- Update workspace directory detection; GitHub version check repository name corrected.

## [1.0.10] — 2026-06-26

### Added

- `noTemplateCopy` flag on `FileRule`; optional files menu in Clean Install; `.devin` directory support.

### Fixed

- `.devin` directory not found in bunx mode (CRITICAL); inconsistent Clean/Project Install UX.

## [1.0.9] — 2026-06-26

### Added

- `IGitignoreCreator` port, `GitignoreError` type, `BunGitignoreCreator` adapter, 10 new tests, 2 E2E scenarios.

### Fixed

- `.gitignore` post-install generation for bunx compatibility (`#11`).

### Deprecated

- v1.0.8 (gitignore not found in bunx mode).

## [1.0.8] — 2026-06-26

### Fixed

- TypeScript strict mode errors (3 `tsc --noEmit` fixes).

### Deprecated

- v1.0.7 (TypeScript compilation errors).

## [1.0.7] — 2026-06-26

### Added

- `ISymlinkCreator` port + `BunSymlinkCreator` adapter; post-install symlink generation (10 symlinks).

### Fixed

- npm resolves symlinks in tarballs — `.opencode/{agents,commands,skills}` removed from manifest (`#8` CRITICAL).

### Deprecated

- v1.0.6 (symlink packaging issue).

## [1.0.6] — 2026-06-25

### Added

- 4 missing optional manifest entries; manifest completeness test.

### Fixed

- Template path resolution in bunx mode (`#8` CRITICAL).

## [1.0.5] — 2026-06-25

### Added

- ADR-007 (template resolution for bunx/npm); credential file permissions; TECH_DEBT.md.

### Changed

- UpdateWorkspace rule transformation preserves Estándar files; CONTRIBUTING.md rewritten.

### Fixed

- bunx template detection cascade (`#6` CRITICAL); update preserves standard files (`#2` CRITICAL).

### Security

- Extended credential denial patterns.

## [1.0.4] — 2026-06-17

### Added

- VersionComparator exported validators; 8 new unit tests; pathResolver guard test; ClackPromptsAdapter tests; TECH_DEBT.md.

### Changed

- Coverage to 97.66% functions / 96.52% lines.

## [1.0.3] — 2026-06-16

### Added

- CLI with 3 installation modes (Clean, Project, Update); interactive TUI (@clack/prompts); atomic file operations; file classification engine; semantic version checking; path traversal prevention; `--dest`/`--force`/`--verbose` flags; cross-platform binaries; CI/CD pipeline; npm publication; ADR-001–006; E2E test suite (6 scenarios); 343 unit/integration tests.

### Changed

- Codebase DRY refactored; BunFileSystem decomposed (TemplateResolver + AtomicStager); IFileSystem port relocated; package renamed to `@fisherk2-dev/codice`.

### Fixed

- Template path resolution in compiled binaries; `console.warn` removed; cross-platform echo normalization; release workflow SHA pinning.

### Removed

- Legacy F5/F6 planning files.

### Security

- Path traversal prevention; symlink skipping in directory walk; SHA-256 checksums.

[Unreleased]: https://github.com/fisherk2/codice-opencode/compare/v2.1.0...HEAD
[2.1.0]: https://github.com/fisherk2/codice-opencode/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/fisherk2/codice-opencode/compare/v2.0.0-beta.1...v2.0.0
[2.0.0-beta.1]: https://github.com/fisherk2/codice-opencode/compare/v1.2.0...v2.0.0-beta.1
[1.2.0]: https://github.com/fisherk2/codice-opencode/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/fisherk2/codice-opencode/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/fisherk2/codice-opencode/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/fisherk2/codice-opencode/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/fisherk2/codice-opencode/compare/v1.0.15...v1.1.0
[1.0.15]: https://github.com/fisherk2/codice-opencode/compare/v1.0.14...v1.0.15
[1.0.14]: https://github.com/fisherk2/codice-opencode/compare/v1.0.13...v1.0.14
[1.0.13]: https://github.com/fisherk2/codice-opencode/compare/v1.0.12...v1.0.13
[1.0.12]: https://github.com/fisherk2/codice-opencode/compare/v1.0.11...v1.0.12
[1.0.11]: https://github.com/fisherk2/codice-opencode/compare/v1.0.10...v1.0.11
[1.0.10]: https://github.com/fisherk2/codice-opencode/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/fisherk2/codice-opencode/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/fisherk2/codice-opencode/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/fisherk2/codice-opencode/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/fisherk2/codice-opencode/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/fisherk2/codice-opencode/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/fisherk2/codice-opencode/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/fisherk2/codice-opencode/releases/tag/v1.0.3
