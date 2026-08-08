# FEV-25: Reglas de Delegación en Agentes Principales

**Version Target:** v2.1.0
**Date:** 2026-08-07
**Status:** planned
**Issues:** [#69](https://github.com/Fisherk2/codice-opencode/issues/69)
**Diagnoses:** `fix13-agent-delegation-rules.md`

---

## Summary

FEV-25 aborda la ausencia de reglas estructuradas de delegación en los agentes principales del template. Actualmente, la delegación a subagentes es implícita y carece de protocolo consistente. Este FEV define e implementa un protocolo de delegación estandarizado que incluye: instrucciones deterministas con contexto apropiado, lista de skills relevantes, y checklist de objetivos verificables.

## Scope

| Component | Issue | Purpose |
|-----------|-------|---------|
| Protocolo de delegación | #69 | Estandarizar cómo los agentes principales delegan tareas a subagentes |
| Agentes afectados | — | quetzalcoatl, tlaloc, mictlantecuhtli, huitzilopochtli |

---

## FEV-25-A: Definición del Protocolo de Delegación (~2-3h)

**Diagnosis:** `docs/diagnosis/fix13-agent-delegation-rules.md`

| Task ID | Description | Target | Est. |
|---------|-------------|--------|------|
| FEV25-A-T1 | Actualizar `spec-agent-format-v2.md` con sección de delegación | `specs/spec-agent-format-v2.md` | 1h |
| FEV25-A-T2 | Definir estructura de instrucciones deterministas (contexto + tareas verificables) | `spec-agent-format-v2.md` | 30min |
| FEV25-A-T3 | Definir estructura de lista de skills (skills relevantes por tarea) | `spec-agent-format-v2.md` | 30min |
| FEV25-A-T4 | Definir estructura de checklist de objetivos (rúbrica de revisión) | `spec-agent-format-v2.md` | 30min |

**DoD FEV-25-A:**
- [ ] Especificación de formato de agentes actualizada con sección de delegación
- [ ] 3 componentes del protocolo definidos: instrucciones, skills, checklist
- [ ] Ejemplos de uso incluidos en la especificación

---

## FEV-25-B: Implementación en Agentes Principales (~4-6h)

| Task ID | Description | Target | Est. |
|---------|-------------|--------|------|
| FEV25-B-T1 | Añadir sección de delegación a `quetzalcoatl.md` | `template/obligatorio/packs/main/quetzalcoatl.md` | 1h |
| FEV25-B-T2 | Añadir sección de delegación a `tlaloc.md` | `template/obligatorio/packs/main/tlaloc.md` | 1h |
| FEV25-B-T3 | Añadir sección de delegación a `mictlantecuhtli.md` | `template/obligatorio/packs/main/mictlantecuhtli.md` | 1h |
| FEV25-B-T4 | Añadir sección de delegación a `huitzilopochtli.md` | `template/obligatorio/packs/main/huitzilopochtli.md` | 1h |
| FEV25-B-T5 | Añadir protocolo de análisis previo (analizar subagentes + skills antes de ejecutar) | Todos los agentes principales | 1h |
| FEV25-B-T6 | Añadir priorización de skills disponibles en `skills/` | Todos los agentes principales | 30min |

**DoD FEV-25-B:**
- [ ] 4 agentes principales actualizados con sección de delegación
- [ ] Protocolo de análisis previo implementado
- [ ] Priorización de skills documentada
- [ ] Límite de <100 líneas mantenido (sin contar frontmatter YAML)

---

## Protocolo de Delegación — Especificación

### 1. Instrucciones Deterministas

Cada delegación debe incluir:
- **Contexto apropiado**: Información relevante para que el subagente entienda el problema.
- **Tareas pequeñas y verificables**: Dividir el trabajo en unidades atómicas con criterios de aceptación claros.
- **Entregables esperados**: Qué debe producir el subagente al completar la tarea.

### 2. Lista de Skills

Cada delegación debe incluir:
- **Skills relevantes**: Lista de skills de `skills/` que el subagente debe cargar para la tarea.
- **Justificación**: Por qué cada skill es apropiada para la tarea delegada.
- **Prioridad**: Orden de carga (primarias vs. secundarias).

### 3. Checklist de Objetivos

Cada delegación debe incluir:
- **Rúbrica de revisión**: Checklist que el agente principal usará para evaluar el trabajo del subagente.
- **Criterios de aceptación**: Condiciones que deben cumplirse para considerar la tarea completada.
- **Criterios de rechazo**: Condiciones que requieren retrabajo.

### 4. Protocolo de Análisis Previo

Antes de ejecutar cualquier instrucción, el agente principal debe:
1. **Analizar la solicitud**: ¿Qué se necesita lograr?
2. **Identificar subagentes apropiados**: ¿Qué subagentes pueden realizar esta tarea?
3. **Identificar skills relevantes**: ¿Qué skills de `skills/` deben cargarse?
4. **Decidir: delegar vs. ejecutar**: ¿Es más eficiente delegar o ejecutar directamente?
5. **Preparar delegación**: Si se delega, preparar instrucciones + skills + checklist.

---

## Implementation Order

1. **FEV-25-A** (Definición del protocolo) — Primero, porque establece la especificación.
2. **FEV-25-B** (Implementación en agentes) — Segundo, porque aplica la especificación.

## Total Estimated Time

~6-9 horas de trabajo.

## Success Criteria

- [ ] Especificación de formato de agentes actualizada con sección de delegación
- [ ] 4 agentes principales actualizados con protocolo de delegación
- [ ] Límite de <100 líneas mantenido en todos los agentes
- [ ] Protocolo de análisis previo implementado
- [ ] Priorización de skills documentada

## Constraints

- **Límite de líneas**: Cada agente principal debe mantener <100 líneas de system prompt (sin contar frontmatter YAML).
- **Consistencia**: El protocolo debe ser consistente en todos los agentes principales.
- **Concisión**: La sección de delegación debe ser concisa para no exceder el límite de líneas.

## References

- [Issue #69](https://github.com/Fisherk2/codice-opencode/issues/69)
- `docs/diagnosis/fix13-agent-delegation-rules.md`
- `specs/spec-agent-format-v2.md` — Especificación de formato de agentes v2
- `template/obligatorio/packs/main/` — Directorio de agentes principales

---

_FEV-25 created by `/diagnosis`. Use `/plan` to create execution plan for implementation._
