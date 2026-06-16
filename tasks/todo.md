# TODO: F5.5 — Publicación npm + bunx support

**Estado:** 🟡 En curso — 0/5 tareas ejecutadas
**Fecha:** 2026-06-16 (última actualización)
**Dependencias:** F0 ✅ → F1 ✅ → F2 ✅ → F3 ✅ → F4 ✅ → F4.5 ✅ → F4.6 ✅ → F5 ✅ → **F5.5 ⬅️ En curso** → F6 ✅

---

## Phase 1: Preparación del paquete npm

### F55-T1: package.json — Añadir bin entry y mover dependencies

**Descripción:** Configurar package.json para que sea un paquete npm ejecutable con `bunx`.

**Criterios de aceptación:**
- [ ] `"bin": { "codice": "./src/cli/main.ts" }` en package.json
- [ ] `@clack/prompts` y `semver` en `dependencies` (no devDependencies)
- [ ] `"files": [...]` incluye `src/`, `template/`, `package.json`, `tsconfig.json`
- [ ] `"publishConfig": { "access": "public" }` (scoped packages requieren acceso público)
- [ ] `"type": "module"` preservado

**Verification:**
- [ ] `bun run src/cli/main.ts` funciona correctamente
- [ ] `bun install` (desde un directorio limpio) instala solo los deps necesarios

**Dependencies:** Ninguna
**Files touched:** `package.json`, `bun.lock`
**Scope:** S

---

### F55-T2: TemplateResolver — Soportar source mode

**Descripción:** Modificar `TemplateResolver.ts` para que detecte automáticamente si está corriendo desde source (bunx/bun run) o desde binario compilado, y resuelva la ruta del template en consecuencia.

**Criterios de aceptación:**
- [ ] En source mode: `import.meta.dir` + `'../../template/'` como raíz del template
- [ ] En compiled mode: `process.execPath` + `'../template/'` como raíz (comportamiento actual, no romper)
- [ ] Detección automática: verificar si `import.meta.dir` existe relativo al directorio template
- [ ] Sin necesidad de variables de entorno ni flags

**Verification:**
- [ ] `bun run src/cli/main.ts` carga templates correctamente (source mode)
- [ ] `./dist/codice-linux` carga templates correctamente (compiled mode, no romper)
- [ ] `bun test` sigue pasando (284 tests, 0 fail)

**Dependencies:** F55-T1 ✅
**Files touched:** `src/infrastructure/adapters/TemplateResolver.ts`
**Scope:** M

---

## Phase 2: Publicación

### F55-T3: Publicar primera versión a npm (manual)

**Descripción:** Publicar `@fisherk2/codice` a npm por primera vez. Pasos guiados.

**Criterios de aceptación:**
- [ ] Cuenta npm creada y organización @fisherk2 configurada
- [ ] MFA configurado: `npm access set mfa=automation @fisherk2/codice`
- [ ] Granular Access Token generado con `--bypass-2fa --scopes @fisherk2`
- [ ] `npm publish` exitoso
- [ ] `bunx @fisherk2/codice` descarga e inicia el instalador correctamente

**Verification:**
- [ ] `bunx @fisherk2/codice` → menú interactivo funciona
- [ ] `bunx @fisherk2/codice --version` → muestra versión correcta

**Dependencies:** F55-T1 ✅, F55-T2 ✅
**Scope:** L (por ser primera vez del usuario)

---

### F55-T4: Automatizar publicación npm en release.yml

**Descripción:** Modificar el workflow de release para que además de subir binarios a GitHub Releases, publique el paquete a npm automáticamente.

**Criterios de aceptación:**
- [ ] Job `publish-npm` en release.yml que ejecuta `npm publish`
- [ ] Usa `NPM_TOKEN` de GitHub Secrets para autenticación
- [ ] Corre solo si los tests y builds pasaron
- [ ] Publica la misma versión del tag (e.g., tag v1.0.0 → publish v1.0.0 a npm)

**Verification:**
- [ ] Crear tag `v1.0.0-test` → npm recibe el paquete (probar en dry-run)
- [ ] No publica si los tests fallan

**Dependencies:** F55-T3 ✅
**Files touched:** `.github/workflows/release.yml`
**Scope:** M

---

## Phase 3: Documentación

### F55-T5: Actualizar README y documentación

**Descripción:** Actualizar README.md y docs/WORKFLOW.md para reflejar `bunx @fisherk2/codice` como método oficial de instalación, y el binario como alternativa offline.

**Criterios de aceptación:**
- [ ] README: primera opción de instalación es `bunx @fisherk2/codice`
- [ ] README: binario compilado como "Offline / air-gapped alternative"
- [ ] WORKFLOW.md: F5.5 como fase activa con tasks y estado 🟡
- [ ] tasks/plan.md y tasks/todo.md actualizados con F5.5

**Verification:**
- [ ] `just check` pasa (0 errors)
- [ ] Las instrucciones son claras y priorizan bunx

**Dependencies:** F55-T1 ✅ → F55-T4 ✅ (depende de publicación exitosa)
**Files touched:** `README.md`, `docs/WORKFLOW.md`, `tasks/plan.md`, `tasks/todo.md`
**Scope:** S

---

## Gate F5.5: F5.5 Review Checklist

- [ ] `bunx @fisherk2/codice` es la instalación oficial
- [ ] Binario compilado disponible como alternativa offline
- [ ] Publicación automática en CI (tag v*)
- [ ] `bun test`: sin regresión (284 pass, 0 fail)
- [ ] `just check`: 0 errores

---

## Dependency Graph

```
F55-T1: package.json (bin + deps)    ← base
F55-T2: TemplateResolver source mode ← depende de T1
F55-T3: Publicar primera versión      ← depende de T1, T2
F55-T4: Automatizar CI               ← depende de T3
F55-T5: Documentación                ← depende de T1 → T4 (publicación exitosa)
```

---

## Phase Summary

| Task | Description | Estimated |
|------|-------------|-----------|
| F55-T1 | package.json — bin entry + dependencies | 30 min |
| F55-T2 | TemplateResolver — source mode detection | 1 hr |
| F55-T3 | Publicar primera versión a npm (guiada) | 30 min + cuenta npm |
| F55-T4 | Automatizar npm publish en CI | 1 hr |
| F55-T5 | Actualizar documentación (README, etc.) | 30 min |
| **Total F5.5** | **5 tasks** | **~3.5 hrs** |

---

*Última actualización: 2026-06-16*
