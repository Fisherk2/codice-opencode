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
just lint-docs    # Markdown lint (markdownlint-cli2)
```

- **Prerequisites:** [Bun](https://bun.sh) >= 1.3 (CI pins 1.3 — use it to reproduce CI locally), [Just](https://github.com/casey/just)
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
4. **Run the full gate ladder** locally (same commands CI enforces):
   ```bash
   just check            # biome ci + tsc --noEmit — 0 errors
   just test             # unit + integration — 0 failures
   just coverage-check   # 95% global + src/cli/main.ts gates
   just test-e2e         # CLI E2E suite — 31/31 scenarios
   just lint-docs        # markdownlint-cli2 — informational CI docs job
   ```
5. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `style:`, `perf:`).
6. **Push and open a PR** against `develop` with a descriptive title referencing related issues.
7. **Ensure CI passes** on all platforms (Linux, macOS, Windows). A failure on any platform blocks the merge.
8. **Squash merge** into `develop` after review.

### Commit Trailer: Co-Authored-By

Every commit authored by an AI agent ends with a `Co-Authored-By` trailer naming the **primary agent** that ran the session — attribution lives in the trailer, never in the subject line:

```text
Co-Authored-By: Huitzilopochtli <dev@fisherk2.com>
```

### Testing

> **⚠️ Always use `just` commands for testing.** Direct `bun test` picks up test files from `skills/` directories and causes false failures. Never use bare `bun test`.

```bash
just test           # All unit + integration tests
just test-unit      # Domain logic only (pure functions, entities)
just test-integration  # Adapters + use cases with mocked externals
just test-packaging # npm tarball structure validation (5 scenarios)
just test-e2e       # CLI against isolated directories (31 scenarios)
just test-watch     # Watch mode for development
just test-coverage  # With coverage report
just lint-docs      # markdownlint-cli2 (config .markdownlint-cli2.jsonc)
```

- **Docs lint gate:** `just lint-docs` runs on every PR as the CI `docs` job (ubuntu) — informational, not a required check.
- **Coverage gate:** `just coverage-check` enforces **95% global** plus a **95% sub-gate on `src/cli/main.ts`** (single source: `scripts/coverage-thresholds.json`; measured 96.39% at v2.1.3). The gate covers all production `src/`, not just the domain layer.
- **Integration tests:** Adapters with real temp dirs. No live network calls.
- **E2E tests:** `bun run src/cli/main.ts`, isolated dirs, 31 scenarios. Bash scripts (Linux CI only).
- **Pack flags:** `--packs <list>` (comma-separated), `--packs-all` (all 8 selectable), `--update-add-packs <list>` (add packs during update).

---

## Pre-commit Hooks

The repo ships a dependency-free pre-commit hook in `.githooks/pre-commit` (enabled via
`git config core.hooksPath .githooks` — no husky, no npm lifecycle scripts).

| Check | Command | Behavior |
|-------|---------|----------|
| Typecheck | `bun run tsc --noEmit` | **Blocking** — commit rejected on type errors |
| Secret scan | `gitleaks protect --staged --no-banner` | **Blocking when gitleaks installed**; otherwise a one-line notice and the commit continues |

```bash
# setup (fresh clone)
git config core.hooksPath .githooks

# install gitleaks (optional but recommended)
brew install gitleaks   # or: apt-get install gitleaks — or binary from github.com/gitleaks/gitleaks

