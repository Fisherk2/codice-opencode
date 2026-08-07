# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **FEV-20 — Plugin VALID_SUBAGENTS Removal (v2.0 Phase 4):**
  - Removed the hardcoded `VALID_SUBAGENTS` Set (~110 entries) from the SDD plugin's `validSubagents.ts`; `PRIMARY_AGENTS` (6 built-in agents) is now the only hardcoded list.
  - `defaults.ts` no longer imports/re-exports `VALID_SUBAGENTS`; `DEFAULTS` holds 5 maps (was 6).
  - `sdd-pipeline.ts` fallback changed from `DEFAULTS.VALID_SUBAGENTS` to `new Set(PRIMARY_AGENTS)` — when no `agents/` directory exists, only the 6 primary agents are valid.
  - Error message updated: "Use an agent from the VALID_SUBAGENTS catalog" → "Create an .md file in the agents/ directory or use a primary agent".
  - `discoverValidSubagents()` now scans the `agents/` directory **recursively** (forward-compatible with `packs/<name>/` layouts) and skips hidden entries (`.git`, `.opencode`, dot-files). Names are lowercased so `task()` validation is case-insensitive.
  - Markdown scanners extracted to a new `directoryScanner.ts` module (keeps `autoDiscovery.ts` under the 200-line convention).
  - Tests: removed 2 `VALID_SUBAGENTS` assertions in `defaults.test.ts`; added 4 auto-discovery tests (nested subdirs, hidden dirs, hidden dot-files, lowercase normalization); `toolExecuteBefore.test.ts` rewritten to model filesystem discovery.
  - Wiki `SDD-Pipeline.md` updated: agent count 104 → ~361, error message example, recursive-scan note, module table.

