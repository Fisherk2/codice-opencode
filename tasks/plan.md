# Implementation Plan: FEV-13 — SDD Plugin Decoupling & Quality Infrastructure

**Phase:** FEV-13 (v1.2 Phase 3)
**Issues:** [#53](https://github.com/fisherk2/codice-opencode/issues/53) (moved from v1.3.0 to v1.2.0), [#51](https://github.com/fisherk2/codice-opencode/issues/51) (Documentation Reduction)
**Spec:** [specs/spec-sdd-plugin-decoupling.md](../specs/spec-sdd-plugin-decoupling.md)
**Date:** 2026-07-29
**Author:** Moctezuma (Strategic Planner)
**Diagnosis:** [fix06-v1.2-phase3-documentation.md](../docs/diagnosis/fix06-v1.2-phase3-documentation.md)
**Methodology:** Vertical slicing + Plugin Quality Infrastructure + Strategy/Adapter/Null Object patterns

---

## Overview

Resolver el acoplamiento entre el plugin SDD (`sdd-pipeline.ts`, 665 líneas) y la documentación del workspace. La spec define tres pilares:

1. **Pillar 1 (Auto-Discovery):** `COMMAND_AGENT_MAP` y `VALID_SUBAGENTS` derivados del filesystem (`commands/*.md` frontmatter, `agents/*.md` filenames) en session start.
2. **Pillar 2 (Configuration-Driven):** `INTENT_PATTERNS`, `COMMAND_PHASE_MAP`, `PHASE_SUGGESTIONS` movidos a `opencode.json` bajo `sddPipeline` section.
3. **Pillar 3 (Quality Infrastructure):** Biome coverage, test suites, Justfile targets para el plugin directory.

**Issue #51 — Documentation Reduction:** Additionally, reduce all workspace documentation files >500 lines to <500 lines by removing obsolete content while preserving error/fix history. Rewrite Wiki pages for end users (8 pages total). See Phase 0.

**Restricciones del usuario:**
- `DESTRUCTIVE_PATTERNS` permanece hardcoded (safety boundary) — OQ-4 confirmado
- `sddPipeline` config clasificado como Obligatorio (updates del plugin sincronizan con defaults) — OQ-1 confirmado
- Auto-discovery scan en cada session sin cache (<5ms) — OQ-2 confirmado
- Plugin warns via `console.debug` cuando comando existe en `commands/` pero no en `commandPhaseMap` — OQ-3 confirmado

**Cambio arquitectónico:** El plugin pasa de 665 líneas con 6 hardcoded maps a ~350 líneas con auto-discovery + config-driven defaults. Skills/commands se vuelven self-describing (frontmatter como source of truth). Esto cierra el Issue #53 y elimina la fricción de customization para usuarios.

**Versión:** Sin bump — v1.2.0 se lanza al cerrar FEV-12 ✅ + FEV-13 + FEV-14 + FEV-15.

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Auto-Discovery con fallback a defaults** | Strategy pattern: discovery es primary, defaults es fallback safety net. Cambios en filesystem se reflejan inmediatamente. |
| **`sddPipeline` config bajo `opencode.json`** | Issue #52 ya validó este approach. Reutiliza el schema existente, no introduce nuevo archivo. |
| **`sddPipeline` como Obligatorio** | OQ-1 confirmado. Defaults del plugin se sincronizan con updates; usuarios que customizan lo hacen sobre su copia. |
| **DESTRUCTIVE_PATTERNS hardcoded** | OQ-4 confirmado. Safety boundary no debe ser configurable. Si usuario necesita permitir comando, ajusta `permission.bash` rules. |
| **Scan every session, no cache** | OQ-2 confirmado. <200 archivos, <5ms overhead. Caching añade invalidación complexity sin ganancia real. |
| **Null Object pattern para defaults** | `DEFAULTS` object siempre presente, usado cuando discovery/config faltan. Plugin nunca crashea por ausencia de datos. |
| **Adapter pattern para config loader** | `configLoader` adapta `opencode.json` (JSON) a `SddPipelineConfig` (typed). Validación ocurre en el adapter. |
| **Plugin file <400 lines** | SC-6 del spec. Las 6 maps hardcoded se mueven a `defaults.ts` (~150 lines) + `autoDiscovery.ts` (~80 lines) + `configLoader.ts` (~70 lines). Plugin queda como facade. |
| **Biome includes plugin dirs** | Pillar 3. Remover `!!**/template` blanket exclusion, ser específico con `!!**/template/obligatorio/skills` y `!!**/template/opcional/skills`. |
| **Plugin tests separados de `src/` tests** | Plugin es runtime environment distinto (OpenCode runtime, no Bun test runner). `tests/plugin/` directory dedicado. |
| **Sin versión bump** | Coherente con FEV-12. v1.2.0 se lanza al cierre coordinado de las 4 FEVs pendientes. |
| **`git mv` para mover archivos** | Preserva historial donde aplique. Para archivos nuevos, `git add` normal. |

---

## Dependency Graph

```
Phase 0: Documentation Reduction (Issue #51 — no dependencies, parallel with all phases)
├── Task 0.1: Audit WORKFLOW.md — remove completed phase details (FEV-1 through FEV-10), keep current state. Target: <300 lines
├── Task 0.2: Audit CHANGELOG.md — consolidate pre-v1.0 entries into single "Early Development" section. Target: <350 lines
├── Task 0.3: Audit SPEC.md — remove resolved decisions (move to ADRs), keep only active spec. Target: <400 lines
└── Task 0.4: Verify cross-references — ensure no broken internal links after reductions

Phase 1: Foundation (extract DEFAULTS — no behavior change)
├── Task 1.1: Extract DEFAULTS to src/defaults.ts (constants)
├── Task 1.2: Add SddPipelineConfig type (interfaces)
└── Checkpoint: Plugin behavior identical, all tests pass

Phase 2: Auto-Discovery Implementation (Pillar 1)
├── Task 2.1: Create src/autoDiscovery.ts (scan functions)
├── Task 2.2: Unit tests for autoDiscovery
└── Task 2.3: Wire auto-discovery into plugin (with fallback)

Phase 3: Configuration-Driven Behavior (Pillar 2)
├── Task 3.1: Create src/configLoader.ts (opencode.json adapter)
├── Task 3.2: Unit tests for configLoader
├── Task 3.3: Add sddPipeline section to opencode.json (default values)
└── Task 3.4: Wire config into plugin (merge with defaults)

Phase 4: Quality Infrastructure (Pillar 3)
├── Task 4.1: Update biome.json (include plugin dirs)
├── Task 4.2: Add Justfile targets (check-plugin, test-plugin-*)
├── Task 4.3: First batch: unit tests for normalizeBash, destructivePatterns
└── Task 4.4: Update `just check` to include plugin dirs

Phase 5: Plugin Hook Integration Tests
├── Task 5.1: chatMessage hook tests
├── Task 5.2: tool.execute.before hook tests
└── Task 5.3: system.transform hook tests

Phase 6: E2E Tests for Plugin
├── Task 6.1: E2E: plugin file exists after clean install
├── Task 6.2: E2E: plugin passes Biome lint
└── Task 6.3: E2E: audit log created on first session

Phase 7: Documentation
├── Task 7.1: Create ADR-013 (Plugin Auto-Discovery & Configuration)
├── Task 7.2: Update Wiki (Agents, Commands, Skills pages)
└── Task 7.3: Update diagnosis with results

Phase 8: Cleanup (Phase D from spec)
├── Task 8.1: Remove hardcoded maps from sdd-pipeline.ts
├── Task 8.2: Verify plugin <400 lines, all tests pass
└── Task 8.3: Full regression: just check, bun test, E2E

Phase 9: Verification & Ship
├── Task 9.1: just check (all directories)
├── Task 9.2: bun test (full suite)
├── Task 9.3: just test:e2e (15/15 + 3 new = 18/18)
├── Task 9.4: Coverage report (plugin >80%)
├── Task 9.5: Code Review 5-ejes by Tezcatlipoca
└── Task 9.6: Ship Review GO/NO-GO Decision
```

**Implementation order:** Foundation → Auto-Discovery → Config → Quality → Tests → Docs → Cleanup → Verify. Phases 2, 3, 4 can be developed in parallel modules (different files). Phase 5, 6, 7 sequential to implementation phases. Phase 8 must come after all implementation phases. Phase 9 is final gate.

---

## Task List

### Phase 0: Documentation Reduction (Issue #51)

#### Task 0.1: Audit WORKFLOW.md — Remove Completed Phase Details
**Description:** Reduce `docs/WORKFLOW.md` from 700+ lines to <300 lines by removing completed phase details (FEV-1 through FEV-10) while preserving current state and error/fix history. Keep the active phase (FEV-13+) and any ongoing phases.

**Approach:**
1. Identify all completed phase sections (FEV-1 through FEV-10)
2. Remove detailed implementation steps for completed phases
3. Keep a brief summary line for each completed phase (name + status: "Completed ✅")
4. Preserve all error/fix history sections
5. Keep current active phases (FEV-13, FEV-14, FEV-15) fully documented

**Acceptance criteria:**
- [ ] `docs/WORKFLOW.md` reduced to <300 lines
- [ ] All completed phases (FEV-1 through FEV-10) collapsed to summary lines
- [ ] Error/fix history preserved
- [ ] Active phases (FEV-13+) fully documented
- [ ] No broken internal links

**Verification:**
- [ ] `wc -l docs/WORKFLOW.md` shows <300 lines
- [ ] `grep "FEV-1" docs/WORKFLOW.md` still returns results (summary lines)
- [ ] `grep "Error\|Fix\|error\|fix" docs/WORKFLOW.md` shows preserved history

**Dependencies:** None (can run in parallel with all phases)

**Files likely touched:**
- `docs/WORKFLOW.md` (modified, -400+ lines)

**Estimated scope:** S (1 file, content reduction)

---

#### Task 0.2: Audit CHANGELOG.md — Consolidate Pre-v1.0 Entries
**Description:** Reduce `CHANGELOG.md` from 383 lines to <350 lines by consolidating pre-v1.0 entries into a single "Early Development" section. Keep v1.0+ entries intact with full detail.

**Approach:**
1. Identify all pre-v1.0 entries
2. Consolidate into a single "## Early Development (pre-v1.0)" section with brief summaries
3. Keep v1.0+ entries unchanged (full detail preserved)
4. Ensure Keep a Changelog format is maintained

**Acceptance criteria:**
- [ ] `CHANGELOG.md` reduced to <350 lines
- [ ] Pre-v1.0 entries consolidated into "Early Development" section
- [ ] v1.0+ entries preserved with full detail
- [ ] Keep a Changelog format maintained (Added, Changed, Fixed, Security sections)

**Verification:**
- [ ] `wc -l CHANGELOG.md` shows <350 lines
- [ ] `grep "Early Development" CHANGELOG.md` returns result
- [ ] `grep "v1.0" CHANGELOG.md` returns results (entries preserved)

**Dependencies:** None

**Files likely touched:**
- `CHANGELOG.md` (modified, -30+ lines)

**Estimated scope:** XS (1 file, consolidation)

---

#### Task 0.3: Audit SPEC.md — Remove Resolved Decisions
**Description:** Reduce `SPEC.md` from 459 lines to <400 lines by removing the "Resolved Decisions" section (moves to ADRs) and keeping only the active specification. The 9 resolved decisions are already documented in ADRs.

**Approach:**
1. Remove the "## Resolved Decisions" section (table of 9 decisions)
2. Add a brief note: "Resolved decisions are documented in the respective ADRs (see `specs/adr/`)."
3. Keep all active specification content (objectives, user stories, tech stack, commands, project structure, code style, testing strategy, boundaries, success criteria)
4. Verify no other content depends on the resolved decisions section

**Acceptance criteria:**
- [ ] `SPEC.md` reduced to <400 lines
- [ ] "Resolved Decisions" section removed
- [ ] Brief reference to ADRs added
- [ ] All active spec content preserved
- [ ] No broken internal links

**Verification:**
- [ ] `wc -l SPEC.md` shows <400 lines
- [ ] `grep "Resolved Decisions" SPEC.md` returns no results
- [ ] `grep "ADR" SPEC.md` returns the new reference line

**Dependencies:** None

**Files likely touched:**
- `SPEC.md` (modified, -60+ lines)

**Estimated scope:** XS (1 file, section removal)

---

#### Task 0.4: Verify Cross-References After Reductions
**Description:** After completing Tasks 0.1–0.3, verify that no internal links are broken across the documentation. Check all cross-references between WORKFLOW.md, CHANGELOG.md, SPEC.md, and other docs.

**Acceptance criteria:**
- [ ] All internal links in WORKFLOW.md, CHANGELOG.md, SPEC.md are valid
- [ ] No broken cross-references from other docs to modified files
- [ ] Any references to removed content updated

**Verification:**
- [ ] `grep -r "WORKFLOW.md\|CHANGELOG.md\|SPEC.md" docs/ specs/` — all references still valid
- [ ] No 404-style broken links

**Dependencies:** Tasks 0.1, 0.2, 0.3

**Files likely touched:**
- Any documentation file with broken links (if found)

**Estimated scope:** XS (verification + minor fixes)

---

### Phase 1: Foundation — Extract DEFAULTS & Types

#### Task 1.1: Extract DEFAULTS to `src/defaults.ts`
**Description:** Create a new module `src/defaults.ts` (inside the plugin directory: `template/obligatorio/.opencode/plugins/src/defaults.ts`) that exports the 6 hardcoded maps currently in `sdd-pipeline.ts` as `DEFAULTS` object. No behavior change — plugin imports from defaults.ts as before.

**Module structure:**
```typescript
// src/defaults.ts
export const DEFAULT_COMMAND_AGENT_MAP: Record<string, string> = { ... }
export const DEFAULT_VALID_SUBAGENTS: Set<string> = new Set([ ... ])
export const DEFAULT_INTENT_PATTERNS: Record<string, string[]> = { ... }
export const DEFAULT_COMMAND_PHASE_MAP: Record<string, string> = { ... }
export const DEFAULT_PHASE_SUGGESTIONS: Record<string, Record<string, string>> = { ... }
export const DEFAULT_AGENT_MENTION_PATTERNS: Record<string, RegExp[]> = { ... }
export const DESTRUCTIVE_PATTERNS: readonly RegExp[] = [ ... ] // NOT configurable
```

**Acceptance criteria:**
- [ ] `src/defaults.ts` created with all 6 defaults exported
- [ ] `DESTRUCTIVE_PATTERNS` exported separately (marked as safety boundary, not part of `DEFAULTS`)
- [ ] `sdd-pipeline.ts` updated to import from `defaults.ts` instead of inline definitions
- [ ] All existing tests pass without modification (behavior unchanged)
- [ ] `just check` passes (biome + tsc)

**Verification:**
- [ ] `grep -c "COMMAND_AGENT_MAP\|VALID_SUBAGENTS\|INTENT_PATTERNS\|COMMAND_PHASE_MAP\|PHASE_SUGGESTIONS\|AGENT_MENTION_PATTERNS" template/obligatorio/.opencode/plugins/sdd-pipeline.ts` shows 0 (moved to defaults.ts)
- [ ] `bun test tests/` passes (no regression)
- [ ] `just check` exit code 0

**Dependencies:** None

**Files likely touched:**
- `template/obligatorio/.opencode/plugins/src/defaults.ts` (new, ~180 lines)
- `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` (imports + deletes inline maps, -180 lines)

**Estimated scope:** S (1 new file, 1 file modified)

---

#### Task 1.2: Add `SddPipelineConfig` type definition
**Description:** Define the TypeScript interface for the `sddPipeline` config section in `opencode.json`. This is the contract between `configLoader` and the plugin.

**Type definition (in `src/types.ts`):**
```typescript
export interface SddPipelineConfig {
  readonly commandPhaseMap?: Readonly<Record<string, string>>
  readonly intentPatterns?: Readonly<Record<string, readonly string[]>>
  readonly phaseSuggestions?: Readonly<Record<string, Readonly<Record<string, string>>>>
}

export const DEFAULT_SDD_PIPELINE_CONFIG: SddPipelineConfig = {
  commandPhaseMap: DEFAULT_COMMAND_PHASE_MAP,
  intentPatterns: DEFAULT_INTENT_PATTERNS,
  phaseSuggestions: DEFAULT_PHASE_SUGGESTIONS,
}
```

**Acceptance criteria:**
- [ ] `SddPipelineConfig` interface defined with readonly modifiers
- [ ] `DEFAULT_SDD_PIPELINE_CONFIG` constant exported
- [ ] All fields optional (config can be partial)
- [ ] JSDoc comments explaining each field

**Verification:**
- [ ] `bun run tsc --noEmit` passes
- [ ] Interface matches the schema in spec section 5.2

**Dependencies:** Task 1.1

**Files likely touched:**
- `template/obligatorio/.opencode/plugins/src/types.ts` (new, ~40 lines)

**Estimated scope:** XS (1 small file)

---

### Checkpoint: Foundation Complete
- [ ] All 6 defaults extracted to `defaults.ts`
- [ ] `SddPipelineConfig` type defined
- [ ] Plugin behavior identical (no regression)
- [ ] All existing tests pass
- [ ] `just check` exit 0
- [ ] Review with human before proceeding to Phase 2

---

### Phase 2: Auto-Discovery Implementation (Pillar 1)

#### Task 2.1: Create `src/autoDiscovery.ts` with scan functions
**Description:** Implement filesystem scanning functions that derive `commandAgentMap` and `validSubagents` from the user's workspace structure at plugin initialization.

**Functions to implement:**
```typescript
// src/autoDiscovery.ts
export function discoverCommandAgentMap(commandsDir: string): Record<string, string>
export function discoverValidSubagents(agentsDir: string): Set<string>
export function discoverAgentMentionPatterns(agents: Set<string>): Record<string, RegExp[]>
```

**Algorithm (per spec section 4):**
1. Check if directory exists with `existsSync`
2. If not, return `DEFAULT_COMMAND_AGENT_MAP` / `DEFAULT_VALID_SUBAGENTS`
3. Read YAML frontmatter from each `commands/*.md` file
4. Extract `agent` field, map to `/{filename}` → agent name
5. For agents: extract filename without `.md` extension
6. For mention patterns: only primary agents (6) get patterns

**Acceptance criteria:**
- [ ] `discoverCommandAgentMap()` implemented
- [ ] `discoverValidSubagents()` implemented
- [ ] `discoverAgentMentionPatterns()` implemented
- [ ] All three functions have fallback to DEFAULTS when directory missing
- [ ] Edge cases handled: malformed frontmatter, missing `agent:` field, non-.md files
- [ ] Uses `existsSync` and `readdirSync` from Node's `fs` module (no new dependencies)

**Verification:**
- [ ] `bun run tsc --noEmit` passes
- [ ] `grep -c "Bun\." template/obligatorio/.opencode/plugins/src/autoDiscovery.ts` shows 0 (no Bun-specific APIs)
- [ ] Functions return correct types per signatures

**Dependencies:** Task 1.1

**Files likely touched:**
- `template/obligatorio/.opencode/plugins/src/autoDiscovery.ts` (new, ~80 lines)

**Estimated scope:** M (3 functions + edge cases + types)

---

#### Task 2.2: Unit tests for `autoDiscovery`
**Description:** Comprehensive unit tests for the auto-discovery functions. Use temporary directories with mocked command/agent files.

**Test scenarios:**
- Valid commands dir with 3 commands → correct map
- Valid agents dir with 5 agents → correct set + 6 primary always included
- Missing commands dir → returns DEFAULT_COMMAND_AGENT_MAP
- Missing agents dir → returns DEFAULT_VALID_SUBAGENTS
- Empty dir (exists but no .md files) → returns defaults
- Malformed YAML frontmatter → skips file, logs warning
- Missing `agent:` field → skips file
- Non-.md files → ignored
- Special characters in filenames → handled
- Concurrent modification (file deleted during scan) → graceful failure

**Acceptance criteria:**
- [ ] `tests/plugin/unit/autoDiscovery.test.ts` created
- [ ] All 10 scenarios tested
- [ ] Uses `beforeEach`/`afterEach` to create/cleanup temp dirs
- [ ] No mocks for fs (use real temp dirs)
- [ ] Coverage of `autoDiscovery.ts` >90%

**Verification:**
- [ ] `bun test tests/plugin/unit/autoDiscovery.test.ts` passes
- [ ] `bun test --coverage tests/plugin/unit/autoDiscovery.test.ts` shows >90% coverage of `autoDiscovery.ts`

**Dependencies:** Task 2.1

**Files likely touched:**
- `tests/plugin/unit/autoDiscovery.test.ts` (new, ~200 lines)

**Estimated scope:** M (10 test scenarios)

---

#### Task 2.3: Wire auto-discovery into plugin (with fallback)
**Description:** Modify the plugin's main function to call `discoverCommandAgentMap()` and `discoverValidSubagents()` at initialization. Use discovered values, with `DEFAULTS` as fallback. Plugin behavior is now data-driven but identical if filesystem matches the hardcoded structure.

**Changes to `sdd-pipeline.ts`:**
```typescript
export const SddPipelinePlugin: Plugin = async (ctx) => {
  const { directory } = ctx
  const projectDir = directory || process.cwd()

  // Auto-discovery with fallback
  const commandsDir = join(projectDir, "commands")
  const agentsDir = join(projectDir, "agents")
  const commandAgentMap = discoverCommandAgentMap(commandsDir)
  const validSubagents = discoverValidSubagents(agentsDir)
  const agentMentionPatterns = discoverAgentMentionPatterns(validSubagents)

  // ... rest of plugin uses commandAgentMap, validSubagents, agentMentionPatterns
}
```

**Acceptance criteria:**
- [ ] Plugin calls auto-discovery functions at init
- [ ] Discovered values used in hooks
- [ ] Defaults used when directories don't exist
- [ ] `console.debug` log shows discovered vs fallback on init
- [ ] All existing tests still pass (no regression)

**Verification:**
- [ ] `bun test tests/` passes (no regression)
- [ ] `just check` exit 0
- [ ] Manual test: create `commands/foo.md` with `agent: tlaloc`, verify plugin detects it without editing plugin code

**Dependencies:** Tasks 2.1, 2.2

**Files likely touched:**
- `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` (modified, +20 lines)

**Estimated scope:** S (1 file, minor changes)

---

### Checkpoint: Auto-Discovery Working
- [ ] `autoDiscovery.ts` implemented and tested (>90% coverage)
- [ ] Plugin uses auto-discovery with fallback
- [ ] Adding a new command in `commands/` detected without editing plugin (SC-1)
- [ ] Adding a new agent in `agents/` accepted by `task()` validation (SC-2)
- [ ] All existing tests pass
- [ ] `just check` exit 0
- [ ] Review with human before proceeding to Phase 3

---

### Phase 3: Configuration-Driven Behavior (Pillar 2)

#### Task 3.1: Create `src/configLoader.ts` with `loadSddConfig()` function
**Description:** Implement the adapter that reads `opencode.json` and extracts the `sddPipeline` section. Returns a typed `SddPipelineConfig` object. Validation occurs during loading.

**Function signature:**
```typescript
// src/configLoader.ts
export function loadSddConfig(projectDir: string): SddPipelineConfig
```

**Algorithm:**
1. Check if `opencode.json` exists
2. If not, return `DEFAULT_SDD_PIPELINE_CONFIG`
3. Read and parse JSON
4. Extract `sddPipeline` key (optional)
5. Validate: `commandPhaseMap` values must be valid phases
6. Validate: `intentPatterns` keys must start with `/`
7. Validate: `phaseSuggestions` keys must be valid phase names
8. Merge with defaults (config wins on conflict)
9. Log warnings for invalid entries
10. Return merged config

**Acceptance criteria:**
- [ ] `loadSddConfig()` implemented
- [ ] Returns `SddPipelineConfig` type
- [ ] Validates `commandPhaseMap` values
- [ ] Validates `intentPatterns` keys
- [ ] Validates `phaseSuggestions` keys
- [ ] Logs warnings (not errors) for invalid entries
- [ ] Returns defaults on parse error (no crash)
- [ ] Uses `existsSync`, `readFileSync` from Node's `fs` module

**Verification:**
- [ ] `bun run tsc --noEmit` passes
- [ ] Function returns correct types per signature
- [ ] `grep -c "Bun\." template/obligatorio/.opencode/plugins/src/configLoader.ts` shows 0

**Dependencies:** Task 1.2

**Files likely touched:**
- `template/obligatorio/.opencode/plugins/src/configLoader.ts` (new, ~70 lines)

**Estimated scope:** M (loader + validation)

---

#### Task 3.2: Unit tests for `configLoader`
**Description:** Comprehensive unit tests for the config loader. Test all validation paths and edge cases.

**Test scenarios:**
- Valid `opencode.json` with full `sddPipeline` → returns merged config
- Valid `opencode.json` with partial `sddPipeline` → merged with defaults
- `opencode.json` without `sddPipeline` key → returns defaults
- Missing `opencode.json` → returns defaults
- Invalid JSON in `opencode.json` → logs warning, returns defaults
- Invalid phase in `commandPhaseMap` → skips entry, logs warning
- Intent pattern key without leading `/` → skips entry, logs warning
- Invalid phase in `phaseSuggestions` → skips entry, logs warning
- Empty `sddPipeline` object → returns defaults
- `sddPipeline: null` → returns defaults

**Acceptance criteria:**
- [ ] `tests/plugin/unit/configLoader.test.ts` created
- [ ] All 10 scenarios tested
- [ ] Uses `beforeEach`/`afterEach` to create/cleanup temp files
- [ ] Coverage of `configLoader.ts` >90%

**Verification:**
- [ ] `bun test tests/plugin/unit/configLoader.test.ts` passes
- [ ] Coverage >90%

**Dependencies:** Task 3.1

**Files likely touched:**
- `tests/plugin/unit/configLoader.test.ts` (new, ~180 lines)

**Estimated scope:** M (10 test scenarios)

---

#### Task 3.3: Add `sddPipeline` section to `opencode.json` (default values)
**Description:** Add the `sddPipeline` section to `template/obligatorio/opencode.json` with the default values matching `DEFAULT_SDD_PIPELINE_CONFIG`. This ensures the plugin has a valid config to load.

**JSON structure (per spec section 5.1):**
```json
{
  "sddPipeline": {
    "commandPhaseMap": {
      "/spec": "define",
      "/design": "define",
      "/evolve": "define",
      "/diagnosis": "define",
      "/docs-update": "define",
      "/plan": "plan",
      "/build": "build",
      "/test": "verify",
      "/review": "review",
      "/ship": "ship",
      "/code-simplify": "review",
      "/webperf": "review"
    },
    "intentPatterns": { ... },
    "phaseSuggestions": { ... }
  }
}
```

**Acceptance criteria:**
- [ ] `sddPipeline` section added to `opencode.json`
- [ ] All 12 commands in `commandPhaseMap`
- [ ] All intent patterns included
- [ ] All phase suggestions included
- [ ] JSON is valid (parseable)
- [ ] Schema matches `SddPipelineConfig` interface

**Verification:**
- [ ] `jq . template/obligatorio/opencode.json` parses without error
- [ ] `grep -c '"/' template/obligatorio/opencode.json` shows ≥12 command entries
- [ ] `bun run tsc --noEmit` passes (no type errors from JSON)

**Dependencies:** Task 3.2

**Files likely touched:**
- `template/obligatorio/opencode.json` (1 section added, ~100 lines)

**Estimated scope:** S (1 file, well-defined addition)

---

#### Task 3.4: Wire config into plugin (merge with defaults)
**Description:** Modify the plugin to call `loadSddConfig()` and use the returned config for `commandPhaseMap`, `intentPatterns`, and `phaseSuggestions`. Also implement OQ-3: warn via `console.debug` when a command exists in `commands/` but has no `commandPhaseMap` entry.

**Changes to `sdd-pipeline.ts`:**
```typescript
export const SddPipelinePlugin: Plugin = async (ctx) => {
  // ... auto-discovery ...

  // Config loading
  const sddConfig = loadSddConfig(projectDir)
  const commandPhaseMap = sddConfig.commandPhaseMap ?? DEFAULT_COMMAND_PHASE_MAP
  const intentPatterns = sddConfig.intentPatterns ?? DEFAULT_INTENT_PATTERNS
  const phaseSuggestions = sddConfig.phaseSuggestions ?? DEFAULT_PHASE_SUGGESTIONS

  // OQ-3: Warn for commands without phase mapping
  for (const command of Object.keys(commandAgentMap)) {
    if (!commandPhaseMap[command]) {
      console.debug(`[sdd-pipeline] Command "${command}" has no commandPhaseMap entry, defaulting to "idle"`)
    }
  }

  // ... rest of plugin
}
```

**Acceptance criteria:**
- [ ] Plugin calls `loadSddConfig()` at init
- [ ] Uses config values for `commandPhaseMap`, `intentPatterns`, `phaseSuggestions`
- [ ] Falls back to defaults when config is missing
- [ ] OQ-3: `console.debug` warning for commands without phase mapping
- [ ] All existing tests pass
- [ ] SC-3 satisfied: behavioral data configurable via `opencode.json`

**Verification:**
- [ ] `bun test tests/` passes (no regression)
- [ ] `just check` exit 0
- [ ] Manual test: edit `opencode.json` to add custom intent pattern, verify plugin uses it
- [ ] Manual test: add new command in `commands/` without phase entry, verify debug warning appears

**Dependencies:** Tasks 3.1, 3.2, 3.3

**Files likely touched:**
- `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` (modified, +30 lines)

**Estimated scope:** S (1 file, well-defined changes)

---

### Checkpoint: Configuration Working
- [ ] `configLoader.ts` implemented and tested (>90% coverage)
- [ ] `opencode.json` has valid `sddPipeline` section
- [ ] Plugin reads from config, merges with defaults
- [ ] OQ-3: debug warning for missing command entries
- [ ] SC-3 satisfied: intent/phase/suggestions configurable
- [ ] SC-8 satisfied: backward compatible (works without config)
- [ ] All existing tests pass
- [ ] Review with human before proceeding to Phase 4

---

### Phase 4: Quality Infrastructure (Pillar 3)

#### Task 4.1: Update `biome.json` to include plugin directories
**Description:** Modify `biome.json` to include `template/obligatorio/.opencode/plugins/` and `template/opcional/.opencode/plugins/` in lint/format scope. Remove the blanket `!!**/template` exclusion and use specific exclusions only for skills.

**Changes to `biome.json`:**
```json
{
  "files": {
    "includes": [
      "**",
      "!!**/dist",
      "!!**/node_modules",
      "!!**/template/obligatorio/skills",
      "!!**/template/opcional/skills",
      "!!**/skills"
    ]
  }
}
```

**Acceptance criteria:**
- [ ] `biome.json` updated with specific exclusions
- [ ] `template/obligatorio/.opencode/plugins/` is now linted
- [ ] `template/opcional/.opencode/plugins/` is now linted
- [ ] Skills directories still excluded
- [ ] `bunx @biomejs/biome check` runs on plugin files

**Verification:**
- [ ] `bunx @biomejs/biome check template/obligatorio/.opencode/plugins/sdd-pipeline.ts` runs (no "ignored" message)
- [ ] `bunx @biomejs/biome check template/obligatorio/skills/` shows "ignored" (still excluded)

**Dependencies:** None

**Files likely touched:**
- `biome.json` (1 file modified)

**Estimated scope:** XS (1 file, small change)

---

#### Task 4.2: Add Justfile targets for plugin quality
**Description:** Add `check-plugin`, `test-plugin-unit`, `test-plugin-integration`, `test-plugin-e2e`, and `check-all` targets to the `Justfile`.

**Targets to add:**
```justfile
check-plugin:
    bunx @biomejs/biome check template/obligatorio/.opencode/plugins/ template/opcional/.opencode/plugins/

test-plugin-unit:
    bun test tests/plugin/unit/

test-plugin-integration:
    bun test tests/plugin/integration/

test-plugin-e2e:
    bash tests/plugin/e2e/run-plugin-e2e.sh

check-all:
    bunx @biomejs/biome check . && bun run tsc --noEmit
```

**Acceptance criteria:**
- [ ] `check-plugin` target works
- [ ] `test-plugin-unit` target works
- [ ] `test-plugin-integration` target works
- [ ] `test-plugin-e2e` target works (or placeholder for Phase 6)
- [ ] `check-all` includes plugin dirs

**Verification:**
- [ ] `just check-plugin` exit 0
- [ ] `just test-plugin-unit` runs (even if 0 tests initially)
- [ ] `just --list` shows new targets

**Dependencies:** None

**Files likely touched:**
- `Justfile` (5 new targets)

**Estimated scope:** XS (additive changes)

---

#### Task 4.3: First batch: unit tests for `normalizeBash` and `DESTRUCTIVE_PATTERNS`
**Description:** Create unit tests for the two existing pure functions in `sdd-pipeline.ts` that are easiest to test: `normalizeBash()` and the `DESTRUCTIVE_PATTERNS` array.

**Test files:**
- `tests/plugin/unit/normalizeBash.test.ts` — tests comment stripping, newline removal, whitespace collapse
- `tests/plugin/unit/destructivePatterns.test.ts` — tests each regex pattern with positive and negative cases

**Acceptance criteria:**
- [ ] `normalizeBash.test.ts` created with 8+ test cases
- [ ] `destructivePatterns.test.ts` created with 20+ test cases (each pattern: positive + negative)
- [ ] Both files have >90% coverage of their target functions
- [ ] No mocks (pure functions)

**Verification:**
- [ ] `just test-plugin-unit` passes
- [ ] Coverage report shows >90% for both files

**Dependencies:** Task 4.1, 4.2 (need infrastructure to run)

**Files likely touched:**
- `tests/plugin/unit/normalizeBash.test.ts` (new, ~80 lines)
- `tests/plugin/unit/destructivePatterns.test.ts` (new, ~150 lines)

**Estimated scope:** M (2 test files, 28+ scenarios)

---

#### Task 4.4: Update `just check` to include plugin directories
**Description:** Modify the `just check` target to also lint the plugin directories. This ensures PRs cannot merge with plugin lint errors.

**Current `just check`:**
```justfile
check:
    bunx @biomejs/biome ci src/ tests/ && bun run tsc --noEmit
```

**Updated `just check`:**
```justfile
check:
    bunx @biomejs/biome ci . && bun run tsc --noEmit
```

This relies on the updated `biome.json` from Task 4.1 which includes the plugin dirs via the `files.includes` config.

**Acceptance criteria:**
- [ ] `just check` runs Biome on entire project (including plugin dirs)
- [ ] `tsc --noEmit` still runs
- [ ] Exit code 0 when all checks pass
- [ ] Exit code non-zero when any plugin file has lint errors

**Verification:**
- [ ] `just check` exit 0
- [ ] Introduce a lint error in plugin, verify `just check` fails
- [ ] Remove the error, verify `just check` passes again

**Dependencies:** Task 4.1, 4.3

**Files likely touched:**
- `Justfile` (1 line changed)

**Estimated scope:** XS (1 line)

---

### Checkpoint: Quality Infrastructure Active
- [ ] `biome.json` includes plugin directories
- [ ] Justfile has `check-plugin`, `test-plugin-*`, `check-all` targets
- [ ] First batch of unit tests (`normalizeBash`, `destructivePatterns`) created
- [ ] `just check` enforces plugin lint
- [ ] SC-4 satisfied: plugin passes Biome lint with zero errors
- [ ] All existing tests pass
- [ ] Review with human before proceeding to Phase 5

---

### Phase 5: Plugin Hook Integration Tests

#### Task 5.1: Integration tests for `chatMessage` hook
**Description:** Test the `chat.message` hook with mocked OpenCode context. Verify agent mention detection, slash command detection, and intent keyword matching.

**Test scenarios:**
- Agent mention `@tlaloc` → sets `agent_type` to `tlaloc`
- Slash command `/spec` → sets `agent_type` to `quetzalcoatl`, phase to `define`
- Intent keyword "implementa" → triggers `/build` intent detection
- Empty message → no state change
- Multiple mentions → first match wins
- Word boundary check: `/specification` does NOT match `/spec`

**Acceptance criteria:**
- [ ] `tests/plugin/integration/chatMessage.test.ts` created
- [ ] All 6 scenarios tested
- [ ] Uses mock `MessageEvent` objects
- [ ] No real OpenCode runtime required
- [ ] Coverage of `chat.message` hook >80%

**Verification:**
- [ ] `just test-plugin-integration` passes
- [ ] Coverage >80%

**Dependencies:** Tasks 2.3, 3.4 (plugin must be wired with discovery + config)

**Files likely touched:**
- `tests/plugin/integration/chatMessage.test.ts` (new, ~150 lines)

**Estimated scope:** M (6 scenarios, mock setup)

---

#### Task 5.2: Integration tests for `tool.execute.before` hook
**Description:** Test the `tool.execute.before` hook with mocked tool input. Verify destructive command blocking and subagent validation.

**Test scenarios:**
- `Bash` tool with `rm -rf /` → throws `SddError` (destructive blocked)
- `Bash` tool with `ls -la` → passes through
- `Bash` tool with `rm -r -f` (split flags) → blocked (after normalizeBash)
- `Bash` tool with `# rm -rf /` (commented) → passes (after normalizeBash strips comment)
- `task` tool with `subagent_type: "tlaloc"` → passes
- `task` tool with `subagent_type: "fake-agent"` → throws `SddError`
- `task` tool with `subagent_type: "TLALOC"` (case variant) → passes (case-insensitive)

**Acceptance criteria:**
- [ ] `tests/plugin/integration/toolExecuteBefore.test.ts` created
- [ ] All 7 scenarios tested
- [ ] Uses mock tool input/output objects
- [ ] Coverage of `tool.execute.before` hook >80%

**Verification:**
- [ ] `just test-plugin-integration` passes
- [ ] Coverage >80%

**Dependencies:** Tasks 2.3, 3.4

**Files likely touched:**
- `tests/plugin/integration/toolExecuteBefore.test.ts` (new, ~180 lines)

**Estimated scope:** M (7 scenarios)

---

#### Task 5.3: Integration tests for `system.transform` hook
**Description:** Test the `experimental.chat.system.transform` hook with mocked output. Verify SDD context injection, phase suggestion injection, and intent suggestion injection.

**Test scenarios:**
- First call with `idle` phase → injects SDD context
- First call with `build` phase + `tlaloc` agent → injects context + phase suggestion
- `last_intent` set → injects intent suggestion
- After intent is consumed (`last_intent = null`) → no intent suggestion on next call
- System prompt array is mutated correctly (unshift)

**Acceptance criteria:**
- [ ] `tests/plugin/integration/systemTransform.test.ts` created
- [ ] All 5 scenarios tested
- [ ] Uses mock output objects
- [ ] Coverage of `system.transform` hook >70%

**Verification:**
- [ ] `just test-plugin-integration` passes
- [ ] Coverage >70%

**Dependencies:** Tasks 2.3, 3.4

**Files likely touched:**
- `tests/plugin/integration/systemTransform.test.ts` (new, ~120 lines)

**Estimated scope:** M (5 scenarios)

---

### Checkpoint: Hook Tests Complete
- [ ] All 3 integration test files created
- [ ] All hooks have >70% coverage
- [ ] SC-5 partially satisfied: plugin has comprehensive test coverage
- [ ] All existing tests pass
- [ ] Review with human before proceeding to Phase 6

---

### Phase 6: E2E Tests for Plugin

#### Task 6.1: E2E: plugin file exists after clean install
**Description:** Add a bash E2E test that runs `bun run src/cli/main.ts` with `--mode clean` in a temp directory and verifies the plugin file is present in the destination.

**Test file:** `tests/plugin/e2e/16-plugin-installation.sh`

**Acceptance criteria:**
- [ ] Test script created
- [ ] Runs CLI in clean mode
- [ ] Asserts `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` (or installed equivalent) exists
- [ ] Test passes when run via `just test-plugin-e2e`

**Verification:**
- [ ] `just test-plugin-e2e` passes
- [ ] Test script is executable
- [ ] No artifacts left in repo

**Dependencies:** None (can be developed in parallel)

**Files likely touched:**
- `tests/plugin/e2e/16-plugin-installation.sh` (new, ~50 lines)

**Estimated scope:** S (1 script)

---

#### Task 6.2: E2E: plugin passes Biome lint in installed workspace
**Description:** Add an E2E test that runs Biome check on the installed plugin file in the destination directory.

**Test file:** `tests/plugin/e2e/17-plugin-lint.sh`

**Acceptance criteria:**
- [ ] Test script created
- [ ] Runs CLI in clean mode
- [ ] Runs Biome check on installed plugin
- [ ] Asserts Biome exit code 0
- [ ] Test passes via `just test-plugin-e2e`

**Verification:**
- [ ] `just test-plugin-e2e` passes
- [ ] Biome check runs successfully on installed plugin

**Dependencies:** None (parallel)

**Files likely touched:**
- `tests/plugin/e2e/17-plugin-lint.sh` (new, ~40 lines)

**Estimated scope:** S (1 script)

---

#### Task 6.3: E2E: audit log created on first session
**Description:** Add an E2E test that simulates a plugin session and verifies the `.sdd-audit.log` file is created in `.opencode/plugins/`.

**Test file:** `tests/plugin/e2e/18-audit-log.sh`

**Acceptance criteria:**
- [ ] Test script created
- [ ] Loads the plugin in a mocked OpenCode context
- [ ] Triggers a hook (e.g., `chat.message`)
- [ ] Asserts `.sdd-audit.log` exists with at least 1 entry
- [ ] Test passes via `just test-plugin-e2e`

**Verification:**
- [ ] `just test-plugin-e2e` passes
- [ ] Audit log has valid format (timestamp + source + detail)

**Dependencies:** None (parallel)

**Files likely touched:**
- `tests/plugin/e2e/18-audit-log.sh` (new, ~60 lines)

**Estimated scope:** S (1 script)

---

### Checkpoint: E2E Tests Complete
- [ ] 3 new E2E scenarios added
- [ ] All E2E pass via `just test-plugin-e2e`
- [ ] Total E2E: 15 (existing) + 3 (new) = 18 scenarios
- [ ] Review with human before proceeding to Phase 7

---

### Phase 7: Documentation

#### Task 7.1: Create ADR-013 (Plugin Auto-Discovery & Configuration)
**Description:** Document the architectural decision to move from hardcoded maps to auto-discovery + JSON configuration. This is the primary ADR for FEV-13.

**File:** `specs/adr/adr-013-plugin-auto-discovery.md`

**Content (per ADR template):**
- Status: Accepted
- Context: The 6 hardcoded maps in sdd-pipeline.ts, the friction of customization
- Decision: Three-pillar approach (auto-discovery, config-driven, quality infra)
- Consequences: Users add commands/agents without editing plugin; plugin file shrinks; backward compat preserved
- Alternatives Considered: Keep hardcoded, fully config-driven, symlink-based sharing
- References: Issue #53, spec-sdd-plugin-decoupling.md, FEV-13 diagnosis

**Acceptance criteria:**
- [ ] `specs/adr/adr-013-plugin-auto-discovery.md` created
- [ ] Status: Accepted
- [ ] All ADR template sections present
- [ ] `docs/ARCHITECTURE.md` ADR table updated (currently shows ADR-013 as Pending → mark as Accepted)

**Verification:**
- [ ] File follows ADR-001 to ADR-012 template
- [ ] `docs/ARCHITECTURE.md` table includes ADR-013 with Accepted status

**Dependencies:** None (can be parallel with implementation)

**Files likely touched:**
- `specs/adr/adr-013-plugin-auto-discovery.md` (new, ~200 lines)
- `docs/ARCHITECTURE.md` (1 row updated)

**Estimated scope:** S (1 new ADR + 1 row update)

---

#### Task 7.2: Update Wiki (All 8 End-User Pages)
**Description:** Rewrite all 8 Wiki pages for end users. Remove all maintainer/developer references (src/, tests/, template/, dist/, sdd-pipeline.ts editing). Users should only see user-facing content: install → configure → run.

**Pages to rewrite (all 8):**

1. **`docs/wiki-source/Home.md`** — Remove references to `src/`, `tests/`, `template/`. Focus on what Códice does, quick start, and links to other pages.

2. **`docs/wiki-source/Getting-Started.md`** — Remove maintainer setup instructions (just setup, just dev, etc.). Focus on: install → configure → run workflow for end users.

3. **`docs/wiki-source/Workspace-Structure.md`** — Remove `src/`, `tests/`, `dist/` directory references. Focus on user-facing directories: `commands/`, `agents/`, `skills/`, `.opencode/`.

4. **`docs/wiki-source/Configuration.md`** — Remove internal plugin references. Focus on `opencode.json` user-facing sections: `sddPipeline` config, agent settings, skill settings.

5. **`docs/wiki-source/Agents.md`** — Replace "edit `sdd-pipeline.ts`" with "create `agents/my-agent.md`". Document auto-discovery: adding an agent file is all that's needed.

6. **`docs/wiki-source/Commands.md`** — Replace "edit `sdd-pipeline.ts`" with "create `commands/my-command.md`". Document auto-discovery: adding a command file with frontmatter is all that's needed.

7. **`docs/wiki-source/Skills.md`** — Replace discovery tree maintenance with "create `skills/my-skill/SKILL.md`". Document that skills are auto-discovered from the filesystem.

8. **`docs/wiki-source/Customization-Guide.md`** — Ensure all recipes are user-facing. Remove any references to plugin internals. Focus on: adding agents, commands, skills, and MCP servers.

**Acceptance criteria:**
- [ ] All 8 Wiki pages rewritten for end users
- [ ] Zero references to "edit `sdd-pipeline.ts`" in any Wiki page
- [ ] Zero references to `src/`, `tests/`, `dist/` in user-facing pages
- [ ] All pages follow consistent structure: overview → how-to → reference
- [ ] Wiki synced to GitHub

**Verification:**
- [ ] `grep -r "sdd-pipeline" docs/wiki-source/` returns 0 results
- [ ] `grep -r "src/" docs/wiki-source/` returns 0 results (except in code examples showing user workspace)
- [ ] All 8 pages render correctly
- [ ] Wiki sync command runs successfully

**Dependencies:** Task 7.1 (ADR provides authoritative reference)

**Files likely touched:**
- `docs/wiki-source/Home.md` (~30 lines changed)
- `docs/wiki-source/Getting-Started.md` (~40 lines changed)
- `docs/wiki-source/Workspace-Structure.md` (~30 lines changed)
- `docs/wiki-source/Configuration.md` (~30 lines added)
- `docs/wiki-source/Agents.md` (~20 lines changed)
- `docs/wiki-source/Commands.md` (~20 lines changed)
- `docs/wiki-source/Skills.md` (~15 lines changed)
- `docs/wiki-source/Customization-Guide.md` (~20 lines changed)

**Estimated scope:** M (8 files, comprehensive rewrite)

---

#### Task 7.3: Update diagnosis with results
**Description:** Update `docs/diagnosis/fix06-v1.2-phase3-documentation.md` with the actual results from FEV-13 implementation. Replace the proposed plan with what was actually done.

**Acceptance criteria:**
- [ ] Diagnosis updated with real metrics
- [ ] Section "## Results" added
- [ ] Section "## Lessons Learned" added
- [ ] Cross-references to ADR-013, spec, and code

**Verification:**
- [ ] Diagnosis is consistent with the plan execution
- [ ] No speculative content remains

**Dependencies:** All implementation phases complete

**Files likely touched:**
- `docs/diagnosis/fix06-v1.2-phase3-documentation.md` (sections added)

**Estimated scope:** S (1 file, documentation update)

---

### Checkpoint: Documentation Complete
- [ ] ADR-013 created and cross-referenced
- [ ] Wiki pages updated for end users
- [ ] Diagnosis documents real results
- [ ] All docs consistent with implementation
- [ ] Review with human before proceeding to Phase 8

---

### Phase 8: Cleanup (Phase D from spec)

#### Task 8.1: Remove hardcoded maps from `sdd-pipeline.ts`
**Description:** Now that all 6 maps are in `defaults.ts` and auto-discovery + config loading work, the plugin can use only the imported versions. Delete any remaining inline definitions.

**Acceptance criteria:**
- [ ] No inline definitions of `COMMAND_AGENT_MAP`, `VALID_SUBAGENTS`, `INTENT_PATTERNS`, `COMMAND_PHASE_MAP`, `PHASE_SUGGESTIONS`, `AGENT_MENTION_PATTERNS` in `sdd-pipeline.ts`
- [ ] Plugin uses only imported defaults + auto-discovery + config
- [ ] All existing tests still pass

**Verification:**
- [ ] `grep -c "COMMAND_AGENT_MAP\|VALID_SUBAGENTS\|INTENT_PATTERNS" template/obligatorio/.opencode/plugins/sdd-pipeline.ts` shows 0 inline definitions (only imports)
- [ ] `bun test tests/` passes

**Dependencies:** All prior phases complete

**Files likely touched:**
- `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` (cleanup, -200 lines)

**Estimated scope:** S (cleanup)

---

#### Task 8.2: Verify plugin <400 lines
**Description:** Confirm SC-6: plugin file is reduced from 665 → <400 lines.

**Acceptance criteria:**
- [ ] `wc -l template/obligatorio/.opencode/plugins/sdd-pipeline.ts` shows <400 lines
- [ ] Document actual line count in results

**Verification:**
- [ ] `wc -l` confirms target

**Dependencies:** Task 8.1

**Files likely touched:** None (verification only)

**Estimated scope:** XS (verification)

---

#### Task 8.3: Full regression test
**Description:** Run all test suites to verify no regression after cleanup.

**Acceptance criteria:**
- [ ] `just check` exit 0
- [ ] `bun test tests/` passes (≥596 tests, 0 fail)
- [ ] `just test-plugin-unit` passes
- [ ] `just test-plugin-integration` passes
- [ ] `just test:e2e` passes (15/15 existing + 3/3 new = 18/18)

**Verification:**
- [ ] All gates green

**Dependencies:** Task 8.1, 8.2

**Files likely touched:** None (verification)

**Estimated scope:** XS (verification)

---

### Checkpoint: Cleanup Complete
- [ ] Plugin file <400 lines (SC-6)
- [ ] All 6 maps no longer hardcoded
- [ ] Full regression: all tests pass
- [ ] Review with human before proceeding to Phase 9

---

### Phase 9: Verification & Ship

#### Task 9.1: `just check` (all directories)
**Description:** Run Biome + tsc on entire project (now includes plugin dirs).

**Acceptance criteria:**
- [ ] `just check` exit code 0
- [ ] `biome ci` exit 0
- [ ] `tsc --noEmit` exit 0
- [ ] No new warnings

**Verification:**
- [ ] Output shows 0 errors, 0 warnings

**Dependencies:** All prior phases

**Files likely touched:** None

**Estimated scope:** XS (verification)

---

#### Task 9.2: `bun test` (full suite)
**Description:** Run full test suite including new plugin tests.

**Acceptance criteria:**
- [ ] `bun test tests/` exit 0
- [ ] ≥596 existing tests pass
- [ ] +15-20 new plugin tests pass
- [ ] No regression
- [ ] Coverage: plugin >80% (SC-5)

**Verification:**
- [ ] Test count increased
- [ ] Coverage report shows plugin >80%

**Dependencies:** Task 9.1

**Files likely touched:** None

**Estimated scope:** XS (verification)

---

#### Task 9.3: `just test:e2e` (18/18 scenarios)
**Description:** Run full E2E suite.

**Acceptance criteria:**
- [ ] `just test:e2e` exit 0
- [ ] 15 existing + 3 new = 18 scenarios pass
- [ ] No skipped tests

**Verification:**
- [ ] Output: 18/18 passing

**Dependencies:** Task 9.2

**Files likely touched:** None

**Estimated scope:** XS (verification)

---

#### Task 9.4: Coverage report
**Description:** Generate full coverage report. Verify SC-5: plugin >80%.

**Acceptance criteria:**
- [ ] `bun test --coverage` generates report
- [ ] Plugin (`sdd-pipeline.ts` + `defaults.ts` + `autoDiscovery.ts` + `configLoader.ts`): >80% lines, >80% funcs
- [ ] Overall: no regression vs baseline (96.98% lines)
- [ ] No files <80% (except test infrastructure)

**Verification:**
- [ ] Report reviewed
- [ ] Plugin coverage >80%

**Dependencies:** Task 9.2

**Files likely touched:** None

**Estimated scope:** XS (verification)

---

#### Task 9.5: Code Review 5-ejes by Tezcatlipoca
**Description:** Invoke Tezcatlipoca agent for code review. 5 axes: Correctness, Readability, Architecture, Security, Performance.

**Acceptance criteria:**
- [ ] Code review executed
- [ ] Report saved to `docs/diagnosis/fix06-code-review.md`
- [ ] ≥10 findings (indicator of deep review)
- [ ] Findings categorized: Critical, Important, Suggestions
- [ ] Critical findings (if any) must be resolved before ship

**Verification:**
- [ ] Report has expected structure
- [ ] 0 unresolved Critical findings

**Dependencies:** All implementation phases

**Files likely touched:**
- `docs/diagnosis/fix06-code-review.md` (new)

**Estimated scope:** M (review + report)

---

#### Task 9.6: Ship Review GO/NO-GO Decision
**Description:** Final decision based on all metrics and code review. GO = merge, NO-GO = rework.

**Acceptance criteria:**
- [ ] 0 Critical findings open
- [ ] 0 Important findings open
- [ ] All 8 Success Criteria satisfied (SC-1 through SC-8)
- [ ] All DoD items checked
- [ ] Decision documented: GO or NO-GO

**Verification:**
- [ ] If GO: PR created, CI green, squash merged to `develop`
- [ ] If NO-GO: rework list documented, loop back

**Dependencies:** Task 9.5

**Files likely touched:** None (decision + merge)

**Estimated scope:** S (decision + merge)

---

### Checkpoint: FEV-13 Complete ✅
- [ ] All 31 tasks completed
- [ ] All 8 Success Criteria satisfied
- [ ] Code review: 0 Critical, all Important resolved
- [ ] Ship Review: GO decision
- [ ] PR merged to `develop`
- [ ] FEV-13 closed; FEV-14 ready

---

## DoD (Definition of Done) — FEV-13

- [ ] All 6 hardcoded maps extracted to `defaults.ts` (Phase 1)
- [ ] `SddPipelineConfig` type defined (Phase 1)
- [ ] Auto-discovery for commands/agents implemented and tested (Phase 2)
- [ ] Config loading from `opencode.json` implemented and tested (Phase 3)
- [ ] `sddPipeline` section in `opencode.json` (Phase 3)
- [ ] `biome.json` includes plugin directories (Phase 4)
- [ ] Justfile has `check-plugin`, `test-plugin-*`, `check-all` targets (Phase 4)
- [ ] Unit tests for `normalizeBash` + `DESTRUCTIVE_PATTERNS` (Phase 4)
- [ ] Integration tests for 3 hooks (Phase 5)
- [ ] 3 new E2E scenarios (Phase 6)
- [ ] ADR-013 created (Phase 7)
- [ ] Wiki updated for end users (Phase 7)
- [ ] Diagnosis updated with results (Phase 7)
- [ ] Plugin file <400 lines (Phase 8, SC-6)
- [ ] Code review: 0 Critical (Phase 9)
- [ ] Ship Review: GO (Phase 9)
- [ ] `just check`: 0 errors
- [ ] `bun test`: ≥596 + 15-20 new = ~615 tests, 0 fail
- [ ] `just test:e2e`: 18/18 (15 existing + 3 new)
- [ ] Coverage: plugin >80% (SC-5)
- [ ] SC-1: adding a command detected without plugin edit
- [ ] SC-2: adding an agent accepted by `task()` validation
- [ ] SC-3: intent/phase/suggestions configurable
- [ ] SC-4: plugin passes Biome lint
- [ ] SC-5: plugin >80% coverage
- [ ] SC-6: plugin <400 lines
- [ ] SC-7: no regression
- [ ] SC-8: backward compatible

### Issue #51 — Documentation Reduction
- [ ] `docs/WORKFLOW.md` < 300 lines (Phase 0, Task 0.1)
- [ ] `CHANGELOG.md` < 350 lines (Phase 0, Task 0.2)
- [ ] `SPEC.md` < 400 lines (Phase 0, Task 0.3)
- [ ] All internal cross-references valid (Phase 0, Task 0.4)
- [ ] All 8 Wiki pages rewritten for end users (Phase 7, Task 7.2)
- [ ] Zero "edit sdd-pipeline.ts" references in Wiki
- [ ] Issue #51 closed

---

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Auto-discovery breaks existing tests (filesystem structure changes) | High | Medium | Phase 2 keeps DEFAULTS as fallback. Tests use real temp dirs. Manual verification before each task. |
| YAML frontmatter parsing is brittle (different parsers behave differently) | Medium | Medium | Use a well-tested library (gray-matter or js-yaml). Handle errors gracefully (skip file, log warning). |
| Plugin performance degrades with auto-discovery on every session | Low | Low | OQ-2 confirmed: <200 files, <5ms. Caching not needed. |
| `opencode.json` parse error crashes plugin | High | Low | Try-catch in configLoader, return defaults on error. Never throw from init. |
| Breaking change for users with custom commands (must migrate to new config) | Medium | Low | Default values match current hardcoded values. Behavior identical for unmodified workspaces. |
| Plugin file size doesn't reduce as expected (cleanup doesn't extract enough) | Low | Medium | Phase 8 has explicit verification task (8.2). If >400, identify additional extraction targets. |
| E2E tests for plugin are flaky (depend on OpenCode runtime) | Medium | Medium | E2E tests verify file existence and lint, not runtime behavior. Runtime behavior is covered by integration tests. |
| Code review finds Critical issues requiring rework | Medium | Medium | Phase 9.5 is a checkpoint. Rework happens before Phase 9.6 Ship Review. |
| `DESTRUCTIVE_PATTERNS` removal is requested despite OQ-4 | Low | Very Low | OQ-4 explicitly confirmed by user. Keep hardcoded. |
| Tests fail due to Bun-specific APIs in plugin | Low | Low | Plugin already uses Node `fs` (not Bun.file). Verified in code review. |

