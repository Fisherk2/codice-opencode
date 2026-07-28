# FEV-12 Todo List — References Restructuring (v1.2.0)

**Phase:** FEV-12 (v1.2 Phase 2)
**Issues:** [#54](https://github.com/fisherk2/codice-opencode/issues/54), [#52](https://github.com/fisherk2/codice-opencode/issues/52)
**Date:** 2026-07-28
**Full plan:** [plan.md](./plan.md)
**Status:** ✅ COMPLETADO (2026-07-28)

---

## Phase 1: Discovery & Mapping

- [ ] **Task 1.1:** Script de análisis automático (3 niveles de detección) → `scripts/analyze-references.ts`
- [ ] **Task 1.2:** Análisis de cross-references entre archivos de references → `docs/diagnosis/fix05-cross-references.md`
- [ ] **Task 1.3:** Generar tabla de mapping final y revisar con usuario → `docs/diagnosis/fix05-mapping-table.md`

**Checkpoint:** Mapping table aprobada por el usuario, 59 archivos → 59 asignaciones (0 huérfanos puros)

---

## Phase 2: Template Restructuring (Issue #54)

- [ ] **Task 2.1:** Crear subdirectorios `references/` en skills destino (batch con script)
- [ ] **Task 2.2:** Mover 59 archivos con `git mv` (preservar historial)
- [ ] **Task 2.3:** Eliminar directorio `template/obligatorio/references/`

**Checkpoint:** 59 archivos reubicados, directorio raíz eliminado, `git log --follow` funcional

---

## Phase 3: Source Code Updates

- [ ] **Task 3.1:** Eliminar entry `references` de `FileRuleManifestData.ts` (6 líneas)
- [ ] **Task 3.2:** Actualizar tests unitarios (FileRuleManifest, FileMergeEngine, TemplateResolver)
- [ ] **Task 3.3:** Actualizar tests E2E (01-clean-install.sh y posiblemente otros)
- [ ] **Task 3.4:** Verificar `directoryWalker.ts` (sin cambios esperados)

**Checkpoint:** `bun test` 0 fail, `tsc --noEmit` 0 errors, `git ls-files` actualizado

---

## Phase 4: Configuration Enhancement (Issue #52)

- [ ] **Task 4.1:** Diseñar estructura `reference` section (lista de skills con `references/`)
- [ ] **Task 4.2:** Añadir `reference` section a `opencode.json` (después de `instructions`)
- [ ] **Task 4.3:** Validar JSON schema y formato OpenCode

**Checkpoint:** Sección `reference` válida, OpenCode-compliant, paths verificables

---

## Phase 5: Documentation Updates (paralelo con Phase 3+4)

- [ ] **Task 5.1:** Actualizar `docs/wiki-source/Workspace-Structure.md` (eliminar `references/` raíz, documentar co-localización)
- [ ] **Task 5.2:** Actualizar `docs/wiki-source/Skills.md` (estructura de skill con `references/`)
- [ ] **Task 5.3:** Actualizar `docs/wiki-source/Configuration.md` (documentar sección `reference`)
- [ ] **Task 5.4:** Actualizar `CONTRIBUTING.md` (eliminar paso de extracción)
- [ ] **Task 5.5:** Actualizar `README.md` (workspace structure tree)
- [ ] **Task 5.6:** Actualizar `docs/diagnosis/fix05-v1.2-phase2-references.md` con resultados
- [ ] **Task 5.7:** Crear `ADR-012` (References Co-location) → `specs/adr/adr-012-references-co-location.md` + actualizar `docs/ARCHITECTURE.md`

**Checkpoint:** Wiki + docs + diagnosis + ADR-012 coherentes con nueva estructura

---

## Phase 6: Verification & Code Review

- [ ] **Task 6.1:** `just check` (lint + format + tsc) → 0 errors, 0 warnings
- [ ] **Task 6.2:** `just test` (unit + integration) → ≥593 pass, 0 fail
- [ ] **Task 6.3:** `just test:e2e` (15/15 scenarios) → 15/15 passing
- [ ] **Task 6.4:** Coverage report → ≥97% funciones, ≥96% líneas
- [ ] **Task 6.5:** `just dev --dest tests/fixtures/workspace/` → instalación correcta, references co-localizadas
- [ ] **Task 6.6:** Branch `feat/fev-12-references` + PR a `develop` con CI green
- [ ] **Task 6.7:** Code Review 5-ejes por Tezcatlipoca → `docs/diagnosis/fix05-code-review.md`
- [ ] **Task 6.8:** Ship Review + GO/NO-GO Decision → merge si GO

**Checkpoint:** Todos los DoD items completados ✅, listo para FEV-13

---

## DoD Checklist

- [ ] Los 59 archivos de references reubicados en `skills/<name>/references/` con `git mv`
- [ ] `template/obligatorio/references/` eliminado completamente
- [ ] `FileRuleManifestData.ts` sin entry `references` (40 entries restantes)
- [ ] Tests unitarios actualizados y pasando (≥593 pass, 0 fail)
- [ ] Tests E2E actualizados y pasando (15/15)
- [ ] Sección `reference` añadida a `opencode.json` con ≥20 entries
- [ ] Formato `reference` cumple con schema OpenCode oficial
- [ ] Wiki actualizado: Workspace-Structure, Skills, Configuration
- [ ] CONTRIBUTING.md actualizado (paso de extracción eliminado)
- [ ] README.md actualizado (workspace structure)
- [ ] Diagnosis documentado con resultados reales
- [ ] ADR-012 (References Co-location) creado
- [ ] `bun test`: 0 fail, sin regresión
- [ ] `just check`: 0 errors
- [ ] `just dev --dest tests/fixtures/workspace/`: instalación correcta
- [ ] Sin versión bump (esperar al release final v1.2.0)
- [ ] Branch `feat/fev-12-references` + PR a `develop` con CI green
- [ ] Code Review 5-ejes con 0 Critical findings
- [ ] Ship Review GO decision y PR mergeado

---

## Decision Log (2026-07-28)

| # | Pregunta | Decisión |
|---|----------|----------|
| 1 | Conflicto #54 vs #52: ¿`./references` apunta a dónde? | Cada skill con `references/` se expone en `opencode.json` `reference` section |
| 2 | Manejo de huérfanos: ¿eliminar archivos? | NO eliminar. Primero verificar cross-references entre archivos de references. Si huérfano puro, asignar a skill más coherente |
| 3 | Versionado: ¿bump a v1.2.1 o v1.3.0? | Sin bump. v1.2.0 se lanza cuando todas las FEVs (12, 13, 14, 15) estén completas |
| 4 | ¿Crear ADR-012? | Sí. Documentar decisión arquitectónica de co-localización |
| 5 | ¿Code review explícito? | Sí. Tasks 6.7 (Code Review 5-ejes) + 6.8 (Ship Review GO/NO-GO) |

---

**Estimated effort:** 12h + 2h buffer = 14h total
**Dependencies:** Phase 1 → Phase 2 → Phases 3+4+5 (paralelo) → Phase 6 (incluye Code Review)

---

## 📋 PENDIENTE

Esperando aprobación del plan por el usuario antes de iniciar Phase 1.
