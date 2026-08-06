# SDD Pipeline Plugin

OpenCode plugin that hooks into the lifecycle of the actual SDK API `@opencode-ai/plugin`.

## Design Principle

**The plugin only handles what OpenCode cannot manage natively.**

OpenCode already manages permissions, agent configs, skills, and commands via YAML frontmatter and `opencode.json`. The plugin should NOT duplicate this logic. When agents, skills, or commands change, you only update the OpenCode configs — not the plugin.

| Managed by OpenCode | Managed by this plugin |
|---------------------|----------------------|
| Agent permissions (write/edit/patch/task/bash) | SDD pipeline state (phase, tasks, spec) |
| Agent model, temperature, steps | Slash command → agent mapping |
| Skill loading and discovery | Intent detection from free text |
| Command definitions | Destructive command blocking (safety net) |
| Bash permission rules | Subagent name validation (filesystem auto-discovery) |
| Subagent delegation rules | Phase suggestions (advisory) |

## Implemented Hooks

| Event (actual API) | Purpose |
|---|---|
| `experimental.chat.system.transform` | Injects SDD pipeline state + intent suggestions in system prompt |
| `chat.message` | Detects agent mentions, slash commands, and user intent. Commands have priority over mentions |
| `tool.execute.before` | Blocks destructive commands + validates subagent names |
| `tool.execute.after` | Tool auditing with automatic rotation |
| `experimental.session.compacting` | Re-injects SDD state into compacted context |

## Runtime Files

- `.opencode/plugins/.sdd-audit.log` — audit trace with automatic rotation (>500 lines -> truncates to 250)

Ignored by git.

## What the Plugin Enforces

### 1. Destructive Command Blocking

The plugin blocks destructive commands for ALL agents — a global safety net that OpenCode's per-agent permissions don't cover.

**53 patterns across 15 categories:**

| Category | Count | Examples |
|----------|:-----:|----------|
| Filesystem | 5 | rm -rf, shred, find -exec rm |
| Git | 6 | push --force, reset --hard, clean -fd, filter-repo |
| SQL | 5 | DROP TABLE, DROP DATABASE, TRUNCATE, DELETE FROM |
| Docker | 3 | docker rm -f, system prune -a, volume rm |
| Kubernetes | 2 | kubectl delete --all, drain |
| Permissions | 3 | chmod 777, chown -R |
| Process | 4 | kill -9 0/1, shutdown, reboot |
| Network | 2 | iptables -F, ufw disable |
| Package Managers | 4 | npm publish, pip --force-reinstall, apt remove |
| Environment | 3 | unset PATH, export PATH=, append to shell rc |
| Disk | 5 | mkfs, dd if=, fdisk, wipefs, parted mklabel |
| IaC | 2 | terraform destroy, pulumi destroy |
| Cloud | 4 | aws s3 rm, az vm/group delete, gcloud compute delete |
| Databases | 4 | mongo/mongosh dropDatabase, redis FLUSHALL/FLUSHDB, mysqladmin drop |
| PostgreSQL CLI | 1 | psql -c with drop/alter system/truncate |

Commands are normalized before matching: comments stripped, whitespace collapsed. The full pattern list is in `src/destructivePatterns.ts`.

#### Defense-in-Depth

Restrictions are enforced at **two independent layers**:

1. **Plugin (runtime):** `sdd-pipeline.ts` — regex patterns with bash normalization (strip comments, collapse whitespace). Catches bypass attempts like `rm  -r  -f  /` or `rm -fir /`.
2. **Config (declarative):** `opencode.json` — `permission.bash` deny entries (67+ entries) visible and editable as policy.

Both layers must be updated together when adding new restrictions. The plugin catches creative flag ordering that the config misses; the config provides visibility and auditability.

### 2. Subagent Name Validation

The plugin validates that subagent names in `task()` exist in the catalog (**~355 agents**: ~349 subagents (from the `agents/` directory) + 6 primary). If the LLM invents a name, it receives an error:

```
Unknown subagent: "python-wizard". Create an .md file in the agents/ directory or use a primary agent.
```

Subagent names are **auto-discovered from the filesystem** — there is no hardcoded catalog of subagents. At session start, the plugin recursively scans the user's `agents/` directory (including subdirectories, skipping hidden directories) and treats every `*.md` file as a registered subagent. Adding a new agent requires only creating `agents/<name>.md`; no plugin changes are needed.

The 6 primary agents (huitzilopochtli, quetzalcoatl, moctezuma, tlaloc, mictlantecuhtli, tezcatlipoca) are the only hardcoded names — they are the plugin's identity (ADR-014: Agent Pack System) and stay valid even when no `agents/` directory exists. When the directory is absent, validation falls back to just those 6 primary agents. Per ADR-013 (Auto-Discovery), subagent names are derived at runtime rather than maintained as a static catalog.

