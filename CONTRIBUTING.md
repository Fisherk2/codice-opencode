# Contributing to Códice

First off, thank you for considering contributing to Códice! This project thrives on community involvement, whether you're fixing a bug, adding a feature, improving documentation, or proposing a new skill for the workspace template.

This document provides guidelines for contributing. Please follow them to make the review process smooth and predictable.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Building](#building)
- [Commit Message Convention](#commit-message-convention)
- [Code Review Expectations](#code-review-expectations)
- [Pre-Commit Checklist](#pre-commit-checklist)
- [Reporting Issues](#reporting-issues)
- [Contributing to the Workspace Template](#contributing-to-the-workspace-template)

---

## Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you are expected to uphold this code. Please report unacceptable behavior to the maintainers.

---

## How to Contribute

### Workflow

1. **Open an issue first** for substantial changes (new feature, architecture change, breaking change). Discuss before investing time — this avoids wasted effort if the change is not aligned with the project's direction.
2. **Fork the repository** on GitHub, then create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-feature main
   ```
3. **Write your code**, following the [code style](docs/CODE_STYLE.md). Write or update tests (see [Testing](#testing)).
4. **Run the full check suite** locally:
   ```bash
   just check
   just test
   ```
5. **Commit** using [Conventional Commits](#commit-message-convention).
6. **Push** and open a Pull Request against `main`. Keep the title descriptive — it becomes the first line of the squashed commit. Reference related issues (`Closes #123`).
7. **Ensure CI passes** — the workflow runs `just check`, `just test`, and `just test:e2e` automatically.
8. **Request a review** (2-3 business days). Address feedback categorized as **Critical** (blocks merge), **Important** (should address), or **Suggestion** (nice-to-have).
9. **Squash merge** — once approved, a maintainer squash-merges into `main`.

---

## Development Setup

### Prerequisites

- **Bun** >= 1.1.x — Install from [bun.sh](https://bun.sh)
- **Just** — Task runner: `cargo install just` or `brew install just`

### First-Time Setup

```bash
# Clone your fork
git clone https://github.com/<your-username>/codice-opencode.git
cd codice-opencode

# Install dependencies
just setup

# Run the full check suite to verify everything works
just check
just test
```

### Development Workflow

```bash
# Run the CLI in development mode (writes to a safe workspace directory)
just dev

# Run tests continuously while developing
bun test --watch

# Check for lint and type errors
just check
```

### Safe Development with `--dest`

The `just dev` command automatically targets the `tests/fixtures/workspace/` directory, keeping your project root safe from accidental overwrites. You can also use the `--dest` flag directly:

```bash
bun run src/cli/main.ts --dest ./some-test-directory
```

---

## Project Structure

```
src/
├── domain/          # Pure business logic (zero dependencies)
│   ├── entities/    # FileRule, WorkspaceVersion
│   └── services/    # FileMergeEngine, VersionComparator
├── application/     # Use cases + port interfaces
│   ├── use-cases/   # CleanInstall, ProjectInstall, UpdateWorkspace
│   └── ports/       # IFileSystem, IGitHubClient, IUserPrompt
├── infrastructure/  # Adapters (BunFileSystem, GitHubRestClient, ClackPromptsAdapter)
└── cli/             # Entry point (main.ts, args parsing)
```

Key architectural rules:
- **Domain** never imports from `application/` or `infrastructure/`.
- **Application** depends only on `domain/`.
- **Infrastructure** depends on `application/ports`.
- All dependencies point **inward**.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full details.

---

## Testing

Códice uses a three-phase testing strategy:

### Unit Tests (Domain Logic)

```bash
just test:unit
```

Tests pure business logic — entities, value objects, domain services. No filesystem or network access. Target: > 90% coverage.

### Integration Tests (Adapters + Use Cases)

```bash
just test:integration
```

Tests adapter behavior with mocked external systems (filesystem, network, TUI). Uses temporary directories and mock HTTP servers.

### End-to-End Tests (Compiled Binary)

```bash
# Full E2E suite (compiles binary first):
just test:e2e

# Skip compilation if binary already exists:
SKIP_BUILD=1 just test:e2e
```

Tests the compiled binary against isolated temporary directories. 6 scenarios: clean install, project install, optional skip, update workspace, atomic rollback, path traversal rejection.

### Full Suite

```bash
just test          # All unit + integration tests
just test:coverage # With coverage report (HTML + lcov)
```

---

## Building

### Current Platform

```bash
just build
```

Produces `dist/codice-linux`, `dist/codice-macos`, or `dist/codice-windows.exe` depending on your OS.

### Cross-Platform (all three)

```bash
just build-all
```

Compiles binaries for all three platforms sequentially using Bun's `--target` flag:
- `codice-linux` (bun-linux-x64-modern)
- `dist/codice-macos` (bun-darwin-x64-modern)
- `dist/codice-windows.exe` (bun-windows-x64-modern)

If one build fails, the others continue. The overall exit code is 1 if any build fails.

---

## Commit Message Convention

This project follows **Conventional Commits** — a standardized format for commit messages that enables automatic changelog generation.

### Format

```
<type>(<scope>): <short summary>

<body (optional)>

<footer (optional)>
```

### Types

| Type | Usage | Example |
|------|-------|---------|
| `feat` | A new feature | `feat(cli): add --dry-run flag` |
| `fix` | A bug fix | `fix(staging): handle rename on Windows` |
| `docs` | Documentation only | `docs(readme): update install instructions` |
| `refactor` | Code change that neither fixes a bug nor adds a feature | `refactor(fs): extract AtomicStager from BunFileSystem` |
| `test` | Adding or updating tests | `test(e2e): add scenario for interrupted commit` |
| `chore` | Maintenance, dependencies, tooling | `chore(deps): update biome to 1.9.0` |
| `style` | Formatting, linting (no logic change) | `style: apply biome formatting` |
| `perf` | Performance improvement | `perf(merge): cache template file lookups` |

### Scope

The scope identifies which subsystem the change affects. Common scopes:

- `cli` — Command-line interface and argument parsing
- `fs` — Filesystem operations (BunFileSystem, TemplateResolver, AtomicStager)
- `domain` — Domain entities and services
- `use-case` — Application use cases
- `github` — GitHub API client
- `tui` — TUI prompts (@clack/prompts adapter)
- `ci` — CI/CD workflow changes
- `build` — Build configuration
- `test` — Test infrastructure
- `docs` — Documentation

### Examples

```
feat(cli): add --dry-run flag to preview file changes

Allows users to see which files would be copied, overwritten,
or skipped without making any changes.

Closes #42
```

```
fix(fs): handle permission error during staging

When staging a file in a read-only directory, return a
structured MergeError instead of crashing.

Fixes #37
```

```
docs(readme): add Códice CLI installation section
```

---

## Code Review Expectations

All code is reviewed across five dimensions:

| Dimension | What We Look For |
|-----------|------------------|
| **Correctness** | Does the code do what it's supposed to? Are edge cases handled? |
| **Readability** | Is the code easy to understand? Are names descriptive? Are comments meaningful? |
| **Architecture** | Does the change respect Clean Architecture boundaries? Are SOLID principles followed? |
| **Security** | Are inputs validated? Is path traversal prevented? Are errors handled safely? |
| **Performance** | Are there unnecessary allocations? Can operations be cached? |

Review feedback is categorized as:
- **Critical** — Must be fixed before merge (bug, security issue, broken test).
- **Important** — Should be addressed before merge (design issue, missed edge case).
- **Suggestion** — Nice-to-have improvement, could be deferred.

---

## Pre-Commit Checklist

Before every commit, verify the following:

- [ ] `just check` passes with zero errors and zero warnings.
- [ ] `just test:unit` passes (if code changed).
- [ ] Documentation updated if a public API changed.
- [ ] CHANGELOG.md updated if the change affects users.
- [ ] Change passes [Code Review Expectations](#code-review-expectations) (correctness, readability, architecture, security, performance).

---

## Reporting Issues

### Bug Reports

When reporting a bug, include:

- **Expected behavior** — what you expected to happen.
- **Actual behavior** — what actually happened.
- **Steps to reproduce** — minimal, reproducible scenario.
- **Environment** — OS, Bun version, binary version (`codice --version`).
- **Logs** — run with `codice --verbose` and paste the output.

### Feature Requests

When requesting a feature, include:

- **Problem** — what problem does this solve?
- **Use case** — how would you use this feature?
- **Alternatives** — what workarounds have you considered?

---

## Contributing to the Workspace Template

Códice installs an **OpenCode workspace template**. If you want to add agents, commands, or skills to the template:

1. **Agents** go in `template/obligatorio/agents/` — see existing agent files for format.
2. **Commands** go in `template/obligatorio/commands/` — each command is a `.md` file.
3. **Skills** go in `template/obligatorio/skills/` — each skill in its own directory with a `SKILL.md`.
4. **References** go in `template/obligatorio/references/` — technical documentation files.
5. **File rules** in `src/domain/entities/file-rule-manifest.ts` — register new files with the correct category (Obligatorio, Estándar, Opcional).

After adding files, update the **file rule manifest** to classify them appropriately:
- **Obligatorio** — files that must always be present (core agents, config).
- **Estándar** — recommended files copied only if absent.
- **Opcional** — specialized skills or references presented via checklist.

---

*Last revised: 2026-06-15*
