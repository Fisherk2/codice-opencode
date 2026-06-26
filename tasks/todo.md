# TODO: Fase FEV-2-C — Gitignore Post-Install Generation + Tech Debt: Test Aislado (v1.0.9)

**Estado:** ✅ Completo — 15/15 tareas ejecutadas
**Fecha:** 2026-06-26
**Dependencias:** F0-F6 ✅ → FEV-1 ✅ → FEV-2 ✅ → FEV-2-B ✅ → **FEV-2-C ✅ Completo**
**Branch:** `fix/fev-2-c-gitignore` (a crear desde develop)
**Issue principal:** #11 — `Template file not found: .gitignore` en `bunx @fisherk2-dev/codice`

---

## Contexto Rápido

**Bug:** npm excluye archivos `.gitignore` del paquete por defecto (hardcoded behavior). `template/estandar/.gitignore` existe en el repo (2930 bytes) pero NO en el tarball publicado. `TemplateResolver.resolvePath(".gitignore")` falla en los 3 modos.

**Solución (Opción 1):**
1. Renombrar `template/estandar/.gitignore` → `template/estandar/gitignore` (evita exclusión de npm)
2. Eliminar entrada `.gitignore` de `FileRuleManifestData.ts`
3. Crear `IGitignoreCreator` port + `BunGitignoreCreator` adapter (mismo patrón que FEV-2-B)
4. Generar `.gitignore` post-instalación en Clean Install y Project Install (NO en Update)

**Tech Debt adicional (FE2C-T14):** Documentar en `docs/TECH_DEBT.md` la necesidad de un test de integración aislado para v1.1.0 (simula `bunx` desde directorio temporal).

**Versión:** v1.0.9 (no se puede republicar v1.0.8).

---

## Tareas Pendientes

### ⏳ FE2C-T0: Test RED con estructura del paquete npm
**Descripción:** Test que simula la estructura del paquete npm (sin `.gitignore`) y verifica que `resolvePath(".gitignore")` falla con el manifiesto actual.

**Criterios de Aceptación:**
- [ ] Test crea directorio temporal con estructura sin `.gitignore`.
- [ ] Test invoca `TemplateResolver.resolvePath(".gitignore")` y espera throw con `TemplateNotFoundError`.
- [ ] Test es RED con código actual.

**Verificación:**
- [ ] `bun test tests/integration/TemplateResolver.test.ts` — el test falla con error "Template file not found: .gitignore".

**Dependencias:** Ninguna.
**Archivos:**
- `tests/integration/TemplateResolver.test.ts` (nuevo test).

**Scope:** S (30min).

---

### ⏳ FE2C-T1: Renombrar `template/estandar/.gitignore` → `template/estandar/gitignore`
**Descripción:** Renombrar el archivo `.gitignore` a `gitignore` (sin punto) para evitar la exclusión automática de npm.

**Criterios de Aceptación:**
- [ ] Archivo `template/estandar/.gitignore` renombrado a `template/estandar/gitignore`.
- [ ] Contenido idéntico al original (2930 bytes).
- [ ] `npm pack --dry-run` ahora incluye `gitignore` (sin punto).

**Verificación:**
- [ ] `ls -la template/estandar/gitignore` — archivo existe.
- [ ] `ls template/estandar/.gitignore` — archivo NO existe.
- [ ] `npm pack --dry-run 2>&1 | grep gitignore` — ahora aparece `template/estandar/gitignore`.

**Dependencias:** FE2C-T0.
**Archivos:**
- `template/estandar/.gitignore` (eliminado).
- `template/estandar/gitignore` (nuevo).

**Scope:** XS (5min).

---

### ⏳ FE2C-T2: Eliminar entrada `.gitignore` de `FileRuleManifestData.ts`
**Descripción:** Remover la entrada para `.gitignore` del `FILE_RULE_MANIFEST`. La generación post-instalación se encarga de crear el archivo `.gitignore` en el destino.

**Criterios de Aceptación:**
- [ ] 1 entrada eliminada de la sección ESTANDAR.
- [ ] Comentario explicativo añadido referenciando el ADR-FEV2C-6.
- [ ] Total standard: 12 → 11.
- [ ] Total general: 32 → 31.
- [ ] Test FE2C-T0 ahora pasa (GREEN).

