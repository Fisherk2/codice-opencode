# TODO: Fase FEV-2-D — Directory Support + Clean Install UX (v1.0.10)

**Estado:** 🟡 Pendiente — 0/15 tareas ejecutadas
**Fecha:** 2026-06-26
**Dependencias:** F0-F6 ✅ → FEV-1 ✅ → FEV-2 ✅ → FEV-2-B ✅ → FEV-2-C ✅ → **FEV-2-D 🟡 En curso**
**Branch:** `fix/fev-2-d-directory-support` (a crear desde develop)
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

## Tareas Pendientes

### ⏳ FE2D-T1: Investigar causa raíz del fallo `.devin` resolution
**Descripción:** Investigar por qué `TemplateResolver.resolvePath(".devin")` falla cuando el directorio existe en `template/opcional/.devin/`.

**Criterios de Aceptación:**
- [ ] Reproducir el error con `bunx @fisherk2-dev/codice@latest`
- [ ] Verificar que `template/opcional/.devin/` existe localmente
- [ ] Identificar la causa raíz (symlinks, path resolution, permisos)
- [ ] Documentar la causa raíz

**Verificación:**
- [ ] Error reproducido y documentado

**Dependencias:** Ninguna.
**Archivos:**
- Investigación (no requiere cambios de código aún)

**Scope:** S (30min).

---

### ⏳ FE2D-T2: Mejorar `TemplateResolver.resolvePath()` para directorios
**Descripción:** Modificar `TemplateResolver.resolvePath()` para manejar correctamente directorios. Actualizar mensaje de error.

**Criterios de Aceptación:**
- [ ] `resolvePath()` retorna correctamente cuando el path es un directorio
- [ ] Mensaje de error: "Template file or directory not found"
- [ ] Validación de path containment funciona para archivos y directorios
- [ ] Cache funciona para archivos y directorios
- [ ] JSDoc actualizado

**Verificación:**
- [ ] `bun test tests/integration/TemplateResolver.test.ts` — todos pasan
- [ ] `just check` — 0 errores

**Dependencias:** FE2D-T1.
**Archivos:**
- `src/infrastructure/adapters/TemplateResolver.ts` (modificado)

**Scope:** S (45min).

---

### ⏳ FE2D-T3: Tests unitarios para `TemplateResolver` con directorios
**Descripción:** Crear tests que cubran la resolución de directorios en `TemplateResolver`.

**Criterios de Aceptación:**
- [ ] Test: `resolvePath(".devin")` retorna path correcto cuando es directorio
- [ ] Test: `resolvePath("directorio/inexistente")` lanza error con mensaje actualizado
- [ ] Test: Cache funciona para directorios
- [ ] Test: Path containment funciona para directorios
- [ ] Test: Directorio con symlinks internos se resuelve correctamente
- [ ] 5+ tests nuevos

**Verificación:**
- [ ] `bun test tests/integration/TemplateResolver.test.ts` — todos pasan
- [ ] Coverage ≥ 90%

**Dependencias:** FE2D-T2.
**Archivos:**
- `tests/integration/TemplateResolver.test.ts` (5+ tests nuevos)

**Scope:** S (1h).

---

### ✅ Checkpoint 1: After FE2D-T3 (TemplateResolver funciona)
- [ ] `TemplateResolver.resolvePath()` maneja directorios correctamente
- [ ] Tests unitarios pasan
- [ ] `just check` — 0 errores
- [ ] **Quality Gate:** Usuario confirma que `.devin` funciona

---

### ⏳ FE2D-T5: Refactorizar `CleanInstallUseCase` para mostrar menú de opcionales
**Descripción:** Modificar `CleanInstallUseCase` para que muestre el menú de selección de opcionales antes del merge.

**Criterios de Aceptación:**
- [ ] `CleanInstallUseCase` llama a `userPrompt.selectOptional()` antes del merge
- [ ] Con `force=true`, salta el menú
- [ ] Solo se copian los opcionales seleccionados
- [ ] Obligatorio y Estándar se copian siempre
- [ ] Orden: file merge → gitignore → symlinks (sin cambios)
- [ ] Si no se selecciona nada, solo obligatorio + estándar

**Verificación:**
- [ ] `bun test tests/unit/clean-install.test.ts` — todos pasan
- [ ] Test manual confirma flujo

**Dependencias:** FE2D-T3.
**Archivos:**
- `src/application/use-cases/CleanInstallUseCase.ts` (modificado)

**Scope:** M (1h).

---

### ⏳ FE2D-T6: Tests unitarios para `CleanInstallUseCase` con menú
**Descripción:** Crear tests que cubran el nuevo flujo con menú de opcionales.

