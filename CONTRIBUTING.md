# Contributing to Códice

First off, thank you for considering contributing to Códice!

By participating, you agree to abide by this project's [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Code of Conduct

This project adheres to the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct.html), version 2.1. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Quick Start

```bash
git clone https://github.com/fisherk2/codice-opencode.git
cd codice-opencode
just setup        # Install dependencies
just check        # Lint + format + typecheck
just test         # All unit + integration tests
```

- **Prerequisites:** [Bun](https://bun.sh) >= 1.1.x, [Just](https://github.com/casey/just)
- **Architecture:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Clean Architecture, dependency rule, ADRs
- **Code style:** [docs/CODE_STYLE.md](docs/CODE_STYLE.md) — Strict TypeScript, naming conventions, error handling

---

## How to Contribute

### Workflow

1. **Open an issue first** for substantial changes to discuss before investing time.
2. **Create a feature branch** from `develop`:
   ```bash
   git checkout -b feat/my-feature develop
   ```
3. **Write code**, following [code style](docs/CODE_STYLE.md). Write or update tests.
4. **Run the full check suite** locally:
   ```bash
   just check
   just test
   ```
5. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `style:`, `perf:`).
6. **Push and open a PR** against `develop` with a descriptive title referencing related issues.
7. **Ensure CI passes** on all platforms (Linux, macOS, Windows). A failure on any platform blocks the merge.
8. **Squash merge** into `develop` after review.

### Testing

> **⚠️ Always use `just` commands for testing.** Direct `bun test` picks up test files from `skills/` directories and causes false failures. Never use bare `bun test`.

```bash
just test           # All unit + integration tests
just test:unit      # Domain logic only (pure functions, entities)
just test:integration  # Adapters + use cases with mocked externals
just test-packaging # npm tarball structure validation (5 scenarios)
just test:e2e       # CLI against isolated directories (15 scenarios)
just test-watch     # Watch mode for development
just test:coverage  # With coverage report
```

- **Unit tests:** > 90% coverage target. Domain layer only.
- **Integration tests:** Adapters with real temp dirs. No live network calls.
- **E2E tests:** `bun run src/cli/main.ts`, isolated dirs, 15 scenarios. Bash scripts (Linux CI only).

---

## Git Workflow

This project follows a **3-stage pipeline**: `develop` (integration) → `main` (production) → `tags` (release), with two distinct flows:

### Branch Naming & Rules

| Prefix | Purpose | Branch From | PR To | Example |
|--------|---------|-------------|-------|---------|
| `feat/` | Features | `develop` | `develop` | `feat/task-creation` |
| `fix/` | Bug fixes | `develop` | `develop` | `fix/double-commit` |
| `chore/` | Maintenance | `develop` | `develop` | `chore/update-deps` |
| `docs/` | Documentation | `develop` | `develop` | `docs/api-guide` |
| `refactor/` | Restructuring | `develop` | `develop` | `refactor/merge-engine` |
| `hotfix/` | Emergency fixes | `main` | `main` | `hotfix/critical-security` |

### Critical Rules

1. **🛑 Never work directly on `develop` or `main`.** All changes go through a branch and PR. Direct commits are forbidden.
2. **✅ Always verify CI on every PR.** A failure on any platform blocks the merge — regardless of whether it is a pre-release (`beta`, `rc`) or production release. Fix pre-release CI failures before tagging production; they **will** recur.
3. **🔄 Post-release sync `develop` ← `main` is mandatory.** Skipping it causes divergent branches and merge conflicts — even in single-contributor projects. Sync after EVERY merge to `main`:
   ```bash
   git checkout develop && git merge main && git push origin develop
   ```

### Normal Flow (`feat/` · `fix/` · `chore/` · `docs/` · `refactor/`)

```
develop ──●─────────●─────────●──  (integration)
           ╲       ╱         ╱
            ●─────●  ← PRs → develop (squash merge)
                          │
main ──────●──────────────●──────  (production)
           │                    │
           └── PR develop→main ─┘  (squash merge)
                                    │
tags                                ● vX.Y.Z
```

1. Branch from `develop`: `git checkout -b feat/my-feature develop`
2. PR to `develop` → squash merge
3. After validation, PR `develop` → `main` → squash merge
4. Tag for release
5. Post-release: sync `develop` ← `main`

### Hotfix Flow (`hotfix/`)

```
main ────●─────────●──────────  (production)
          ╲       ╱
           ●─────●  ← PRs → main (squash merge)
                         │
                         ● tag vX.Y.Z
                         │
develop ──●──────────────●────  (synced after release)
```

