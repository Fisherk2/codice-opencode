# Diagnosis: Comando `/analyze` — Generación de Deudas Técnicas por Análisis Arquitectónico

**Issue:** [#57](https://github.com/Fisherk2/codice-opencode/issues/57) — _Añadir nuevo comando para generar deudas técnicas_
**Date:** 2026-08-07
**Severity:** medium
**Status:** diagnosed

---

## Summary

No existe un comando que analice el proyecto a nivel arquitectónico y genere un documento `TECH_DEBT.md` estructurado con hallazgos priorizados. El análisis de deudas técnicas se realiza manualmente, lo que resulta en documentos incompletos o sesgados. Se necesita un comando `/analyze` que examine el proyecto en múltiples dimensiones (estructura, patrones, dependencias, seguridad, rendimiento) y genere un reporte priorizado de deudas técnicas.

## Symptoms

- No hay comando dedicado para análisis arquitectónico automatizado.
- `docs/TECH_DEBT.md` existe pero se actualiza manualmente sin análisis exhaustivo.
- No hay evaluación sistemática de code smells, anti-patrones, o problemas de arquitectura.
- El comando `/diagnosis` no considera `TECH_DEBT.md` como input para sus diagnósticos.

## Root Cause

El template provee un documento `TECH_DEBT.md` pero no tiene un mecanismo automatizado para analizar el proyecto y generar/mantener este documento con hallazgos objetivos y priorizados.

> ¿Por qué no existe? → _El análisis arquitectónico requiere múltiples perspectivas (seguridad, rendimiento, patrones); se consideró que era más eficiente hacerlo manualmente._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All (every project accumulates technical debt) |
| Functionality | Degraded (debt goes undetected without systematic analysis) |
| Data integrity | Safe (no data at risk, but quality degrades over time) |
| Reproducibility | Always (debt accumulates in every project) |

## Environment

- **Platform:** Any (Linux, macOS, Windows)
- **Version:** v2.0.0
- **Configuration:** Requires project with source code analyzable by static analysis tools

## Proposed Solution

1. **Crear comando `/analyze`** en `template/obligatorio/core/commands/analyze.md` con agente ejecutor `Quetzalcoatl`.
2. **Posición en flujo SDD**: Después de `/migrate` pero antes de `/diagnosis`, ya que los hallazgos alimentan el proceso de diagnóstico.
3. **Dimensiones de análisis**:
   - **Estructura del sistema**: Jerarquía de componentes, patrones arquitectónicos, límites de módulos.
   - **Patrones de diseño**: Consistencia, detección de anti-patrones, efectividad.
   - **Arquitectura de dependencias**: Niveles de acoplamiento, dependencias circulares, inyección de dependencias.
   - **Flujo de datos**: Trazabilidad, gestión de estado, estrategias de persistencia.
   - **Escalabilidad y rendimiento**: Cuellos de botella, estrategias de caching, gestión de recursos.
   - **Seguridad**: Trust boundaries, patrones de autenticación/autorización, protección de datos.
   - **Testabilidad**: Cobertura, calidad de tests, áreas sin testing.
   - **Documentación**: Adequación de comentarios, completitud de API docs.
4. **Generación de `TECH_DEBT.md`**: Documento estructurado con hallazgos priorizados (critical, high, medium, low) y recomendaciones actionables.
5. **Integración con `/diagnosis`**: Actualizar `/diagnosis` para que considere `TECH_DEBT.md` como input.
6. **Skills y subagentes**: Identificar herramientas para análisis estático, revisión de seguridad, evaluación de rendimiento, y análisis de dependencias.

## Workarounds

> ⚠️ **WORKAROUND**
> Usar herramientas de análisis estático (SonarQube, ESLint, CodeClimate) manualmente. Revisar el proyecto con `/review` y consolidar hallazgos en `TECH_DEBT.md` de forma manual.

## References

- [Issue #57](https://github.com/Fisherk2/codice-opencode/issues/57)
- `docs/TECH_DEBT.md` — Documento de deuda técnica actual
- `template/obligatorio/core/commands/` — Directorio de comandos existentes
- `template/obligatorio/core/commands/review.md` — Comando similar para revisión de código

---

## FEV Plan — FEV-24-D (~6-8h)

**Position in SDD Flow:** Después de `/migrate` pero antes de `/diagnosis`.

| Task ID | Description | Target | Est. |
|---------|-------------|--------|------|
| FEV24D-T1 | Crear comando `/analyze` con dimensiones de análisis | `template/obligatorio/core/commands/analyze.md` | 1.5h |
| FEV24D-T2 | Definir 8 dimensiones de análisis (estructura, patrones, dependencias, flujo de datos, escalabilidad, seguridad, testabilidad, documentación) | `analyze.md` | 1.5h |
| FEV24D-T3 | Definir generación de `TECH_DEBT.md` con hallazgos priorizados | `analyze.md` | 1h |
| FEV24D-T4 | Definir integración con `/diagnosis` (TECH_DEBT.md como input) | `analyze.md` + `diagnosis.md` | 1h |
| FEV24D-T5 | Identificar skills y subagentes apropiados para el flujo | `analyze.md` | 1h |

**DoD:**
- [ ] Comando `/analyze` creado con 8 dimensiones de análisis
- [ ] Generación de `TECH_DEBT.md` especificada
- [ ] Integración con `/diagnosis` definida
- [ ] Skills y subagentes identificados y documentados

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
