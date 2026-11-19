# Spec: Project Structure

## Project Structure

The directory layout follows Clean Architecture with strict layer boundaries. Dependencies always point inward: Infrastructure → Application → Domain. No domain file may import from application or infrastructure.

```
codice-opencode/
├── src/
│   ├── domain/                    # Pure business logic, zero external dependencies
│   │   ├── entities/
│   │   │   ├── FileRule.ts        # Classification rule entity (Obligatorio/Estándar/Opcional)
│   │   │   ├── FileRuleManifest.ts # Manifest aggregation and rule lookup
│   │   │   ├── FileRuleManifestData.ts # Static manifest data (file classification rules)
│   │   │   └── WorkspaceVersion.ts # Semantic version value object
│   │   ├── ports/
│   │   │   ├── IFileMergeEngine.ts # Abstract merge engine interface
│   │   │   ├── IFileSystem.ts     # Abstract filesystem operations (read, write, exists)
│   │   │   ├── IStagedFileSystem.ts # Staged-filesystem contract (IFileSystem ∩ staging) consumed by merge/install
│   │   │   ├── IStagingSystem.ts  # Abstract staging operations (stage, commit, rollback)
│   │   │   └── IVersionComparator.ts # Abstract version comparison interface
│   │   ├── services/
│   │   │   ├── FileMergeEngine.ts # Strategy-based merge orchestrator
│   │   │   ├── mergeRules.ts      # Rule strategy implementations per category
│   │   │   ├── stagePlanner.ts    # Pre-merge staging decision computation
│   │   │   ├── stripControlChars.ts # Strip ANSI/control chars before echoing to the terminal (escape-injection guard)
│   │   │   ├── treeDiff.ts        # Tree-level diff for standard directory updates
│   │   │   └── VersionComparator.ts # Semantic version comparison logic
│   │   └── types/
│   │       ├── errorTypeGuards.ts # Type guards for domain error discrimination
│   │       ├── GitignoreError.ts  # Gitignore generation error types
│   │       ├── MergeError.ts      # File merge error types
│   │       ├── ProgressEvent.ts   # Discriminated union for progress bar events
│   │       ├── Result.ts          # Result/Either type for explicit error handling
│   │       ├── SymlinkError.ts    # Symlink creation error types
│   │       └── version.ts         # Version constants and utilities
│   ├── application/               # Use cases, orchestrates domain via ports
│   │   ├── confirmOverwrite.ts    # Overwrite confirmation prompt (Clean/Project; update via updateHelpers)
│   │   ├── installSummary.ts      # Install summary screen computation (pure, no I/O)
│   │   ├── legacyBanner.ts        # Opencode Legacy upgrade banner (advisory, fail-open)
│   │   ├── mergeErrors.ts         # MergeError → Error wrapping for use-case result contracts
│   │   ├── optionalsPrompt.ts     # Optional-file checklist prompt shared by Clean and Project install
│   │   ├── packOptions.ts         # Pack selection option definitions
│   │   ├── packPromptOptions.ts   # Pack multiselect prompt options ([INSTALLED, LOCKED] labels)
│   │   ├── postInstall.ts         # Post-installation orchestration (gitignore, symlinks, version file)
│   │   ├── progressCallback.ts    # Progress-event wiring from merge engine to TUI
│   │   ├── versionData.ts         # Pure .codice-version parser shared by update flow and version-file write
│   │   ├── versionFileWrite.ts    # Atomic .codice-version write with staging rollback on failure
│   │   ├── versionGateMessages.ts # Single source for update-gating warning copy
│   │   ├── versionInfoMessages.ts # Version info display messages (pre-menu note + legacy banner)
│   │   ├── writableCheck.ts       # Destination writability probe shared by all three modes
│   │   ├── ports/
│   │   │   ├── IGitHubClient.ts   # Abstract GitHub API client (releases/latest)
│   │   │   ├── IGitignoreCreator.ts # Abstract post-installation gitignore generation
│   │   │   ├── IMessageDisplay.ts # Abstract user notices/errors (segregated prompt port)
│   │   │   ├── IProgressReporter.ts # Abstract spinner/progress reporting (segregated prompt port)
│   │   │   ├── ISymlinkCreator.ts # Abstract post-installation symlink generation
│   │   │   └── IUserPrompt.ts     # Abstract TUI interactions (select, confirm, checkbox)
│   │   ├── types/
│   │   │   └── displayContracts.ts # Pure data contracts shared by the segregated prompt ports
│   │   └── use-cases/
│   │       ├── CleanInstallUseCase.ts      # Mode 1: Overwrite everything
│   │       ├── InstallUseCaseBase.ts       # Template Method base class for install use cases
│   │       ├── ProjectInstallUseCase.ts    # Mode 2: Selective merge with prompts
│   │       ├── UpdateWorkspaceUseCase.ts   # Mode 3: Standard + Obligatorio with version check
│   │       ├── updateFlow.ts              # Update merge execution logic (extracted)
│   │       ├── updateHelpers.ts           # Update confirmation + SDD-remnant warning
│   │       ├── updateOptions.ts           # Data-only contracts for the update flow (avoids module cycles)
│   │       └── updateStatusCheck.ts       # Update version status check (extracted)
│   ├── infrastructure/            # Concrete adapters for external concerns
│   │   ├── adapters/
│   │   │   ├── AtomicStager.ts    # Atomic staging, commit, and rollback operations
│   │   │   ├── BunFileSystem.ts   # Facade implementing IFileSystem, composes TemplateResolver + AtomicStager
│   │   │   ├── BunGitignoreCreator.ts # Post-installation gitignore generation
│   │   │   ├── BunSymlinkCreator.ts # Post-installation symlink generation
│   │   │   ├── ClackPromptsAdapter.ts # @clack/prompts wrapper implementing IUserPrompt
│   │   │   ├── directoryWalker.ts # Recursive directory traversal with symlink skipping
│   │   │   ├── GitHubRestClient.ts # Fetch-based GitHub API client with timeout
│   │   │   ├── pathResolver.ts    # Path resolution and traversal prevention
│   │   │   ├── TemplateResolver.ts # Template path resolution with category search
│   │   │   └── VerboseLogger.ts   # Structured verbose logging adapter
│   │   └── config/
│   │       ├── constants.ts       # Repository URL, API endpoints, timeout values
│   │       └── symlinks.ts        # Symlink definitions and configuration
│   └── cli/
│       ├── bin.js                 # Node/Bun entry shim
│       ├── container.ts           # Dependency injection container
│       ├── main.ts                # Entry point: orchestrates mode selection and execution
│       ├── output.ts              # TUI output formatting and logging
│       ├── parse-args.ts          # CLI argument parsing (--clean, --project, --update, --dest, --force, --verbose, --packs, --packs-all, --update-add-packs, --version/-V, --help/-h)
│       ├── signalHandlers.ts      # SIGINT cleanup handlers (extracted from main.ts)
│       ├── validateDestPath.ts    # Destination path validation (extracted from parse-args.ts)
│       ├── validatePackList.ts    # Pack list validation for --packs flag
│       ├── version.ts             # Package version constant
│       └── versionContext.ts      # Version context classification for update gating
├── tests/
│   ├── unit/                      # Domain logic tests (pure functions, entities)
│   │   ├── quality/               # Repo-wide invariant guards (e.g. source hygiene)
│   │   └── domain/helpers/        # Test-side domain helpers (agentFrontmatterValidator — normative V2 agent schema reader; see ADR-021)
│   ├── setup/                     # Repository configuration validation (own Justfile/CI/tooling), not unit tests of src/
│   ├── integration/               # Adapter tests with mocked external systems
│   ├── e2e/                       # Shell scripts and fixtures for CLI validation (31 scenarios)
│   ├── shared/                    # Test utilities reused across suites
│   └── fixtures/                  # Predefined directory trees for merge scenarios
├── template/                      # The actual OpenCode workspace template files
│   ├── obligatorio/               # Files always copied/overwritten
│   │   ├── core/                  # Workspace infrastructure (opencode.json, commands/, skills/, .opencode/)
│   │   └── packs/                 # Agent packs (main, writers, +8 selectable packs)
│   ├── estandar/                  # Files copied only if missing in destination
│   └── opcional/                  # Files presented as checklist; copied only if selected and missing
├── docs/                          # Architecture, workflow, PRD, TRD, MIGRATION — and the ADR register (`docs/adr/`, ADR-001..025 with 013/017 retired; never under `specs/`)
├── specs/                         # Modular specification documents (14 `spec-*.md` files)
├── Justfile                       # Task definitions
├── scripts/                       # One-shot repo tooling; imports only node/* + own siblings; never imported by src/; may be retired without deprecation (ADR-021)
├── package.json                   # Bun dependencies and scripts
├── tsconfig.json                  # Strict TypeScript configuration
├── biome.json                     # Linting and formatting rules
├── CODE_OF_CONDUCT.md             # Contributor Covenant v2.1
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
   - Defines contracts (`IGitHubClient`, `IGitignoreCreator`, `IMessageDisplay`, `IProgressReporter`, `ISymlinkCreator`, `IUserPrompt`) that infrastructure must implement.
   - `postInstall.ts` orchestrates post-installation steps (gitignore generation, symlink creation, version file write) shared across Clean and Project install modes.
   - Orchestrates domain services but contains no business rules.

3. **Infrastructure Layer** (`src/infrastructure/`)
   - Contains concrete adapters.
   - Depends on `application/ports`.
   - Houses all side effects: disk I/O, network requests, user prompts, symlink generation, gitignore generation.
   - `BunFileSystem` must implement atomic writes via staging directory + `fs.rename`.
   - `BunSymlinkCreator` generates symlinks post-installation (npm strips symlinks from tarballs).
   - `BunGitignoreCreator` generates `.gitignore` post-installation (npm excludes `.gitignore` from tarballs).

4. **CLI Layer** (`src/cli/`)
   - Single entry point `main.ts`.
   - Wires all adapters and injects them into use cases.
   - Handles process signals (`SIGINT`) to clean up staging directories.
   - Parses command-line arguments and selects execution mode.
