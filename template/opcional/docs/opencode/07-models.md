# Model Recommendations for OpenCode

OpenCode supports over 75 LLM Providers through AI SDK and Models.dev. Choosing the right model per agent and task has a major impact on quality and costs.

> **Official documentation:** [opencode.ai/docs/models](https://opencode.ai/docs/models/)

---

## Model Strategy: Right Models for Right Tasks

### The golden rule: Don't use the most expensive model everywhere

```
# Paid
Build Agent     -> Powerful model    (Sonnet 4.5, Opus 4.5, GPT 5.2)
Plan Agent      -> Economic model (Haiku 4.5, GPT 5.1 Codex)
Explore Agent   -> Economic model (Haiku 4.5)
Title/Summary Agent -> Smallest model (automatic via small_model)

# Open source
Build Agent     -> DeepSeek V4 Pro, Kimi K2.6 Thinking, Qwen3.6 Plus, GLM 5.1, Llama 4 Maverick
Plan Agent      -> DeepSeek R1, Kimi K2.6 Thinking, Qwen3.5 Plus, GLM 5.1
Explore Agent   -> DeepSeek V3.2, Llama 4 Scout, Qwen3.5 Plus (free version), Mistral Small
Title/Summary Agent -> Llama 3.2 3B Instruct, Gemma 4 4B/9B, Mistral Small, Qwen3 8B

# Free
Build Agent     -> opencode/deepseek-v4-flash-free / opencode/big-pickle / openrouter/qwen/qwen3-coder-480b:free / openrouter/meta-llama/llama-3.3-70b-instruct:free
Plan Agent      -> opencode/big-pickle / opencode/nemotron-3-super-free / openrouter/deepseek/deepseek-r1:free / openrouter/mistral/mistral-small-24b:free
Explore Agent   -> opencode/nemotron-3-super-free / opencode/deepseek-v4-flash-free / openrouter/meta-llama/llama-4-scout:free / openrouter/google/gemini-2.0-flash:free
Title/Summary Agent -> opencode/deepseek-v4-flash-free / openrouter/z-ai/glm-4.5-air:free / openrouter/google/gemma-3-12b:free
```

### Configuration in opencode.json

#### For paid models

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "anthropic/claude-sonnet-4-5-20250929",
  "small_model": "anthropic/claude-haiku-4-5-20250929",
  "agent": {
    "build": {
      "model": "anthropic/claude-sonnet-4-5-20250929"
    },
    "plan": {
      "model": "anthropic/claude-haiku-4-5-20250929"
    }
  }
}
```

#### For free models

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "opencode/deepseek-v4-flash-free",
  "small_model": "openrouter/z-ai/glm-4.5-air:free",
  "agent": {
    "build": {
      "model": "opencode/deepseek-v4-flash-free"
    },
    "plan": {
      "model": "opencode/big-pickle"
    },
    "explore": {
      "model": "opencode/nemotron-3-super-free"
    }
  }
}
```

---

## Token Optimization

### 1. small_model for system tasks

```json
{
  "small_model": "anthropic/claude-haiku-4-5-20250929"
}
```

Automatically used for title generation and light tasks.

### 2. Economic models for Subagents

Subagents by default inherit the model of the Primary Agent that calls them. Override this:

```json
{
  "agent": {
    "explore": {
      "model": "anthropic/claude-haiku-4-5-20250929"
    },
    "general": {
      "model": "anthropic/claude-haiku-4-5-20250929"
    }
  }
}
```

### 3. Limit Steps

`steps` controls the maximum number of agentic iterations an agent can execute. When the limit is reached, the agent must summarize its work and list remaining tasks.

**Recommended Steps limits by agent type:**

