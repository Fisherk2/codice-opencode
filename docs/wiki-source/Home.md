# Códice Wiki

Welcome to the **Códice** workspace wiki. Códice is an [OpenCode](https://opencode.ai/docs) workspace template that installs a complete **Spec-Driven Development (SDD)** workflow into your project with a single command.

## What Is Códice?

Códice is a pre-configured OpenCode workspace — a curated collection of agents, slash commands, skills, and configuration files that together form a production-ready AI-assisted development environment. It does not replace OpenCode; it **extends** it by providing everything you need to start building with SDD methodology from day one.

The template includes:

- **6 primary agents** — specialist personas that orchestrate the SDD cycle (spec writing, planning, building, testing, reviewing, shipping)
- **96+ subagents** — domain experts for frontend, backend, DevOps, security, data science, mobile, and more
- **12 slash commands** — `/spec`, `/plan`, `/build`, `/test`, `/review`, `/ship`, and more — each wired to the right agent with a defined workflow
- **45+ engineering skills** — reusable workflow instructions for TDD, code review, security hardening, performance optimization, UI/UX design, and more
- **Pre-configured permissions** — read/write/bash access rules tuned for safe AI-assisted development
- **Multi-model provider configuration** — ready-to-use settings for Anthropic, DeepSeek, Google, OpenAI, MiniMax, Moonshot, and Z-AI models

## Who Is This For?

Códice is designed for:

- **Developers using OpenCode** who want a production-ready workspace without manual setup
- **Teams adopting SDD** who need consistent agent behaviors, command workflows, and quality gates across projects
- **Solo builders** who want AI-assisted development with TDD, code review, security auditing, and deployment checks wired in from the start
- **OpenCode newcomers** who want to see what a fully configured workspace looks like and learn by example

You do not need to know everything at once. The template is organized so you can start with the core SDD cycle (`/spec` → `/plan` → `/build` → `/test` → `/review` → `/ship`) and explore the rest as your project grows.

## What Problem Does It Solve?

Setting up an OpenCode workspace from scratch means manually creating agent files, writing command workflows, organizing skills, configuring permissions, and wiring everything together. Every new project repeats this effort. Updates become fragmented — your customizations mix with template changes, and there is no clean way to merge them.

Códice solves this by providing a **versioned, atomic installer** that:

- Installs the complete workspace with one command
- Classifies every file as **mandatory** (always overwritten), **standard** (copied only if missing), or **optional** (you choose what to include)
- Updates your existing workspace without overwriting your customizations
- Rolls back cleanly if an installation is interrupted

## The SDD Cycle at a Glance

Códice organizes development into a structured cycle of six core phases and three optional ones:

| Phase | Command | What Happens |
|-------|---------|--------------|
| Specify | `/spec` | Define requirements, architecture, and project conventions |
| Design | `/design` | Create UI/UX specifications (optional) |
| Plan | `/plan` | Break specs into ordered, verifiable tasks |
| Build | `/build` | Implement tasks using TDD (RED → GREEN → refactor) |
| Validate | `/test` | Write tests, fix bugs, prove correctness |
| Simplify | `/code-simplify` | Refactor for clarity (optional) |
| Optimize | `/webperf` | Audit and improve web performance (optional) |
| Review | `/review` | Five-axis code review (correctness, readability, architecture, security, performance) |
| Ship | `/ship` | Pre-launch checklist, parallel audits, go/no-go decision |

Each command suggests the next logical step when it finishes, guiding you through the cycle without needing to consult documentation.

## Quick Links

- [Getting Started](Getting-Started) — Install Códice and run your first SDD cycle
- [Workspace Structure](Workspace-Structure) — What gets installed and where
- [Configuration](Configuration) — Understanding `opencode.json` and agent settings
- [SDD Pipeline](SDD-Pipeline) — How the orchestration plugin works
- [MCP Servers](MCP-Servers) — Pre-configured servers, activation, and per-agent control
- [Agents](Agents) — The six primary agents, subagent catalog, and how to add new ones
- [Commands](Commands) — All 12 SDD slash commands and their workflows
- [Skills](Skills) — Engineering skills included in the template and how to add new ones
- [Customization Guide](Customization-Guide) — Recipes for adapting the workspace to your needs
- [Troubleshooting](Troubleshooting) — Common issues and solutions

## Learn More

Códice is built on top of [OpenCode](https://opencode.ai/docs). For documentation on OpenCode itself — including installation, agent configuration, permission models, MCP server setup, and the full API reference — visit the official OpenCode documentation.

---

*Códice is maintained by [Fisherk2](https://github.com/Fisherk2). Licensed under MIT.*
