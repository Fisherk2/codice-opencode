# Architecture – Códice: Opencode Workspace Installer

## Overview
Códice follows Clean Architecture with strict layer boundaries. Dependencies point inward: Infrastructure → Application → Domain.

## Architecture Decision Records (ADRs)

| ADR | Title | Status | Key Decision |
|-----|-------|--------|--------------|
| [ADR-001](../specs/adr/adr-001-clean-architecture.md) | Clean Architecture | Accepted | 4-layer structure with dependency rule |
| [ADR-002](../specs/adr/adr-002-bun-compilation.md) | Bun as Runtime/Compiler | Accepted | Bun as runtime and compiler |
| [ADR-003](../specs/adr/adr-003-atomic-staging.md) | Atomic File Operations | Accepted | Staging + rename pattern |
| [ADR-004](../specs/adr/adr-004-clack-prompts.md) | TUI with @clack/prompts | Accepted | Lightweight interactive prompts |
| [ADR-005](../specs/adr/adr-005-dest-flag-and-workspace.md) | `--dest` Flag and Workspace Directory | Accepted | Safe dev playground via `--dest` + `tests/fixtures/workspace/` |
| [ADR-006](../specs/adr/adr-006-npm-publication.md) | npm Publication as Primary Distribution | Accepted | `bunx @fisherk2-dev/codice` as primary distribution method |
| [ADR-007](../specs/adr/adr-007-template-resolver-source-mode.md) | Template Resolution for bunx/npm Mode | Accepted | Three-path detection cascade (source, bunx/npm, cwd) |
| [ADR-008](../specs/adr/adr-008-symlink-post-install.md) | Post-Installation Symlink Generation | Accepted | ISymlinkCreator port + BunSymlinkCreator adapter for npm-compatible symlinks |
| [ADR-009](../specs/adr/adr-009-gitignore-post-install.md) | Post-Installation Gitignore Generation | Accepted | IGitignoreCreator port + BunGitignoreCreator adapter for npm-compatible gitignore generation |
| [ADR-010](../specs/adr/adr-010-no-template-copy-flag.md) | noTemplateCopy Flag for Virtual Manifest Entries | Accepted | `noTemplateCopy?` field on FileRule for entries whose content is generated post-installation (e.g., `.devin/` symlinks) |
| [ADR-011](../specs/adr/adr-011-binary-removal.md) | Binary Removal | Accepted | npm/bunx as sole distribution; binary compilation removed |
| [ADR-012](../specs/adr/adr-012-references-co-location.md) | References Co-location | Accepted | References co-located with skills, exposed via `reference` section |
| [ADR-013](../specs/adr/adr-013-plugin-auto-discovery.md) | SDD Plugin Auto-Discovery & Configuration | Accepted | Three-pillar approach: filesystem auto-discovery + JSON config + quality infra |
| [ADR-014](../specs/adr/adr-014-agent-pack-system.md) | Agent Pack System | Accepted | Pack-based agent classification with 8 selectable packs + 2 mandatory |
| [ADR-015](../specs/adr/adr-015-installer-ux-v2.md) | Installer UX v2 | Accepted | Metadata-driven installer with pack selection and version-gated updates |
| [ADR-016](../specs/adr/adr-016-new-commands.md) | Slash Commands v2.1 | Accepted | 4 new commands (`/sync`, `/migrate`, `/deploy`, `/analyze`) with skill delegation |
| [ADR-017](../specs/adr/adr-017-sdd-intent-auto-discovery.md) | SDD Intent Auto-Discovery | Accepted | Filesystem-based command keyword detection + bilingual EN/ES support |
| [ADR-018](../specs/adr/adr-018-agent-delegation.md) | Agent Delegation Protocol | Accepted | Analyze → Plan → Execute protocol for primary agents via `task()` |
| [ADR-019](../specs/adr/adr-019-cicd-hardening.md) | CI/CD Hardening | Accepted | SHA-pinned actions, branch protection, PR/issue templates, npm provenance |
| [ADR-020](../specs/adr/adr-020-spec-modularization.md) | SPEC Modularization | Accepted | 441-line SPEC.md → 44-line index + 8 sub-specs |