**Verificación:**
- [ ] `bun test tests/integration/TemplateResolver.test.ts` — todos pasan.
- [ ] `grep -n "gitignore" src/domain/entities/FileRuleManifestData.ts` — solo aparece el comentario.
- [ ] `just check` — 0 errores.

**Dependencias:** FE2C-T1.
**Archivos:**
- `src/domain/entities/FileRuleManifestData.ts`.

**Scope:** XS (15min).

---

### ⏳ FE2C-T2.5: Actualizar test de completitud `file-rule-manifest.test.ts`
**Descripción:** El test cuenta archivos en `template/estandar/`. Debe excluir `gitignore` del conteo (ahora es asset para post-install).

**Criterios de Aceptación:**
- [ ] Test filtra `gitignore` al contar archivos en `estandar/`.
- [ ] Conteo esperado: 8 mandatory, 11 standard, 12 optional.
- [ ] Test verifica que la entrada `.gitignore` NO existe en el manifiesto.
- [ ] Test verifica que `gitignore` SÍ existe en el filesystem.

**Verificación:**
- [ ] `bun test tests/unit/file-rule-manifest.test.ts` — todos pasan.
- [ ] Si comento una entrada válida del manifest, el test falla (guard funciona).

**Dependencias:** FE2C-T2.
**Archivos:**
- `tests/unit/file-rule-manifest.test.ts`.

**Scope:** S (30min).

---

### ⏳ FE2C-T3: Crear puerto `IGitignoreCreator`
**Descripción:** Definir interfaz `IGitignoreCreator` en `src/application/ports/` siguiendo Clean Architecture.

**Criterios de Aceptación:**
- [ ] Nuevo archivo `src/application/ports/IGitignoreCreator.ts`.
- [ ] Interface exporta: `createGitignore(destPath: string): Promise<Result<void, GitignoreError>>`.
- [ ] JSDoc con propósito, parámetros, errores, y modo de operación (Clean/Project solamente, NO Update).
- [ ] Sin imports de `fs` o `Bun`.

**Verificación:**
- [ ] `just check` — 0 errores.
- [ ] `tsc --noEmit` — 0 errores.

**Dependencias:** FE2C-T2.
**Archivos:**
- `src/application/ports/IGitignoreCreator.ts` (nuevo).

**Scope:** XS (20min).

---

### ⏳ FE2C-T4: Crear type `GitignoreError` en domain
**Descripción:** Crear tipo `GitignoreError` en `src/domain/types/` siguiendo el patrón de `SymlinkError`.

**Criterios de Aceptación:**
- [ ] Nuevo archivo `src/domain/types/GitignoreError.ts`.
- [ ] Extiende `Error` con campo `code: GitignoreErrorCode` (enum: `READ_FAILED`, `WRITE_FAILED`, `TEMPLATE_NOT_FOUND`).
- [ ] Factory functions: `gitignoreReadError(path)`, `gitignoreWriteError(path)`, `gitignoreTemplateNotFoundError(path)`.
- [ ] JSDoc con propósito y casos de uso.

**Verificación:**
- [ ] `just check` — 0 errores.
- [ ] `tsc --noEmit` — 0 errores.

**Dependencias:** FE2C-T2.
**Archivos:**
- `src/domain/types/GitignoreError.ts` (nuevo).

**Scope:** XS (10min).

---

### ⏳ FE2C-T5: Test RED para `BunGitignoreCreator` (TDD)
**Descripción:** Crear tests que cubran: crear `.gitignore` nuevo, idempotencia, skip directorio, error handling.

**Criterios de Aceptación:**
- [ ] Archivo `tests/unit/adapters/bun-gitignore-creator.test.ts`.
- [ ] 6+ tests cubriendo:
  1. Crea `.gitignore` nuevo con contenido del template
  2. Idempotencia: skip si ya existe
  3. Skip directorio: si `destPath/.gitignore` es directorio
  4. Read template failed: retorna `Result.err` (READ_FAILED)
  5. Write failed: retorna `Result.err` (WRITE_FAILED)
  6. Template not found: retorna `Result.err` (TEMPLATE_NOT_FOUND)
