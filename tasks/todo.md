# TODO: Fase FEV-3 — Update Workspace overwrite fix + GitHub API fix (v1.0.11)

**Estado:** 🟡 Pendiente — 0/11 tareas ejecutadas
**Fecha:** 2026-06-26
**Dependencias:** F0-F6 ✅ → FEV-1 ✅ → FEV-2 ✅ → FEV-2-B ✅ → FEV-2-C ✅ → FEV-2-D ✅ → **FEV-3 🟡 En curso**
**Branch:** `fix/fev-3-update-overwrite` (a crear desde develop)
**Issues principales:**
- Update Workspace sobrescribe archivos Estándar (README.md, AGENTS.md, docs/, specs/, tasks/)
- GitHub version check retorna 404 — no detecta versión disponible

---

## Contexto Rápido

**Bug 1:** Al ejecutar `bunx @fisherk2-dev/codice` → Update Workspace en un proyecto existente, archivos clasificados como `standard` están siendo sobrescritos cuando NO deberían serlo. Solo los archivos `mandatory` (obligatorio) deben sobrescribirse.

**Bug 2:** El check de versión contra la API de GitHub retorna 404, mostrando el mensaje "Could not check for updates via GitHub. Falling back to the bundled template version."

**Solución:**
1. **Bug 1:** Investigar causa raíz en `FileMergeEngine.shouldStage()` o `BunFileSystem.destinationExists()` para directorios
2. **Bug 2:** Verificar nombre del repositorio en `constants.ts` y/o lógica de version check

**Versión:** v1.0.11 (patch sobre v1.0.10)

---

## Tareas Pendientes

### ⏳ FEV3-T1: Investigar causa raíz del overwrite en Update Workspace
**Descripción:** Investigar por qué Update Workspace sobrescribe archivos standard cuando la lógica en `FileMergeEngine.shouldStage()` parece correcta.

**Criterios de Aceptación:**
- [ ] Identificar la causa raíz exacta del overwrite
- [ ] Documentar el bug con evidencia
- [ ] Proponer solución

**Verificación:**
- [ ] Causa raíz identificada y documentada

**Dependencias:** Ninguna.
**Archivos:**
- `src/infrastructure/adapters/BunFileSystem.ts`
- `src/infrastructure/adapters/AtomicStager.ts`
- `src/domain/services/FileMergeEngine.ts`

**Scope:** M (2h).

---

### ⏳ FEV3-T5: Investigar GitHub API 404
**Descripción:** Investigar por qué la API de GitHub retorna 404 para el endpoint de latest release.

**Criterios de Aceptación:**
- [ ] Verificar el nombre correcto del repositorio en GitHub
- [ ] Verificar si existen releases publicados
- [ ] Si no hay releases, el warning es correcto
- [ ] Si el nombre es incorrecto, proponer corrección

**Verificación:**
- [ ] Causa raíz identificada y documentada

**Dependencias:** Ninguna.
**Archivos:**
- `src/infrastructure/config/constants.ts`

**Scope:** S (30min).

---

### ⏳ FEV3-T2: Corregir lógica de Update Workspace
**Descripción:** Corregir la lógica de Update Workspace para preservar archivos standard existentes.

**Criterios de Aceptación:**
- [ ] Update Workspace NO sobrescribe archivos standard existentes
- [ ] Update Workspace SÍ sobrescribe archivos mandatory
- [ ] Update Workspace copia archivos standard que NO existen en el destino

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

**Dependencias:** FEV3-T1.
**Archivos:**
- `src/application/use-cases/UpdateWorkspaceUseCase.ts`

**Scope:** M (2h).

---

### ⏳ FEV3-T3: Tests unitarios: Update Workspace no sobrescribe archivos standard
**Descripción:** Crear tests que verifiquen que Update Workspace preserva archivos standard existentes.

**Criterios de Aceptación:**
- [ ] Test: Update Workspace no sobrescribe README.md existente
- [ ] Test: Update Workspace no sobrescribe AGENTS.md existente
- [ ] Test: Update Workspace no sobrescribe directorio docs/ existente
- [ ] Test: Update Workspace SÍ sobrescribe archivos mandatory
- [ ] Test: Update Workspace copia archivos standard que NO existen

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] Coverage ≥ 90%

**Dependencias:** FEV3-T2.
**Archivos:**
- `tests/integration/use-cases/update-workspace.test.ts`

**Scope:** M (1h).

---

### ⏳ FEV3-T6: Corregir GitHub API URL o lógica de version check
**Descripción:** Corregir el GitHub API URL o la lógica de version check para que funcione correctamente.

**Criterios de Aceptación:**
- [ ] GitHub version check funciona correctamente
- [ ] Si no hay releases, muestra mensaje claro
- [ ] Si el nombre del repo es incorrecto, se corrige

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

**Dependencias:** FEV3-T5.
**Archivos:**
- `src/infrastructure/config/constants.ts`

**Scope:** S (1h).

---

### ⏳ FEV3-T7: Tests unitarios: GitHub version check
**Descripción:** Crear tests que verifiquen que el GitHub version check funciona correctamente.

**Criterios de Aceptación:**
- [ ] Test: GitHub version check retorna tag correcto
- [ ] Test: GitHub version check maneja 404 correctamente
- [ ] Test: GitHub version check maneja timeout correctamente

**Verificación:**
- [ ] `bun test` — todos pasan

**Dependencias:** FEV3-T6.
**Archivos:**
- `tests/integration/adapters/github-rest-client.test.ts`

