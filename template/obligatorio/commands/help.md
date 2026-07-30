---
description: Show interactive help menu — discover what Códice is, start a new project, update workspace, learn the SDD cycle, list all commands, or get troubleshooting help
agent: huitzilopochtli
---

## Pre-Flight: Detect Context

1. Read project documentation to gain context about the user's current state (new project, existing project, etc.)
2. Adapt help suggestions based on context (workspace vs first-time)
3. If no context is found, assume first-time user

## Phase 1: Present the Help Menu

Use the `question` tool to present a decision menu with 6 options:

1. **"What is Códice?"** — Explain it's an SDD workspace installer for OpenCode with 6 primary agents + 98 subagents, 13 slash commands and 50+ skills. 
2. **"Start a new project"** — Run `/spec` to define requirements → `/plan` to break down specs → `/build` to implement → `/test` to validate
3. **"Update existing workspace"** — Run `bunx @fisherk2-dev/codice` in the project root to pull the latest template while preserving customizations
4. **"Explain the SDD cycle"** — 7 phases: Define → Plan → Build → Test → Review → Ship → Maintain. Each phase has a dedicated command and agent
5. **"List all 13 commands"** — `/spec`, `/design`, `/plan`, `/build`, `/test`, `/code-simplify`, `/review`, `/ship`, `/webperf`, `/docs-update`, `/diagnosis`, `/evolve`, `/help`
6. **"Troubleshooting & FAQ"** — See the [GitHub Wiki Troubleshooting Guide](https://github.com/fisherk2/codice-opencode/wiki/Troubleshooting) for common issues

After the user selects, provide the relevant information or suggestion. If the user is offline, option 6 includes offline troubleshooting steps (check logs, verify Bun version, re-run `just setup`).

## Rules

1. `/help` is read-only — does not modify files or change any project state
2. DO NOT WRITE ANY FILES — only describes, explains, and suggests next steps
3. Always link to GitHub wiki for deeper documentation when relevant
4. Answers the user's question directly with detailed information

## Suggested Next Step

> Run `/spec` to start a new project, or run `/plan` to break down an existing spec.
