# TODO: Fase FEV-1 — Resolución de Issues Críticos (v1.0.5)

**Estado:** 🟡 En curso — 0/5 tareas ejecutadas
**Fecha:** 2026-06-17
**Dependencias:** F0-F6 ✅ → **FEV-1 ⬅️ En curso**

---

## Tareas Pendientes

### Prioridad Alta (Críticos)

#### FEV1-T1: TemplateResolver — Añadir soporte para `bunx` (Issue #6)
**Descripción:** Modificar `TemplateResolver.detectTemplateRoot()` para detectar automáticamente el modo `bunx` (source mode) y resolver la ruta del template desde `node_modules/@fisherk2-dev/codice/template/`.

**Estado:** `pending`
**Prioridad:** `high`
**Archivos:**
- `src/infrastructure/adapters/TemplateResolver.ts`
- `tests/integration/TemplateResolver.test.ts` (nuevos tests)

---

#### FEV1-T2: UpdateWorkspaceUseCase — Corregir transformación de reglas (Issue #2)
**Descripción:** Modificar `buildUpdateRules()` para que **no convierta** reglas `standard` a `mandatory`, preservando la verificación `destinationExists()`.

**Estado:** `pending`
**Prioridad:** `high`
**Archivos:**
- `src/application/use-cases/UpdateWorkspaceUseCase.ts`
- `tests/unit/UpdateWorkspaceUseCase.test.ts` (nuevos tests)

---

### Prioridad Media (Seguridad/Calidad)

#### FEV1-T3: Actualizar permisos en `opencode.json` (Issue #3)
**Descripción:** Extender la lista `permissions.read.deny` para bloquear archivos de credenciales (`.npmrc`, `.pem`, `*.key`, etc.).

**Estado:** `pending`
**Prioridad:** `medium`
**Archivos:**
- `template/obligatorio/opencode.json`

---

#### FEV1-T4: Corregir enlaces rotos en documentación (Issue #4)
**Descripción:** Actualizar rutas relativas en `README.md`, `CONTRIBUTING.md`, y `AGENTS.md` para reflejar la nueva estructura de directorios (`obligatorio/`, `estandar/`, `opcional/`).

**Estado:** `pending`
**Prioridad:** `medium`
**Archivos:**
- `template/estandar/README.md`
- `template/estandar/CONTRIBUTING.md`
- `template/obligatorio/AGENTS.md`

---

### Prioridad Baja (Documentación)

#### FEV1-T5: Añadir TECH_DEBT.md a la plantilla (Issue #5)
**Descripción:** Crear `template/estandar/TECH_DEBT.md` como placeholder que referencia al documento canónico en el repositorio.

**Estado:** `pending`
**Prioridad:** `low`
**Archivos:**
- `template/estandar/TECH_DEBT.md` (nuevo)

---

## Checkpoints

### Checkpoint 1: After FEV1-T1 + FEV1-T2 (Issues Críticos)
- [ ] `bunx @fisherk2-dev/codice` funciona en todos los modos.
- [ ] `UpdateWorkspaceUseCase` no sobrescribe archivos `estandar/`.
- [ ] `bun test`: 360 pass, 0 fail (sin regresión).
- [ ] E2E: 6/6 escenarios pasando.

### Checkpoint 2: After FEV1-T3 + FEV1-T4 (Seguridad y Calidad)
- [ ] Agente IA no puede leer archivos de credenciales.
- [ ] Todos los enlaces en documentación funcionan.
- [ ] `just check`: 0 errores.

### Gate FEV-1: F5.5 Review Checklist (Final)
- [ ] Todos los issues de FEV-1 resueltos (#6, #2, #3, #4, #5).
- [ ] `bun test`: 360 pass, 0 fail.
- [ ] `just check`: 0 errores.
- [ ] E2E: 6/6 escenarios pasando.
- [ ] ADR-007 documentado en `specs/adr/`.
- [ ] CHANGELOG.md actualizado con sección `[Unreleased]`.

---

*Última actualización: 2026-06-17*