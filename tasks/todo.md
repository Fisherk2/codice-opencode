# TODO: Fase FEV-2 — Resolución de Issue #8 (v1.0.6)

**Estado:** 🟡 Pendiente — 0/9 tareas ejecutadas
**Fecha:** 2026-06-25
**Dependencias:** F0-F6 ✅ → FEV-1 ✅ → **FEV-2 🟡 En curso**

---

## Tareas Pendientes

### ⏳ FEV2-T0: Confirmar causa raíz con reproducción aislada
**Descripción:** Documentar la reproducción del bug con un test que simule la estructura del paquete npm y confirme que `detectTemplateRoot()` produce `src/template` en vez de `template/`.

**Criterios de Aceptación:**
- [ ] Test RED que reproduce el bug con el código actual.
- [ ] Documentación en commit message del fix.

**Dependencias:** Ninguna.
**Archivos:**
- `tests/integration/TemplateResolver.test.ts` (test de reproducción).

**Scope:** S (30min).

---

### ⏳ FEV2-T1: Corregir ruta relativa en `TemplateResolver.detectTemplateRoot()`
**Descripción:** Cambiar `../../template` a `../../../template` en `TemplateResolver.detectTemplateRoot()`.

**Criterios de Aceptación:**
- [ ] Línea corregida en `src/infrastructure/adapters/TemplateResolver.ts`.
- [ ] JSDoc actualizado.
- [ ] Tests existentes pasan.

**Dependencias:** FEV2-T0.
**Archivos:**
- `src/infrastructure/adapters/TemplateResolver.ts`.

**Scope:** XS (15min).

---

### ⏳ FEV2-T2: Añadir test específico para estructura del paquete npm
**Descripción:** Test que simule la estructura real del paquete npm publicado y verifique que `detectTemplateRoot()` retorna la ruta correcta al directorio `template/`.

**Criterios de Aceptación:**
- [ ] Test que cree estructura: `template/obligatorio/opencode.json` + `src/infrastructure/adapters/`.
- [ ] Verificación de que `detectTemplateRoot()` retorna la ruta correcta.

**Dependencias:** FEV2-T1.
**Archivos:**
- `tests/integration/TemplateResolver.test.ts`.

**Scope:** S (45min).

---

### ⏳ FEV2-T3: Verificar fix con `bunx` real en directorio limpio
**Descripción:** Ejecutar `bunx @fisherk2-dev/codice@<version-dev>` en directorio temporal y confirmar que los 3 modos funcionan.

**Criterios de Aceptación:**
- [ ] Clean Install: instala sin error.
- [ ] Project Install: muestra checklist y permite instalar.
- [ ] Update Workspace: actualiza sin error.
- [ ] Script E2E en `tests/e2e/07-bunx-template-resolution.sh`.

**Dependencias:** FEV2-T1, FEV2-T2.
**Archivos:**
- `tests/e2e/07-bunx-template-resolution.sh` (nuevo).

**Scope:** M (1h).

---

### ⏳ FEV2-T4: Revisar manifiesto de archivos opcionales
**Descripción:** La issue #8 también reporta que se muestran como opcionales archivos como `scripts/`, `Makefile`, `requirements.txt`. Revisar y clasificar correctamente.

**Criterios de Aceptación:**
- [ ] Manifiesto revisado.
- [ ] Si están mal clasificados, corregir.
- [ ] Si están bien, documentar la decisión con comentario.

**Dependencias:** FEV2-T1.
**Archivos:**
- `src/domain/entities/file-rule-manifest.ts` (o equivalente).
- `tests/unit/` (test de regresión si aplica).

**Scope:** S (30min).

---

### ⏳ FEV2-T5: Bump version a 1.0.6
**Descripción:** Actualizar `package.json` de `1.0.5` a `1.0.6`.

**Criterios de Aceptación:**
- [ ] `package.json` → `"version": "1.0.6"`.
- [ ] Commit `chore: bump version to 1.0.6`.

**Dependencias:** FEV2-T1, FEV2-T2, FEV2-T3.
**Archivos:**
- `package.json`.

**Scope:** XS (5min).

---

### ⏳ FEV2-T6: Mover `[Unreleased]` → `[1.0.6]` en CHANGELOG
**Descripción:** Actualizar `CHANGELOG.md` con la fecha del release.

**Criterios de Aceptación:**
- [ ] Header `[1.0.6] — 2026-06-25` con entry de Issue #8.
- [ ] Sin sección `[Unreleased]`.

**Dependencias:** FEV2-T5.
**Archivos:**
- `CHANGELOG.md`.

**Scope:** XS (5min).

---

### ⏳ FEV2-T7: Crear tag `v1.0.6` y push
**Descripción:** Tag anotado + push para gatillar release workflow.

**Criterios de Aceptación:**
- [ ] `git tag -a v1.0.6 -m "Release v1.0.6 — Issue #8"`.
- [ ] `git push origin v1.0.6`.

**Dependencias:** FEV2-T5, FEV2-T6.
**Archivos:** (git only).

**Scope:** S (10min).

---

### ⏳ FEV2-T8: Verificar release en npm y GitHub
**Descripción:** Confirmar publicación correcta.

**Criterios de Aceptación:**
- [ ] `npm view @fisherk2-dev/codice version` → `1.0.6`.
- [ ] GitHub Release `v1.0.6` con 4 assets.

**Dependencias:** FEV2-T7.
**Archivos:** (verificación).

**Scope:** XS (5min).

---

### ⏳ FEV2-T9: Sync main → develop y cleanup
**Descripción:** Merge main a develop + eliminar branches.

**Criterios de Aceptación:**
- [ ] `git checkout develop && git merge main` (fast-forward).
- [ ] `git branch -d fix/no-install-issue` (local).
- [ ] `git push origin --delete fix/no-install-issue` (remote).
- [ ] Solo `main` y `develop`.

**Dependencias:** FEV2-T8.
**Archivos:** (git only).

**Scope:** S (10min).

---

## Checkpoints

### Checkpoint 1: After FEV2-T1 (Fix aplicado)
- [ ] `TemplateResolver.ts` corregido.
- [ ] Tests existentes pasan (382+).
- [ ] `just check` — 0 errores.

### Checkpoint 2: After FEV2-T2 + FEV2-T4 (Cobertura completa)
- [ ] Nuevo test pasa.
- [ ] Manifiesto revisado.
- [ ] Coverage ≥97.66%.

### Checkpoint 3: After FEV2-T3 (Verificación E2E)
- [ ] E2E con `bunx` real pasa.
- [ ] No aparece "Template file not found".

### Gate FEV-2: After FEV2-T8 (Release publicado)
- [ ] `npm view` → `1.0.6`.
- [ ] GitHub Release con 4 assets.
- [ ] CHANGELOG actualizado.

---

*Última actualización: 2026-06-25*
