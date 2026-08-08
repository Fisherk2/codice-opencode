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
2. **Posición en flujo SDD**: Antes de `/evolve`, ya que la migración puede requerir nuevas especificaciones.
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

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
