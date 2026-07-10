# Getting Started

This guide walks you through installing the Códice workspace template and running your first SDD (Spec-Driven Development) cycle.

## Prerequisites

Before installing Códice, you need **OpenCode** installed on your system. OpenCode is the AI-assisted development harness that Códice extends with agents, commands, and skills.

- **[Install OpenCode](https://opencode.ai/docs/installation)** — follow the official installation guide for your platform
- **Verify the installation** by running `opencode --version` in your terminal

> Códice does not require Bun, Node.js, or any runtime to be pre-installed on the target machine. The installer is distributed as a standalone binary or via `bunx`/`npx` and handles everything itself.

## Install the Workspace

Open a terminal in the project directory where you want to install the workspace, then run:

```bash
bunx @fisherk2-dev/codice
```

If you do not have Bun installed, use the npm equivalent:

```bash
npx @fisherk2-dev/codice
```

The installer launches an interactive menu with three options:

1. **Clean Install** — Installs the complete workspace into an empty directory. All mandatory and standard files are copied. Optional files are presented as a checklist for you to choose from.
2. **Project Install** — Merges the template into an existing project. Mandatory files overwrite existing ones. Standard files are copied only if they do not already exist. Optional files are presented as a checklist.
3. **Update Workspace** — Updates an existing Códice workspace to the latest version. Only mandatory files are overwritten. Standard files are preserved if they exist. Optional files are never touched.

After you select a mode, the installer copies files, generates symlinks, and creates a `.gitignore` tailored for OpenCode development. No existing project files are modified without your consent.

### Command-Line Flags

For non-interactive use (scripts, CI), the installer supports these flags:

| Flag | Description |
|------|-------------|
| `--dest <path>` | Target directory (default: current directory) |
| `--mode <mode>` | Skip the menu — `clean`, `project`, or `update` |
| `--force` | Skip confirmations and include all optional files |
| `--verbose` | Show detailed logs of every operation |
| `--version` | Print the installed version and exit |
| `--help` | Show usage instructions |

Example — clean install in a specific directory without interactive prompts:

```bash
bunx @fisherk2-dev/codice --dest ./my-project --mode clean --force
```

## What Gets Installed

After installation, your project directory contains these new files and folders:

```
your-project/
├── opencode.json              # Main configuration (models, permissions, MCP servers)
├── AGENTS.md                  # Project-level agent instructions
├── SPEC.md                    # Central specification document
├── CONTRIBUTING.md            # Contribution guidelines
├── CHANGELOG.md               # Version history
├── docs/                      # Documentation templates
├── specs/                     # Modular specifications and ADRs
├── tasks/                     # Task breakdowns (created by /plan)
├── references/                # Engineering reference materials
├── .opencode/
│   ├── plugins/               # SDD pipeline and orchestrator plugins
│   └── agents/ → agents/      # Symlink to agents directory
├── agents/                    # 6 primary agents + 96+ subagents
├── commands/                  # 12 SDD slash commands
└── skills/                    # 45+ engineering skills
```

For a detailed breakdown of every file and directory, see [Workspace Structure](Workspace-Structure).

## First Steps

Once the workspace is installed, open your project in OpenCode and follow these steps:

### 1. Run `/help`

Start by running the `/help` command to see all available slash commands and their descriptions. This gives you an overview of the entire SDD workflow at a glance.

### 2. Activate MCP Servers (Optional)

The template ships with 4 pre-configured MCP servers in `opencode.json`. Only `context7` (documentation queries) is enabled by default. If your project needs browser debugging, spreadsheet manipulation, or Jupyter notebooks:

1. Check [MCP Servers](MCP-Servers) for per-server prerequisites
2. Set `"enabled": true` for the server you need in `opencode.json`
3. Restart OpenCode

> Most projects only need `context7` (already enabled). Activate others on demand to conserve context.

### 3. Run `/spec` to Define Your Project

The first SDD cycle phase is specification. Run:

```
/spec
```

This activates **Quetzalcoatl** (the Visionary Sage), who will:

- Analyze your project state
- Ask clarifying questions about your goals, users, and constraints
- Generate a structured `SPEC.md` with objectives, commands, architecture, code style, testing strategy, and boundaries
- Create supporting documentation (`docs/ARCHITECTURE.md`, `docs/CODE_STYLE.md`, etc.)
- Create modular specs in `specs/` and Architecture Decision Records in `specs/adr/`

The `/spec` command is for **new projects or projects in the conception phase**. If your project already has stable code and releases, use `/evolve` instead.

### 4. Run `/plan` to Break the Spec into Tasks

Once your specification is ready, run:

```
/plan
```

This activates **Moctezuma** (the Strategist), who will:

- Analyze the dependency graph between components
- Slice work into small, independent, verifiable tasks
- Write each task with acceptance criteria and verification steps
- Save the plan to `tasks/plan.md` and `tasks/todo.md`
- Present the plan for your review before saving

### 5. Run `/build` to Implement

With a plan in place, run:

```
/build
```

This activates **Tlaloc** (the Builder), who works through each task incrementally using TDD (Test-Driven Development):

- Pick the next pending task from the plan
- Write a failing test (RED)
- Implement the minimum code to pass (GREEN)
- Run the full test suite to check for regressions
- Commit and mark the task complete
- Move to the next task

### Continue the SDD Cycle

After building, continue through the remaining SDD phases:

| Command | Phase | Agent | Purpose |
|---------|-------|-------|---------|
| `/test` | Validate | Mictlantecuhtli | Write tests, fix bugs using Prove-It pattern |
| `/code-simplify` | Simplify | Tlaloc | Refactor code for clarity |
| `/webperf` | Optimize | Mictlantecuhtli | Run web performance audits |
| `/review` | Review | Tezcatlipoca | Five-axis code review |
| `/ship` | Ship | Mictlantecuhtli | Pre-launch checklist and go/no-go decision |

Each command suggests the next logical step when it finishes, guiding you through the full cycle without needing to consult documentation.

## Next Steps

- [Configuration](Configuration) — Models, permissions, agents, and MCP settings
- [SDD Pipeline](SDD-Pipeline) — How the orchestration plugin works
- [MCP Servers](MCP-Servers) — Activate pre-configured servers and add new ones
- [Workspace Structure](Workspace-Structure) — Learn what each file and directory does
- [Commands](Commands) — Detailed reference for all 12 slash commands
- [Agents](Agents) — Understand each agent's role, permissions, and recommended models
- [Customization Guide](Customization-Guide) — Adapt the workspace to your team's workflow

For OpenCode-specific questions (agent configuration, permission model, MCP servers), refer to the [official OpenCode documentation](https://opencode.ai/docs).
