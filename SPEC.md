# Spec: Códice — Opencode Workspace Installer v1.0.0

**Status:** Approved  
**Author:** Fisherk2  
**Date:** 2026-06-13  
**Target Release:** v1.0.0  
**Repository:** `https://github.com/fisherk2/11-codice-opencode`

---

## Objective

Códice is a command-line interface (CLI) tool compiled with Bun that installs and updates OpenCode workspace templates in an atomic, safe, and intelligent manner. It resolves the fragmentation and customization-loss problem that occurs when users manually merge template updates into existing projects.

### Problem Statement
OpenCode workspace templates evolve over time. Users currently face three painful scenarios:
1. **Clean setup:** A new user wants the latest template but must manually copy dozens of files.
2. **Existing project:** A user wants to adopt the template without overwriting their existing customizations.
3. **Update:** A user wants to pull the latest template improvements but fears losing their local modifications.

Códice automates all three scenarios with a single binary, zero external dependencies at runtime, and guaranteed atomic operations.

### User Stories

- **US-1 (New User):** As a developer starting a new project, I want to run a single command that installs the complete OpenCode workspace template so that I can begin coding immediately without manual file copying.
- **US-2 (Existing Project):** As a developer with an existing project, I want to selectively merge template files using classification rules (Obligatorio/Estándar/Opcional) so that my existing customizations are preserved while I adopt the template structure.
- **US-3 (Updater):** As a developer who already uses the template, I want to update only the Standard and Obligatorio files after checking the latest GitHub release version so that I stay current without risking my Optional customizations.
- **US-4 (Non-Technical User):** As a user uncomfortable with CLI tools, I want copy-paste installation instructions and an interactive menu that guides me through each decision so that I never feel lost.
- **US-5 (Safety-Conscious User):** As a developer working on critical code, I want the guarantee that an interrupted update will never corrupt my project so that I can run the installer with confidence.

---

## Tech Stack

| Component | Technology | Version / Constraint | Justification |
|-----------|-----------|---------------------|---------------|
| Runtime & Compiler | Bun | >= 1.1.x | Native binary compilation, superior startup time, modern filesystem API, single executable output |
| Language | TypeScript | Strict mode enabled | Type safety at compile time, explicit interfaces for Clean Architecture ports |
| TUI Framework | @clack/prompts | Latest stable | Zero-dependency tree, modern UX, ideal for compiled binaries, lightweight spinner and prompt primitives |
| Testing Framework | bun:test | Bundled with Bun | Native test runner, built-in mocking, coverage reporting, no additional dependencies |
| Linting & Formatting | Biome (or eslint + prettier) | Latest stable | Fast formatting, consistent code style enforcement in CI |
| Task Runner | Just | Latest stable | Cross-platform task definitions (`just setup`, `just test`, `just build`) |
| CI/CD Platform | GitHub Actions | Native | Tight integration with repository, free runners for Linux/macOS/Windows, automatic release asset attachment |
| Version Parsing | semver | Latest stable | Standard semantic version comparison, tag validation |

### Runtime Constraints
- The compiled binary must run on Linux (x64), macOS (x64), and Windows (x64) without requiring Node.js, Bun, or any other runtime installation.
- All filesystem operations must use Bun's native `Bun.file()` and `Bun.write()` APIs or standard Node.js `fs` polyfills provided by Bun.
- Network operations are limited to GitHub REST API calls for version checking.

---

## Commands

All commands are defined in the `Justfile` and mirrored as `package.json` scripts for compatibility.

### Development Commands

| Command | Purpose | Expected Behavior |
|---------|---------|-------------------|
| `just setup` | Bootstrap development environment | Install dependencies via `bun install`, verify Bun version >= 1.1.x, create required directories |
| `just dev` | Run CLI in development mode | Execute `src/cli/main.ts` via `bun run`, enable verbose logging, skip binary compilation |
| `just lint` | Static analysis | Run Biome (or eslint) across `src/` and `tests/`, fail on warnings, enforce no-explicit-any rule |
| `just format` | Code formatting | Run Biome format (or prettier) in write mode, fail if unformatted files detected in CI |
| `just check` | Pre-flight validation | Run `lint`, `format --check`, and `typecheck` in sequence; gate for commits |

