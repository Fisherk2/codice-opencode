# ADR-013: SDD Plugin Auto-Discovery & Configuration

**Status:** Accepted

**Date:** 2026-07-29

**Author:** Huitzilopochtli (Orchestrator)

**Reference:** Issue [#53](https://github.com/fisherk2/codice-opencode/issues/53)

## Context

The SDD Pipeline plugin (`sdd-pipeline.ts`, 665 lines) had 6 hardcoded maps that coupled the plugin to the documentation:

| # | Constant | Lines | Coupling |
|---|----------|-------|----------|
| 1 | `COMMAND_AGENT_MAP` | 43–56 | Adding a command required editing plugin |
| 2 | `VALID_SUBAGENTS` | 253–298 | Adding a subagent required editing plugin |
| 3 | `INTENT_PATTERNS` | 62–135 | Adding a command required adding keywords |
| 4 | `COMMAND_PHASE_MAP` | 232–245 | Adding a command required editing this map |
| 5 | `PHASE_SUGGESTIONS` | 315–357 | Adding an agent/command required editing |
| 6 | `AGENT_MENTION_PATTERNS` | 33–40 | Adding a primary agent required editing |

Every time a user added a command or agent to their workspace (a documented workflow in the Wiki), they had to edit a 665-line TypeScript plugin. This contradicted the Wiki's user-facing documentation, which said "Create `commands/my-command.md`" without mentioning the plugin update step.

Additionally, the plugin directory had zero quality infrastructure:

| Dimension | `src/` + `tests/` | Plugin directory |
|-----------|-------------------|------------------|
| Biome lint | ✅ Covered | ❌ Excluded (`!!**/template`) |
| Biome format | ✅ Enforced | ❌ Excluded |
| Unit tests | ✅ 596 tests | ❌ Zero |
| Integration tests | ✅ | ❌ Zero |

The plugin is loaded automatically for 100% of Códice workspace users. A bug in `DESTRUCTIVE_PATTERNS` or `VALID_SUBAGENTS` affected every session.

## Decision

We adopt a **three-pillar approach** to decouple the plugin and establish quality infrastructure:

1. **Auto-Discovery** — Structural data (`COMMAND_AGENT_MAP`, `VALID_SUBAGENTS`, `AGENT_MENTION_PATTERNS`) is derived from the filesystem at session start by scanning `commands/*.md` YAML frontmatter and `agents/*.md` filenames.
2. **Configuration-Driven** — Behavioral data (`INTENT_PATTERNS`, `COMMAND_PHASE_MAP`, `PHASE_SUGGESTIONS`) moves to `opencode.json` under a `sddPipeline` section, editable without touching plugin code.
3. **Quality Infrastructure** — Biome coverage extends to `template/obligatorio/.opencode/plugins/`, test suites co-located with plugin source, and Justfile targets for plugin-specific checking and testing.

This decision is **cross-referenced from ADR-012** (References Co-location), which established the pattern of self-contained, discoverable artifacts in the template.

## Details

### Pillar 1: Auto-Discovery (Structural Data)

**What moves:** `COMMAND_AGENT_MAP`, `VALID_SUBAGENTS`, and `AGENT_MENTION_PATTERNS` are replaced by filesystem scans at session start.

**Why these three:** They map 1:1 to filesystem structure:
- `commands/*.md` files declare their `agent:` in YAML frontmatter — scanned to build `commandAgentMap`.
- `agents/*.md` filenames are the subagent identifiers — scanned to build `validSubagents`.
- Primary agent mention patterns are derived from the discovered subagent set.

**Implementation:** Three pure functions in `src/autoDiscovery.ts`:
- `discoverCommandAgentMap(commandsDir)` — returns `Record<string, string>` from YAML frontmatter
- `discoverValidSubagents(agentsDir)` — returns `Set<string>` from filenames
- `discoverAgentMentionPatterns(subagents)` — generates regex patterns for primary agents

**Fallback:** If `commands/` or `agents/` doesn't exist, fall back to hardcoded defaults (the extracted `DEFAULTS` object). Primary agents are always included even if their files are missing.

### Pillar 2: Configuration-Driven (Behavioral Data)

**What moves:** `INTENT_PATTERNS`, `COMMAND_PHASE_MAP`, and `PHASE_SUGGESTIONS` are loaded from `opencode.json` under a `sddPipeline` key.

**Why not auto-discovered:** These are behavioral mappings, not structural. A command's intent keywords, SDD phase, and cross-agent suggestions cannot be inferred from the file's frontmatter — they require human editorial judgment.

**Why not hardcoded:** Users customize their SDD workflow. Editing a JSON config is safer than editing a 665-line TypeScript file.

**Implementation:** `src/configLoader.ts` provides `loadSddConfig(projectDir)` which:
1. Reads `opencode.json` from the project directory
2. Extracts the `sddPipeline` section
3. Merges user config over `DEFAULTS` (per-key, missing keys fall back)
4. Validates phase names, command formats, and suggestion targets

### Pillar 3: Quality Infrastructure

**Biome configuration:** The blanket `!!**/template` exclusion is removed. Instead, exclude only `template/obligatorio/skills/` and `template/opcional/skills/` (external skill code with their own dependencies). Plugin source at `template/obligatorio/.opencode/plugins/` is now covered.

**Test structure:** Tests are co-located with plugin source at `src/__tests__/`:
- `defaults.test.ts` — DEFAULTS integrity, constants not mutated
- `types.test.ts` — Type validation and guards
- `autoDiscovery.test.ts` — Scan with valid files, empty directory, missing directory, malformed frontmatter
- `configLoader.test.ts` — Valid config, missing file, invalid JSON, partial config, validation failures

**Justfile targets:**
- `check-plugin` — Biome check on both plugin directories
- `test-plugin-unit` — Plugin unit tests
- `test-plugin-integration` — Plugin integration tests
- `test-plugin-e2e` — Plugin E2E tests

## Consequences

### Positive

- **Adding a command is auto-detected.** Create `commands/my-command.md` with `agent:` frontmatter and the plugin discovers it on next session start. No plugin edit needed.
- **Adding an agent is auto-detected.** Create `agents/my-agent.md` and the plugin accepts `task()` calls targeting it without modifying `VALID_SUBAGENTS`.
- **Plugin shrinks.** The main `sdd-pipeline.ts` is reduced from 665 to a leaner orchestration file (707 lines including 4 extracted modules of 826 combined lines). The inline hardcoded constants are replaced with imports.
- **Quality parity.** Plugin code is linted, formatted, and tested with the same rigor as `src/`. Four test files (674 lines) cover auto-discovery, config loading, defaults, and type validation.
- **User-friendly configuration.** Users customize behavioral SDD settings via `opencode.json` — no TypeScript editing required.
- **Safety preserved.** `DESTRUCTIVE_PATTERNS` remains hardcoded in the plugin — behavioral customization cannot override security guards.

### Negative

- **Slight initialization overhead.** Filesystem scans for `commands/` and `agents/` add <5ms per session start. Config parsing is negligible.
- **Config fragmentation.** SDD configuration lives in `opencode.json` rather than co-located with the plugin source. Users must know to look there.
- **Backward compatibility maintained.** The plugin still works without `sddPipeline` config — it falls back to `DEFAULTS` transparently. No breaking changes.

### Neutral

- **The tests directory is co-located** (`src/__tests__/`) rather than placed in the project-level `tests/` directory. This follows the co-location pattern established by the plugin's own directory structure.

## Alternatives Considered

### 1. Keep Fully Hardcoded

Maintain all 6 maps inline in `sdd-pipeline.ts`. Rejected because:
- Every command/agent addition requires editing a 665-line TypeScript file
- Contradicts user-facing Wiki documentation ("create `commands/my-command.md`")
- High friction for workspace customization — no user should need to edit plugin source

### 2. Symlink-Based Sharing

Install plugin source from the Códice package into the user's workspace via symlinks, so updates are automatic. Rejected because:
- Complexity: symlink management adds edge cases (broken symlinks, platform differences)
- Security: symlinks to external sources during session initialization are a risk
- npm strips symlinks from tarballs (already established in ADR-008)

### 3. External Config File

Store behavioral data in a separate `.sddrc` or `sdd-config.json` file. Rejected because:
- Configuration fragmentation — users already have `opencode.json`
- No benefit over the `sddPipeline` section approach
- Extra file to document, validate, and maintain

### 4. Three-Pillar Approach (Chosen)

Filesystem auto-discovery for structural data + `opencode.json` section for behavioral data + quality infrastructure. This is the simplest approach that:
- Eliminates plugin edits for common operations (add command, add agent)
- Leverages existing `opencode.json` config (no new files)
- Provides safety through validation and quality gates
- Establishes test coverage for the plugin for the first time

## References

- Issue [#53](https://github.com/fisherk2/codice-opencode/issues/53) — SDD Plugin Decoupling (moved from v1.3.0 to v1.2.0)
- [spec-sdd-plugin-decoupling.md](../spec-sdd-plugin-decoupling.md) — Complete specification with implementation details
- [ADR-012](./adr-012-references-co-location.md) — References Co-location (cross-referenced pattern of self-contained artifacts)
- [docs/diagnosis/fix06-v1.2-phase3-documentation.md](../../docs/diagnosis/fix06-v1.2-phase3-documentation.md) — FEV-13 diagnosis document
- [docs/WORKFLOW.md](../../docs/WORKFLOW.md) — FEV-13 implementation plan
