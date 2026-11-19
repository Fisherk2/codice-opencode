# Getting Started

This guide walks you through installing the Códice workspace template and running your first SDD (Spec-Driven Development) cycle.

## Prerequisites

Before installing Códice, you need **OpenCode** installed on your system. OpenCode is the AI-assisted development harness that Códice extends with agents, commands, and skills.

- **[Install OpenCode](https://opencode.ai/v2/docs/)** — the official V2 intro page carries the install methods for your platform (curl, Homebrew, npm, Bun, standalone binaries)
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
| `--packs-all` | Select all 8 selectable agent packs non-interactively |
| `--update-add-packs <ids>` | Update mode: add new packs to an existing installation |
| `--force` | Skip confirmations. In Clean Install it also auto-selects **every** pack and **every** optional file (`CleanInstallUseCase.ts:40-41,66-67`); in Project Install it selects only the default pack and **no** optional files (`ProjectInstallUseCase.ts:42-43,69-70`) |
| `--verbose` | Show detailed logs of every operation |
| `--version`, `-V` | Print the installed version and exit |
| `--help`, `-h` | Show usage instructions |

Combining two mode flags (`--clean --project`, for example) is rejected as ambiguous rather than resolved by precedence: the CLI prints a usage error and exits with code `2` (`src/cli/parse-args.ts:164-167`, `src/cli/output.ts:24`). The same exit code covers a rejected `--dest` path, so path-traversal attempts fail with `2` too.

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
│   ├── agents/ → ../agents/     # Symlinks recreated post-install
│   ├── commands/ → ../commands/
│   └── skills/ → ../skills/
├── agents/                    # 155 by default (6 primary + 4 writers + 145 software-development); 359 if you select all 8 packs
├── commands/                  # 18 SDD slash commands
├── skills/                    # 61 engineering skills
└── .codice-version            # Installed version + selected packs; every update is gated on this file
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

Run `/help` inside OpenCode to see the 18 available commands.
There you will discover what you can do with Códice and where to start.

## Next Steps

- [Configuration](Configuration) — Models, permissions, agents, and MCP settings
- [MCP Servers](MCP-Servers) — Activate pre-configured servers and add new ones
- [Workspace Structure](Workspace-Structure) — Learn what each file and directory does
- [Commands](Commands) — Detailed reference for all 18 slash commands
- [Agents](Agents) — Understand each agent's role, permissions, and recommended models
- [Customization Guide](Customization-Guide) — Adapt models, permissions, skills, and commands to your project
- [Configuration](Configuration) — Configure models, agents, permissions, MCP, and more

For OpenCode-specific questions (agent configuration, permission model, MCP servers), refer to the [official OpenCode V2 documentation](https://opencode.ai/v2/docs/).
