# FEV-24: Nuevos Comandos v2.1 — `/sync`, `/migrate`, `/deploy`, `/analyze`

**Version Target:** v2.1.0
**Date:** 2026-08-07
**Status:** planned
**Issues:** [#68](https://github.com/Fisherk2/codice-opencode/issues/68), [#67](https://github.com/Fisherk2/codice-opencode/issues/67), [#64](https://github.com/Fisherk2/codice-opencode/issues/64), [#57](https://github.com/Fisherk2/codice-opencode/issues/57)
**Diagnoses:** `fix09-sync-command.md`, `fix10-migrate-command.md`, `fix11-deploy-command.md`, `fix12-analyze-command.md`

---

## Summary

FEV-24 agrupa la implementación de 4 nuevos comandos para el template de Códice, todos orientados a automatizar flujos de trabajo que actualmente requieren intervención manual: sincronización con resolución de conflictos, migración tecnológica, configuración de git workflow/CI/CD, y análisis arquitectónico para deudas técnicas.

## Scope

| Command | Issue | Agent | Purpose |
|---------|-------|-------|---------|
| `/sync` | #68 | tlaloc | Sincronización bidireccional con resolución inteligente de conflictos |
| `/migrate` | #67 | Quetzalcoatl | Generador de guías de migración tecnológica |
| `/deploy` | #64 | Mictlantecuhtli | Configuración y ejecución de git workflow y CI/CD |
| `/analyze` | #57 | Quetzalcoatl | Análisis arquitectónico y generación de `TECH_DEBT.md` |

## Position in SDD Flow

```
/plan → /sync (anytime) → /migrate → /evolve → /analyze → /diagnosis → ...
         ↑                          ↑                    ↑
    wildcard command        before /evolve         before /diagnosis
```

- `/sync`: Comodín, puede ejecutarse en cualquier fase del flujo SDD.
- `/migrate`: Antes de `/evolve` (la migración puede requerir nuevas specs).
- `/deploy`: Independiente del flujo SDD (configuración de infraestructura).
- `/analyze`: Antes de `/diagnosis` (los hallazgos alimentan el diagnóstico).

---

## FEV-24-A: `/sync` — Sincronización Bidireccional (~8-10h)

**Diagnosis:** `docs/diagnosis/fix09-sync-command.md`

| Task ID | Description | Target | Est. |
|---------|-------------|--------|------|
| FEV24A-T1 | Crear comando `/sync` con pre-flight check (git + remote) | `template/obligatorio/core/commands/sync.md` | 1h |
| FEV24A-T2 | Definir 4 modos de sincronización (full, incremental, dry-run, conflict-resolution) | `sync.md` | 1.5h |
| FEV24A-T3 | Definir 4 estrategias de resolución (NEWER_WINS, GITHUB_WINS, LOCAL_WINS, INTELLIGENT_MERGE) | `sync.md` | 1.5h |
| FEV24A-T4 | Diseñar gestión de estado de sync en `docs/` | `sync.md` + template file | 1h |
| FEV24A-T5 | Implementar seguridad transaccional (atomic ops + rollback) | `sync.md` | 1h |
| FEV24A-T6 | Definir reporte post-sync (conflictos, estrategia, métricas) | `sync.md` | 1h |
| FEV24A-T7 | Identificar skills y subagentes apropiados para el flujo | `sync.md` | 1h |

**DoD FEV-24-A:**
- [ ] Comando `/sync` creado con todos los modos y estrategias
- [ ] Pre-flight check funcional (detecta git + remote)
- [ ] Reporte post-sync definido con todas las métricas
- [ ] Skills y subagentes identificados y documentados

---

## FEV-24-B: `/migrate` — Generador de Guías de Migración (~6-8h)

**Diagnosis:** `docs/diagnosis/fix10-migrate-command.md`

| Task ID | Description | Target | Est. |
|---------|-------------|--------|------|
| FEV24B-T1 | Crear comando `/migrate` con análisis de stack actual | `template/obligatorio/core/commands/migrate.md` | 1.5h |
| FEV24B-T2 | Definir evaluación de impacto (breaking changes, APIs deprecadas) | `migrate.md` | 1h |
| FEV24B-T3 | Definir estructura del plan de migración (fases, pasos, criterios) | `migrate.md` | 1.5h |
| FEV24B-T4 | Definir actualización automática de docs (MIGRATION.md, WORKFLOW.md, specs/) | `migrate.md` | 1h |
| FEV24B-T5 | Definir estrategias de seguridad (backup, rollback, testing) | `migrate.md` | 1h |
| FEV24B-T6 | Identificar skills y subagentes apropiados para el flujo | `migrate.md` | 1h |

**DoD FEV-24-B:**
- [ ] Comando `/migrate` creado con análisis de stack y evaluación de impacto
- [ ] Estructura de plan de migración definida
- [ ] Actualización automática de documentación especificada
- [ ] Skills y subagentes identificados y documentados

---

## FEV-24-C: `/deploy` — Git Workflow y CI/CD (~8-10h)

**Diagnosis:** `docs/diagnosis/fix11-deploy-command.md`

| Task ID | Description | Target | Est. |
|---------|-------------|--------|------|
| FEV24C-T1 | Crear comando `/deploy` con pre-flight check (CONTRIBUTING.md + CI/CD) | `template/obligatorio/core/commands/deploy.md` | 1.5h |
| FEV24C-T2 | Definir análisis de proyecto (tipo, lenguaje, framework) | `deploy.md` | 1h |
| FEV24C-T3 | Definir 3 modos de operación (no hay workflow, mejorable, establecido) | `deploy.md` | 1.5h |
| FEV24C-T4 | Definir generación de configuraciones modulares (branch protection, PR templates, CI/CD) | `deploy.md` | 2h |
| FEV24C-T5 | Definir actualización de CONTRIBUTING.md con workflow configurado | `deploy.md` | 1h |
| FEV24C-T6 | Identificar skills y subagentes apropiados para el flujo | `deploy.md` | 1h |

**DoD FEV-24-C:**
- [ ] Comando `/deploy` creado con pre-flight y análisis de proyecto
- [ ] 3 modos de operación definidos
- [ ] Configuraciones modulares especificadas
- [ ] Skills y subagentes identificados y documentados

---

## FEV-24-D: `/analyze` — Análisis Arquitectónico (~6-8h)

**Diagnosis:** `docs/diagnosis/fix12-analyze-command.md`

| Task ID | Description | Target | Est. |
|---------|-------------|--------|------|
| FEV24D-T1 | Crear comando `/analyze` con dimensiones de análisis | `template/obligatorio/core/commands/analyze.md` | 1.5h |
| FEV24D-T2 | Definir 8 dimensiones de análisis (estructura, patrones, dependencias, flujo de datos, escalabilidad, seguridad, testabilidad, documentación) | `analyze.md` | 1.5h |
| FEV24D-T3 | Definir generación de `TECH_DEBT.md` con hallazgos priorizados | `analyze.md` | 1h |
| FEV24D-T4 | Definir integración con `/diagnosis` (TECH_DEBT.md como input) | `analyze.md` + `diagnosis.md` | 1h |
| FEV24D-T5 | Identificar skills y subagentes apropiados para el flujo | `analyze.md` | 1h |

**DoD FEV-24-D:**
- [ ] Comando `/analyze` creado con 8 dimensiones de análisis
- [ ] Generación de `TECH_DEBT.md` especificada
- [ ] Integración con `/diagnosis` definida
- [ ] Skills y subagentes identificados y documentados

---

## Implementation Order

1. **FEV-24-D** (`/analyze`) — Primero, porque los hallazgos pueden revelar deudas que afecten los otros comandos.
2. **FEV-24-B** (`/migrate`) — Segundo, porque la migración puede requerir cambios en el stack antes de implementar los otros comandos.
3. **FEV-24-C** (`/deploy`) — Tercero, porque la configuración de CI/CD puede ser necesaria para validar los comandos restantes.
4. **FEV-24-A** (`/sync`) — Último, porque es un comodín que puede ejecutarse en cualquier momento.

## Total Estimated Time

~28-36 horas de trabajo.

## Success Criteria

- [ ] 4 nuevos comandos creados en `template/obligatorio/core/commands/`
- [ ] Cada comando tiene pre-flight checks funcionales
- [ ] Cada comando identifica skills y subagentes apropiados
- [ ] Integración entre `/analyze` y `/diagnosis` funcional
- [ ] Documentación actualizada (Wiki → Commands)

## References

- [Issue #68](https://github.com/Fisherk2/codice-opencode/issues/68) — `/sync`
- [Issue #67](https://github.com/Fisherk2/codice-opencode/issues/67) — `/migrate`
- [Issue #64](https://github.com/Fisherk2/codice-opencode/issues/64) — `/deploy`
- [Issue #57](https://github.com/Fisherk2/codice-opencode/issues/57) — `/analyze`
- `docs/diagnosis/fix09-sync-command.md`
- `docs/diagnosis/fix10-migrate-command.md`
- `docs/diagnosis/fix11-deploy-command.md`
- `docs/diagnosis/fix12-analyze-command.md`

---

_FEV-24 created by `/diagnosis`. Use `/plan` to create execution plan for implementation._
