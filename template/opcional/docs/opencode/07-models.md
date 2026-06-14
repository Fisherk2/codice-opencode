# Model Recommendations for OpenCode

OpenCode supports over 75 LLM Providers through AI SDK and Models.dev. Choosing the right model per agent and task has a major impact on quality and costs.

> **Official documentation:** [opencode.ai/docs/models](https://opencode.ai/docs/models/)

---

## Recommended Models (2026)

The following models work well with OpenCode (code generation + tool-calling)

### Proprietary

| Model| Provider  | Strengths|
| ------ | --------- | -------- |
| **Claude Opus 4.7**   | Anthropic | **Critical Plan & Build**: PhD-level reasoning (91.3% GPQA Diamond), 1M context. Excels at complex system architecture, microservice decomposition, and algorithm design. Use for initial agent "System Design". |
| **Claude Sonnet 4.6** | Anthropic | **Primary Build & Debug**: The daily workhorse. Leading SWE-bench Verified, perfect quality/cost balance. Ideal for code iteration, refactoring, and continuous implementation agents.                                                |
| **Claude Haiku 4.5**  | Anthropic | **Explore & Title/Summary**: 73.3% SWE-bench at 1/3 Sonnet's cost. Extreme speed for navigating codebase, indexing symbols, generating commit summaries, and naming variables/functions.                                                  |
| **GPT 5.5 Pro**       | OpenAI    | **Ultra-Complex Build**: Maximum generative capability. Reserved for modules where errors are expensive (security, concurrency, transactions). Premium price justified only for critical components.                                   |
| **GPT 5.4**           | OpenAI    | **General Build & Plan**: 128K-400K context, excellent for full-stack code generation and medium feature planning. Safe "default" for build agents.                                                                   |
| **GPT 5.2 Codex**     | OpenAI    | **Specialized Build**: Optimized for code syntax and patterns. Ideal for repetitive boilerplate tasks and language migrations.                                                                                                 |
| **o3 / o3-pro**       | OpenAI    | **Algorithmic Plan & Debug**: Extended reasoning with thinking tokens. Excels at debugging complex logical bugs, race conditions, and query optimization.                                                                            |
| **o4-mini**           | OpenAI    | **Economic Debug**: Reasoning at a fraction of o3's cost. Perfect for iterative troubleshooting in agent loops.                                                                                                                      |
| **Gemini 3.1 Pro**    | Google    | **Multimodal Plan**: 2M token context. Excellent when the agent needs to analyze architecture diagrams, technical PDFs, and visual specifications alongside code.                                                                         |
| **Gemini 2.5 Flash**  | Google    | **Explore & Summary**: \$0.30/\$2.50 per 1M, 1M context. Best value for indexing massive repositories, generating semantic embeddings, and summarizing technical documentation.                                                                      |
| **Grok 4.3**          | xAI       | **Real-time Explore**: Access to up-to-date data. Useful when the agent investigates newly published libraries, CVEs, or unindexed web documentation.                                                                                     |
| **Minimax M2.7**      | MiniMax   | **Build**: Solid benchmarks in agentic coding. Viable alternative for teams seeking to diversify providers in the build pipeline.                                                                                                   |
### Open Source

| Model | Provider | Strengths|
| --- | --- | --- |
| **DeepSeek V4 Pro**             | DeepSeek | **Build & Plan**: 56.7% in Agentic Coding (LiveBench). The open source closest to GPT-5.4/Claude Sonnet. Ideal for self-hosting coding agents in private environments.            |
| **DeepSeek R1**                 | DeepSeek | **Plan & Debug**: Open source reasoning model. \$0.55/\$2.19 per 1M. Excellent for static analysis, PR review, and logical vulnerability detection.                               |
| **DeepSeek V3.2**               | DeepSeek | **Economic Explore**: \$0.28/\$0.42 per 1M. Ultra cheap for high-volume tasks: codebase search, dependency analysis, indexing.                                             |
| **Kimi K2.6 Thinking**          | Moonshot | **Plan & Build**: 58.3% Agentic Coding, massive context (2M+). Surpasses many proprietary models in analyzing large monorepos. Ideal for planning when context is the bottleneck. |
| **Kimi K2.5**                   | Moonshot | **General Build**: Good balance for daily coding. Strong in niche languages and legacy code.                                                                                          |
| **Qwen3.6 Plus / Qwen3.5 Plus** | Alibaba  | **Build & Plan**: Open source leaders in code benchmarks. Qwen Coder specialized in enterprise software generation. Excellent technical multilingual support.                           |
| **Qwen3 Coder**                 | Alibaba  | **Specialized Build**: Optimized for programming. Direct competitor to GPT Codex in pure development tasks.                                                                           |
| **GLM 5.1**                     | Z-AI     | **Plan & Build**: 55% Agentic Coding. Strong in mathematical reasoning and distributed system architecture.                                                                               |
| **Llama 4 Maverick**            | Meta     | **Build & Debug**: Advanced open source model. ~\$0.20/\$0.60 via APIs. Good performance in full-stack tasks and general debugging.                                                            |
| **Llama 4 Scout**               | Meta     | **Explore**: 10M token context. Unrivaled open source for navigating enormous repositories or analyzing massive logs in one pass.                                                             |
| **Mistral Devstral Medium**     | Mistral  | **Build**: Specialized in software development. Good for structured code generation and tests.                                                                                         |
| **Mistral Large 3**             | Mistral  | **Build & Plan**: Strong general capability, competitive price (\$0.50/\$1.50).                                                                                                                |
| **Nemotron 3 Super**            | NVIDIA   | **Build & Debug**: Optimized by NVIDIA for technical tasks. Good performance in shader generation, CUDA, and systems code.                                                           |
| **Gemma 4 27B**                 | Google   | **Summary & Explore**: Lightweight open source. Ideal for quick summaries, file classification, and routing tasks in agentic pipelines.                                                 |

### Free

| Model | Provider | Strengths |
|--------|----------|------------|
| **Big Pickle** | OpenCode Zen | **General Build & Plan**: Versatile free model. Good balance for daily coding, debugging, and code analysis. Ideal as a *zero-cost* primary model. |
| **DeepSeek V4 Flash Free** | OpenCode Zen | **Fast Build**: Free counterpart to DeepSeek V4. Lower capacity than Pro version but sufficient for recurring code tasks, light refactoring, and boilerplate generation. |
| **Nemotron 3 Super Free** | OpenCode Zen | **Technical Build & Debug**: Optimized by NVIDIA for technical tasks. Good performance in shader generation, CUDA, and systems code. Solid free alternative for build agents. |
| **Qwen3 Coder 480B (free)** | OpenRouter | **Build**: Most powerful free model for software generation (262K context). Ideal as primary model for coding agents. |
| **DeepSeek R1 (free)** | OpenRouter | **Plan & Debug**: GPT-4 level mathematical and logical reasoning (128K context). Excellent for static analysis, PR review, and debugging complex bugs. |
| **Meta Llama 4 Scout (free)** | OpenRouter | **Massive Explore**: 10M token context. Unrivaled for navigating enormous repositories or analyzing extensive logs in one pass. |
| **Meta Llama 3.3 70B (free)** | OpenRouter | **General Build & Plan**: Solid general purpose (128K context). Good quality/speed balance for daily coding and feature planning. |
| **Google Gemini 2.0 Flash (free)** | OpenRouter | **Multimodal Explore & Summary**: 1M context, multimodal. Ideal for analyzing technical documentation, diagrams, and summarizing large repositories. |
| **DeepSeek V3 (free)** | OpenRouter | **Economic Build**: Solid general alternative (128K context). Good for recurring code tasks when Qwen3 Coder is unavailable. |
| **Mistral Small 24B (free)** | OpenRouter | **Alternative Build**: Hosted in EU (128K context). Good option for teams with European data residency requirements. |
| **Z-AI GLM 4.5 Air (free)** | OpenRouter | **small_model / Title/Summary**: Lightweight and fast. Ideal as system small model for generating titles, summaries, and compaction. |
| **MiniMax M2.5 (free)** | OpenRouter | **General Build**: Solid free alternative. Good performance in standard coding tasks. |
| **Nous Hermes 3 (free)** | OpenRouter | **Debug**: Fine-tuned Llama variant (128K context). Strong in debugging tasks and legacy code analysis. |
| **Google Gemma 3 12B (free)** | OpenRouter | **Lightweight Explore**: Google's open model, fast and efficient (128K context). Ideal for exploration agents in small projects. |

> 💡 **Tip:** You can use the smart router `openrouter/free` which automatically selects the best available free model based on your request. Or specify a specific one with `openrouter/<model>:free`.

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

## Cost Comparison (Approximate values)

| Model              | Input $/1M Tokens | Output $/1M Tokens | Recommendation               |
|--------------------|-------------------|---------------------|-----------------------------|
| Claude Opus 4.5     | ~$15              | ~$75                | Only for complex tasks   |
| Claude Sonnet 4.5   | ~$3               | ~$15                | Standard for Build Agent  |
| Claude Haiku 4.5   | ~$0.80            | ~$4                 | Plan/Explore/Subagents      |
| GPT 5.2             | ~$5               | ~$20                | Alternative for Build      |
| GPT 5.1 Codex       | ~$3               | ~$12                | Code generation        |

*Prices are approximate values and may change.*

---

## Best Practices

1. **Build = Powerful model:** Code is written here, quality matters
2. **Plan/Explore = Economic model:** Reading and analyzing doesn't need an expensive model
3. **Set small_model:** Saves on Title/Summary/system tasks
4. **Limit Steps:** Avoid uncontrolled costs
5. **Use variants:** Adjust reasoning-effort based on situation
6. **Enable compaction:** Keeps token consumption controllable in long sessions
7. **Minimize MCP Servers:** Fewer servers = less context consumption