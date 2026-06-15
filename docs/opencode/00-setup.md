# OpenCode Setup

This guide explains how to configure OpenCode for this template — slash commands, agent personas, skills, and the complete SDD workflow.

> **For a complete reference of all skills and commands**, see [USER_GUIDE.md](./USER_GUIDE.md).

---

## Prerequisites

- **OpenCode IDE** — The only IDE compatible with this template
- **Node.js >= 18** and **bun**
- **Git**

---

## What OpenCode Does Automatically

### 1. Loads Slash Commands

The `commands/` directory is automatically detected by OpenCode. Type `/` in the chat to see all available commands:

| Command | Phase | What it does |
|---------|-------|--------------|
| `/spec` | DEFINE | Creates a structured specification before writing code |
| `/design` | DESIGN | Creates UI/UX design specifications with fan-out to specialist subagents |
| `/plan` | PLAN | Breaks specifications into small, ordered tasks |
| `/build` | BUILD | Incremental implementation with TDD |
| `/test` | VERIFY | Writes failing tests, implements, refactors |
| `/review` | REVIEW | Multi-axis code review before merge |
| `/code-simplify` | REVIEW | Simplifies complex code without changing behavior |
| `/ship` | SHIP | Pre-launch checklist, gradual deployment, monitoring |

Commands also automatically trigger complementary skills. For example, `/build` activates `incremental-implementation` plus `solid`, `error-handling-patterns`, `ui-ux-design-pro`, and others depending on the task.

### 2. Provides Agent Personas

The `agents/` directory contains **102+ agents**: 6 primary agents (SDD orchestration) and 96+ specialized subagents. The 6 main agents are directly invocable:

| Agent | Role | Command |
|-------|------|---------|
| `huitzilopochtli` | Supreme Orchestrator — pure delegation | Any task needing orchestration |
| `quetzalcoatl` | Visionary Architect — specs and design | `/spec`, `/design` |
| `moctezuma` | Strategic Commander — task breakdown | `/plan` |
| `tlaloc` | Rain God Builder — code implementation | `/build`, `/code-simplify` |
| `mictlantecuhtli` | Underworld Judge — testing and validation | `/test`, `/ship` |
| `tezcatlipoca` | Smoking Mirror Critic — code review | `/review` |

> For the complete subagent catalog (96 specialists in frontend, backend, devops, testing, security, etc.), see [03-agent-index.md](./03-agent-index.md).

Commands like `/review` and `/ship` automatically compose multiple agents.

### 3. Discovers Skills

The 46 skills live in `skills/<skill-name>/SKILL.md`. OpenCode agents receive instructions (via `AGENTS.md`) to:

1. Detect when a skill applies to the current task
2. Load the skill using the built-in `skill` tool
3. Follow the skill's workflow step by step

Skills are activated both through slash commands and automatically based on context — designing an API activates `api-and-interface-design`, building UI activates `frontend-ui-engineering`, debugging activates `debugging-and-error-recovery`, and so on.

---

## First Steps After Opening OpenCode

### 1. Clean up template files

Replace the template-specific content with your own project files:

#### README.md

Replace the **entire content** with your own project's README. The template's README contains project-specific branding and descriptions that don't apply to your project.

#### CONTRIBUTING.md

Replace the **entire content** with your own contribution guidelines, or delete the file if you don't need them.

#### CHANGELOG.md

Remove only the **version entries** (the tagged releases `[x.x.x]`), keeping the format definition and structure. Your changelog starts fresh with your own versions.

### 2. Configure opencode.json

