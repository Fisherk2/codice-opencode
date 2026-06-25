# TODO: Fase FEV-1 — Resolución de Issues Críticos (v1.0.5)

**Estado:** ✅ Completado — 5/5 tareas ejecutadas
**Fecha:** 2026-06-24
**Dependencias:** F0-F6 ✅ → **FEV-1 ✅ Completado**

---

## Tareas Completadas

### ✅ FEV1-T1: TemplateResolver — Añadir soporte para `bunx` (Issue #6)
**Descripción:** Modificar `TemplateResolver.detectTemplateRoot()` para detectar automáticamente el modo `bunx` (source mode) y resolver la ruta del template desde `node_modules/@fisherk2-dev/codice/template/`.

**Estado:** `completed`
**Commit:** `9c6728a`
**Archivos modificados:**
- `src/infrastructure/adapters/TemplateResolver.ts` — añadida ruta bunx (`../template/`) como primera detección
- `tests/integration/TemplateResolver.test.ts` — 4 tests (bunx resolution, bunx content, source compat, compiled compat)
- `tests/e2e/04-update-workspace.sh` — actualizado a nuevo comportamiento

**Verificación:**
- [x] Tercera ruta `import.meta.dir + '../template/'` añadida
- [x] Modos source dev y compilado preservados
- [x] CWD fallback para compatibilidad retroactiva
- [x] 4 tests unitarios/configuración

---

### ✅ FEV1-T2: UpdateWorkspaceUseCase — Corregir transformación de reglas (Issue #2)
**Descripción:** Modificar `buildUpdateRules()` para que **no convierta** reglas `standard` a `mandatory`, preservando la verificación `destinationExists()`.

**Estado:** `completed`
**Commit:** `073b5dd`
**Archivos modificados:**
- `src/application/use-cases/UpdateWorkspaceUseCase.ts` — `map()` mantiene categorías originales
- `tests/unit/UpdateWorkspaceUseCase.test.ts` — 4 tests de regresión

**Verificación:**
- [x] Solo `obligatorio` se tratan como `mandatory`
- [x] `standard` mantienen tipo original
- [x] `opcional` se excluyen del update
- [x] E2E test actualizado para verificar preservación de estandar

---

### ✅ FEV1-T3: Actualizar permisos en `opencode.json` (Issue #3)
**Descripción:** Extender la lista `permissions.read.deny` para bloquear archivos de credenciales (`.npmrc`, `.pem`, `*.key`, etc.).

**Estado:** `completed`
**Commit:** `d22c609`
**Archivos modificados:**
- `template/obligatorio/opencode.json` — añadidos patrones de credenciales

**Verificación:**
- [x] Patrones: `.env*`, `.npmrc`, `.pem`, `*.key`, `*.p12`, `*.pfx`, `credentials.json`, `service-account*.json`

---

### ✅ FEV1-T4: Corregir enlaces rotos en documentación (Issue #4)
**Descripción:** Actualizar rutas relativas en `README.md`, `CONTRIBUTING.md` para reflejar la nueva estructura de directorios (`obligatorio/`, `estandar/`, `opcional/`).

**Estado:** `completed`
**Commit:** `5800568`
**Archivos modificados:**
- `README.md` — 6 enlaces de agentes + 1 enlace de catálogo corregidos
- `CONTRIBUTING.md` — 4 rutas de template corregidas

**Verificación:**
- [x] Enlaces de agentes apuntan a `template/obligatorio/agents/`
- [x] Catálogo apunta a `template/opcional/docs/opencode/03-agent-index.md`

---

### ✅ FEV1-T5: Añadir TECH_DEBT.md a la plantilla (Issue #5)
**Descripción:** Crear `template/estandar/docs/TECH_DEBT.md` como placeholder siguiendo misma convención que WORKFLOW.md y TRD.md.

**Estado:** `completed`
**Commit:** `3292f5c`
**Archivos nuevos:**
- `template/estandar/docs/TECH_DEBT.md` — 8 secciones estructuradas

**Verificación:**
- [x] Formato consistente con WORKFLOW.md y TRD.md
- [x] Incluye secciones: coverage, arquitectura, dependencias, tests, proceso, histórico, plan

---

## Checkpoints

### Checkpoint 1: After FEV1-T1 + FEV1-T2 (Issues Críticos)
- [x] `bunx @fisherk2-dev/codice` funciona en todos los modos (fuente, bunx, compilado).
- [x] `UpdateWorkspaceUseCase` no sobrescribe archivos `estandar/`.
- [x] `bun test`: 368 pass, 0 fail (sin regresión).
- [x] E2E: 6/6 escenarios pasando.

### Checkpoint 2: After FEV1-T3 + FEV1-T4 (Seguridad y Calidad)
- [x] Agente IA no puede leer archivos de credenciales (extendido `permissions.read.deny`).
- [x] Enlaces en documentación apuntan a rutas correctas.
- [x] `just check`: Biome 0 errores (solo errores preexistentes de fixtures).

### Gate FEV-1: F5.5 Review Checklist (Final)
- [x] Todos los issues de FEV-1 resueltos (#6, #2, #3, #4, #5).
- [x] `bun test`: 368 pass, 0 fail.
- [x] `just check`: 0 errores (Biome), solo errores preexistentes en fixtures.
- [x] E2E: 6/6 escenarios pasando.
- [ ] ADR-007 documentado en `specs/adr/`.
- [ ] CHANGELOG.md actualizado con sección `[Unreleased]`.

---

*Última actualización: 2026-06-24*