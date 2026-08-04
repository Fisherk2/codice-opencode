# ADR-014: Agent Pack System

**Status:** Accepted

**Date:** 2026-08-04

**Author:** Fisherk2

**Reference:** v2.0.0 — Agent Ecosystem Restructuring

## Context

The Códice workspace template ships with a growing number of agents. As of v1.2.0, the flat `agents/` directory contains ~104 agents. The v2.0.0 expansion adds ~195 new agents (after removing 72 redundant/improvable ones), bringing the total to ~300+.

This creates three problems:

1. **Relevance:** A business user who needs product management and marketing agents receives 90+ software development agents they will never use. The noise-to-signal ratio is unacceptable for non-developer users.

2. **Discoverability:** A flat directory of 300+ `.md` files is un-navigable. Users cannot find relevant agents without searching by name.

3. **Maintainability:** Adding a new agent requires deciding its position in an unstructured list. There is no categorical boundary to guide classification.

The current permission model also requires manual `task:` allow-lists in 4 primary agents (huitzilopochtli, quetzalcoatl, tlaloc, mictlantecuhtli). Every new agent requires updating these allow-lists, which contradicts the auto-discovery system established in ADR-013.

Additionally, three primary agents (quetzalcoatl, tlaloc, mictlantecuhtli) maintain redundant "AVAILABLE SUBAGENTS" catalog sections that duplicate huitzilopochtli's canonical reference.

## Decision

We adopt a **pack-based agent classification system** with 8 selectable packs and 2 mandatory directories:

### Pack Structure

| Directory | Content | Installation |
|-----------|---------|-------------|
| `packs/main/` | 6 primary agents | **Mandatory** — always installed |
| `packs/writers/` | 3 documentation agents | **Mandatory** — always installed |
| `packs/software-development/` | ~175 agents | **Selectable** — default ON |
| `packs/creative/` | ~15 agents | Selectable |
| `packs/business/` | ~47 agents | Selectable |
| `packs/finance/` | ~11 agents | Selectable |
| `packs/government-legal/` | ~11 agents | Selectable |
| `packs/science-research/` | ~31 agents | Selectable |
| `packs/hardware-emerging/` | ~33 agents | Selectable |
| `packs/operations-support/` | ~22 agents | Selectable |

### Permission Unification

4 delegating primary agents (huitzilopochtli, quetzalcoatl, tlaloc, mictlantecuhtli) switch from explicit allow-lists to a unified pattern:

```yaml
task:
  "*": allow
  "huitzilopochtli": deny
  "quetzalcoatl": deny
  "moctezuma": deny
  "tlaloc": deny
  "mictlantecuhtli": deny
```

2 non-delegating primary agents (moctezuma, tezcatlipoca) keep `task: "*": deny` — unchanged.

### Subagent Table Removal

"AVAILABLE SUBAGENTS" sections are removed from quetzalcoatl, tlaloc, and mictlantecuhtli. huitzilopochtli retains its catalog as the single canonical reference.

### Plugin Changes

- `VALID_SUBAGENTS` Set deleted from `validSubagents.ts` (keep `PRIMARY_AGENTS` constant)
- `defaults.ts` updated to remove `VALID_SUBAGENTS` references
- `sdd-pipeline.ts` fallback changed from `DEFAULTS.VALID_SUBAGENTS` to `new Set(PRIMARY_AGENTS)`
- Auto-discovery updated to recursively scan `packs/` subdirectories

## Consequences

### Positive

- **Domain-focused workspaces.** A business user installs only the business pack + mandatory agents. Their workspace has ~56 agents instead of ~354.
- **Default works for developers.** `software-development` is pre-selected, so developers get everything they need with zero configuration.
- **Permission maintenance eliminated.** Unified `task: "*": allow` means adding a new agent never requires editing primary agent files.
- **Single source of truth.** huitzilopochtli's catalog is the only canonical agent reference. No more tripled maintenance.
- **Auto-discovery compatible.** The filesystem scan (ADR-013) extends naturally to `packs/*/` subdirectories.

### Negative

- **Template size increase.** The npm package grows from ~2MB to an estimated ~5-8MB with all packs. Still within the SC-15 limit (<5MB for core + packs, depending on agent file sizes).
- **Installer complexity.** Pack selection adds a step to the install wizard. Users who want all packs must explicitly select them (mitigated by `--packs-all` flag).
- **Migration friction.** v1.x users cannot use the update path — they must reinstall. This is a breaking change documented in the release notes.
- **Pack boundary ambiguity.** Some agents could belong to multiple packs (e.g., `fintech-engineer` could be software-development or finance). Single-assignment rule resolves this but may feel arbitrary.

### Neutral

- **Flat destination structure.** Agents are copied to `agents/` (flat), not `agents/<pack>/`. The pack system is an installer concept; at runtime, all agents are peers.
- **Mandatory packs are implicit.** `main` and `writers` are not listed in `.codice-version.installedPacks` — they are always present.

## Alternatives Considered

### 1. Keep Flat Directory with Tags

Add YAML `tags:` to each agent and filter at runtime. Rejected because:
- Does not reduce the number of files installed — all agents still copied
- Runtime filtering adds complexity to OpenCode's agent loading
- Does not solve the relevance problem for non-developer users

### 2. Separate npm Packages per Pack

Publish `@fisherk2-dev/codice-pack-business` etc. Rejected because:
- Massive maintenance burden — 8 additional packages to version and publish
- Dependency resolution complexity
- Breaks the single-command installation promise

### 3. Pack-Based System (Chosen)

Organize agents into pack directories within the template. The installer presents a selection UI. This is the simplest approach that:
- Reduces installed agent count for non-developer users
- Maintains single-package distribution
- Preserves the flat `agents/` runtime structure
- Integrates with existing auto-discovery

## References

- [spec-agent-packs.md](../spec-agent-packs.md) — Complete specification with agent classification
- [spec-installer-ux-v2.md](../spec-installer-ux-v2.md) — Installer UX with pack selection
- [ADR-013](./adr-013-plugin-auto-discovery.md) — Auto-discovery system (extended for packs)
- [ADR-015](./adr-015-installer-ux-v2.md) — Installer UX v2 decision
