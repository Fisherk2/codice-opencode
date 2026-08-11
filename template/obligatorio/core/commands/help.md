---
description: Welcome the user, explain Códice, and guide them through workspace.
agent: huitzilopochtli
---

## Pre-Flight: Detect Context

1. Welcome the user with a friendly greeting. 
2. Fetch the latest information about Códice from the [official repository](https://github.com/Fisherk2/codice-opencode) to explain what the workspace is about.
3. Provide a brief summary of Códice including:
   - What it is (SDD workspace installer for OpenCode)
   - Where to find more information:
     - 📖 Wiki: https://github.com/Fisherk2/codice-opencode/wiki
     - 📦 Official Repo: https://github.com/Fisherk2/codice-opencode
     - 📧 Dev Email: dev@fisherk2.com
4. Detect project state by reading the project's documentation (`SPEC.md`, `AGENTS.md`, `docs/`).

## Phase 1: Interactive Help Menu

Use the `question` tool to ask the user: **"What do you need?"** with these exact 6 options:

### A) How do I use Códice?
Explain how to configure and use the Códice workspace:
- Read the [Códice Wiki Getting Started](https://github.com/Fisherk2/codice-opencode/wiki/Getting-Started) guide for up-to-date instructions
- Explain the basic workflow: install → configure → run commands → iterate

### B) Give me a summary of this project's status
**Delegate** `codebase-onboarding-engineer` subagent (if exist) to read the user's project documentation and provide a human-readable summary

- Always communicate in clear, non-technical language suitable for a person
- Always explain the project's purpose, current state, and next steps
- Never mention technical details like file structure or code snippets

### C) What is the next step for this project?
**Delegate** `codebase-onboarding-engineer` subagent (if exist) to read the user's project and provide a step-by-step recommendation guide:
- Analyze the current project state (same detection logic as option B)
- Provide concrete next steps using [Códice Commands](https://github.com/Fisherk2/codice-opencode/wiki/Commands) as the primary guide, each suggestion must reference a specific Códice command

### D) How do I install a Skill?
Research the [Códice Wiki Skills page](https://github.com/Fisherk2/codice-opencode/wiki/Skills) and provide step-by-step instructions.
- If the wiki is insufficient, use [OpenCode official docs](https://opencode.ai/docs/) as the authoritative source

### E) How do I install a command?
Research the [Códice Wiki Commands page](https://github.com/Fisherk2/codice-opencode/wiki/Commands) and provide step-by-step instructions.
- If the wiki is insufficient, use [OpenCode official docs](https://opencode.ai/docs/) as the authoritative source

### F) How do I install a primary Agent or Subagent?
Research the [Códice Wiki Agents page](https://github.com/Fisherk2/codice-opencode/wiki/Agents) and provide step-by-step instructions.
- If the wiki is insufficient, use [OpenCode official docs](https://opencode.ai/docs/) as the authoritative source

## Rules

1. `/help` is read-only — does not modify files or change project state
2. DO NOT WRITE ANY FILES — only describe, explain, and suggest next steps
3. Always research the [Códice Wiki](https://github.com/Fisherk2/codice-opencode/wiki) for current information before answering
4. If the wiki is insufficient, use [OpenCode official documentation](https://opencode.ai/docs/) as the authoritative fallback
5. If you cannot find the answer in the wiki or official docs, say "I don't know" and suggest the user ask the community
6. The `question` tool must present EXACTLY the 6 labeled options (A through F) with their full descriptions

## Suggested Next Step

> You have explored the Códice help center. Run `/spec` to start a new project, or run `/plan` to break down an existing spec into tasks.