**Criterios de Aceptación:**
- [ ] Test: Clean Install muestra menú (verificar llamada a `selectOptional`)
- [ ] Test: Con `force=true`, NO se muestra menú
- [ ] Test: Solo se copian los opcionales seleccionados
- [ ] Test: Si no se selecciona nada, solo obligatorio + estándar
- [ ] 4+ tests nuevos/actualizados

**Verificación:**
- [ ] `bun test tests/unit/clean-install.test.ts` — todos pasan
- [ ] Coverage ≥ 90%

**Dependencias:** FE2D-T5.
**Archivos:**
- `tests/unit/clean-install.test.ts` (4+ tests nuevos/actualizados)

**Scope:** S (1h).

---

### ✅ Checkpoint 2: After FE2D-T6 (Clean Install muestra menú)
- [ ] `CleanInstallUseCase` muestra menú de opcionales
- [ ] Tests unitarios pasan
- [ ] `just check` — 0 errores
- [ ] **Quality Gate:** Usuario confirma flujo de Clean Install

---

### ⏳ FE2D-T8: Tests E2E para Clean Install con menú
**Descripción:** Crear script E2E que verifique Clean Install con menú de opcionales.

**Criterios de Aceptación:**
- [ ] Script `tests/e2e/13-clean-install-optional-menu.sh`:
  1. Crea directorio temporal vacío
  2. Ejecuta binario en modo Clean Install
  3. Simula selección de `.devin`
  4. Verifica que `.devin/rules/` se copió
- [ ] Script integrado en `just test-e2e`
- [ ] Total E2E: 14/14

**Verificación:**
- [ ] `just test-e2e` — 14/14

**Dependencias:** FE2D-T6.
**Archivos:**
- `tests/e2e/13-clean-install-optional-menu.sh` (nuevo)
- `Justfile` (actualizado)

**Scope:** M (1h 15min).

---

### ⏳ FE2D-T9: Tests E2E para `.devin` resolution
**Descripción:** Crear script E2E que verifique que `.devin` se copia correctamente en Project Install.

**Criterios de Aceptación:**
- [ ] Script `tests/e2e/14-devin-directory-copy.sh`:
  1. Crea directorio temporal vacío
  2. Ejecuta binario en modo Project Install
  3. Simula selección de `.devin`
  4. Verifica que `.devin/rules/*.md` se copiaron
- [ ] Total E2E: 14/14

**Verificación:**
- [ ] `just test-e2e` — 14/14
- [ ] Contenido de `.devin/rules/` verificado

**Dependencias:** FE2D-T3.
**Archivos:**
- `tests/e2e/14-devin-directory-copy.sh` (nuevo)

**Scope:** M (1h).

---

### ⏳ FE2D-T10: Tests E2E para `.devin` en Project Install
**Descripción:** Verificar que Project Install copia `.devin` cuando se selecciona y NO lo copia cuando no.

**Criterios de Aceptación:**
- [ ] Test E2E: Project Install + `.devin` seleccionado → `.devin/` se copia
- [ ] Test E2E: Project Install + `.devin` NO seleccionado → `.devin/` NO se copia

**Verificación:**
- [ ] `just test-e2e` — 14/14

**Dependencias:** FE2D-T9.
**Archivos:**
- Actualización de `tests/e2e/`

**Scope:** S (45min).

---

### ⏳ FE2D-T11: Verificar suite completa sin regresión
**Descripción:** Ejecutar toda la suite para asegurar que no hay regresión.

**Criterios de Aceptación:**
- [ ] `bun test` — ≥465 pass, 0 fail (+9 tests nuevos)
- [ ] `just check` — 0 errores
- [ ] E2E: 14/14 pasando
- [ ] Coverage: ≥97.66% funciones
- [ ] Domain coverage: 100%

**Verificación:**
- [ ] `bun test --coverage` — sin pérdida
- [ ] `just check` — clean
- [ ] `just test-e2e` — 14/14

**Dependencias:** FE2D-T8, FE2D-T9, FE2D-T10.
**Archivos:** (ninguno).

**Scope:** XS (10min).

---

### ⏳ FE2D-T12: Bump version a 1.0.10
**Descripción:** `package.json` → `1.0.10`.

**Criterios de Aceptación:**
- [ ] `"version": "1.0.10"`
- [ ] Commit: `chore: bump version to 1.0.10`

**Verificación:**
- [ ] `git diff package.json` muestra solo el bump

**Dependencias:** FE2D-T11.
**Archivos:**
- `package.json`

**Scope:** XS (5min).

---

### ⏳ FE2D-T13: Actualizar CHANGELOG con v1.0.10
**Descripción:** Crear entrada `[1.0.10] — 2026-06-26`.

**Criterios de Aceptación:**
- [ ] Header `[1.0.10] — 2026-06-26`
- [ ] Entry `Fixed`: "`.devin` directory resolution"
- [ ] Entry `Changed`: "Clean Install muestra menú de opcionales"
- [ ] Entry `Deprecated`: "v1.0.9 — usar v1.0.10"

**Verificación:**
- [ ] `git diff CHANGELOG.md` muestra la nueva sección

**Dependencias:** FE2D-T12.
**Archivos:**
- `CHANGELOG.md`

**Scope:** XS (5min).

---

### ⏳ FE2D-T14: Documentar ADR-010
**Descripción:** Crear `specs/adr/adr-010-directory-support.md`.

**Criterios de Aceptación:**
- [ ] Archivo `specs/adr/adr-010-directory-support.md` creado
- [ ] Secciones: Contexto, Decisión, Consecuencias, Alternativas
- [ ] Referencia a FEV-2-D
- [ ] `docs/ARCHITECTURE.md` actualizado con referencia a ADR-010

**Verificación:**
- [ ] Archivo existe con contenido
- [ ] `docs/ARCHITECTURE.md` referencia ADR-010

**Dependencias:** FE2D-T11.
**Archivos:**
- `specs/adr/adr-010-directory-support.md` (nuevo)
- `docs/ARCHITECTURE.md` (modificado)

**Scope:** S (30min).

---

### ⏳ FE2D-T15: Commit + PR + Tag + Release
**Descripción:** Commit, push, PR, merge, tag, release pipeline.

**Criterios de Aceptación:**
- [ ] Commit: `fix(template): support directories in TemplateResolver + Clean Install optional menu`
- [ ] Branch: `fix/fev-2-d-directory-support`
- [ ] `git push origin fix/fev-2-d-directory-support`
- [ ] PR contra `develop`
- [ ] CI pasa (3 platforms)
- [ ] Squash merge
- [ ] Tag `v1.0.10` creado y pusheado
- [ ] `npm view @fisherk2-dev/codice version` → `1.0.10`
- [ ] GitHub Release con 4 assets
- [ ] Branch local eliminado
- [ ] `develop` sincronizado

**Verificación:**
- [ ] GitHub Release publicado
- [ ] npm `latest` → 1.0.10

**Dependencias:** FE2D-T14.
**Archivos:** (git only).

**Scope:** S (15min).

---

## Checkpoints

### Checkpoint 1: After FE2D-T3 (TemplateResolver funciona)
- [ ] `TemplateResolver.resolvePath()` maneja directorios correctamente
- [ ] Tests unitarios pasan (5+ nuevos)
- [ ] `just check` — 0 errores
- [ ] **Quality Gate:** Usuario confirma `.devin` funciona

### Checkpoint 2: After FE2D-T6 (Clean Install muestra menú)
- [ ] `CleanInstallUseCase` muestra menú de opcionales
- [ ] Tests unitarios pasan (4+ nuevos/actualizados)
- [ ] `just check` — 0 errores
- [ ] **Quality Gate:** Usuario confirma flujo de Clean Install

### Checkpoint 3: After FE2D-T11 (Verificación integral)
- [ ] `bun test`: ≥465 pass, 0 fail
- [ ] Coverage sin pérdida
- [ ] E2E: 14/14 pasando

### Gate FEV-2-D: After FE2D-T15 (Release publicado)
- [ ] `npm view` → `1.0.10`
- [ ] GitHub Release con 4 assets
- [ ] CHANGELOG actualizado
- [ ] ADR-010 documentado

---

## Resumen Rápido

| Tarea | Scope | Esfuerzo |
|-------|-------|----------|
| FE2D-T1: Investigar causa raíz | S | 30min |
| FE2D-T2: Mejorar TemplateResolver | S | 45min |
| FE2D-T3: Tests unitarios TemplateResolver | S | 1h |
| FE2D-T5: Refactorizar CleanInstallUseCase | M | 1h |
| FE2D-T6: Tests unitarios CleanInstall | S | 1h |
| FE2D-T8: Tests E2E Clean Install menú | M | 1h 15min |
| FE2D-T9: Tests E2E .devin resolution | M | 1h |
| FE2D-T10: Tests E2E Project Install .devin | S | 45min |
| FE2D-T11: Verificar suite completa | XS | 10min |
| FE2D-T12: Bump version 1.0.10 | XS | 5min |
| FE2D-T13: Actualizar CHANGELOG | XS | 5min |
| FE2D-T14: Documentar ADR-010 | S | 30min |
| FE2D-T15: Commit + PR + Tag + Release | S | 15min |
| **Total** | | **~8h 20min** |

---

*Última actualización: 2026-06-26*