> **Note:** `TemplateResolver` and `AtomicStager` are extracted classes (not full ADRs). They are SRP-based refactorings of `BunFileSystem` that follow the existing ADR-003 (atomic staging) pattern.

### SPEC.md Resolved Decisions Coverage

All nine resolved decisions from [SPEC.md](../SPEC.md) are covered by the ADRs above or by their implementation:

| # | Decision | Covered By | Status |
|---|----------|------------|--------|
| 1 | Template Packaging Format | ADR-011 (Binary removal — template bundled with npm package) | Documented |
| 2 | Optional File Grouping in TUI | ADR-004 (Clack prompts, IUserPrompt supports grouped multiselect) | Documented |
| 3 | GitHub Authentication (unauthenticated only) | ADR-002 (cross-platform via Bun, no runtime deps needed) | Documented |
| 4 | Windows Path Handling (normalize to `/`) | ADR-002 (cross-platform via Bun) | Documented |
| 5 | Local Version Storage (`.codice-version` file) | ADR-005 (dest flag affects version file location) | Documented |
| 6 | Rollback on Partial Failure | ADR-003 (atomic staging + backup/rollback) | Documented |
| 7 | Update Notification in Other Modes (exclusive to Update) | Implemented per SPEC.md; version check only runs in UpdateWorkspaceUseCase | Implemented |

## Layer Diagram

```mermaid
graph TD
    subgraph "Infrastructure Layer"
        FS[BunFileSystem]
        TR[TemplateResolver]
        AS[AtomicStager]
        GH[GitHubRestClient]
        TUI[ClackPromptsAdapter]
        BSC[BunSymlinkCreator]
        BGC[BunGitignoreCreator]
        VL[VerboseLogger]
        PPO[packPromptOptions]
        VIM[versionInfoMessages]
        DW[directoryWalker]
        PR[pathResolver]

        FS -->|delegates| TR
        FS -->|delegates| AS
    end

    subgraph "Application Layer"
        UC1[CleanInstallUseCase]
        UC2[ProjectInstallUseCase]
        UC3[UpdateWorkspaceUseCase]
        IUCB[InstallUseCaseBase]
        ISP[ISymlinkCreator]
        IGC[IGitignoreCreator]
        IST[IStagingSystem]
        HLP[helpers.ts]
        PI[postInstall.ts]
        ISUM[installSummary.ts]
        PO[packOptions.ts]
        UF[updateFlow.ts]
        USC[updateStatusCheck.ts]

        UC1 -->|extends| IUCB
        UC2 -->|extends| IUCB
    end

    subgraph "Domain Layer"
        ENT1[FileRule Entity]
        ENT2[WorkspaceVersion Entity]
        ENT3[FileRuleManifest]
        ENT4[FileRuleManifestData]
        SRV1[FileMergeEngine Service]
        SRV2[VersionComparator Service]
        SRV3[mergeRules]
        SRV4[stagePlanner]
        SRV5[treeDiff]
        ERR[SymlinkError]
        ERR2[GitignoreError]
        ERR3[MergeError]
        PE[ProgressEvent]
    end

    TUI -->|User Input| UC1
    TUI -->|User Input| UC2
    TUI -->|User Input| UC3
    
    UC1 -->|Execute| SRV1
    UC2 -->|Execute| SRV1
    UC3 -->|Check Version| USC
    UC3 -->|Execute| UF
    UF -->|Execute| SRV1
    
    UC1 -->|Post-install| ISP
    UC1 -->|Post-install| IGC
    UC2 -->|Post-install| ISP
    UC2 -->|Post-install| IGC
    
    SRV1 -->|Read/Write| FS
    SRV2 -->|HTTP GET| GH
    ISP -.->|implements| BSC
    IGC -.->|implements| BGC
```

## Layer Responsibilities