### Testing Commands

| Command | Purpose | Expected Behavior |
|---------|---------|-------------------|
| `just test` | Full test suite | Execute `bun test` across all `*.test.ts` files; unit + integration tests |
| `just test:unit` | Unit tests only | Run tests matching `tests/unit/**/*.test.ts`; target < 1s execution |
| `just test:integration` | Integration tests only | Run tests matching `tests/integration/**/*.test.ts`; mock filesystem and network |
| `just test:e2e` | End-to-end tests | Compile binary, execute in isolated temporary directories, validate filesystem state and exit codes |
| `just test:coverage` | Coverage report | Run `bun test --coverage`, generate HTML and lcov reports, enforce > 80% threshold |

### Build & Release Commands

| Command | Purpose | Expected Behavior |
|---------|---------|-------------------|
| `just build` | Compile native binary | Run `bun build --compile src/cli/main.ts --outfile ./dist/codice-<platform>` for current platform |
| `just build:all` | Cross-platform compilation | Trigger GitHub Actions workflow or use local cross-compilation if available; produce `codice-linux`, `codice-macos`, `codice-windows.exe` |
| `just release` | Draft release | Create GitHub Release with attached binaries, generate release notes from `CHANGELOG.md` |

### CLI Runtime Commands (Binary)

| Command | Purpose | Expected Behavior |
|---------|---------|-------------------|
| `codice` | Interactive menu | Launch TUI with three mode options; default entry point for all users |
| `codice --version` | Version display | Print current binary version and exit with code 0 |
| `codice --verbose` | Verbose mode | Enable structured logging to stderr for all operations; useful for debugging |
| `codice --help` | Help display | Show usage instructions, available flags, and link to documentation |

---

## Project Structure

The directory layout follows Clean Architecture with strict layer boundaries. Dependencies always point inward: Infrastructure → Application → Domain. No domain file may import from application or infrastructure.

```
11-codice-opencode/
├── src/
│   ├── domain/                    # Pure business logic, zero external dependencies
│   │   ├── entities/
│   │   │   ├── FileRule.ts        # Classification rule entity (Obligatorio/Estándar/Opcional)
│   │   │   └── WorkspaceVersion.ts # Semantic version value object
│   │   └── services/
│   │       ├── FileMergeEngine.ts # Strategy-based merge orchestrator
│   │       └── VersionComparator.ts # Semantic version comparison logic
│   ├── application/               # Use cases, orchestrates domain via ports
│   │   ├── use-cases/
│   │   │   ├── CleanInstallUseCase.ts      # Mode 1: Overwrite everything
│   │   │   ├── ProjectInstallUseCase.ts    # Mode 2: Selective merge with prompts
│   │   │   └── UpdateWorkspaceUseCase.ts   # Mode 3: Standard + Obligatorio with version check
│   │   └── ports/
│   │       ├── IFileSystem.ts     # Abstract filesystem operations (read, write, staging)
│   │       ├── IGitHubClient.ts   # Abstract GitHub API client (releases/latest)
│   │       └── IUserPrompt.ts     # Abstract TUI interactions (select, confirm, checkbox)
│   ├── infrastructure/            # Concrete adapters for external concerns
│   │   ├── adapters/
│   │   │   ├── BunFileSystem.ts   # Bun-native filesystem with atomic staging
│   │   │   ├── GitHubRestClient.ts # Fetch-based GitHub API client with timeout
│   │   │   └── ClackPromptsAdapter.ts # @clack/prompts wrapper implementing IUserPrompt
│   │   └── config/
│   │       └── constants.ts       # Repository URL, API endpoints, timeout values
│   └── cli/
│       └── main.ts                # Entry point: parses args, wires dependencies, launches TUI
├── tests/
│   ├── unit/                      # Domain logic tests (pure functions, entities)
│   ├── integration/               # Adapter tests with mocked external systems
│   ├── e2e/                       # Shell scripts and fixtures for binary validation
│   └── fixtures/                  # Predefined directory trees for merge scenarios
├── template/                      # The actual OpenCode workspace template files
│   ├── obligatorio/               # Files always copied/overwritten
│   ├── estandar/                  # Files copied only if missing in destination
│   └── opcional/                  # Files presented as checklist; copied only if selected and missing
├── dist/                          # Compiled binaries (gitignored, populated by CI)
├── docs/                          # Architecture decisions, workflow, PRD, TRD
├── specs/                         # Modular specification documents
│   ├── spec-file-rules.md
│   └── spec-cli-commands.md
├── Justfile                       # Task definitions
├── package.json                   # Bun dependencies and scripts
├── tsconfig.json                  # Strict TypeScript configuration
├── biome.json (or eslint/prettier config) # Linting and formatting rules
└── README.md                      # User-facing installation and usage guide
```