# skip a check
SKIP=typecheck git commit -m "..."
SKIP=all git commit -m "..."
```

> **NTFS/Windows-WSL checkout:** mounts without the `permissions` option can't store the executable bit, so git skips the hook. Run it manually: `bash .githooks/pre-commit`.

---

## Git Workflow

This project follows a **3-stage pipeline**: `develop` (integration) → `main` (production) → `tags` (release), with four distinct flows:

### Branch Naming & Rules

| Prefix | Purpose | Branch From | PR To | Example |
|--------|---------|-------------|-------|---------|
| `feat/` | Features | `develop` | `develop` | `feat/task-creation` |
| `fix/` | Bug fixes | `develop` | `develop` | `fix/double-commit` |
| `chore/` | Maintenance | `develop` | `develop` | `chore/update-deps` |
| `docs/` | Documentation | `develop` | `develop` | `docs/api-guide` |
| `refactor/` | Restructuring | `develop` | `develop` | `refactor/merge-engine` |
| `hotfix/` | Emergency fixes | `main` | `main` | `hotfix/critical-security` |
| `release/` | Stable release preparation | `develop` | `main` | `release/2.1.3` |

### Critical Rules

1. **🛑 Never work directly on `develop` or `main`.** All changes go through a branch and PR. Direct commits are forbidden. Branch protection blocks direct and force pushes on both branches — but `enforce_admins=true` applies to `main` only (`scripts/setup-branch-protection.sh`): the maintainer may push the documented rule-3 `develop` ← `main` syncs directly to `develop` (as done in `d03191a` and `81a360d`); every other change, by anyone, still goes through a PR.
2. **✅ Always verify CI on every PR.** Required status checks (`quality (ubuntu-latest)`, `quality (macos-latest)`, `quality (windows-latest)`, `security`) must pass before merging. A failure on any platform blocks the merge — regardless of whether it is a pre-release (`beta`, `rc`) or production release. Fix pre-release CI failures before tagging production; they **will** recur. Every PR runs the workflow (`paths-ignore` applies only to `push`), so required checks always report.
3. **🔄 Post-release sync `develop` ← `main` is mandatory.** Skipping it causes divergent branches and merge conflicts — even in single-contributor projects. Sync after EVERY merge to `main`:
   ```bash
   git checkout develop && git merge main && git push origin develop
   ```
4. **🔒 Automated Branch Protection.** To apply or refresh branch protection rules on `main` and `develop`, run:
   ```bash
   bash scripts/setup-branch-protection.sh
   ```

### Normal Flow (`feat/` · `fix/` · `chore/` · `docs/` · `refactor/`)

```text
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

```text
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

### Release Flow (`release/`)

```text
develop ──●───────────────●──  (integration)
           ╲             ╱
            ●─────●─────●  ← stabilization → release/X.Y.Z
                          │
main ──────●──────────────●──  (production)
           │                    │
           └── PR release→main ─┘  (squash merge)
                                     │
