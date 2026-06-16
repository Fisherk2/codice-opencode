# Plan: F5.5 — Publicación npm + bunx support

**Fecha:** 2026-06-16 | **Autor:** Moctezuma (Planner Agent) | **Estado:** 🟡 En curso

## Overview

Publicar Códice como paquete npm (`@fisherk2/codice`) para que los usuarios puedan instalar el workspace de OpenCode con un solo comando:

```bash
bunx @fisherk2/codice
```

El binario compilado (vía `bun build --compile`) se mantiene como método alternativo offline/air-gapped. El objetivo es que `bunx` sea la experiencia de instalación por defecto.

**Estado de Fase:** 🟡 En curso — 0/5 tareas ejecutadas

---

## Arquitectura de Decisiones

| # | Decisión | Rationale |
|---|----------|-----------|
| F55-A1 | `@fisherk2/codice` como nombre npm | Scoped, dueño claro, consistente con awesome-opencode (usa @weisser-dev) |
| F55-A2 | `bunx` como método oficial, binario como opcional offline | Experiencia más simple, sin descargar binarios. Binario para air-gapped/CI sin Bun |
| F55-A3 | Template se resuelve desde filesystem en source mode | TemplateResolver detecta automáticamente si está en source (import.meta.dir) o compilado (execPath) |
| F55-A4 | @clack/prompts y semver pasan a dependencies | Necessarios para que bunx funcione sin instalación adicional |
| F55-A5 | Publicación automática via CI en tag v* | Tag v* → build matrix + publish a npm. Automatización completa |

---

## Estado Actual (Audit)

| Artefacto | Estado | Gap |
|-----------|--------|-----|
| package.json | ⚠️ Existe como proyecto Bun | No tiene `bin` entry, no está configurado para npm publish |
| TemplateResolver | ✅ Carga templates en compiled mode | No soporta source mode (import.meta.dir) |
| Template files | ✅ En `template/` | Listos para ser incluidos en npm package |
| release.yml | ✅ Builds + GitHub Release | No publica a npm |
| README.md | ✅ Binario como instalación oficial | No menciona bunx como método primario |

---

## Task List

### Phase 1: Preparación del paquete npm

#### Task F55-T1: package.json — Añadir bin entry y mover dependencies

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
**Estimated scope:** S

---

#### Task F55-T2: TemplateResolver — Soportar source mode

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
**Estimated scope:** M

---

### Phase 2: Publicación

#### Task F55-T3: Publicar primera versión a npm (manual)

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
**Estimated scope:** L (por ser primera vez del usuario)

---

#### Task F55-T4: Automatizar publicación npm en release.yml

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
**Estimated scope:** M

---

### Phase 3: Documentación

#### Task F55-T5: Actualizar README y documentación

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
**Estimated scope:** S

---

## Checkpoints

### After F55-T1 + F55-T2 (Phase 1 — Preparación del paquete)
- [ ] package.json configurado con bin entry
- [ ] TemplateResolver funciona en source mode
- [ ] `bunx .` (local) funciona
- [ ] `bun test` pasa sin regresión

### After F55-T3 (Primera publicación)
- [ ] `@fisherk2/codice` publicado en npm
- [ ] `bunx @fisherk2/codice` funciona

### After F55-T4 (Automatización CI)
- [ ] release.yml publica a npm automáticamente en tag v*
- [ ] `NPM_TOKEN` configurado en GitHub Secrets

### Gate F5.5: F5.5 Review Checklist
- [ ] `bunx @fisherk2/codice` es la instalación oficial
- [ ] Binario compilado disponible como alternativa offline
- [ ] Publicación automática en CI (tag v*)
- [ ] `bun test`: sin regresión (284 pass, 0 fail)
- [ ] `just check`: 0 errores

---

## Risks y Mitigaciones

| Risk | Impact | Mitigation |
|------|--------|------------|
| TemplateResolver en source mode rompe el binario compilado | Medium | Probar ambos modos (bun run + binary) antes de merge |
| npm publish falla por configuración de cuenta | Medium | Hacer `npm pack --dry-run` primero, verificar contenido |
| Token npm expira o se revoca | Low | Automation tokens no expiran. Monitorear CI |
| bunx descarga versión cacheada (no la latest) | Low | Usar `bunx --fresh @fisherk2/codice` para forzar fresh |

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

*Last updated: 2026-06-16*