- [ ] Tests son RED con código actual.

**Verificación:**
- [ ] `bun test tests/unit/adapters/bun-gitignore-creator.test.ts` — todos fallan.

**Dependencias:** FE2C-T3, FE2C-T4.
**Archivos:**
- `tests/unit/adapters/bun-gitignore-creator.test.ts` (nuevo).

**Scope:** S (45min).

---

### ⏳ FE2C-T6: Implementar `BunGitignoreCreator` adapter (TDD GREEN)
**Descripción:** Crear clase `BunGitignoreCreator` en `src/infrastructure/adapters/` que implementa `IGitignoreCreator`.

**Criterios de Aceptación:**
- [ ] Archivo `src/infrastructure/adapters/BunGitignoreCreator.ts`.
- [ ] Constructor: `constructor(templatePath: string, verbose?: boolean)`.
- [ ] Método: `createGitignore(destPath: string): Promise<Result<void, GitignoreError>>`.
- [ ] Lee contenido de `template/estandar/gitignore` con `Bun.file().text()`.
- [ ] Escribe a `destPath/.gitignore` con `Bun.write()`.
- [ ] Verifica si `.gitignore` ya existe antes de escribir (idempotencia).
- [ ] Verifica si `destPath/.gitignore` es un directorio real (skip con warning).
- [ ] Captura errores de `EACCES`, `EISDIR`, `ENOENT` y los mapea a `GitignoreError`.
- [ ] Si `verbose` es true, log a stderr con timestamp.
- [ ] Tests FE2C-T5 ahora pasan (GREEN).

**Verificación:**
- [ ] `bun test tests/unit/adapters/bun-gitignore-creator.test.ts` — todos pasan.
- [ ] `just check` — 0 errores.

**Dependencias:** FE2C-T5.
**Archivos:**
- `src/infrastructure/adapters/BunGitignoreCreator.ts` (nuevo).

**Scope:** M (1h).

---

### ⏳ FE2C-T7: Integrar `IGitignoreCreator` en `CleanInstallUseCase`
**Descripción:** Modificar `CleanInstallUseCase` para invocar el `IGitignoreCreator` después de `commitStaging()`.

**Criterios de Aceptación:**
- [ ] `CleanInstallUseCase` recibe `IGitignoreCreator` por DI.
- [ ] Después de `commitStaging()` exitoso, llama a `gitignoreCreator.createGitignore(destinationPath)`.
- [ ] Si la creación falla, warning al usuario, NO rollback.
- [ ] Orden: file merge → gitignore generation → symlink generation (per ADR-FEV2C-10).
- [ ] Tests del use case actualizados con mock.
- [ ] Test verifica que `createGitignore` se llama con destinationPath correcto.
- [ ] Test verifica que si `createGitignore` falla, el use case retorna `Result.ok` con warning.

**Verificación:**
- [ ] `bun test tests/unit/clean-install.test.ts` — todos pasan.
- [ ] `just check` — 0 errores.

**Dependencias:** FE2C-T6.
**Archivos:**
- `src/application/use-cases/CleanInstallUseCase.ts` (modificado).
- `src/cli/container.ts` (DI wiring actualizado).
- `tests/unit/clean-install.test.ts` (mock actualizado).

**Scope:** M (45min).

---

### ⏳ FE2C-T8: Integrar `IGitignoreCreator` en `ProjectInstallUseCase`
**Descripción:** Misma integración que FE2C-T7 pero para `ProjectInstallUseCase`. El `.gitignore` se genera SIEMPRE (es standard, no opcional). NO integrar en `UpdateWorkspaceUseCase`.

**Criterios de Aceptación:**
- [ ] `ProjectInstallUseCase` recibe `IGitignoreCreator` por DI.
- [ ] Después de `commitStaging()` exitoso, llama a `gitignoreCreator.createGitignore(destinationPath)`.
- [ ] Orden: file merge → gitignore generation → symlink generation.
- [ ] Si la creación falla, warning al usuario, NO rollback.
- [ ] `UpdateWorkspaceUseCase` NO modificado.
- [ ] Tests del use case actualizados con mock.
- [ ] Test verifica que `createGitignore` se llama con destinationPath correcto.
- [ ] Test verifica que `UpdateWorkspaceUseCase` no llama a `createGitignore` (regression guard).

