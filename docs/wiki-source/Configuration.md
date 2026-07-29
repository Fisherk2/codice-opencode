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

| Provider | Models | Official Docs |
|----------|--------|---------------|
| `anthropic` | Claude Haiku 4.5, Opus 4.6, Sonnet 4, Sonnet 4.6 | [docs.anthropic.com](https://docs.anthropic.com/en/docs/about-claude/models) |
| `deepseek` | DeepSeek V4 Flash, V4 Flash Free, V4 Pro | [api-docs.deepseek.com](https://api-docs.deepseek.com/) |
| `google` | Gemini 3.1 Pro, Gemini 3.5 Flash | [ai.google.dev](https://ai.google.dev/gemini-api/docs/models) |
| `minimax` | MiniMax M2.5, M2.7, M3 | [platform.minimaxi.com](https://platform.minimaxi.com/document/Models) |
| `moonshot` | Kimi K2.5, K2.6 | [platform.moonshot.cn](https://platform.moonshot.cn/docs) |
| `openai` | GPT-5, GPT-5.1 Codex, GPT-5.3 Codex, GPT-5.4 Mini, GPT-5.5 Pro | [platform.openai.com/docs](https://platform.openai.com/docs/models) |
| `z-ai` | GLM 5.1 | [open.bigmodel.cn](https://open.bigmodel.cn/dev/api) |

> **⚠️ Provider configurations change frequently.** Each provider has its own parameter naming, model IDs, and authentication methods. The template provides a starting point, but always consult the official provider documentation linked above for the most up-to-date configuration options. Do not treat the examples in this page as authoritative — they may become outdated as providers update their APIs.

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

The `agent` section configures each primary agent individually. The template assigns specific models, temperatures, and step limits to each agent based on its role in the SDD cycle:

```json
"agent": {
  "huitzilopochtli": {
    "model": "opencode-go/mimo-v2.5",
    "color": "#d3e22b",
    "temperature": 0.5,
    "steps": 25
  },
  "quetzalcoatl": {
    "model": "opencode-go/qwen3.7-plus",
    "color": "#ffffff",
    "temperature": 0.3,
    "steps": 60
  },
  "moctezuma": {
    "model": "opencode-go/minimax-m3",
    "color": "#8B4513",
    "temperature": 0.1,
    "steps": 20
  },
  "tlaloc": {
    "model": "opencode-go/deepseek-v4-flash",
    "color": "#00ffff",
    "temperature": 0.2,
    "steps": 90
  },
  "mictlantecuhtli": {
    "model": "opencode-go/mimo-v2.5",
    "color": "#2d2d2d",
    "temperature": 0.2,
    "steps": 60
  },
  "tezcatlipoca": {
    "model": "opencode-go/glm-5.2",
    "color": "#ff3134",
    "temperature": 0.1,
    "steps": 50
  },
  "build": { "disable": true },
  "plan": { "disable": true },
  "general": { "disable": true }
}
```

### Agent Settings Reference

| Field | Description |
|-------|-------------|
| `model` | Override the default model for this specific agent |
| `color` | UI accent color (hex) for agent messages in the OpenCode interface |
| `temperature` | Creativity level (0.0 = deterministic, 1.0 = creative) |
| `steps` | Maximum execution steps before requiring user approval |
| `disable` | Hide or disable built-in OpenCode agents |

### Why These Settings?

Each agent's configuration reflects its role in the SDD pipeline:

| Agent | Model Choice | Temperature | Steps | Color | Rationale |
|-------|-------------|:-----------:|:-----:|:-----:|-----------|
| **Huitzilopochtli** | mimo-v2.5 (balanced) | 0.5 | 25 | 🟡 Yellow | Supreme orchestrator — needs balanced creativity to decide which subagent to invoke. Higher temperature for flexible delegation. Low step count because orchestration is quick. |
| **Quetzalcoatl** | qwen3.7-plus (powerful) | 0.3 | 60 | ⚪ White | Visionary Sage — spec writing and design. Low temperature for precise, structured output. Higher step count for comprehensive documentation generation. |
| **Moctezuma** | minimax-m3 (fast) | 0.1 | 20 | 🟤 Brown | Strategic Commander — task breakdown. Near-deterministic temperature for structured plan output. Fast model since planning is formulaic. |
| **Tlaloc** | deepseek-v4-flash (fast) | 0.2 | 90 | 🔵 Cyan | Rain God Builder — code implementation. Low temperature for correct code, highest step limit because building is multi-step (test→code→refactor). |
| **Mictlantecuhtli** | mimo-v2.5 (balanced) | 0.2 | 60 | ⚫ Dark | Underworld Judge — testing and validation. Low temperature for thorough verification. High step limit for complex test suites and ship checklist. |
| **Tezcatlipoca** | glm-5.2 (powerful) | 0.1 | 50 | 🔴 Red | Smoking Mirror Critic — code review. Near-deterministic for objective analysis. Moderate step count for thorough five-axis review. |

### Disabled Agents

The template disables three built-in OpenCode agents:

| Agent | Why Disabled |
|-------|-------------|
| `build` | Replaced by SDD pipeline's custom `/build` command (tlaloc) |
| `plan` | Replaced by SDD pipeline's custom `/plan` command (moctezuma) |
| `general` | No specific role — agents huitzilopochtli or tlaloc handle general-purpose tasks better |

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

## References — Skill Reference Material

The `reference` section configures local directories or Git repositories that agents can load as reference material. The template ships with **3 example entries** to demonstrate the available reference types:

```json
"reference": {
  "clean-code": {
    "path": "./skills/clean-code/references",
    "description": "Reference materials for clean code principles, naming, functions, and formatting"
  },
  "codice-opencode": {
    "url": "https://github.com/Fisherk2/codice-opencode",
    "branch": "main",
    "description": "Códice repository — OpenCode workspace installer reference"
  },
  "opencode": {
    "url": "https://github.com/anomalyco/opencode",
    "branch": "main",
    "description": "Official OpenCode repository — CLI, API, and configuration reference"
  }
}
```

> **Note:** These are examples — add your own references by editing `opencode.json`. The template does not ship with all 18 skill references pre-configured; users add the ones they need.

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `path` | For local refs | Relative path to the reference directory (from `opencode.json`) |
| `url` | For remote refs | Git repository URL to clone as a reference source |
| `branch` | ❌ | Git branch to use (default: repository default) |
| `description` | ✅ | Plain-language description to help the agent decide when to load this reference |
| `hidden` | ❌ | If `true`, hides the reference from TUI listings (default: `false`) |

### How to Use

In the OpenCode TUI, type `@<alias>` to load the reference material into the current conversation. For example, `@clean-code` loads all files from `skills/clean-code/references/`.

### Add a Custom Reference

To add your own reference directory:

```json
"reference": {
  "my-docs": {
    "path": "./docs/references",
    "description": "Project-specific architecture decisions and API contracts"
  }
}
```

Or a remote repository:

```json
"reference": {
  "my-org-docs": {
    "url": "https://github.com/my-org/technical-docs",
    "branch": "main",
    "description": "Organization-wide technical documentation"
  }
}
```

> **Official docs:** [opencode.ai/docs/references](https://opencode.ai/docs/references) — Full reference for the configuration format.

---

## Permissions — Security Boundaries

The `permission` section controls what agents can do. The template uses a **default-deny** model: most operations require explicit approval, while safe read-only commands are pre-approved.

### Permission Levels

| Level | Meaning |
|-------|---------|
| `allow` | Agent can execute without asking — used for safe, read-only operations |
| `ask` | Agent must ask for approval before executing — the default for most operations |
| `deny` | Agent cannot execute regardless of approval — used for sensitive or destructive operations |

### `permission.bash` — Shell Command Access

The bash allowlist permits safe, read-only commands automatically while blocking destructive operations. Commands NOT in the allowlist default to `ask`.

**Fully allowed (no prompt):**

| Category | Commands | Examples |
|----------|----------|---------|
| **File reading** | `cat`, `head`, `tail`, `less` equivalents | `cat package.json`, `head -n 20 log.txt` |
| **File search** | `grep`, `rg`, `ag`, `ack`, `fd`, `find` | `grep -r "TODO" src/` |
| **File info** | `file`, `stat`, `du`, `ls`, `tree`, `wc` | `ls -la`, `stat config.json` |
| **Text processing** | `sed`, `awk`, `sort`, `uniq`, `cut`, `tr`, `jq`, `diff`, `tee` | `jq '.name' package.json` |
| **Git read-only** | `git status`, `git diff`, `git log`, `git show`, `git blame`, `git branch`, `git tag` | `git log --oneline -5` |
| **GitHub CLI (read)** | `gh repo view`, `gh issue list`, `gh pr list`, `gh release list` | `gh pr view 42` |
| **Network (read)** | `curl`, `http`, `dig`, `nslookup`, `host` | `curl https://api.example.com` |
| **Process info** | `ps`, `lsof`, `uptime`, `free`, `uname`, `whoami`, `id`, `pwd` | `lsof -i :3000` |
| **Archive inspection** | `unzip -l`, `zipinfo`, `tar -tf` | `tar -tf archive.tar.gz` |
| **Path utilities** | `dirname`, `basename`, `realpath`, `which` | `which node` |

**Always denied (blocked):**

| Pattern | Blocks |
|---------|--------|
| `rm -rf`, `rm -fr`, `rm -fir` | Recursive force delete |
| `git push -f`, `git push --force` | Force push |
| `DROP TABLE`, `DROP DATABASE` | Database destruction |
| `mkfs`, `mkfs.*` | Disk formatting |
| `dd if=` | Disk destruction |
| `chmod -R 777 /` | Permission destruction |
| `env`, `env *`, `printenv *` | Environment variable leakage |
| File read/write of credential files | See [Credential Protection](#credential-protection) below |

### Credential Protection

The template blocks agents from reading or writing sensitive files across multiple categories:

| Category | Protected Patterns |
|----------|-------------------|
| **Environment files** | `.env`, `.env.*` (except `.env.example`) |
| **Package manager secrets** | `.npmrc`, `.git-credentials`, `.netrc` |
| **SSH keys** | `.ssh/id_*`, `.ssh/config` |
| **Cloud credentials** | `.aws/credentials`, `.kube/config`, `.docker/config.json` |
| **Database credentials** | `.pgpass` |
| **TLS/SSL keys** | `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.gpg`, `*.ovpn` |
| **Service accounts** | `credentials.json`, `service-account*.json` |

This prevents agents from accidentally reading or exposing secrets during their work, even in verbose or debug modes.

### `permission.task` — Subagent Delegation

The `task` permission controls which subagents a primary agent can invoke. The template sets a global deny:

```json
"task": {
  "*": "deny"
}
```

This means **no agent can delegate by default**. Primary agents that need delegation (huitzilopochtli, quetzalcoatl, tlaloc, mictlantecuhtli) have explicit allow rules in their agent file's YAML frontmatter, not in `opencode.json`. The global deny acts as a safety net — even if an agent file accidentally omits the restriction, delegation is blocked.

> **Official docs:** [opencode.ai/docs/permissions](https://opencode.ai/docs/permissions) — Full reference for the permission system.

---

## MCP Servers — Tool Connectivity

The `mcp` section configures Model Context Protocol servers that extend agent capabilities. The template ships with **9 pre-configured MCP servers** in `opencode.json`. Three are enabled by default; the rest must be activated on demand.

| Server | Type | Default | Purpose |
|--------|------|---------|---------|
| `context7` | Remote | ✅ Enabled | Documentation queries |
| `vercel-grep` | Remote | ✅ Enabled | GitHub code search across 1M+ repos |
| `gitmcp` | Remote | ✅ Enabled | GitHub repository documentation |
| `chrome-devtools` | Local | ❌ Disabled | Web performance & browser debugging |
| `excel` | Local | ❌ Disabled | Spreadsheet manipulation |
| `jupyter` | Local | ❌ Disabled | Jupyter notebook automation |
| `tavily` | Remote (OAuth) | ❌ Disabled | Real-time web search (API key) |
| `firecrawl` | Remote (OAuth) | ❌ Disabled | Web scraping and crawling (API key) |
| `codebase-memory-mcp` | Local (global install) | ❌ Disabled | Knowledge graph for codebase intelligence |

Three servers are enabled by default (`context7`, `vercel-grep`, `gitmcp`). To activate the others:

1. **Install prerequisites** (see [MCP Servers](MCP-Servers) for per-server requirements)
2. **Set `"enabled": true`** for the server you need in `opencode.json`
3. **Restart OpenCode**

> **Full guide:** [MCP Servers](MCP-Servers) covers activation steps, per-agent control, prerequisites, and which template features require which MCP server.

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

- [SDD Pipeline](SDD-Pipeline) — How the plugin orchestrates agents, blocks destructive commands, and validates subagents
- [MCP Servers](MCP-Servers) — Pre-configured servers, activation, and per-agent control
- [Workspace Structure](Workspace-Structure) — Directory layout and file descriptions
- [opencode.ai/docs/configuration](https://opencode.ai/docs/configuration) — Official OpenCode configuration reference
- [opencode.ai/docs/permissions](https://opencode.ai/docs/permissions) — Detailed permissions guide
- [opencode.ai/docs/mcp-servers/](https://opencode.ai/docs/mcp-servers/) — Official OpenCode MCP documentation
