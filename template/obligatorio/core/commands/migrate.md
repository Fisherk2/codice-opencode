---
description: Generate a complete technology stack migration plan.
agent: quetzalcoatl
---

## Pre-Flight: Detect Stack

**Delegate** `codebase-onboarding-engineer` subagent to understand the project's structure:

1. Identify project root (where `package.json`, `requirements.txt`, `Gemfile`, `go.mod`, `Cargo.toml`, or similar lives).
2. Read lock files (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Cargo.lock`, etc.) to detect current versions.
3. Read config files (`tsconfig.json`, `vite.config.ts`, `next.config.js`, `webpack.config.js`, etc.).

## Phase 0: Refine Migration Scope

Use the `question` tool to clarify interactively:
   - **A) Framework** (e.g., Next.js 14 → 15, React 18 → 19)
   - **B) Language** (e.g., JavaScript → TypeScript, Python 2 → 3)
   - **C) Database** (e.g., PostgreSQL 14 → 16, MongoDB 5 → 6)
   - **D) Architecture** (e.g., monolith → microservices, REST → GraphQL)
   - **E) Other** (specify)

If the user's request is vague or missing key details about the migration, **Load** the `interview-me` skill to extract intent before proceeding.

If the user has a rough idea but needs to explore alternatives or variations, **Load** `idea-refine` skill to generate and evaluate options.

**Always use the `question` tool to let the user confirm what they want to migrate and why — never decide automatically, even if the migration proposal or user histories seem clear or trivial.** The user must answer doubts, suggestions, and ambiguities before proceeding.

## Phase 1: Impact Analysis

For the selected migration target, perform the following analysis in parallel:

### Breaking Changes
**Delegate** `error-coordinator` subagent to identify:
- Major version bumps in dependencies
- API deprecations and removals
- Configuration format changes
- Runtime requirements (Node version, OS support)

### Dependency Analysis
**Delegate** `dependency-manager` subagent:
- **Load** @skills/dependency-audit/SKILL.md to identify affected dependencies
- Check for transitive dependency conflicts
- Identify unmaintained packages

### Code Surface
**Delegate** `legacy-modernizer` subagent to check:
- Files affected (search for deprecated API usages)
- Tests covering the affected code
- Documentation references

**Load** `interview-me` skill to use `question` tool to ask the user for clarification if multiple migration paths exist.

## Phase 2: Generate Migration Plan

1. **Load** @skills/deprecation-and-migration/SKILL.md (and/or `db-migration` skill), then create @docs/MIGRATION.md (or update if exists) with:

- Overview (date, scope, estimated effort, risk level)
- Pre-migration checklist
- Step-by-step migration procedure in phases
- Rollback instructions
- Expected impact analysis results
- Timeline with milestones
- Resources (documentation, tools, contacts)

**Delegate** appropriate subagents to generate content for each section.

2. If migration changes architecture or process:

- `docs/WORKFLOW.md` — Update workflow phases if process changes
- `docs/SPEC.md` — Update spec if requirements change
- `docs/ARCHITECTURE.md` — Update architecture diagram if structure changes
- `specs/` — Update affected modular specs
- `README.md` — Update installation/usage instructions if user-facing
- `docs/` in general — Update any other affected documentation

3. **Migrate plan done — do NOT touch or implement code files.**
4. Use the `question` tool to confirm with the user before proceeding.
5. Commit atomic changes with a descriptive message following @skills/git-workflow-and-versioning/SKILL.md conventions.

## Suggested Next Step

> Migration plan generated. Run `/plan` to create an implementation plan for the migration.
