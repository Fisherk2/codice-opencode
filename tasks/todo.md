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

### ⏳ FEV3-T1: Corregir `BunFileSystem.destinationExists()` para soportar directorios
**Descripción:** Cambiar `Bun.file().exists()` por `fs.access()` en `src/infrastructure/adapters/BunFileSystem.ts:56-67`.

**Causa raíz:** `Bun.file()` solo funciona con archivos, no directorios. Para standard directories (docs/, specs/, tasks/), retorna `false` aunque el directorio exista, causando que `FileMergeEngine.shouldStage()` los stage y sobrescriba su contenido.

**Criterios de Aceptación:**
- [ ] `destinationExists()` retorna `true` para directorios existentes
- [ ] `destinationExists()` retorna `false` para directorios inexistentes
- [ ] No se introducen cambios en la API del port

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

**Dependencias:** Ninguna.
**Archivos:**
- `src/infrastructure/adapters/BunFileSystem.ts:56-67`

**Scope:** XS (15min).

---

### ⏳ FEV3-T2: Corregir `GITHUB_REPO` en `constants.ts:5`
**Descripción:** Cambiar `GITHUB_REPO` de `"11-codice-opencode"` a `"codice-opencode"`.

**Causa raíz:** El repo real es `fisherk2/codice-opencode` (verificado con curl: 200), no `fisherk2/11-codice-opencode` (404).

**Criterios de Aceptación:**
- [ ] `GITHUB_REPO = "codice-opencode"` en `constants.ts`
- [ ] `getGitHubApiUrl()` retorna URL correcta
- [ ] GitHub version check funciona

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

**Dependencias:** Ninguna.
**Archivos:**
- `src/infrastructure/config/constants.ts:5`

**Scope:** XS (5min).

---

### ⏳ FEV3-T3: Tests unitarios: `destinationExists()` retorna `true` para directorios
**Descripción:** Crear tests que verifiquen que `BunFileSystem.destinationExists()` funciona con directorios.

**Criterios de Aceptación:**
- [ ] Test: `destinationExists("docs")` retorna `true` cuando `docs/` existe
- [ ] Test: `destinationExists("docs")` retorna `false` cuando `docs/` no existe
- [ ] Test: `destinationExists("README.md")` retorna `true` cuando existe
- [ ] Test: `destinationExists("README.md")` retorna `false` cuando no existe

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] Coverage ≥ 90%

**Dependencias:** FEV3-T1.
**Archivos:**
- `tests/integration/adapters/bun-file-system.test.ts`

**Scope:** S (30min).

---

### ⏳ FEV3-T4: Tests unitarios: UpdateWorkspaceUseCase no sobrescribe standard
**Descripción:** Tests de regresión para FEV-1 Issue #2. Verificar que Update Workspace preserva archivos/directorios standard existentes.

**Criterios de Aceptación:**
- [ ] Test: Update no sobrescribe `README.md` existente
- [ ] Test: Update no sobrescribe `AGENTS.md` existente
- [ ] Test: Update no sobrescribe directorio `docs/` existente
- [ ] Test: Update no sobrescribe directorio `specs/` existente
- [ ] Test: Update SÍ sobrescribe archivos mandatory
- [ ] Test: Update copia archivos standard que NO existen

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] Coverage ≥ 90%

**Dependencias:** FEV3-T1.
**Archivos:**
- `tests/integration/use-cases/update-workspace.test.ts`

**Scope:** M (1h).

---

### ⏳ FEV3-T5: Tests unitarios: GitHub API retorna tag correcto con repo fix
**Descripción:** Crear tests que verifiquen que el GitHub version check funciona con el repo name corregido.

**Criterios de Aceptación:**
- [ ] Test: `getLatestReleaseTag()` retorna `v1.0.10` contra mock 200
- [ ] Test: `getLatestReleaseTag()` retorna `null` contra mock 404
- [ ] Test: `getLatestReleaseTag()` retorna `null` contra mock con tag inválido
- [ ] Test: `getLatestReleaseTag()` retorna `null` en timeout

**Verificación:**
- [ ] `bun test` — todos pasan

**Dependencias:** FEV3-T2.
**Archivos:**
- `tests/integration/adapters/github-rest-client.test.ts`

**Scope:** S (30min).

---

