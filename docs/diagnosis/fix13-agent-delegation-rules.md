# Diagnosis: Reglas de Delegación en Agentes Principales

**Issue:** [#69](https://github.com/Fisherk2/codice-opencode/issues/69) — _Reglas de delegación en los agentes principales_
**Date:** 2026-08-07
**Severity:** high
**Status:** diagnosed

---

## Summary

Los agentes principales del template carecen de reglas estructuradas para delegar tareas a sus subagentes de forma efectiva. Actualmente, la delegación es implícita y no sigue un protocolo consistente, lo que resulta en instrucciones ambiguas, falta de contexto para los subagentes, y dificultad para verificar la calidad del trabajo delegado. Se necesita añadir una sección de reglas de delegación en todos los agentes principales que establezca: instrucciones deterministas, lista de skills disponibles, y checklist de objetivos verificables.

## Symptoms

- Los agentes principales no tienen reglas explícitas de cómo delegar tareas.
- Las instrucciones a subagentes carecen de contexto apropiado y tareas verificables.
- No se proporciona lista de skills relevantes para cada tarea delegada.
- No hay checklist de objetivos para que el agente principal revise el trabajo del subagente.
- Los agentes principales no priorizan el análisis de skills disponibles antes de ejecutar instrucciones.

## Root Cause

El formato de agentes v2 (spec-agent-format-v2.md) define la estructura YAML frontmatter pero no establece un protocolo de delegación estandarizado. La delegación se dejó como comportamiento implícito de cada agente.

> ¿Por qué no existe? → _El diseño inicial se centró en la estructura del agente (rol, reglas, composición) pero no en el protocolo de interacción agente principal ↔ subagente._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All (affects quality of all delegated work) |
| Functionality | Degraded (inconsistent delegation quality) |
| Data integrity | Safe (no data at risk, but output quality varies) |
| Reproducibility | Intermittent (delegation quality depends on agent interpretation) |

## Environment

- **Platform:** Any
- **Version:** v2.0.0
- **Configuration:** Affects all agents in `template/obligatorio/packs/*/`

## Proposed Solution

1. **Definir sección de delegación** en el formato de agentes v2 (`specs/spec-agent-format-v2.md`):
   - **Instrucciones deterministas**: Contexto apropiado + tareas pequeñas y verificables.
   - **Lista de skills**: Skills de `skills/` que el subagente debe cargar para la tarea.
   - **Checklist de objetivos**: Rúbrica para que el agente principal revise el trabajo.
2. **Añadir protocolo de análisis previo**: Cada agente principal debe analizar qué subagentes invocar y qué skills cargar antes de ejecutar instrucciones (similar a la priorización de delegar antes de ejecutar).
3. **Actualizar agentes principales**: Añadir la sección de delegación en todos los agentes principales:
   - `template/obligatorio/packs/main/quetzalcoatl.md`
   - `template/obligatorio/packs/main/tlaloc.md`
   - `template/obligatorio/packs/main/mictlantecuhtli.md`
   - `template/obligatorio/packs/main/huitzilopochtli.md`
4. **Mantener límite de <100 líneas**: La sección de delegación debe ser concisa para no exceder el límite establecido.
5. **Priorización de skills**: Establecer que los agentes principales prioricen buscar skills disponibles en `skills/` antes de ejecutar instrucciones directamente.

## Workarounds

> ⚠️ **WORKAROUND**
> Los usuarios pueden añadir manualmente instrucciones de delegación en los agentes principales, pero no hay consistencia ni garantía de calidad.

## References

- [Issue #69](https://github.com/Fisherk2/codice-opencode/issues/69)
- `specs/spec-agent-format-v2.md` — Especificación de formato de agentes v2
- `template/obligatorio/packs/main/` — Directorio de agentes principales
- `template/obligatorio/core/skills/` — Directorio de skills disponibles

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
