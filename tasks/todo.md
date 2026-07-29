# FEV-13 Todo List — SDD Plugin Decoupling & Quality Infrastructure

**Phase:** FEV-13 (v1.2 Phase 3)
**Issues:** [#53](https://github.com/fisherk2/codice-opencode/issues/53), [#51](https://github.com/fisherk2/codice-opencode/issues/51) (Documentation Reduction)
**Spec:** [specs/spec-sdd-plugin-decoupling.md](../specs/spec-sdd-plugin-decoupling.md)
**Date:** 2026-07-29
**Full plan:** [plan.md](./plan.md)
**Status:** ✅ Completo — 761 tests, 0 fail, `just check` 0 errores

---

## Phase 0: Documentation Reduction (Issue #51)

- [x] **Task 0.1:** Audit WORKFLOW.md — remove completed phases (FEV-1 through FEV-10), keep current state. Target: <300 lines → `docs/WORKFLOW.md`
- [x] **Task 0.2:** Audit CHANGELOG.md — consolidate pre-v1.0 entries into "Early Development" section. Target: <350 lines → `CHANGELOG.md`
- [x] **Task 0.3:** Audit SPEC.md — remove resolved decisions (move to ADRs), keep only active spec. Target: <400 lines → `SPEC.md`
- [x] **Task 0.4:** Verify cross-references — ensure no broken internal links after reductions

**Checkpoint:** ✅ All 3 docs under target line counts, zero broken links

---

## Phase 1: Foundation — Extract DEFAULTS & Types

- [x] **Task 1.1:** Extract DEFAULTS to `src/defaults.ts` (6 hardcoded maps + DESTRUCTIVE_PATTERNS separated)
- [x] **Task 1.2:** Add `SddPipelineConfig` type definition → `src/types.ts`

**Checkpoint:** ✅ Plugin behavior identical, all existing tests pass

---

## Phase 2: Auto-Discovery Implementation (Pillar 1)

- [x] **Task 2.1:** Create `src/autoDiscovery.ts` (discoverCommandAgentMap, discoverValidSubagents, discoverAgentMentionPatterns)
- [x] **Task 2.2:** Unit tests for autoDiscovery → `tests/plugin/unit/autoDiscovery.test.ts` (10 scenarios, >90% coverage)
- [x] **Task 2.3:** Wire auto-discovery into plugin (with fallback to DEFAULTS)

**Checkpoint:** ✅ Adding a new command in `commands/` detected without plugin edit (SC-1)

---

## Phase 3: Configuration-Driven Behavior (Pillar 2)

- [x] **Task 3.1:** Create `src/configLoader.ts` (loadSddConfig with validation)
- [x] **Task 3.2:** Unit tests for configLoader → `tests/plugin/unit/configLoader.test.ts` (10 scenarios, >90% coverage)
- [x] **Task 3.3:** Add `sddPipeline` section to `opencode.json` (default values for all 3 fields)
- [x] **Task 3.4:** Wire config into plugin (merge with defaults, OQ-3 debug warning)

**Checkpoint:** ✅ Intent/phase/suggestions configurable via opencode.json (SC-3, SC-8)

---

## Phase 4: Quality Infrastructure (Pillar 3)

- [x] **Task 4.1:** Update `biome.json` to include plugin directories (remove blanket template exclusion)
- [x] **Task 4.2:** Add Justfile targets: `check-plugin`, `test-plugin-unit`, `test-plugin-integration`, `test-plugin-e2e`
- [x] **Task 4.3:** First batch unit tests → `tests/plugin/unit/normalizeBash.test.ts` + `destructivePatterns.test.ts` (>90% coverage)
- [x] **Task 4.4:** Update `just check` to include plugin directories

**Checkpoint:** ✅ Plugin passes Biome lint with zero errors (SC-4)

---

## Phase 5: Plugin Hook Integration Tests

- [x] **Task 5.1:** Integration tests for `chat.message` hook → `tests/plugin/integration/chatMessage.test.ts` (6 scenarios, >80% coverage)
- [x] **Task 5.2:** Integration tests for `tool.execute.before` hook → `tests/plugin/integration/toolExecuteBefore.test.ts` (7 scenarios, >80% coverage)
- [x] **Task 5.3:** Integration tests for `system.transform` hook → `tests/plugin/integration/systemTransform.test.ts` (5 scenarios, >70% coverage)

**Checkpoint:** ✅ All hooks tested, >70% coverage (SC-5 partial)

---

## Phase 6: E2E Tests for Plugin

- [x] **Task 6.1:** E2E: plugin file exists after clean install → `tests/plugin/e2e/16-plugin-installation.sh`
- [x] **Task 6.2:** E2E: plugin passes Biome lint in installed workspace → `tests/plugin/e2e/17-plugin-lint.sh`
- [x] **Task 6.3:** E2E: audit log created on first session → `tests/plugin/e2e/18-audit-log.sh`

**Checkpoint:** ✅ 18/18 E2E scenarios passing (15 existing + 3 new)

---

## Phase 7: Documentation

- [x] **Task 7.1:** Create ADR-013 → `specs/adr/adr-013-plugin-auto-discovery.md` + update `docs/ARCHITECTURE.md`
- [x] **Task 7.2:** Update Wiki — all 8 end-user pages:
  - [x] `Home.md` — remove src/, tests/, template/ references
  - [x] `Getting-Started.md` — remove maintainer setup, focus on install → configure → run
  - [x] `Workspace-Structure.md` — remove src/, tests/, dist/, focus on user-facing dirs
  - [x] `Configuration.md` — remove internal refs, focus on opencode.json user sections
  - [x] `Agents.md` — replace "edit sdd-pipeline.ts" with "create agents/my-agent.md"
  - [x] `Commands.md` — replace "edit sdd-pipeline.ts" with "create commands/my-command.md"
  - [x] `Skills.md` — replace discovery tree maintenance with "create skills/my-skill/SKILL.md"
  - [x] `Customization-Guide.md` — ensure all recipes are user-facing
- [x] **Task 7.3:** Update diagnosis `fix06-v1.2-phase3-documentation.md` with actual results

**Checkpoint:** ✅ All docs consistent, end-user friendly, cross-references valid, zero "edit sdd-pipeline.ts" in Wiki

---

## Phase 8: Cleanup (Phase D from spec)

- [x] **Task 8.1:** Remove hardcoded maps from `sdd-pipeline.ts` (use only imported defaults)
- [x] **Task 8.2:** Verify plugin <400 lines (SC-6)
- [x] **Task 8.3:** Full regression: `just check`, `bun test`, `just test:e2e`

**Checkpoint:** ✅ Plugin file <400 lines, all tests pass

---

## Phase 9: Verification & Ship

- [x] **Task 9.1:** `just check` (all directories including plugin) → 0 errors
- [x] **Task 9.2:** `bun test` (full suite) → ≥661 tests, 0 fail
- [x] **Task 9.3:** `just test:e2e` (18/18 scenarios)
- [x] **Task 9.4:** Coverage report → plugin >80% (SC-5)
- [x] **Task 9.5:** Code Review 5-ejes by Tezcatlipoca → 0 Critical, all Important resolved
- [x] **Task 9.6:** Ship Review GO/NO-GO Decision → GO ✅, PR merged

**Checkpoint:** ✅ All DoD items satisfied, FEV-13 closed, FEV-14 ready

---

## DoD Checklist — FEV-13

### Functional
- [x] SC-1: Adding a command in `commands/` detected by plugin without editing `sdd-pipeline.ts`
- [x] SC-2: Adding an agent in `agents/` accepted by `task()` validation without editing plugin
- [x] SC-3: `INTENT_PATTERNS`, `COMMAND_PHASE_MAP`, `PHASE_SUGGESTIONS` configurable via `opencode.json`
- [x] SC-4: Plugin passes `bunx @biomejs/biome check` with zero errors
- [x] SC-5: Plugin has >80% test coverage across unit + integration suites
- [x] SC-6: Plugin file size reduced from 665 lines to <400 lines after Phase D
- [x] SC-7: All existing functionality preserved — no regression
- [x] SC-8: Backward compatible — works without `sddPipeline` config

### Quality
- [x] `just check`: 0 errors
- [x] `bun test`: 761 tests, 0 fail
- [x] `just test:e2e`: 18/18 (15 existing + 3 new)
- [x] Coverage: plugin >80% lines/funcs; overall no regression
- [x] Code review: 0 Critical, 0 Important open

### Documentation
- [x] ADR-013 created and cross-referenced in ARCHITECTURE.md
- [x] Wiki pages updated for end users (no maintainer references)
- [x] Diagnosis documents real results
- [x] Issue #53 closed
- [x] `docs/WORKFLOW.md` < 300 lines
- [x] `CHANGELOG.md` < 350 lines
- [x] `SPEC.md` < 400 lines
- [x] All 8 Wiki pages rewritten for end users
- [x] Issue #51 closed

### Process
- [x] Branch `feat/ux-docs-wiki` from `develop`
- [x] Atomic commits with Co-Authored-By trailer
- [x] PR to `develop` with CI green
- [x] Code review executed
- [x] Ship Review: GO decision documented
- [x] No version bump (v1.2.0 se lanza al cierre de FEV-12 ✅ + 13 + 14 + 15)

---

## Decision Log (2026-07-29)

| # | Pregunta | Decisión |
|---|----------|----------|
| 1 | OQ-1: ¿`sddPipeline` config: Obligatorio o Estándar? | **Obligatorio** — defaults sincronizan con updates |
| 2 | OQ-2: ¿Auto-discovery: cache o scan? | **Scan every session** — <5ms overhead, sin invalidación complexity |
| 3 | OQ-3: ¿Warn para command sin `commandPhaseMap`? | **Yes, `console.debug`** — visible solo en verbose |
| 4 | OQ-4: ¿`DESTRUCTIVE_PATTERNS` a config? | **No** — safety boundary, hardcoded siempre |
| 5 | ¿Estructura del plugin? | 3 archivos nuevos: `defaults.ts`, `autoDiscovery.ts`, `configLoader.ts` |
| 6 | ¿Test location? | `tests/plugin/{unit,integration,e2e}/` (separado de `src/` tests) |
| 7 | ¿Biome scope? | Plugin dirs incluidos; skills dirs siguen excluidos (deps externas) |
| 8 | Issue #51: merge into FEV-13? | **Yes — Phase 0 added** | Docs reduction es independiente del plugin code; 2h adicional, no bloquea otras fases |

---

**Estimated effort:** 19h + 2.5h buffer = 21.5h total
**Dependencies:** Phase 0 ∥ Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8 → Phase 9
**Parallelization:** Phases 2, 3, 4 modules can be developed in parallel; Phases 5, 6, 7 docs/tests parallel with implementation

---

## 📋 Próximo: FEV-14 — UX Enhancements

FEV-14 (Issues #47, #56) está pendiente: progress bar + comando `/help`.
Ver [docs/WORKFLOW.md](../docs/WORKFLOW.md) sección FEV-14.
