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
- [Git Workflow](#git-workflow)
- [npm Publishing](#npm-publishing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Release Checklist](#release-checklist)
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

Tests the compiled binary against isolated temporary directories. 8 scenarios: clean install, project install, optional skip, update workspace, atomic rollback, path traversal rejection, symlinks clean install, and symlinks project install.

**Scenarios:**

1. **Clean Install:** Run binary in empty directory. Assert all template files exist in destination.
2. **Project Install (Selective):** Pre-populate destination with a file that also exists in template/estandar. Assert the existing file is preserved, not overwritten.
3. **Project Install (Optional Skip):** Present optional files, simulate skipping one. Assert skipped file is absent, others are present.
4. **Update Workspace:** Pre-populate with older version. Run update mode. Assert only obligatorio and estandar files are updated; optional files untouched.
5. **Atomic Rollback (SIGINT):** Simulate a crash mid-operation. Assert destination directory is in its original state, staging directory is absent or cleaned.
6. **Path Traversal:** Attempt to install to a path outside the allowed base using `../` sequences. Assert exit code 1 and no files written outside boundary.
7. **Symlinks Clean Install:** Run binary in empty directory. Assert all 10 symlinks exist and resolve correctly.
8. **Symlinks Project Install:** Pre-populate destination without `.devin`. Run project install with `--force`. Assert `.opencode/` symlinks exist, `.devin/` symlinks absent. Then run again selecting `.devin`. Assert `.devin/` symlinks present.

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

## Git Workflow

This project follows a **3-stage pipeline**: `develop` (integration) → `main` (production) → `tags` (release)

### Branch Naming Conventions

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feat/` | New features | `feat/task-creation` |
| `fix/` | Bug fixes | `fix/double-commit` |
| `chore/` | Maintenance | `chore/update-deps` |
| `docs/` | Documentation | `docs/api-guide` |
| `refactor/` | Code restructuring | `refactor/merge-engine` |

### Workflow

1. Feature branches branch from `main`.
2. Pull Requests go to `develop` first.
3. Squash merge to `develop` after approval.
4. After validation on `develop`, create a PR `develop` → `main`.
5. Squash merge to `main`, then tag for release.

### PR Requirements

Before submitting a PR, verify:

- [ ] Branch is up to date with target
- [ ] Full test suite passes
- [ ] `just check` passes
- [ ] E2E tests pass
- [ ] CHANGELOG updated if user-facing change

For a detailed CI/CD workflow diagnosis, see [Issue #23](docs/diagnosis/fix01-cicd-workflow-standardization.md).

---

## npm Publishing

### npm dist-tags

The project uses 3 npm dist-tags:

| Tag | Purpose | Example |
|-----|---------|---------|
| `latest` | Stable production release | `v1.0.14` |
| `beta` | Pre-release for testing | `v1.0.14-beta.1` |
| `rc` | Release candidate | `v1.0.14-rc.1` |

### Version Naming

- **Production:** `v1.0.14` → `npm publish --tag latest`
- **Beta:** `v1.0.14-beta.1` → `npm publish --tag beta`
- **RC:** `v1.0.14-rc.1` → `npm publish --tag rc`

### Creating a Test Tag

```bash
git tag v1.0.14-beta.1
git push origin v1.0.14-beta.1
```

This triggers `release.yml` which detects the beta suffix and publishes with `--tag beta`.

### Consuming a Test Package

```bash
bunx @fisherk2-dev/codice@beta
# or with npm:
npx @fisherk2-dev/codice@beta
```

### Verifying Tags

```bash
npm view @fisherk2-dev/codice dist-tags
npm view @fisherk2-dev/codice@beta version
```

### Warning

Pre-release tags (`beta`, `rc`) can be overwritten. The `latest` tag cannot — always test with `beta` or `rc` first before publishing to `latest`.

---

## CI/CD Pipeline

### Workflows

**ci.yml** (Continuous Integration)

- **Triggers:** push/PR to `main` or `develop`, tags `v*`
- **Jobs:** quality (3-platform matrix: ubuntu, macos, windows)
- **Steps:** checkout → setup Bun → install deps → `just check` → `just test` → `just build` → E2E (Linux) → smoke test (macOS/Windows) → upload artifacts
- **Concurrency:** cancel-in-progress for same branch

**release.yml** (Release)

- **Triggers:** tag push `v*` or `workflow_dispatch`
- **Jobs:**
  1. `build` (3-platform matrix) — builds binary, uploads artifact
  2. `release` (ubuntu, needs build) — downloads artifacts, validates tag format, extracts CHANGELOG, validates version match, detects release type, publishes to npm, creates GitHub Release
- **Pre-release detection:** tags like `v1.0.14-beta.1` are published with `--tag beta` and GitHub Pre-release

### Troubleshooting CI/CD

1. **CI doesn't trigger on PR to develop** — Check branches in `on.pull_request.branches` in ci.yml
2. **npm publish fails with "cannot publish over..."** — This is expected if the version was already published. The workflow skips gracefully.
3. **Tag version doesn't match package.json** — Update package.json first, then create the tag
4. **Binary artifacts missing from release** — Check the build matrix — all 3 platforms must succeed
5. **Workflow_dispatch doesn't find the tag** — The tag must exist in the repository before running dispatch

---

## Release Checklist

### Pre-release

- [ ] All PRs merged to `develop`
- [ ] `just check` passes on `develop`
- [ ] `just test` passes (all tests)
- [ ] `just test-e2e` passes
- [ ] CHANGELOG.md updated with `[Unreleased]` section for the new version
- [ ] `package.json` version bumped
- [ ] [Optional] Create and tag `vX.Y.Z-beta.1` for pre-release testing

### Release

- [ ] PR `develop` → `main` created, reviewed, squash-merged
- [ ] `main` pulled locally
- [ ] Tag `vX.Y.Z` created and pushed: `git tag v1.0.14 && git push origin v1.0.14`
- [ ] Monitor release workflow in GitHub Actions
- [ ] Verify npm package: `npm view @fisherk2-dev/codice@latest`
- [ ] Verify GitHub Release with binary assets

### Post-release

- [ ] `develop` branch synced with `main`: `git checkout develop && git merge main && git push`
- [ ] GitHub Wiki synced (if wiki source changed)
- [ ] Release announced (if applicable)

### Example: v1.0.14 Release

```bash
# 1. Test with beta
git tag v1.0.14-beta.1
git push origin v1.0.14-beta.1
# Wait for CI, verify on npm

# 2. Production release
git tag v1.0.14 && git push origin v1.0.14
```

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

Códice installs an **OpenCode workspace template** organized into three file categories: **Obligatorio** (always copied), **Estándar** (copied only if missing), and **Opcional** (presented as a checklist). When adding new agents, commands, or skills to the template, follow the procedures below. Each links to the full step-by-step guide in the [USER_GUIDE.md](template/opcional/docs/opencode/USER_GUIDE.md).

### Add a New Agent

The project has **two types of agents** with different procedures:

- **Subagent** (~96 currently) — expert in a specific domain, invoked via `task()` from a primary agent
- **Primary agent** (6 currently: huitzilopochtli, quetzalcoatl, moctezuma, tlaloc, mictlantecuhtli, tezcatlipoca) — main entry point for slash commands, able to delegate to subagents

Key steps for adding an agent:

1. **Create `agents/<agent-name>.md`** with the appropriate frontmatter format (YAML frontmatter, role, scope, output format, rules)
2. **Add a `## Composition` block** at the end following the standard format (Invoke directly when / Invoke via / Do not invoke from another persona)
3. **Update the global catalog** in [docs/opencode/03-agent-index.md](template/opcional/docs/opencode/03-agent-index.md) — add the agent to the corresponding domain section
4. **Update the SUBAGENT DELEGATION tables** of primary agents that can delegate to the new agent (quetzalcoatl, tlaloc, mictlantecuhtli)
5. **Update huitzilopochtli's catalog** in [agents/huitzilopochtli.md](agents/huitzilopochtli.md) — add the agent to the appropriate domain list
6. **Add the name to the `VALID_SUBAGENTS` Set** in [.opencode/plugins/sdd-pipeline.ts](.opencode/plugins/sdd-pipeline.ts)
7. **Restart your OpenCode session** so it recognizes the new agent

**Primary agents** require additional steps: add SDD plugin hooks (identity patterns, keyword detection, command mapping, mention patterns, role rules), update orchestration patterns documentation, and add to the agent persona tables.

See [USER_GUIDE.md — Add a New Agent](template/opcional/docs/opencode/USER_GUIDE.md#add-a-new-agent) for the complete step-by-step procedure.

### Add a New Skill

Key steps:

1. **Place the skill in `skills/<skill-name>/SKILL.md`** — use a kebab-case directory name
2. **Migrate internal `references/`** — if the skill contains a `references/` directory, move all content to the root `references/` folder and delete the empty directory inside the skill
3. **Create a proper `SKILL.md`** following the format defined in [docs/opencode/05-skills.md](template/opcional/docs/opencode/05-skills.md) — must include YAML frontmatter with valid `name` and `description`
4. **Update available skills documentation:**
   - [skills/using-agent-skills/SKILL.md](skills/using-agent-skills/SKILL.md) — add to the "Skill Discovery" tree and "Quick Reference" table
   - [docs/opencode/USER_GUIDE.md](template/opcional/docs/opencode/USER_GUIDE.md) — add to the appropriate phase table and project structure tree
5. **Restart your OpenCode session**

Skills must be **specific** (actionable steps), **verifiable** (clear exit criteria), **battle-tested** (based on real engineering workflows), and **minimal** (only content necessary to guide the agent correctly).

See [USER_GUIDE.md — Add a New Skill](template/opcional/docs/opencode/USER_GUIDE.md#add-a-new-skill) for the complete procedure and quality standards.

### Add a New Command

Slash commands are the main entry point for users. Each command activates a primary agent with a predefined workflow.

Key steps:

1. **Create `commands/<command-name>.md`** with YAML frontmatter: `description` (action verb + what it does) and `agent` (target primary agent name)
2. **Write the command flow** as numbered steps — reference skills inline (`@skills/skill-name/SKILL.md`), use the `question` tool at decision points, include handoff instructions if the agent doesn't write code
3. **Update documentation:**
   - [docs/opencode/USER_GUIDE.md](template/opcional/docs/opencode/USER_GUIDE.md) — add to the Commands table and project structure tree
   - [README.md](README.md) — add to the full-cycle phase table and update the Mermaid diagram if applicable
4. **Update the SDD plugin** — add to `COMMAND_AGENT_MAP` in [.opencode/plugins/sdd-pipeline.ts](.opencode/plugins/sdd-pipeline.ts)
5. **If the command introduces a new SDD phase**, also update [docs/opencode/02-orchestration-patterns.md](template/opcional/docs/opencode/02-orchestration-patterns.md)
6. **Restart your OpenCode session**

See [USER_GUIDE.md — Add a New Command](template/opcional/docs/opencode/USER_GUIDE.md#add-a-new-command) for the full procedure.

### File Classification

After adding new files to the template, classify them into the appropriate category:

| Category | Behavior | Examples |
|----------|----------|----------|
| **Obligatorio** | Always copied, overwrites existing | Core agents (`agents/`), commands (`commands/`), configuration (`opencode.json`, `.opencode/plugins/`) |
| **Estándar** | Copied only if missing in destination | README.md, CONTRIBUTING.md, CHANGELOG.md, LICENSE, references/, docs/ |
| **Opcional** | Presented as a checklist; copied only if selected **and** missing | Specialized skills, optional documentation files |

Place files in the corresponding directory under `template/`:
- `template/obligatorio/` — for Obligatorio files
- `template/estandar/` — for Estándar files
- `template/opcional/` — for Opcional files

The Códice CLI handles the classification automatically based on the directory location. No manual rule manifest updates are required.

### References

- **[USER_GUIDE.md](template/opcional/docs/opencode/USER_GUIDE.md)** — Complete reference guide with detailed procedures for all contributions
- **[01-agents.md](template/opcional/docs/opencode/01-agents.md)** — Agent configuration, frontmatter format, permissions, modes
- **[03-agent-index.md](template/opcional/docs/opencode/03-agent-index.md)** — Complete classified catalog of all 102+ agents
- **[04-commands.md](template/opcional/docs/opencode/04-commands.md)** — Command creation guide, frontmatter format, best practices
- **[05-skills.md](template/opcional/docs/opencode/05-skills.md)** — Skill creation guide, format specification, nomenclature

---

*Last revised: 2026-06-25*
