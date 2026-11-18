---
description: Establish new specs or modify existing ones for mature projects.
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

**If the project is greenfield/empty**, stop and suggest using `/spec` or `/docs-update` instead.

**If the project IS brownfield**, proceed to the goal determination phase.

## Phase 0: Refine specs and user stories

1. If the user's request is vague or missing key functional and non-functional requirements, **Load** the `interview-me` skill to extract intent before proceeding.

2. **Load** `idea-refine` alongside `brainstorming` skill to extract intent before proceeding, generate and evaluate options to explore alternatives or variations.

3. Use the `question` tool to clarify interactively:

- **New specs** — Add new features, respond to new requirements, or add new constraints.
- **Modified specs** — Change existing behavior, respond to new requirements or improve existing ones.
- **Something else** — Let the user describe a different goal (while is not a migration plan)

**Always use the `question` tool to let the user confirm what specs or requirements they needs include in the project — never decide automatically, even if the specifications or user histories seem clear or trivial.** The user must answer doubts, suggestions, and ambiguities before proceeding.

## Phase 1: Analyze user requirements

1. Use project state context to understand what requirements are already covered by existing specs.
2. Determine tasks size — is this a small changes, a medium-sized change or a large new features? and classify the requirements accordingly.
3. **Select appropriate subagents** — inspect available subagents for requirements analysis inspection.
4. **Fan out analysis** — **Delegate** in parallel appropriate subagents to analyze requirements and refine specs with: requirement description to inspect, analysis criteria, skills to load, tools to use, resources to consult, and output format.
5. Merge results — generate analysis report with all the results from the subagents.
6. **Question** the user to confirm the analysis and the specs to be created or modified.

## Phase 2: Document user requirements — Create or Modified Specs

If user confirms the analysis, **Load** `spec-driven-development` skill and proceed to document the requirements.

1. **Generate specs** — **Delegate** `docs-writer` subagent and **Load** `documentation-and-adrs` skill to generate structured specs for the new or changed requirements in `specs/` using @specs/spec-template.md as a template.
2. **Determine scope** — does this change existing specs or create new ones?
   - New feature → create `specs/spec-<feature>.md`
   - Modify existing → update relevant spec files
3. **Document architecture impact** — update or add ADRs using @docs/adr/adr-template.md in `docs/adr/` if the change affects architecture
4. **Load** `architecture-diagrams` alongside `markdown-mermaid-writing` skill to include updated architecture diagrams 
5. For non-trivial decisions, **Load** `doubt-driven-development` skill
6. If @SPEC.md or @AGENTS.md exceeds **200 lines**, **Load** `agent-md-refactor`skill to modularize into @specs/

## Phase 3: Vertical Slice Architecture — Update the implementation roadmap

1. Use the `question` tool to set the VSA plan's scope and its phase budget (recommend scope to user depending feature files generated): 
- **Hotfix-patch** (2-3 phases): features that can be implemented quickly in a single sprint.
- **Minor-patch** (4-5 phases): features that require multiple sprints but can be implemented within a few development cycles. 
- **Major-patch** (6+ phases): Complex features that require significant effort and multiple development cycles.

2. **Delegate** `software-architect` subagent and **Load** `vertical-slice-architecture`, `clean-ddd-hexagonal` and `codebase-design` skills to cut the work into vertical slices and order them by risk and dependency.
3. Present a brief summary of the VSA plan for human review before saving.
4. Use the `question` tool to confirm VSA plan with the user before saving to `docs/WORKFLOW.md`
5. If user approves, **Delegate** to `docs-writer` subagent and update `docs/WORKFLOW.md`: one phase per user-visible capability, each with its acceptance test, files touched and demoable outcome.
6. Reject any phase that cannot be demoed on its own, or whose only output is another plan — that is the cascade anti-pattern the skill names.

## Phase 4: Install the project skills (optional)

Use the `question` tool to ask the user if they want to install the skills for this project. if they say no, **skip** this phase.

Once the target is clear, find the skills that raise the quality of this work.

1. **Load** `find-skills` skill and search by the features purpose and technology stack. If `find-skills` is not installed, use the documented fallback: `npx skills use "https://github.com/vercel-labs/skills" --skill "find-skills"`.
2. Present the candidate skills in a table: **name** · what it covers · why it fits this task.
3. Use the `question` tool to ask the user to choose the skills to install (or skip).
4. Install the chosen skills at project level — **NEVER global**. Project scope keeps the workspace reproducible and leaves the user's machine untouched.

Never invent a skill name: if the search returns nothing, say so and continue without skills.

## Phase 5: Finalize

1. **Features are documented — do NOT touch or implement code files.**
2. Use the `question` tool to confirm with the user before proceeding.
3. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

## Rules

- If the project is new, lacks version history, or lacks comprehensive documentation, suggest running `/spec` or `/docs-update` instead.
- Use the `question` tool before overwriting any existing documentation — always show the diff or changes first and confirm.
- When modifying specs, preserve previous versions or document the change history.
- Every evolution should leave the project in a consistent, documented state.
- Use @SPEC.md as the single source of truth for project scope and direction.
- **Never** write to `tasks/` directories.
- **Never** implement code changes, only documentation.
- **Never** resolve issues.
- **Never** proceed if the user intent migrate some technology stack or architecture, suggest running `/migrate` instead.
- You can stop and ask the user for clarification if you need more information to proceed.
- Use the best available tools for the job.
- Research external resources every time, specially if you are stuck or unsure about something. 

## Suggested Next Step

After completing the spec update:

> Your specs are ready. Run `/plan` to create an execution plan, and run `/build` to start implementing specs.

---

User context:

