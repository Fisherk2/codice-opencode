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
│   │   │   ├── IStagingSystem.ts  # Abstract staging operations (stage, commit, rollback)
│   │   │   └── IVersionComparator.ts # Abstract version comparison interface
│   │   ├── services/
│   │   │   ├── FileMergeEngine.ts # Strategy-based merge orchestrator
│   │   │   ├── mergeRules.ts      # Rule strategy implementations per category
│   │   │   ├── stagePlanner.ts    # Pre-merge staging decision computation
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
│   │   ├── helpers.ts             # Shared use-case utilities
│   │   ├── installSummary.ts      # Install summary screen computation
│   │   ├── packOptions.ts         # Pack selection option definitions
│   │   ├── postInstall.ts         # Post-installation orchestration (gitignore, symlinks, version file)
│   │   ├── use-cases/
│   │   │   ├── CleanInstallUseCase.ts      # Mode 1: Overwrite everything
│   │   │   ├── InstallUseCaseBase.ts       # Template Method base class for install use cases
│   │   │   ├── ProjectInstallUseCase.ts    # Mode 2: Selective merge with prompts
│   │   │   ├── updateFlow.ts              # Update merge execution logic (extracted)
│   │   │   ├── updateStatusCheck.ts       # Update version status check (extracted)
│   │   │   └── UpdateWorkspaceUseCase.ts   # Mode 3: Standard + Obligatorio with version check
│   │   └── ports/
│   │       ├── IGitHubClient.ts   # Abstract GitHub API client (releases/latest)
│   │       ├── IGitignoreCreator.ts # Abstract post-installation gitignore generation
│   │       ├── ISymlinkCreator.ts # Abstract post-installation symlink generation
│   │       └── IUserPrompt.ts     # Abstract TUI interactions (select, confirm, checkbox)
│   ├── infrastructure/            # Concrete adapters for external concerns
│   │   ├── adapters/
│   │   │   ├── AtomicStager.ts    # Atomic staging, commit, and rollback operations
│   │   │   ├── BunFileSystem.ts   # Facade implementing IFileSystem, composes TemplateResolver + AtomicStager
│   │   │   ├── BunGitignoreCreator.ts # Post-installation gitignore generation
│   │   │   ├── BunSymlinkCreator.ts # Post-installation symlink generation
│   │   │   ├── ClackPromptsAdapter.ts # @clack/prompts wrapper implementing IUserPrompt
│   │   │   ├── directoryWalker.ts # Recursive directory traversal with symlink skipping
│   │   │   ├── GitHubRestClient.ts # Fetch-based GitHub API client with timeout
│   │   │   ├── packPromptOptions.ts # Pack selection prompt option definitions
│   │   │   ├── pathResolver.ts    # Path resolution and traversal prevention
│   │   │   ├── TemplateResolver.ts # Template path resolution with category search
│   │   │   ├── VerboseLogger.ts   # Structured verbose logging adapter
│   │   │   └── versionInfoMessages.ts # Version info display messages
│   │   └── config/
│   │       ├── constants.ts       # Repository URL, API endpoints, timeout values
│   │       └── symlinks.ts        # Symlink definitions and configuration
│   └── cli/
│       ├── bin.js                 # Node/Bun entry shim
│       ├── container.ts           # Dependency injection container
│       ├── main.ts                # Entry point: orchestrates mode selection and execution
│       ├── output.ts              # TUI output formatting and logging
│       ├── parse-args.ts          # CLI argument parsing (--dest, --force, --mode, etc.)
│       ├── signalHandlers.ts      # SIGINT cleanup handlers (extracted from main.ts)
│       ├── validateDestPath.ts    # Destination path validation (extracted from parse-args.ts)
│       ├── validatePackList.ts    # Pack list validation for --packs flag
│       ├── version.ts             # Package version constant
│       └── versionContext.ts      # Version context classification for update gating
├── tests/
│   ├── unit/                      # Domain logic tests (pure functions, entities)
│   ├── integration/               # Adapter tests with mocked external systems
│   ├── e2e/                       # Shell scripts and fixtures for CLI validation (31 scenarios)
│   └── fixtures/                  # Predefined directory trees for merge scenarios
├── template/                      # The actual OpenCode workspace template files
│   ├── obligatorio/               # Files always copied/overwritten
│   │   ├── core/                  # Workspace infrastructure (opencode.json, commands/, skills/, .opencode/)
│   │   └── packs/                 # Agent packs (main, writers, +8 selectable packs)
│   ├── estandar/                  # Files copied only if missing in destination
│   └── opcional/                  # Files presented as checklist; copied only if selected and missing
├── docs/                          # Architecture decisions, workflow, PRD, TRD, MIGRATION
├── specs/                         # Modular specification documents
│   ├── adr/                       # Architecture Decision Records (ADR-001 to ADR-015)
│   ├── spec-agent-format-v2.md    # Agent format specification v2
│   ├── spec-agent-packs.md        # Agent pack system specification
│   ├── spec-cli-commands.md       # CLI commands and modes specification
│   ├── spec-file-rules.md         # File classification rules
│   ├── spec-installer-ux-v2.md    # Installer UX v2 specification
│   ├── spec-sdd-plugin-decoupling.md # SDD plugin decoupling specification
│   └── spec-template.md           # Template specification
├── Justfile                       # Task definitions
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
   - Defines contracts (`IGitHubClient`, `IGitignoreCreator`, `ISymlinkCreator`, `IUserPrompt`) that infrastructure must implement.
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
