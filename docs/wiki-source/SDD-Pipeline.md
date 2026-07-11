# SDD Pipeline Plugin

The SDD (Spec-Driven Development) Pipeline is an OpenCode plugin that orchestrates the development lifecycle. It lives in `.opencode/plugins/sdd-pipeline.ts` and hooks into OpenCode's SDK API to manage state, validate actions, and guide the workflow.

> **Source:** `.opencode/plugins/sdd-pipeline.ts` (~575 lines)
>
> **SDK:** `@opencode-ai/plugin` — see [opencode.ai/docs/plugins](https://opencode.ai/docs/plugins/) for the plugin API reference.

---

## Design Principle

**The plugin only handles what OpenCode cannot manage natively.**

OpenCode already manages permissions, agent configs, skills, and commands via YAML frontmatter and `opencode.json`. The plugin does not duplicate this logic:

| Managed by OpenCode | Managed by this plugin |
|---------------------|------------------------|
| Agent permissions (write, edit, patch, task, bash) | SDD pipeline state (current phase, tasks, spec status) |
| Agent model, temperature, steps | Slash command → agent routing |
| Skill loading and discovery | Intent detection from free-text messages |
| Command definitions (YAML frontmatter) | Destructive command blocking (safety net) |
| Bash permission rules | Subagent name validation (catalog integrity) |
| Subagent delegation rules | Phase suggestions (advisory next-step hints) |

---

## Implemented Hooks

| Hook | Purpose |
|------|---------|
| `experimental.chat.system.transform` | Injects SDD pipeline state + intent suggestions into the system prompt at session start |
| `chat.message` | Detects agent mentions (`@tlaloc`), slash commands (`/build`), and user intent. Commands take priority over mentions |
| `tool.execute.before` | Blocks destructive commands and validates subagent names before execution |
| `tool.execute.after` | Audits tool usage with automatic log rotation |
| `experimental.session.compacting` | Re-injects SDD state into compacted context to prevent state loss during compaction |

---

## What the Plugin Enforces

### 1. Destructive Command Blocking

The plugin blocks dangerous commands for ALL agents — a global safety net that OpenCode's per-agent permissions don't cover. It covers **53 bash command patterns** across **15 categories**:

| Category | Examples |
|----------|----------|
| Filesystem | `rm -rf`, `rm -fr`, `rm -fir`, `shred`, `find -exec rm` |
| Git | `git push -f`, `git push --force`, `git reset --hard` |
| SQL | `DROP TABLE`, `DROP DATABASE`, `TRUNCATE` |
| Docker | `docker rm -f`, `docker rmi -f`, `docker system prune -a` |
| Kubernetes | `kubectl delete --all`, `kubectl drain` |
| Permissions | `chmod 777`, `chmod -R 777`, `chown -R` |
| Process | `kill -9 1`, `shutdown -h now` |
| Network | `iptables -F`, `ufw disable` |
| Package Managers | `npm publish`, `pip --force-reinstall` |
| Environment | `export PATH=` (total replacement), `unset PATH` |
| Disk | `dd if=`, `mkfs`, `mkfs.ext4`, `fdisk` |
| IaC | `terraform destroy -auto-approve` |
| Cloud | `aws s3 rm --recursive`, `az vm delete` |
| Databases | `mongo dropDatabase`, `redis FLUSHALL` |
| PostgreSQL CLI | `dropdb`, `pg_dropcluster` |

Commands are normalized before pattern matching: comments are stripped and whitespace is collapsed. This prevents common evasion techniques like inline comments (`rm -rf && # safe`).

> **Note:** This is independent of `opencode.json`'s `permission.bash` settings. The plugin blocks these patterns at the tool execution level, before OpenCode's permission system evaluates them.

### 2. Subagent Name Validation

When an agent uses `task()` to delegate to a subagent, the plugin validates that the subagent name exists in the catalog (**104 agents**: 98 subagents + 6 primary). If the LLM invents a name, it receives an error:

```
Unknown subagent: "python-wizard". Use an agent from the VALID_SUBAGENTS catalog.
```

The validation checks these `task()` parameter fields for the agent name: `subagent_type`, `agent`, `name`, `type`, and `subagent`.

### 3. SDD Phase Suggestions

When an agent is used outside its typical phase, the plugin suggests the correct command:

```
> **Suggestion:** Consider /build first to implement code.
```

Suggestions are **advisory only** — they never block or override the agent.

---

## Agent Detection

The plugin tracks which agent is currently active through two mechanisms:

### Agent Mentions (user messages)

When a user mentions an agent by name or handle:

```
@tlaloc, build this feature
agente tezcatlipoca, revisa este código
```

The plugin updates the active agent for the session. Mention patterns follow the format `@agentname` or `agente agentname`.

### Command-Agent Map (slash commands)

Slash commands are mapped to their corresponding primary agent:

| Command | Agent |
|---------|-------|
| `/spec` | quetzalcoatl |
| `/evolve` | quetzalcoatl |
| `/design` | quetzalcoatl |
| `/docs-update` | quetzalcoatl |
| `/diagnosis` | quetzalcoatl |
| `/plan` | moctezuma |
| `/build` | tlaloc |
| `/code-simplify` | tlaloc |
| `/test` | mictlantecuhtli |
| `/webperf` | mictlantecuhtli |
| `/ship` | mictlantecuhtli |
| `/review` | tezcatlipoca |

**Complete detection flow:**

1. `chat.message` hook fires on every user message
2. Detects mentions (`@agent`), then checks for slash commands (commands take priority)
3. Updates the active agent in memory for the session duration
4. On compaction, state is re-injected into the new context

---

## Subagent Delegation

Primary agents can delegate to subagents via `task()` only if their agent file's YAML frontmatter permits it. The plugin validates the subagent name but does **not** enforce which agents can delegate to which subagents — that is configured per agent:

| Primary agent | Can delegate? | Where configured |
|---------------|:---:|---|
| huitzilopochtli | ✅ | Agent YAML frontmatter (`agents/huitzilopochtli.md`) |
| quetzalcoatl | ✅ | Agent YAML frontmatter |
| moctezuma | ❌ | Agent YAML frontmatter |
| tlaloc | ✅ | Agent YAML frontmatter |
| mictlantecuhtli | ✅ | Agent YAML frontmatter |
| tezcatlipoca | ❌ | Agent YAML frontmatter |

> **Note:** Each subagent operates in an isolated subcontext with its **own permissions**, not the parent agent's permissions.

---

## Runtime Files

The plugin creates a single runtime file:

- **`.opencode/plugins/.sdd-audit.log`** — Audit trace of tool executions. Automatically rotated: when it exceeds 500 lines, it truncates to 250.

This file is gitignored by `.opencode/.gitignore` and does not need to be tracked in version control.

---

## Customizing the Plugin

The plugin is an **obligatorio** file — it will be overwritten on template updates. If you need to customize its behavior:

1. **Add new destructive patterns** — Edit the `DESTRUCTIVE_PATTERNS` array in `sdd-pipeline.ts` to add new blocked commands
2. **Add new commands** — Add entries to `COMMAND_AGENT_MAP` when creating new slash commands
3. **Add new agent mentions** — Add entries to `AGENT_MENTION_PATTERNS` when creating new primary agents
4. **Add new intent patterns** — Add entries to `INTENT_PATTERNS` for free-text command detection
5. **Add new subagents** — Add names to the `VALID_SUBAGENTS` Set when creating new subagents

For extensive customizations, maintain a fork of the plugin and re-apply your changes after template updates, or contribute your improvements back to the template.

> **Official docs:** [opencode.ai/docs/plugins](https://opencode.ai/docs/plugins/) — OpenCode plugin SDK reference.

---

## See Also

- [Configuration](Configuration#agent-configuration) — Per-agent model, temperature, and step configuration
- [Commands](Commands) — Slash command definitions and how to add new ones
- [Agents](Agents) — Agent definitions, subagent catalog, and delegation rules
- [MCP Servers](MCP-Servers) — MCP server configuration and per-agent tool control
- [opencode.ai/docs/plugins](https://opencode.ai/docs/plugins/) — Official OpenCode plugin documentation
