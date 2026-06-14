# MCP Servers in OpenCode

MCP (Model Context Protocol) allows integrating external tools and services into OpenCode. OpenCode supports both local and remote MCP Servers.

> **Official documentation:** [opencode.ai/docs/mcp-servers](https://opencode.ai/docs/mcp-servers/)
>
> **Find MCP Servers:** [mcp.so](https://mcp.so) | [glama.ai/mcp/servers](https://glama.ai/mcp/servers)

---

## Important Note: Context Consumption

MCP Servers add tokens to the context. The more MCP Tools are enabled, the faster you'll reach the context limit.

**Recommendation:** Only enable the MCP Servers you actually need. Disable servers globally and enable them only for specific agents.

---

## Local MCP Servers

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-local-mcp": {
      "type": "local",
      "command": ["npx", "-y", "my-mcp-command"],
      "enabled": true,
      "environment": {
        "MY_ENV_VAR": "my_env_var_value"
      }
    }
  }
}
```

### Options

| Option        | Type    | Required | Description                         |
|---------------|---------|----------|-------------------------------------|
| `type`        | String  | Yes      | Must be `"local"`                  |
| `command`     | Array   | Yes      | Command and arguments               |
| `environment` | Object  | No       | Environment variables               |
| `enabled`     | Boolean | No       | Enabled/Disabled at startup     |
| `timeout`     | Number  | No       | Timeout in ms (default: 5000) |

---

## Remote MCP Servers

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-remote-mcp": {
      "type": "remote",
      "url": "https://my-mcp-server.com",
      "enabled": true,
      "headers": {
        "Authorization": "Bearer {env:MY_API_KEY}"
      }
    }
  }
}
```

### Options

| Option    | Type    | Required | Description                         |
|-----------|---------|----------|-------------------------------------|
| `type`    | String  | Yes      | Must be `"remote"`                 |
| `url`     | String  | Yes      | MCP Server URL                  |
| `enabled` | Boolean | No       | Enabled/Disabled at startup     |
| `headers` | Object  | No       | HTTP Headers                        |
| `oauth`   | Object  | No       | OAuth configuration                 |
| `timeout` | Number  | No       | Timeout in ms (default: 5000) |

---

## OAuth Authentication

### Automatic (Dynamic Client Registration)

```json
{
  "mcp": {
    "my-oauth-server": {
      "type": "remote",
      "url": "https://mcp.example.com/mcp"
    }
  }
}
```

### With Pre-registered Credentials

```json
{
  "mcp": {
    "my-oauth-server": {
      "type": "remote",
      "url": "https://mcp.example.com/mcp",
      "oauth": {
        "clientId": "{env:MY_MCP_CLIENT_ID}",
        "clientSecret": "{env:MY_MCP_CLIENT_SECRET}",
        "scope": "tools:read tools:execute"
      }
    }
  }
}
```

### CLI Commands

```bash
opencode mcp auth my-oauth-server    # Authenticate
opencode mcp list                     # Show servers and authentication status
opencode mcp logout my-oauth-server   # Remove credentials
```

---

## Per-Agent MCP Server Control

