# Diagnosis: Comando `/sync` — Sincronización Bidireccional con Resolución Inteligente de Conflictos

**Issue:** [#68](https://github.com/Fisherk2/codice-opencode/issues/68) — _Añadir nuevo comando para estrategia de resolución de conflictos por sincronización de repo remoto_
**Date:** 2026-08-07
**Severity:** medium
**Status:** diagnosed

---

## Summary

El workspace actual carece de un mecanismo automatizado para sincronizar el repositorio local con el remoto y resolver conflictos de forma inteligente. Cuando múltiples contribuidores trabajan simultáneamente, los conflictos de merge requieren intervención manual que puede resultar en pérdida de trabajo local o remoto. Se necesita un comando `/sync` que ejecute `git pull/fetch`, detecte conflictos y los resuelva preservando ambas contribuciones.

## Symptoms

- No existe un comando dedicado para sincronización bidireccional con resolución de conflictos.
- Los usuarios deben ejecutar `git pull` manualmente y resolver conflictos sin asistencia contextual.
- Riesgo de pérdida de trabajo local al priorizar cambios remotos (o viceversa) sin análisis inteligente.
- No hay registro de historial de sincronizaciones ni trail de auditoría.

## Root Cause

El flujo de trabajo SDD actual asume un único contribuidor por proyecto. No se contempló el escenario multi-contribuidor donde la sincronización remota genera conflictos que requieren resolución contextual.

> ¿Por qué no existe? → _El diseño original del template se centró en el flujo SDD individual; la colaboración simultánea es un caso de uso posterior._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | Subset (proyectos con 2+ contribuidores) |
| Functionality | Degraded (manual workarounds exist but are error-prone) |
| Data integrity | At risk (conflict resolution without tooling can lose work) |
| Reproducibility | Always (whenever concurrent modifications occur) |

## Environment

- **Platform:** Any (Linux, macOS, Windows)
- **Version:** v2.0.0
- **Configuration:** Requires git + remote repository configured

## Proposed Solution

1. **Crear comando `/sync`** en `template/obligatorio/core/commands/sync.md` con agente ejecutor `tlaloc`.
2. **Pre-flight check**: Verificar que el proyecto tenga git inicializado y un remote configurado. Si no, abortar con mensaje actionable.
3. **Modos de sincronización**: Implementar 4 modos seleccionables vía `question-tool`:
   - `full-sync`: Sincronización bidireccional completa.
   - `incremental-sync`: Solo cambios nuevos desde el último sync.
   - `dry-run`: Vista previa sin aplicar cambios.
   - `conflict-resolution`: Modo manual interactivo guiado por el agente.
4. **Estrategias de resolución**: Implementar 4 estrategias:
   - `NEWER_WINS`: Timestamp más reciente prevalece.
   - `GITHUB_WINS`: Cambios remotos priorizados.
   - `LOCAL_WINS`: Cambios locales priorizados.
   - `INTELLIGENT_MERGE`: Análisis contextual para fusionar a nivel de campo.
5. **Gestión de estado**: Mantener base de datos de sincronización en `docs/` con historial completo.
6. **Seguridad transaccional**: Operaciones atómicas con rollback en caso de fallo.
7. **Reporte post-sync**: Detallar conflictos detectados, estrategia usada, cambios aplicados, y métricas de rendimiento.
8. **Skills y subagentes**: Identificar y documentar qué skills cargar y qué subagentes delegar para cada fase del flujo.

## Workarounds

> ⚠️ **WORKAROUND**
> Ejecutar `git pull --rebase` manualmente y resolver conflictos con `git mergetool`. Hacer backup del directorio antes de sincronizar.

## References

- [Issue #68](https://github.com/Fisherk2/codice-opencode/issues/68)
- `template/obligatorio/core/commands/` — Directorio de comandos existentes
- `docs/CONTRIBUTING.md` — Git workflow actual del proyecto

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
