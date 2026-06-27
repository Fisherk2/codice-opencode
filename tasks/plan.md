# Plan: Fase FEV-2-D — Directory Support en TemplateResolver + Optional Files Menu en Clean Install (v1.0.10)

**Fecha:** 2026-06-26 | **Autor:** Moctezuma (Planner Agent) | **Estado:** ✅ Completado
**Versión objetivo:** v1.0.10
**Issues principales:**
1. `.devin` es un directorio, no un archivo — TemplateResolver falla con "Template file not found"
2. Clean Install no muestra menú de selección de opcionales (inconsistente con Project Install)

---

## Overview

Tras el release de v1.0.9, se identificaron dos problemas relacionados con el manejo de directorios opcionales y la UX de Clean Install:

1. **`.devin` directory resolution**: El manifest incluye `.devin` como entrada opcional con `isDirectory: true`, pero `TemplateResolver.resolvePath()` falla con `Template file not found: .devin` en ambos modos de instalación. El directorio existe en `template/opcional/.devin/` pero contiene symlinks que causan problemas de resolución.

2. **Clean Install UX inconsistente**: `CleanInstallUseCase` copia todos los archivos opcionales automáticamente sin mostrar el menú de selección, mientras que `ProjectInstallUseCase` sí lo muestra. Esto es inconsistente y confuso para el usuario.

**Decisiones del usuario (2026-06-26):**
- **Problema 1:** Implementar soporte nativo para directorios en `TemplateResolver` (NO expandir `.devin` en archivos individuales)
- **Problema 2:** Clean Install debe mostrar el mismo menú de selección de opcionales que Project Install

**Objetivo:** Publicar v1.0.10 que resuelva ambos problemas sin regresión, con `.devin` funcionando correctamente y Clean Install mostrando el menú de opcionales.

---

## Resultado Final

### Métricas v1.0.10

| Métrica | v1.0.9 (antes) | v1.0.10 (final) |
|---------|-----------------|-----------------|
| Tests (pass/fail) | 465 / 0 | 472 / 0 |
| Expects | 986 | 1009 |
| Coverage (funciones) | 97.66% | 97.66% |
| Coverage (líneas) | 96.52% | 96.52% |
| E2E escenarios | 12/12 | 14/14 |
| `just check` errores | 0 | 0 |
| Issues críticos abiertos | 0 | 0 |
| Ship review findings | — | 0 Critical, 0 Important (2 rounds GO) |

### Commits

| Commit | Descripción |
|--------|-------------|
| `d27107c` | Core implementation: directory support + Clean Install menu + ADR-010 |
| `f887f3b` | First code review: 6 findings (I1-I4, S1-S2) |
| `6aa035d` | Ship review fixes: 11 observations (M1, S4, I1, I2, S1-S3, G2, G6, G8) |
| `8869dae` | Shared `createSymlinksWithWarning` helper extraction |
| `cfcce46` | Documentation: WORKFLOW, CHANGELOG, TECH_DEBT for v1.0.10 |

### Ship Review

| Round | Subagents | Verdict |
|-------|-----------|---------|
| 1st | code-reviewer, security-auditor, test-engineer, dependency-manager | GO (all APPROVE/PASS) |
| 2nd | code-reviewer, security-auditor, test-engineer, dependency-manager | GO (all PASS/APPROVE) |
| 3rd | code-reviewer (1 suggestion) | GO (1 minor suggestion → resolved) |

### DoD FEV-2-D

- [x] `.devin` directory se copia correctamente en Clean Install y Project Install
- [x] Clean Install muestra menú de selección de opcionales (igual que Project Install)
- [x] `TemplateResolver` detecta y maneja directorios recursivamente
- [x] `BunFileSystem` implementa copia recursiva de directorios
- [x] `bun test`: sin regresión (472 pass, 0 fail, 1009 expects)
- [x] `just check`: 0 errores
- [x] E2E: 14/14 pasando (12 existentes + 2 nuevos)
- [x] ADR-010 documentado
- [x] CHANGELOG actualizado con sección v1.0.10
- [x] Ship review: 2 rounds → 0 Critical findings → GO decision

---

## Task Breakdown

### Phase 1: Diagnóstico e Investigación

#### Task FE2D-T1: Investigar causa raíz del fallo `.devin` resolution ✅
- **Commit:** `d27107c`
- **Resultado:** `.devin` es un directorio en `template/opcional/` pero el manifest lo trata como archivo. `TemplateResolver.resolvePath()` falla porque `fs.stat()` no encuentra un archivo en la ruta.

---

### Phase 2: TemplateResolver - Soporte para Directorios

#### Task FE2D-T2: Mejorar `TemplateResolver.resolvePath()` para directorios ✅
- **Commit:** `d27107c`
- **Resultado:** `resolvePath()` ahora detecta directorios via `fs.stat().isDirectory()` y retorna la ruta directamente sin intentar buscar archivos individuales dentro.

