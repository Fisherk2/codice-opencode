# TODO: Fase FEV-4 — SDD Command Refactor + Governance (v1.0.13)

**Estado:** 🟡 Pendiente — 0/11 tareas ejecutadas
**Fecha:** 2026-06-27
**Dependencias:** F0-F6 ✅ → FEV-1 ✅ → FEV-2 ✅ → FEV-2-B ✅ → FEV-2-C ✅ → FEV-2-D ✅ → FEV-3 ✅ → **FEV-4 🟡 En curso**
**Branch:** `feat/fev-4-issue-15` (creado desde develop, con commit de docs `d15c538`)
**Issue principal:** #15 — Gobernanza y determinismo en los comandos del workspace

---

## Contexto Rápido

**Issue #15** identifica problemas de gobernanza y determinismo:
- `evolve/` ejecuta tareas fuera de su scope (escribe en `tasks/`, implementa código)
- No existe comando dedicado para sincronizar documentación
- No existe comando para analizar issues y documentar diagnósticos
- Quetzalcoatl escribe en `tasks/` (exclusivo de Moctezuma)
- Los comandos no sugieren el siguiente paso

**Solución propuesta (Issue #15):**
1. Crear comando `docs-update/` para sincronizar documentación
2. Crear comando `diagnosis/` para analizar issues y documentar diagnósticos
3. Refactorizar `evolve/` con scope reducido (solo specs para proyectos maduros)
4. Restringir gobernanza: Quetzalcoatl solo docs, Moctezuma solo `tasks/`
5. Añadir determinismo: comandos sugieren siguiente paso

**Versión:** v1.0.13 (minor feature sobre v1.0.12)

---

## Tareas Pendientes

### ⏳ FEV4-T1: Refactor comando `evolve/` con scope reducido
**Descripción:** Refactorizar `template/obligatorio/commands/evolve.md` para que solo se enfoque en crear nuevas specs para proyectos maduros. **Eliminar Routes A y B** (responsabilidades transferidas a `docs-update/` y `diagnosis/`). Si el usuario invoca `evolve/` para esas tareas, el agente debe sugerir los comandos apropiados. Añadir pre-flight que detecte madurez del proyecto.

**Criterios de Aceptación:**
- [ ] `evolve.md` solo crea specs (no escribe en `tasks/`)
- [ ] **Routes A y B eliminadas completamente**
- [ ] Si el usuario quiere actualizar docs, el agente sugiere ejecutar `docs-update/`
- [ ] Si el usuario quiere resolver issues, el agente sugiere ejecutar `diagnosis/`
- [ ] Pre-flight detecta madurez del proyecto
- [ ] Si NO es maduro, sugiere usar `spec/`
- [ ] Restricciones explícitas (no implementar código, no escribir en `tasks/`)

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

**Dependencias:** Ninguna.
**Archivos:**
- `template/obligatorio/commands/evolve.md` (modificar)

**Scope:** M (45min).

---

### ⏳ FEV4-T2: Crear comando `docs-update/`
**Descripción:** Crear `template/obligatorio/commands/docs-update.md` que actualice, migre y sincronice documentación. **Agente: Quetzalcoatl.**

**Criterios de Aceptación:**
- [ ] Archivo creado con frontmatter YAML (`agent: quetzalcoatl`)
- [ ] Pre-flight analiza docs existentes
- [ ] Question-tool para resolver contradicciones
- [ ] Restricciones: NO `tasks/`, NO código
- [ ] Sugerencia: "Ejecuta `/plan` si hay cambios"

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

**Dependencias:** Ninguna.
**Archivos:**
- `template/obligatorio/commands/docs-update.md` (nuevo)

**Scope:** M (45min).

---

### ⏳ FEV4-T3: Crear comando `diagnosis/`
**Descripción:** Crear `template/obligatorio/commands/diagnosis.md` que analice issues y documente diagnósticos en `docs/diagnosis/`. **Agente: Quetzalcoatl.**

**Criterios de Aceptación:**
- [ ] Archivo creado con frontmatter YAML (`agent: quetzalcoatl`)
- [ ] Pre-flight identifica issue objetivo
- [ ] Permite ejecutar comandos de análisis
- [ ] Crea archivos en `docs/diagnosis/`
- [ ] Restricciones: NO implementar fixes, NO `tasks/`
- [ ] Sugerencia: "Ejecuta `/plan` para implementar"

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

**Dependencias:** Ninguna.
**Archivos:**
- `template/obligatorio/commands/diagnosis.md` (nuevo)

**Scope:** M (45min).

---

### ⏳ FEV4-T4: Crear `docs/diagnosis/` con README y template
**Descripción:** Crear el directorio `template/estandar/docs/diagnosis/` con README y template.

**Criterios de Aceptación:**
- [ ] Directorio `template/estandar/docs/diagnosis/` creado
- [ ] `README.md` con propósito explicado
- [ ] `diagnosis-template.md` con estructura completa

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

**Dependencias:** FEV4-T3 (relacionado, pero puede hacerse en paralelo).
**Archivos:**
- `template/estandar/docs/diagnosis/README.md` (nuevo)
- `template/estandar/docs/diagnosis/diagnosis-template.md` (nuevo)

**Scope:** S (30min).

---

### ⏳ FEV4-T5: Actualizar permisos de `quetzalcoatl.md`
**Descripción:** Restringir Quetzalcoatl a solo escribir documentación. NO `tasks/`, NO código, NO config.

**Criterios de Aceptación:**
- [ ] Permisos: solo docs
- [ ] Prohibido: `tasks/`, `src/`, configs
- [ ] Sugerencia: invocar Moctezuma para planes

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

**Dependencias:** Ninguna.
**Archivos:**
- `template/obligatorio/agents/quetzalcoatl.md` (modificar)

**Scope:** S (20min).

---

### ⏳ FEV4-T6: Actualizar permisos de `moctezuma.md`
**Descripción:** Restringir Moctezuma a SOLO escribir en `tasks/`. NO docs, NO código, NO config.

**Criterios de Aceptación:**
- [ ] Permisos: solo `tasks/`
- [ ] Prohibido: docs, código, config
- [ ] Advertencia clara al usuario

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

**Dependencias:** Ninguna.
**Archivos:**
- `template/obligatorio/agents/moctezuma.md` (modificar)

**Scope:** S (20min).

---

### ⏳ FEV4-T7: Añadir determinismo a comandos SDD
**Descripción:** Cada comando SDD termina con sugerencia del siguiente paso. Eliminar sugerencias de comandos en agentes.

**Criterios de Aceptación:**
- [ ] Cada comando SDD tiene "Siguiente paso: ejecuta [comando]"
- [ ] Agentes sin sugerencias de comandos específicos
- [ ] Agentes sugieren invocar otros agentes primarios

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

**Dependencias:** FEV4-T1, T2, T3.
**Archivos:**
- `template/obligatorio/commands/{spec,plan,build,test,review,ship,design,code-simplify,webperf}.md` (modificar)
- `template/obligatorio/agents/{quetzalcoatl,moctezuma,tlaloc}.md` (modificar)

**Scope:** L (1.5h).

---

### ⏳ FEV4-T8: Actualizar documentación de comandos
**Descripción:** Actualizar `docs/opencode/04-commands.md` y `docs/opencode/USER_GUIDE.md`.

**Criterios de Aceptación:**
- [ ] `04-commands.md` lista los 12 comandos
- [ ] `USER_GUIDE.md` incluye nuevos comandos
- [ ] Documenta el refactor de `evolve/`
- [ ] Actualiza el flujo determinista

**Verificación:**
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

**Dependencias:** FEV4-T1, T2, T3, T7.
**Archivos:**
- `docs/opencode/04-commands.md` (modificar)
- `docs/opencode/USER_GUIDE.md` (modificar)

**Scope:** M (45min).

---

### ⏳ FEV4-T9: Verificar suite completa sin regresión
**Descripción:** Ejecutar toda la suite de tests.

**Criterios de Aceptación:**
- [ ] `bun test` — ≥481 pass, 0 fail
- [ ] `just check` — 0 errores
- [ ] E2E: 15/15 pasando
- [ ] Coverage: ≥97.66% funciones / ≥96.52% líneas

**Verificación:**
- [ ] `bun test --coverage` — sin pérdida
- [ ] `just check` — clean
- [ ] `just test-e2e` — 15/15

**Dependencias:** T1, T2, T3, T4, T5, T6, T7, T8.
**Archivos:** (ninguno).

**Scope:** XS (10min).

---

### ⏳ FEV4-T10: Bump version a 1.0.13 y actualizar CHANGELOG
**Descripción:** Actualizar `package.json` y CHANGELOG.

**Criterios de Aceptación:**
- [ ] `package.json` → `"version": "1.0.13"`
- [ ] CHANGELOG.md sección `[1.0.13]` con Added/Changed/Fixed

**Verificación:**
- [ ] `grep "1.0.13" package.json` → match
- [ ] CHANGELOG tiene sección `[1.0.13]`

**Dependencias:** T9.
**Archivos:**
- `package.json`
- `CHANGELOG.md`

**Scope:** S (15min).

---

### ⏳ FEV4-T11: Commit + PR + Tag + Release
**Descripción:** Commit, PR a develop, CI, merge, PR a main, CI, merge, tag, release.

**Criterios de Aceptación:**
- [ ] Commit: `feat(sdd): v1.0.13 — command refactor + governance + determinism`
- [ ] PR feat/fev-4-issue-15 → develop → CI pasa → squash merge
- [ ] PR develop → main → CI pasa → squash merge
- [ ] Tag `v1.0.13` creado y pusheado
- [ ] `npm view @fisherk2-dev/codice version` → `1.0.13`
- [ ] GitHub Release con assets
- [ ] Branch local eliminado
- [ ] `develop` sincronizado con `main`

**Verificación:**
- [ ] GitHub Release publicado
- [ ] npm `latest` → 1.0.13
- [ ] CI pasa en 3 plataformas

**Dependencias:** T10.
**Archivos:** (ninguno — solo git operations).

**Scope:** S (20min).

---

## Checkpoints

### Checkpoint 1: After T1, T2, T3, T4 (Commands creados/refactorizados)
- [ ] `evolve.md` refactorizado con scope reducido
- [ ] `docs-update.md` creado
- [ ] `diagnosis.md` creado
- [ ] `docs/diagnosis/` con README y template
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

### Checkpoint 2: After T5, T6 (Gobernanza aplicada)
- [ ] `quetzalcoatl.md` con permisos restrictivos
- [ ] `moctezuma.md` con permisos restrictivos
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

### Checkpoint 3: After T7, T8 (Determinismo + docs actualizados)
- [ ] Todos los comandos SDD sugieren siguiente paso
- [ ] Agentes sin sugerencias de comandos
- [ ] `docs/opencode/04-commands.md` y `USER_GUIDE.md` actualizados
- [ ] `bun test` — todos pasan
- [ ] `just check` — 0 errores

### Checkpoint 4: After T9 (Verificación integral)
- [ ] `bun test`: ≥481 pass, 0 fail
- [ ] Coverage sin pérdida
- [ ] E2E: 15/15 pasando

### Gate FEV-4: After T10, T11 (Release publicado)
- [ ] `npm view` → `1.0.13`
- [ ] GitHub Release con assets
- [ ] CHANGELOG actualizado
- [ ] `main` y `develop` sincronizados

---

## Resumen Rápido

| Tarea | Scope | Esfuerzo |
|-------|-------|----------|
| FEV4-T1: Refactor `evolve/` | M | 45min |
| FEV4-T2: Crear `docs-update/` | M | 45min |
| FEV4-T3: Crear `diagnosis/` | M | 45min |
| FEV4-T4: Crear `docs/diagnosis/` template | S | 30min |
| FEV4-T5: Permisos `quetzalcoatl.md` | S | 20min |
| FEV4-T6: Permisos `moctezuma.md` | S | 20min |
| FEV4-T7: Determinismo en comandos SDD | L | 1.5h |
| FEV4-T8: Actualizar docs/opencode/ | M | 45min |
| FEV4-T9: Verificar suite completa | XS | 10min |
| FEV4-T10: Bump version + CHANGELOG | S | 15min |
| FEV4-T11: Commit + PR + Tag + Release | S | 20min |
| **Total** | | **~7h** |

---

*Última actualización: 2026-06-27*
