# Agents in OpenCode

Agents are specialized AI assistants in OpenCode that can be configured for specific tasks and workflows. They allow you to create focused tools with their own prompts, models, and tool access.

> **Official documentation:** [opencode.ai/docs/agents](https://opencode.ai/docs/agents/)

---

## Agent Types

### Primary Agents

Primary Agents are the main assistants you interact with directly. You switch between them with **Tab**.

| Agent      | Mode     | Description                                  |
|------------|----------|---------------------------------------------|
| **Build**   | `primary` | Standard agent with all tools enabled |
| **Plan**    | `primary` | Analysis and planning agent, read-only |

### Subagents

Subagents are called by Primary Agents for specialized tasks or mentioned manually with `@mention`.

| Agent      | Mode       | Description                                         |
|------------|------------|-----------------------------------------------------|
| **General** | `subagent` | General-purpose agent, full tool access |
| **Explore** | `subagent` | Fast read-only agent for codebase exploration |

### Hidden System Agents

| Agent       | Function                          |
|-------------|----------------------------------|
| **Compaction** | Compresses long context       |
| **Title**     | Generates short session titles  |
| **Summary**   | Creates session summaries        |

---

## Configuring Agents

### Via JSON (opencode.json)

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "build": {
      "mode": "primary",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "{file:./prompts/build.txt}"
    },
    "plan": {
      "mode": "primary",
      "model": "anthropic/claude-haiku-4-20250514"
    },
    "code-reviewer": {
      "description": "Reviews code for best practices and potential issues",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "You are a code reviewer. Focus on security, performance, and maintainability.",
      "permission": {
        "edit": "deny",
        "bash": "deny"
      }
    }
  }
}
```

### Via Markdown (.opencode/agents/*.md)

Agents can also be defined as Markdown files:

- **Global:** `~/.config/opencode/agents/`
- **Per project:** `.opencode/agents/`

The filename becomes the agent name (e.g., `review.md` -> Agent `review`).

```markdown
---
description: Reviews code for quality and best practices
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
permission:
  edit: deny
  bash:
    "*": ask
    "git diff": allow
    "git log*": allow
  webfetch: deny
---

You are in code review mode. Focus on:

- Code quality and best practices
- Potential bugs and edge cases
- Performance implications
- Security considerations

Provide constructive feedback without making direct changes.
```

---

## Important Configuration Options

### Description (Required)

```json
"description": "Reviews code for best practices and potential issues"
```

### Model

Overrides the model per agent. If not specified, Primary Agents use the global model; Subagents use the model of the Primary Agent that calls them.

```json
"model": "anthropic/claude-haiku-4-20250514"
```

### Temperature

Controls creativity (0.0-1.0):
- **0.0-0.2:** Deterministic, ideal for code analysis
- **0.3-0.5:** Balanced, good for development
- **0.6-1.0:** Creative, good for brainstorming

### Max Steps

Limits agentic iterations:

```json
"steps": 5
```

### Permissions

```json
"permission": {
  "edit": "deny",
  "bash": {
    "*": "ask",
    "git status *": "allow",
    "git push *": "deny"
  },
  "webfetch": "deny"
}
```

Possible values: `"allow"`, `"ask"`, `"deny"`

### Task Permissions (Subagent Control)

Controls which Subagents an agent can call:

```json
"permission": {
  "task": {
    "*": "deny",
    "orchestrator-*": "allow",
    "code-reviewer": "ask"
  }
}
```

### Hidden

Hides a subagent from the `@` autocomplete menu:

```json
"hidden": true
```

### Color

```json
"color": "#ff6b6b"
```

---

## Create Agent (CLI)

```bash
opencode agent create
```

Interactive wizard that:
1. Asks if it's global or project-specific
2. Requests the description
3. Generates the system prompt
4. Configures tool access
5. Creates the Markdown file

---

## Best Practices

1. **Use separate models per agent:** Haiku for Plan/Explore, Sonnet/Opus for Build
2. **Minimum permissions:** Give agents only the tools they need
3. **Specific prompts:** The clearer the system prompt, the better the result
4. **Subagents for recurring tasks:** Code Review, Docs, Security Audit
5. **Use Task Permissions:** Control which subagents can be called
6. **Adjust temperature:** Low for analysis, high for creative tasks

---

## Agent Examples

Ready-to-use agent definitions can be found in [`skills/`](../../skills/).