**Verificación:**
- [ ] `bun test tests/unit/project-install.test.ts` — todos pasan.
- [ ] `bun test tests/unit/update-workspace.test.ts` — sin cambios, sigue pasando.
- [ ] `just check` — 0 errores.

**Dependencias:** FE2C-T7.
**Archivos:**
- `src/application/use-cases/ProjectInstallUseCase.ts` (modificado).
- `src/cli/container.ts` (DI wiring actualizado para Project).
- `tests/unit/project-install.test.ts` (mock actualizado).
- `tests/unit/update-workspace.test.ts` (regression test añadido).

**Scope:** M (1h).

---

### ⏳ FE2C-T9: Test E2E con gitignore (Clean Install + Project Install)
**Descripción:** Crear tests E2E que verifiquen que tras `Clean Install` y `Project Install` con binario compilado, el archivo `.gitignore` existe en el destino.

**Criterios de Aceptación:**
- [ ] Script `tests/e2e/11-gitignore-clean-install.sh`:
  1. Crea directorio temporal vacío.
  2. Ejecuta binario compilado en modo Clean Install.
  3. Verifica que `dest/.gitignore` existe.
  4. Verifica que el contenido coincide con el template.
- [ ] Script `tests/e2e/12-gitignore-project-install.sh`:
  1. Crea directorio temporal vacío.
  2. Ejecuta binario compilado en modo Project Install.
  3. Verifica que `dest/.gitignore` existe.
  4. Verifica que el contenido coincide con el template.
- [ ] Scripts integrados en `just test-e2e`.
- [ ] Total E2E: 12/12 pasando.

**Verificación:**
- [ ] `just test-e2e` — 12/12 escenarios.
- [ ] Output captura el `.gitignore` creado.

**Dependencias:** FE2C-T8.
**Archivos:**
- `tests/e2e/11-gitignore-clean-install.sh` (nuevo).
- `tests/e2e/12-gitignore-project-install.sh` (nuevo).
- `Justfile` (recipe `test-e2e` actualizada).

**Scope:** M (1h 15min).

---

### ⏳ FE2C-T10: Verificar suite completa
**Descripción:** Verificar que no hay regresión con todos los tests unit + integration + e2e.

**Criterios de Aceptación:**
- [ ] `bun test` — 460+ pass, 0 fail (sin regresión, +14 tests de gitignore).
- [ ] `just check` — 0 errores.
- [ ] E2E: 12/12 pasando.
- [ ] Coverage: ≥97.66% funciones.
- [ ] Domain coverage: 100% líneas (mantener).

**Verificación:**
- [ ] `bun test --coverage` — sin pérdida de coverage.

**Dependencias:** FE2C-T8, FE2C-T9.
**Archivos:** (ninguno).

**Scope:** XS (10min).

---

### ⏳ FE2C-T11: Bump version a 1.0.9
**Descripción:** `package.json` → `1.0.9`.

**Criterios de Aceptación:**
- [ ] `"version": "1.0.9"`.
- [ ] Commit: `chore: bump version to 1.0.9`.

**Verificación:**
- [ ] `git diff package.json` muestra solo el bump.

**Dependencias:** FE2C-T10.
**Archivos:**
- `package.json`.

**Scope:** XS (5min).

---

### ⏳ FE2C-T12: Actualizar CHANGELOG con v1.0.9
**Descripción:** Crear entrada `[1.0.9] — 2026-06-26` con la descripción del fix.

**Criterios de Aceptación:**
- [ ] CHANGELOG con header `[1.0.9] — 2026-06-26`.
- [ ] Entry `Fixed`: "Issue #11 — `Template file not found: .gitignore` en `bunx`".
- [ ] Entry `Deprecated`: "v1.0.8 — usar v1.0.9".
- [ ] Remover entry `[Unreleased]` con Issue #11.

**Verificación:**
- [ ] `git diff CHANGELOG.md` muestra la nueva sección.

**Dependencias:** FE2C-T11.
**Archivos:**
- `CHANGELOG.md`.

