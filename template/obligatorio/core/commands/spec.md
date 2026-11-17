---
description: Establish specs, documentation, and project conventions from scratch
agent: quetzalcoatl
---

## Pre-Flight: Detect Project state

**Delegate** `codebase-onboarding-engineer` subagent and **Load** `codebase-onboarding` skill to understand the project's structure and determine whether it is brownfield or greenfield. A brownfield project must have all of:

1. **Metadata/dependencies files** — package.json, Cargo.toml, pyproject.toml, etc.
2. **Version history** — at least one published release or tag
3. **Existing documentation** — @SPEC.md, @docs/ or any other documentation with real content (not placeholders)
4. **Active development** — recent commits, open issues, or ongoing work

Output a summary:

```
PROJECT STATE DETECTED:
- Metadata/dependencies files: [exists / missing]
- Version history: [N releases / tags]
- SPEC.md: [exists with real content / exists but placeholder / missing]
- README.md: [exists with real content / exists but placeholder / missing]
- CHANGELOG.md: [exists with real content / exists but placeholder / missing]
- CONTRIBUTING.md: [exists with real content / exists but placeholder / missing]
- docs/SECURITY.md: [exists with real content / exists but placeholder / missing]
- docs/: [list of docs with real content]
- Recent activity: [summary of last N commits]
- STATUS: [BROWNFIELD / GREENFIELD / EMPTY]
```

**If the project is brownfield**, stop and suggest using `/feature` or `/docs-update` instead.

**If the project is greenfield/empty**, proceed to the goal determination phase.

## Phase 0: Clarify Intent

1. **Load** the `interview-me` skill to extract user's request, histories, key functional and non-functional requirements, and constraints.
2. Use at least 10 or more questions to clarify the user histories, formulate him in parts, ordened by priority and complexity, it means use `question` tool in parts (max 5 questions at once), not all at once (you can use progression status each question is answered like 1/18, 2/18, etc.).
3. **Delegate** appropriate specialized subagents in parallel to analyze and research the user requirements.

Each user history, resource researched, question and answer registered should be stored in `docs/BACKLOG.md` file, with a clear structure, ordened by priority and complexity.

## Phase 1: Install the project skills this work needs

Once the intent is clear, find the skills that raise the quality of this work.

1. **Load** the `find-skills` skill and search by the user's purpose and stack (for example: "payments", "django", "accessibility audit"). If `find-skills` is not installed, use the documented fallback: `npx skills use "https://github.com/vercel-labs/skills" --skill "find-skills"`.
2. Present the candidate skills in a table: **name** · what it covers · why it fits this task.
3. Use the `question` tool with three options: install all candidates, install only the most important ones, install none.
4. Install the chosen skills at project level — **NEVER global**. Project scope keeps the workspace reproducible and leaves the user's machine untouched.

Never invent a skill name: if the search returns nothing, say so and continue without skills.

## Phase 2: Refine Requirements

Explore alternatives or variations, **Load** `idea-refine` alongside `brainstorming` skill to generate and evaluate options.

Use the `question` tool to clarify interactively:
1. **Objective and target users** — what does success look like? Who is this for?
2. **Core features and acceptance criteria** — must-have vs nice-to-have?
3. **Tech stack preferences and constraints** — any existing commitments?
4. **Boundaries** — what to always do, ask first about, and never do

Each option, alternatives, variations, resource researched, user history, decisions, questions, and answers registered should be stored in @docs/BACKLOG.md file, with a clear structure (in case if backlog file are large, e.g. more than 500 lines, refactor/split `docs/BACKLOG.md` file and create `docs/backlog/` directory to store each backlog in separate files).

**Always use the `question` tool to let the user confirm what specs or requirements they needs include in the project — never decide automatically, even if the specifications or user histories seem clear or trivial.** The user must answer doubts, suggestions, and ambiguities before proceeding.

## Phase 3: Generate Initial Documentation

**Load** `spec-driven-development` skill to scaffold the project's initial documentation, for non-trivial decisions **Load** `doubt-driven-development` skill.

1. **Delegate** `docs-writer` subagent and **Load** `documentation-and-adrs` skill to write general documentation and ADRs. 
2. During documentation drafting, **Load** the following supporting skills as needed:
- `api-and-interface-design` skill when defining API contracts
- `architecture-diagrams` skill for system architecture diagrams
- `markdown-mermaid-writing` skill for diagrams in Markdown
- `clean-ddd-hexagonal` skill if using Clean Architecture or DDD
- `design-patterns` skill when applying GoF or enterprise patterns
- `api-spec-generation` skill for OpenAPI or AsyncAPI specs

3. Write the following files and directories:

- **AGENTS.md** — Project-level rules, standards, external resource references, and metadata for AI agents working on this project
- **SPEC.md** — Central specification covering objective, commands, project structure, code style, testing strategy, and boundaries. References modular specs in @specs/
- **docs/** — Initial scaffold: `docs/ARCHITECTURE.md` (with ADR index), `docs/SCHEMA.md` (if applicable), `docs/APPFLOW.md`, `docs/CODE_STYLE.md`, `docs/SECURITY.md`, `docs/TECH_DEBT.md`, `docs/PRD.md`, `docs/TRD.md`.
- **specs/spec-<feature>.md** — One modular spec per feature or domain, use @specs/spec-template.md as template; `SPEC.md` references these
- **docs/adr/adr-<nnn>.md** — ADRs for key architecture decisions, linked from `docs/ARCHITECTURE.md`, use @docs/adr/adr-template.md as template.
- **CODE_OF_CONDUCT.md** — Project-level code of conduct for contributors and maintainers

## Phase 4: Vertical Slice Architecture - Establish a implementation roadmap
[Aqui se delega a software-architect para cargar clean-ddd-hexagonal skill (si no esta cargado), codebase-design skill y vertical-slice-architecture skill para establecer las fases de implementación y el roadmap de desarrollo en @docs/WORKFLOW.md]

## Phase 5: Finalize

1. **Specs created — do NOT touch or implement code files.**
2. Use the `question` tool to confirm with the user before proceeding.
3. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

## Rules

- If the project is browfield, suggest user to use `/feature` command instead.
- **Never** overwrite existing files without user confirmation — always show changes first
- Backlog files is the single source of truth. Do not duplicate information in other files.
- Use the `question` tool to confirm all changes with the user before writing any file
- If @AGENTS.md and/or @SPEC.md generated files exceeds **200 lines**, **Load** `agent-md-refactor` skill to modularize into progressive disclosure files in @specs/
- If `docs/BACKLOG.md` file does not exist, create it.
- Do **not** touch `task/`, `specs/design/` or `docs/DESIGN.md` files — suggest to the user to use `/plan` and/or `/design` commands instead. Workspace documentation is managed separately.
- **Never** implement code changes, only documentation.
- You can stop and ask the user for clarification if you need more information to proceed.
- Use the best available tools for the job.
- Research external resources every time, specially if you are stuck or unsure about user histories. 

## Suggested Next Step

> Your project specs are ready. Run `/plan` to create an execution plan, or run `/design` to establish the UI/UX design of the project.

---

User instructions:
