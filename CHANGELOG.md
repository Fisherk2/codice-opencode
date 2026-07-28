# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] — 2026-07-28

### Changed

- **BREAKING: Binary compilation removed.** The only installation method is now `bunx @fisherk2-dev/codice` (or `npx @fisherk2-dev/codice`). Compiled binaries are no longer produced or distributed. Users in air-gapped environments can use `npm pack` to download the tarball. See [ADR-011](specs/adr/adr-011-binary-removal.md) for migration details.

### Removed

- **Binary compilation recipes** — `just build`, `just build-all` removed from Justfile
- **Binary distribution from CI/CD** — `ci.yml` no longer builds/smoke-tests/upload binaries; `release.yml` no longer builds/checksums/attaches binaries to GitHub Releases
- **Binary resolution from E2E test infrastructure** — `setup_binary()` and related fallback logic (80+ lines) replaced with direct `bun run src/cli/main.ts`
- **Binary install documentation** — Offline/air-gapped binary install section removed from README
- **Binary build instructions** — Removed from CONTRIBUTING.md
- **SC-15** — "Compiled binaries are produced for Linux, macOS, and Windows x64" removed from SPEC.md

### Added

- **ADR-011:** Binary Removal — documents the architectural decision (see `specs/adr/adr-011-binary-removal.md`)
- **`tests/e2e/codice.sh`:** Wrapper script for `bun run src/cli/main.ts` in E2E tests

### Changed (non-breaking)