1. Branch from `main`: `git checkout -b hotfix/critical-fix main`
2. PR directly to `main` → squash merge
3. Tag for release
4. Post-release: sync `develop` ← `main`

### Why Clean Merges

With a single contributor, every PR from `develop` → `main` should be a clean fast-forward merge. If merge conflicts occur, the cause is one of:
- Work was done directly on `develop` or `main` (forbidden).
- A branch was created from the wrong base.
- Post-release sync was skipped.

All three are preventable. Follow the rules above.

---

## Workspace Template

Códice installs an OpenCode workspace template organized into three file categories: **Obligatorio** (always copied), **Estándar** (copied only if missing), and **Opcional** (presented as a checklist). This section covers how to add new agents, skills, commands, and MCP servers to the template.

### Add a New Agent

1. Create `agents/<agent-name>.md` with YAML frontmatter (name, role, scope, rules, composition).
2. Update the agent catalog at the [GitHub Wiki → Agents](https://github.com/fisherk2/codice-opencode/wiki/Agents).
3. Update delegation tables of primary agents that can invoke the new agent (quetzalcoatl, tlaloc, mictlantecuhtli).
4. Update huitzilopochtli's catalog in `agents/huitzilopochtli.md`.
5. Restart your OpenCode session.

**Primary agents** additionally require: SDD plugin hooks, orchestration patterns, and persona table updates.

### Add a New Skill

1. Create `skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`).
2. Include actionable numbered steps, verification criteria, and exit conditions.
3. (Optional) Add extended reference material in `skills/<skill-name>/references/` — these become available to agents via the `reference` section in `opencode.json`.
4. Add to the [GitHub Wiki → Skills](https://github.com/fisherk2/codice-opencode/wiki/Skills).
5. Restart your OpenCode session.

### Add a New Command

1. Create `commands/<command-name>.md` with YAML frontmatter (`description`, `agent` target).
2. Write numbered steps referencing skills (`@skills/name/SKILL.md`) and using the `question` tool at decision points.
3. Update documentation and add to the [GitHub Wiki → Commands](https://github.com/fisherk2/codice-opencode/wiki/Commands).
4. Restart your OpenCode session.

### Add a New MCP Server

1. Add server configuration to `opencode.json` under the `mcp.servers` section.
2. Add API key instructions and usage examples to the [GitHub Wiki → MCP Servers](https://github.com/fisherk2/codice-opencode/wiki/MCP-Servers).
3. Restart your OpenCode session.

### File Classification

| Category | Behavior | Directory |
|----------|----------|-----------|
| **Obligatorio** | Always copied, overwrites existing | `template/obligatorio/` |
| **Estándar** | Copied only if missing | `template/estandar/` |
| **Opcional** | Checklist; copied only if selected and missing | `template/opcional/` |

### Update the GitHub Wiki

The project Wiki is synced from `docs/wiki-source/`. After adding agents, skills, commands, or MCPs to the template, sync the Wiki so the documentation stays current.

```bash
# From the project root
rsync -a --delete --exclude='README.md' docs/wiki-source/*.md docs/wiki-source/.wiki/

cd docs/wiki-source/.wiki
git add .
git commit -m "Sync wiki v$(node -p "require('../../package.json').version")"
git push
```

See [docs/wiki-source/README.md](docs/wiki-source/README.md) for the full procedure and rules.

---

## References

- **npm Publishing:** `@fisherk2-dev/codice` with dist-tags `latest`, `beta`, `rc`. See [docs/TRD.md](docs/TRD.md).
- **CI/CD Pipeline:** `ci.yml` (quality matrix) + `release.yml` (tag → npm publish). See [.github/workflows/](.github/workflows/).
- **Release Checklist:** Pre-release test → merge to main → tag → verify CI → verify npm → sync develop.
- **Reporting Issues:** Include expected vs actual behavior, steps to reproduce, environment, and verbose logs.
- **GitHub Wiki:** [Agents](https://github.com/fisherk2/codice-opencode/wiki/Agents), [Skills](https://github.com/fisherk2/codice-opencode/wiki/Skills), [Commands](https://github.com/fisherk2/codice-opencode/wiki/Commands), [MCP Servers](https://github.com/fisherk2/codice-opencode/wiki/MCP-Servers), [Configuration](https://github.com/fisherk2/codice-opencode/wiki/Configuration).

---

*Last revised: 2026-07-30*