### Domain Layer (`src/domain/`)
- Pure business logic, zero external dependencies
- Entities: FileRule, FileRuleManifest, FileRuleManifestData, WorkspaceVersion
- Services: FileMergeEngine, VersionComparator, mergeRules, stagePlanner, treeDiff
- Types: SymlinkError, GitignoreError, MergeError, ProgressEvent, errorTypeGuards
- Error handling via Result<T, Error>

### Application Layer (`src/application/`)
- Use cases orchestrate domain services
- Port interfaces: IFileSystem, IStagingSystem, IGitHubClient, IUserPrompt, ISymlinkCreator, IGitignoreCreator
- Shared helpers: helpers.ts (shared guard logic), postInstall.ts (post-installation orchestration)
- Install summary: installSummary.ts (pre-merge summary computation), packOptions.ts (pack selection definitions)
- Update flow: updateFlow.ts (merge execution), updateStatusCheck.ts (version classification)
- Template Method: InstallUseCaseBase (shared skeleton for Clean/Project install)
- No business rules, only coordination

### Infrastructure Layer (`src/infrastructure/`)
- Concrete adapters for external systems
- BunFileSystem: Facade implementing IFileSystem, composes TemplateResolver + AtomicStager
- TemplateResolver: Template path resolution with category search and cache (extracted from BunFileSystem v1)
- AtomicStager: Atomic staging, commit, and rollback operations (extracted from BunFileSystem v1)
- GitHubRestClient: Version checking via GitHub API
- ClackPromptsAdapter: TUI interactions via @clack/prompts
- BunSymlinkCreator: Post-installation symlink generation implementing ISymlinkCreator
- BunGitignoreCreator: Post-installation gitignore generation implementing IGitignoreCreator
- VerboseLogger: Structured verbose logging adapter
- packPromptOptions: Pack selection prompt option definitions
- versionInfoMessages: Version info display messages
- directoryWalker: Recursive directory traversal with symlink skipping
- pathResolver: Path resolution and traversal prevention

### CLI Layer (`src/cli/`)
- Entry point: main.ts
- Dependency wiring: container.ts
- Signal handling: signalHandlers.ts (SIGINT cleanup)
- Argument parsing: parse-args.ts
- Path validation: validateDestPath.ts
- Pack validation: validatePackList.ts
- Version context: versionContext.ts (update gating classification)
- Output formatting: output.ts
- Version constant: version.ts

### v2.1 Components

| Component | Layer | Responsibility | Key Interfaces |
|-----------|-------|----------------|----------------|
| `/sync` command | CLI + Skill | Bidirectional git sync with 4 modes and 4 conflict strategies | `git-workflow-and-versioning` skill |
| `/migrate` command | CLI + Skill | Tech stack migration analysis with phases and rollback | `dependency-audit`, `deprecation-and-migration` skills |
| `/deploy` command | CLI + Skill | Post-`/ship` deployment automation (3 modes) | `ci-cd-and-automation` skill |
| `/analyze` command | CLI + Skill | 8-dimension architecture analysis → `TECH_DEBT.md` | `clean-ddd-hexagonal`, `design-patterns` skills |
| Intent Auto-Discovery | Plugin (SDD) | Filesystem scan of `template/obligatorio/core/commands/*.md` for command keywords | `discoverIntents()` |
| Bilingual Intents | Plugin (SDD) | EN/ES keyword translation via static overlay map | `translateIntent(keyword, locale)` |
| Agent Delegation Protocol | Agent (6 primary) | Analyze → Plan → Execute before `task()` calls | `delegateToSubagent(task)` |

## Key Patterns
- **Strategy Pattern**: File merge rules (Obligatorio/Estándar/Opcional)
- **Dependency Inversion**: Domain depends on ports, not implementations
- **Result/Either**: Explicit error handling without exceptions
- **Command Pattern**: Each installation mode as independent command

## References
- [AGENTS.md](../AGENTS.md) — Project rules, conventions, and documentation index
- [SPEC.md](../SPEC.md) — Central specification
- [WORKFLOW.md](./WORKFLOW.md) — Implementation phases
- [TECH_DEBT.md](./TECH_DEBT.md) — Known technical debt and improvement priorities
