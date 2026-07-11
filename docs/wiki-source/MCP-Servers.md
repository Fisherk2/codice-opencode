# MCP Servers

MCP (Model Context Protocol) servers extend OpenCode agents with external tools and data sources. This page covers the MCP servers that come pre-configured in this workspace template, how to activate them, and which template features depend on them.

> **Official documentation:** [opencode.ai/docs/mcp-servers/](https://opencode.ai/docs/mcp-servers/) covers the basics of local, remote, and OAuth-based MCP server configuration.
>
> **Find MCP servers:** [mcp.so](https://mcp.so) | [glama.ai/mcp/servers](https://glama.ai/mcp/servers)

---

## Pre-Configured MCP Servers

The template ships with **9 MCP servers** pre-configured in `opencode.json`. Only `context7` is enabled by default; the rest are disabled to conserve context and must be activated on demand.

| Server | Type | Default | Template Feature |
|--------|------|---------|------------------|
| `context7` | Remote | ✅ Enabled | Documentation queries (`find-docs` skill) |
| `chrome-devtools` | Local | ❌ Disabled | `/webperf` Deep mode, browser debugging |
| `excel` | Local | ❌ Disabled | Spreadsheet manipulation (`xlsx` skill) |
| `jupyter` | Local | ❌ Disabled | AI-powered notebook automation |
| `docs-mcp-server` | Local | ❌ Disabled | Open-source documentation queries |
| `tavily` | Remote (OAuth) | ❌ Disabled | Real-time web search (API key) |
| `firecrawl` | Remote (OAuth) | ❌ Disabled | Web scraping and crawling (API key) |
| `vercel-grep` | Remote | ❌ Disabled | GitHub code search across 1M+ repos |
| `gitmcp` | Remote | ❌ Disabled | GitHub repository documentation |

---

## Context Consumption Warning

MCP servers add tokens to every conversation turn. The more servers and tools you enable, the faster you'll reach the context limit.

**Rule of thumb:** Enable only what you need for your current task. Disable servers globally and activate them per-agent when possible (see [Per-Agent Control](#per-agent-control) below).

---

## Activating MCP Servers

Each server requires different prerequisites. Follow the steps below for the server you need.

### Context7 — Documentation Search

Remote MCP server that provides up-to-date library documentation. Used by the `find-docs` skill.

**Pre-configured as:** `"enabled": true` — no setup needed.

```json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "enabled": true
    }
  }
}
```

For higher rate limits, sign up for a free account and set your API key:

```json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp",
      "headers": {
        "CONTEXT7_API_KEY": "{env:CONTEXT7_API_KEY}"
      }
    }
  }
}
```

> **Usage:** Agents automatically use context7 when querying library documentation. You can also invoke it manually with `use context7` in your prompt.

---

### Chrome DevTools MCP — Web Performance & Debugging

Local MCP server from the Chrome DevTools team (`ChromeDevTools/chrome-devtools-mcp`) that gives AI agents control over a live Chrome browser. Provides Lighthouse audits, performance traces, Core Web Vitals measurement, console inspection, and screenshots.

**Required for `/webperf` Deep mode** — without this MCP, `web-performance-auditor` operates in Quick mode (static source analysis only, metrics marked as "not measured").

#### Prerequisites

- Node.js LTS (already present in this workspace)
- Google Chrome (stable or newer)
- No additional dependencies — runs via `npx`

#### Quick Start

1. **Open Chrome with remote debugging:**
   ```bash
   google-chrome --remote-debugging-port=9222
   ```
   Or use `--auto-connect` (Chrome 144+):
   ```bash
   npx -y chrome-devtools-mcp@latest --auto-connect
   ```

2. **Enable the MCP server** in `opencode.json`:
   ```json
   {
     "mcp": {
       "chrome-devtools": {
         "type": "local",
         "command": ["npx", "-y", "chrome-devtools-mcp@latest"],
         "enabled": true
       }
     }
   }
   ```

3. **Restart OpenCode** for the change to take effect.

#### Available Tools

| Tool | Purpose |
|------|---------|
| `lighthouse_audit` | Run Lighthouse and get performance score + diagnostics |
| `performance_start_trace` | Start recording a performance trace |
| `performance_stop_trace` | Stop trace and get analysis |
| `performance_analyze_insight` | Analyze performance data for bottlenecks |
| `screenshot` | Capture page screenshot |
| `console_logs` | Get browser console output |
| `page_capture` | Capture page state for inspection |

#### Usage Examples

> *"Run a Lighthouse audit on localhost:3000 and tell me what's hurting the performance score."*
>
> *"Record a performance trace of the page load and identify long tasks blocking INP."*
>
> *"Check the console for errors on the current page."*

---

### Excel MCP Server — Spreadsheet Manipulation

Local MCP server for reading, writing, and manipulating Excel files (.xlsx) directly from OpenCode agents. Supports workbooks, worksheets, ranges, formulas, charts, pivot tables, formatting, and more. Used by the `xlsx` skill.

#### Prerequisites

- **Python 3** with `uv` installed (`pip install uv` or `brew install uv`)
- No additional npm dependencies

#### Quick Start

1. **Verify the dependency** runs correctly:
   ```bash
   uvx excel-mcp-server stdio
   ```
   If this is your first run, `uv` will download and cache the server automatically.

2. **Enable the MCP server** in `opencode.json`:
   ```json
   {
     "mcp": {
       "excel": {
         "type": "local",
         "command": ["uvx", "excel-mcp-server", "stdio"],
         "enabled": true
       }
     }
   }
   ```

3. **Restart OpenCode** for the change to take effect.

> **Repository:** [github.com/haris-musa/excel-mcp-server](https://github.com/haris-musa/excel-mcp-server)

---

### Jupyter Notebook — AI-Powered Notebook Automation

Local MCP server that gives AI agents full control over a live Jupyter notebook session — run code, add markdown, manage packages, inspect variables, and more.

#### Prerequisites

- **Python 3** with `uv` installed
- **Docker** (recommended for the Jupyter server) or **Python packages** (`jupyterlab`, `ipykernel`)

#### Quick Start

**1. Start a Jupyter server**

Pick one method:

```bash
# A) With Docker (recommended — includes jupyter-collaboration)
git clone https://github.com/Cyb3rWard0g/agent-jupyter-toolkit.git
cd agent-jupyter-toolkit/packages/mcp-jupyter-notebook/quickstarts
docker compose up -d --build

# B) Or locally
pip install jupyterlab ipykernel jupyter-collaboration
jupyter lab --port 8888 --IdentityProvider.token=mcp-dev-token
```

**2. Enable the MCP server** in `opencode.json`:
```json
{
  "mcp": {
    "jupyter": {
      "type": "local",
      "command": ["uvx", "mcp-jupyter-notebook"],
      "enabled": true,
      "env": {
        "MCP_JUPYTER_SESSION_MODE": "server",
        "MCP_JUPYTER_BASE_URL": "http://localhost:8888",
        "MCP_JUPYTER_TOKEN": "mcp-dev-token",
        "MCP_JUPYTER_NOTEBOOK_PATH": "agent_demo.ipynb"
      }
    }
  }
}
```

**3. Restart OpenCode** — the server will connect automatically.

#### Local Mode (no Jupyter server needed)

For lightweight sessions without a full Jupyter server:

```json
{
  "mcp": {
    "jupyter": {
      "type": "local",
      "command": ["uvx", "mcp-jupyter-notebook", "--mode", "local"],
      "enabled": false
    }
  }
}
```

> **Note:** Local mode runs a kernel directly. No `MCP_JUPYTER_BASE_URL` or `MCP_JUPYTER_TOKEN` required.

#### Environment Variables

| Variable | CLI Flag | Description | Default |
|---|---|---|---|
| `MCP_JUPYTER_SESSION_MODE` | `--mode` | `server` (remote Jupyter) or `local` | `server` |
| `MCP_JUPYTER_BASE_URL` | `--base-url` | Jupyter server URL (required in server mode) | — |
| `MCP_JUPYTER_TOKEN` | `--token` | Jupyter API token | — |
| `MCP_JUPYTER_KERNEL_NAME` | `--kernel-name` | Kernel spec name | `python3` |
| `MCP_JUPYTER_NOTEBOOK_PATH` | `--notebook-path` | Notebook file path (`.ipynb`) | auto-generated |
| `MCP_JUPYTER_LOG_LEVEL` | — | `DEBUG`, `INFO`, `WARNING`, `ERROR` | `INFO` |

> **Repository:** [github.com/Cyb3rWard0g/agent-jupyter-toolkit](https://github.com/Cyb3rWard0g/agent-jupyter-toolkit)
>
> **Full tool reference:** [packages/mcp-jupyter-notebook/docs/tools.md](https://github.com/Cyb3rWard0g/agent-jupyter-toolkit/blob/main/docs/mcp-server/tools.md)

---

### Grounded Docs MCP Server — Open-Source Documentation Queries

Local SSE-based MCP server that provides up-to-date library documentation from official sources. Open-source alternative to Context7. Indexes docs from websites, GitHub, npm, PyPI, and local files.

**Pre-configured as:** `"enabled": false` — requires manual startup of the server first.

#### Prerequisites

- Node.js 22+ (already present in this workspace)
- No API key required

#### Quick Start

**Enable the MCP server** in `opencode.json` — no manual server process needed:

```json
{
  "mcp": {
    "docs-mcp-server": {
      "type": "local",
      "command": ["npx", "-y", "@arabold/docs-mcp-server@latest"],
      "enabled": true
    }
  }
}
```

OpenCode manages the server lifecycle automatically via stdio.

> **Tip:** You can also access the Web UI at `http://localhost:6280` when the server is running to add documentation interactively, or index docs via CLI:
> ```bash
> npx @arabold/docs-mcp-server@latest scrape react https://react.dev/reference/react
> npx @arabold/docs-mcp-server@latest search react "useEffect" --output yaml
> ```

#### Available Tools

| Tool | Purpose |
|------|---------|
| `fetch_docs` | Fetch documentation for a specific library URL |
| `search_docs` | Semantic search across indexed documentation |

> **Repository:** [github.com/arabold/docs-mcp-server](https://github.com/arabold/docs-mcp-server) | **Web:** [grounded.tools](https://grounded.tools)

---



### Tavily — Real-Time Web Search

Remote MCP server for AI-optimized web search. Provides search and content extraction with domain filtering, news search, and LLM-friendly results. Requires a free Tavily API key.

**Pre-configured as:** `"enabled": false` — requires API key setup.

#### Prerequisites

- **Tavily API key** — Sign up and get a free API key at [tavily.com](https://www.tavily.com/)

#### Quick Start

1. **Set your API key** (pick one method):

   **Option A — Environment variable:**
   ```bash
   export TAVILY_API_KEY=tvly-your-key-here
   ```
   Then enable in `opencode.json`:
   ```json
   {
     "mcp": {
       "tavily": {
         "type": "remote",
         "url": "https://mcp.tavily.com/mcp",
         "headers": {
           "TAVILY_API_KEY": "{env:TAVILY_API_KEY}"
         },
         "enabled": true
       }
     }
   }
   ```

   **Option B — OAuth authentication (recommended):**
   ```bash
   opencode mcp auth tavily
   ```
   This launches an OAuth flow in your browser. No manual API key handling required.

2. **Enable the server** (if not using OAuth, enable in `opencode.json` as shown above).
3. **Restart OpenCode** for the change to take effect.

#### Available Tools

| Tool | Purpose |
|------|---------|
| `tavily_search` | Real-time web search with filtering |
| `tavily_extract` | Intelligent content extraction from pages |

> **Docs:** [docs.tavily.com/documentation/mcp](https://docs.tavily.com/documentation/mcp)

---

### Firecrawl — Web Scraping and Crawling

Remote MCP server for scraping, crawling, and extracting content from web pages. Supports batch scraping, deep crawling, and structured data extraction. Requires a Firecrawl API key.

**Pre-configured as:** `"enabled": false` — requires setup.

#### Quick Start

1. **Install Firecrawl skills and authenticate:**

   ```bash
   npx -y firecrawl-cli@latest init --all -k YOUR_FIRECRAWL_API_KEY
   ```

   This installs 31 Firecrawl skills across all your AI coding agents.

   > **Get an API key:** Sign up at [firecrawl.dev](https://www.firecrawl.dev/) for a free key.

2. **Authenticate via OAuth:**

   ```bash
   opencode mcp auth firecrawl
   ```

   This launches an OAuth flow in your browser, connecting OpenCode to Firecrawl's MCP endpoint.

3. **Enable the MCP server** in `opencode.json` (only needed if not using OAuth):

   ```json
   {
     "mcp": {
       "firecrawl": {
         "type": "remote",
         "url": "https://mcp.firecrawl.dev/v2/mcp",
         "headers": {
           "FIRECRAWL_API_KEY": "{env:FIRECRAWL_API_KEY}"
         },
         "enabled": true
       }
     }
   }
   ```

4. **Restart OpenCode** for the change to take effect.

#### Available Tools

| Tool | Purpose |
|------|---------|
| `firecrawl_scrape` | Scrape content from a single URL |
| `firecrawl_search` | Web search with content extraction |
| `firecrawl_crawl` | Launch an asynchronous crawl |
| `firecrawl_batch_scrape` | Scrape multiple URLs in parallel |

> **Docs:** [docs.firecrawl.dev/developers-mcp](https://docs.firecrawl.dev/use-cases/developers-mcp)

---

### Vercel Grep — GitHub Code Search

Remote MCP server from Vercel that searches code patterns across 1M+ public GitHub repositories. Returns real-world code snippets ranked by relevance. Ideal for finding usage examples of APIs and libraries.

**Pre-configured as:** `"enabled": false` — enable when you need code search.

```json
{
  "mcp": {
    "vercel-grep": {
      "type": "remote",
      "url": "https://mcp.grep.app",
      "enabled": true
    }
  }
}
```

#### Prerequisites

- No API key required

#### Available Tools

| Tool | Purpose |
|------|---------|
| `searchGitHub` | Search code patterns across 1M+ GitHub repos |

> **Blog:** [vercel.com/blog/grep-a-million-github-repositories-via-mcp](https://vercel.com/blog/grep-a-million-github-repositories-via-mcp)

---

### GitMCP — GitHub Repository Documentation

Remote MCP server that transforms any public GitHub repository into a documentation endpoint. Change `github.com` to `gitmcp.io` in a repo URL and your AI agent gets instant access to its README, docs, and code structure.

**Pre-configured as:** `"enabled": false` — enable when you need docs for a specific repository.

```json
{
  "mcp": {
    "gitmcp": {
      "type": "remote",
      "url": "https://gitmcp.io/docs",
      "enabled": true
    }
  }
}
```

#### Prerequisites

- No API key required
- Repository must be public

#### URL Formats

| Format | Use Case |
|--------|----------|
| `gitmcp.io/{owner}/{repo}` | Specific repository |
| `{owner}.gitmcp.io/{repo}` | GitHub Pages site |
| `gitmcp.io/docs` | Generic (AI picks repo from context) |

#### Available Tools

| Tool | Purpose |
|------|---------|
| `fetch_*_documentation` | Fetch repo-specific documentation |
| `search_*_documentation` | Semantic search across docs |
| `search_*_code` | Search repository code |

> **Website:** [gitmcp.io](https://gitmcp.io) | **GitHub:** [github.com/idosal/git-mcp](https://github.com/idosal/git-mcp)

---

## Per-Agent Control

The template recommends a **disable-globally, enable-per-agent** strategy to conserve context while giving specific agents access to the tools they need.

For example, `chrome-devtools` is useful for agents that run browser tests or performance audits, but unnecessary for other agents. Here's how to disable it globally and enable it only for `mictlantecuhtli` and `tlaloc`:

```json
{
  "mcp": {
    "chrome-devtools": {
      "type": "local",
      "command": ["npx", "-y", "chrome-devtools-mcp@latest"],
      "enabled": true
    }
  },
  "tools": {
    "chrome-devtools*": false
  },
  "agent": {
    "mictlantecuhtli": {
      "tools": {
        "chrome-devtools*": true
      }
    },
    "tlaloc": {
      "tools": {
        "chrome-devtools*": true
      }
    }
  }
}
```

This pattern applies to any MCP server:
1. Enable the server in the `mcp` section (so OpenCode starts it)
2. Disable all its tools globally in the `tools` section
3. Re-enable tools only for specific agents using `agent.<name>.tools`

> **Official docs:** See [opencode.ai/docs/mcp-servers#per-agent](https://opencode.ai/docs/mcp-servers#per-agent) for more on per-agent tool control.

---

## Adding New MCP Servers

Beyond the pre-configured servers, you can add any MCP server available in the ecosystem. Follow the basic pattern from the official OpenCode docs:

**Local MCP server:**
```json
{
  "mcp": {
    "my-server": {
      "type": "local",
      "command": ["npx", "-y", "my-mcp-package"],
      "enabled": true
    }
  }
}
```

**Remote MCP server:**
```json
{
  "mcp": {
    "my-server": {
      "type": "remote",
      "url": "https://my-mcp-server.com/mcp",
      "enabled": true
    }
  }
}
```

### Useful Servers to Consider

| Server | Description | Package / URL |
|--------|-------------|---------------|
| **Filesystem** | File system access | `@modelcontextprotocol/server-filesystem` |
| **PostgreSQL** | Database access | `@modelcontextprotocol/server-postgres` |
| **Puppeteer** | Browser automation | `@modelcontextprotocol/server-puppeteer` |
| **Memory** | Persistent storage | `@modelcontextprotocol/server-memory` |
| **Sentry** | Error tracking (remote) | `https://mcp.sentry.dev/mcp` (+ OAuth) |
> **Avoid the GitHub MCP server:** It consumes a large number of tokens. Use the `gh` CLI via the `bash` tool instead.

---

## Which Template Features Need Which MCP

| Feature | MCP Required | Without MCP |
|---------|--------------|-------------|
| Documentation queries (`find-docs` skill) | `context7` | Falls back to training data |
| Open-source documentation queries | `docs-mcp-server` | Falls back to context7 |
| Version-precise package docs | `rtfmbro` | Falls back to generic docs |
| Real-time web search (API key) | `tavily` | Falls back to training data |
| Web scraping and crawling (API key) | `firecrawl` | Not available |
| GitHub code search | `vercel-grep` | Manual GitHub browsing |
| GitHub repository docs | `gitmcp` | Manual GitHub browsing |
| `/webperf` Deep mode | `chrome-devtools` | Quick mode (static analysis only) |
| Browser testing (`browser-testing-with-devtools` skill) | `chrome-devtools` | No runtime browser verification |
| Spreadsheet manipulation (`xlsx` skill) | `excel` | Manual CSV editing |
| Jupyter notebook automation | `jupyter` | Not available |

---

## Best Practices

1. **Enable only what you need** — Each active MCP server adds tokens to every conversation. Disable servers you're not actively using.
2. **Prefer per-agent activation** — Disable tools globally and enable them only for specific agents that need them (see [Per-Agent Control](#per-agent-control)).
3. **Use `@latest` for Chrome DevTools MCP** — `chrome-devtools-mcp@latest` ensures you always get the newest version without manual updates.
4. **Use environment variables for secrets** — Reference API keys and tokens with `{env:VAR_NAME}` in the config. Never hardcode credentials.
5. **Configure timeouts for slow servers** — If an MCP server is slow to respond, increase the `timeout` value (default: 5000ms).
6. **Test new servers incrementally** — Add one server at a time and verify it works before adding the next. This helps isolate configuration issues.
7. **Run `opencode mcp list`** to see all configured servers and their authentication status.

---

## See Also

- [Configuration](Configuration#mcp-servers--tool-connectivity) — The `mcp` section in opencode.json
- [Getting Started](Getting-Started) — First steps after installing the template
- [opencode.ai/docs/mcp-servers/](https://opencode.ai/docs/mcp-servers/) — Official OpenCode MCP documentation