**Scope:** XS (5min).

---

### ⏳ FE2C-T13: Commit + PR + Tag + Release
**Descripción:** Commit, push, PR, merge, tag, release pipeline.

**Criterios de Aceptación:**
- [ ] Commit: `fix(gitignore): post-install generation + remove manifest entry (#11)`.
- [ ] Branch: `fix/fev-2-c-gitignore` (base = develop).
- [ ] `git push origin fix/fev-2-c-gitignore`.
- [ ] PR creado contra `develop` (o `main` según convención).
- [ ] CI pasa (3 platforms: Linux, macOS, Windows).
- [ ] Squash merge a base branch.
- [ ] Tag `v1.0.9` creado y pusheado.
- [ ] `npm view @fisherk2-dev/codice version` → `1.0.9`.
- [ ] `gh release view v1.0.9` muestra 4 assets.
- [ ] Branch local eliminado.
- [ ] `develop` sincronizado con base branch.

**Verificación:**
- [ ] GitHub Release publicado.
- [ ] npm `latest` → 1.0.9.

**Dependencias:** FE2C-T12.
**Archivos:** (git only).

**Scope:** S (15min).

---

### ⏳ FE2C-T14: Actualizar `docs/TECH_DEBT.md` con deuda del test aislado (v1.1.0)
**Descripción:** Documentar en `docs/TECH_DEBT.md` la necesidad de un test de integración aislado que simule `bunx @fisherk2-dev/codice` desde un directorio temporal. Este test detectará bugs de empaquetado npm que el test actual (`TemplateResolver.test.ts` con `template/` local) no detecta.

**Criterios de Aceptación:**
- [ ] Nueva sección añadida en `docs/TECH_DEBT.md` (sección 5.3, después de "E2E Coverage Not Captured by `bun --coverage`"):
  - **Problema:** El test de integración actual usa `template/` local. Esto oculta bugs que solo aparecen en `bunx`.
  - **Solución propuesta (v1.1.0):** Test de integración aislado que:
    1. Build el paquete npm con `bun pm pack`.
    2. Install el paquete en un directorio temporal.
    3. Run el binario instalado desde el directorio temporal.
    4. Verify que la resolución de templates, gitignore, y symlinks funciona.
  - **Por qué es importante:** FEV-2-B y FEV-2-C fueron bugs que solo se detectaron DESPUÉS del release.
  - **Esfuerzo:** 4-6h.
  - **Impacto:** Detecta bugs de empaquetado ANTES del release.
- [ ] Mover Issue #11 de "Known Issues (v1.0.8)" a "Resolved in v1.0.9" con descripción del fix.
- [ ] Actualizar header del documento a "Technical Debt — Códice v1.0.9".
- [ ] Actualizar métricas en el header: tests, coverage.

**Verificación:**
- [ ] `git diff docs/TECH_DEBT.md` muestra la nueva sección.
- [ ] El documento es coherente con la versión v1.0.9.

**Dependencias:** FE2C-T13.
**Archivos:**
- `docs/TECH_DEBT.md` (modificado).

**Scope:** XS (15min).

---

## Checkpoints

### Checkpoint 1: After FE2C-T2 (Template fix)
- [ ] `template/estandar/gitignore` existe (renombrado).
- [ ] `template/estandar/.gitignore` NO existe.
- [ ] Entrada `.gitignore` eliminada de `FileRuleManifestData.ts`.
- [ ] Test FE2C-T0 pasa (GREEN).
- [ ] `npm pack --dry-run` incluye `gitignore` (sin punto).
- [ ] `just check` — 0 errores.

### Checkpoint 2: After FE2C-T6 (Port + Adapter implementados)
- [ ] `IGitignoreCreator` port creado.
- [ ] `GitignoreError` type creado.
- [ ] `BunGitignoreCreator` adapter implementado.
- [ ] 6+ tests pasando.
- [ ] `just check` — 0 errores.

### Checkpoint 3: After FE2C-T8 (Use cases integrados)
- [ ] `CleanInstallUseCase` genera `.gitignore` post-commit.
- [ ] `ProjectInstallUseCase` genera `.gitignore` post-commit.
- [ ] `UpdateWorkspaceUseCase` NO genera `.gitignore` (regression test included).
- [ ] Tests de use cases pasan.
- [ ] `just check` — 0 errores.

