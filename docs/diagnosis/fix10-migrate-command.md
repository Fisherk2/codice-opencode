# Diagnosis: Comando `/migrate` — Generador de Guías de Migración Tecnológica

**Issue:** [#67](https://github.com/Fisherk2/codice-opencode/issues/67) — _Añadir nuevo comando para migración_
**Date:** 2026-08-07
**Severity:** medium
**Status:** diagnosed

---

## Summary

No existe un mecanismo estructurado para guiar al usuario en la migración de tecnologías del stack (frameworks, librerías, bases de datos, arquitecturas). Las migraciones se realizan de forma ad-hoc sin plan documentado, lo que genera riesgos de romper dependencias, perder funcionalidad, o dejar documentación desactualizada. Se necesita un comando `/migrate` que genere un plan de migración completo y actualice la documentación del proyecto.

## Symptoms

- No hay comando dedicado para planificar y ejecutar migraciones tecnológicas.
- Las migraciones se hacen manualmente sin documentación de impacto o rollback.
- `docs/MIGRATION.md` existe pero se actualiza manualmente sin análisis automatizado del stack.
- No hay análisis automatizado de breaking changes entre versiones de dependencias.

## Root Cause

El template actual provee documentación de migración (`MIGRATION.md`) pero no tiene un comando que automatice el análisis del stack actual, evalúe impacto, y genere un plan paso a paso.

> ¿Por qué no existe? → _La migración tecnológica es un evento de baja frecuencia pero alto impacto; no se priorizó en el diseño inicial del template._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | Subset (users performing stack migrations) |
| Functionality | Degraded (manual migration without structured guidance) |
| Data integrity | At risk (migrations without plan can break functionality) |
| Reproducibility | Intermittent (only when migrations are needed) |

## Environment

- **Platform:** Any (Linux, macOS, Windows)
- **Version:** v2.0.0
- **Configuration:** Requires project with detectable tech stack (package.json, requirements.txt, etc.)

## Proposed Solution

1. **Crear comando `/migrate`** en `template/obligatorio/core/commands/migrate.md` con agente ejecutor `Quetzalcoatl`.
2. **Posición en flujo SDD**: Antes de `/diagnosis`, `/docs-update` y `/evolve`, ya que la migración puede requerir nuevas especificaciones y actualización de documentación.
3. **Análisis del stack actual**: Detectar tecnologías desde lock files, config files, y dependencias.
4. **Evaluación de impacto**: Analizar breaking changes, APIs deprecadas, y compatibilidad.
5. **Generación de plan de migración**: Documento estructurado con fases, pasos, y criterios de aceptación.
6. **Actualización automática de documentación**:
   - `docs/MIGRATION.md`: Guía de migración completa.
   - `docs/WORKFLOW.md`: Ajustes al flujo de trabajo si aplica.
   - `specs/`: Actualizar especificaciones afectadas.
7. **Estrategias de seguridad**: Backup, rollback procedures, y testing pre/post migración.
8. **Skills y subagentes**: Identificar herramientas apropiadas para análisis de dependencias, code transformation, y testing.

## Workarounds

> ⚠️ **WORKAROUND**
> Consultar documentación oficial de la tecnología target y crear plan de migración manual. Usar herramientas como `npm-check-updates` o `pip-upgrade` para detectar versiones disponibles.

## References

- [Issue #67](https://github.com/Fisherk2/codice-opencode/issues/67)
- `docs/MIGRATION.md` — Guía de migración v1.x → v2.0.0 existente
- `template/obligatorio/core/commands/` — Directorio de comandos existentes

---

## FEV Plan — FEV-24-B (~6-8h)

**Position in SDD Flow:** Antes de `/diagnosis`, `/docs-update` y `/evolve`.

| Task ID | Description | Target | Est. |
|---------|-------------|--------|------|
| FEV24B-T1 | Crear comando `/migrate` con análisis de stack actual | `template/obligatorio/core/commands/migrate.md` | 1.5h |
| FEV24B-T2 | Definir evaluación de impacto (breaking changes, APIs deprecadas) | `migrate.md` | 1h |
| FEV24B-T3 | Definir estructura del plan de migración (fases, pasos, criterios) | `migrate.md` | 1.5h |
| FEV24B-T4 | Definir actualización automática de docs (MIGRATION.md, WORKFLOW.md, specs/) | `migrate.md` | 1h |
| FEV24B-T5 | Definir estrategias de seguridad (backup, rollback, testing) | `migrate.md` | 1h |
| FEV24B-T6 | Identificar skills y subagentes apropiados para el flujo | `migrate.md` | 1h |

**DoD:**
- [ ] Comando `/migrate` creado con análisis de stack y evaluación de impacto
- [ ] Estructura de plan de migración definida
- [ ] Actualización automática de documentación especificada
- [ ] Skills y subagentes identificados y documentados

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
