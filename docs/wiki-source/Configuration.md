# Configuration

The workspace behavior is controlled by `opencode.json` at the project root — the main configuration file for OpenCode. This page explains the key sections and how to customize them for your project.

> For the full configuration reference, see [opencode.ai/v2/docs/config](https://opencode.ai/v2/docs/config/).

---

## Overview

`opencode.json` is the single source of truth for how OpenCode runs in your workspace. It defines which AI models to use, how agents behave, what commands are available, and what security boundaries are in place.

The workspace template ships with a pre-configured `opencode.json` that you can customize. Here are the key sections:

---

## Core Settings

### `model` — Default AI Model

```json
"model": "opencode/big-pickle"
```

The `model` field sets the main AI model used for general chat and tasks. It uses the format `provider/model`. The value above is what the Códice template ships. This model is the default for all interactions unless an agent or command overrides it.

### `default_agent` — Session Entry Point

```json
"default_agent": "huitzilopochtli"
```

Sets the primary agent used when a session does not select one explicitly. The template routes new sessions to its commander agent.

> V1's `small_model` field has no native V2 equivalent — OpenCode maps it to the built-in `title` agent's model (`agents.title.model`). The template does not ship it.

### `compaction` — Context Window Management

```json
"compaction": {
  "auto": true,
  "keep": {
    "tokens": 10000
  },
  "buffer": 20000
}
```

| Field | Description |
|-------|-------------|
| `auto` | Automatically compact the conversation when approaching the token limit |
| `keep.tokens` | Token budget of recent context retained after compaction |
| `buffer` | Headroom reserved before automatic compaction triggers |

> V2 has no `prune` or `reserved` field — V1's `preserve_recent_tokens` maps to `keep.tokens` and V1's `reserved` maps to `buffer`; the legacy fields are ignored with a warning (per the V2 migration guide).

---

## Provider Configuration (`providers`)

The `providers` section (plural in V2; V1's singular `provider` map is a legacy name) defines available AI model providers and their per-model options. The Códice template ships **no `providers` block** — OpenCode's built-in provider catalog already covers the models below, and credentials connect via `/connect`. Add `providers` only for custom endpoints, model overrides, or variants:

| Provider | Models | Official Docs |
|----------|--------|---------------|
| `anthropic` | Claude Haiku 4.5, Opus 4.6, Sonnet 4, Sonnet 4.6 | [docs.anthropic.com](https://docs.anthropic.com/en/docs/about-claude/models) |
| `deepseek` | DeepSeek V4 Flash, V4 Flash Free, V4 Pro | [api-docs.deepseek.com](https://api-docs.deepseek.com/) |
| `google` | Gemini 3.1 Pro, Gemini 3.5 Flash | [ai.google.dev](https://ai.google.dev/gemini-api/docs/models) |
| `minimax` | MiniMax M2.5, M2.7, M3 | [platform.minimaxi.com](https://platform.minimaxi.com/document/Models) |
| `moonshot` | Kimi K2.5, K2.6 | [platform.moonshot.cn](https://platform.moonshot.cn/docs) |
| `openai` | GPT-5, GPT-5.1 Codex, GPT-5.3 Codex, GPT-5.4 Mini, GPT-5.5 Pro | [platform.openai.com/docs](https://platform.openai.com/docs/models) |
| `z-ai` | GLM 5.1 | [open.bigmodel.cn](https://open.bigmodel.cn/dev/api) |

> **⚠️ Provider configurations change frequently.** Each provider has its own parameter naming, model IDs, and authentication methods. Always consult the official provider documentation linked above for the most up-to-date configuration options. Do not treat the examples in this page as authoritative — they may become outdated as providers update their APIs.

### Per-Model Options

Provider and model entries customize requests with `settings`, `headers`, and `body`, and can define **variants** — named configurations optimized for different workloads:

```jsonc
"providers": {
  "deepseek": {
    "models": {
      "deepseek-v4-flash": {
        "settings": {
          "thinking": { "type": "enabled" },
          "reasoningEffort": "medium"
        },
        "variants": [
          {
            "id": "deep-think",
            "settings": { "reasoningEffort": "high" }
          },
          {
            "id": "economy",
            "settings": { "reasoningEffort": "low" }
          }
        ]
      }
    }
  }
}
```

**Variants** let you switch between modes without changing the model — select one with `#variant` (e.g. `deepseek/deepseek-v4-flash#deep-think`):

| Variant | Use Case |
|---------|----------|
| `deep-think` | Complex reasoning, architecture decisions, code review |
| `economy` | Quick responses, simple lookups, cost-sensitive tasks |
| *(default)* | Balanced behavior with the model's standard options |

---

## Agent Configuration

The `agents` section (V2; V1's singular `agent` map is legacy) configures each primary agent individually. The template assigns specific models, request bodies, and step limits to each agent based on its role in the SDD cycle. In native V2 shape, `temperature` lives under `request.body` (top-level `temperature` and `disable` are legacy fields that V2 translates automatically), and built-in agents are turned off with `"disabled": true`:

```jsonc
"agents": {
  "huitzilopochtli": {
    "model": "opencode/mimo-v2.5-free",
    "color": "#d3e22b",
    "request": {
      "body": { "temperature": 0.5 }
    },
    "steps": 50
  },
  "quetzalcoatl": {
    "model": "opencode/nemotron-3-ultra-free",
    "color": "#ffffff",
    "request": {
      "body": { "temperature": 0.2 }
    },
    "steps": 120
  },
  "moctezuma": {
    "model": "opencode/big-pickle",
    "color": "#8B4513",
    "request": {
      "body": { "temperature": 0.1 }
    },
    "steps": 100
  },
  "tlaloc": {
    "model": "opencode/nemotron-3.5-lightning-free",
    "color": "#00ffff",
    "request": {
      "body": { "temperature": 0.2 }
    },
    "steps": 200
  },
  "mictlantecuhtli": {
    "model": "opencode/muse-spark-1.3-contributor-free",
    "color": "#2d2d2d",
    "request": {
      "body": { "temperature": 0.2 }
    },
    "steps": 150
  },
  "tezcatlipoca": {
    "model": "opencode/mimo-v2.6-flash-free",
    "color": "#ff3134",
    "request": {
      "body": { "temperature": 0.1 }
    },
    "steps": 100
  },
  "build": { "disabled": true },
  "plan": { "disabled": true },
  "explore": { "disabled": true },
  "general": { "disabled": true }
}
```

### Agent Settings Reference

| Field | Description |
|-------|-------------|
| `model` | Override the default model for this specific agent (`provider/model`, optional `#variant`) |
| `color` | UI accent color (hex) for agent messages in the OpenCode interface |
| `request` | Per-agent header and JSON body overlays (the template carries `temperature` here; note the V2 docs: the session runner preserves these values but does not yet send them with model requests — configure active request settings on the provider, model, or variant) |
| `steps` | Maximum number of model steps; on the final step OpenCode removes tools and asks the model to summarize |
| `disabled` | Remove a built-in or custom agent (V1's `disable` is legacy) |

### Why These Settings?

Each agent's configuration reflects its role in the SDD pipeline:

| Agent | Model Choice | Temperature | Steps | Color | Rationale |
|-------|-------------|:-----------:|:-----:|:-----:|-----------|
| **Huitzilopochtli** | mimo-v2.5-free (balanced) | 0.5 | 50 | 🟡 Yellow | Supreme orchestrator — needs balanced creativity to decide which subagent to invoke. Higher temperature for flexible delegation. Lowest step count because orchestration is quick. |
| **Quetzalcoatl** | nemotron-3-ultra-free (powerful) | 0.2 | 120 | ⚪ White | Visionary Sage — spec writing and design. Low temperature for precise, structured output. Higher step count for comprehensive documentation generation. |
| **Moctezuma** | big-pickle (default) | 0.1 | 100 | 🟤 Brown | Strategic Commander — task breakdown. Near-deterministic temperature for structured plan output. The template's default model keeps planning runs simple. |
| **Tlaloc** | nemotron-3.5-lightning-free (fast) | 0.2 | 200 | 🔵 Cyan | Rain God Builder — code implementation. Low temperature for correct code, highest step limit because building is multi-step (test→code→refactor). |
| **Mictlantecuhtli** | muse-spark-1.3-contributor-free | 0.2 | 150 | ⚫ Dark | Underworld Judge — testing and validation. Low temperature for thorough verification. High step limit for complex test suites and ship checklist. |
| **Tezcatlipoca** | mimo-v2.6-flash-free | 0.1 | 100 | 🔴 Red | Smoking Mirror Critic — code review. Near-deterministic for objective analysis. Moderate step count for thorough five-axis review. |

---

## Instructions — Project Context

```json
"instructions": [
  "CONTRIBUTING.md",
  "SPEC.md",
  "docs/ARCHITECTURE.md",
  "docs/CODE_STYLE.md"
]
```

> **V2 behavior:** the config schema still accepts the `instructions` array, but per the V2 Instructions guide it *"does not currently resolve its files, glob patterns, or URLs"* — entries are **not** injected into model context. Active project instructions come from **`AGENTS.md`** (global file plus workspace/project discovery), which every Códice installation ships.

Keep the array for compatibility, but put guidance you want the model to actually follow in `AGENTS.md`.

---

## References — Skill Reference Material

The `references` section configures local directories or Git repositories that agents can load as reference material. The template ships with **3 example entries** to demonstrate the available reference types:

```json
"references": {
  "clean-code": {
    "path": "./skills/clean-code/references",
    "description": "Reference materials for clean code principles, naming, functions, and formatting"
  },
  "codice-opencode": {
    "repository": "Fisherk2/codice-opencode",
    "branch": "main",
    "description": "Códice repository — OpenCode workspace installer reference"
  },
  "opencode": {
    "repository": "anomalyco/opencode",
    "branch": "dev",
    "description": "Official OpenCode repository — CLI, API, and configuration reference"
  }
}
```

> **Note:** These are examples — add your own references by editing `opencode.json`. The template does not ship with all 18 skill references pre-configured; users add the ones they need.

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `path` | For local refs | Relative path to the reference directory (from the directory containing the config file; `~/` and absolute paths supported) |
| `repository` | For remote refs | Git repository in `owner/repo` format (also Git URLs and SCP-style remotes) |
| `branch` | ❌ | Git branch to use (default: repository default) |
| `description` | ❌ | Plain-language description; **with** one, the reference is advertised to agents with its alias and resolved path — without one it stays available to clients but is not advertised automatically |
| `hidden` | ❌ | If `true`, hides the reference from interactive client selectors (default: `false`) |

### How to Use

Clients attach a reference by its root alias — the attachment carries a non-recursive listing of the root's immediate files and directories. Ask the agent to inspect a specific path when you need content below the root, e.g. `Inspect the codice-opencode reference and summarize specs/spec-agent-format-v2.md`. Note that references do not grant extra permissions: access outside the active Location still follows the normal `read`/`edit` and `external_directory` rules.

### Add a Custom Reference

To add your own reference directory:

```json
"references": {
  "my-docs": {
    "path": "./docs/references",
    "description": "Project-specific architecture decisions and API contracts"
  }
}
```

Or a remote repository:

```json
"references": {
  "my-org-docs": {
    "repository": "my-org/technical-docs",
    "branch": "main",
    "description": "Organization-wide technical documentation"
  }
}
```

> **Official docs:** [opencode.ai/v2/docs/references](https://opencode.ai/v2/docs/references/) — Full reference for the configuration format.

---

## Permissions — Security Boundaries

The `permissions` section controls what agents can do. In OpenCode V2 it is one **ordered array of rules** — each `{ "action": ..., "resource": ..., "effect": ... }` — and **the last matching rule wins** (so broad rules go first and exceptions follow). If no rule matches, OpenCode uses `ask`. The template pairs a generous read-only baseline with a strict posture on execution, delegation, external paths, and secrets.

### Effects

| Effect | Meaning |
|--------|---------|
| `allow` | Agent can execute without asking — used for safe, read-only operations |
| `ask` | Agent must ask for approval before executing — V2's no-match fallback |
| `deny` | Agent cannot execute regardless of approval — used for sensitive or destructive operations |

### `shell` rules — Shell Command Access

The template opens with `{ "action": "shell", "resource": "*", "effect": "ask" }`, then layers exceptions — so **any command not explicitly allowed or denied is asked**. V2 renamed the V1 action `bash` to `shell`.

**Fully allowed (no prompt):**

| Category | Commands | Examples |
|----------|----------|---------|
| **File reading** | `cat`, `head`, `tail`, `bat`, `less` equivalents | `cat package.json`, `head -n 20 log.txt` |
| **File search** | `grep`, `rg`, `ag`, `ack` | `grep -r "TODO" src/` |
| **File info** | `file`, `stat`, `du`, `ls`, `tree`, `wc` | `ls -la`, `stat config.json` |
| **Text processing** | `sort`, `uniq`, `cut`, `tr`, `jq`, `diff`, `comm`, `paste`, `join` | `jq '.name' package.json` |
| **Git read-only** | `git status`, `git diff`, `git log`, `git show`, `git blame`, `git branch`, `git tag` | `git log --oneline -5` |
| **GitHub CLI (read)** | `gh repo view`, `gh issue list`, `gh pr list`, `gh release list` | `gh pr view 42` |
| **Network (read)** | `dig`, `nslookup`, `host` | `nslookup example.com` |
| **Process info** | `ps`, `lsof`, `uptime`, `free`, `uname`, `whoami`, `id`, `pwd` | `lsof -i :3000` |
| **Archive inspection** | `unzip -l`, `zipinfo` | `zipinfo release.zip` |
| **Path utilities** | `dirname`, `basename`, `realpath`, `which` | `which node` |

**Always asked (explicit `ask` rules on top of the broad `shell * → ask`):**

| Category | Commands |
|----------|----------|
| **Filesystem traversal** | `find`, `fd` (their `-exec`/`-delete` forms are denied outright) |
| **Text mutation** | `sed`, `awk` (`sed -i` and `tee` are denied) |
| **Network** | `curl`, `http`, `gh api` |
| **Echo/print** | `echo`, `printf` |
| **Pipes/redirects** | `xargs`, and any command containing output redirection (`* > *`) |
| **Archives** | `tar -tf` |
| **Git** | `git bisect` |

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

### `subagent` rules — Subagent Delegation

The `subagent` action controls which subagents a primary agent can invoke (V1 called this action `task`). The template's first `permissions` rule is a global **ask**:

```json
{ "action": "subagent", "resource": "*", "effect": "ask" }
```

So no delegation runs silently. The primaries that delegate (huitzilopochtli, quetzalcoatl, tlaloc, mictlantecuhtli, and tezcatlipoca) append their own rules in their agent file's YAML frontmatter: `{ "action": "subagent", "resource": "*", "effect": "allow" }` followed by explicit `deny` entries for the five other primaries. `moctezuma` never delegates — its frontmatter ends with `{ "action": "subagent", "resource": "*", "effect": "deny" }`. Because agent rules are appended after global rules and the last match wins, the global `ask` remains the safety net for anything not covered.

> **Official docs:** [opencode.ai/v2/docs/permissions](https://opencode.ai/v2/docs/permissions/) — Full reference for the permission system.

### `external_directory` — External Directory Access

The `external_directory` action controls which paths **outside the active Location and its project worktree** can be touched at all — it applies to external paths used by `read`, `edit`, `write`, and `patch` **before** their own rules, and the `shell` tool additionally checks its external working directory and directories inferred from the command. The template denies everything external, then explicitly allowlists a few safe roots:

```json
[
  { "action": "external_directory", "resource": "*", "effect": "deny" },
  { "action": "external_directory", "resource": "~/.bun/*", "effect": "allow" },
  { "action": "external_directory", "resource": "~/.cargo/*", "effect": "allow" },
  { "action": "external_directory", "resource": "~/go/*", "effect": "allow" },
  { "action": "external_directory", "resource": "~/.cache/*", "effect": "allow" },
  { "action": "external_directory", "resource": "/tmp/opencode/*", "effect": "allow" }
]
```

#### How It Works

1. **Default deny** — the `{ "resource": "*", "effect": "deny" }` rule blocks all external directory access.
2. **Explicit allowlist** — only the listed paths are permitted. V2 matching uses **whole-value wildcards**, not path-aware globs:
   - `*` matches zero or more characters, **including `/`** (so `~/.bun/*` reaches nested files — V2 has no separate `**` recursion syntax)
   - `?` matches exactly one character
   - everything else is literal
   A leading `~`, `~/`, `$HOME`, or `$HOME/` is expanded at config-load time for `external_directory`, `read`, and `edit` resources (shell resources stay raw text).
3. **Layered rules** — tool-specific permissions (e.g. `edit`, `read`) still apply inside an allowed directory. Deny an edit while allowing reads:

```json
[
  { "action": "external_directory", "resource": "~/projects/personal/*", "effect": "allow" },
  { "action": "read", "resource": "~/projects/personal/*", "effect": "allow" },
  { "action": "edit", "resource": "~/projects/personal/*", "effect": "deny" }
]
```

In this example, agents can `read` files in `~/projects/personal/` but cannot `edit` them.

> **⚠️ Security note:** Only allow paths you trust. Agents with external directory access can read and write files in those paths (subject to `read`/`edit`/`shell` rules). Avoid allowing broad paths like `~/` or `/` — use specific subdirectories instead.

#### Deny vs Ask Behavior

When an agent attempts to access an external path matched by a `deny` rule, OpenCode blocks the operation outright. When the resolved effect is `ask`, the client decides — **allow once**, **allow always** (saves a project-scoped `allow` rule), or **reject**. Saved approvals never override a configured `deny`. (V1-era settings like an external-directory dialog toggle do not exist in V2.)

> **Official docs:** [opencode.ai/v2/docs/permissions#directories](https://opencode.ai/v2/docs/permissions/#directories) — Full reference for external directory permission patterns.

---

## MCP Servers — Tool Connectivity

The `mcp.servers` section configures Model Context Protocol servers that extend agent capabilities (V2 nests each server under `mcp.servers`; V1 placed server names directly under `mcp`). The template ships with **7 pre-configured MCP servers** in `opencode.json`. Three are enabled by default; the rest must be activated on demand.

| Server | Type | Default | Purpose |
|--------|------|---------|---------|
| `context7` | Remote | ✅ Enabled | Documentation queries |
| `vercel-grep` | Remote | ✅ Enabled | GitHub code search across 1M+ repos |
| `gitmcp` | Remote | ✅ Enabled | GitHub repository documentation |
| `chrome-devtools` | Local | ❌ Disabled | Web performance & browser debugging |
| `excel` | Local | ❌ Disabled | Spreadsheet manipulation |
| `jupyter` | Local | ❌ Disabled | Jupyter notebook automation |
| `codebase-memory-mcp` | Local (global install) | ❌ Disabled | Knowledge graph for codebase intelligence |

> **Removed in v2.1.3-beta.1:** The `tavily` and `firecrawl` remote MCP servers were cut from the template core `opencode.json`. OpenCode V2's native `websearch` covers the basic web-search use case; advanced Firecrawl scraping stays available via the vendored Firecrawl skills. See [MCP Servers](MCP-Servers) for details and manual setup.

Three servers are enabled by default (`context7`, `vercel-grep`, `gitmcp`). To activate the others:

1. **Install prerequisites** (see [MCP Servers](MCP-Servers) for per-server requirements)
2. **Set `"disabled": false`** for the server you need in `opencode.json` — V2 groups servers under `mcp.servers` and uses `disabled` (the inverse of V1's `enabled` toggle)
3. **Restart OpenCode**

> **Full guide:** [MCP Servers](MCP-Servers) covers activation steps, per-agent control, prerequisites, and which template features require which MCP server.

---

## See Also

- [MCP Servers](MCP-Servers) — Pre-configured servers, activation, and per-agent control
- [Workspace Structure](Workspace-Structure) — Directory layout and file descriptions
- [opencode.ai/v2/docs/config](https://opencode.ai/v2/docs/config/) — Official OpenCode configuration reference
- [opencode.ai/v2/docs/permissions](https://opencode.ai/v2/docs/permissions/) — Detailed permissions guide
- [opencode.ai/v2/docs/mcp-servers](https://opencode.ai/v2/docs/mcp-servers/) — Official OpenCode MCP documentation