**Strategy:** Disable globally, enable per agent.

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "my-mcp": {
      "type": "local",
      "command": ["bun", "x", "my-mcp-command"],
      "enabled": true
    }
  },
  "tools": {
    "my-mcp*": false
  },
  "agent": {
    "my-agent": {
      "tools": {
        "my-mcp*": true
      }
    }
  }
}
```

---

## Recommended MCP Servers

### Context7 -- Documentation Search

```json
{
  "mcp": {
    "context7": {
      "type": "remote",
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

Usage: `use context7` in the prompt

### Chrome DevTools MCP — Web Performance & Debugging

Official MCP server from the Chrome DevTools team (`ChromeDevTools/chrome-devtools-mcp`) that gives AI agents control over a live Chrome browser. Provides access to Lighthouse audits, performance traces, Core Web Vitals measurement, console inspection, and screenshot capabilities.

**Required for `/webperf` Deep mode** — without this MCP, `web-performance-auditor` operates in Quick mode (static source analysis only, metrics marked as "not measured").

> **Repository:** [github.com/ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) — 42k+ stars, Apache 2.0 license

#### Prerequisites

- Node.js LTS (already installed in this workspace)
- Google Chrome (stable or newer)
- No additional dependencies — runs via `npx`

#### Configuration

Disabled by default. Enable only when running `/webperf` on web projects:

```json
{
  "mcp": {
    "chrome-devtools": {
      "type": "local",
      "command": ["npx", "-y", "chrome-devtools-mcp@latest"],
      "enabled": false
    }
  }
}
```

> **Tip:** Use `chrome-devtools-mcp@latest` to always get the latest version.

#### Per-Agent Activation (Recommended)

Disable globally, enable only for agents that need browser access:

```json
{
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

#### Quick Start

1. Open Chrome with remote debugging enabled:
   ```bash
   google-chrome --remote-debugging-port=9222
   ```
   Or use `--autoConnect` flag (Chrome 144+):
   ```json
   {
     "args": ["npx", "-y", "chrome-devtools-mcp@latest", "--auto-connect"]
   }
   ```

2. Set `"enabled": true` in the config above

3. Restart OpenCode

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

#### Usage

> *"Run a Lighthouse audit on localhost:3000 and tell me what's hurting the performance score."*
>
> *"Record a performance trace of the page load and identify long tasks blocking INP."*
>
> *"Check the console for errors on the current page."*

### Excel MCP Server -- Spreadsheet Manipulation

Local MCP server for reading, writing, and manipulating Excel files (.xlsx) directly from OpenCode agents. Supports workbooks, worksheets, ranges, formulas, charts, pivot tables, formatting, and more.

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

> **⚠️ Prerequisite:** Install dependencies first by running `uvx excel-mcp-server stdio` (see [Quick Start step 3 in USER_GUIDE.md](./USER_GUIDE.md#3-install-excel-mcp-server-local-development)).

> **Repository:** [github.com/haris-musa/excel-mcp-server](https://github.com/haris-musa/excel-mcp-server)

### Jupyter Notebook -- AI-Powered Notebook Automation

Local MCP server that gives AI agents full control over a live Jupyter notebook session — run code, add markdown, manage packages, inspect variables, and more.

> **Repository:** [github.com/Cyb3rWard0g/agent-jupyter-toolkit](https://github.com/Cyb3rWard0g/agent-jupyter-toolkit)

#### Quick Start

**1. Start a Jupyter server**

Pick one:

```bash
# A) With Docker (recommended — includes jupyter-collaboration)
git clone https://github.com/Cyb3rWard0g/agent-jupyter-toolkit.git
cd agent-jupyter-toolkit/packages/mcp-jupyter-notebook/quickstarts
docker compose up -d --build

# B) Or locally
pip install jupyterlab ipykernel jupyter-collaboration
jupyter lab --port 8888 --IdentityProvider.token=mcp-dev-token
```

**2. Enable the MCP server** (ships disabled by default)

In `opencode.json`, change `"enabled": false` to `"enabled": true` for the `jupyter` entry.

**3. Restart OpenCode** — the server will connect automatically.

#### Configuration

```json
{
  "mcp": {
    "jupyter": {
      "type": "local",
      "command": ["uvx", "mcp-jupyter-notebook"],
      "enabled": false,
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

| Variable | CLI Flag | Description | Default |
|---|---|---|---|
| `MCP_JUPYTER_SESSION_MODE` | `--mode` | `server` (remote Jupyter) or `local` | `server` |
| `MCP_JUPYTER_BASE_URL` | `--base-url` | Jupyter server URL (required in server mode) | — |
| `MCP_JUPYTER_TOKEN` | `--token` | Jupyter API token | — |
| `MCP_JUPYTER_KERNEL_NAME` | `--kernel-name` | Kernel spec name | `python3` |
| `MCP_JUPYTER_NOTEBOOK_PATH` | `--notebook-path` | Notebook file path (`.ipynb`) | auto-generated |
| `MCP_JUPYTER_TRANSPORT` | `--transport` | `stdio`, `sse`, `streamable-http` | `stdio` |
| `MCP_JUPYTER_LOG_LEVEL` | — | `DEBUG`, `INFO`, `WARNING`, `ERROR` | `INFO` |

#### Local Mode (no Jupyter server needed)

Prefer this for lightweight sessions without a full Jupyter server:

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

> **Note:** Local mode skips the Jupyter server and runs a kernel directly. No `MCP_JUPYTER_BASE_URL` or `MCP_JUPYTER_TOKEN` required.

#### Usage Examples

> *"Create a notebook that generates 100 random numbers, plots a histogram, and adds a markdown summary."*
>
> *"Install pandas and numpy, then analyze this CSV and show me summary statistics."*

Full tool reference: [packages/mcp-jupyter-notebook/docs/tools.md](https://github.com/Cyb3rWard0g/agent-jupyter-toolkit/blob/main/docs/mcp-server/tools.md)

### Sentry -- Error Tracking

```json
{
  "mcp": {
    "sentry": {
      "type": "remote",
      "url": "https://mcp.sentry.dev/mcp",
      "oauth": {}
    }
  }
}
```

Auth: `opencode mcp auth sentry`

### Grep by Vercel -- GitHub Code Search

```json
{
  "mcp": {
    "gh_grep": {
      "type": "remote",
      "url": "https://mcp.grep.app"
    }
  }
}
```

### Other Useful MCP Servers

| Server     | Description                  | URL/Package |
|------------|------------------------------|-------------|
| **Filesystem** | File system access | `@modelcontextprotocol/server-filesystem` |
| **GitHub**    | GitHub API (Careful: many tokens!) | `@modelcontextprotocol/server-github` |
| **PostgreSQL** | Database access       | `@modelcontextprotocol/server-postgres` |
| **Puppeteer** | Browser automation  | `@modelcontextprotocol/server-puppeteer` |
| **Memory**    | Persistent storage    | `@modelcontextprotocol/server-memory` |

---

## Best Practices

1. **Less is more:** Only enable the MCP Servers you actually need
2. **Per-Agent Activation:** Disable MCP Servers globally and turn them on only for specific agents
3. **Use AGENTS.md:** Add instructions like "Use context7 for documentation lookups"
4. **Environment Variables:** Always reference secrets with `{env:VAR_NAME}`, never hardcoded
5. **Configure Timeouts:** For slow servers, increase the timeout
6. **Avoid GitHub MCP:** Consumes many tokens -- use `gh` CLI via Bash instead