### Layer Dependency Rules

1. **Domain Layer** (`src/domain/`)
   - Contains entities and domain services.
   - No imports from `application/` or `infrastructure/`.
   - No usage of `Bun`, `fetch`, `process`, or any runtime-specific APIs.
   - Error handling via `Result<T, Error>` types only.

2. **Application Layer** (`src/application/`)
   - Contains use cases and port interfaces.
   - Depends only on `domain/`.
   - Defines contracts (`IFileSystem`, `IGitHubClient`, `IUserPrompt`) that infrastructure must implement.
   - Orchestrates domain services but contains no business rules.

3. **Infrastructure Layer** (`src/infrastructure/`)
   - Contains concrete adapters.
   - Depends on `application/ports`.
   - Houses all side effects: disk I/O, network requests, user prompts.
   - `BunFileSystem` must implement atomic writes via staging directory + `fs.rename`.

4. **CLI Layer** (`src/cli/`)
   - Single entry point `main.ts`.
   - Wires all adapters and injects them into use cases.
   - Handles process signals (`SIGINT`) to clean up staging directories.
   - Parses command-line arguments and selects execution mode.

---

## Code Style

All code must adhere to the following conventions derived from the project's architectural principles.

### Naming Conventions
- **Files:** PascalCase for classes, camelCase for utilities. Examples: `FileMergeEngine.ts`, `versionComparator.ts`.
- **Classes and Interfaces:** Descriptive nouns. `FileMergeEngine` (not `Merger`), `VersionComparator` (not `VersionCheck`). Interfaces prefixed with `I`: `IFileSystem`, `IGitHubClient`.
- **Functions:** Verb or verb-phrase. `compareVersions`, `stageFileAtomic`, `promptForMode`.
- **Constants:** SCREAMING_SNAKE_CASE for true constants. `GITHUB_API_TIMEOUT_MS`, `STAGING_DIR_NAME`.

### File Size and Structure
- Maximum 200 lines per file. If a file exceeds this limit, extract responsibilities into new modules.
- One primary export per file. Secondary utilities may be co-exported if tightly coupled.
- Imports grouped by layer: external libraries first, then infrastructure, then application, then domain (domain imports are forbidden outside domain).

### TypeScript Rules
- Strict mode enabled. No implicit any.
- Explicit return types on all public methods and exported functions.
- No `any` type usage. Use `unknown` with type guards when type is genuinely uncertain.
- Prefer `readonly` arrays and properties where mutation is not intended.

### Comments and Documentation
- Comments explain **why**, never **what**.
- Public APIs (ports and use cases) include JSDoc describing purpose, parameters, return values, and error conditions.
- Avoid obvious comments such as `// Increment i` next to `i++`.

### Error Handling
- Fail-fast validation at function entry points.
- Domain services return `Result<T, Error>` instead of throwing exceptions.
- Error messages must be actionable. Example: "Permission denied at /path/to/file. Run with appropriate permissions or check directory access." instead of "Error EACCES".
- Infrastructure adapters may catch low-level errors (network, filesystem) and map them to domain error types.

### Pre-Commit Checklist
Every commit must satisfy:
- [ ] `just lint` passes with zero errors and zero warnings.
- [ ] `just test:unit` passes with > 80% coverage.
- [ ] No `any` types introduced.
- [ ] Names are descriptive and follow convention.
- [ ] Documentation updated if public API changed.

---

## Testing Strategy

Testing is organized in three phases with distinct scopes, tools, and success criteria.

