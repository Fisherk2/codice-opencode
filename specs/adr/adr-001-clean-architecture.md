# ADR-001: Clean Architecture with Layered Dependency Rules

## Status
Accepted

## Context
Códice is a CLI tool that needs to remain testable, maintainable, and portable. The business logic (file merging, version comparison) must not depend on Bun, GitHub API, or TUI frameworks.

## Decision
Adopt Clean Architecture (Robert C. Martin) with strict layer boundaries:
- Domain Layer: Pure business logic (FileRule, WorkspaceVersion, FileMergeEngine, VersionComparator)
- Application Layer: Use cases (CleanInstallUseCase, ProjectInstallUseCase, UpdateWorkspaceUseCase) + Port interfaces
- Infrastructure Layer: Concrete adapters (BunFileSystem, GitHubRestClient, ClackPromptsAdapter)
- CLI Layer: Entry point (main.ts) + dependency wiring

Dependency rule: Dependencies point inward only. Domain has zero external dependencies.

## Consequences
### Positive
- Domain logic is 100% testable without mocks for Bun/fs
- Easy to swap infrastructure (e.g., switch from Bun to Node.js fs)
- Clear separation of concerns

### Negative
- More boilerplate (interfaces, adapters)
- Steeper learning curve for new contributors
- More files to maintain

## Alternatives Considered
- **Transaction Script**: Rejected — business rules (file classification, version comparison) are complex enough to warrant domain model
- **MVC**: Rejected — conflates UI with business logic, harder to test

## References
- AGENTS.md §Architecture
- SPEC.md §Project Structure