| Agent Type       | Steps | Justification                               |
|------------------|-------|--------------------------------------------|
| Code writing agents | unlimited | Should iterate until code is ready |
| Review/Analysis agents | 10-15  | Read, analyze, create report             |
| Orchestration agents  | 5-10   | Delegate, don't execute themselves        |
| Docs/Fast agents     | 5-10   | Quick, focused tasks               |
| Debugging agents    | 15-20  | Need more steps for trace analysis    |

```json
{
  "agent": {
    "code-reviewer": {
      "steps": 15,
      "model": "anthropic/claude-sonnet-4-5-20250929"
    },
    "context-manager": {
      "steps": 5,
      "model": "anthropic/claude-haiku-4-5-20250929"
    },
    "debugger": {
      "steps": 20,
      "model": "anthropic/claude-sonnet-4-5-20250929"
    }
  }
}
```

### 4. Configure Compaction

Compaction automatically compresses conversation context when it becomes too long. Without compaction, a long session can exceed the token limit.

```json
{
  "compaction": {
    "auto": true,
    "prune": true,
    "reserved": 10000
  }
}
```

| Option    | Description                                       |
|-----------|---------------------------------------------------|
| `auto`    | Automatic compaction when context is long |
| `prune`   | Delete old messages after compaction |
| `reserved` | Minimum tokens reserved for new messages (default: 10000) |

### 5. Use MCP Servers with moderation

Each MCP Server adds its tool descriptions to the context. This is often 500-2000 tokens per server. With 10 servers, that's 5000-20000 tokens sent on EVERY request.

**Strategy:** Disable MCP Servers globally and enable them only for specific agents:

```json
{
  "tools": {
    "my-mcp*": false
  },
  "agent": {
    "database-optimizer": {
      "tools": {
        "postgres*": true
      }
    }
  }
}
```

### 6. Agent Tier Strategy (Cost Summary)

Complete cost optimization combines all measures:

```json
{
  "model": "anthropic/claude-sonnet-4-5-20250929",
  "small_model": "anthropic/claude-haiku-4-5-20250929",
  "compaction": { "auto": true, "prune": true },
  "agent": {
    "build":   { "model": "anthropic/claude-sonnet-4-5-20250929" },
    "plan":    { "model": "anthropic/claude-haiku-4-5-20250929" },
    "explore": { "model": "anthropic/claude-haiku-4-5-20250929" },
    "code-reviewer":  { "model": "anthropic/claude-sonnet-4-5-20250929", "steps": 15 },
    "docs-writer":    { "model": "anthropic/claude-haiku-4-5-20250929",  "steps": 10 },
    "context-manager":{ "model": "anthropic/claude-haiku-4-5-20250929",  "steps": 5 }
  }
}
```

---

### Custom Variants

```json
{
  "provider": {
    "openai": {
      "models": {
        "gpt-5": {
          "variants": {
            "thinking": {
              "reasoningEffort": "high",
              "textVerbosity": "low"
            },
            "fast": {
              "reasoningEffort": "low",
              "textVerbosity": "low"
            }
          }
        }
      }
    }
  }
}
```

Switch with the `variant_cycle` keybind.

---

## Provider Configuration

### Adjust Timeouts

```json
{
  "provider": {
    "anthropic": {
      "options": {
        "timeout": 600000,
        "chunkTimeout": 30000
      }
    }
  }
}
```

### AWS Bedrock

```json
{
  "provider": {
    "amazon-bedrock": {
      "options": {
        "region": "us-east-1",
        "profile": "my-aws-profile"
      }
    }
  }
}
```

---

## Best Practices

1. **Build = Powerful model:** Code is written here, quality matters
2. **Plan/Explore = Economic model:** Reading and analyzing doesn't need an expensive model
3. **Set small_model:** Saves on Title/Summary/system tasks
4. **Limit Steps:** Avoid uncontrolled costs
5. **Use variants:** Adjust reasoning-effort based on situation
6. **Enable compaction:** Keeps token consumption controllable in long sessions
7. **Minimize MCP Servers:** Fewer servers = less context consumption