### Phase 1: Unit Tests

**Scope:** Pure domain logic — entities, value objects, and domain services.
**Location:** `tests/unit/`
**Tool:** `bun:test`
**Patterns:**
- Arrange-Act-Assert (AAA) structure in every test.
- One assertion concept per test; multiple expect calls allowed if testing one logical outcome.
- Fixtures as plain objects, not file system trees.
- Mocking limited to injecting test doubles via constructor parameters (no global mocks).

**Targets:**
- `FileRule` entity correctly classifies files and validates rule types.
- `WorkspaceVersion` value object parses `vX.Y.Z`, rejects invalid formats, compares correctly.
- `FileMergeEngine` applies the correct strategy (Obligatorio overwrites, Estándar skips existing, Opcional respects user choice).
- `VersionComparator` returns `newer`, `older`, `equal`, `incompatible` results.

**Success Criteria:**
- > 90% code coverage.
- Execution time < 1 second for the full unit suite.
- Zero dependencies on Bun runtime APIs or file system.

### Phase 2: Integration Tests

**Scope:** Adapter behavior with mocked external systems.
**Location:** `tests/integration/`
**Tool:** `bun:test` with manual mocks and temporary directories.
**Patterns:**
- `BunFileSystem` tested against real temporary directories created in `beforeAll` and destroyed in `afterAll`.
- `GitHubRestClient` tested with a local HTTP server or fetch mock returning predefined JSON payloads.
- `ClackPromptsAdapter` tested by simulating input streams and capturing output.

**Targets:**
- Atomic staging: a write operation creates a staging file, then renames it to the target. If interrupted, target remains untouched.
- GitHub API timeout: a request exceeding 3 seconds returns a domain timeout error.
- GitHub API error mapping: 404 returns "release not found", 403 returns "rate limited", network failure returns "unreachable".
- TUI signal handling: `SIGINT` during a prompt cleans up any active staging directory.

**Success Criteria:**
- > 70% coverage of infrastructure adapters.
- All filesystem tests use isolated temporary paths.
- All network tests do not hit the real GitHub API.

### Phase 3: End-to-End (E2E) Tests

**Scope:** Compiled binary behavior in isolated environments.
**Location:** `tests/e2e/`
**Tool:** Bash scripts (`bash` or `zx`) that orchestrate the binary.
**Patterns:**
- Each test creates a fresh temporary directory as the "project".
- The binary is compiled once per suite (`bun build --compile`) and copied to the temp directory.
- Tests invoke the binary with environment variables to mock GitHub API responses (optional) or use `--skip-version-check` flag.
- Post-execution assertions verify directory contents, file existence, and absence of corruption.

**Scenarios:**
1. **Clean Install:** Run binary in empty directory. Assert all template files exist in destination.
2. **Project Install (Selective):** Pre-populate destination with a file that also exists in template/estandar. Assert the existing file is preserved, not overwritten.
3. **Project Install (Optional Skip):** Present optional files, simulate skipping one. Assert skipped file is absent, others are present.
4. **Update Workspace:** Pre-populate with older version. Run update mode. Assert only obligatorio and estandar files are updated; optional files untouched.
5. **Atomic Rollback:** Simulate a crash (kill -9) mid-operation. Assert destination directory is in its original state, staging directory is absent or cleaned.
6. **Path Traversal Rejection:** Attempt to install to a path outside the allowed base using `../` sequences. Assert exit code 1 and no files written outside boundary.

**Success Criteria:**
- All E2E scenarios pass in CI on Ubuntu runner.
- Exit codes validated for success (0) and failure (1).
- No test leaves artifacts in the repository workspace.

---

## Boundaries

### Always

These actions are always permitted and expected without explicit user confirmation:

