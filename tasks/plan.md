# Plan: F6 — Documentación

**Fecha:** 2026-06-15 | **Autor:** Moctezuma (Planner Agent) | **Estado:** 🟡 En Revisión

## Overview

Completar la documentación pendiente para el release v1.0.0 de Códice. Los archivos existentes (README.md, CHANGELOG.md, CONTRIBUTING.md, docs/ARCHITECTURE.md) serán auditados y completados. No se elimina contenido existente del README (workspace template de OpenCode establecido).

---

## Arquitectura de Decisiones

| # | Decisión | Rationale |
|---|----------|-----------|
| F6-A1 | README unificado | El usuario confirmó mantener el contenido existente del workspace template de OpenCode y añadir sección para Códice CLI |
| F6-A2 | Badge CI usa repo `Fisherk2/codice-opencode` | Confirmado por el usuario |
| F6-A3 | CHANGELOG sigue Keep a Changelog | Se añade sección `Security` faltante a v1.0.0 |
| F6-A4 | CONTRIBUTING.md sigue Conventional Commits | Formato de commits: feat, fix, docs, refactor, test, chore |

---

## Estado Actual (Audit)

| Artefacto | Estado | Gap |
|-----------|--------|-----|
| README.md | ⚠️ Describe workspace template OpenCode | No menciona Códice CLI, no tiene install commands, usage 3 modos, troubleshooting, ni badge CI |
| CHANGELOG.md | ✅ v1.0.0 completo | Le falta sección `Security` (requerido por Keep a Changelog) |
| docs/ARCHITECTURE.md | ✅ ADRs + diagrama + patrones | Ya está completo — verificar coverage |
| CONTRIBUTING.md | ❌ Vacío | Necesita contenido completo |
| ADRs | ✅ 5/5 completos | ADR-001 a ADR-005 |

---

## Dependency Graph

```
F6-T1: README.md         — independiente (añadir sección Códice CLI)
F6-T2: CHANGELOG.md      — independiente (añadir Security)
F6-T3: ARCHITECTURE.md   — independiente (verificar ADRs)
F6-T4: CONTRIBUTING.md   — independiente (crear desde cero)
```
**Todas las tareas son independientes — se pueden ejecutar en paralelo.**

---

## Task List

### Phase 1: Slice 1 — Usuario Final (README + CHANGELOG)

#### Task F6-T1: README.md — Añadir sección Códice CLI

**Descripción:** El README actual describe el workspace template de OpenCode (45 skills, 6 agentes). Se añade una nueva sección al final del README que documenta Códice como CLI installer. No se modifica el contenido existente del workspace.

**Criterios de aceptación:**
- [ ] Badge CI/CD de GitHub Actions visible cerca del inicio del README
  - URL: `https://github.com/Fisherk2/codice-opencode/workflows/CI/badge.svg`
- [ ] Tabla de contenidos existente actualizada con enlace a nueva sección Códice CLI
- [ ] Nueva sección `## Códice CLI — Instalador del Workspace` con subsecciones:
  - [ ] Quick Install (copy-paste commands para Linux/macOS/Windows)
  - [ ] Usage: los 3 modos con ejemplos de comando
  - [ ] Troubleshooting: errores comunes y soluciones
  - [ ] Flags disponibles: `--clean`, `--project`, `--update`, `--dest`, `--force`, `--verbose`
- [ ] Contenido existente del workspace template **no se modifica**

**Verification:**
- [ ] `just check` pasa (0 errors de biome + tsc)
- [ ] README renderizado en GitHub muestra badge y nueva sección
- [ ] Instrucciones copy-paste funcionan sin modificación en cada OS

**Dependencies:** Ninguna
**Files touched:** `README.md`
**Estimated scope:** M

---

#### Task F6-T2: CHANGELOG.md — Completar sección Security

**Descripción:** El CHANGELOG actual tiene v1.0.0 con secciones Added, Architecture, Technical. Keep a Changelog requiere también `Security`. Se añade la sección Security a v1.0.0.

**Criterios de aceptación:**
- [ ] Sección `### Security` presente en v1.0.0
- [ ] Si no hay fixed security issues, texto: "No security vulnerabilities identified in this release."
- [ ] Formato consistente con las demás secciones (indentación, empty lines)

**Verification:**
- [ ] CHANGELOG.md pasa validación manual de formato Keep a Changelog
- [ ] `just check` pasa (0 errors)

**Dependencies:** Ninguna
**Files touched:** `CHANGELOG.md`
**Estimated scope:** XS

---

### Phase 2: Slice 2 — Contribuidor

#### Task F6-T3: CONTRIBUTING.md — Crear guía completa

**Descripción:** CONTRIBUTING.md está vacío. Crear contenido completo para guiar contribuidores.