**Scope:** S (1h).

---

### ⏳ FEV3-T4: Tests E2E: Update Workspace en proyecto existente
**Descripción:** Crear script E2E que verifique que Update Workspace preserva archivos standard existentes en un proyecto real.

**Criterios de Aceptación:**
- [ ] Script `tests/e2e/15-update-workspace-existing-project.sh`
- [ ] Script integrado en `just test-e2e`
- [ ] Total E2E: 15/15 pasando

**Verificación:**
- [ ] `just test-e2e` — 15/15 escenarios

**Dependencias:** FEV3-T3, FEV3-T7.
**Archivos:**
- `tests/e2e/15-update-workspace-existing-project.sh` (nuevo)

**Scope:** M (1h 15min).

---

### ⏳ FEV3-T8: Verificar suite completa sin regresión
**Descripción:** Ejecutar toda la suite de tests para asegurar que no hay regresión.

**Criterios de Aceptación:**
- [ ] `bun test` — ≥472 pass, 0 fail
- [ ] `just check` — 0 errores
- [ ] E2E: 15/15 pasando
- [ ] Coverage: ≥97.66% funciones / ≥96.52% líneas

**Verificación:**
- [ ] `bun test --coverage` — sin pérdida
- [ ] `just check` — clean
- [ ] `just test-e2e` — 15/15

**Dependencias:** FEV3-T4.
**Archivos:** (ninguno).

**Scope:** XS (10min).

---

### ⏳ FEV3-T9: Bump version a 1.0.11
**Descripción:** `package.json` → `1.0.11`.

**Criterios de Aceptación:**
- [ ] `"version": "1.0.11"`
- [ ] Commit: `chore: bump version to 1.0.11`

**Verificación:**
- [ ] `git diff package.json` muestra solo el bump

**Dependencias:** FEV3-T8.
**Archivos:**
- `package.json`

**Scope:** XS (5min).

---

### ⏳ FEV3-T10: Actualizar CHANGELOG con v1.0.11
**Descripción:** Crear entrada `[1.0.11] — 2026-06-26`.

**Criterios de Aceptación:**
- [ ] Header `[1.0.11] — 2026-06-26`
- [ ] Entry `Fixed`: "Update Workspace no sobrescribe archivos Estándar"
- [ ] Entry `Fixed`: "GitHub version check funciona correctamente"

**Verificación:**
- [ ] `git diff CHANGELOG.md` muestra la nueva sección

**Dependencias:** FEV3-T9.
**Archivos:**
- `CHANGELOG.md`

**Scope:** XS (5min).

---

### ⏳ FEV3-T11: Commit + PR + Tag + Release
**Descripción:** Commit, push, PR, merge, tag, release pipeline.

**Criterios de Aceptación:**
- [ ] Branch: `fix/fev-3-update-overwrite`
- [ ] PR contra `develop`
- [ ] CI pasa (3 platforms)
- [ ] Squash merge a develop
- [ ] PR develop → main
- [ ] Squash merge a main
- [ ] Tag `v1.0.11` creado y pusheado
- [ ] `npm view @fisherk2-dev/codice version` → `1.0.11`
- [ ] GitHub Release con 4 assets
- [ ] Branch local eliminado
- [ ] `develop` sincronizado con `main`

**Verificación:**
- [ ] GitHub Release publicado
- [ ] npm `latest` → 1.0.11

**Dependencias:** FEV3-T10.
**Archivos:** (git only).

**Scope:** S (15min).

---

## Checkpoints

### Checkpoint 1: After FEV3-T1 (Causa raíz identificada)
- [ ] Causa raíz del overwrite identificada
- [ ] Documentación del bug completa
- [ ] **Quality Gate:** Usuario confirma diagnóstico

### Checkpoint 2: After FEV3-T3 (Update Workspace corregido)
- [ ] Update Workspace no sobrescribe archivos standard
- [ ] Tests unitarios pasan
- [ ] `just check` — 0 errores
- [ ] **Quality Gate:** Usuario confirma corrección

### Checkpoint 3: After FEV3-T8 (Verificación integral)
- [ ] `bun test`: ≥472 pass, 0 fail
- [ ] Coverage sin pérdida
- [ ] E2E: 15/15 pasando

### Gate FEV-3: After FEV3-T11 (Release publicado)
- [ ] `npm view` → `1.0.11`
- [ ] GitHub Release con 4 assets
- [ ] CHANGELOG actualizado
- [ ] `main` y `develop` sincronizados

---

## Resumen Rápido

| Tarea | Scope | Esfuerzo |
|-------|-------|----------|
| FEV3-T1: Investigar causa raíz overwrite | M | 2h |
| FEV3-T5: Investigar GitHub API 404 | S | 30min |
| FEV3-T2: Corregir lógica Update Workspace | M | 2h |
| FEV3-T3: Tests unitarios Update Workspace | M | 1h |
| FEV3-T6: Corregir GitHub API URL | S | 1h |
| FEV3-T7: Tests unitarios GitHub version check | S | 1h |
| FEV3-T4: Tests E2E Update en proyecto existente | M | 1h 15min |
| FEV3-T8: Verificar suite completa | XS | 10min |
| FEV3-T9: Bump version 1.0.11 | XS | 5min |
| FEV3-T10: Actualizar CHANGELOG | XS | 5min |
| FEV3-T11: Commit + PR + Tag + Release | S | 15min |
| **Total** | | **~10h** |

---

*Última actualización: 2026-06-26*
