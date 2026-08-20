# Implementation Plan: FEV-26 — Quick Wins (Bug fixes + Security patches + Documentation)

**Phase:** FEV-26 (v2.1.1) — ⏳ Pendiente
**Issues/TD:** [#79](https://github.com/Fisherk2/codice-opencode/issues/79), TD-V2-70, TD-V2-90, TD-V2-91, TD-V2-93
**Diagnósticos:** [`docs/diagnosis/fix14`](../docs/diagnosis/fix14-clean-install-version-file.md), [`fix17`](../docs/diagnosis/fix17-shell-injection-github-ref-name.md), [`fix25`](../docs/diagnosis/fix25-business-pack-agent-count.md), [`fix20`](../docs/diagnosis/fix20-writers-pack-agent-count.md), [`fix24`](../docs/diagnosis/fix24-outdated-comments-file-merge-engine.md)
**Date:** 2026-08-20
**Author:** Moctezuma (Strategic Planner)
**Branch:** `fix/tech-debt-2.1.1` (continúa de v2.1.0)
**Todo list:** [todo.md](./todo.md)
**Methodology:** Vertical slicing (1 item = 1 slice completo) · commits atómicos por fase · TDD donde aplique
**Wall-clock estimate:** ~4-6h (Phase 1: 1.5h · Phase 2: 2-3h · Phase 3: 1h)

---

## Overview

FEV-26 resuelve 5 quick-wins identificados en el deep audit (2026-08-19): 1 bug crítico que rompe el ciclo de Update tras Clean Install, 1 parche de seguridad de shell-injection en CI/CD, 2 correcciones cosméticas de manifest (agent count), y 1 limpieza de comentarios obsoletos. Todos los items son de bajo riesgo individual pero el bug #79 es **High Severity** porque inutiliza el modo Update.

**Lo que FEV-26 hace:**
1. Corrige `.codice-version` no escrito tras Clean Install (#79) — inyecta `version` desde `src/cli/version.ts` hacia `BaseInstallOptions`.
2. Sustituye `${{ github.ref_name }}` por `$GITHUB_REF_NAME` en 4 sitios de `release.yml` (TD-V2-70).
3. Actualiza manifest: business pack 92→91 (TD-V2-90) y writers pack 2→4 (TD-V2-91).
4. Renueva comentarios en `FileMergeEngine.ts` para reflejar el refactor de `AtomicStager` (TD-V2-93).
5. Añade tests de regresión para los 4 cambios de código (#79, TD-V2-90, TD-V2-91, TD-V2-93). TD-V2-70 se valida con grep + E2E workflow dry-run.

**Lo que FEV-26 NO hace:**
- ❌ **No tocar** el flujo de Project Install (ya funciona correctamente con version file).
- ❌ **No tocar** la lógica de staging/atomicidad (solo comentarios en Task 5).
- ❌ **No incluir** FEV-27 ni FEV-28 (fases separadas).
- ❌ **No refactorizar** `FileMergeEngine` — solo actualizar documentación inline.
- ❌ **No migrar** a `dist-tag latest` ni publicar release (lo hace el release workflow tras merge).

---

## Architecture Decisions

| Decisión | Rationale |
|----------|-----------|
| **Inyección de `version` desde CLI layer** | Mantiene Clean Architecture: `cli/version.ts` es la única fuente de verdad. Use cases no importan `package.json`. Sigue el patrón ya existente de `BaseInstallOptions`. |
| **`$GITHUB_REF_NAME` env-var en release.yml** | GitHub Actions documenta este patrón explícitamente como seguro. La validación regex puede ejecutarse DESPUÉS de la interpolación sin riesgo de inyección. |
| **Test de regresión por manifest count** | Previene que vuelva a ocurrir: el test lee el filesystem y compara con la descripción del manifest. Patrón "test the source of truth". |
| **Comentarios "why not what"** | Alinea con `docs/CODE_STYLE.md` (§Comments). El código autoexplica el *qué*; los comentarios deben dar contexto histórico o rationale. |

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────┐
│ Phase 1: Documentación & Seguridad (1.5h) — items independientes │
│   Task 1: TD-V2-90 (business 92→91)                              │
│   Task 2: TD-V2-91 (writers 2→4)                                 │
│   Task 3: TD-V2-70 (shell injection release.yml)                 │
└─────────────────────────────────────────────────────────────────┘
                                │
                          [Checkpoint A]
                  just check + 2052+ tests passing
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase 2: Critical bug fix (2-3h)                                 │
│   Task 4: #79 (.codice-version not written)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                          [Checkpoint B]
          E2E scenario 32: Clean Install writes .codice-version
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ Phase 3: Polish (1h)                                             │
│   Task 5: TD-V2-93 (outdated comments FileMergeEngine)           │
└─────────────────────────────────────────────────────────────────┘
                                │
                          [Checkpoint C]
            just check + CHANGELOG.md updated + branch ready
```

**Por qué este orden:**
- Phase 1 son cambios aislados, no rompen nada, y suben el count verde del test suite antes del cambio crítico.
- Phase 2 es el bug de mayor severidad — se hace DESPUÉS de los quick wins para que el PR incluya también los TD triviales y mantenga historia limpia.
- Phase 3 (comentarios) es independiente pero menos urgente — al final no retrasa el merge si hay presión.

---

## Task List

### Phase 1: Documentación & Seguridad

#### Task 1: TD-V2-90 — Business pack agent count 92→91

**Description:** Actualizar `FileRuleManifestData.ts` línea 66: `"Business pack (92 agents...)"` → `"Business pack (91 agents...)"`. Añadir test de regresión que lea el filesystem y falle si el count del manifest no coincide con `template/obligatorio/packs/business/*.md`.

**Acceptance criteria:**
- [ ] Línea 66 de `src/domain/entities/FileRuleManifestData.ts` dice `91 agents`
- [ ] Test nuevo `tests/unit/domain/entities/FileRuleManifestData.test.ts` (o ampliar existente) verifica que `manifest.description` contiene el count real
- [ ] `just test-unit` pasa con el nuevo test

**Verification:**
- [ ] `just check` — 0 errores
- [ ] `just test-unit --test-name-pattern="manifest.*count"` — verde
- [ ] Manual: `grep -c "template/obligatorio/packs/business/*.md"` = 91

**Dependencies:** None

**Files likely touched:**
- `src/domain/entities/FileRuleManifestData.ts` (1 línea)
- `tests/unit/domain/entities/FileRuleManifestData.test.ts` (1 test case)

**Estimated scope:** XS (1 archivo producción + 1 test)

**Pattern aplicado:** Test the source of truth — el test lee el filesystem para evitar drift futuro.

---

#### Task 2: TD-V2-91 — Writers pack agent count 2→4

**Description:** Actualizar `FileRuleManifestData.ts` línea 53: `"2 writer agents"` → `"4 writer agents"`. Añadir el mismo test de regresión que Task 1 pero para el pack de writers.

**Acceptance criteria:**
- [ ] Línea 53 de `src/domain/entities/FileRuleManifestData.ts` dice `4 writer agents`
- [ ] Test extendido cubre business + writers en una sola suite parametrizada
- [ ] `just test-unit` pasa

**Verification:**
- [ ] `just check` — 0 errores
- [ ] `just test-unit --test-name-pattern="pack.*count"` — verde
- [ ] Manual: `ls template/obligatorio/packs/writers/*.md | wc -l` = 4

**Dependencies:** Task 1 (comparten test pattern, ideal commitear juntos)

**Files likely touched:**
- `src/domain/entities/FileRuleManifestData.ts` (1 línea)
- `tests/unit/domain/entities/FileRuleManifestData.test.ts` (extender)

**Estimated scope:** XS

**Pattern aplicado:** Parametrized tests — mismo test corre para N packs.

---

#### Task 3: TD-V2-70 — Shell injection en release.yml

**Description:** Reemplazar `${{ github.ref_name }}` por `$GITHUB_REF_NAME` en las 4 ocurrencias de `.github/workflows/release.yml` (líneas 38, 47, 63, 82). GitHub Actions interpola las env vars en el shell script DESPUÉS de la validación regex, eliminando el vector de inyección.

**Acceptance criteria:**
- [ ] 4 sitios de `release.yml` usan `$GITHUB_REF_NAME` (env var, no template literal)
- [ ] La validación regex (`^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$`) se mantiene en cada sitio (ahora sobre la env var)
- [ ] `grep -n '\${{ github.ref_name }}' .github/workflows/` no devuelve resultados

**Verification:**
- [ ] `act --job release` dry-run local (si `act` está instalado) — sin errores de sintaxis
- [ ] Manual: leer el workflow final y confirmar que cada `$GITHUB_REF_NAME` está validado con regex antes de uso
- [ ] Documentar el fix en `CHANGELOG.md` (Security section)

**Dependencies:** None (independiente de Tasks 1-2)

**Files likely touched:**
- `.github/workflows/release.yml` (4 ediciones)

**Estimated scope:** XS

**Pattern aplicado:** Environment Variable Injection (defense against template injection) — patrón oficial documentado por GitHub Security Lab.

---

### Checkpoint A: After Phase 1

- [ ] `just check` — 0 errores (biome ci + tsc --noEmit)
- [ ] `just test-unit` — 2052+ tests passing
- [ ] `grep -rn '\${{ github\.ref_name }}' .github/workflows/` — 0 hits
- [ ] Manifest counts verificados manualmente
- [ ] **Review con humano antes de Phase 2**

---

### Phase 2: Critical Bug Fix

#### Task 4: #79 — `.codice-version` no escrito tras Clean Install

**Description:** El CLI (`src/cli/main.ts`) no inyecta la versión del package (`src/cli/version.ts`) en `BaseInstallOptions.version`, así que `runPostInstallSteps()` (`src/application/postInstall.ts`) cae en el fallback `version ?? "0.0.0"`. Esto rompe Update Workspace porque compara `"0.0.0"` contra la versión actual. La fix pasa `version` como parte del objeto `options` que se construye en `main.ts`.

**Acceptance criteria:**
- [ ] `BaseInstallOptions.version` se puebla con la constante de `src/cli/version.ts` en `main.ts` antes de invocar CleanInstallUseCase y ProjectInstallUseCase
- [ ] `runPostInstallSteps()` recibe `version` no-undefined → escribe `.codice-version` con versión correcta (ej: `"version":"2.1.1"`)
- [ ] Test integración nuevo: tras Clean Install, `.codice-version` existe y contiene la versión correcta
- [ ] Test E2E (escenario 32): `just test-e2e` incluye un escenario que verifica `.codice-version` post Clean Install
- [ ] Project Install NO se rompe (debe seguir funcionando como antes)

**Verification:**
- [ ] `just test-integration --test-name-pattern="CleanInstall.*version"` — verde
- [ ] `just test-e2e` — 32/32 (31 existentes + 1 nuevo) passing
- [ ] Manual: ejecutar `--mode clean-install --dest /tmp/codice-test/` → `cat /tmp/codice-test/.codice-version` muestra la versión correcta (no `"0.0.0"`)

**Dependencies:** Phase 1 completa (cambios independientes pero ideal commitear juntos en otro PR)

**Files likely touched:**
- `src/cli/main.ts` (~3 líneas: leer version constant + inyectar en options)
- `src/application/postInstall.ts` (posible small refactor si la firma cambia)
- `src/application/use-cases/InstallUseCaseBase.ts` (verificar que `version` se propaga)
- `tests/integration/use-cases/CleanInstallUseCase.test.ts` (nuevo test o extender)
- `tests/e2e/scripts/test-clean-install-version.sh` (nuevo escenario 32)

**Estimated scope:** M (3-5 archivos)

**Pattern aplicado:** Dependency Injection — la versión se pasa explícitamente por el constructor/call site en lugar de importarse dentro de la use case. Sigue el principio de Clean Architecture: el dominio no conoce la versión del package.

---

### Checkpoint B: After Phase 2

- [ ] `just check` — 0 errores
- [ ] `just test-unit` — 2053+ tests passing
- [ ] `just test-integration` — verde, incluye nuevo test CleanInstall.version
- [ ] `just test-e2e` — 32/32 escenarios (incluye escenario 32 nuevo)
- [ ] `just test-packaging` — 5/5 verde
- [ ] Coverage ≥95% production `src/`
- [ ] **Review con humano antes de Phase 3**

---

### Phase 3: Polish

#### Task 5: TD-V2-93 — Comentarios obsoletos en FileMergeEngine

**Description:** Revisar todos los comentarios en `src/domain/services/FileMergeEngine.ts` y actualizar los que referencian detalles de implementación obsoletos (ej: "staging path ensures atomicity" cuando la lógica ahora vive en `AtomicStager`). Aplicar regla `docs/CODE_STYLE.md` §Comments: explicar *why* no *what*.

**Acceptance criteria:**
- [ ] Todos los comentarios en `FileMergeEngine.ts` describen *why* o *historical context*, no *what*
- [ ] Las referencias a código eliminado se actualizan a las nuevas abstracciones (`AtomicStager`, ADR-003)
- [ ] JSDoc público actualizado si describe comportamiento cambiado
- [ ] Test unit verde (no debe romperse porque es solo doc)

**Verification:**
- [ ] `just check` — 0 errores
- [ ] Manual: leer el archivo completo y confirmar 0 comentarios obsoletos
- [ ] `git diff src/domain/services/FileMergeEngine.ts` muestra solo cambios en comentarios/JSDoc, no en lógica

**Dependencies:** Phase 2 completa

**Files likely touched:**
- `src/domain/services/FileMergeEngine.ts` (solo comments/JSDoc)

**Estimated scope:** XS

**Pattern aplicado:** Boy Scout Rule (leave the campground cleaner than you found it) — refactor sin cambio de comportamiento.

---

### Checkpoint C: After Phase 3

- [ ] `just check` — 0 errores
- [ ] `just test-unit` — 2053+ tests passing
- [ ] `just test-integration` — verde
- [ ] `just test-e2e` — 32/32 escenarios
- [ ] Coverage ≥95% production `src/`
- [ ] `CHANGELOG.md` actualizado (entradas por item)
- [ ] `docs/TECH_DEBT.md` actualizado — Tasks 1, 2, 3, 5 marcados como resolved; Task 4 queda en FEV-26 backlog hasta cierre del PR
- [ ] Branch `fix/tech-debt-2.1.1` lista para PR a `develop`
- [ ] **PR abierto con descripción completa**

---

## Parallelization Opportunities

| Slice | Safe to parallelize | Rationale |
|-------|---------------------|-----------|
| Tasks 1 + 2 | ✅ Sí | Ambos editan el mismo archivo pero líneas distintas; si se hacen en serie evitan merge conflicts |
| Tasks 3 | ✅ Sí | Archivo completamente distinto (.github/workflows/release.yml) |
| Task 4 | ⚠️ Con cuidado | Requiere leer firma actual de `BaseInstallOptions` y tests existentes; mejor secuencial tras Phase 1 |
| Task 5 | ⚠️ Secuencial | Si se hace en paralelo con Task 4 puede haber confusion en el diff |

**Estrategia recomendada:**
1. Phase 1: Tasks 1+2 juntas (un commit), Task 3 aparte (otro commit). 2 commits totales.
2. Phase 2: Task 4 sola (1 commit + 1-2 tests).
3. Phase 3: Task 5 sola (1 commit).
4. Docs de cierre: CHANGELOG + TECH_DEBT + WORKFLOW (1 commit).

**Total: 5 commits atómicos + 1 doc commit = 6 commits.**

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Task 4 rompe Project Install | High | Medium | Test integración verifica ambos modos. Code review focal en `main.ts`. Rollback trivial (1 línea). |
| Task 3 omite algún sitio de `${{ github.ref_name }}` | Medium | Low | `grep -rn '\${{ github\.ref_name }}' .github/workflows/` debe devolver 0. |
| Manifest count se vuelve obsoleto de nuevo | Low | Medium | Tests de regresión (Tasks 1+2) detectan drift automáticamente. |
| Comentarios de Task 5 introducen información incorrecta | Low | Low | Review manual del diff + ejecutar tests para confirmar zero behavior change. |
| CI falla por shell escaping en release.yml | Medium | Low | Dry-run con `act` o inspección manual del YAML. |

---

## Open Questions

- **Q1:** ¿El escenario E2E #32 (Clean Install + .codice-version) se añade al suite oficial o se queda como integration test? → **Decisión:** Ambos. E2E verifica end-to-end con CLI real; integration test es rápido y se ejecuta en cada commit. (No requiere pregunta al usuario — sigue el patrón de los 31 escenarios existentes.)
- **Q2:** ¿Tasks 1+2 en un solo commit o separados? → **Decisión recomendada:** Juntos (1 commit "docs: correct pack agent counts in manifest"). Razones: misma categoría, mismo archivo, mismo review pattern.

---

## Definition of Done

- [ ] Todos los criterios de aceptación de las 5 tasks cumplidos
- [ ] `just check` + `just test` (unit + integration + e2e + packaging) sin errores
- [ ] Coverage ≥95% production `src/`
- [ ] `CHANGELOG.md` actualizado con 5 entradas
- [ ] `docs/TECH_DEBT.md` actualizado (5 items marcados como resolved en v2.1.1)
- [ ] `docs/WORKFLOW.md` actualizado — FEV-26 marcado como ✅ Completo
- [ ] Branch `fix/tech-debt-2.1.1` lista para PR a `develop`
- [ ] PR abierto con título `fix(tech-debt): resolve FEV-26 quick wins (5 items, #79 + TD-V2-70/90/91/93)`

---

## References

- [SPEC.md](../SPEC.md) — Especificación central del proyecto
- [docs/WORKFLOW.md](../docs/WORKFLOW.md) §FEV-26 — Descripción original de la fase
- [docs/TECH_DEBT.md](../docs/TECH_DEBT.md) — Backlog v2.1.1
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — Clean Architecture & ADR-003 (atomic staging)
- [docs/CODE_STYLE.md](../docs/CODE_STYLE.md) §Comments — Regla why-not-what
- [docs/diagnosis/fix14](../docs/diagnosis/fix14-clean-install-version-file.md) — Diagnóstico completo de #79
- [docs/diagnosis/fix17](../docs/diagnosis/fix17-shell-injection-github-ref-name.md) — Diagnóstico completo de TD-V2-70
- [GitHub Security Lab — Template Injection](https://securitylab.github.com/research/github-actions-untrusted-input/) — Patrón `$GITHUB_REF_NAME`

---

*Prepared by Moctezuma · 2026-08-20*
*Co-Authored-By: Moctezuma <dev@fisherk2.com>*
