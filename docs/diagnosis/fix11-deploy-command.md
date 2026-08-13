# Diagnosis: Comando `/deploy` — Configuración y Ejecución de Git Workflow y CI/CD

**Issue:** [#64](https://github.com/Fisherk2/codice-opencode/issues/64) — _Añadir nuevo comando para configurar y ejecutar git workflow y CI/CD_
**Date:** 2026-08-07
**Severity:** medium
**Status:** diagnosed

---

## Summary

No existe un comando que automatice la configuración de git workflows y pipelines CI/CD adaptados al proyecto del usuario. Actualmente, los usuarios deben configurar manualmente branching strategies, PR templates, y pipelines de CI/CD sin asistencia contextual. Se necesita un comando `/deploy` que analice el proyecto, proponga configuraciones estándar, y las implemente de forma modular.

## Symptoms

- No hay comando para configurar git workflow y CI/CD de forma asistida.
- Los usuarios configuran branching strategies y CI/CD manualmente sin seguir convenciones.
- `CONTRIBUTING.md` documenta el workflow de Códice pero no hay herramienta para generar workflows personalizados.
- No hay detección automática del tipo de proyecto para sugerir CI/CD apropiado.

## Root Cause

El template asume que el usuario ya tiene un git workflow y CI/CD configurados, o que los configurará manualmente. No se contempló la necesidad de generar estas configuraciones de forma asistida para proyectos nuevos o existentes sin infraestructura de despliegue.

> ¿Por qué no existe? → _El foco inicial fue el instalador de templates; la configuración de infraestructura de despliegue se consideró out-of-scope._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All (every project needs deployment workflow) |
| Functionality | Degraded (manual configuration without guidance) |
| Data integrity | Safe (no data at risk, but inefficient workflows) |
| Reproducibility | Always (every new project faces this gap) |

## Environment

- **Platform:** Any (Linux, macOS, Windows)
- **Version:** v2.0.0
- **Configuration:** Requires git repository; CI/CD platform detection (GitHub Actions, GitLab CI, etc.)

## Proposed Solution

1. **Crear comando `/deploy`** en `template/obligatorio/core/commands/deploy.md` con agente ejecutor `Mictlantecuhtli`.
2. **Posición en flujo SDD**: Después de `/ship`, ya que ship revisa antes de lanzar y deploy es el que lanza a producción.
3. **Pre-flight check**: Analizar si existe documentación de git workflow en `CONTRIBUTING.md` y CI/CD configurado.
3. **Análisis del proyecto**: Detectar tipo de proyecto (lenguaje, framework, estructura) para sugerir configuraciones apropiadas.
4. **Modos de operación**:
   - Si no hay workflow: Proponer opciones de git workflow (trunk-based, gitflow, feature-branch) y CI/CD platform.
   - Si hay workflow mejorable: Sugerir mejoras y optimizaciones.
   - Si hay workflow establecido: Ejecutar el workflow documentado en `CONTRIBUTING.md`.
5. **Generación de configuraciones modulares**:
   - Branch protection rules.
   - PR templates.
   - CI/CD pipelines (GitHub Actions, GitLab CI, etc.).
   - Deployment strategies (blue-green, canary, rolling).
6. **Actualización de documentación**: Generar/actualizar `CONTRIBUTING.md` con el workflow configurado.
7. **Skills y subagentes**: Identificar herramientas para análisis de proyecto, generación de YAML, y configuración de CI/CD.

## Workarounds

> ⚠️ **WORKAROUND**
> Usar templates de GitHub Actions del marketplace. Copiar configuraciones de proyectos similares. Consultar documentación de CI/CD platforms.

## References

- [Issue #64](https://github.com/Fisherk2/codice-opencode/issues/64)
- `CONTRIBUTING.md` — Git workflow actual del proyecto Códice
- `.github/workflows/` — Ejemplo de CI/CD configurado (ci.yml, release.yml)
- `template/obligatorio/core/commands/` — Directorio de comandos existentes

---

## FEV Plan — FEV-24-C (~8-10h)

**Position in SDD Flow:** Después de `/ship` (ship revisa antes de lanzar, deploy lanza a producción).

| Task ID | Description | Target | Est. |
|---------|-------------|--------|------|
| FEV24C-T1 | Crear comando `/deploy` con pre-flight check (CONTRIBUTING.md + CI/CD) | `template/obligatorio/core/commands/deploy.md` | 1.5h |
| FEV24C-T2 | Definir análisis de proyecto (tipo, lenguaje, framework) | `deploy.md` | 1h |
| FEV24C-T3 | Definir 3 modos de operación (no hay workflow, mejorable, establecido) | `deploy.md` | 1.5h |
| FEV24C-T4 | Definir generación de configuraciones modulares (branch protection, PR templates, CI/CD) | `deploy.md` | 2h |
| FEV24C-T5 | Definir actualización de CONTRIBUTING.md con workflow configurado | `deploy.md` | 1h |
| FEV24C-T6 | Identificar skills y subagentes apropiados para el flujo | `deploy.md` | 1h |

**DoD:**
- [ ] Comando `/deploy` creado con pre-flight y análisis de proyecto
- [ ] 3 modos de operación definidos
- [ ] Configuraciones modulares especificadas
- [ ] Skills y subagentes identificados y documentados

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
