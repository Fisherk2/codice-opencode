# Plan: F0 – Preparación y Convenciones

## Overview

Establish the project foundation: initialize Bun, create the Clean Architecture directory structure, configure the `Justfile` with all required tasks, and set up Biome for linting/formatting.

**Goal:** A fully bootstrapped development environment where `just setup` installs dependencies and all quality gates pass on the initial boilerplate.

---

## Architecture Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| F0-A1 | Use `bun init` to initialize the project | Bun's built-in initialization sets up `package.json`, `tsconfig.json`, and entry point correctly |
| F0-A2 | Use Biome instead of ESLint + Prettier | Single tool for linting and formatting, faster execution, better DX |
| F0-A3 | Embed template files via `Bun.file()` at compile time | Per SPEC.md Decision #1 — guarantees portability, eliminates "missing template" errors |
| F0-A4 | Use SCREAMING_SNAKE_CASE for constants | Per CODE_STYLE.md convention |
| F0-A5 | Zero external runtime dependencies | All filesystem and network ops use Bun built-ins |

---

## Dependency Graph

```
F0 has NO external dependencies — starts from scratch
```

---

## Task List

### Phase 1: Project Initialization

#### Task F0-T1: Initialize Bun project with `bun init`

**Description:** Bootstrap the project using `bun init` to create `package.json`, `tsconfig.json`, and the entry point. Remove the auto-generated `index.ts` and `hello.ts` files.

**Acceptance criteria:**
- [ ] `bun init` runs without errors
- [ ] `package.json` contains name `"codice"`, version `"1.0.0"`, and type `"module"`
- [ ] `tsconfig.json` has strict mode enabled
- [ ] Auto-generated boilerplate files removed

**Verification:**
- [ ] `bun --version` outputs `>= 1.1.x`
- [ ] `cat package.json | grep '"type": "module"'` succeeds
- [ ] `ls src/` shows only files created by this task

**Dependencies:** None

**Files touched:**
- `package.json` (generated)
- `tsconfig.json` (generated)
- Auto-generated files (removed)

**Estimated scope:** XS — single command with cleanup

---

#### Task F0-T2: Create Clean Architecture directory structure

**Description:** Create the full Clean Architecture directory tree under `src/` per SPEC.md §Project Structure. Also create the `tests/` tree and `dist/` directory.

**Acceptance criteria:**
- [ ] `src/domain/entities/` exists with `FileRule.ts` and `WorkspaceVersion.ts` stubs
- [ ] `src/domain/services/` exists with `FileMergeEngine.ts` and `VersionComparator.ts` stubs
- [ ] `src/application/use-cases/` exists with the three use case stubs
- [ ] `src/application/ports/` exists with `IFileSystem.ts`, `IGitHubClient.ts`, `IUserPrompt.ts` stubs
- [ ] `src/infrastructure/adapters/` exists with `BunFileSystem.ts`, `GitHubRestClient.ts`, `ClackPromptsAdapter.ts` stubs
- [ ] `src/infrastructure/config/` exists with `constants.ts` stub
- [ ] `src/cli/main.ts` exists as entry point stub
- [ ] `tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/fixtures/` exist
- [ ] `dist/` exists

**Verification:**
- [ ] `find src -type d | sort` lists all expected directories
- [ ] `find tests -type d | sort` lists all expected test directories
- [ ] All stub files export something (even if just `// TODO`)

**Dependencies:** F0-T1

**Files touched:**
- Directories created under `src/`
- Directories created under `tests/`
- `dist/` created

**Estimated scope:** S — file creation only, no logic

---

#### Task F0-T3: Install project dependencies

**Description:** Install the runtime and development dependencies defined in the tech stack.

**Acceptance criteria:**
- [ ] `@clack/prompts` installed (TUI framework)
- [ ] `semver` installed (version parsing)
- [ ] `biome` installed as dev dependency (linting/formatting)

**Verification:**
- [ ] `bun add @clack/prompts semver` succeeds
- [ ] `bun add -d biome` succeeds
- [ ] `ls node_modules/@clack/` shows `prompts`
- [ ] `ls node_modules/semver/` exists
- [ ] `ls node_modules/.bin/biome` exists

**Dependencies:** F0-T1

**Files touched:**
- `package.json` (updated)
- `node_modules/` (populated)

**Estimated scope:** S — package installation

---

### Phase 2: Task Runner Configuration

#### Task F0-T4: Create `Justfile` with all development tasks

**Description:** Create the `Justfile` with all tasks defined in SPEC.md §Commands. The file must include `setup`, `dev`, `lint`, `format`, `check`, `test`, `test:unit`, `test:integration`, `test:e2e`, `test:coverage`, `build`, `build:all`, and `release`.

**Acceptance criteria:**
- [ ] `just setup` installs dependencies, verifies Bun version >= 1.1.x, and creates required directories
- [ ] `just dev` runs `src/cli/main.ts` via `bun run` with verbose logging
- [ ] `just lint` runs Biome across `src/` and `tests/`
- [ ] `just format` runs Biome format in write mode
- [ ] `just check` runs lint + format check + typecheck in sequence
- [ ] `just test` runs `bun test` across all `*.test.ts` files
- [ ] `just test:unit` runs only `tests/unit/**/*.test.ts`
- [ ] `just test:integration` runs only `tests/integration/**/*.test.ts`
- [ ] `just test:e2e` compiles binary and runs shell-based E2E scripts
- [ ] `just test:coverage` runs `bun test --coverage` and enforces > 80% threshold
- [ ] `just build` compiles the binary to `dist/codice-<platform>`
- [ ] `just build:all` triggers cross-platform compilation workflow
- [ ] `just release` creates a GitHub Release with attached binaries
- [ ] `just -n` (dry run) shows all recipes without executing

