# SDD Pipeline Plugin

The SDD (Spec-Driven Development) Pipeline plugin is a minimal OpenCode plugin that blocks destructive bash commands before execution. It is the **only** unique value the plugin provides — all other governance (agent permissions, command permissions, intent routing) is handled natively by OpenCode configs.

> **Source:** `sdd-pipeline.ts` (27 lines) + 2 supporting modules in `src/` (`destructivePatterns.ts`, `normalizeBash.ts`)
>
> **SDK:** `@opencode-ai/plugin` — see [opencode.ai/docs/plugins](https://opencode.ai/docs/plugins/) for the plugin API reference.

---

## Design Principle

**The plugin only handles what OpenCode cannot manage natively.**

OpenCode already manages permissions, agent configs, skills, and commands via YAML frontmatter and `opencode.json`. The plugin does not duplicate this logic:

| Managed by OpenCode | Managed by this plugin |
|---------------------|------------------------|
| Agent permissions (write, edit, patch, task, bash) | Destructive command blocking (safety net) |
| Agent model, temperature, steps | — |
| Skill loading and discovery | — |
| Command definitions (YAML frontmatter) | — |
| Subagent delegation rules | — |

---

## Implemented Hook

| Hook | Purpose |
|------|---------|
| `tool.execute.before` | Blocks destructive commands for ALL agents before execution |

The plugin has **no other hooks** — no state injection, no intent detection, no subagent validation, no audit logging. Those were removed in FEV-27 (#80) because OpenCode natively covers the underlying concerns.

---

## What the Plugin Enforces

### 1. Destructive Command Blocking

The plugin blocks dangerous commands for ALL agents — a global safety net that OpenCode's per-agent permissions don't cover. It covers **~50 bash command patterns** across **15 categories** (filesystem, git, SQL, Docker, Kubernetes, permissions, process, network, package managers, environment, disk, IaC, cloud, databases, PostgreSQL CLI).

Commands are normalized before pattern matching: comments are stripped (token-start only), newlines collapsed, whitespace trimmed. This prevents common evasion techniques like inline comments (`rm -rf / # safe`), split flags (`rm  -r  -f`), and newline padding. The full pattern list is in `src/destructivePatterns.ts`.

> **Note:** This is independent of `opencode.json`'s `permission.bash` settings. The plugin blocks these patterns at the tool execution level, before OpenCode's permission system evaluates them. Together they form a defense-in-depth safety net.

---

## Runtime Files

None. The plugin is stateless — no audit log, no persistent state.

## Supporting Modules

- `src/destructivePatterns.ts` — the regex pattern list (the safety boundary, intentionally NOT configurable)
- `src/normalizeBash.ts` — command normalization before pattern matching

> **Safety net, not a security boundary:** advanced bypasses (variable expansion, command substitution) are not covered. Use proper sandboxing for untrusted code.

---

## Version History

| Version | Description |
|---------|-------------|
| v2.1.0 | Original 385-line pipeline: 6 hooks, 11 modules, auto-discovery, intent detection, subagent validation, audit logging |
| v2.1.1 (FEV-27, #80) | Reduced to a 27-line destructive-command gate. Removed: auto-discovery, config loading, intent detection, subagent validation, state injection, audit logging — all duplicated OpenCode-native capabilities |
