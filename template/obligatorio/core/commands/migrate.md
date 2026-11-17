---
description: Generate a complete technology stack migration plan.
agent: quetzalcoatl
---

## Pre-Flight: Detect Stack

**Delegate** `codebase-onboarding-engineer` subagent and **Load** `codebase-onboarding` skill to understand the project's structure and determine whether it is brownfield or greenfield:

1. Identify metadata/dependencies files (`package.json`, `requirements.txt`, `Gemfile`, `go.mod`, `Cargo.toml`, or similar lives).
2. Read lock files (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Cargo.lock`, etc.) to detect current versions.
3. Read config files (`tsconfig.json`, `vite.config.ts`, `next.config.js`, `webpack.config.js`, etc.).
4. Scan documentation files (`README.md`, `CONTRIBUTING.md`, `ARCHITECTURE.md`, etc.). to detect frameworks, libraries, tools, and project constraints and conventions.

Output a summary in a table of the current stack used in the project, including versions and frameworks.

## Phase 0: Refine Migration Scope

1. If the user's request is vague or missing key functional and non-functional requirements, **Load** the `interview-me` skill to extract intent before proceeding.

2. **Load** `idea-refine` alongside `brainstorming` skill to extract intent before proceeding, generate and evaluate options to explore alternatives or variations.

Use the `question` tool to clarify interactively what the user wants to migrate:
   - **A) Framework** (e.g., Next.js 14 → 15, React 18 → 19)
   - **B) Language** (e.g., JavaScript → TypeScript, Python 2 → 3)
   - **C) Database** (e.g., PostgreSQL 14 → 16, MongoDB 5 → 6)
   - **D) Architecture** (e.g., monolith → microservices, REST → GraphQL)
   - **E) Other** (specify)

**Always use the `question` tool to let the user confirm what they want to migrate and why — never decide automatically, even if the migration proposal or user histories seem clear or trivial.** The user must answer doubts, suggestions, and ambiguities before proceeding.

## Phase 1: Install the project skills this work needs

Once the scope is clear, find the skills that raise the quality of this work.

1. **Load** the `find-skills` skill and search by the user's purpose and stack (for example: "django migration", "framework migration", "ci-cd"). If `find-skills` is not installed, use the documented fallback: `npx skills use "https://github.com/vercel-labs/skills" --skill "find-skills"`.
2. Present the candidate skills in a table: **name** · what it covers · why it fits this task.
3. Use the `question` tool with three options: install all candidates, install only the most important ones, install none.
4. Install the chosen skills at project level — **NEVER global**. Project scope keeps the workspace reproducible and leaves the user's machine untouched.

Never invent a skill name: if the search returns nothing, say so and continue without skills.

## Phase 2: Impact Analysis

For the selected migration target, perform the following analysis in fan-out parallel:

### Breaking Changes
**Delegate** `error-coordinator` subagent:
- **Load** `error-handling-patterns` skill to identify error handling patterns
- Major version bumps in dependencies
- API deprecations and removals
- Configuration format changes
- Runtime requirements (Node version, OS support)

### Dependency Analysis
**Delegate** `dependency-manager` subagent:
- **Load** `dependency-audit` skill to identify affected dependencies
- Check for transitive dependency conflicts
- Identify unmaintained packages

### Code Surface
**Delegate** `legacy-modernizer` subagent to check:
- **Load** `framework-migration-legacy-modernize` skill to identify affected code
- Files affected (search for deprecated API usages)
- Tests covering the affected code
- Documentation references

**Load** `interview-me` skill to use `question` tool to ask the user for clarification if multiple migration paths exist.

## Phase 3: Generate Migration Plan

1. **Load** `deprecation-and-migration` skill (and/or other migrations skills if needed), then create @docs/MIGRATION.md (or update if exists).
2. **Delegate** to `docs-writer` subagent and **Load** `documentation-and-adrs` skill to generate content including:

- Overview (date, scope, estimated effort, risk level)
- Pre-migration checklist
- Step-by-step migration procedure in phases
- Rollback instructions
- Expected impact analysis results
- Timeline with milestones
- Resources (documentation, tools, contacts)

3. **Load** `architecture-diagrams` alongside `markdown-mermaid-writing` skill to include updated architecture diagrams 

4. If migration changes architecture or process:

- `docs/SPEC.md` — Update spec if requirements change
- `docs/ARCHITECTURE.md` — Update architecture diagram if structure changes
- `specs/` — Update affected modular specs
- `README.md` — Update installation/usage instructions if user-facing
- `docs/` in general — Update any other affected documentation

## Phase 4: Vertical Slice Architecture — Update the implementation roadmap

**Load** `vertical-slice-architecture` skill before deciding how many phases this work has.

1. Use the `question` tool to set the scope and its phase budget: **Prototype** (1-3 phases), **MVP** (4-6 phases), **Enterprise** (7+ phases).
2. **Delegate** `software-architect` subagent loading `vertical-slice-architecture`, `clean-ddd-hexagonal` and `codebase-design` skills to cut the work into vertical slices and order them by risk and dependency.
3. Write the roadmap into `docs/WORKFLOW.md`: one phase per user-visible capability, each with its acceptance test, files touched and demoable outcome.
4. Reject any phase that cannot be demoed on its own, or whose only output is another plan — that is the cascade anti-pattern the skill names.

## Phase 5: Finalize

1. **Migrate plan done — do NOT touch or implement code files.**
2. Use the `question` tool to confirm with the user before proceeding.
3. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

## Rules

- **Never** write to `tasks/` directories.
- **Never** implement code changes, only documentation.
- Always follow the rules of the project.
- You can stop and ask the user for clarification if you need more information to complete the migrate plan.
- Use the best available tools for the job.
- Research external resources every time, specially if you are stuck or the migration is complex. 

## Suggested Next Step

> Migration plan generated. Run `/plan` to create an implementation plan for the migration.

---

User instructions:
