# TODO: Fase FEV-2-B — Symlinks Rotos + Generación Post-Install (v1.0.7)

**Estado:** 🟡 Pendiente — 0/14 tareas ejecutadas
**Fecha:** 2026-06-26
**Dependencias:** F0-F6 ✅ → FEV-1 ✅ → FEV-2 ✅ → **FEV-2-B 🟡 En curso**
**Branch:** `fix/symlinks-template-paths` (limpio, base = main@6ba9ee6)

---

## Contexto Rápido

**Bug residual post-v1.0.6:** npm resuelve symlinks al empaquetar. Los 3 symlinks `.opencode/{agents,commands,skills}` en el template local no existen en el tarball publicado. El manifiesto los referencia → `resolvePath()` falla → error en los 3 modos.

**Solución dual:**
1. **Eliminar las 3 entradas** del manifiesto (fix mínimo del bug)
2. **Generar symlinks post-instalación** (recrear la estructura del dev en el destino del usuario con `fs.symlink()`)

**Versión:** v1.0.7 (npm no permite republicar 1.0.6).

---

## Tareas Pendientes

### ⏳ FEV2B-T0: Test RED con estructura del paquete npm
**Descripción:** Test que simula la estructura del paquete npm (sin symlinks) y verifica que `resolvePath(".opencode/agents")` falla con el manifiesto actual.

**Criterios de Aceptación:**
- [ ] Test crea directorio temporal con estructura sin symlinks (solo `.opencode/plugins/`).
- [ ] Test invoca `TemplateResolver.resolvePath(".opencode/agents")` y espera throw.
- [ ] Test es RED con código actual.

**Verificación:**
- [ ] `bun test tests/integration/TemplateResolver.test.ts` — el test falla.

**Dependencias:** Ninguna.
**Archivos:**
- `tests/integration/TemplateResolver.test.ts` (nuevo test).

**Scope:** S (30min).

---

### ⏳ FEV2B-T1: Eliminar 3 entradas del manifiesto + renombrar `.devin/rules` → `.devin`
**Descripción:** Remover de `FileRuleManifestData.ts` las entradas para `.opencode/agents`, `.opencode/commands`, `.opencode/skills`. Cambiar `.devin/rules` a `.devin` (per ADR-FEV2B-11).

**Criterios de Aceptación:**
- [ ] 3 entradas eliminadas de sección OBLIGATORIO.
- [ ] Entrada `.devin/rules` renombrada a `.devin` con descripción actualizada.
- [ ] Total mandatory: 11 → 8.
- [ ] Comentario explicativo con ADR-009.
- [ ] Test FEV2B-T0 ahora pasa (GREEN).

**Verificación:**
- [ ] `bun test tests/integration/TemplateResolver.test.ts` — todos pasan.
- [ ] `just check` — 0 errores.

**Dependencias:** FEV2B-T0.
**Archivos:**
- `src/domain/entities/FileRuleManifestData.ts`.

**Scope:** XS (15min).

---

### ⏳ FEV2B-T2: Actualizar test de completitud
**Descripción:** El test `file-rule-manifest.test.ts` cuenta archivos en `template/<categoría>/`. Debe filtrar symlinks al contar.

**Criterios de Aceptación:**
- [ ] Test filtra symlinks al contar archivos en `obligatorio/`.
- [ ] Conteo esperado: 8 mandatory, 11 standard, 13 optional.
- [ ] Test verifica que entradas eliminadas NO existen en el manifiesto.
- [ ] Test sigue detectando archivos añadidos sin manifest (guard funciona).

**Verificación:**
- [ ] `bun test tests/unit/file-rule-manifest.test.ts` — todos pasan.

**Dependencias:** FEV2B-T1.
**Archivos:**
- `tests/unit/file-rule-manifest.test.ts`.

**Scope:** S (30min).

---

### ⏳ FEV2B-T3: Crear puerto `ISymlinkCreator`
**Descripción:** Definir interfaz `ISymlinkCreator` en `src/application/ports/` siguiendo Clean Architecture.

