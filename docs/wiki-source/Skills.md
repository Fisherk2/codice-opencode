# Skills — Agent Knowledge Base

Skills are the workspace's reusable knowledge base. Each skill is a Markdown file that teaches an agent how to perform a specific task domain — from writing robust Bash scripts to designing professional UI/UX, from running incident response to auditing dependencies. Together they form a library of **52 engineering process guides** that agents load on demand.

> For the official OpenCode skills documentation, see [opencode.ai/docs/skills](https://opencode.ai/docs/skills).

---

## What Skills Are

A skill is a specialized instruction set stored in `skills/<skill-name>/SKILL.md`. Each skill has:

- **YAML frontmatter** — Metadata including a machine-readable `name` and a plain-language `description` that helps the agent decide when the skill applies.
- **Numbered steps** — A concrete workflow the agent follows, from pre-flight checks through execution to verification.
- **Exit criteria** — Clear conditions that define when the task is done.

Skills are not scripts — they do not execute code on their own. Instead, they are **absorbed into the agent's context** when referenced, guiding the agent's reasoning and actions. Any agent can load any skill at any time by referencing `@skills/<skill-name>/SKILL.md` in its instructions.

```
skills/
├── bash-defensive-patterns/SKILL.md     # Defensive Bash programming
├── clean-code/SKILL.md                   # Readable, maintainable code
├── test-driven-development/SKILL.md      # RED-GREEN-Refactor workflow
├── security-and-hardening/SKILL.md       # OWASP, input validation, least privilege
├── ui-ux-design-pro/SKILL.md             # Professional UI/UX design systems
├── using-agent-skills/SKILL.md           # Meta-skill: skill discovery index
├── obsidian-vault/SKILL.md              # Vault management and organization
├── obsidian-markdown/SKILL.md           # Obsidian Flavored Markdown syntax
├── obsidian-cli/SKILL.md                # Obsidian CLI command reference
└── ... (52 skill directories total)
```

---

## How Agents Use Skills

When an agent encounters a task, it consults the **skill discovery tree** in `skills/using-agent-skills/SKILL.md` to find the right skill. The discovery tree organizes skills by development phase and routes the agent to the appropriate workflow:

```
Task arrives
    │
    ├── New project/feature/change? ──→ spec-driven-development
    │   ├── Need README? ───────────→ crafting-effective-readmes
    │   ├── Designing architecture? ──→ architecture-diagrams
    │   └── Designing UI/UX? ───────→ ui-ux-design-pro
    ├── Implementing code? ───────────→ incremental-implementation
    │   ├── API work? ──────────────→ api-and-interface-design
    │   ├── Database work? ─────────→ db-migration
    │   └── Writing shell scripts? ──→ bash-defensive-patterns
    ├── Writing/running tests? ──────→ test-driven-development
    ├── Something broke? ────────────→ debugging-and-error-recovery
    │   └── Production incident? ───→ incident-response
    ├── Reviewing code? ─────────────→ code-review-and-quality
    └── Deploying/launching? ────────→ shipping-and-launch
```

This indexing is automatic — agents discover skills by scanning the `skills/` directory at startup. If the skill exists, the agent can find and use it.

---

## Full Skill Catalog

The workspace ships with 52 skills covering the full development lifecycle:

| Phase | Skill | Purpose |
|-------|-------|---------|
| **Define** | `interview-me` | Extract what the user actually wants through one-question-at-a-time interviews |
| | `idea-refine` | Refine vague ideas through divergent and convergent thinking |
| | `spec-driven-development` | Requirements and acceptance criteria before code |
| | `agent-md-refactor` | Refactor bloated AGENTS.md files using progressive disclosure |
| | `crafting-effective-readmes` | Audience-matched README writing |
| | `env-setup` | Bootstrap dev environment with prereqs and `.env.example` |
| | `clean-ddd-hexagonal` | Clean Architecture + DDD + Hexagonal patterns for backend design |
| | `design-patterns` | GoF and enterprise design patterns for recurring problems |
| | `architecture-diagrams` | Mermaid, PlantUML, C4 model diagrams |
| | `ui-ux-design-pro` | Professional UI/UX design with design systems and tokens |
| **Plan** | `planning-and-task-breakdown` | Decompose work into small, verifiable tasks |
| **Build** | `incremental-implementation` | Thin vertical slices, test each before expanding |
| | `source-driven-development` | Verify against official docs before implementing |
| | `doubt-driven-development` | Adversarial review of non-trivial decisions |
| | `context-engineering` | Right context at the right time |
| | `frontend-ui-engineering` | Production-quality UI with accessibility |
| | `api-and-interface-design` | Stable interfaces with clear contracts |
| | `api-spec-generation` | Generate OpenAPI/AsyncAPI specs |
| | `docker-optimize` | Multi-stage builds, layer caching, hardening |
| | `db-migration` | Schema changes with rollback strategies |
| | `solid` | SOLID principles, TDD, and professional software design |
| | `clean-code` | Disciplined naming, small functions, clean error handling |
| | `error-handling-patterns` | Result types, propagation, graceful degradation |
| | `design-taste-frontend` | Metric-based visual consistency rules |
| | `bash-defensive-patterns` | Strict mode, error traps, safe variable handling |
| **Verify** | `test-driven-development` | Failing test first, then make it pass |
| | `browser-testing-with-devtools` | Chrome DevTools MCP for runtime verification |
| | `debugging-and-error-recovery` | Reproduce → localize → fix → guard |
| | `excel-analysis` | Analyze spreadsheets, create pivot tables and charts |
| **Review** | `code-review-and-quality` | Five-axis review with quality gates |
| | `security-and-hardening` | OWASP prevention, input validation, least privilege |
| | `performance-optimization` | Measure first, optimize only what matters |
| | `performance-analysis` | Static analysis for N+1 queries and complexity |
| | `dependency-audit` | CVE scanning, outdated packages, license issues |
| | `code-simplification` | Simplify code for clarity without changing behavior |
| | `refactoring-patterns` | Named refactoring transformations |
| **Ship** | `git-workflow-and-versioning` | Atomic commits, clean history |
| | `changelog-generate` | Generate CHANGELOG.md from git history |
| | `ci-cd-and-automation` | Automated quality gates on every change |
| | `documentation-and-adrs` | Document the why, not just the what |
| | `shipping-and-launch` | Pre-launch checklist, monitoring, rollback plan |
| | `observability-and-instrumentation` | Logging, metrics, tracing, alerting |
| | `deprecation-and-migration` | Manage deprecation and migration of old APIs |
| | `incident-response` | Triage, communicate, write blameless postmortems |
| **Extra** | `obsidian-vault` | Search, create, and manage notes in the Obsidian vault with wikilinks and index notes |
| | `obsidian-markdown` | Create and edit Obsidian Flavored Markdown with wikilinks, embeds, callouts, and properties |
| | `obsidian-cli` | Interact with Obsidian vaults using the Obsidian CLI to read, create, search, and manage notes |
| | `xlsx` | Create, edit, and manipulate spreadsheet files |
| | `find-docs` | Retrieve up-to-date documentation for any developer technology |
| | `skill-creator` | Create, edit, and optimize agent skills |

---

## How to Add a New Skill

Adding a custom skill requires creating the skill file and registering it in the discovery index. Here is the step-by-step procedure.

### Step 1: Create the Skill Directory and File

Create `skills/<skill-name>/SKILL.md` with a kebab-case directory name. For this guide, we will create a skill called `my-shell-scripting`.

```bash
mkdir -p skills/my-shell-scripting
```

### Step 2: Add YAML Frontmatter

Every skill file starts with frontmatter that defines its `name` and `description`:

```markdown
---
name: my-shell-scripting
description: Best practices for writing portable, maintainable shell scripts with consistent argument parsing, error handling, and shellcheck compliance.
---

# My Shell Scripting

[body of the skill]
```

The `name` should match the directory name (kebab-case). The `description` must clearly tell an agent when to use this skill — be specific about the task domain.

### Step 3: Write Numbered Steps

The body contains a structured workflow that the agent follows. Quality skills follow a consistent pattern:

1. **Pre-flight checks** — What to verify before starting (e.g., "Check that `shellcheck` is installed").
2. **Core workflow** — Numbered, actionable steps. Each step is a concrete action, not a general suggestion.
3. **Verification** — How to confirm the work is correct (e.g., "Run `shellcheck` on all modified files").
4. **Exit criteria** — Clear conditions that define completion.

Example:

```markdown
## Pre-flight

1. Verify `shellcheck` is installed (`which shellcheck`).
2. Check the existing scripts in the project for naming conventions.

## Core Workflow

1. Add `set -Eeuo pipefail` at the top of every new script.
2. Define an `cleanup` trap function for temporary files.
3. Use `[[ ... ]]` for conditionals (POSIX-compatible when needed).
4. Quote all variable expansions: `"$var"` not `$var`.
5. Use `readonly` and `local` for variable scoping.

## Verification

1. Run `shellcheck` on all modified files — zero warnings.
2. Test the script with both normal and error inputs.
3. Verify the script exits with a non-zero code on failure.

## Exit Criteria

- [ ] `shellcheck` passes with zero warnings.
- [ ] Script exits cleanly on success (code 0).
- [ ] Script exits with descriptive error on failure (code 1+).
- [ ] Temporary files are cleaned up on exit.
```

### Step 4: Update the Skill Discovery Index

Open `skills/using-agent-skills/SKILL.md` and add your skill to the appropriate section of the discovery tree and the Quick Reference table. For `my-shell-scripting`, this would go under the Build phase alongside `bash-defensive-patterns`:

In the **discovery tree**:
```
    ├── Writing robust shell scripts? ──→ bash-defensive-patterns
    ├── Writing portable shell scripts? ──→ my-shell-scripting
```

In the **Quick Reference** table:
```
| Build | my-shell-scripting | Best practices for writing portable, maintainable shell scripts |
```

### Step 5: Restart OpenCode

Restart your OpenCode session. Skills are loaded at startup, so a restart is required before agents can discover and use the new skill.

---

## Quality Standards

Every skill in the workspace adheres to four quality criteria:

### Specific

Skills must contain **actionable steps**, not general advice. A step like "Use clear variable names" is too vague. "Name boolean variables with prefixes like `is_`, `has_`, or `should_`" is specific — the agent can act on it.

### Verifiable

Skills must include clear **exit criteria** that can be checked programmatically or by inspection. "The code should be clean" is not verifiable. "`shellcheck` passes with zero warnings across all modified files" is verifiable.

### Battle-Tested

Skills should be based on real engineering workflows, not theoretical ideals. Each skill encodes processes that senior engineers follow in production. If a step has not been validated in practice, it does not belong in a skill.

### Minimal

Skills should contain only what is necessary to guide the agent correctly. Avoid encyclopedia entries, extended background explanations, or multiple ways to do the same thing. If the agent needs detail, it should load a reference document — the skill itself must stay focused on the workflow.

---

## Lifecycle Sequence

For a complete feature, the typical skill invocation sequence across the SDD cycle is:

```
1.  interview-me                 → Extract user intent
2.  idea-refine                  → Refine vague ideas
3.  spec-driven-development      → Define what to build
4.  planning-and-task-breakdown  → Break into tasks
5.  context-engineering          → Load the right context
6.  source-driven-development    → Verify against official docs
7.  doubt-driven-development     → Adversarial review
8.  incremental-implementation   → Build slice by slice
9.  test-driven-development      → Prove each slice works
10. observability-and-instrumentation → Instrument as you build
11. code-review-and-quality      → Review before merge
12. git-workflow-and-versioning  → Clean commit history
13. documentation-and-adrs       → Document decisions
14. shipping-and-launch          → Deploy safely
```

Not every task needs every skill. A bug fix might only use `debugging-and-error-recovery` → `test-driven-development` → `code-review-and-quality`. The agent chooses which skills to invoke based on the task at hand.

---

## Links

- [OpenCode Skills Documentation](https://opencode.ai/docs/skills) — Official OpenCode skills reference and configuration guide.
- [Commands](Commands) — Slash commands that invoke skills during their workflows.
- [Workspace Structure](Workspace-Structure) — Where skills live in the directory layout.