- **Validate inputs immediately.** Every path, version string, and user selection is validated at the point of entry. Fail fast with actionable error messages.
- **Use atomic file operations.** All writes that affect the user's project must go through the staging directory + rename pattern. No direct overwrites of existing user files.
- **Log structured output in verbose mode.** When `--verbose` is passed, emit timestamped, structured log lines to stderr describing every operation, decision, and external call.
- **Respect the classification rules.** Obligatorio files are always copied. Estándar files are copied only if missing. Opcional files are copied only if the user explicitly selects them and the file is missing.
- **Check version in Update mode.** Before executing an update, query the GitHub API for the latest release, compare with the local version, and inform the user if they are already up to date.
- **Clean up on exit.** On normal completion or `SIGINT`, remove any staging directories created during the session.
- **Prevent path traversal.** Resolve all paths and verify the destination remains within the intended project directory before any write operation.

### Ask First

These actions require explicit user confirmation or interactive decision before proceeding:

- **Overwriting existing files in Clean Install mode.** If the destination directory is not empty, warn the user and require confirmation before deleting or overwriting anything.
- **Copying Optional files in Project Install mode.** Present a checkbox list of all optional files. Only copy those the user selects. If the user deselects all, copy none.
- **Proceeding when GitHub API is unreachable.** If the version check fails due to network issues, ask whether to continue with the local template or abort.
- **Installing into a directory that does not look like a project.** If the destination lacks expected markers (e.g., no `.git` directory, no `package.json`), ask for confirmation that the user selected the correct path.

### Never

These actions are explicitly prohibited under all circumstances:

- **Never execute arbitrary code from the template.** Do not run shell scripts, eval JavaScript, or execute binaries embedded in the template directory. The installer is a file copier, not a script runner.
- **Never hardcode absolute paths.** All paths must be constructed with `path.join()` or `path.resolve()`. No `/home/user/...` or `C:\Users\...` literals in source code.
- **Never ignore errors silently.** Every caught exception or error result must be logged, mapped to a user-facing message, and propagated up the call stack until handled.
- **Never use `any` in TypeScript.** All variables, parameters, and return values must have explicit types. Use `unknown` with guards when necessary.
- **Never log secrets or tokens.** If GitHub authentication tokens are supported in the future, they must never appear in logs, even in verbose mode.
- **Never modify files outside the designated destination directory.** The installer must not touch parent directories, sibling directories, or system paths.
- **Never depend on the order of unrelated module initialization.** Avoid temporal coupling. All dependencies must be explicitly injected.
- **Never duplicate logic.** Extract shared behavior into domain services or utility functions. Follow DRY.
- **Never write comments that state the obvious.** Comments must explain intent and rationale, not restate the code.

---

## Success Criteria

The following conditions are specific, testable, and must all be met for the v1.0.0 release to be considered complete.

### Functional Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| SC-1 | The interactive menu presents exactly three modes: Clean Install, Project Install, Update Workspace. | Manual inspection + E2E snapshot |
| SC-2 | Clean Install copies every file from `template/` to the destination, overwriting existing files of the same name. | E2E fixture comparison |
| SC-3 | Project Install copies Obligatorio files unconditionally, Estándar files only if absent, and Opcional files only if selected by user and absent. | Integration test with mock filesystem |
| SC-4 | Update Workspace copies only Obligatorio and Estándar files, skipping Opcional entirely, and performs a version check first. | E2E scenario with pre-seeded destination |
| SC-5 | The version check queries `https://api.github.com/repos/fisherk2/11-codice-opencode/releases/latest` and parses the tag name. | Integration test with mock HTTP server |
| SC-6 | If the local version equals the remote version, Update Workspace informs the user and exits without copying. | Unit test of VersionComparator + integration test |
| SC-7 | All file writes are atomic: staging directory created, files written to staging, then renamed to destination. | Integration test with forced interruption |
| SC-8 | An interrupted operation (Ctrl+C or kill) leaves the destination directory in its pre-operation state. | E2E test with `SIGINT` injection |

### Performance Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| SC-9 | Complete local installation (Clean Install) completes in < 5 seconds on a modern SSD. | E2E timing measurement |
| SC-10 | GitHub API version query completes in < 3 seconds or times out gracefully. | Integration test with delay injection |
| SC-11 | TUI menu renders and responds to input in < 100 milliseconds. | Manual / E2E perceived latency |