### Checkpoint 4: After FE2C-T10 (Verificación integral)
- [ ] `bun test`: 460+ pass, 0 fail.
- [ ] Coverage sin pérdida.
- [ ] E2E: 12/12 pasando.

### Gate FEV-2-C: After FE2C-T13 (Release publicado)
- [ ] `npm view` → `1.0.9`.
- [ ] GitHub Release con 4 assets.
- [ ] CHANGELOG actualizado.
- [ ] Issue #11 cerrado.

### Gate FE2C-T14: After Tech Debt Documentation
- [ ] `docs/TECH_DEBT.md` actualizado con sección del test aislado.
- [ ] Issue #11 movido a "Resolved in v1.0.9".
- [ ] Header del documento actualizado a v1.0.9.

---

## Resumen Rápido

| Tarea | Scope | Esfuerzo |
|-------|-------|----------|
| FE2C-T0: Test RED con estructura npm | S | 30min |
| FE2C-T1: Renombrar `.gitignore` → `gitignore` | XS | 5min |
| FE2C-T2: Eliminar entrada del manifiesto | XS | 15min |
| FE2C-T2.5: Actualizar test de completitud | S | 30min |
| FE2C-T3: Crear puerto `IGitignoreCreator` | XS | 20min |
| FE2C-T4: Crear type `GitignoreError` | XS | 10min |
| FE2C-T5: Test RED `BunGitignoreCreator` | S | 45min |
| FE2C-T6: Implementar `BunGitignoreCreator` | M | 1h |
| FE2C-T7: Integrar en `CleanInstallUseCase` | M | 45min |
| FE2C-T8: Integrar en `ProjectInstallUseCase` | M | 1h |
| FE2C-T9: Test E2E con gitignore | M | 1h 15min |
| FE2C-T10: Verificar suite completa | XS | 10min |
| FE2C-T11: Bump version 1.0.9 | XS | 5min |
| FE2C-T12: Actualizar CHANGELOG | XS | 5min |
| FE2C-T13: Commit + PR + Tag + Release | S | 15min |
| FE2C-T14: Actualizar TECH_DEBT.md (isolated test) | XS | 15min |
| **Total** | | **~7h 10min** |

---

## Notas para v1.1.0 (Tech Debt)

El test aislado propuesto en FE2C-T14 es la pieza que falta para **detectar bugs de empaquetado npm ANTES del release**. Tanto FEV-2-B (symlinks) como FEV-2-C (gitignore) fueron bugs que solo se detectaron DESPUÉS del release porque:

1. `just dev` usa `template/` local (modo source) → oculta el problema del tarball.
2. Los tests unitarios/integración usan `template/` local → mismo problema.
3. Los tests E2E compilan el binario y lo ejecutan, pero NO validan el contenido del tarball de npm.

El test aislado (v1.1.0) cerrará esta brecha. Diseño preliminar:

```typescript
// tests/integration/installed-package.test.ts (v1.1.0)
describe('Isolated Package Behavior', () => {
  it('should resolve template correctly when installed via npm in a foreign directory', async () => {
    // 1. Crear directorio temporal (simula directorio del usuario)
    const userDir = await fs.mkdtemp(path.join(os.tmpdir(), 'codice-test-'));
    
    // 2. Build el paquete npm (equivalente a `bun pm pack`)
    const tarballPath = await buildPackage(projectRoot);
    
    // 3. Install el paquete en userDir
    await exec(`npm install ${tarballPath}`, { cwd: userDir });
    
    // 4. Run el binario instalado
    const result = await exec('npx codice --version', { cwd: userDir });
    
    // 5. Verify
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    
    // 6. Verify que el template se resuelve correctamente
    const result2 = await exec('npx codice --dry-run', { cwd: userDir });
    expect(result2.exitCode).toBe(0);
    expect(result2.stderr).not.toContain('Template file not found');
  });
});
```

Este test se ejecutará en CI antes del release, evitando futuros bugs de empaquetado.

---

*Última actualización: 2026-06-26*
