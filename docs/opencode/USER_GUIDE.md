# Complete Reference Guide

**Production-grade engineering skills for AI coding agents.**

---

## Quick Start

This workspace is a **template** for building AI-assisted projects. Don't clone it directly — use one of these methods instead:

- **Option A: Use this template (Recommended)** — Go to [github.com/Fisherk2/spec-driven-develop-opencode-workspace](https://github.com/Fisherk2/spec-driven-develop-opencode-workspace), click **"Use this template"** → **"Create a new repository"**, then clone your new repo.
- **Option B: Download ZIP** — Go to the same URL, click **Code** → **Download ZIP**, extract, then `rm -rf .git && git init` to start fresh.

> **Why not `git clone`?** Cloning inherits the template's commit history. The methods above give you a clean slate.

### Clean up template files

#### README.md

Replace the **entire content** with your own project's README. The template's README contains project-specific branding and descriptions that don't apply to your project.

#### CONTRIBUTING.md

Replace the **entire content** with your own contribution guidelines, or delete the file if you don't need them.

#### CHANGELOG.md

Remove only the **version entries** (the tagged releases `[x.x.x]`), keeping the format definition and structure. Your changelog starts fresh with your own versions.

See [00-setup.md](./00-setup.md) for prerequisites, configuration details (opencode.json, model setup, plugin dependencies), and troubleshooting.

See [06-mcp-servers.md](./06-mcp-servers.md) for MCP server setup (Context7, Excel, Jupyter).

### Verify commands

```bash
ls .opencode/commands/
# → build.md  code-simplify.md  design.md  evolve.md  plan.md  review.md  ship.md  spec.md  test.md  webperf.md
```

### Run your first SDD workflow

| Step | Command | Phase |
|------|---------|-------|
| Define what to build (new project) | `/spec "Create a REST API for tasks"` | DEFINE |
| Evolve existing project | `/evolve "Add user authentication"` | EVOLVE |
| Design the interface (optional) | `/design "Design dashboard UI"` | DESIGN |
| Plan the tasks | `/plan` | PLAN |
| Implement incrementally | `/build` | BUILD |
| Prove it works | `/test` | VERIFY |
| Audit web performance (optional) | `/webperf` | WEBPERF |
| Simplify code (recommended) | `/code-simplify` | SIMPLIFY |
| Review before merge | `/review` | REVIEW |
| Ship to production | `/ship` | SHIP |

See [02-orchestration-patterns.md](./02-orchestration-patterns.md) for the SDD lifecycle diagram and detailed orchestration.

---

## Commands

Ten slash commands map to the development lifecycle. Each activates the right skills automatically via a primary agent.

| Action | Command | Primary Agent | Principle |
|--------|---------|---------------|-----------|
| Define what to build (new project) | `/spec` | quetzalcoatl | Spec before code |
| Evolve existing project | `/evolve` | quetzalcoatl | Document before coding |
| Design UI/UX (optional) | `/design` | quetzalcoatl | Design before implementation |
| Plan how to build it | `/plan` | moctezuma | Small, atomic tasks |
| Build incrementally | `/build` | tlaloc | One slice at a time |
| Prove it works | `/test` | mictlantecuhtli | Tests are proof |
| Audit web performance (optional) | `/webperf` | mictlantecuhtli | Measure before optimizing |
| Simplify the code (recommended) | `/code-simplify` | tlaloc | Clarity over cleverness |
| Review before merge | `/review` | tezcatlipoca | Improve code health |
| Ship to production | `/ship` | mictlantecuhtli | Faster is safer |

See [02-orchestration-patterns.md](./02-orchestration-patterns.md) for detailed orchestration patterns and command behavior.

---

## Agent Personas

| Agent | Role | Use When |
|-------|------|----------|
| [huitzilopochtli](../../agents/huitzilopochtli.md) | Supreme Orchestrator | Any task needing orchestration — decide which agent should act |
| [quetzalcoatl](../../agents/quetzalcoatl.md) | Visionary Architect | Before writing code — conceive architecture and specs |
| [moctezuma](../../agents/moctezuma.md) | Strategic Commander | After spec — decompose vision into executable tasks |
| [tlaloc](../../agents/tlaloc.md) | Rain God Builder | After planning — build, code, test, configure |
| [mictlantecuhtli](../../agents/mictlantecuhtli.md) | Underworld Judge | After build — validate quality, prepare deployment |
| [tezcatlipoca](../../agents/tezcatlipoca.md) | Smoking Mirror Critic | Before merge — review, critique, find hidden flaws |

### Add a New Agent

To add a new specialized agent, follow these steps. The project has **two types of agents** with different procedures:

- **Subagent** (~96 currently) — expert in a specific domain, invoked via `task()` from a primary agent
- **Primary agent** (6 currently: huitzilopochtli, quetzalcoatl, moctezuma, tlaloc, mictlantecuhtli, tezcatlipoca) — main entry point for slash commands, with ability to delegate to subagents

#### Add a Subagent

1. **Create `agents/<agent-name>.md`** with the appropriate frontmatter format (simple for review/analysis, extended for execution)

2. **Define the role, scope, output format, and rules**

3. **Add a `## Composition` block at the end** following the standard format (Invoke directly when / Invoke via / Do not invoke from another persona)

4. **Update the global catalog** — Add the agent to the corresponding table in [docs/opencode/03-agent-index.md](docs/opencode/03-agent-index.md):
   - If it's Systems Engineering → add it to the `## 🖥️ Systems Engineering` section
   - If it's Multidisciplinary & Business → add it to the `## 🧩 Multidisciplinary & Business` section

5. **Update the SUBAGENT DELEGATION tables** of primary agents that can delegate to this new agent. This is critical — without this, the primary agent won't know it exists:
   - **[agents/quetzalcoatl.md](agents/quetzalcoatl.md)** — If the agent is useful for analysis, review, specifications, or documentation (code reviews, DB analysis, accessibility, research, etc.)
   - **[agents/tlaloc.md](agents/tlaloc.md)** — If the agent is useful for implementation, build, testing, or deployment (languages, frameworks, DevOps, DB, testing, etc.)
   - **[agents/mictlantecuhtli.md](agents/mictlantecuhtli.md)** — If the agent is useful for testing, quality, security, or deployment (code review, security audit, testing, debugging, deployment, etc.)
   - Add a row to the table with: agent name, what it does best ("Best for"), and when to delegate ("Delegate when...")

6. **Update the huitzilopochtli catalog** in [agents/huitzilopochtli.md](agents/huitzilopochtli.md):
   - If the agent fits an existing domain (Backend, Frontend, DevOps, etc.), add its name to the comma-separated list
   - If the agent introduces a new domain, add a new row to the "Catalog by Domain" table

7. **Add the name to the `VALID_SUBAGENTS` Set** in [.opencode/plugins/sdd-pipeline.ts](.opencode/plugins/sdd-pipeline.ts). This Set validates that subagents invoked via `task()` exist in the catalog. If you omit this step, the plugin will reject the subagent with an error: `Unknown subagent: <name>`. Consult the domain table in [.opencode/plugins/README.md](.opencode/plugins/README.md#subagent-name-validation) to see the correct format.

8. **Restart your OpenCode session** so it recognizes the new agent

#### Add a Primary Agent

Primary agents are main entry points in the SDD pipeline. In addition to steps 1-3 from "Add a Subagent":

4. **Add the agent to the catalog** in [docs/opencode/03-agent-index.md](docs/opencode/03-agent-index.md) (section `## Primary Agents`)

5. **Add the agent to the table** in [docs/opencode/02-orchestration-patterns.md](docs/opencode/02-orchestration-patterns.md) (section `## Agent Personas`)

6. **Update `docs/opencode/USER_GUIDE.md`** — Add the agent to the `## Agent Personas` table

7. **Add SUBAGENT DELEGATION section** to the new primary agent, following the pattern of existing ones (table of relevant subagents + delegation rules)

8. **Create the necessary hooks in the SDD plugin** (`.opencode/plugins/sdd-pipeline.ts`) if the agent needs:
   - High-confidence identity pattern in `AGENT_IDENTITY_PATTERNS` (format: `/You are \*\*Name\*\*/`)
   - Keyword detection pattern in `AGENT_DETECT_PATTERNS`
   - Slash command mapping in `COMMAND_AGENT_MAP` (if the agent has associated commands)
   - Mention pattern in `AGENT_MENTION_PATTERNS` (format: `/@name\b/i`)
   - Role rules in `buildRoleRules()`
   - Add to the `READ_ONLY_AGENTS` Set (if the agent is read-only)
   - Phase suggestions in `PHASE_SUGGESTIONS` (if applicable)
   - Tool restrictions in `tool.execute.before`

9. If the agent enables a new orchestration pattern, document it in [docs/opencode/02-orchestration-patterns.md](docs/opencode/02-orchestration-patterns.md)

10. **Restart your OpenCode session**

#### Rules for Agents and Subagents

- An agent is a single role with a single output format. If you need a second role, create a second agent.
- **Primary agents can delegate to subagents** via `task()` for specialized and well-defined tasks. Subagents operate in isolated subcontexts and return their result to the primary agent. This is not persona-chaining — it's controlled delegation within the same context.
- **Subagents do NOT delegate to other subagents.** If a subagent needs specialized help, it must report it to the primary agent that invoked it.
- **Primary agents do NOT invoke other primary agents.** Composition between primaries is the responsibility of slash commands or the user.
- An agent can invoke skills (the *how*).
- Every agent file ends with a "Composition" block indicating where it fits.

#### File Format

The format and configuration options (YAML frontmatter, modes, permissions, model) are documented in [docs/opencode/01-agents.md](docs/opencode/01-agents.md). Use existing agents in `agents/` as reference.

#### What Not To Do

- Do not create agents that invoke other agents
- Do not add multiple roles in a single agent
- Do not duplicate existing functionality

### References

For more information about agent formats, orchestration, and complete catalog:
- [docs/opencode/01-agents.md](docs/opencode/01-agents.md) — Agent configuration, frontmatter, permissions, modes
- [docs/opencode/02-orchestration-patterns.md](docs/opencode/02-orchestration-patterns.md) — Orchestration patterns and primary agents
- [docs/opencode/03-agent-index.md](docs/opencode/03-agent-index.md) — Complete catalog of agents classified by domain

---

## Add a New Skill

1. **Place the skill in the `skills/` folder**
   - Install it manually by creating `skills/<skill-name>/SKILL.md` with the appropriate format
   - Or install it automatically with `find-skills` (which will download it to the location you specify)
   - Ensure the directory name is kebab-case

2. **Migrate the `references/` directory if it exists**
   - If the skill contains an internal `references/` directory, move **all its content** to the project's root `references/` folder
   - This keeps reference material centralized and accessible to all skills
   - Delete the empty `references/` directory inside the skill after migrating

3. **Create or adjust the `SKILL.md`** following the format defined in [docs/opencode/05-skills.md](docs/opencode/05-skills.md) (frontmatter, nomenclature, anatomy) and the style guide in [docs/ai-agent-setup/skill-anatomy.md](docs/ai-agent-setup/skill-anatomy.md)

4. **Update the available skills documentation** (priority: meta-skill first):
   - **[skills/using-agent-skills/SKILL.md](skills/using-agent-skills/SKILL.md)** — Add the skill to the "Skill Discovery" tree under the **"Skill Extras"** subsection and to the "Quick Reference" table with phase **"Extra"**
   - **[docs/opencode/USER_GUIDE.md](docs/opencode/USER_GUIDE.md)** — Add the skill to the appropriate phase table and update the project structure tree

5. **Restart your OpenCode session** so it recognizes the new skill

### Skill Quality Standard

Skills must be:

- **Specific** — Actionable steps, not vague advice
- **Verifiable** — Clear exit criteria with evidence requirements
- **Battle-tested** — Based on real engineering workflows, not theoretical ideals
- **Minimal** — Only the content necessary to guide the agent correctly

### Structure

Every new skill must have:

- [SKILL.md](docs/opencode/05-skills.md) in the skill directory (see anatomy, frontmatter, and nomenclature in that document)
- YAML frontmatter with valid `name` and `description`

For detailed anatomy (Overview, When to Use, Process, etc. sections), consult [docs/opencode/05-skills.md](docs/opencode/05-skills.md).

### What Not To Do

- Do not duplicate content between skills — reference other skills instead
- Do not add skills that are vague advice rather than actionable processes
- Do not create support files unless the content exceeds 100 lines
- Do not put reference material inside skill directories — use `references/` instead

---

## Add a New Command

Slash commands are the main entry point for users. Each command activates a primary agent with a predefined workflow.

1. **Create `commands/<command-name>.md`** following the frontmatter format described in [04-commands.md](./04-commands.md):
   ```yaml
   ---
   description: Action verb + what the command does
   agent: target-primary-agent-name
   ---
   ```

2. **Write the command flow** as numbered steps:
   - Reference skills inline where used (`@skills/skill-name/SKILL.md`)
   - Use the `question` tool at decision points (`Always use the question tool — never decide automatically`)
   - If the agent doesn't write code, include a handoff instruction: `Recommend the user run /build`

3. **Update `docs/opencode/USER_GUIDE.md`**:
   - Add the command to the `## Commands` table with: Action, Command, Primary Agent, Principle
   - Add the command to the Quick Start workflow table if applicable
   - Update the project structure tree (commands count + entry)

4. **Update `docs/opencode/README.md`**:
   - Add the command to the full-cycle phase table
   - Update the Mermaid diagram if the new command changes the SDD flow
   - Update the command count (Features and Project Structure lines)

5. **Update the SDD plugin** if the command introduces a new mapping:
   - **[.opencode/plugins/sdd-pipeline.ts](.opencode/plugins/sdd-pipeline.ts)** — Add the command to `COMMAND_AGENT_MAP`
   - **[.opencode/plugins/README.md](.opencode/plugins/README.md)** — Add the command to the Command-Agent Map table

6. **If the command introduces a new SDD phase**, also update:
   - **[docs/opencode/02-orchestration-patterns.md](./02-orchestration-patterns.md)** — Add the command to the orchestration patterns

7. **Restart your OpenCode session** so it recognizes the new command

---

## Project Structure

```
project-root/
├── AGENTS.md                   # Agent personas and orchestration
├── CHANGELOG.md                # Release history
├── CONTRIBUTING.md             # How to add agents and skills
├── Justfile                    # Task runner commands
├── LICENSE                     # MIT License
├── Makefile                    # Build targets
├── README.md                   # Project overview
├── SPEC.md                     # Project specification
├── opencode.json               # OpenCode configuration
├── skills-lock.json            # Skill dependency lockfile
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variables template
│
├── agents/                     # 102+ agent personas (6 primary + 96+ subagents)
│   ├── huitzilopochtli.md      #   Supreme Orchestrator
│   ├── quetzalcoatl.md         #   Visionary Architect
│   ├── moctezuma.md            #   Strategic Commander
│   ├── tlaloc.md               #   Rain God Builder
│   ├── mictlantecuhtli.md      #   Underworld Judge
│   ├── tezcatlipoca.md         #   Smoking Mirror Critic
│   └── ... (96+ subagent files)
│
├── commands/                   # 12 slash commands for OpenCode
│   ├── build.md                #   BUILD
│   ├── code-simplify.md        #   SIMPLIFY (recommended pre-review)
│   ├── design.md               #   DESIGN (optional, UI/UX)
│   ├── diagnosis.md            #   DIAGNOSE (issue analysis)
│   ├── docs-update.md          #   DOCS (sync documentation)
│   ├── evolve.md               #   EVOLVE (mature projects)
│   ├── plan.md                 #   PLAN
│   ├── review.md               #   REVIEW
│   ├── ship.md                 #   SHIP
│   ├── spec.md                 #   DEFINE (new projects)
│   ├── test.md                 #   VERIFY
│   └── webperf.md              #   WEBPERF (optional, perf. audit)
│
├── .opencode/                  # OpenCode runtime config
│   ├── agents -> ../agents     #   Symlink to agents
│   ├── commands -> ../commands #   Symlink to commands
│   ├── skills -> ../skills     #   Symlink to skills
│   ├── plugins/                #   SDD pipeline plugin
│   │   ├── sdd-pipeline.ts     #     Pipeline state machine
│   │   └── sdd-workflow-test.md #   Workflow test specs
│   ├── package.json            #   Plugin dependencies
│   ├── bun.lock                #   Bun lockfile
│   ├── package-lock.json       #   npm lockfile
│   └── pnpm-lock.yaml          #   pnpm lockfile
│
├── skills/                     # 46 skills (45 engineering + 1 meta-skill)
│   ├── using-agent-skills/     #   META: skill discovery
│   ├── idea-refine/            #   DEFINE / EVOLVE
│   ├── spec-driven-development/#   DEFINE / EVOLVE
│   ├── agent-md-refactor/      #   DEFINE (PRE-FLIGHT)
│   ├── env-setup/              #   DEFINE (PRE-FLIGHT)
│   ├── clean-ddd-hexagonal/    #   DEFINE / PLAN / BUILD
│   ├── design-patterns/        #   DEFINE / PLAN / REVIEW
│   ├── architecture-diagrams/  #   DEFINE / PLAN / SHIP
│   ├── ui-ux-design-pro/       #   DEFINE / BUILD
│   ├── interview-me/           #   DEFINE / EVOLVE (extract requirements)
│   ├── doubt-driven-development/ # EVOLVE / BUILD (stress-test decisions)
│   ├── planning-and-task-breakdown/ # PLAN
│   ├── incremental-implementation/  # BUILD
│   ├── test-driven-development/     # BUILD
│   ├── source-driven-development/   # BUILD
│   ├── context-engineering/         # BUILD
│   ├── frontend-ui-engineering/     # BUILD
│   ├── api-and-interface-design/    # BUILD
│   ├── api-spec-generation/         # BUILD
│   ├── docker-optimize/             # BUILD / SHIP
│   ├── db-migration/                # BUILD / SHIP
│   ├── solid/                       # BUILD / REVIEW
│   ├── clean-code/                  # BUILD / REVIEW
│   ├── error-handling-patterns/     # BUILD / VERIFY / REVIEW
│   ├── design-taste-frontend/       # BUILD / VERIFY / REVIEW
│   ├── bash-defensive-patterns/     # BUILD / SHIP
│   ├── observability-and-instrumentation/ # BUILD / VERIFY / SHIP
│   ├── browser-testing-with-devtools/ # VERIFY / WEBPERF
│   ├── debugging-and-error-recovery/  # VERIFY
│   ├── code-review-and-quality/       # REVIEW
│   ├── code-simplification/           # SIMPLIFY
│   ├── security-and-hardening/        # REVIEW
│   ├── dependency-audit/              # REVIEW
│   ├── performance-optimization/      # REVIEW
│   ├── performance-analysis/          # REVIEW
│   ├── refactoring-patterns/          # SIMPLIFY
│   ├── git-workflow-and-versioning/   # SHIP
│   ├── changelog-generate/            # SHIP
│   ├── ci-cd-and-automation/          # SHIP
│   ├── deprecation-and-migration/     # SHIP
│   ├── documentation-and-adrs/        # SHIP / EVOLVE
│   ├── shipping-and-launch/           # SHIP
│   ├── incident-response/             # SHIP / VERIFY
│   ├── crafting-effective-readmes/    # DEFINE / SHIP
│   ├── xlsx/                          # EXTRA
│   └── excel-analysis/                # EXTRA
│
├── references/                 # 59 technical reference files
│   ├── testing-patterns.md
│   ├── security-checklist.md
│   ├── performance-checklist.md
│   ├── accessibility-checklist.md
│   ├── clean-code.md
│   ├── code-smells.md
│   ├── design-patterns.md
│   ├── solid-principles.md
│   ├── error-handling.md
│   ├── tdd.md
│   ├── architecture.md
│   ├── DDD-STRATEGIC.md
│   ├── DDD-TACTICAL.md
│   ├── HEXAGONAL.md
│   ├── CQRS-EVENTS.md
│   ├── refactoring-smell-catalog.md
│   ├── component-patterns.md
│   ├── color-system.md
│   ├── typography.md
│   └── ... (59 files total — see references/ for the full list)
│
├── docs/                       # Project documentation
│   ├── APPFLOW.md              #   Application flow
│   ├── ARCHITECTURE.md         #   System architecture decisions
│   ├── CODE_STYLE.md           #   Coding conventions
│   ├── DESIGN.md               #   Design directions
│   ├── PRD.md                  #   Product requirements
│   ├── SCHEMA.md               #   Data schema
│   ├── TRD.md                  #   Technical requirements
│   ├── WORKFLOW.md             #   Implementation workflow
│   └── opencode/               #   OpenCode configuration guides
│       ├── USER_GUIDE.md       #     Complete Reference Guide
│       ├── 00-setup.md
│       ├── 01-agents.md
│       ├── 02-orchestration-patterns.md
│       ├── 03-agent-index.md
│       ├── 04-commands.md    #     Command creation guide
│       ├── 05-skills.md
│       ├── 06-mcp-servers.md
│       ├── 07-models.md
│       ├── 08-rules.md
│       ├── 09-tools-and-custom-tools.md
│       └── 10-permissions.md
│
├── specs/                      # Project specifications
│   ├── spec-xx.md              #   Feature specs
│   ├── adr/                    #   Architecture Decision Records
│   │   └── adr-xxx.md          #     Template
│   └── design/                 #   Design docs
│       ├── components.md
│       ├── style-guide.md
│       └── user-flow.md
│
├── scripts/                    # Helper scripts
│   ├── build.sh
│   ├── lint.sh
│   ├── setup.sh
│   └── test.sh
│
├── tasks/                      # Task tracking
│   ├── plan.md                 #   Current plan
│   └── todo.md                 #   Todo list
│
├── src/                        # Source code
└── tests/                      # Tests
```

For OpenCode configuration details (commands, agents, skill loading), see [00-setup.md](./00-setup.md). For command creation, see [04-commands.md](./04-commands.md). For skill anatomy (sections, frontmatter, naming), see [05-skills.md](./05-skills.md).

---

## Troubleshooting

See [00-setup.md](./00-setup.md#troubleshooting) for common issues and solutions.

---

## Reporting Issues

Open an [issue](https://github.com/Fisherk2/spec-driven-develop-opencode-workspace/issues) if you find:

- A skill that provides incorrect or outdated guidance
- Missing coverage for a common engineering workflow
- Inconsistencies between skills

---

## Reference

Quick-reference material that skills pull in when needed:

| Document | Covers |
|----------|--------|
| [using-agent-skills (Meta-Skill)](../../skills/using-agent-skills/SKILL.md) | Skill discovery decision tree, core operating behaviors, failure modes, lifecycle sequence, and Quick Reference table of all skills |
| [testing-patterns.md](../../references/testing-patterns.md) | Test structure, naming, mocking, React/API/E2E examples, anti-patterns |
| [security-checklist.md](../../references/security-checklist.md) | Pre-commit checks, auth, input validation, headers, CORS, OWASP Top 10 |
| [performance-checklist.md](../../references/performance-checklist.md) | Core Web Vitals targets, frontend/backend checklists, measurement commands |
| [accessibility-checklist.md](../../references/accessibility-checklist.md) | Keyboard nav, screen readers, visual design, ARIA, testing tools |
| [02-orchestration-patterns.md](./02-orchestration-patterns.md) | Agent personas, orchestration patterns, and decision matrix |
| [03-agent-index.md](./03-agent-index.md) | Complete classified catalog of all 102+ agents |
| [00-setup.md](./00-setup.md) | OpenCode configuration, commands, agents, skill loading |
| [04-commands.md](./04-commands.md) | Command creation guide, frontmatter format, anatomy, best practices |
| [05-skills.md](./05-skills.md) | Skill creation, format specification, frontmatter, anatomy, naming conventions |

---

## License

MIT — use these skills in your projects, teams, and tools. By contributing, you agree your contributions are licensed under the MIT License.