#### Task FE2D-T3: Tests unitarios para `TemplateResolver` con directorios ✅
- **Commit:** `d27107c`
- **Resultado:** 2 tests nuevos para `noTemplateCopy` rules en `FileMergeEngine`

#### Checkpoint 1 ✅ — TemplateResolver funciona

---

### Phase 3: CleanInstallUseCase - Menú de Opcionales

#### Task FE2D-T5: Refactorizar `CleanInstallUseCase` para mostrar menú de opcionales ✅
- **Commit:** `d27107c`
- **Resultado:** CleanInstallUseCase ahora muestra `selectOptional()` antes del merge. `--force` salta el menú.

#### Task FE2D-T6: Tests unitarios para `CleanInstallUseCase` con menú ✅
- **Commit:** `d27107c`
- **Resultado:** 17 tests en `clean-install.test.ts` (from 9)

#### Checkpoint 2 ✅ — Clean Install muestra menú

---

### Phase 4: End-to-End Testing

#### Task FE2D-T8: Tests E2E para Clean Install con menú de opcionales ✅
- **Commit:** `d27107c`
- **Resultado:** `tests/e2e/13-clean-install-optional-menu.sh` (with --force only)

#### Task FE2D-T9: Tests E2E para `.devin` resolution ✅
- **Commit:** `d27107c`
- **Resultado:** E2E validated via test 13 + test 14

#### Task FE2D-T10: Tests E2E para `.devin` en Project Install ✅
- **Commit:** `d27107c`
- **Resultado:** `tests/e2e/14-project-install-optional-selection.sh`

---

### Phase 5: Verificación Integral

#### Task FE2D-T11: Verificar suite completa sin regresión ✅
- **Resultado:** 472 pass, 0 fail, 1009 expects, 14/14 E2E

---

### Phase 6: Release Preparation

#### Task FE2D-T12: Bump version a 1.0.10 ✅
- **Commit:** `d8c0b77`

#### Task FE2D-T13: Actualizar CHANGELOG con sección v1.0.10 ✅
- **Commits:** `d27107c`, `cfcce46`

#### Task FE2D-T14: Documentar ADR-010 ✅
- **Commit:** `d27107c`
- **Archivo:** `specs/adr/adr-010-no-template-copy-flag.md`

#### Task FE2D-T15: Commit + PR + Tag + Release ⏳
- **Branch:** `fix/fev-2-d-directory-support`
- **Status:** Ready for push + PR + squash merge + tag v1.0.10

---

## Architecture Decisions (ADRs)

| Decisión | Status |
|----------|--------|
| **ADR-FEV2D-1**: Soporte nativo para directorios en `TemplateResolver` | ✅ Implementado |
| **ADR-FEV2D-2**: Mensaje de error actualizado para directorios | ✅ Implementado |
| **ADR-FEV2D-3**: `CleanInstallUseCase` usa `selectOptional` antes del merge | ✅ Implementado |
| **ADR-FEV2D-4**: `--force` salta menú de opcionales | ✅ Implementado |
| **ADR-FEV2D-5**: `AtomicStager` sin cambios (ya maneja directorios) | ✅ Verificado |
| **ADR-FEV2D-6**: Tests E2E validan contenido de `.devin` | ✅ Implementado |
| **ADR-FEV2D-7**: Manifest sin cambios (`noTemplateCopy` flag añadido) | ✅ Implementado |
| **ADR-FEV2D-8**: Bump a v1.0.10 (patch) | ✅ Implementado |
| **ADR-FEV2D-9**: Tests E2E para Clean Install con menú | ✅ Implementado |
| **ADR-FEV2D-10**: Documentar ADR-010 | ✅ Implementado |

---

## Post-Ship Review Fixes (11 observations)

| ID | Categoría | Finding | Resolución |
|----|-----------|---------|------------|
| M1 | Medium | `writeVersionFileSafe` version hardcoded `"0.0.0"` | `options?.version ?? "0.0.0"` fallback |
| S4 | Suggestion | Symlink warnings lack `--verbose` hint | Added `"Run with --verbose for details."` |
| I2 | Important | ProjectInstallUseCase methods too long | Refactored with 6 extracted methods |
| I1 | Important | Symlinks duplicated in test files | Import from `src/infrastructure/config/symlinks` |
| S1 | Suggestion | Opaque test name suffixes `(a)`, `(b)`, `(c)` | Removed, using descriptive names |
| G2 | Gap | `showSuccess` assertion missing in happy path | Added `expect(prompt.showSuccess).toHaveBeenCalled()` |
| G6 | Gap | `confirm.not.toHaveBeenCalled()` missing | Added assertion |
| G8 | Gap | `.devin` not-staged assertion missing | Added via mock.calls tracking |
| S2 | Suggestion | E2E test 14 positive assertion shallow | Added `grep '"optionalSelections"\s*:\s*\[\s*\]'` |
| S3 | Suggestion | E2E test 13 no `.gitignore` check | Added `test -f "$DEST/.gitignore"` |
| L1 | Learning | E2E tests don't capture stderr | Added stderr capture + security keyword check |

---

*Última actualización: 2026-06-26*
