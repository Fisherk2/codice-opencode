# TODO: Fase FEV-2-D — Directory Support + Clean Install UX (v1.0.10)

**Estado:** ✅ Completado — 13/15 tareas ejecutadas (T15 pendiente: push + PR + merge)
**Fecha:** 2026-06-26
**Dependencias:** F0-F6 ✅ → FEV-1 ✅ → FEV-2 ✅ → FEV-2-B ✅ → FEV-2-C ✅ → **FEV-2-D ✅ Completado**
**Branch:** `fix/fev-2-d-directory-support`
**Issues principales:**
- `.devin` es un directorio, no un archivo — TemplateResolver falla
- Clean Install no muestra menú de opcionales (inconsistente con Project Install)

---

## Contexto Rápido

**Bug 1:** `bunx @fisherk2-dev/codice@latest` falla con `Template file not found: .devin` en Clean Install y Project Install. El directorio existe en `template/opcional/.devin/` pero contiene symlinks que causan problemas de resolución.

**Bug 2:** Clean Install copia todos los archivos opcionales automáticamente sin mostrar el menú de selección. Project Install sí muestra el menú. Esto es inconsistente.

**Solución:**
1. **Bug 1:** Implementar soporte nativo para directorios en `TemplateResolver` (no expandir `.devin` en archivos individuales)
2. **Bug 2:** `CleanInstallUseCase` debe mostrar el mismo menú de opcionales que `ProjectInstallUseCase`

**Versión:** v1.0.10 (patch sobre v1.0.9)

---

## Tareas

### ✅ FE2D-T1: Investigar causa raíz del fallo `.devin` resolution
- **Commit:** `d27107c`
- **Resultado:** `.devin` es un directorio, manifest lo trata como archivo

### ✅ FE2D-T2: Mejorar `TemplateResolver.resolvePath()` para directorios
- **Commit:** `d27107c`
- **Resultado:** Detección de directorios via `fs.stat().isDirectory()`

### ✅ FE2D-T3: Tests unitarios para `TemplateResolver` con directorios
- **Commit:** `d27107c`
- **Resultado:** 2 tests nuevos en `FileMergeEngine`

### ✅ Checkpoint 1: TemplateResolver funciona

### ✅ FE2D-T5: Refactorizar `CleanInstallUseCase` para mostrar menú de opcionales
- **Commit:** `d27107c`
- **Resultado:** `selectOptional()` antes del merge, `--force` skip

### ✅ FE2D-T6: Tests unitarios para `CleanInstallUseCase` con menú
- **Commit:** `d27107c`
- **Resultado:** 17 tests (from 9)

### ✅ Checkpoint 2: Clean Install muestra menú

### ✅ FE2D-T8: Tests E2E para Clean Install con menú
- **Commit:** `d27107c`
- **Resultado:** `tests/e2e/13-clean-install-optional-menu.sh`

### ✅ FE2D-T9: Tests E2E para `.devin` resolution
- **Commit:** `d27107c`
- **Resultado:** Validated via tests 13 + 14

### ✅ FE2D-T10: Tests E2E para `.devin` en Project Install
- **Commit:** `d27107c`
- **Resultado:** `tests/e2e/14-project-install-optional-selection.sh`

### ✅ FE2D-T11: Verificar suite completa sin regresión
- **Resultado:** 472 pass, 0 fail, 1009 expects, 14/14 E2E

### ✅ FE2D-T12: Bump version a 1.0.10
- **Commit:** `d8c0b77`

### ✅ FE2D-T13: Actualizar CHANGELOG con v1.0.10
- **Commits:** `d27107c`, `cfcce46`

### ✅ FE2D-T14: Documentar ADR-010
- **Commit:** `d27107c`
- **Archivo:** `specs/adr/adr-010-no-template-copy-flag.md`

### ⏳ FE2D-T15: Commit + PR + Tag + Release
- **Branch:** `fix/fev-2-d-directory-support`
- **Status:** Ready for push + PR + squash merge + tag v1.0.10

---

## Checkpoints

### Checkpoint 1 ✅ — TemplateResolver funciona
- [x] `TemplateResolver.resolvePath()` maneja directorios correctamente
- [x] Tests unitarios pasan
- [x] `just check` — 0 errores
- [x] **Quality Gate:** Usuario confirma `.devin` funciona

### Checkpoint 2 ✅ — Clean Install muestra menú
- [x] `CleanInstallUseCase` muestra menú de opcionales
- [x] Tests unitarios pasan (17 total)
- [x] `just check` — 0 errores
- [x] **Quality Gate:** Usuario confirma flujo de Clean Install

### Checkpoint 3 ✅ — Verificación integral
- [x] `bun test`: 472 pass, 0 fail
- [x] Coverage sin pérdida (97.66% funcs / 96.52% lines)
- [x] E2E: 14/14 pasando

### Gate FEV-2-D ⏳ — Release pending
- [x] CHANGELOG actualizado
- [x] ADR-010 documentado
- [ ] Push + PR + squash merge + tag v1.0.10
- [ ] npm `latest` → 1.0.10
- [ ] GitHub Release con 4 assets

---

## Métricas Finales

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

---

*Última actualización: 2026-06-26*