**Criterios de Aceptación:**
- [ ] Nuevo archivo `src/application/ports/ISymlinkCreator.ts`.
- [ ] Interface exporta: `createSymlink(target: string, linkPath: string): Promise<Result<void, SymlinkError>>`.
- [ ] JSDoc con propósito, parámetros, errores.
- [ ] Tipo `SymlinkError` definido en `src/domain/types/SymlinkError.ts`.

**Verificación:**
- [ ] `just check` — 0 errores.
- [ ] `tsc --noEmit` — 0 errores.

**Dependencias:** FEV2B-T2.
**Archivos:**
- `src/application/ports/ISymlinkCreator.ts` (nuevo).
- `src/domain/types/SymlinkError.ts` (nuevo).

**Scope:** XS (20min).

---

### ⏳ FEV2B-T4: Test RED para `BunSymlinkCreator` (TDD)
**Descripción:** Crear tests cubriendo: crear symlink nuevo, idempotencia, skip directorio real, paths relativos, error handling, target existence check.

**Criterios de Aceptación:**
- [ ] Archivo `tests/unit/adapters/bun-symlink-creator.test.ts`.
- [ ] 6+ tests cubriendo los 6 casos.
- [ ] Tests son RED con código actual (la clase no existe).

**Verificación:**
- [ ] `bun test tests/unit/adapters/bun-symlink-creator.test.ts` — todos fallan.

**Dependencias:** FEV2B-T3.
**Archivos:**
- `tests/unit/adapters/bun-symlink-creator.test.ts` (nuevo).

**Scope:** S (45min).

---

### ⏳ FEV2B-T5: Implementar `BunSymlinkCreator` adapter (TDD GREEN)
**Descripción:** Crear clase `BunSymlinkCreator` en `src/infrastructure/adapters/` que implementa `ISymlinkCreator` usando `fs.symlinkSync` de Bun/Node.

**Criterios de Aceptación:**
- [ ] Archivo `src/infrastructure/adapters/BunSymlinkCreator.ts`.
- [ ] Implementa `ISymlinkCreator` con `fs.symlinkSync(target, linkPath)`.
- [ ] Verifica existencia del target antes de crear.
- [ ] Verifica si el link ya existe (idempotencia).
- [ ] Verifica si el link es un directorio real (skip con warning).
- [ ] Usa paths relativos para portabilidad.
- [ ] Captura errores y los mapea a `SymlinkError`.
- [ ] Tests FEV2B-T4 ahora pasan (GREEN).
- [ ] Exporta `OPENCODE_SYMLINKS` con los 3 symlinks (`.opencode/agents`, `.opencode/commands`, `.opencode/skills`).
- [ ] Exporta `DEVIN_SYMLINKS` con los 7 symlinks (`.devin/skills`, `.devin/workflows`, + 5 dentro de `.devin/rules/`).

**Verificación:**
- [ ] `bun test tests/unit/adapters/bun-symlink-creator.test.ts` — todos pasan.
- [ ] `just check` — 0 errores.

**Dependencias:** FEV2B-T4.
**Archivos:**
- `src/infrastructure/adapters/BunSymlinkCreator.ts` (nuevo).

**Scope:** M (1h).

---

### ⏳ FEV2B-T6: Tests para `OPENCODE_SYMLINKS` y `DEVIN_SYMLINKS` constants
**Descripción:** Tests que validan que las constantes contienen exactamente los symlinks esperados.

**Criterios de Aceptación:**
- [ ] Tests verifican `OPENCODE_SYMLINKS.length === 3` con los 3 paths de `.opencode/`.
- [ ] Tests verifican `DEVIN_SYMLINKS.length === 7` con los 7 paths de `.devin/`.
- [ ] Tests verifican que los targets son relativos y apuntan a paths que existen en el template.
- [ ] Tests verifican que `OPENCODE_SYMLINKS` tiene `linkPath` que comienza con `.opencode/`.
- [ ] Tests verifican que `DEVIN_SYMLINKS` tiene `linkPath` que comienza con `.devin/`.

**Verificación:**
- [ ] `bun test` — todos pasan.

**Dependencias:** FEV2B-T5.
**Archivos:**
- `tests/unit/adapters/bun-symlink-creator.test.ts` (extendido).

**Scope:** XS (20min).

---