- **FEV-20 — Post-review hardening (5-axis code review fixes):**
  - `directoryScanner.ts`: `scanMarkdownFilesRecursive` now takes `maxDepth = 10` to guard against stack overflow on pathological trees; a shared `seen`-set across recursion levels emits a `console.debug` warning when the same agent basename appears in two subtrees (previously silent dedup via the caller's `Set`). Extracted internal `scanTree` helper to share accumulators while keeping the public `(dir, maxDepth?)` signature.
  - `autoDiscovery.ts`: `discoverValidSubagents` seeds the `Set` from `PRIMARY_AGENTS` (already lowercase) and lowercases only discovered names — avoids the intermediate spread+map array. Guard comment on `parseAgentFromFrontmatter` clarified (noUncheckedIndexedAccess enabled in both root and plugin tsconfigs).
  - `mergeConfig.ts`: added lookup guard on `merged[phase]` required by noUncheckedIndexedAccess.
  - `sdd-pipeline.ts`: unknown-subagent error now includes the absolute `agents/` path (`${join(projectDir, "agents")}/`) per CODE_STYLE actionable-message guidance.
  - Plugin `tsconfig.json`: enabled `noUncheckedIndexedAccess: true` so the plugin's own compiler enforces the guard (previously only the root tsconfig enforced it, and it excludes `template/`).
  - Tests: added test 15 (duplicate basenames dedupe + warning emitted via `spyOn(console, "debug")`) and test 11 (non-primary agents excluded from `discoverAgentMentionPatterns`) in `autoDiscovery.test.ts`; `defaults.test.ts` and `autoDiscovery.test.ts` updated for noUncheckedIndexedAccess (optional chaining on record lookups).
  - `just check-plugin` now runs `tsc` against the plugin tsconfig (previously Biome only).

- **FEV-19 — Permission Unification & Subagent Table Removal (v2.0 Phase 3):**
  - Unified `task:` permissions for 4 primary delegators (huitzilopochtli, quetzalcoatl, tlaloc, mictlantecuhtli) to `"*": allow` + deny 5 other primaries pattern. Moctezuma and tezcatlipoca unchanged (`task: "*": deny`). 106 explicit allow-list entries removed (quetzalcoatl 21, tlaloc 73, mictlantecuhtli 12).
  - **Removed ALL subagent index/catalog sections from the 6 primary agents** (user decision 2026-08-05): huitzilopochtli's ~355-subagent AVAILABLE SUBAGENTS catalog included. RULES now reference the `agents/` directory: "use ANY subagents in `agents/`". Primary agents never delegate to each other.
- **FEV-19 — CONTRIBUTING.md:** "Add a New Agent" reduced from 5 steps to 3 (removed delegation-table step and huitzilopochtli catalog step). Removed "persona table updates" from primary agent requirements.
- **FEV-19 — Wiki Agents.md:** agent count 104 → ~355 in 10 packs, file tree `agents/` → `packs/`, permission model updated to unified pattern, "Step 4: Update Delegation Tables" removed. README subagent count 98 → 355.

### Added

- **FEV-22 — Installer UX Enhancements (v2.0 Phase 6):**
   - Per-pack agent counts: `FileRule.agentCount?` field populated for the 8 selectable packs (146, 92, 36, 31, 18, 11, 10, 8); `toPackOptions()` reads `agentCount ?? 0` (backward compatible)
   - Install summary screen (spec §3.3) before merge in Clean/Project install: packs with agent counts, mandatory dirs (core, main, writers), selected optionals, total agents + files estimate — informational only
   - New `IUserPrompt.showInstallSummary()` + `InstallSummaryInfo` type; pure `buildInstallSummary`/`formatInstallSummary` helpers (`src/application/installSummary.ts`, dedupes pack ids)
   - Wiki sync: Home/Getting-Started/Agents/Workspace-Structure updated to v2.0 (~360 agents in 10 packs)
   - Tests: +13 unit, +4 integration, +2 E2E (full suite 1872 tests, 0 failures; 25 E2E scripts); `just check` clean
   - Code simplification: flatMap restructure in `buildInstallSummary`, hoisted `options.force ?? false`, dropped async wrapper in `promptForPackSelection`, extracted `ESTIMATED_FILES_PER_MANDATORY_DIR` constant, removed dead `packIdFromPath` re-export
   - 5-axis code review (correctness, readability, architecture, security, performance): APPROVE — 3 nits fixed
   - No version bump (v2.0.0 coordinates at FEV-23); no new tech debt (TD-V2-6 remains open)

- **FEV-21 — Installer UX: Pack Selection & Version Detection (v2.0 Phase 5):**
  - Pack selection wizard: 8 selectable packs with `software-development` pre-selected; minimum 1 enforced; cancelling aborts before any file writes
  - Version detection: `.codice-version` read on startup; Update blocked for missing or < 2.0.0 installations with specific guidance
  - `.codice-version` v2.0 format: `{ version, installedPacks, installedAt, optionalSelections? }` (backward-compatible with legacy `installedVersion`)
  - Update mode: Option A (current packs only) and Option B (add packs with installed packs LOCKED); non-interactive `--update-add-packs`
  - 3 new CLI flags: `--packs <list>`, `--packs-all`, `--update-add-packs <list>` (pack IDs validated against the manifest)
  - 3 new IUserPrompt methods: `selectPacks()`, `showVersionInfo()`, `selectUpdateOption()`
  - New `RuleCategory`: `"pack"` (8 entries migrated from `"mandatory"`)
  - New helpers: `getPackRules()`, `filterByPacks()`, `packIdFromPath()`
  - 7 new E2E scripts (17-23); 4 update E2E scripts re-seeded for v2.0 format
  - ~75 new tests (unit + integration)
  - Tech debt: TD-V2-6 added in FEV-21 (No pack removal — deferred to v2.2.0)
  - Transitional note: Update merge is inert until the package is published at ≥ 2.0.0 (bundled version < 2.0.0 → "already up to date"); merge behavior covered by integration tests with `BUNDLED_TEST_VERSION=2.1.0`

- **FEV-17 — Template Directory Restructuring (v2.0 Phase 1):** `template/obligatorio/` restructured from flat (`agents/`, `commands/`, `skills/`, `opencode.json`, `skills-lock.json`, `.opencode/`) to hierarchical: `core/` (infrastructure) + `packs/{main,writers,sin-clasificar,<8 empty>}/` (agent packs). 6 primary agents moved to `packs/main/`, 3 writers to `packs/writers/`, 95 unclassified agents to `packs/sin-clasificar/` (pending FEV-18 classification). 8 empty pack directories created for FEV-18.

### Changed

- **FEV-17 — FileRuleManifestData:** Collapsed 7 standalone mandatory entries into 4 source groupings (`core` → destination root, `packs/main`/`packs/writers`/`packs/sin-clasificar` → `agents/`) using the new `destPath` field on `FileRule`. Standard + optional sections unchanged.
- **FEV-17 — destPath support:** `FileRule` gained optional `destPath`; `IStagingSystem.stageFile` / `BunFileSystem` / `FileMergeEngine` now support source ≠ destination paths, keeping the installed workspace flat (`agents/`, `commands/`, `opencode.json` at root) while the template source uses `core/` + `packs/` groupings.
- **FEV-17 — Tests updated:** 16+ unit/integration/plugin/packaging tests + 1 E2E script updated to new template paths.

### Fixed

- **FEV-18 — Dry-run hardening:** `scripts/reformat-agent-cli.ts` replaced the predictable `/tmp/.reformat-dry-run-target.md` path with a per-invocation `mkdtempSync` temp dir under `os.tmpdir()`, cleaned up in a `finally` block. The doc comment was corrected to accurately describe the write-then-delete behavior (previously claimed "never persisted" which was false — `reformatAgent` unconditionally writes to the target path). This closes the symlink-overwrite hazard on shared hosts.
- **FEV-18 — Stale references:** `tasks/plan.md` updated 11 occurrences of `scripts/reformat-agent.ts` to `scripts/reformat-agent-cli.ts` to reflect the CLI rename.

- **FEV-17 — Template path references:** README, CONTRIBUTING, WORKFLOW, TECH_DEBT, and CHANGELOG references to `template/obligatorio/{agents,commands,skills,opencode.json}` updated to `core/` / `packs/` locations.

### Added

- **FEV-18 — Agent Classification & Migration (v2.0 Phase 2):** 352 unique agents distributed across 8 selectable packs + 2 mandatory (main, writers). 257 new agents from `agency-agents-main/` reformatted to the v2.0 standard (YAML `mode: subagent` + `## COMPOSITION` block); 95 legacy v1.x agents distributed in original format. Pack counts: software-development 146, business 92, hardware-emerging 36, science-research 31, operations-support 18, finance 11, creative 10, government-legal 8. 10 REDUNDANT name collisions resolved (legacy wins).
- **FEV-18 — Agent Format v2.0 spec:** `specs/spec-agent-format-v2.md` defines source→target mapping, canonical YAML template, `## COMPOSITION` block, and idempotency rules.
- **FEV-18 — Reformat script:** `scripts/reformat-agent.ts` (idempotent conversion, `--dry-run`) + `scripts/reformat-agent-cli.ts` + `scripts/distribute-agents.ts` (batch distribution from Phase 0 audit mapping).
- **FEV-18 — Test coverage:** 26 new tests (`all-packs-present`, `pack-agent-counts`, `reformat-agent` 10, `distribute-agents` 4) + E2E scenario 1 extended with multi-pack agent assertions.

### Changed

- **FEV-18 — FileRuleManifestData:** 4 → 11 mandatory entries. Added 8 selectable pack entries (`packs/software-development`, `packs/business`, `packs/hardware-emerging`, `packs/science-research`, `packs/operations-support`, `packs/finance`, `packs/creative`, `packs/government-legal`), all with `destPath: "agents"`. Writers description updated (2 writers; scientific-literature-researcher moved to science-research).
- **FEV-18 — Huitzilopochtli catalog:** AVAILABLE SUBAGENTS expanded from ~96 to ~355 subagents, reorganized by pack.
- **FEV-18 — scientific-literature-researcher:** moved from `packs/writers/` to `packs/science-research/` (analysis agent, not writer — user decision).

### Removed

- **FEV-18 — `packs/sin-clasificar/`:** temporary pack removed; 95 legacy agents distributed to their target packs.
- **FEV-18 — 10 REDUNDANT new agents:** discarded (legacy v1.x versions retained for backward compatibility).

## [1.2.0] — 2026-08-03

### Added

- **Review fixes from `/ship` v1.2.0-beta.1:** All observations from the 4-persona ship review addressed:
  - **Security:** `CODICE_BYPASS_URL_VALIDATION` is now gated behind `NODE_ENV=test` so the URL-validation escape hatch can never be active in production (`src/infrastructure/config/constants.ts`). Coordinated with the 4 E2E scripts and `tests/integration/cli/main.test.ts` that set it.
  - **Path safety:** `withTrailingSeparator("/")` now returns the filesystem root unchanged instead of producing `//` (`src/infrastructure/adapters/pathResolver.ts`).
  - **Perf:** `FileMergeEngine.execute()` only allocates the optional-path list when standard directory rules exist; staging cleanup now also runs when nothing was staged (`total === 0`).
  - **Comments:** Untrusted-input note for `.codice-version` parsing in `UpdateWorkspaceUseCase`; empty catch in `safeEmit` documented as intentional; `PROGRESS_EMITTERS` comment corrected.
  - **Tests:** Direct unit tests added for `isPathWithin`/`withTrailingSeparator` (`tests/unit/adapters/path-resolver.test.ts`) and `isRuleSelected` (`tests/unit/domain/file-rule-manifest.test.ts`); unused `_makeRule` helper removed from `tests/integration/use-cases/update-granularity.test.ts`.
- **Dependencies:** `@biomejs/biome` 2.5.3 → 2.5.6, `@types/semver` 7.7.1 → 7.8.0 (TypeScript 6.x deferred — 7.x not yet adopted).
- **ADR-011:** Binary Removal — documents the architectural decision (see `specs/adr/adr-011-binary-removal.md`)
- **`tests/e2e/codice.sh`:** Wrapper script for `bun run src/cli/main.ts` in E2E tests
- **FEV-13 — SDD Plugin Auto-Discovery (Issue #53):** 6 hardcoded maps extracted to `autoDiscovery.ts` — `COMMAND_AGENT_MAP`, `VALID_SUBAGENTS`, and `AGENT_MENTION_PATTERNS` now detected automatically from filesystem (`commands/*.md`, `agents/*.md`). New files: `autoDiscovery.ts` (182 lines), `destructivePatterns.ts`, `normalizeBash.ts`. See [ADR-013](specs/adr/adr-013-plugin-auto-discovery.md).
- **FEV-13 — Config-Driven Plugin Behavior (Issue #53):** `INTENT_PATTERNS`, `COMMAND_PHASE_MAP`, `PHASE_SUGGESTIONS` moved to `defaults.ts` with optional `opencode.json` `sddPipeline` section override. Plugin works without config (backward compatible).
- **FEV-14 — Progress bar during installation (Issue #47):** `ProgressEvent` discriminated union (6 variants: `stage_start`, `stage_complete`, `stage_skip`, `commit_start`, `commit_complete`, `error`) in Domain layer. `ProgressCallback` optional on `IFileMergeEngine.execute()`. `ClackPromptsAdapter` implements `clack.progress()` (heavy style) with `showProgressBar(total, label)`, `updateProgress(current, filePath)`, `completeProgress()`. `logProgressEvent(message)` dispatches by category prefix: `commit:` → success, `symlink:` → success, `gitignore:` → info, `error:` → error, `skip:` → warn. Visible in all three modes (Clean, Project, Update).
- **FEV-14 — New `/help` slash command for onboarding (Issue #56):** Interactive help menu with 6 options — discover Códice, start a new project, update workspace, learn the SDD cycle, list all 13 commands, troubleshoot issues. Assigned to Huitzilopochtli. Template: `template/obligatorio/core/commands/help.md` (63 lines).
- **FEV-14 — `/help` registered in pipeline maps:** Added to `COMMAND_AGENT_MAP`, `INTENT_PATTERNS` (15 EN/ES keywords), `COMMAND_PHASE_MAP` (`idle`), and `PHASE_SUGGESTIONS` in `defaults.ts`.
- **FEV-14 — Spec/ADR templates with industry formats:** MADR v4.0 ADR template (`template/estandar/specs/adr/adr-template.md`) and RFC-based spec template (`template/estandar/specs/spec-template.md`) replace previous placeholders.
- **FEV-14 — 14 new integration tests** for progress events, structured logs, and adapter methods.
- **FEV-14 — E2E test extended** with progress assertions (commit/symlink messages in stdout).
- **FEV-15 — Project Code of Conduct (Issue #55):** `CODE_OF_CONDUCT.md` added to repo root, adapted from [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct.html). Contact: `dev@fisherk2.com`.
- **FEV-15 — Template Code of Conduct:** `template/estandar/CODE_OF_CONDUCT.md` created as a customizable placeholder. Includes 2 placeholders (`[PROJECT_NAME]`, `[CONTACT_EMAIL]`).
- **FEV-15 — Manifest integration:** `CODE_OF_CONDUCT.md` registered in `FileRuleManifestData.ts` with `category: "standard"` (11 standard files, was 10).
- **FEV-15 — Cross-references:** `CONTRIBUTING.md` and `README.md` updated with `## Code of Conduct` sections.
- **FEV-15 — E2E test extension:** `tests/e2e/01-clean-install.sh` asserts `CODE_OF_CONDUCT.md` delivery and content.
- **FEV-16 — Pre-release Tech Debt Closure:** Resolves 5 TECH_DEBT.md items (TD-1.1, TD-2.1, TD-5.1, TD-5.2, TD-6.2):
  - **Coverage foundation:** `resolveInteractiveMode()` extracted from `main.ts` for testability. 9 new unit tests. `main.ts` coverage 86.21% → 98.90%.
  - **Use case refactor:** Template Method pattern applied to `CleanInstallUseCase` + `ProjectInstallUseCase`. New `InstallUseCaseBase` abstract class. 166+147 → 73+72 lines.
  - **Performance benchmarks:** `just bench` recipe with `hyperfine` for 3 installation modes. 3 standalone benchmark scripts + `assert-no-regression.sh` for SC-9/10/11 verification.
  - **Update granularity:** Tree-level diff (`diffTrees()`) for standard directories. `FileMergeEngine` updated to stage only new files in update mode. 11 unit + 3 integration + 1 E2E test.
  - **Coverage instrumentation:** `c8` evaluated (incompatible with Bun/JSC). Native Bun coverage used with 95% CI gate. main.ts 98.90%, overall 98.10%.
- **`/test` command:** now ensures a `test/` directory exists with `unit/`, `integration/`, and `e2e/` subdirectories; if `test/` exists but is not separated, prompts the user (via `question`) whether to refactor and standardize existing tests into those three directories (per `@skills/test-driven-development/SKILL.md` test-pyramid convention).
- **`/ship` command:** adds a post-Phase-C incremental-fix phase that resolves all review observations one at a time using `@skills/incremental-implementation/SKILL.md`, verifies all tests pass, then creates atomic commits with descriptive messages (matching `/code-simplify` and `/test` conventions).

### Changed

- **BREAKING: Binary compilation removed.** The only installation method is now `bunx @fisherk2-dev/codice` (or `npx @fisherk2-dev/codice`). Compiled binaries are no longer produced or distributed. Users in air-gapped environments can use `npm pack` to download the tarball. See [ADR-011](specs/adr/adr-011-binary-removal.md) for migration details.
- **FEV-12 (References Restructuring):** 59 reference files moved from centralized `template/obligatorio/references/` to `skills/<name>/references/` for co-location with their primary skill. `opencode.json` now includes a `references` section with 3 example entries (local path + 2 remote repos). `docs/WORKFLOW.md` and `docs/TECH_DEBT.md` removed from `instructions` array. Agent models updated: huitzilopochtli → deepseek-v4-flash, moctezuma steps 20→30, tlaloc steps 90→100. `docs-mcp-server` removed; `codebase-memory-mcp` added (disabled by default). See [ADR-012](specs/adr/adr-012-references-co-location.md).
- **FEV-13 — Wiki Rewrite (Issue #51):** 8 Wiki pages rewritten for end users — removed all "edit sdd-pipeline.ts" references. Instructions now direct users to create `agents/my-agent.md`, `commands/my-command.md`, `skills/my-skill/SKILL.md` instead.
- **FEV-13 — Quality Infrastructure (Issue #53):** Biome config extended to plugin directories. Justfile targets added: `check-plugin`, `test-plugin-unit`, `test-plugin-integration`. Plugin test suites: `tests/plugin/unit/`, `tests/plugin/integration/`.
- **FEV-13 — Documentation Reduction (Issue #51):** WORKFLOW.md, CHANGELOG.md, SPEC.md audited and trimmed to target line counts (<300, <350, <400 respectively).
- **FEV-14 — DRY extraction — `createProgressCallback()` helper:** Duplicated ~30-line progress callback (3 copies × 30 lines = ~90 lines) extracted to shared `createProgressCallback(userPrompt, label)` in `src/application/helpers.ts`. All 3 use cases now call the shared helper (each reduced by ~28 lines).
- **FEV-14 — Symlink/gitignore log events moved to `postInstall.ts`:** Log events (`symlink: Created .opencode/agents`, `gitignore: Generated .gitignore`) now emit AFTER each operation completes in `runPostInstallSteps()`, not predicted before. Fixes false success on failure.
- **FEV-14 — 13 command files updated** with explicit subagent delegation patterns (sequential only, never parallel).
- **SC-15:** Updated to "npm package (tarball) size < 5MB" (previous SC-15 about compiled binaries removed)
- **ARCHITECTURE.md:** Added ADR-011 to ADR table
- **FEV-15 — FileRuleManifestData delivery surface:** 1 new entry in `FileRuleManifestData.ts` (now tracks 11 standard files, was 10).
- **FEV-16 — FileMergeEngine:** Tree-level diff replaces directory-level skip. Standard rules in update mode now deliver new files.
- **FEV-16 — CleanInstallUseCase / ProjectInstallUseCase:** Reduced from 313 → 145 lines (-168) via Template Method.
- **FEV-16 — Coverage thresholds:** CI now enforces ≥95% lines/functions (was unenforced).
- **FEV-16 — main.ts:** `runMode` restructured from switch to if/else for complete branch coverage.
- **FEV-16 — Code review simplifications:** `stageOne()` extraction, `stagePlanner` total folding, `walkRelative` helper, `resolveInteractiveMode` return type narrowed, `promptForMode` async removed.
- **FEV-17 — Code simplification pass (Issue #53):**
  - `IFileMergeEngine.execute` accepts `MergeExecuteOptions` object instead of positional params (improves call-site readability).
  - `FileRuleManifest.isRuleSelected` shared optional-filter predicate extracted from `CleanInstallUseCase` and `ProjectInstallUseCase`.
  - Test-only dead surface removed: `IUserPrompt.showSpinner/stopSpinner`, `IGitHubClient.getLatestReleaseNotes`, `IVersionComparator.isUpdateAvailable/getReleaseType/ReleaseType`, `IStagingSystem.getStagingPath`, `IFileSystem.readTemplateFile` (447 lines, 29 files).
  - `pathResolver.withTrailingSeparator` and `isPathWithin` shared helpers; `TemplateResolver`, `BunSymlinkCreator`, `BunGitignoreCreator` refactored to use them.
  - `GitHubRestClient` outer try/catch removed (redundant after domain error mapping).
  - `ClackPromptsAdapter.selectOptional` redundant `as string[]` cast removed.
  - `BunSymlinkCreator` verbose log now reports `resolvedLinkPath` (actual created path).
  - Plugin `configLoader.ts` 226→88 lines; extracted `mergeConfig.ts` (159 lines) for config merging helpers.
  - Plugin SDD pipeline modularized (655→379 lines + src/ modules).

### Fixed

- **FEV-14 — Progress bar re-creation on every `stage_start` (CRITICAL):** `showProgressBar()` was called on every event, orphaning previous `clack.progress()` instances. Fixed: added `barStarted` closure flag — bar initializes once, advances on subsequent events.
- **FEV-14 — Progress total included skipped files:** `total` counted all non-virtual rules, but only some got staged. Fixed: `FileMergeEngine` pre-computes `stageDecisions` Map; `total` reflects only staged files. Bar always reaches 100%.
- **FEV-14 — Symlink/gitignore logs emitted before operations (CRITICAL):** Success log was emitted before the actual symlink/gitignore creation. If creation failed, log falsely claimed success. Fixed: logs moved inside `runPostInstallSteps()`.
- **FEV-14 — Redundant `completeProgress()` calls:** Use cases called `completeProgress()` on merge failure, but the progress callback already handled this via the `error` event. Fixed: removed 3 redundant calls.
- **FEV-14 — Inline `import()` types in tests:** Test file used `import("path").Type` syntax 6 times. Fixed: top-level imports added, inline references removed.
- **FEV-16 — TECH_DEBT items resolved:** TD-1.1, TD-2.1, TD-5.1, TD-5.2, TD-6.2 all closed.
- **FD-6.2 — Standard directory updates:** New files in standard directories now reach existing users during update (was: entire directory skipped).
- **CR-Fixes — Error context enrichment:** `wrapMergeError()` preserves `MergeError` phase/path in user-facing messages (e.g. "Disk full during staging of opencode.json"). Affects `InstallUseCaseBase` and `UpdateWorkspaceUseCase`.
- **CR-Fixes — stageOne standard Result:** `FileMergeEngine.stageOne()` returns `Result<void, MergeError>` instead of null sentinel. Call sites use `!result.ok` for consistency.
- **CR-Fixes — Exhaustiveness guard:** `shouldStage()` in `stagePlanner.ts` uses `assertNever()` for compile-time safety on `RuleCategory`. Unreachable `return false` replaced.
- **CR-Fixes — Coverage script hardening:** `coverage-check.sh` passes lcov path via env var instead of shell-in-Python interpolation.

### Removed

- **BREAKING: `.devin/` optional directory removed.** The `.devin/` compatibility layer (7 symlinks: `skills`, `workflows`, `rules/*`) is no longer installed. `DEVIN_SYMLINKS` configuration, `devinSymlinks` parameter from the use case chain, and `.devin` manifest entry all removed. 6 tests eliminated, 838 pass/0 fail. Users who selected `.devin` during installation will no longer see it in the optional files menu.
- **Binary compilation recipes** — `just build`, `just build-all` removed from Justfile
- **Binary distribution from CI/CD** — `ci.yml` no longer builds/smoke-tests/upload binaries; `release.yml` no longer builds/checksums/attaches binaries to GitHub Releases
- **Binary resolution from E2E test infrastructure** — `setup_binary()` and related fallback logic (80+ lines) replaced with direct `bun run src/cli/main.ts`
- **Binary install documentation** — Offline/air-gapped binary install section removed from README
- **Binary build instructions** — Removed from CONTRIBUTING.md
- **SC-15** — "Compiled binaries are produced for Linux, macOS, and Windows x64" removed from SPEC.md

## [1.1.3] — 2026-07-11

### Fixed

- **Windows EPERM in `destinationExists()` (commit `86cb31e`):** On Windows, `fs.access()` throws `EPERM` instead of `EACCES` when a directory has restricted permissions (e.g. `chmod 0o000`). Now both `EACCES` and `EPERM` are treated as "path exists but unreadable", returning `true` so staging surfaces the real error downstream. Fixes CI failure on `windows-latest` runner.

## [1.1.2] — 2026-07-11

### Changed

- **`confirmOverwrite()` DRY extraction (commits `ede8389`, `bd17d3b`, `eaf5c5d`):** Shared helper extracted from duplicated confirmation logic in `CleanInstallUseCase`, `ProjectInstallUseCase`, and `UpdateWorkspaceUseCase`. Eliminates ~40 lines of duplicated guard code (force → isEmpty → prompt → cancel). All 3 use cases now delegate to the same helper.
- **`VERSION` module extraction (commit `eaf5c5d`):** Architectural fix — `VERSION` constant moved from `output.ts` (presentation layer) to neutral `src/cli/version.ts`. `container.ts` (DI wiring) and `output.ts` now both import from the neutral module, removing an import across layer boundaries.
- **`GitHubRestClient` error handling simplification (commits `da30dce`→`57e075a`):** Consolidated separate `404`/`403`/other HTTP error branches into a single `if (!response.ok) return null`. Removed dead `AbortError` branch — both abort and network-error paths returned the same `null`. Comment documents the design rationale.
- **`AtomicStager` I/O primitive change (commit `eaf5c5d`):** Switched from `Bun.file(source).text()` + `Bun.write(dest, content)` to `fs.copyFile(source, dest)` for staging template files. Kernel-level copy avoids loading entire files into JavaScript heap, preventing OOM on large templates and improving cross-device safety.
- **`BunSymlinkCreator` path normalization (commit `eaf5c5d`):** Extracted `rootWithSep` local variable for consistent prefix matching (used twice). Matches the `pathResolver.ts:22` pattern.
- **`FileRuleManifestData` comment condensation (commit `eaf5c5d`):** 3 verbose NOTE blocks (~30 lines) shortened to concise ADR references (~5 lines). Historical context preserved in ADRs.

### Fixed

- **Windows system directory validation (commit `c0842ae`):** Path prefix matching used hardcoded `/` which is never produced by `path.normalize()` on Windows (uses `\`). Fixed to `path.sep`. Also added missing system directories: `C:\ProgramData`, `C:\Users`. Added bare drive root check (`/^[A-Z]:\\?$/i`) covering `D:\`, `E:\`, etc.
- **`AtomicStager` backup detection consistency (commits `2d7496f`→`3d693b4`):** `Bun.file().exists()` returns `false` for directories — switched to `fs.access()` in both `renameStagedFile` and `restoreBackups`. Same bug class as FEV-3 Issue #2.
- **`restoreBackups` Bun.file().exists() (ship review fix):** Remaining `Bun.file().exists()` call in the rollback path switched to `fs.access()` for API consistency with the rest of the file.

### Security

- **Windows system directory protection expanded:** Added `C:\ProgramData`, `C:\Users`, and drive root check to the `--dest` validation blocklist. Covers non-C: drives via regex pattern.
- **Symlink path containment hardened:** `BunSymlinkCreator` normalizes `workspaceRoot` via `path.resolve()` before appending trailing separator for prefix matching. Ensures consistent containment checking regardless of constructor input format (trailing `..`, no trailing separator, etc.).

### Tests

- **7 new tests (commit `3d693b4`):** `confirmOverwrite()` unit tests (4 — force, empty, confirm, cancel), `VERSION` semver format validation (2), `resolveNewVersion()` fallback to `"0.0.0"` (1 integration).
- **3 isEmpty skip path integration tests:** Clean Install, Project Install, and Update Workspace — all verify the `isEmpty()` check skips the confirmation prompt when the destination directory is empty.
- **showCancel assertion added** to the update rejection test.
- **Coverage:** 100.00% functions / 97.99% lines (596 tests, 1289 expects).

## [1.1.1] — 2026-07-11

### Added

- **Documentation synchronization (hotfix/update-docs):** Comprehensive documentation audit and update across 14 files. SPEC.md updated to v1.1.1 with `IStagingSystem` port and `postInstall.ts` (FEV-10 ISP split). README.md removed stale `docs/opencode/` references (deleted in v1.0.14), updated skill count (46→52) and agent count (96+→98+ subagents). CONTRIBUTING.md updated E2E scenario count (8→15), added `IStagingSystem`/`postInstall.ts` to project structure. ARCHITECTURE.md diagram updated with `IStagingSystem`, `postInstall.ts`, `MergeError`. Wiki-source: Getting-Started.md and Configuration.md updated MCP server count (4→9, 3 enabled by default), step counts synced with FEV-6 values. Agents.md, Workspace-Structure.md, SDD-Pipeline.md updated agent count (103→104). Skills.md fixed duplicate `excel-analysis` entry, updated skill count (49→52). APPFLOW.md and CODE_STYLE.md version headers and dates updated.

### Fixed

- **Update Workspace version comparison (commit `b66c585`):** `UpdateWorkspaceUseCase` now compares against the bundled template version (from `package.json`) instead of querying the GitHub remote API. This eliminates the dependency on network availability during update mode and ensures the comparison always reflects the actual template being installed.
- **CI version validation (commit `6f36616`):** Pre-release suffix (e.g., `-beta.1`, `-rc.1`) is now stripped before comparing tag version against `package.json` version, preventing false mismatches during pre-release CI runs.
- **CI Bun version (commit `77c0410`):** `BUN_VERSION` environment variable bumped from `1.1` to `1.3` in CI workflows for lockfile compatibility.

## [1.1.0] — 2026-07-10

### Added

- **Agent Governance (Issue #26):** No-assumption rule merged into RULES section of all 6 primary agents (huitzilopochtli, quetzalcoatl, moctezuma, tlaloc, mictlantecuhtli, tezcatlipoca). Delegation-first rule merged into RULES for 3 delegating agents (quetzalcoatl, tlaloc, mictlantecuhtli). Delegation philosophy strengthened to "Always delegate first" with sequence/parallel support and last-resort fallback.
- **Destructive Command Restrictions (Issue #30):** 53 bash command patterns restricted in defense-in-depth configuration — sdd-pipeline.ts (runtime regex check with bash normalization) + opencode.json (declarative policy with 70 deny entries). 15 categories: Filesystem, Git, SQL, Docker, Kubernetes, Permissions, Process, Network, Package Managers, Environment, Disk, IaC, Cloud, Databases, PostgreSQL CLI.
- **Plugin README:** Updated to document 15 categories with 53 patterns and Defense-in-Depth subsection explaining dual-layer enforcement.
- **Step counts (Issue #27, FEV-6):** Adjusted for 6 primary agents (huitzilopochtli:25, quetzalcoatl:60, moctezuma:20, tlaloc:90, mictlantecuhtli:60, tezcatlipoca:50).
- **SECURITY.md (Issue #28, FEV-6):** Created at docs/SECURITY.md and template/estandar/docs/SECURITY.md.
- **5 new MCP servers (Issue #29, FEV-9):** Expanded MCP catalog from 4 to 9 servers. New additions: `tavily` (real-time web search, TAVILY_API_KEY), `firecrawl` (web scraping, FIRECRAWL_API_KEY), `vercel-grep` (GitHub code search), `gitmcp` (GitHub repo docs). Three servers enabled by default: `context7`, `vercel-grep`, `gitmcp`.
- **Agent KNOWLEDGE chain updated (Issue #29, FEV-9):** All 6 primary agents now reference MCP server category: `AGENTS.md → SPEC.md → docs/ → skills/ → MCP servers → Web search → Question-tool`.
- **Wiki expansion (Issue #29, FEV-9):** `MCP-Servers.md` extended from 4 to 9 pre-configured servers with detailed setup sections for each new MCP.
- **npm packaging integration tests (TD-5.3, FEV-10):** 5 scenarios (A-E) using `bun pm pack` to validate tarball structure, binary version, symlink exclusion, gitignore renaming, and clean install from extracted package.
- **Obsidian subagent `obsidian-vault-writer` (Issue #21, FEV-8):** New subagent specialized for Obsidian vault administration with YAML frontmatter (role, scope, output_format, rules), `## Composition` block, and strict permissions — only edits `.md` files, only executes obsidian-cli, only deployable via Huitzilopochtli.
- **3 Obsidian skills (Issue #21, FEV-8):** Installed in `skills/obsidian-cli/`, `skills/obsidian-markdown/`, `skills/obsidian-vault/` — each with SKILL.md following standard template format with YAML frontmatter, description, triggers, steps, and exit criteria.
- **3 additional skills from public catalog (Issue #21, FEV-8):** Installed alongside Obsidian skills for expanded workspace capability.
- **Huitzilopochtli catalog updated (Issue #21, FEV-8):** `agents/huitzilopochtli.md` updated with `obsidian-vault-writer` entry in the document authoring/corpus management domain.
- **Delegation tables updated (Issue #21, FEV-8):** `quetzalcoatl.md`, `tlaloc.md`, `mictlantecuhtli.md` — all three agent delegation tables now include `obsidian-vault-writer` as a delegable subagent.
- **`VALID_SUBAGENTS` updated (Issue #21, FEV-8):** `obsidian-vault-writer` added to the `VALID_SUBAGENTS` Set in `.opencode/plugins/sdd-pipeline.ts`.
- **GitHub Wiki Skills.md page updated (Issue #21, FEV-8):** 3 Obsidian skills added to the skills catalog with descriptions and phase assignments.
- **Path containment validation for vault paths (Issue #21, FEV-8):** Anti-traversal guard implemented to prevent symlink escapes in vault path resolution.
- **Hardcoded vault path replaced with generic placeholder (Issue #21, FEV-8):** Repository-specific vault path removed in favor of a customizable placeholder for user configuration.
- **Bilingual principle removed from agent prompts (Issue #21, FEV-8):** `## Bilingual` section stripped from all agent prompts for consistency — English-only agent communication enforced.

### Changed

- **`opencode.json` mcp section (Issue #29, FEV-9):** Now lists 9 MCP servers (up from 4). Tavily and Firecrawl include `headers` with `{env:VAR_NAME}` for API key config.
- **`context-engineering` skill (Issue #29, FEV-9):** Updated MCP Integrations table to reference all 9 servers with link to Wiki.

- **Coverage artifact (TD-1.2, FEV-6):** Explicit constructors added to VersionComparator and ClackPromptsAdapter to resolve Bun coverage reporting artifact.
- **`IFileSystem` port split (TD-2.1, FEV-10):** Interface Segregation Principle applied — `IFileSystem` reduced from 10 to 6 methods; new `IStagingSystem` port (4 methods) extracted. `BunFileSystem` implements both.
- **TypeScript 6.0.3 upgrade (TD-3.1, FEV-10):** TypeScript 5.9.3 → 6.0.3. No breaking changes; `tsc --noEmit` passes cleanly.
- **`main.ts` coverage increase (TD-1.1, FEV-10):** 13 new integration tests raised coverage from 33.04% → 86.21% lines (100% functions). Execution path, error path, parse failure, SIGINT handler, and terminal flag scenarios all covered.
- **Regex hardening — `chmod 777` broadened (commit 22e3255):** Pattern widened from `/chmod\s+(-R\s+)?777\s+[\/~]/i` to `/chmod\s+(-R\s+)?0*777\b/i` — now blocks `chmod 777` on ANY path, not just root/relative-to-home paths.
- **Regex hardening — `find -exec` broadened (commit 22e3255):** Pattern expanded to block ALL commands passed to `find -exec` (not just `rm`), covering `curl`, `chmod`, and other payload injection vectors.
- **Bypass vector closure — `chmod 0777` (commit a7c3d08):** Leading octal zero bypass closed — regex now accepts optional `0*` prefix before `777`.
- **Bypass vector closure — `find -execdir` (commit a7c3d08):** GNU/BSD `-execdir` variant bypass vector closed — regex now matches both `-exec` and `-execdir`.
- **`export PATH=` regex refined (FEV-7 code review, commit 92a9cec):** Pattern narrowed to `/export\s+PATH\s*=\s*[^$]/i` — only blocks total replacement exports (e.g., `export PATH=/bad/path`), allows safe appends (e.g., `export PATH=$PATH:/new/dir`).
- **Redundant `chmod 777` pattern removed (FEV-7 code review, commit 92a9cec):** Deduplicated — the broader `/chmod\s+(-R\s+)?0*777\b/i` pattern already covers all cases.
- **Plugin README line count updated (FEV-7 code review, commit 92a9cec):** Documentation synced from 663 to 664 lines.
- **Terminal flag tests parameterized (FEV-10 code review, commit 2821223):** `it.each` pattern applied to terminal flag tests for cleaner, more maintainable test structure.
- **`destinationExists()` EACCES error code branching (FEV-10 code review, commit 2821223):** `BunFileSystem.destinationExists()` now distinguishes `ENOENT` from `EACCES` via explicit error code branching, enabling precise error diagnosis.
- **Clarifying comment in `BunFileSystem` (FEV-10 code review, commit 2821223):** Added intent comment for non-ENOENT/non-EACCES fallback path in `destinationExists()`.

### Fixed

- **Side-effect tarball cleanup (FEV-10 code review, commits e440d94→2821223):** `bun pm pack` tarball artifact in CWD now cleaned up properly in test teardown to prevent polluting the workspace.
- **`biome.json` tabs→spaces formatting reverted (FEV-10 code review, commit 7c4f75b):** Code review Critical finding — Biome auto-format converted indentation from tabs to spaces. Reverted to project-standard tab indentation.

### Security

- **Destructive command hardening (Issue #30):** rm -rf, git push --force, DROP DATABASE, mkfs, dd if=, chmod 777, git reset --hard, kubectl delete --all, terraform destroy -auto-approve, redis FLUSHALL, and 40+ additional patterns now blocked at runtime and config level.
- **Post-CHANGELOG regex hardening (commit 22e3255):** `chmod 777` pattern widened from path-restricted to catch-all; `find -exec` broadened to block ALL commands (curl, chmod, etc.), not just `rm`.
- **Post-CHANGELOG bypass vector closure (commit a7c3d08):** `chmod 0777` (leading octal zero) and `find -execdir` (GNU/BSD variant) bypass vectors both closed with broader regex patterns.
- **New bypass attempt test cases added (commit a7c3d08):** `find -execdir rm`, `find -execdir curl`, `chmod 0777`, `chmod -R 0777` — all verified blocked at regex level.
- **33 new behavioral tests for DESTRUCTIVE_PATTERNS (FEV-7 code review, commit 92a9cec):** Comprehensive test suite added covering positive matches (33 patterns), negative matches (13 safe patterns), bypass attempts (4), and `normalizeBash` (7 edge cases) for the destructive command regex engine.

## Early Development (v1.0.x)

### [1.0.15] — 2026-07-09

- **Fixed:** Wiki README removed from GitHub Wiki; npm republish blocked (v1.0.14 retraction policy)
- **Changed:** Wiki repo cloned inside project (`docs/wiki-source/.wiki/`), `.gitignore` updated

### [1.0.14] — 2026-07-09

- **Added:** GitHub Wiki (9 end-user pages), pre-release tag support (beta/rc), Git Workflow/CI-CD/Release Checklist in CONTRIBUTING.md
- **Changed:** `ci.yml` triggers on `develop` branch; `release.yml` detects pre-release tags; post-install orchestration extracted to shared `runPostInstallSteps()`; `helpers.ts` split for 200-line limit
- **Removed:** `docs/opencode/` from project root and template
- **Fixed:** Issue #23 (CI/CD 3-stage pipeline), Issue #25 (GitHub Wiki)

### [1.0.13] — 2026-06-27

- **Added:** `docs-update/` command, `diagnosis/` command, `docs/diagnosis/` directory in template
- **Changed:** `evolve/` command simplified; agent governance (Quetzalcoatl/Moctezuma permissions); SDD determinism; command suggestions removed from agents
- **Fixed:** Issue #15 (governance and determinism)

### [1.0.12] — 2026-06-27

- **Fixed:** Windows CI symlink test skipped on Windows; E2E stdout verification for update message

### [1.0.11] — 2026-06-26

- **Fixed:** Update workspace directory detection (`Bun.file()`→`fs.access()`); GitHub version check repository name corrected

### [1.0.10] — 2026-06-26

- **Added:** `noTemplateCopy` flag on `FileRule`; optional files menu in Clean Install; `.devin` directory support; shared `createSymlinksWithWarning` helper
- **Fixed:** `.devin` directory not found in bunx mode (CRITICAL); inconsistent Clean/Project Install UX

### [1.0.9] — 2026-06-26

- **Fixed:** Issue #11 — `.gitignore` post-install generation for bunx compatibility
- **Added:** `IGitignoreCreator` port, `GitignoreError` type, `BunGitignoreCreator` adapter, 10 new tests, 2 E2E scenarios
- **Deprecated:** v1.0.8 (gitignore not found in bunx mode)

### [1.0.8] — 2026-06-26

- **Fixed:** TypeScript strict mode errors (3 `tsc --noEmit` fixes)
- **Deprecated:** v1.0.7 (TypeScript compilation errors)

### [1.0.7] — 2026-06-26

- **Fixed:** Issue #8 (CRITICAL) — npm resolves symlinks in tarballs; `.opencode/{agents,commands,skills}` removed from manifest
- **Added:** `ISymlinkCreator` port + `BunSymlinkCreator` adapter; post-install symlink generation (10 symlinks); `.devin` single optional unit
- **Changed:** Manifest entries reduced from 35 to 32
- **Deprecated:** v1.0.6 (symlink packaging issue)

### [1.0.6] — 2026-06-25

- **Fixed:** Issue #8 (CRITICAL) — template path resolution in bunx mode (`detectTemplateRoot` path corrected)
- **Added:** 4 missing optional manifest entries; manifest completeness test; directory walker exclusion logic

### [1.0.5] — 2026-06-25

- **Added:** ADR-007 (template resolution for bunx/npm); credential file permissions; TECH_DEBT.md; DIP architectural fix; `promptForMode()` in `IUserPrompt`; URL/env validation
- **Changed:** UpdateWorkspace rule transformation preserves Estándar files; CONTRIBUTING.md rewritten; dependencies updated
- **Fixed:** Issue #6 (CRITICAL) — bunx template detection cascade; Issue #2 (CRITICAL) — update preserves standard files
- **Security:** Extended credential denial patterns

### [1.0.4] — 2026-06-17

- **Added:** VersionComparator exported validators; 8 new unit tests; pathResolver guard test; ClackPromptsAdapter tests; TECH_DEBT.md
- **Changed:** Coverage to 97.66% functions / 96.52% lines

### [1.0.3] — 2026-06-16

- **Added:** CLI with 3 installation modes (Clean, Project, Update); interactive TUI (@clack/prompts); atomic file operations; file classification engine (Obligatorio/Estándar/Opcional); semantic version checking; path traversal prevention; `--dest`/`--force`/`--verbose` flags; cross-platform binaries; CI/CD pipeline; npm publication; ADR-001–006; E2E test suite (6 scenarios); 343 unit/integration tests
- **Changed:** Codebase DRY refactored; BunFileSystem decomposed (TemplateResolver + AtomicStager); IFileSystem port relocated; package renamed to `@fisherk2-dev/codice`
- **Fixed:** Template path resolution in compiled binaries; `console.warn` removed; cross-platform echo normalization; release workflow SHA pinning
- **Removed:** Legacy F5/F6 planning files
- **Security:** Path traversal prevention; symlink skipping in directory walk; SHA-256 checksums