tags                                 ● vX.Y.Z
```

1. Branch from `develop`: `git checkout -b release/X.Y.Z develop`
2. Stabilization fixes land on the branch (PRs to `release/X.Y.Z` or direct commits — it is a short-lived, unprotected branch)
3. When CI is green: PR `release/X.Y.Z` → `main` → squash merge
4. Tag for release
5. Post-release: sync `develop` ← `main`

### Prerelease Flow (`beta` / `rc`)

The stable path is the `release/X.Y.Z` flow above ([ADR-023](docs/adr/adr-023-short-lived-release-branches.md)). A prerelease lands through `develop` first — this is the executed path of `v2.1.5-beta.1` and the pattern for future `beta`/`rc` tags:

1. Work lands on any working branch — `hotfix/update-payload` for `v2.1.5-beta.1`, not a release branch — and is PR'd → squash-merged into `develop` (PR #119 → `3883288`). Cut `release/X.Y.Z` from `develop` first only if the prerelease needs pre-beta stabilization.
2. Sync `develop` ← `main` before promoting, so `strict: true` required checks can pass against the base branch (`d03191a`, landed ahead of PR #121; its 7 conflicts were resolved on the `develop` side because the #104 fix was already there via #105).
3. PR `develop` → `main` → squash merge (PR #121 → `c579948`).
4. Annotated tag `vX.Y.Z-beta.N` (or `-rc.N`) on the `main` tip → CI publishes under dist-tag `beta`/`rc`; `latest` untouched (it stayed at 2.1.4).
5. Post-release: sync `develop` ← `main`, pushed directly to `develop` (`81a360d`).

Trace this route with `gh pr view 119 121 --json headRefName,mergeCommit`, not with ancestry: a squash merge does not preserve lineage, so `merge-base --is-ancestor` proves nothing here. The local `release/v2.1.5` branch was cut only after the tag (from `81a360d`), was never pushed to `origin` during the beta and is not part of the beta's path; it is now the branch where v2.1.5 is prepared as **ready for stable deployment — not yet published** (`latest` remains at 2.1.4).

### Why Clean Merges

With a single contributor, every PR from `develop` → `main` should be a clean fast-forward merge. If merge conflicts occur, the cause is one of:
- Work was done directly on `develop` or `main` (forbidden).
- A branch was created from the wrong base.
- Post-release sync was skipped.

All three are preventable. Follow the rules above.

---

## Release

Releases are **tag-driven**: pushing an annotated `v*` tag runs
[`.github/workflows/release.yml`](.github/workflows/release.yml), which gates on CI,
publishes `@fisherk2-dev/codice` with `--provenance` (dist-tag `beta`/`rc`/`latest`) and
creates the GitHub Release. Use the Just helpers — never push a tag by hand:

```bash
just tag vX.Y.Z-beta.1                       # validate + create annotated tag (no push)
just release vX.Y.Z-beta.1                   # run check + test, then push the tag → CI publish
just verify-release X.Y.Z-beta.1             # npm view + CLI --help, retried 5×15s
just rollback vX.Y.Z-bad <good> <dist_tag>   # guarded rollback (DRY_RUN=1 to preview)
```

`just tag` validates the tag format (`vX.Y.Z`, `vX.Y.Z-beta.N` or `vX.Y.Z-rc.N`), a
prerelease tag never overwrites `latest` (it publishes under its own `beta`/`rc` dist-tag),
and `just rollback` is the guarded bad-publish recovery. Release-phase status and final gate
metrics are tracked in [docs/WORKFLOW.md](docs/WORKFLOW.md).

---

## Workspace Template

Códice installs an OpenCode workspace template organized into three file categories: **Obligatorio** (always copied), **Estándar** (copied only if missing), and **Opcional** (presented as a checklist). This section covers how to add new agents, skills, commands, and MCP servers to the template.

### Add a New Agent

1. Create `template/obligatorio/packs/<pack-name>/<agent-name>.md` with YAML frontmatter (name, role, scope, rules, composition).
2. Update the agent catalog at the [GitHub Wiki → Agents](https://github.com/fisherk2/codice-opencode/wiki/Agents).
3. Restart your OpenCode session.

**Primary agents** additionally require: orchestration patterns.

### Add a New Skill

1. Create `template/obligatorio/core/skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`).
2. Include actionable numbered steps, verification criteria, and exit conditions.
3. (Optional) Add extended reference material in `skills/<skill-name>/references/` — these become available to agents via the `references` section in `opencode.json`.
4. Add to the [GitHub Wiki → Skills](https://github.com/fisherk2/codice-opencode/wiki/Skills).
5. Restart your OpenCode session.

### Add a New Command

1. Create `template/obligatorio/core/commands/<command-name>.md` with YAML frontmatter (`description`, `agent` target).
2. Write numbered steps referencing skills (`@skills/name/SKILL.md`) and using the `question` tool at decision points.
3. Update documentation and add to the [GitHub Wiki → Commands](https://github.com/fisherk2/codice-opencode/wiki/Commands).
4. Restart your OpenCode session.

### Add a New MCP Server

1. Add server configuration to `template/obligatorio/core/opencode.json` under the `mcp.servers` section.
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

> **⚠️ Data-loss guard:** `docs/wiki-source/.wiki` is a nested git repo, so the `rsync --delete` sync can overwrite uncommitted work there and publish deletions of pages that exist only in the wiki. The live example: `Customization-Guide.md` (361 lines) existed only in the wiki until it was adopted into `docs/wiki-source/` (`c058a0d`, corrected in `c9c8643`) — a page in that state is invisible to the docs flow and at the mercy of `--delete`. Run the two guard commands below first; if `status` shows dirt, commit or stash it before syncing.

```bash
# From the project root — guards first:
git -C docs/wiki-source/.wiki status --porcelain   # must be empty; anything here can be silently overwritten
git -C docs/wiki-source/.wiki ls-files             # pages here missing from docs/wiki-source/*.md WILL be deleted by --delete (measured); an -n dry-run does NOT list them in this file-glob layout, so this check is the real guard

rsync -a --delete --exclude='README.md' docs/wiki-source/*.md docs/wiki-source/.wiki/

cd docs/wiki-source/.wiki
git add .
git commit -m "Sync wiki v$(node -p "require('../../../package.json').version")"
git push
```

See [docs/wiki-source/README.md](docs/wiki-source/README.md) for the full procedure and rules.

---

## References

- **npm Publishing:** `@fisherk2-dev/codice` with dist-tags `latest`, `beta`, `rc`. See [docs/TRD.md](docs/TRD.md).
- **CI/CD Pipeline:** `ci.yml` (quality matrix) + `release.yml` (tag → npm publish). See [.github/workflows/](.github/workflows/).
- **Release Runbook:** tag → verify CI → `just verify-release` → sync develop. Commands and guarded rollback: see the [Release](#release) section above; phase status in [docs/WORKFLOW.md](docs/WORKFLOW.md).
- **Reporting Issues:** Include expected vs actual behavior, steps to reproduce, environment, and verbose logs.
- **GitHub Wiki:** [Agents](https://github.com/fisherk2/codice-opencode/wiki/Agents), [Skills](https://github.com/fisherk2/codice-opencode/wiki/Skills), [Commands](https://github.com/fisherk2/codice-opencode/wiki/Commands), [MCP Servers](https://github.com/fisherk2/codice-opencode/wiki/MCP-Servers), [Configuration](https://github.com/fisherk2/codice-opencode/wiki/Configuration).

---

*Last revised: 2026-11-18*
