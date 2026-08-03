# AGENTS.md — [Project Name]

> Rules for AI coding assistants.
> Read this file before making any changes to the project.

## Project Context

<!-- What does this project do? What is its purpose? -->
<!-- What tech stack does it use? -->
<!-- What is the primary language and framework? -->

[Describe the project's purpose and scope here]

## Architecture Rules

<!-- Layer boundaries, dependency rules, module organization -->
<!-- Example: "Dependencies point inward: infrastructure → application → domain" -->
<!-- What are the main modules or layers? -->
<!-- How should imports be organized? -->

- [Rule 1 — describe the rule and its rationale]
- [Rule 2 — describe the rule and its rationale]
- [Rule 3]

## Code Style Rules

<!-- Naming conventions, formatting standards, patterns to follow -->
<!-- Reference docs/CODE_STYLE.md for details, but summarize key rules here -->
<!-- What naming conventions are used? (camelCase, PascalCase, etc.) -->
<!-- What formatting rules must be followed? -->

- [Rule 1]
- [Rule 2]
- [Rule 3]

## Security Rules

<!-- Prohibited actions, never-do list, sensitive data handling -->
<!-- Be specific: "Never hardcode API keys", "Never log passwords" -->
<!-- What must never be committed? -->
<!-- What environment variables are sensitive? -->

- [Rule 1]
- [Rule 2]
- [Rule 3]

## Pre-Commit Checklist

<!-- Quality gates that must pass before committing -->
<!-- Example: tests pass, linter clean, types valid -->
<!-- What commands should be run before committing? -->
<!-- What is the minimum coverage threshold? -->

- [ ] [Quality gate 1 — e.g., "All tests pass"]
- [ ] [Quality gate 2 — e.g., "Linter shows no errors"]
- [ ] [Quality gate 3 — e.g., "TypeScript compiles without errors"]

## Documentation Index

<!-- Link to all project documentation for quick reference -->
<!-- Keep this list updated as docs are added or removed -->

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture overview and ADR index |
| [CODE_STYLE.md](docs/CODE_STYLE.md) | Coding conventions |
| [SPEC.md](SPEC.md) | Technical specifications index |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guidelines |
| [WORKFLOW.md](docs/WORKFLOW.md) | Implementation workflow |

## Delegation Patterns

<!-- How should AI agents invoke subagents? -->
<!-- Sequential only? Parallel allowed? When to delegate vs act directly? -->
<!-- What tasks should be delegated vs handled inline? -->
<!-- Are there specific agents with specialized roles? -->

- [Pattern 1 — describe when and how to delegate]
- [Pattern 2 — describe when and how to delegate]
