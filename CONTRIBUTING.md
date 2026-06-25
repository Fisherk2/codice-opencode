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