Edit `opencode.json` to set your models, agents, context files, and MCP servers:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",

  // Primary models
  "model": "openrouter/openrouter/free",
  "small_model": "openrouter/z-ai/glm-4.5-air:free",

  // Per-agent model overrides (each agent can use a different model)
  "agent": {
    "huitzilopochtli": { "model": "openrouter/openrouter/free" },
    "quetzalcoatl":    { "model": "opencode/big-pickle" },
    "moctezuma":       { "model": "openrouter/deepseek/deepseek-v4-flash:free" },
    "tlaloc":          { "model": "opencode/mimo-v2.5-free" },
    "mictlantecuhtli": { "model": "opencode/mimo-v2.5-free" },
    "tezcatlipoca":    { "model": "opencode/big-pickle" }
  },

  // Context files loaded on startup
  "instructions": [
    "CONTRIBUTING.md",
    "WORKFLOW.md",
    "SPEC.md"
  ],

  // MCP servers (add the ones you need)
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "enabled": true
    }
  }
}
```

**Customization tips:**
- Execute `opencode models` to search connected LLMs and providers
- Add MCP servers as needed — see [06-mcp-servers.md](./06-mcp-servers.md) for all options

### 3. Install Plugin Dependencies

```bash
cd .opencode && bun install && cd ..
```

### 4. Configure Context7 (Optional but Recommended)

Context7 provides up-to-date documentation for any library or framework:

```bash
npx ctx7@latest setup
```

Once configured, the `find-docs` skill automatically retrieves current API documentation when you ask about any library.

### 5. Start with the Meta-Skill

Load the [Meta-Skill](../../skills/using-agent-skills/SKILL.md) to discover which skill applies to your current task. It contains:
- A **decision tree** that maps task types (implement code, design API, debug, etc.) to the appropriate skill
- **Core operational behaviors** that apply to all skills (surface assumptions, manage confusion, object)
- A **Quick Reference** table that summarizes each skill by phase

> This is the canonical entry point for skill discovery. Both agents and humans should consult it when unsure which skill applies.

### 6. Run Your First Workflow

```bash
/spec "Describe what you want to build"
/plan
/build
/test
/review
/ship
```

---

> **📖 For the complete anatomy of skills (diagram, key principles, how skills work):** see [USER_GUIDE.md > Skills Reference](./USER_GUIDE.md#skills-reference). This setup guide focuses only on OpenCode configuration.

---

## Configuration Files

### opencode.json

The main configuration file. Key parameters:

| Parameter | Purpose | Required |
|-----------|---------|:--------:|
| `model` | Primary model used by agents | ✅ |
| `small_model` | Fast/cheap model for lightweight tasks | ✅ |
| `agent` | Per-agent model overrides | ✅ |
| `instructions` | Context files loaded on startup | ✅ |
| `mcp` | MCP server connections | Optional |

See [07-models.md](./07-models.md) for model configuration details and [06-mcp-servers.md](./06-mcp-servers.md) for MCP server options.

### AGENTS.md

This file defines agent personas, their rules, and orchestration. It instructs agents to:
- Always check if a skill applies before acting
- Follow skills exactly when they apply
- Never skip required workflows (spec, plan, test)
- Surface assumptions and actively manage confusion

### .opencode/package.json

Contains the required OpenCode plugin dependency:

```json
{
  "dependencies": {
    "@opencode-ai/plugin": "1.15.0"
  }
}
```

---

## Troubleshooting

| Problem | Possible Cause | Solution |
|---------|----------------|----------|
| `/spec` doesn't work | Plugin not installed | Run `cd .opencode && bun install` |
| Context7 quota error | API limit reached | Run `npx ctx7@latest login` or set `CONTEXT7_API_KEY` |
| Skills won't load | Wrong path or session not restarted | Use `skills/<skill-name>/SKILL.md` path, then restart OpenCode |
| New skills not recognized | Session cached before install | Restart OpenCode after adding or updating skills in `skills/` |
| Agent not found or not available | Agent disabled or hidden in `opencode.json` | Check `opencode.json` for `"disable": true` or `"hidden": true` on the agent |

> **For more troubleshooting (Jupyter MCP, Excel MCP, Git issues):** see [USER_GUIDE.md](./USER_GUIDE.md#troubleshooting).

---

## Related Documentation

| Guide | Covers |
|------|--------|
| [Meta-Skill (using-agent-skills)](../../skills/using-agent-skills/SKILL.md) | Decision tree for skill discovery, core operational behaviors, failure modes, and Quick Reference index of all skills |
| [USER_GUIDE.md](./USER_GUIDE.md) | Complete reference of the 46 skills, commands, and workflows |
| [02-orchestration-patterns.md](./02-orchestration-patterns.md) | Agent personas, orchestration patterns, and decision matrix |
| [03-agent-index.md](./03-agent-index.md) | Complete catalog of the 102+ agents classified by domain |