**Criterios de aceptación:**
- [ ] Sección **How to Contribute**: fork & branch workflow, PR process, code review expectations
- [ ] Sección **Development Setup**: `just setup`, `just dev`, `just check`, testing locally
- [ ] Sección **Testing**: `just test`, `just test:unit`, `just test:integration`, `just test:e2e`, `just test:coverage`
- [ ] Sección **Building**: `just build`, `just build-all`
- [ ] Sección **Commit Message Convention**: tipos (feat, fix, docs, refactor, test, chore), formato, ejemplo
- [ ] Sección **Pre-commit Checklist**: referencia a `just check` y `just test`

**Verification:**
- [ ] CONTRIBUTING.md no está vacío
- [ ] `just check` pasa (0 errors)
- [ ] Un contribuidor nuevo puede hacer setup siguiendo el documento

**Dependencies:** Ninguna
**Files touched:** `CONTRIBUTING.md`
**Estimated scope:** M

---

### Phase 3: Slice 3 — Arquitectura

#### Task F6-T4: docs/ARCHITECTURE.md — Verificar ADRs y decisiones

**Descripción:** Verificar que ARCHITECTURE.md y los 5 ADRs existentes cubren todas las decisiones arquitectónicas clave del proyecto. Comparar contra SPEC.md resolved decisions (decisions 1-7) y docs/WORKFLOW.md.

**Criterios de aceptación:**
- [ ] ADR-001 a ADR-005 listados en ARCHITECTURE.md con estado "Accepted"
- [ ] Decisiones 1-7 de SPEC.md cubiertas: Template Packaging, Optional File Grouping, GitHub Auth, Windows Path, Local Version Storage, Rollback, Update Notification
- [ ] No hay decisión documentada en SPEC.md que no esté en ARCHITECTURE.md o ADRs
- [ ] Layer diagram en ARCHITECTURE.md refleja la estructura actual del código

**Verification:**
- [ ] Lectura cruzada SPEC.md resolved decisions vs ADRs existentes
- [ ] `just check` pasa (0 errors)

**Dependencies:** Ninguna
**Files touched:** `docs/ARCHITECTURE.md`, `specs/adr/*.md` (lectura)
**Estimated scope:** S

---

## Checkpoints

### After F6-T1 + F6-T2 (Slice 1 — Usuario Final)
- [ ] README tiene sección Códice CLI con install commands, ejemplos 3 modos, troubleshooting, badge CI
- [ ] CHANGELOG tiene sección Security en v1.0.0
- [ ] `just check` pasa

### After F6-T4 (Slice 2 — Contribuidor)
- [ ] CONTRIBUTING.md tiene guía completa de setup, testing, PR workflow

### After F6-T3 (Slice 3 — Arquitectura)
- [ ] ARCHITECTURE.md y ADRs cubriendo todas las decisiones de SPEC.md

### Gate F6: F6 Review Checklist
- [ ] README aprobado por peer review (instrucciones copy-paste funcionan)
- [ ] CHANGELOG.md sigue formato Keep a Changelog con Security
- [ ] CI/CD badge visible en README
- [ ] `bun test`: sin regresión (284 pass, 0 fail)
- [ ] `just check`: 0 errores
- [ ] E2E: 6/6 pasando

---

## Risks y Mitigaciones

| Risk | Impact | Mitigation |
|------|--------|------------|
| README demasiado largo con contenido dual (workspace + CLI) | Low | Mantener estructura clara con headings jerárquicos, no mezclar contenidos |
| CHANGELOG Security vacía parece extraño | Low | Incluir mensaje explicativo "No security vulnerabilities identified" |
| CONTRIBUTING.md muy genérico | Medium | Seguir formatos establecidos (Conventional Commits, Keep a Changelog) |
| ADRs no cubren alguna decisión | Low | Identificar gaps en F6-T3 antes de escribir |

---

## Vertical Slices

| Slice | Tasks | Description |
|-------|-------|-------------|
| **Slice 1** | F6-T1 → T2 | Usuario final: README con Códice CLI + CHANGELOG completo |
| **Slice 2** | F6-T4 | Contribuidor: CONTRIBUTING.md completo |
| **Slice 3** | F6-T3 | Arquitectura: verificar ARCHITECTURE.md y ADRs |

---

## Phase Summary

| Task | Description | Estimated |
|------|-------------|-----------|
| F6-T1 | README.md — añadir sección Códice CLI (install, 3 modos, troubleshooting, CI badge) | 2 hrs |
| F6-T2 | CHANGELOG.md — añadir sección Security faltante | 15 min |
| F6-T3 | docs/ARCHITECTURE.md — verificar ADRs coverage | 30 min |
| F6-T4 | CONTRIBUTING.md — crear guía completa (setup, testing, PRs) | 1.5 hrs |
| **Total F6** | **4 tasks** | **~4.5 hrs** |

---

*Last updated: 2026-06-15*