---

## Parallelization Opportunities

**Safe to parallelize:**
- **Phase 2 (autoDiscovery) + Phase 3 (configLoader):** Different files, no shared dependencies until Phase 3.4
- **Within Phase 4:** Tasks 4.1, 4.2, 4.3 are independent (different files)
- **Phase 5 integration tests:** All 3 files (chatMessage, toolExecuteBefore, systemTransform) are independent
- **Phase 6 E2E tests:** All 3 scripts are independent
- **Phase 7 docs:** ADR-013, Wiki updates, diagnosis updates are independent

**Must be sequential:**
- Phase 1 → Phase 2 (defaults must be extracted before wiring)
- Phase 2.1 → Phase 2.2 (function must exist before tests)
- Phase 3.1 → Phase 3.2 → Phase 3.3 → Phase 3.4 (loader before tests before config before wiring)
- All phases → Phase 8 (cleanup requires all implementation done)
- Phase 8 → Phase 9 (cleanup must complete before final verification)

**Needs coordination:**
- Phase 3.4 modifies plugin to use config: must not break Phase 2.3 (auto-discovery wiring)
  - Solution: Both write to plugin, but to different sections (auto-discovery → maps, config → behaviors)
- Phase 5 tests use plugin internals: plugin must be wired with both discovery + config
  - Solution: Phase 5 starts after Phase 2.3 and Phase 3.4 both complete