### ⏳ FEV2B-T7: Integrar `ISymlinkCreator` en `CleanInstallUseCase`
**Descripción:** Modificar `CleanInstallUseCase` para invocar el `ISymlinkCreator` con `OPENCODE_SYMLINKS + DEVIN_SYMLINKS` después de `commitStaging()` (Clean Install copia TODO, incluyendo opcionales).

**Criterios de Aceptación:**
- [ ] `CleanInstallUseCase` recibe `ISymlinkCreator` por DI.
- [ ] Después de `commitStaging()` exitoso, llama a `symlinkCreator.createSymlinks([...OPENCODE_SYMLINKS, ...DEVIN_SYMLINKS])` (10 symlinks total).
- [ ] Si la creación falla, warning al usuario, no rollback.
- [ ] Tests del use case actualizados con mock.
- [ ] Test verifica que `createSymlinks` se llama con los 10 symlinks.

**Verificación:**
- [ ] `bun test tests/unit/clean-install.test.ts` — todos pasan.
- [ ] `just check` — 0 errores.

**Dependencias:** FEV2B-T5.
**Archivos:**
- `src/application/use-cases/CleanInstallUseCase.ts` (modificado).
- `tests/unit/clean-install.test.ts` (mock actualizado).

**Scope:** M (45min).

---

### ⏳ FEV2B-T8: Integrar `ISymlinkCreator` en `ProjectInstallUseCase`
**Descripción:** Misma integración que FEV2B-T7 pero para `ProjectInstallUseCase`. Los symlinks de `.devin/` solo se crean si el usuario seleccionó `.devin`. NO integrar en `UpdateWorkspaceUseCase`.

**Criterios de Aceptación:**
- [ ] `ProjectInstallUseCase` recibe `ISymlinkCreator` por DI.
- [ ] Después de `commitStaging()` exitoso:
  - Llama a `symlinkCreator.createSymlinks(OPENCODE_SYMLINKS)` (3 symlinks, siempre).
  - Si `.devin` está en `selectedOptionals`, llama a `symlinkCreator.createSymlinks(DEVIN_SYMLINKS)` (7 symlinks adicionales).
- [ ] Si `.devin` NO está seleccionado, NO se crean los 7 symlinks de `.devin/`.
- [ ] Tests del use case actualizados con mock.
- [ ] Test verifica: (a) con `.devin` seleccionado → 10 symlinks; (b) sin `.devin` → solo 3 symlinks.
- [ ] `UpdateWorkspaceUseCase` NO modificado.

**Verificación:**
- [ ] `bun test tests/unit/project-install.test.ts` — todos pasan (2 tests nuevos).
- [ ] `bun test tests/unit/update-workspace.test.ts` — sin cambios.
- [ ] `just check` — 0 errores.

**Dependencias:** FEV2B-T7.
**Archivos:**
- `src/application/use-cases/ProjectInstallUseCase.ts` (modificado).
- `tests/unit/project-install.test.ts` (mock + 2 tests).

**Scope:** M (1h).

---

### ⏳ FEV2B-T9: Test E2E con symlinks (Clean Install)
**Descripción:** Crear test E2E que verifique que tras `Clean Install` con binario compilado, los 10 symlinks existen en el destino (3 de `.opencode/` + 7 de `.devin/`).

**Criterios de Aceptación:**
- [ ] Script `tests/e2e/07-symlinks-clean-install.sh`:
  1. Crea directorio temporal vacío.
  2. Ejecuta binario compilado en modo Clean Install.
  3. Verifica los 3 symlinks de `.opencode/`.
  4. Verifica los 7 symlinks de `.devin/`.
  5. Verifica que los symlinks resuelven correctamente.
- [ ] Script integrado en `just test-e2e`.
- [ ] Total E2E: 7/7 pasando.

**Verificación:**
- [ ] `just test-e2e` — 7/7 escenarios.

**Dependencias:** FEV2B-T8.
**Archivos:**
- `tests/e2e/07-symlinks-clean-install.sh` (nuevo).
- `Justfile` (recipe `test-e2e` actualizada).

**Scope:** M (1h 15min).

---

### ⏳ FEV2B-T10: Verificar suite completa
**Descripción:** Verificar que no hay regresión con todos los tests unit + integration + e2e.

