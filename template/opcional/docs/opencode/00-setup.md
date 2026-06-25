# OpenCode Setup

This guide explains how to configure OpenCode for this template — slash commands, agent personas, skills, and the complete SDD workflow.

> **For a complete reference of all skills and commands**, see [USER_GUIDE.md](./USER_GUIDE.md).

---

## Prerequisites

- **OpenCode IDE** — The only IDE compatible with this template
- **Node.js >= 18** and **bun**
- **Git**

---

## First Steps Before Opening OpenCode (After Install Códice Workspace)

### 1. Configure opencode.json

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

### 2. Install Plugin Dependencies

```bash
cd .opencode && bun install && cd ..
```

### 3. Configure Context7 (Optional but Recommended)

Context7 provides up-to-date documentation for any library or framework:

```bash
npx ctx7@latest setup
```

Once configured, the `find-docs` skill automatically retrieves current API documentation when you ask about any library.

### 4. Start with the Meta-Skill

Load the [Meta-Skill](../../skills/using-agent-skills/SKILL.md) to discover which skill applies to your current task. It contains:
- A **decision tree** that maps task types (implement code, design API, debug, etc.) to the appropriate skill
- **Core operational behaviors** that apply to all skills (surface assumptions, manage confusion, object)
- A **Quick Reference** table that summarizes each skill by phase

> This is the canonical entry point for skill discovery. Both agents and humans should consult it when unsure which skill applies.

### 5. Run Your First Workflow

```bash
/spec "Describe what you want to build"
/plan
/build
/test
/code-simplify
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