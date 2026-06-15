# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]


## [1.0.0] — 2026-06-15

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
- **E2E test suite**: 6 scenarios covering clean install, project install, optional skip, update workspace, atomic rollback, and path traversal rejection
- **Unit + Integration tests**: 284 tests with 96.23% function coverage
- **Domain architecture**: Clean Architecture with strict layer boundaries (Domain → Application → Infrastructure)
- **FileMergeEngine**: Strategy-based merge orchestrator with Obligatorio/Estándar/Opcional rules
- **VersionComparator**: Semantic version comparison with newer/older/equal/incompatible results
- **AtomicStager**: Atomic staging, commit, and rollback operations
- **TemplateResolver**: Template path resolution with category search and cache

### Architecture

- Clean Architecture with Dependency Inversion Principle
- Result/Either pattern for explicit error handling without exceptions
- Strategy Pattern for file merge rules
- Command Pattern for installation modes
- SRP-based refactoring: BunFileSystem decomposed into TemplateResolver + AtomicStager

### Technical

- Bun runtime for compilation and execution
- TypeScript strict mode with zero `any` types
- Biome for linting and formatting
- GitHub Actions CI/CD with 3-platform matrix
- SHA-256 checksums for release integrity verification

### Security

- No security vulnerabilities identified in this release.


---

## Project Information

### Repository
- **Name**: Códice - Spec-Driven Development Workspace with OpenCode
- **Description**: Native workspace for OpenCode with Spec-Driven Development methodology, 46 integrated skills (45 engineering + 1 meta-skill), 6 primary agents + 96+ subagents, SDD Pipeline Plugin with full orchestration and 7 official providers configured
- **Repository**: https://github.com/Fisherk2/codice-opencode
- **License**: MIT License

### Technology Stack
...

### Related Documentation
...

### Update Instructions

#### From Previous Versions
...

#### For Future Versions
...

### Contributing to the CHANGELOG

When contributing to this project:

1. **Add entries** to the `[Unreleased]` section
2. **Follow semantic versioning** for breaking changes
3. **Use appropriate categories** (Added, Changed, Deprecated, Removed, Fixed, Security)
4. **Include dates** in `YYYY-MM-DD` format
5. **Provide clear descriptions** explaining the impact of changes
6. **Group by phase** (Define, Plan, Build, Verify, Review, Ship)
7. **Reference related issues** or pull requests when applicable

### Why This CHANGELOG Matters

This CHANGELOG serves as living documentation that:

- **Tracks the evolution** of the AI-assisted development template
- **Communicates changes** to users and contributors
- **Provides update guidance** for future releases
- **Documents architectural decisions** and their rationale
- **Enables automated release processes** with structured change tracking