---

## Open Questions

**All 4 open questions resolved (2026-07-29):**

| # | Question | Resolution | Rationale |
|---|----------|------------|-----------|
| OQ-1 | `sddPipeline` config: Obligatorio or Estándar? | **Obligatorio** | Defaults deben estar en sync con updates del plugin. Customizaciones se preservan en Estándar behavior. |
| OQ-2 | Auto-discovery: cache or scan every session? | **Scan every session** | <200 archivos, <5ms overhead. Caching añade invalidación complexity sin ganancia. |
| OQ-3 | Warn when command has no `commandPhaseMap` entry? | **Yes, `console.debug`** | Solo visible en verbose mode. No rompe sesiones normales. |
| OQ-4 | `DESTRUCTIVE_PATTERNS` to config? | **No — keep hardcoded** | Safety boundary. Usuario ajusta `permission.bash` si necesita override. |

---

## Estimated Timeline

| Phase | Effort | Cumulative |
|-------|--------|------------|
| Phase 0: Documentation Reduction (Issue #51) | 2h | 2h |
| Phase 1: Foundation (extract defaults + types) | 1h | 3h |
| Phase 2: Auto-Discovery (Pillar 1) | 2h | 5h |
| Phase 3: Config-Driven (Pillar 2) | 2h | 7h |
| Phase 4: Quality Infrastructure (Pillar 3) | 2h | 9h |
| Phase 5: Hook Integration Tests | 2.5h | 11.5h |
| Phase 6: E2E Tests | 1.5h | 13h |
| Phase 7: Documentation (ADR + Wiki) | 2h | 15h |
| Phase 8: Cleanup (Phase D) | 1h | 16h |
| Phase 9: Verification & Ship | 3h | 19h |
| **Total** | **19h** | **19h** |
| **Buffer** | +2.5h | **21.5h** |

**Buffer allocation:** Code review findings rework (1h), YAML parser integration (0.5h), Wiki sync coordination (0.5h), documentation cross-reference verification (0.5h).

---

## Success Metrics — FEV-13

| Metric | Baseline (FEV-12) | Target (FEV-13) |
|--------|-------------------|------------------|
| Tests passing | 646 / 0 fail | ≥661 / 0 fail (+15-20 new plugin tests) |
| Coverage (funciones) | 98.89% | ≥98.89% (no regression) |
| Coverage (líneas) | 96.98% | ≥96.98% (no regression) |
| Plugin coverage | 0% (no tests) | >80% lines, >80% funcs |
| `just check` errors | 0 | 0 |
| E2E scenarios | 15/15 | 18/18 (15 + 3 new) |
| Plugin file size | 665 lines | <400 lines |
| Hardcoded maps in plugin | 6 | 0 (all in defaults.ts) |
| `sddPipeline` config in opencode.json | absent | 3 sections (commandPhaseMap, intentPatterns, phaseSuggestions) |
| WORKFLOW.md lines | 700+ | <300 |
| CHANGELOG.md lines | 383 | <350 |
| SPEC.md lines | 459 | <400 |
| Wiki pages rewritten | 0 | 8/8 end-user pages |
| Issues cerrados | — | #53, #51 |
| ADR nuevos | — | ADR-013 |
| Versión bumped | v1.2.0 | Sin bump (espera al release final) |

---

## Design Patterns Applied

| Pattern | Application | File |
|---------|-------------|------|
| **Strategy** | Auto-discovery vs defaults fallback | `autoDiscovery.ts` |
| **Adapter** | `opencode.json` JSON → `SddPipelineConfig` typed | `configLoader.ts` |
| **Facade** | `sdd-pipeline.ts` thin facade over discovery + config + hooks | `sdd-pipeline.ts` |
| **Null Object** | `DEFAULTS` always present, no null checks | `defaults.ts` |
| **Builder** | `SddPipelineConfig` merged from defaults + file + discovery | `configLoader.ts` |
| **Template Method** | Plugin hooks have common pattern (state, audit, return) | `sdd-pipeline.ts` |
| **Dependency Injection** | `projectDir` passed to discovery + config loaders | `autoDiscovery.ts`, `configLoader.ts` |

---

## References

- **Spec:** [specs/spec-sdd-plugin-decoupling.md](../specs/spec-sdd-plugin-decoupling.md)
- **Diagnosis:** [fix06-v1.2-phase3-documentation.md](../docs/diagnosis/fix06-v1.2-phase3-documentation.md)
- **Issue #53:** https://github.com/fisherk2/codice-opencode/issues/53
- **ADR-013 (to create):** `specs/adr/adr-013-plugin-auto-discovery.md`
- **Plugin source:** `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` (665 lines → <400)
- **Plugin test directory:** `tests/plugin/` (new)
- **OpenCode plugin docs:** https://opencode.ai/docs/plugins/
- **FEV-12 plan (template):** [plan.md](./plan.md) (previous FEV)

---

_Plan created by Moctezuma (Strategic Planner) — 2026-07-29_
_Ready for implementation via `/build` after final approval_