### Quality Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| SC-12 | Unit test coverage exceeds 90% for domain layer. | `bun test --coverage` report |
| SC-13 | Overall test coverage exceeds 80%. | `bun test --coverage` report |
| SC-14 | All E2E tests pass in CI on Ubuntu latest runner. | GitHub Actions workflow execution |
| SC-15 | Compiled binaries are produced for Linux, macOS, and Windows x64. | GitHub Actions release artifact verification |
| SC-16 | The README contains copy-paste installation commands that a non-technical user can execute without modification. | Peer review by non-technical stakeholder |
| SC-17 | No `any` types exist in the production source code. | `tsc --noEmit` strict check |
| SC-18 | Path traversal attempts (e.g., destination containing `../../`) are rejected with exit code 1. | E2E security test |

### Documentation Criteria

| ID | Criterion | Test Method |
|----|-----------|-------------|
| SC-19 | README includes installation instructions, usage examples for all three modes, and troubleshooting section. | Peer review |
| SC-20 | CHANGELOG.md exists and follows Keep a Changelog format with Added, Changed, Fixed, and Security sections. | Manual inspection |
| SC-21 | CI/CD badge is visible in README and reflects the current build status of the `main` branch. | Visual inspection of rendered README |

---

## Modular Specs

The following specifications break down complex subsystems into focused documents. They are referenced here and maintained independently.

- **[File Classification Rules](specs/spec-file-rules.md)** — Detailed definition of the Obligatorio, Estándar, and Opcional categories. Includes the directory structure convention in `template/`, rule precedence, edge cases (nested directories, hidden files), and the algorithm for determining which rule applies to a given file path.

- **[CLI Commands and Modes](specs/spec-cli-commands.md)** — Exhaustive specification of the three installation modes. Includes flow diagrams for each mode, decision trees for user prompts, error handling paths, and the exact TUI text and options presented at each step.

---

## Resolved Decisions

The following architectural decisions have been resolved and are now part of the specification:

| # | Decision | Resolution | Rationale |
|---|----------|------------|-----------|
| 1 | **Template Packaging Format** | Embed template files into the binary at compile time via `Bun.file()` on a bundled directory. | Guarantees portability and eliminates "missing template" errors. Binary size increase is acceptable for a workspace installer. |
| 2 | **Optional File Grouping** | Present optional files grouped by category (e.g., "Config", "Scripts", "Docs") in the TUI when count exceeds 10. | Improves UX for non-technical users. Requires `IUserPrompt` to support grouped multiselect. |
| 3 | **GitHub Authentication** | Rely solely on unauthenticated requests (60 req/hr). Do not support `GITHUB_TOKEN`. | Simpler for end users. If rate limit is hit, display a clear message and fall back to the embedded local template. |
| 4 | **Windows Path Handling** | Normalize all paths internally to forward slashes (`/`). The filesystem adapter handles OS-specific translation at the boundary. | Simplifies Path Traversal prevention logic and cross-platform consistency. |
| 5 | **Local Version Storage** | Persist the installed version in a `.codice-version` file in the project root. | Simplest implementation. The file is small, human-readable, and easy to parse. |
| 6 | **Rollback on Partial Failure** | If a multi-file operation fails mid-way, automatically roll back all already-copied files from the current staging batch. | Guarantees project consistency. Combined with per-file atomic staging, this provides transaction-like safety. |
| 7 | **Update Notification in Other Modes** | Version checking is **exclusive** to Update Workspace mode. Clean Install and Project Install do not check for newer versions. | Reduces noise and API calls. Users in install mode are assumed to want the bundled version. |
| 8 | **Primary Distribution Method** | Publish to npm as `@fisherk2/codice`. Use `bunx @fisherk2/codice` as the official installation method. Provide pre-compiled binaries as offline fallback. | Broadens accessibility beyond Bun users. Eliminates installation friction for npm-native workflows. |

---

## References

- **AGENTS.md** — Architectural decisions, SOLID principles, security prohibitions, and development conventions.
- **docs/WORKFLOW.md** — Implementation phases, task breakdown, and formal technical review gates.
- **docs/PRD.md** — Product Requirements Document (if exists).
- **docs/TRD.md** — Technical Requirements Document (if exists).
- **Reference Repository:** `https://github.com/weisser-dev/awesome-opencode` — Similar installation system for UX and flow inspiration.

---

*End of Spec*
