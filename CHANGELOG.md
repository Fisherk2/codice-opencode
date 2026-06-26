# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