- **SC-15:** Updated to "npm package (tarball) size < 5MB" (previous SC-15 about compiled binaries removed)
- **ARCHITECTURE.md:** Added ADR-011 to ADR table

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
- **5 new MCP servers (Issue #29, FEV-9):** Expanded MCP catalog from 4 to 9 servers. New additions: `docs-mcp-server` (Grounded Docs, replaces shutdown Docfork), `tavily` (real-time web search, TAVILY_API_KEY), `firecrawl` (web scraping, FIRECRAWL_API_KEY), `vercel-grep` (GitHub code search), `gitmcp` (GitHub repo docs). Three servers enabled by default: `context7`, `vercel-grep`, `gitmcp`.
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

## [1.0.15] — 2026-07-09

### Fixed

- **Wiki `README.md` removed from GitHub Wiki**: `docs/wiki-source/README.md` es documentación interna del proceso de sincronización, no una página de usuario. Eliminado del wiki remoto.
- **npm republish blocked**: v1.0.14 no pudo republicarse tras unpublish (política de npm). Release bump a v1.0.15.

### Changed

- **Wiki repo clonado dentro del proyecto**: En vez de `/tmp/wiki`, ahora se clona en `docs/wiki-source/.wiki/` (gitignored). Sincronización con `rsync --exclude='README.md'`.
- **`.gitignore` actualizado**: Nueva entrada `/docs/wiki-source/.wiki/` para excluir el clon de la Wiki del repo principal.
- **Instrucciones de sincronización actualizadas**: `docs/wiki-source/README.md` ahora documenta el uso de `rsync` con `--exclude='README.md'`.

## [1.0.14] — 2026-07-09

### Added

- **GitHub Wiki for workspace documentation**: 9 end-user pages (Home, Getting Started, Workspace Structure, Configuration, Agents, Commands, Skills, Customization Guide, Troubleshooting). Source of truth in `docs/wiki-source/`, synced to `https://github.com/fisherk2/codice-opencode/wiki`.
- **Pre-release tag support in `release.yml`**: Tags like `v1.0.14-beta.1` are detected and published to npm with `--tag beta` and GitHub Pre-release. Tags like `v1.0.14-rc.1` use `--tag rc`. Production tags use `--tag latest` and full GitHub Release.
- **Git Workflow section in CONTRIBUTING.md**: Documents the 3-stage pipeline (develop → main → tags), branch naming conventions, and PR requirements.
- **CI/CD Pipeline section in CONTRIBUTING.md**: Documents `ci.yml` and `release.yml` workflows with troubleshooting guide for common issues.
- **Release Checklist template in CONTRIBUTING.md**: Pre-release, release, and post-release checklists with concrete v1.0.14 example.
- **npm Publishing section in CONTRIBUTING.md**: dist-tags (latest/beta/rc), version naming, creating and consuming test packages.

### Changed

- **`ci.yml` triggers on `develop` branch**: Push and PR to `develop` now run the full CI pipeline, enabling the 3-stage workflow.
- **`release.yml` detects pre-release tags**: New `Detect release type` step parses tag suffix and sets npm tag (beta/rc/latest), prerelease flag, and `make_latest` behavior dynamically.
- **CONTRIBUTING.md expanded**: Added 4 new sections — Git Workflow, npm Publishing, CI/CD Pipeline, Release Checklist (158 lines added).
- **Refactored post-install orchestration**: Extracted duplicated `.gitignore` generation, symlink creation, and version file write from `CleanInstallUseCase` and `ProjectInstallUseCase` into a shared `runPostInstallSteps()` helper in `src/application/postInstall.ts`. Both modes now delegate to the same helper; behavioral differences are preserved via options (Clean Install sets `retryHint=true` for re-run hint in warnings; Project Install does not).
- **`helpers.ts` split**: Extracted `createGitignoreSafe`, `createSymlinksWithWarning`, and `runPostInstallSteps` into new `src/application/postInstall.ts` (159 lines) to comply with the 200-line file limit. `helpers.ts` reduced from 204 to 71 lines.

### Removed

- **`docs/opencode/` from project root**: 12 files deleted (backup saved to `~/.cache/codice-backup/`). Users should refer to the GitHub Wiki or opencode.ai/docs.
- **`docs/opencode/` from template `opcional`**: 12 files deleted from the template. The Wiki is now the canonical documentation source.
- **`docs/opencode` entry from `FileRuleManifestData`**: Removed lines 166-171 from the manifest.

### Fixed

- **Issue #23**: CI/CD workflow standardized with 3-stage pipeline (develop → main → tags), pre-release support, and comprehensive documentation.
- **Issue #25**: GitHub Wiki created and populated; `docs/opencode/` removed from root and template; all internal references updated to point to Wiki or OpenCode docs.

## [1.0.13] — 2026-06-27

### Added

- **New `docs-update/` command**: Dedicated command for updating, migrating, and synchronizing documentation with code and configuration files. Includes pre-flight analysis of existing docs, question-tool integration for resolving contradictions, and strict restrictions (no `tasks/` writes, no code implementation).
- **New `diagnosis/` command**: Analyzes remote repository issues, detects problems, and documents technical diagnostics in `docs/diagnosis/`. Creates structured diagnosis files with metadata, symptoms, root cause analysis, and verification steps. Includes `docs/diagnosis/README.md` and `diagnosis-template.md` in the template.
- **`docs/diagnosis/` directory in template**: New standard directory for operational technical knowledge. Contains README explaining its purpose and a template for documenting diagnoses.

### Changed

- **Refactored `evolve/` command**: Simplified scope to only create new specs for mature projects with robust versions. Removed ability to write to `tasks/` or implement code. Added pre-flight to detect project maturity level.
- **Agent governance — Quetzalcoatl**: Updated permissions to prohibit writing to `tasks/`, source code (`src/`), and configuration files. Quetzalcoatl now exclusively writes documentation.
- **Agent governance — Moctezuma**: Updated permissions to restrict writing exclusively to `tasks/` directory and its files.
- **SDD determinism**: All SDD lifecycle commands now suggest the next command to execute upon completion (e.g., `spec/` suggests `plan/`, `plan/` suggests `build/`, etc.).
- **Removed command suggestions from agent configurations**: Primary agents no longer suggest specific commands. Instead, they suggest invoking other primary agents (e.g., Quetzalcoatl suggests invoking Moctezuma for execution planning).

### Fixed

- **Issue #15**: Resolved governance and determinism issues in workspace commands. `evolve/` no longer executes tasks outside its scope (writing to `tasks/`, implementing code). Clear separation of concerns between documentation (Quetzalcoatl), planning (Moctezuma), and implementation (Tlaloc).

## [1.0.12] — 2026-06-27

### Fixed

- **Windows CI: broken symlink test skipped on Windows**: Symlink tests (`destinationExists`) now skip on Windows where elevated privileges are required for `fs.symlink()`.
- **E2E: stdout verification for update success message**: E2E scenario 15 now captures both stdout and stderr. Assertion #9 checks for "Workspace update complete" in stdout (where `@clack/prompts` writes it), not stderr.

## [1.0.11] — 2026-06-26

### Fixed

- **Update Workspace no sobrescribe directorios standard existentes (regresión de FEV-1 #2)**: `BunFileSystem.destinationExists()` usaba `Bun.file().exists()` que solo funciona con archivos, no con directorios. Cambiado a `fs.access()` que detecta correctamente tanto archivos como directorios. Esto evita que directorios como `docs/`, `specs/` y `tasks/` sean sobrescritos durante una actualización.
- **GitHub version check funciona correctamente**: El nombre del repositorio en `constants.ts:5` era `"11-codice-opencode"` en vez de `"codice-opencode"`, causando un 404 en la API de GitHub.

## [1.0.10] — 2026-06-26

### Added

- **`noTemplateCopy` flag on `FileRule`**: New optional field that marks manifest entries whose content is generated entirely post-installation (e.g., `.devin/` symlinks via `BunSymlinkCreator`). These entries still appear in the optional file selection UX but skip template file resolution and staging, preventing `Template file not found` errors for npm-stripped content.
- **Optional files menu in Clean Install**: Clean Install now shows the same optional files selection menu as Project Install, allowing users to choose which optional files to include. Previously, Clean Install copied all optional files automatically without user interaction. Use `--force` to skip the menu and include all optionals.
- **`.devin` directory support**: `TemplateResolver` now detects and copies directories recursively, resolving the `Template file not found: .devin` error that occurred because `.devin` is a directory (not a file) and npm tarballs strip directory symlinks.
- **Extracted shared `createSymlinksWithWarning` helper**: Both use cases now delegate symlink guard logic to a shared helper in `src/application/helpers.ts`, eliminating ~24 lines of duplicated warning code across 4 methods.

### Fixed

- **`.devin` directory not found** (CRITICAL): `bunx @fisherk2-dev/codice` failed with `Template file not found: .devin` in all install modes. Root cause: npm strips symlinks from packages during publication, and `.devin/` contains ONLY symlinks. Solution: `.devin` stays in the optional manifest with `noTemplateCopy: true` — its content is generated post-installation by `BunSymlinkCreator` via `DEVIN_SYMLINKS` (7 symlinks), following the same pattern as `.opencode/{agents,commands,skills}` removal in v1.0.6-B.
- **Inconsistent UX between Clean Install and Project Install**: Clean Install now presents the optional files selection menu, matching Project Install behavior.

## [1.0.9] — 2026-06-26

### Fixed

- **Issue #11** — `bunx @fisherk2-dev/codice` now works correctly in all 3 modes. Root cause: npm hard-excludes `.gitignore` files from packages (not bypassable via `files` or `.npmignore`). Solution: renamed `template/estandar/.gitignore` to `template/estandar/gitignore` (no dot prefix) and generate the `.gitignore` file post-installation via `BunGitignoreCreator` in Clean Install and Project Install modes. Update Workspace preserves the user's existing `.gitignore`.
- **Symlinks and gitignore**: Both `.opencode/` and `.devin/` symlinks and `.gitignore` are now generated in the correct order after file merge (per ADR-FEV2C-10).

### Added

- `IGitignoreCreator` port in `application/ports/` for Clean Architecture-compliant post-install gitignore generation.
- `GitignoreError` type in `domain/types/` with 4 error codes (`READ_FAILED`, `WRITE_FAILED`, `TEMPLATE_NOT_FOUND`, `PATH_ESCAPE`) and factory functions.
- `BunGitignoreCreator` adapter in `infrastructure/adapters/` — reads `gitignore` (no dot) from template and writes `.gitignore` to destination. Idempotent: skips if file already exists, skips real directories.
- 8 new unit/integration tests for gitignore resolution and generation (6 BunGitignoreCreator + 2 TemplateResolver).
- 2 new E2E scenarios (11-gitignore-clean-install, 12-gitignore-project-install) verifying `.gitignore` post-install generation and idempotency.

### Deprecated

- **v1.0.8** — deprecated on npm due to Issue #11 (`.gitignore` not found in `bunx` mode).

## [1.0.8] — 2026-06-26

### Fixed

- **TypeScript strict mode errors**: Fixed 3 `tsc --noEmit` errors that caused CI failures across all platforms:
  - `parse-args.ts`: `args[i]` narrowed to `string` (was `string | undefined`)
  - `project-install.test.ts`: Mock return types use `as const` to match `Result<void, SymlinkError>` literal types
  - `bun-symlink-creator.test.ts`: Added optional chaining for `result.error[i]` access

### Deprecated

- **v1.0.7** — deprecated on npm due to TypeScript compilation errors in CI.

## [1.0.7] — 2026-06-26

### Fixed

- **Issue #8 (CRITICAL)**: `bunx @fisherk2-dev/codice` failed with `Template file not found: .opencode/agents` in all 3 install modes because npm resolves symlinks when creating the tarball. The `.opencode/{agents,commands,skills}` paths were symlinks in the dev template (`→ ../{agents,commands,skills}/`) that were dereferenced during packaging. Removed the 3 manifest entries — the real directories (`agents/`, `commands/`, `skills/`) at the root level remain and cover the same files.

### Added

- **Post-installation symlink generation**: After Clean Install (always) and Project Install (based on selection), the installer now recreates 10 symlinks that npm resolves during packaging:
  - `.opencode/agents`, `.opencode/commands`, `.opencode/skills` → `../*` (3, always)
  - `.devin/skills`, `.devin/workflows` → `../*` (2, conditional on `.devin` selection)
  - `.devin/rules/*` → `../../*` (5, conditional on `.devin` selection)
- **New port/adapter**: `ISymlinkCreator` port + `BunSymlinkCreator` adapter implementing post-install symlink creation with idempotent, safe behavior (skips existing symlinks and real directories).
- **Manifest entry `.devin/rules` renamed to `.devin`**: Clearer UX — the entire `.devin/` directory (rules, skills, workflows) is now a single optional unit.

### Changed

- `FILE_RULE_MANIFEST` entries reduced from 35 to 32 (3 symlink entries removed). Mandatory count: 11 → 8.

### Deprecated

- **v1.0.6** — use v1.0.7 which fixes the symlink packaging issue.

## [1.0.6] — 2026-06-25

### Fixed

- **Issue #8 (CRITICAL)**: `bunx @fisherk2-dev/codice` failed with `Template file not found: opencode.json` because `TemplateResolver.detectTemplateRoot()` resolved `import.meta.dir` relative to `src/infrastructure/adapters/` instead of the package root. Corrected source-mode detection path from `../../template` to `../../../template` so npm/bunx packages find `template/obligatorio/opencode.json`.

### Added

- **Manifest completeness**: 4 missing optional entries added to `FileRuleManifestData.ts` — `.devin/rules`, `.gitmessage`, `.opencode/plugins/sdd-workflow-test.md`, `docs/opencode`. Total optional entries: 9 → 13.
- **Manifest completeness test**: `file-rule-manifest.test.ts` with 7 tests covering file existence, path coverage, unique paths, and category count guards. Detects when files are added to `template/opcional/` without updating the manifest.
- **Exclusion logic in directory walker**: When a standard directory (e.g. `docs/`) overlaps with optional sub-paths (e.g. `docs/opencode/`), the directory walker now excludes those subdirectories to prevent double-copying. The exclusion is computed automatically from the manifest rule overlap.

## [1.0.5] — 2026-06-25

### Added

- **ADR-007**: Template resolution for bunx/npm mode — third detection path `../template/` relative to `import.meta.dir`
- **Credential file permissions**: Extended `permissions.read.deny` in `opencode.json` to include `.npmrc`, `.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials.json`, `service-account*.json`
- **TECH_DEBT.md in template**: Placeholder in `template/estandar/docs/TECH_DEBT.md` with structured format for tracking technical debt
- **Internal link fixes**: Updated relative paths in `README.md` and `CONTRIBUTING.md` to reflect `obligatorio/`, `estandar/`, `opcional/` directory structure (Issue #4)
- **DIP architectural fix**: `Dependencies` interface now uses `IFileSystem` and `IUserPrompt` port types instead of concrete adapter types
- **`promptForMode()` in `IUserPrompt` interface**: Moved from concrete `ClackPromptsAdapter` to port interface for proper Dependency Inversion
- **CWD fallback warning**: `TemplateResolver.detectTemplateRoot()` warns via stderr when falling back to current working directory
- **URL validation for `CODICE_GITHUB_API_URL`**: Environment variable validated for HTTPS protocol and github.com hostname
- **FileRule category mapping docs**: Spanish→English directory mapping (obligatorio/→mandatory, estandar/→standard, opcional/→optional) added to JSDoc
- **Symlink skip logging**: `directoryWalker.skipSymlinks()` logs to stderr when verbose mode is enabled
- **Version file field validation**: `.codice-version` JSON fields validated with type guards before access
- **Bash deny pattern documentation**: `_comment` and `_comment_suffix` fields added to `opencode.json` explaining `* .file` vs `* .file *` convention

### Changed

- **UpdateWorkspaceUseCase rule transformation**: `standard` rules no longer converted to `mandatory` in update mode; only `obligatorio` rules are elevated, preserving `destinationExists()` check for standard files
- **CONTRIBUTING.md rewritten**: "Contributing to the Workspace Template" section now references USER_GUIDE.md detailed procedures for adding agents, skills, and commands
- **README.md model section synced**: Default and recommended models for all 6 primary agents updated to match `opencode.json` configuration
- **README.md quick-start flow**: Added post-installation "Next steps" callout linking to `00-setup.md` first-steps guide
- **Dependencies updated**: `@biomejs/biome` 2.5.0→2.5.1, `@clack/prompts` 1.5.1→1.6.0, `semver` 7.8.4→7.8.5

### Fixed

- **Issue #6 (CRITICAL)**: `bunx @fisherk2-dev/codice` now resolves template files correctly in all modes (compiled, bunx/npm, source) via three-path detection cascade in `TemplateResolver.detectTemplateRoot()`
- **Issue #2 (CRITICAL)**: Update Workspace mode no longer overwrites existing Standard files (e.g., `README.md`, `AGENTS.md`) — only Obligatorio files are force-copied

### Security

- **Extended credential denial**: Additional credential file patterns denied in both `bash` and `read` permission rules (`.npmrc`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials.json`, `service-account*.json`)

## [1.0.4] — 2026-06-17

### Added

- **VersionComparator refactored**: `validateVersion` and `validateVersions` extracted from private methods to module-level exported functions for direct testability
- **8 new unit tests**: Direct coverage for `validateVersion` (semver valid, v-prefix, invalid, empty) and `validateVersions` (both valid, local fail-fast, remote invalid, v-prefix both)
- **pathResolver defense-in-depth guard test**: `.` input passes first guard but triggers second guard; lines 23-26 now at 100% coverage
- **ClackPromptsAdapter promptForMode tests**: All 4 paths covered — clean, project, update, and cancel (null)
- **WorkspaceVersion.fromJSON optionalSelections tests**: Array of strings, non-array, and missing key paths
- **TECH_DEBT.md**: Technical debt catalog with 6 sections (coverage gaps, architectural debt, dependency debt, test infrastructure, process debt, prioritized roadmap)

### Changed

- **Coverage increased**: From 96.84%→97.66% functions / 95.73%→96.52% lines (360 tests, 711 expects)
- **TECH_DEBT.md moved to docs/**: Cross-referenced from ARCHITECTURE.md

### Fixed

- *(none)*

---

## [1.0.3] — 2026-06-16

### Added

- **CLI with 3 installation modes**: Clean Install, Project Install, and Update Workspace
- **Interactive TUI** powered by @clack/prompts with mode selection, confirmation prompts, and optional file checkboxes
- **Atomic file operations**: Staging directory + rename pattern guarantees zero corruption on interruption
- **File classification engine**: Obligatorio (always copy), Estándar (copy if missing), Opcional (user-selected, copy if missing)
- **Semantic version checking**: Queries GitHub API for latest release, compares with local `.codice-version`
- **Path traversal prevention**: Validates all paths resolve within destination directory
- **`--dest` flag**: Safe development playground via `--dest tests/fixtures/workspace/`
- **`--force` flag**: Skip confirmations for automated installs
- **`--verbose` flag**: Structured logging for debugging
- **Cross-platform binaries**: Linux (x64), macOS (x64), Windows (x64) via Bun compilation
- **CI/CD pipeline**: GitHub Actions with 3-platform matrix, smoke tests, and artifact upload
- **Release automation**: Tag-triggered workflow builds binaries for all platforms, generates checksums, and creates GitHub Releases
- **npm publication**: `@fisherk2-dev/codice` package with `bunx` as primary distribution method (ADR-006)
- **TemplateResolver source mode**: Automatic detection of source vs compiled mode via `detectTemplateRoot()` for npm/bunx compatibility
- **Version single source of truth**: Version read from `package.json` via `VERSION` constant
- **Release pipeline with npm publish**: Automatic npm publication on tag push with version validation and error handling
- **JS bin wrapper**: `bin.js` entry point for npm compatibility
- **Post-ship review coverage**: 10 pathResolver tests (traversal guards) + 7 directoryWalker tests (symlink skipping, recursion, mixed entries)
- **Architecture Decision Records**: ADR-001 through ADR-006 documenting all architectural decisions (Clean Architecture, Bun compilation, atomic staging, @clack/prompts TUI, `--dest` flag, npm publication)
- **E2E test suite**: 6 scenarios covering clean install, project install, optional skip, update workspace, atomic rollback, and path traversal rejection
- **Unit + Integration tests**: 343 tests with 96.84% function coverage and 94.22% line coverage

### Changed

- **Codebase refactored**: DRY validation with shared helpers, `Array.find()` for manifest lookup, extracted `resolveNewVersion()` helper in `UpdateWorkspaceUseCase`
- **BunFileSystem decomposed**: `TemplateResolver` and `AtomicStager` extracted as separate classes; `BunFileSystem` becomes a facade (412 → 115 lines)
- **VersionComparator cleaned up**: DRY semver coercion patterns, prerelease diff fallback to `"none"`
- **FileRuleManifestData renamed**: `fileRuleManifestData.ts` → `FileRuleManifestData.ts` (PascalCase convention)
- **IFileSystem port relocated**: Moved from `src/application/ports/` to `src/domain/ports/` for architectural correctness
- **Package renamed**: From `@fisherk2/codice` to `@fisherk2-dev/codice` for consistent npm scoping
- **Test coverage increased**: From 89.69% to 96.84% functions / 94.22% lines

### Fixed

- **Template path resolution in compiled binaries**: Binary now resolves `template/` relative to executable path (not `process.cwd()`)
- **console.warn removed from BunFileSystem.destinationExists**: Unconditional logging replaced with silent error handling (structured logging convention)
- **v1.0.0/1/2 deprecated on npm**: Only v1.0.3 remains as the active release
- **GitHub Actions release workflow**: Action pinned to specific SHA (`softprops/action-gh-release@b4309332`) for supply-chain hardening
- **Cross-platform echo normalization**: Consistent `echo "=== ... ==="` convention across `Justfile` build recipes

### Removed

- Legacy F5/F6 planning files (superseded by WORKFLOW.md)

### Security

- Path traversal prevention maintained and verified (6/6 E2E scenarios passing)
- PathResolver includes defense-in-depth boundary guard as safety net against future runtime changes
- All symbolic links skipped during directory walk to prevent symlink-based traversal
- SHA-256 checksums generated for all release binaries

---