**Criterios de Aceptación:**
- [ ] `bun test` — 390+ pass, 0 fail (sin regresión).
- [ ] `just check` — 0 errores.
- [ ] E2E: 7/7 pasando.
- [ ] Coverage: ≥97.66% funciones.

**Verificación:**
- [ ] `bun test --coverage` — sin pérdida.

**Dependencias:** FEV2B-T8, FEV2B-T9.
**Archivos:** (ninguno).

**Scope:** XS (10min).

---

### ⏳ FEV2B-T11: Bump version a 1.0.7
**Descripción:** `package.json` → `1.0.7`.

**Criterios de Aceptación:**
- [ ] `"version": "1.0.7"`.
- [ ] Commit: `chore: bump version to 1.0.7`.

**Verificación:**
- [ ] `git diff package.json` muestra solo el bump.

**Dependencias:** FEV2B-T10.
**Archivos:**
- `package.json`.

**Scope:** XS (5min).

---

### ⏳ FEV2B-T12: Actualizar CHANGELOG con v1.0.7
**Descripción:** Crear entrada `[1.0.7] — 2026-06-26` con la descripción del fix + nueva feature.

**Criterios de Aceptación:**
- [ ] CHANGELOG con header `[1.0.7] — 2026-06-26`.
- [ ] Entry `Fixed`: "Symlinks no preservados por npm".
- [ ] Entry `Added`: "Generación de symlinks post-instalación".
- [ ] Entry `Deprecated`: "v1.0.6 — usar v1.0.7".

**Verificación:**
- [ ] `git diff CHANGELOG.md` muestra la nueva sección.

**Dependencias:** FEV2B-T11.
**Archivos:**
- `CHANGELOG.md`.

**Scope:** XS (5min).

---

### ⏳ FEV2B-T13: Commit + PR + Tag + Release
**Descripción:** Commit, push, PR, merge, tag, release pipeline.

**Criterios de Aceptación:**
- [ ] Commit: `fix(manifest): remove symlink entries + feat(symlinks): post-install generation`.
- [ ] `git push origin fix/symlinks-template-paths`.
- [ ] PR creado contra `main`.
- [ ] CI pasa (3 platforms).
- [ ] Squash merge a `main`.
- [ ] Tag `v1.0.7` creado y pusheado.
- [ ] `npm view @fisherk2-dev/codice version` → `1.0.7`.
- [ ] `gh release view v1.0.7` muestra 4 assets.
- [ ] `develop` sincronizado con `main`.
- [ ] Branch local eliminado.

**Verificación:**
- [ ] GitHub Release publicado.
- [ ] npm `latest` → 1.0.7.

**Dependencias:** FEV2B-T12.
**Archivos:** (git only).

**Scope:** S (15min).

---

## Checkpoints

### Checkpoint 1: After FEV2B-T1 (Fix del manifiesto)
- [ ] `FileRuleManifestData.ts` sin las 3 entradas de symlinks.
- [ ] Test FEV2B-T0 pasa (GREEN).
- [ ] `just check` — 0 errores.

### Checkpoint 2: After FEV2B-T5 (SymlinkCreator implementado)
- [ ] `ISymlinkCreator` port creado.
- [ ] `BunSymlinkCreator` adapter implementado.
- [ ] `OPENCODE_SYMLINKS` constant exportada.
- [ ] 6+ tests pasando.
- [ ] `just check` — 0 errores.

### Checkpoint 3: After FEV2B-T8 (Symlinks integrados en use cases)
- [ ] `CleanInstallUseCase` genera symlinks post-commit.
- [ ] `ProjectInstallUseCase` genera symlinks post-commit.
- [ ] `UpdateWorkspaceUseCase` NO modificado.
- [ ] Tests de use cases pasan.
- [ ] `just check` — 0 errores.

### Checkpoint 4: After FEV2B-T10 (Verificación integral)
- [ ] `bun test`: 390+ pass, 0 fail.
- [ ] Coverage sin pérdida.
- [ ] E2E: 7/7 pasando.

### Gate FEV-2-B: After FEV2B-T13 (Release publicado)
- [ ] `npm view` → `1.0.7`.
- [ ] GitHub Release con 4 assets.
- [ ] CHANGELOG actualizado.

---

*Última actualización: 2026-06-26*