Validation checks `args.subagent_type`, `args.agent`, `args.name`, `args.type`, or `args.subagent` for the name.

## What OpenCode Manages (not the plugin)

These are configured in agent file YAML frontmatter and `opencode.json`:

- **Agent permissions**: write, edit, patch, task, bash per agent
- **Agent models**: which model each agent uses
- **Skill loading**: which skills are available
- **Command definitions**: slash command definitions
- **Bash rules**: per-agent bash permission patterns
- **Subagent delegation**: which agents can delegate to which subagents (configured per agent, not enforced by the plugin)

## SDD Phase Suggestions

When an agent is used outside its typical phase, the plugin suggests using the correct command. Example:

```
> **Suggestion:** Consider /build first to implement code.
```

Suggestions are **advisory only** — they never block the agent.

## How it works

1. **On session start**: `experimental.chat.system.transform` injects the SDD pipeline state + intent suggestions in the system prompt. State is in-memory only — no persistence between sessions.
2. **Each message**: `chat.message` detects agent mentions, slash commands, and intent. Commands have priority over mentions. When it detects a mention or command, it updates the active agent in memory.
3. **Before each tool**: `tool.execute.before` blocks destructive commands and validates subagent names.
4. **After each tool**: `tool.execute.after` logs to the audit log.
5. **On compaction**: `experimental.session.compacting` re-injects the SDD state into the compacted context.

## Agent Detection

The plugin tracks the active agent via two mechanisms:

### 1. Agent Mention Patterns (user messages)
Detection of mentions in user messages:
```
@tlaloc, agente tezcatlipoca -> updates active agent
```

### 2. Command-Agent Map (slash commands)
Mapping of slash commands to their primary agent:
```
/build -> tlaloc
/code-simplify -> tlaloc
/design -> quetzalcoatl
/diagnosis -> quetzalcoatl
/docs-update -> quetzalcoatl
/evolve -> quetzalcoatl
/help -> huitzilopochtli
/plan -> moctezuma
/review -> tezcatlipoca
/ship -> mictlantecuhtli
/spec -> quetzalcoatl
/test -> mictlantecuhtli
/webperf -> mictlantecuhtli
```

**Complete flow:**
1. `chat.message` detects mentions and commands in user messages (commands > mentions)
2. State lives in memory for the session duration

## Subagent Delegation

Primary agents can delegate to subagents via `task()`. Each subagent operates in an isolated subcontext with its **own permissions**, not the parent's. Delegation rules are configured in each agent file's YAML frontmatter — the plugin only validates the subagent name exists among the auto-discovered agents, it does not enforce which agents can delegate to which subagents.

| Primary agent | Can delegate? | Config source |
|----------------|:---:|---|
| huitzilopochtli | Yes | Agent YAML frontmatter |
| quetzalcoatl | Yes | Agent YAML frontmatter |
| moctezuma | No | Agent YAML frontmatter |
| tlaloc | Yes | Agent YAML frontmatter |
| mictlantecuhtli | Yes | Agent YAML frontmatter |
| tezcatlipoca | No | Agent YAML frontmatter |

## Module Architecture

The plugin uses a 3-pillar architecture to minimize hardcoded configuration:

| Pillar | Module | Purpose |
|--------|--------|---------|
| Auto-discovery | `src/autoDiscovery.ts` | Scans `commands/*.md` and `agents/*.md` to derive configuration from filesystem |
| Config-driven | `src/configLoader.ts` + `src/defaults.ts` | Loads `opencode.json` `sddPipeline` overrides, merged with canonical defaults |
| Quality infra | Biome + tests | Linting, formatting, and test coverage enforcement |

### Source files

| File | Lines | Responsibility |
|------|:-----:|----------------|
| `sdd-pipeline.ts` | 366 | Plugin entry point, hook implementations |
| `src/autoDiscovery.ts` | 190 | Filesystem scanning for commands and agents |
| `src/configLoader.ts` | 228 | opencode.json config loading with defaults merge |
| `src/defaults.ts` | 529 | All hardcoded configuration maps |
| `src/destructivePatterns.ts` | 95 | Blocked command patterns (safety boundary) |
| `src/normalizeBash.ts` | 40 | Bash command normalization for pattern matching |
| `src/types.ts` | 60 | TypeScript type definitions |

**Total:** `sdd-pipeline.ts` (366 lines) + 6 modules in `src/` (1142 lines) = **1508 lines** across 7 files.
