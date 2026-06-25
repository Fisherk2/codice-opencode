# TODO: Fase FEV-2 — Resolución de Issue #8 (v1.0.6)

**Estado:** 🟡 Pendiente — 0/10 tareas ejecutadas
**Fecha:** 2026-06-25
**Dependencias:** F0-F6 ✅ → FEV-1 ✅ → **FEV-2 🟡 En curso**

---

## Tareas Pendientes

### ⏳ FEV2-T0: Reproducir bug del template path con test RED
**Descripción:** Test que simule la estructura del paquete npm y confirme que `detectTemplateRoot()` produce `src/template` en vez de `template/`.

**Criterios de Aceptación:**
- [ ] Test que cree `tmp/{template/obligatorio/opencode.json, src/infrastructure/adapters/TemplateResolver.ts (mock)}`.
- [ ] Test verifica que `detectTemplateRoot()` retorna la ruta del `template/`.
- [ ] Test es RED con el código actual, GREEN después de FEV2-T1.

**Dependencias:** Ninguna.
**Archivos:**
- `tests/integration/TemplateResolver.test.ts` (nuevo test).

**Scope:** S (30min).

---

### ⏳ FEV2-T1: Corregir ruta en `TemplateResolver.detectTemplateRoot()`
**Descripción:** Cambiar `../../template` a `../../../template`.

**Criterios de Aceptación:**
- [ ] `src/infrastructure/adapters/TemplateResolver.ts` línea 52 corregida.
- [ ] JSDoc actualizado.
- [ ] Test FEV2-T0 ahora pasa (GREEN).

**Dependencias:** FEV2-T0.
**Archivos:**
- `src/infrastructure/adapters/TemplateResolver.ts`.

**Scope:** XS (15min).

---

### ⏳ FEV2-T2: E2E con bunx real en directorio limpio
**Descripción:** Script E2E que simule instalación vía `bunx` y verifique los 3 modos.

**Criterios de Aceptación:**
- [ ] Script `tests/e2e/07-bunx-template-resolution.sh` que prueba los 3 modos en directorio temporal vacío.
- [ ] Sin "Template file not found" en output.
- [ ] Integrado en `just test-e2e`.

**Dependencias:** FEV2-T1.
**Archivos:**
- `tests/e2e/07-bunx-template-resolution.sh` (nuevo).

**Scope:** M (1h).

---

### ⏳ FEV2-T3: Listar todos los archivos reales de `template/opcional/`
**Descripción:** Inventario exhaustivo (incluyendo ocultos) de archivos y directorios en `template/opcional/`.

**Criterios de Aceptación:**
- [ ] Lista generada con `find template/opcional -mindepth 1`.
- [ ] Categorización: archivos sueltos / directorios / ocultos.

**Dependencias:** Ninguna (paralelo a FEV2-T0).
**Archivos:** (ninguno, solo inventario).

**Scope:** XS (5min).

---

### ⏳ FEV2-T4: Añadir entradas faltantes al `FileRuleManifestData`
**Descripción:** Añadir 4 nuevas entradas opcionales:
- `.gitmessage` (archivo oculto)
- `docs/opencode` (directorio, agrupa 13 archivos)
- `.opencode/plugins/sdd-workflow-test.md` (archivo oculto)
- `.devin/rules` (directorio oculto)

Total: 9 (actuales) + 4 (nuevas) = 13 opcionales.

**Criterios de Aceptación:**
- [ ] 4 entradas añadidas con descripciones.
- [ ] Orden: alfabético por `path`.
- [ ] Tests existentes pasan.

**Dependencias:** FEV2-T3.
**Archivos:**
- `src/domain/entities/FileRuleManifestData.ts`.

**Scope:** S (30min).

---

### ⏳ FEV2-T5: Implementar exclusion logic en motor de copia
**Descripción:** `docs/` (estándar) debe excluir `docs/opencode/` (opcional) para evitar copia doble.

**Criterios de Aceptación:**
- [ ] Motor de copia (`BunFileSystem.stageFile` o `walkDirectory`) soporta `excludePaths`.
- [ ] Copia de `docs/` excluye `docs/opencode/`.
- [ ] Selección de `docs/opencode` opcional copia desde entrada individual.
- [ ] Sin copia doble.