### ⏳ FEV3-T6: Test E2E: Update Workspace en proyecto existente
**Descripción:** Script E2E que verifique que Update Workspace preserva archivos standard existentes en un proyecto real. Este test debe fallar antes del fix y pasar después.

**Criterios de Aceptación:**
- [ ] Script `tests/e2e/15-update-workspace-existing-project.sh`:
  1. Crea directorio temporal con archivos standard pre-existentes
  2. Ejecuta binario compilado en modo Update Workspace con `--force`
  3. Verifica que archivos standard NO fueron sobrescritos
  4. Verifica que archivos mandatory SÍ fueron sobrescritos
- [ ] Script integrado en `just test-e2e`
- [ ] Total E2E: 15/15 pasando

**Verificación:**
- [ ] `just test-e2e` — 15/15 escenarios

**Dependencias:** FEV3-T1, FEV3-T2, FEV3-T3, FEV3-T4, FEV3-T5.
**Archivos:**
- `tests/e2e/15-update-workspace-existing-project.sh` (nuevo)

**Scope:** M (1h).

---

### ⏳ FEV3-T7: Verificar suite completa sin regresión
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

**Dependencias:** FEV3-T6.
**Archivos:** (ninguno).

**Scope:** XS (10min).

---

### ⏳ FEV3-T8: Bump version a 1.0.11 y release
**Descripción:** Bump version, CHANGELOG, commit, PR, merge, tag, release pipeline.

**Criterios de Aceptación:**
- [ ] `package.json` → `"version": "1.0.11"`
- [ ] CHANGELOG.md sección `[1.0.11]`:
  - `Fixed`: "Update Workspace no sobrescribe archivos Estándar (regresión de FEV-1 #2)"
  - `Fixed`: "GitHub version check funciona correctamente (repo name fix)"
- [ ] Branch: `fix/fev-3-update-overwrite`
- [ ] PR contra develop → CI pasa → squash merge
- [ ] PR develop → main → CI pasa → squash merge
- [ ] Tag `v1.0.11` creado y pusheado
- [ ] `npm view @fisherk2-dev/codice version` → `1.0.11`
- [ ] GitHub Release con 4 assets
- [ ] Branch local eliminado
- [ ] `develop` sincronizado con `main`

**Verificación:**
- [ ] GitHub Release publicado
- [ ] npm `latest` → 1.0.11

**Dependencias:** FEV3-T7.
**Archivos:**
- `package.json`
- `CHANGELOG.md`

**Scope:** S (15min).

---

## Checkpoints

### Checkpoint 1: After FEV3-T1 + FEV3-T2 (Bugs corregidos)
- [ ] `BunFileSystem.destinationExists()` corregido para directorios
- [ ] `GITHUB_REPO` corregido en `constants.ts`
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores
- [ ] **Quality Gate:** Usuario confirma fixes

### Checkpoint 2: After FEV3-T3 + FEV3-T4 + FEV3-T5 (Tests añadidos)
- [ ] Tests de regresión para directorios pasan
- [ ] Tests de regresión para Update Workspace pasan
- [ ] Tests de regresión para GitHub API pasan
- [ ] Coverage sin pérdida

### Checkpoint 3: After FEV3-T7 (Verificación integral)
- [ ] `bun test`: ≥472 pass, 0 fail
- [ ] Coverage sin pérdida
- [ ] E2E: 15/15 pasando

### Gate FEV-3: After FEV3-T8 (Release publicado)
- [ ] `npm view` → `1.0.11`
- [ ] GitHub Release con 4 assets
- [ ] CHANGELOG actualizado
- [ ] `main` y `develop` sincronizados

---

## Resumen Rápido

| Tarea | Scope | Esfuerzo |
|-------|-------|----------|
| FEV3-T1: Corregir `destinationExists()` para directorios | XS | 15min |
| FEV3-T2: Corregir `GITHUB_REPO` en `constants.ts:5` | XS | 5min |
| FEV3-T3: Tests unitarios `destinationExists()` | S | 30min |
| FEV3-T4: Tests unitarios UpdateWorkspaceUseCase (regresión) | M | 1h |
| FEV3-T5: Tests unitarios GitHub API | S | 30min |
| FEV3-T6: Test E2E Update en proyecto existente | M | 1h |
| FEV3-T7: Verificar suite completa | XS | 10min |
| FEV3-T8: Bump version + CHANGELOG + release | S | 15min |
| **Total** | | **~3h 45min** |

---

*Última actualización: 2026-06-26*
