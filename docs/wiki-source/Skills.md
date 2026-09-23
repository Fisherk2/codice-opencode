# Skills — Agent Knowledge Base

Skills are the workspace's reusable knowledge base. Each skill is a Markdown file that teaches an agent how to perform a specific task domain — from writing robust Bash scripts to designing professional UI/UX, from running incident response to auditing dependencies. Together they form a library of **51 engineering process guides** that agents load on demand.

> For the official OpenCode skills documentation, see [opencode.ai/v2/docs/skills](https://opencode.ai/v2/docs/skills/).

---

## What Skills Are

A skill is a specialized instruction set stored in `skills/<skill-name>/`. Each skill directory contains:

- **`SKILL.md`** (required) — The skill workflow with YAML frontmatter, numbered steps, and exit criteria.
- **`references/`** (optional) — Extended reference material co-located with the skill. Exposed through OpenCode's `references` section in `opencode.json` (V2's plural name; the singular V1 `reference` map is legacy).

```
skills/<skill-name>/
├── SKILL.md              # Required: skill workflow
└── references/           # Optional: co-located reference material
    ├── topic-1.md
    └── topic-2.md
```

The `SKILL.md` file has:
- **YAML frontmatter** — A plain-language `description` (what OpenCode shows the model when advertising the skill) and an optional `name` display label. The skill's **ID** is derived from its file path, not from `name`.
- **Numbered steps** — A concrete workflow the agent follows, from pre-flight checks through execution to verification.
- **Exit criteria** — Clear conditions that define when the task is done.

The `references/` subdirectory extends the skill with deeper knowledge without bloating the `SKILL.md`. References are exposed via the `references` section in `opencode.json`; entries with a `description` are advertised to agents with their alias and resolved path, and the client attaches them by that alias.

```
skills/
├── bash-defensive-patterns/SKILL.md     # Defensive Bash programming
├── clean-code/SKILL.md                   # Readable, maintainable code
├── test-driven-development/SKILL.md      # RED-GREEN-Refactor workflow
├── security-and-hardening/SKILL.md       # OWASP, input validation, least privilege
├── ui-ux-design-pro/SKILL.md             # Professional UI/UX design systems
├── obsidian-vault/SKILL.md              # Vault management and organization
├── obsidian-markdown/SKILL.md           # Obsidian Flavored Markdown syntax
├── obsidian-cli/SKILL.md                # Obsidian CLI command reference
└── ... (51 skill directories total, many with references/ subdirectories)
```

---

## How Agents Use Skills

When an agent encounters a task, OpenCode searches its skill sources automatically (the workspace's skills are exposed under `.opencode/skills/` via the installer symlink). At each model step, OpenCode lists the permitted skills that have a `description` — just ID, name, and description, not the full body — so the agent sees which skills apply and loads one on demand by calling the `skill` tool with its exact ID.

This discovery is automatic — no manual registration or index maintenance is required. If the skill exists in a discovered source, the agent can find and use it.

---

## Full Skill Catalog

The workspace ships with 51 skills covering the full development lifecycle:

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

Adding a custom skill requires creating the skill file in the `skills/` directory. OpenCode discovers skills automatically from its skill sources — no manual registration needed.

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

### Step 4: Verify Discovery

No manual registration is needed — V2 builds the advertised skill list at each model step from the discovered sources. If the new skill does not appear, work through the checklist from the official troubleshooting section: confirm the file is a root-level `*.md` or a nested `SKILL.md`, verify the **path-derived, case-sensitive ID** (not the frontmatter `name`), make sure a `description` exists, check `opencode/autoinvoke` and the agent's `skill` permissions, and look for a later source defining the same ID.

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

## Links

- [OpenCode Skills Documentation](https://opencode.ai/v2/docs/skills/) — Official OpenCode V2 skills reference and configuration guide.
- [Commands](Commands) — Slash commands that invoke skills during their workflows.
- [Workspace Structure](Workspace-Structure) — Where skills live in the directory layout.