**Verificación:**
- [ ] Test unitario: copiar `docs/` no incluye `docs/opencode/`.
- [ ] E2E con selección de `docs/opencode`: aparece una sola vez en destino.

**Dependencias:** FEV2-T1, FEV2-T4.
**Archivos:**
- `src/infrastructure/adapters/directoryWalker.ts` (parámetro `excludePaths`).
- `src/application/use-cases/ProjectInstallUseCase.ts` (configuración de exclusion).

**Scope:** M (1h 30min).

---

### ⏳ FEV2-T6: Test de completitud por categoría
**Descripción:** Test que cuenta archivos en `template/<categoría>/` y verifica que el manifest tenga al menos esa cantidad de entries.

**Criterios de Aceptación:**
- [ ] Test recursivo en `template/opcional/` (incluyendo ocultos).
- [ ] Verifica `FILE_RULE_MANIFEST.filter(r => r.category === 'optional').length >= archivos_contados`.
- [ ] Si se añade archivo sin manifest, el test falla (regression guard).

**Dependencias:** FEV2-T4.
**Archivos:**
- `tests/unit/file-rule-manifest.test.ts` (nuevo).

**Scope:** S (45min).

---

### ⏳ FEV2-T7: Bump version a 1.0.6
**Descripción:** `package.json` → `1.0.6`.

**Criterios de Aceptación:**
- [ ] `"version": "1.0.6"`.
- [ ] Commit: `chore: bump version to 1.0.6`.

**Dependencias:** FEV2-T1, FEV2-T2, FEV2-T4, FEV2-T5, FEV2-T6.
**Archivos:**
- `package.json`.

**Scope:** XS (5min).

---

### ⏳ FEV2-T8: Actualizar CHANGELOG y crear tag
**Descripción:** Mover `[Unreleased]` a `[1.0.6] — 2026-06-25`. Crear tag anotado.

**Criterios de Aceptación:**
- [ ] CHANGELOG con 3 entries: Issue #8 fix, manifest completo, exclusion logic.
- [ ] `git tag -a v1.0.6 -m "Release v1.0.6 — Issue #8 (bunx + manifest)"`.
- [ ] `git push origin v1.0.6`.

**Dependencias:** FEV2-T7.
**Archivos:**
- `CHANGELOG.md`.

**Scope:** S (10min).

---

### ⏳ FEV2-T9: Verificar release + sync + cleanup
**Descripción:** Confirmar publicación, merge, eliminar branches.

**Criterios de Aceptación:**
- [ ] `npm view @fisherk2-dev/codice version` → `1.0.6`.
- [ ] `gh release view v1.0.6` muestra 4 assets.
- [ ] `git checkout develop && git merge main` (fast-forward).
- [ ] `git push origin develop`.
- [ ] `git branch -d fix/no-install-issue` (local).
- [ ] `git push origin --delete fix/no-install-issue` (remote).
- [ ] Solo `main` y `develop`.

**Dependencias:** FEV2-T8.
**Archivos:** (git only).

**Scope:** S (10min).

---

## Checkpoints

### Checkpoint 1: After FEV2-T1 (Template path fix)
- [ ] `TemplateResolver.ts` corregido con `../../../template`.
- [ ] Tests existentes pasan sin regresión.
- [ ] `just check` — 0 errores.

### Checkpoint 2: After FEV2-T4 + FEV2-T6 (Manifest completo)
- [ ] 13+ entradas opcionales.
- [ ] Test de completitud pasa.
- [ ] Coverage ≥97.66%.

### Checkpoint 3: After FEV2-T5 (Exclusion logic)
- [ ] `docs/` no copia `docs/opencode/`.
- [ ] Selección de `docs/opencode` opcional funciona.
- [ ] Sin copia doble.

### Checkpoint 4: After FEV2-T2 (E2E bunx)
- [ ] 7/7 E2E escenarios pasando.
- [ ] No "Template file not found" en output.

### Gate FEV-2: After FEV2-T8 (Release publicado)
- [ ] `npm view` → `1.0.6`.
- [ ] GitHub Release con 4 assets.
- [ ] CHANGELOG actualizado.

---

*Última actualización: 2026-06-25*
