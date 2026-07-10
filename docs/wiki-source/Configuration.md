# Configuration

The workspace behavior is controlled by `opencode.json` at the project root — the main configuration file for OpenCode. This page explains the key sections and how to customize them for your project.

> For the full configuration reference, see [opencode.ai/docs/configuration](https://opencode.ai/docs/configuration).

---

## Overview

`opencode.json` is the single source of truth for how OpenCode runs in your workspace. It defines which AI models to use, how agents behave, what commands are available, and what security boundaries are in place.

The workspace template ships with a pre-configured `opencode.json` that you can customize. Here are the key sections:

---

## Core Settings

### `model` — Default AI Model

```json
"model": "nvidia/stepfun-ai/step-3.7-flash"
```

The `model` field sets the main AI model used for general chat and tasks. It uses the format `<provider>/<model-id>`. This model is the default for all interactions unless an agent or command overrides it.

**Common values:**

| Value | Description |
|-------|-------------|
| `nvidia/stepfun-ai/step-3.7-flash` | Default: NVIDIA-hosted StepFun Flash |
| `openrouter/anthropic/claude-sonnet-4` | Anthropic Claude via OpenRouter |
| `openrouter/openai/gpt-5` | OpenAI GPT-5 via OpenRouter |
| `openrouter/deepseek/deepseek-v4-flash` | DeepSeek V4 Flash via OpenRouter |

### `small_model` — Lightweight Model

```json
"small_model": "openrouter/openrouter/free"
```

The `small_model` is used for low-complexity operations — quick file reads, simple classification, or other tasks where full model capability is unnecessary. This saves cost and improves responsiveness.

### `compaction` — Context Window Management

```json
"compaction": {
  "auto": true,
  "prune": true,
  "reserved": 10000
}
```

| Field | Description |
|-------|-------------|
| `auto` | Automatically compact the conversation when approaching the token limit |
| `prune` | Remove older, less relevant messages instead of summarizing them |
| `reserved` | Minimum number of tokens to reserve for the next response (10,000 by default) |

Increasing `reserved` gives the model more room for long responses but triggers compaction sooner. Decreasing it postpones compaction but may truncate responses.

---

## Provider Configuration

The `provider` section defines available AI model providers and their per-model options. The template ships with **7 pre-configured providers**:

| Provider | Models Available |
|----------|-----------------|
| `anthropic` | Claude Haiku 4.5, Opus 4.6, Sonnet 4, Sonnet 4.6 |
| `deepseek` | DeepSeek V4 Flash, V4 Flash Free, V4 Pro |
| `google` | Gemini 3.1 Pro, Gemini 3.5 Flash |
| `minimax` | MiniMax M2.5, M2.7, M3 |
| `moonshot` | Kimi K2.5, K2.6 |
| `openai` | GPT-5, GPT-5.1 Codex, GPT-5.3 Codex, GPT-5.4 Mini, GPT-5.5 Pro |
| `z-ai` | GLM 5.1 |

### Per-Model Options

Each model can have its own options and **variants** — named configurations optimized for different workloads:

```json
"deepseek": {
  "models": {
    "deepseek-v4-flash": {
      "options": {
        "thinking": { "type": "enabled" },
        "reasoningEffort": "medium"
      },
      "variants": {
        "deep-think": {
          "thinking": { "type": "enabled" },
          "reasoningEffort": "high"
        },
        "economy": {
          "thinking": { "type": "disabled" },
          "reasoningEffort": "low"
        }
      }
    }
  }
}
```

**Variants** let you switch between modes without changing the model:

| Variant | Use Case |
|---------|----------|
| `deep-think` | Complex reasoning, architecture decisions, code review |
| `economy` | Quick responses, simple lookups, cost-sensitive tasks |
| *(default)* | Balanced behavior with the model's standard options |

### Example: Switch to Anthropic Claude

If you want to use Claude as your primary model, replace the `model` value and ensure the Anthropic provider is configured:

```json
{
  "model": "openrouter/anthropic/claude-sonnet-4",

  "provider": {
    "anthropic": {
      "models": {
        "claude-sonnet-4": {
          "options": {
            "thinking": {
              "type": "adaptive",
              "budgetTokens": 8000,
              "display": "summarized"
            }
          },
          "variants": {
            "deep-think": {
              "thinking": {
                "type": "enabled",
                "budgetTokens": 16000
              }
            },
            "economy": {
              "thinking": {
                "type": "adaptive",
                "budgetTokens": 4000,
                "display": "none"
              }
            }
          }
        }
      }
    }
  }
}
```

The `budgetTokens` field controls how much the model can think before responding. Higher values produce better reasoning at the cost of latency.

---

## Agent Configuration

The `agent` section configures each primary agent individually:

```json
"agent": {
  "huitzilopochtli": {
    "model": "opencode-go/mimo-v2.5",
    "color": "#d3e22b",
    "temperature": 0.5,
    "steps": 20
  },
  "tlaloc": {
    "model": "opencode-go/deepseek-v4-flash",
    "color": "#00ffff",
    "temperature": 0.2,
    "steps": 40
  },
  "build": { "disable": true },
  "plan": { "disable": true },
  "general": { "disable": true }
}
```

| Field | Description |
|-------|-------------|
| `model` | Override the default model for this specific agent |
| `color` | UI accent color (hex) for agent messages |
| `temperature` | Creativity level (0.0 = deterministic, 1.0 = creative) |
| `steps` | Maximum execution steps before requiring user approval |
| `disable` | Hide or disable built-in agents (`build`, `plan`, `general`) |

The template disables three built-in OpenCode agents (`build`, `plan`, `general`) because the SDD pipeline's custom commands replace their functionality.

---

## Instructions — Project Context

```json
"instructions": [
  "CONTRIBUTING.md",
  "SPEC.md",
  "docs/WORKFLOW.md",
  "docs/TECH_DEBT.md",
  "docs/ARCHITECTURE.md",
  "docs/CODE_STYLE.md"
]
```

Files listed in `instructions` are loaded into the model's context on every interaction. They serve as persistent project knowledge — the model reads them automatically without being asked.

Add your own files here if there are documents you want the model to always know about (e.g., an API contract, a style guide, or a glossary).

---

## Permissions — Security Boundaries

The `permission` section controls what agents can do. It has two subsections:

### `permission.bash` — Shell Command Access

Defines granular allow/deny/ask rules for shell commands. The default configuration permits **safe read-only commands** like `ls`, `grep`, `cat`, `git status`, `curl`, and `jq`, while restricting destructive operations.

```json
"bash": {
  "*": "ask",
  "ls": "allow",
  "ls *": "allow",
  "grep *": "allow",
  "git status": "allow",
  "cat *": "allow",
  ...
  "env": "deny",
  "env *": "deny"
}
```

Three permission levels:

| Level | Meaning |
|-------|---------|
| `allow` | Agent can run without asking |
| `ask` | Agent must ask for approval before running |
| `deny` | Agent cannot run regardless of approval |

### `permission.read` — File Read Access

Controls which files agents can read. The default denies access to sensitive credential files:

```json
"read": {
  "*": "allow",
  "*.env": "deny",
  ".npmrc": "deny",
  "*.pem": "deny",
  "*.key": "deny",
  "credentials.json": "deny",
  "service-account*.json": "deny"
}
```

This prevents agents from accidentally reading secrets, API keys, or private keys during their work.

---

## MCP Servers — Tool Connectivity

The `mcp` section configures Model Context Protocol servers that extend agent capabilities:

```json
"mcp": {
  "context7": {
    "type": "remote",
    "url": "https://mcp.context7.com/mcp",
    "enabled": true
  },
  "chrome-devtools": {
    "type": "local",
    "command": ["npx", "-y", "chrome-devtools-mcp@latest"],
    "enabled": false
  },
  "jupyter": {
    "type": "local",
    "command": ["uvx", "mcp-jupyter-notebook"],
    "enabled": false,
    "env": {
      "MCP_JUPYTER_SESSION_MODE": "server",
      "MCP_JUPYTER_BASE_URL": "http://localhost:8888"
    }
  }
}
```

The template enables `context7` (documentation queries) by default. Other MCP servers (`chrome-devtools`, `excel`, `jupyter`) are pre-configured but disabled — set `"enabled": true` to activate them.

---

## Common Customizations

### Change the Default Model

To switch from the default NVIDIA model to Claude Sonnet:

1. Change `"model"` to `"openrouter/anthropic/claude-sonnet-4"`
2. Ensure the `anthropic` provider section is present (it ships with the template)
3. Optionally set agent-specific models in the `agent` section

### Adjust Token Budgets

If agents are running out of thinking capacity:

```json
"claude-sonnet-4": {
  "options": {
    "thinking": {
      "type": "adaptive",
      "budgetTokens": 16000,   // Increase from default 8000
      "display": "summarized"
    }
  }
}
```

### Add a Custom Provider

To add a provider not shipped with the template, add a new entry to `provider`:

```json
"provider": {
  "my-provider": {
    "models": {
      "my-model": {
        "options": { "temperature": 0.7 }
      }
    }
  }
}
```

### Disable a Default Agent

If you don't use a particular primary agent:

```json
"agent": {
  "tezcatlipoca": {
    "disable": true
  }
}
```

---

## See Also

- [Workspace Structure](Workspace-Structure) — Directory layout and file descriptions
- [opencode.ai/docs/configuration](https://opencode.ai/docs/configuration) — Official OpenCode configuration reference
- [opencode.ai/docs/permissions](https://opencode.ai/docs/permissions) — Detailed permissions guide