**Verification:**
- [ ] `just -n` lists all 13 recipes
- [ ] `just setup` completes without error on first run
- [ ] `just lint` passes on the current boilerplate

**Dependencies:** F0-T1, F0-T2

**Files touched:**
- `Justfile`

**Estimated scope:** M — one file with 13 recipes

---

### Phase 3: Linting and Formatting

#### Task F0-T5: Configure Biome for linting and formatting

**Description:** Create `biome.json` with rules matching the project's TypeScript style requirements. The config must:
- Enable strict TypeScript checking
- Disable `noExplicitAny` rule (set to off — project uses `unknown` with guards instead)
- Enable `unicorn` rules for modern JS patterns
- Configure import sorting
- Set line width to 100
- Configure JSON formatter

**Acceptance criteria:**
- [ ] `biome.json` exists with valid configuration
- [ ] `just lint` passes on all existing TypeScript files with no errors
- [ ] `just format` formats all TypeScript files in place
- [ ] `just check` fails if files are unformatted or have lint errors

**Verification:**
- [ ] `just lint` exits 0 on current codebase
- [ ] `just format --check` exits 0 after running format
- [ ] No `any` types in any `.ts` file after running format

**Dependencies:** F0-T3, F0-T4

**Files touched:**
- `biome.json`
- All `.ts` files formatted

**Estimated scope:** S — one config file + formatting existing stubs

---

#### Task F0-T6: Configure GitHub Actions workflow for F0

**Description:** Create `.github/workflows/ci.yml` that runs on every push/PR to `main`. E2E tests are excluded from this workflow — they run only on release (per F0-O1 resolution).

**Acceptance criteria:**
- [ ] `.github/workflows/ci.yml` exists
- [ ] Workflow triggers on `push` and `pull_request` to `main`
- [ ] Jobs run on `ubuntu-latest`, `macos-latest`, `windows-latest`
- [ ] Each job runs `just check` (lint + format + typecheck), `just test` (unit + integration only, no E2E), and `just build`
- [ ] Artifacts are uploaded on failure for debugging
- [ ] E2E tests are **NOT** run in this workflow (they run only on release)

**Verification:**
- [ ] `cat .github/workflows/ci.yml | grep 'ubuntu-latest'` succeeds
- [ ] The workflow file is valid YAML (no syntax errors)
- [ ] E2E test task is absent from this workflow

**Dependencies:** F0-T4, F0-T5

**Files touched:**
- `.github/workflows/ci.yml`

**Estimated scope:** S — one YAML workflow file

---

### Checkpoint: After Tasks F0-T1 through F0-T6

| Checkpoint Item | Status |
|-----------------|--------|
| `bun --version` >= 1.1.x | ✅ Bun v1.3.14 confirmed |
| `just setup` executes without error | Pending |
| `just lint` passes on boilerplate | Pending |
| `just format` formats all files | Pending |
| `just -n` shows all 13 recipes | Pending |
| `.github/workflows/ci.yml` valid YAML | Pending |
| All stubs export something (no empty files) | Pending |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Bun version mismatch on CI | High | `just setup` checks version and fails fast |
| Biome config too strict | Medium | Start with minimal rules, add incrementally |
| `just` not installed on CI | High | Use `brew install just` for macOS, binary for Linux/Windows |

---

## Open Questions — Resolved

| # | Question | Resolution |
|---|----------|------------|
| F0-O1 | ¿La CI debe ejecutar E2E tests? | **Solo en Release** — E2E tests solo corren en el workflow de release, no en cada PR. Más rápido, menos costos. |
| F0-O2 | ¿Necesitamos `bunfig.toml`? | **Sí** — Crear `bunfig.toml` para configuración centralizada de Bun |
| F0-O3 | ¿Incluimos `.editorconfig`? | **No** — Biome es suficiente para consistencia entre editores |

---

## Additional Tasks

#### Task F0-T7: Create `bunfig.toml` for Bun configuration

**Description:** Create `bunfig.toml` with centralized Bun configuration for the project. This includes installation settings, build targets, and compile options.

**Acceptance criteria:**
- [ ] `bunfig.toml` exists with valid configuration
- [ ] Configuration supports cross-platform compilation targets
- [ ] Install settings are configured (production vs development)

**Verification:**
- [ ] `cat bunfig.toml` is valid TOML
- [ ] Bun reads the config without warnings

**Dependencies:** F0-T1

**Files touched:**
- `bunfig.toml`

**Estimated scope:** XS — single config file

---

## Phase Summary

| Phase | Tasks | Duration |
|-------|-------|----------|
| Phase 1: Project Initialization | F0-T1, F0-T2, F0-T3 | ~15 min |
| Phase 2: Task Runner Configuration | F0-T4 | ~20 min |
| Phase 3: Linting, CI, and Config | F0-T5, F0-T6, F0-T7 | ~20 min |
| **Total F0** | **7 tasks** | **~1 day** |

---

*Last updated: 2026-06-13*