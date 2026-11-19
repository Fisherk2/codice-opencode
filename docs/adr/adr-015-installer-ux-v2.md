# ADR-015: Installer UX v2

**Status:** Accepted

**Date:** 2026-08-04

**Author:** Fisherk2

**Reference:** v2.0.0 — Installer UX with Pack Selection

## Context

The v1.x installer supports three modes: Clean Install, Project Install, and Update Workspace. The update flow reads `.codice-version` (containing only a version string) and copies Obligatorio + Estándar files.

The v2.0.0 agent pack system (ADR-014) introduces a new dimension: **selectable agent categories**. The installer must now:

1. Present a pack selection screen during Clean Install and Project Install.
2. Persist which packs were installed for future update scoping.
3. Support two update modes: update current packs only, or update + add new packs.
4. Block updates for v1.x installations (incompatible metadata format).

The existing `.codice-version` format contains only `installedVersion`, `installedAt`, and `optionalSelections`. It has no concept of installed packs. The update flow has no mechanism to scope which agents to update.

Additionally, users on pre-2.0.0 versions have workspace structures that may contain remnants from older versions (`references/`, `.devin/`). The installer should detect and warn about these.

## Decision

We adopt a **metadata-driven installer UX** with version-gated updates and pack-aware installation flows:

### Version Detection

| Condition | Behavior |
|-----------|----------|
| No `.codice-version` | Block Update option. Allow Clean/Project Install. |
| Version < 1.2.0 | Block Update. Suggest deleting `references/` and `.devin/`. |
| 1.2.0 ≤ Version < 2.0.0 | Block Update. Suggest reinstalling via Clean/Project Install. |
| Version ≥ 2.0.0 | Enable all options including Update. |

### New `.codice-version` Format

```json
{
  "version": "2.0.0",
  "installedPacks": ["software-development", "business"],
  "installedAt": "2026-08-04T12:00:00Z"
}
```

The `installedPacks` array drives update scoping. `main` and `writers` are implicit (always installed, not listed).

### Install Wizard (Clean & Project)

1. **Pack selection** — Checkbox list of 8 packs, `software-development` pre-selected. Minimum 1 required.
2. **Optional files** — Existing behavior unchanged.
3. **Installation summary** — Shows packs + optional files + estimated agent count. Cancel → menu. Accept → install.
4. **Post-install** — Write `.codice-version` with metadata.

### Update Workspace

Two sub-options presented after version check:

- **Option A: Update current workspace** — Reads `installedPacks`, updates only those packs. No new agents from unselected packs.
- **Option B: Update and add packs** — Shows pack selection with installed packs LOCKED. User can only ADD new packs. If no new pack selected, cancel and return to menu.

### Merge Behavior

| Directory | Behavior |
|-----------|----------|
| `core/` | Always copied/overwritten (same as current Obligatorio) |
| `packs/main/` + `packs/writers/` | Always copied/overwritten (mandatory) |
| `packs/<selected>/` | Copied based on selection (install) or `installedPacks` (update) |
| `estandar/` | Unchanged behavior |
| `opcional/` | Unchanged behavior |

### CLI Flag Extensions

| Flag | Purpose |
|------|---------|
| `--packs <list>` | Comma-separated packs for non-interactive install |
| `--packs-all` | Install all packs (non-interactive) |
| `--update-add-packs <list>` | Add packs during non-interactive update |

## Consequences

### Positive

- **Scoped updates.** Users who installed only `software-development` don't suddenly receive 47 business agents on update.
- **Gradual expansion.** Users can add packs incrementally via Option B without reinstalling from scratch.
- **Clear migration path.** v1.x users get actionable messages explaining why update is blocked and what to do.
- **Non-interactive support.** CI/CD pipelines can specify packs via `--packs` flag.
- **Metadata-driven.** The `.codice-version` file is the single source of truth for what's installed.

### Negative

- **Breaking change for updates.** v1.x users cannot use the update path. They must reinstall, which may overwrite customizations if they choose Clean Install.
- **Increased installer complexity.** The pack selection step adds cognitive load. Users who don't care about packs must still see the screen (mitigated by default selection).
- **No pack removal.** Once a pack is installed, agents from that pack persist. Removing them requires manual deletion or a full reinstall. This is documented as tech debt (TD-V2-6).
- **Metadata migration gap.** v1.x `.codice-version` files are not upgraded in-place. Users must reinstall, which writes the new format.

### Neutral

- **Flat destination preserved.** Agents are copied to `agents/` (flat), not `agents/<pack>/`. The pack system is invisible at runtime.
- **Optional files unchanged.** The Opcional category behavior is identical to v1.x.

## Alternatives Considered

### 1. In-Place Metadata Migration

Detect v1.x `.codice-version` and add `installedPacks: ["software-development"]` automatically, enabling the update path. Rejected because:
- v1.x installations may have agents from the flat directory that don't map cleanly to packs
- The template structure changed (`core/` vs flat `obligatorio/`), so update merge logic would need version-specific branches
- Clean reinstall is safer and ensures template structure consistency

### 2. Always Update All Packs

Ignore `installedPacks` and update everything. Rejected because:
- Defeats the purpose of pack selection — users who didn't install `business` would receive business agents on update
- Violates user expectation set during installation

### 3. Metadata-Driven UX (Chosen)

Persist `installedPacks` in `.codice-version` and use it to scope updates. This is the simplest approach that:
- Respects the user's original pack selection
- Allows gradual expansion via Option B
- Provides a clear migration path (reinstall)
- Maintains backward compatibility for Clean/Project Install flows

## References

- [spec-installer-ux-v2.md](../spec-installer-ux-v2.md) — Complete specification with flow diagrams
- [spec-agent-packs.md](../spec-agent-packs.md) — Agent Pack System (pack definitions)
- [ADR-014](./adr-014-agent-pack-system.md) — Agent Pack System decision
- [spec-file-rules.md](../spec-file-rules.md) — File classification rules (unchanged)
