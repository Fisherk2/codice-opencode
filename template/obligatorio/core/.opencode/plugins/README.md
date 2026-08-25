# SDD Pipeline Plugin

OpenCode plugin that hooks into the lifecycle of the actual SDK API `@opencode-ai/plugin`.

## Design Principle

**The plugin only handles what OpenCode cannot manage natively.**

OpenCode already manages permissions, agent configs, skills, and commands via YAML frontmatter and `opencode.json`. The plugin does NOT duplicate this logic. When agents, skills, or commands change, you only update the OpenCode configs — not the plugin.

| Managed by OpenCode | Managed by this plugin |
|---------------------|----------------------|
| Agent permissions (write/edit/patch/task/bash) | Destructive command blocking (safety net) |
| Agent model, temperature, steps | — |
| Skill loading and discovery | — |
| Command definitions | — |
| Bash permission rules | — |
| Subagent delegation rules | — |

## Implemented Hook

| Event (actual API) | Purpose |
|---|---|
| `tool.execute.before` | Blocks destructive commands (rm -rf, git push --force, DROP TABLE, etc.) for ALL agents — a global safety net that per-agent permissions don't cover |

## Runtime Files

None. The plugin is stateless — no audit log, no persistent state.

## What the Plugin Enforces

### 1. Destructive Command Blocking

Commands are normalized before matching: comments stripped (token-start only), newlines collapsed, whitespace trimmed. The full pattern list is in `src/destructivePatterns.ts`.

**~50 patterns across 15 categories:**

| Category | Examples |
|----------|----------|
| Filesystem | rm -rf, rm -fr, rm -rfv, shred, find -exec, find -delete |
| Git | push --force, push --force-with-lease, reset --hard/--mixed, clean -fd/-fdx, checkout -- ., checkout -f, restore, filter-repo, branch -D, stash drop/clear |
| SQL | DROP TABLE, DROP DATABASE, DROP SCHEMA, TRUNCATE, DELETE FROM, DELETE ... WHERE 1=1/true |
| Docker | docker rm -f, system prune -a, volume rm/prune |
| Kubernetes | kubectl delete --all, drain |
| Permissions | chmod 777, chown -R |
| Process | kill -9 0/1, shutdown, reboot/halt/poweroff |
| Network | iptables -F, ufw/firewalld disable |
| Package Managers | npm publish, pip --force-reinstall, apt/yum/dnf remove |
| Environment | unset PATH, export PATH= (total replacement), append to shell rc |
| Disk | mkfs, dd if=, fdisk /dev/, wipefs, parted mklabel |
| IaC | terraform destroy, pulumi destroy |
| Cloud | aws s3 rm --recursive, aws ec2/rds terminate, az vm/group delete, gcloud compute delete |
| Databases | mongo/mongosh dropDatabase, redis FLUSHALL/FLUSHDB, mysqladmin drop |
| PostgreSQL CLI | psql -c with drop/alter system/truncate |

#### Defense-in-Depth

Restrictions are enforced at **two independent layers**:

1. **Plugin (runtime):** `sdd-pipeline.ts` — regex patterns with bash normalization (strip comments at token start, collapse whitespace). Catches bypass attempts like `rm  -r  -f  /` or `rm -fir /`.
2. **Config (declarative):** `opencode.json` — `permission.bash` deny entries visible and editable as needed.

The plugin is a **safety net, not a security boundary** — advanced bypasses (variable expansion, command substitution) are not covered. Use proper sandboxing for untrusted code.

## Supporting Modules

- `src/destructivePatterns.ts` — the regex pattern list (the safety boundary, intentionally not configurable)
- `src/normalizeBash.ts` — command normalization before pattern matching
