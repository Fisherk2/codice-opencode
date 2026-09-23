# Getting Started

This guide walks you through installing the Códice workspace template and running your first SDD (Spec-Driven Development) cycle.

## Prerequisites

Before installing Códice, you need **OpenCode** installed on your system. OpenCode is the AI-assisted development harness that Códice extends with agents, commands, and skills.

- **[Install OpenCode](https://opencode.ai/docs/installation)** — follow the official installation guide for your platform
- **Verify the installation** by running `opencode --version` in your terminal

> Códice is distributed via npm and executed with `bunx @fisherk2-dev/codice`. Bun is the recommended runtime.

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

Clean and Project installs first show a **pack selection wizard**: choose which of the 8 agent packs to include (software-development is pre-selected by default; at least one pack is required). After confirming packs and optional files, the installer shows a **summary** — the selected packs with their agent counts, the always-included mandatory directories, and an estimate of total agents and files — before copying anything.

After you select a mode, the installer copies files, generates symlinks, and creates a `.gitignore` tailored for OpenCode development. No existing project files are modified without your consent.

### Command-Line Flags

For non-interactive use (scripts, CI), the installer supports these flags:

| Flag | Description |
|------|-------------|
| `--dest <path>` | Target directory (default: current directory) |
| `--clean` | Run Clean Install (empty directory), skip menu |
| `--project` | Run Project Install (merge into existing project), skip menu |
| `--update` | Run Update Workspace (refresh mandatory files), skip menu |
| `--packs <ids>` | Comma-separated pack ids; skips the pack selection wizard |
| `--packs-all` | Select all 8 agent packs non-interactively |
| `--update-add-packs <ids>` | Update mode: add new packs to an existing installation |
| `--force` | Skip confirmations and include all optional files |
| `--verbose` | Show detailed logs of every operation |
| `--version` | Print the installed version and exit |
| `--help` | Show usage instructions |

Example — clean install in a specific directory without interactive prompts:

```bash
bunx @fisherk2-dev/codice --dest ./my-project --clean --force
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
├── .opencode/
│   └── agents/ → agents/      # Symlink to agents directory
├── agents/                    # ~360 agents: 6 primary + 4 writer + ~350 subagents across 8 selectable packs
├── commands/                  # 17 SDD slash commands
└── skills/                    # 51 engineering skills
```

For a detailed breakdown of every file and directory, see [Workspace Structure](Workspace-Structure).

## First Steps

Once the workspace is installed, follow these steps to start working:

### 1. Adjust the parameters in opencode.json

Open `opencode.json` in your project root and review the model, agents, and permissions.
This file comes from the template (`template/obligatorio/core/opencode.json`) and ships with working defaults.
To change models or permissions, see [Configuration](Configuration).

### 2. Enable the MCPs and configure their env

The template includes 7 MCPs; 3 are enabled by default: context7, vercel-grep, and gitmcp.
To enable another one, set `"disabled": false` in its `opencode.json` entry and define its environment variables.
See [MCP Servers](MCP-Servers) for each server's requirements and configuration.

### 3. Start OpenCode

Open a terminal in your project directory and run `opencode`.

### 4. Run /help

Run `/help` inside OpenCode to see the 17 available commands.
There you will discover what you can do with Códice and where to start.

## Next Steps

- [Configuration](Configuration) — Models, permissions, agents, and MCP settings
- [MCP Servers](MCP-Servers) — Activate pre-configured servers and add new ones
- [Workspace Structure](Workspace-Structure) — Learn what each file and directory does
- [Commands](Commands) — Detailed reference for all 17 slash commands
- [Agents](Agents) — Understand each agent's role, permissions, and recommended models
- [Configuration](Configuration) — Configure models, agents, permissions, MCP, and more

For OpenCode-specific questions (agent configuration, permission model, MCP servers), refer to the [official OpenCode documentation](https://opencode.ai/docs).
