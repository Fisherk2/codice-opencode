# Plan: F6 — Documentación

**Fecha:** 2026-06-15 | **Autor:** Moctezuma (Planner Agent) | **Estado:** 🟢 Completo

## Overview

Completar la documentación pendiente para el release v1.0.0 de Códice. Los archivos existentes (README.md, CHANGELOG.md, CONTRIBUTING.md, docs/ARCHITECTURE.md) fueron auditados y completados. No se eliminó contenido existente del README (workspace template de OpenCode establecido).

**Estado de Fase:** ✅ Completado — 4/4 tareas ejecutadas, proyecto listo para release v1.0.0.

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
- [x] Badge CI/CD de GitHub Actions visible cerca del inicio del README
  - URL: `https://github.com/Fisherk2/codice-opencode/workflows/CI/badge.svg`
- [x] Tabla de contenidos existente actualizada con enlace a nueva sección Códice CLI
- [x] Nueva sección `## Códice CLI — Instalador del Workspace` con subsecciones:
  - [x] Quick Install (copy-paste commands para Linux/macOS/Windows)
  - [x] Usage: los 3 modos con ejemplos de comando
  - [x] Troubleshooting: errores comunes y soluciones
  - [x] Flags disponibles: `--clean`, `--project`, `--update`, `--dest`, `--force`, `--verbose`
- [x] Contenido existente del workspace template **no se modifica**

**Verification:**
- [x] `just check` pasa (0 errors de biome + tsc)
- [x] README renderizado en GitHub muestra badge y nueva sección
- [x] Instrucciones copy-paste funcionan sin modificación en cada OS

**Dependencies:** Ninguna
**Files touched:** `README.md`
**Estimated scope:** M

---

#### Task F6-T2: CHANGELOG.md — Completar sección Security

**Descripción:** El CHANGELOG actual tiene v1.0.0 con secciones Added, Architecture, Technical. Keep a Changelog requiere también `Security`. Se añade la sección Security a v1.0.0.

**Criterios de aceptación:**
- [x] Sección `### Security` presente en v1.0.0
- [x] Si no hay fixed security issues, texto: "No security vulnerabilities identified in this release."
- [x] Formato consistente con las demás secciones (indentación, empty lines)

**Verification:**
- [x] CHANGELOG.md pasa validación manual de formato Keep a Changelog
- [x] `just check` pasa (0 errors)

**Dependencies:** Ninguna
**Files touched:** `CHANGELOG.md`
**Estimated scope:** XS

---

### Phase 2: Slice 2 — Contribuidor

#### Task F6-T3: CONTRIBUTING.md — Crear guía completa

**Descripción:** CONTRIBUTING.md está vacío. Crear contenido completo para guiar contribuidores.

**Criterios de aceptación:**
- [x] Sección **How to Contribute**: fork & branch workflow, PR process, code review expectations
- [x] Sección **Development Setup**: `just setup`, `just dev`, `just check`, testing locally
- [x] Sección **Testing**: `just test`, `just test:unit`, `just test:integration`, `just test:e2e`, `just test:coverage`
- [x] Sección **Building**: `just build`, `just build-all`
- [x] Sección **Commit Message Convention**: tipos (feat, fix, docs, refactor, test, chore), formato, ejemplo
- [x] Sección **Pre-commit Checklist**: referencia a `just check` y `just test`

**Verification:**
- [x] CONTRIBUTING.md no está vacío
- [x] `just check` pasa (0 errors)
- [x] Un contribuidor nuevo puede hacer setup siguiendo el documento

**Dependencies:** Ninguna
**Files touched:** `CONTRIBUTING.md`
**Estimated scope:** M

---

### Phase 3: Slice 3 — Arquitectura

#### Task F6-T4: docs/ARCHITECTURE.md — Verificar ADRs y decisiones

**Descripción:** Verificar que ARCHITECTURE.md y los 5 ADRs existentes cubren todas las decisiones arquitectónicas clave del proyecto. Comparar contra SPEC.md resolved decisions (decisions 1-7) y docs/WORKFLOW.md.

**Criterios de aceptación:**
- [x] ADR-001 a ADR-005 listados en ARCHITECTURE.md con estado "Accepted"
- [x] Decisiones 1-7 de SPEC.md cubiertas: Template Packaging, Optional File Grouping, GitHub Auth, Windows Path, Local Version Storage, Rollback, Update Notification
- [x] No hay decisión documentada en SPEC.md que no esté en ARCHITECTURE.md o ADRs
- [x] Layer diagram en ARCHITECTURE.md refleja la estructura actual del código

**Verification:**
- [x] Lectura cruzada SPEC.md resolved decisions vs ADRs existentes
- [x] `just check` pasa (0 errors)

**Dependencies:** Ninguna
**Files touched:** `docs/ARCHITECTURE.md`, `specs/adr/*.md` (lectura)
**Estimated scope:** S

---

## Checkpoints

### After F6-T1 + F6-T2 (Slice 1 — Usuario Final)
- [x] README tiene sección Códice CLI con install commands, ejemplos 3 modos, troubleshooting, badge CI
- [x] CHANGELOG tiene sección Security en v1.0.0
- [x] `just check` pasa

### After F6-T4 (Slice 2 — Contribuidor)
- [x] CONTRIBUTING.md tiene guía completa de setup, testing, PR workflow

### After F6-T3 (Slice 3 — Arquitectura)
- [x] ARCHITECTURE.md y ADRs cubriendo todas las decisiones de SPEC.md

### Gate F6: F6 Review Checklist
- [x] README aprobado por peer review (instrucciones copy-paste funcionan)
- [x] CHANGELOG.md sigue formato Keep a Changelog con Security
- [x] CI/CD badge visible en README
- [x] `bun test`: sin regresión (284 pass, 0 fail)
- [x] `just check`: 0 errores
- [x] E2E: 6/6 pasando

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

## Release v1.0.0 — Listo para Despliegue

**Estado:** ✅ Release Ready

Todas las fases (F0–F6) han sido completadas y verificadas:

| Fase | Estado | Entregable Clave |
|------|--------|-----------------|
| F0 | ✅ Completo | Entorno, convenciones, CI/CD |
| F1 | ✅ Completo | BunFileSystem, GitHubRestClient, ClackPromptsAdapter |
| F2 | ✅ Completo | FileMergeEngine, VersionComparator, Result type |
| F3 | ✅ Completo | CLI, DI, Use Cases, tests integración |
| F4 | ✅ Completo | E2E (6 escenarios), CI integration, coverage gaps |
| F4.5 | ✅ Completo | `--dest` flag, workspace seguro, `just dev` protegido |
| F4.6 | ✅ Completo | Code Review + Refactor (TemplateResolver, AtomicStager) |
| F5 | ✅ Completo | Cross-platform builds (linux/macos/windows), release automation |
| F6 | ✅ Completo | README, CHANGELOG, CONTRIBUTING, ARCHITECTURE |

**Métricas finales v1.0.0:**
- `bun test`: 284 pass, 0 fail (593 expects)
- `just check`: 0 errores (biome ci + tsc --noEmit)
- E2E: 6/6 escenarios pasando
- Coverage: 96.23% funciones / 94.26% líneas
- Domain coverage: 100% líneas
- Binarios: Linux (x64), macOS (x64), Windows (x64)
- Release pipeline: tag `v*` → build 3 platforms → release con assets

**Próximo paso:** Crear tag `v1.0.0` y ejecutar release workflow en GitHub Actions.

---

*Last updated: 2026-06-15*
