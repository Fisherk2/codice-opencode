# FEV-26 Todo List — Quick Wins (Bug fixes + Security patches + Documentation)

> **✅ COMPLETO** (2026-08-20) — 5 items · ~4-6h estimada

**Phase:** FEV-26 (v2.1.1) — ✅ Completo
**Issues/TD:** #79, TD-V2-70, TD-V2-90, TD-V2-91, TD-V2-93
**Full plan:** [plan.md](./plan.md)
**Branch:** `fix/tech-debt-2.1.1`
**Total effort:** ~4-6h · 5 commits atómicos + 1 cierre docs
**Methodology:** Vertical slicing · commits atómicos · TDD donde aplique

---

## Scope Guard (leer antes de empezar)

**SOLO se tocan estos archivos:**

```
src/domain/entities/FileRuleManifestData.ts             ← Task 1, 2
src/domain/services/FileMergeEngine.ts                  ← Task 5
src/application/postInstall.ts                          ← Task 4 (verificar propagación)
src/application/use-cases/InstallUseCaseBase.ts        ← Task 4 (verificar firma)
src/cli/main.ts                                         ← Task 4
.github/workflows/release.yml                           ← Task 3
tests/unit/domain/entities/FileRuleManifestData.test.ts ← Task 1, 2
tests/integration/use-cases/CleanInstallUseCase.test.ts ← Task 4
tests/e2e/scripts/test-clean-install-version.sh         ← Task 4 (nuevo escenario 32)
CHANGELOG.md                                            ← Checkpoint C
docs/TECH_DEBT.md                                       ← Checkpoint C
docs/WORKFLOW.md                                        ← Checkpoint C
```

**PROHIBIDO en FEV-26:**

- ❌ Tocar lógica de staging o atomicidad (solo comentarios en Task 5)
- ❌ Refactorizar `FileMergeEngine` (solo docs)
- ❌ Cambiar la firma de `runPostInstallSteps()` salvo que sea estrictamente necesario para Task 4
- ❌ Incluir FEV-27 o FEV-28 (fases separadas)
- ❌ Publicar release o cambiar `dist-tag` (lo hace el release workflow post-merge)
- ❌ Romper Project Install (debe seguir funcionando como antes)
- ❌ Hardcodear rutas absolutas o ejecutar código del template
- ❌ Usar `any` en código de producción

---

## Phase 1: Documentación & Seguridad

### Task 1 — TD-V2-90: business pack count 92→91

- [x] Abrir `src/domain/entities/FileRuleManifestData.ts` línea 66
- [x] Cambiar `"Business pack (92 agents...)"` → `"Business pack (91 agents...)"`
- [x] Abrir `tests/unit/domain/entities/FileRuleManifestData.test.ts`
- [x] Añadir test parametrizado que cuenta `template/obligatorio/packs/business/*.md` y compara con el manifest
- [x] `just test-unit --test-name-pattern="business.*pack.*count"` — verde
- [x] **Commit:** `docs(manifest): correct business pack agent count (92→91)`
- [x] **Commit trailer:** `Co-Authored-By: Moctezuma <dev@fisherk2.com>`

### Task 2 — TD-V2-91: writers pack count 2→4

- [x] Abrir `src/domain/entities/FileRuleManifestData.ts` línea 53
- [x] Cambiar `"2 writer agents"` → `"4 writer agents"`
- [x] Extender el test de Task 1 para incluir writers pack
- [x] `just test-unit --test-name-pattern="pack.*count"` — verde
- [x] **Commit:** `docs(manifest): correct writers pack agent count (2→4)` *(o unirlo al commit de Task 1)*

### Task 3 — TD-V2-70: shell injection release.yml

- [x] Abrir `.github/workflows/release.yml`
- [x] Reemplazar `${{ github.ref_name }}` por `$GITHUB_REF_NAME` en líneas 38, 47, 63, 82
- [x] Mantener la validación regex `^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$` DESPUÉS de la env var
- [x] `grep -rn '\${{ github\.ref_name }}' .github/workflows/` → 0 hits
- [x] Validar sintaxis YAML: `just ci-lint-workflows` o `act --dryrun` si está disponible
- [x] **Commit:** `fix(security): prevent shell injection in release.yml via $GITHUB_REF_NAME`
- [x] **Commit trailer:** `Co-Authored-By: Moctezuma <dev@fisherk2.com>`

### Checkpoint A — Phase 1 done

- [x] `just check` — 0 errores
- [x] `just test-unit` — 2052+ tests passing
- [x] Manifest counts verificados manualmente (91 business, 4 writers)
- [x] Shell injection grep returns 0
- [x] 2-3 commits subidos a `fix/tech-debt-2.1.1`
- [x] **🔄 PAUSA — Review con humano antes de Phase 2**

---

## Phase 2: Critical Bug Fix

### Task 4 — #79: .codice-version no escrito tras Clean Install

- [x] **Diagnóstico:** leer [`docs/diagnosis/fix14-clean-install-version-file.md`](../docs/diagnosis/fix14-clean-install-version-file.md) si no lo has hecho
- [x] Leer firma actual de `BaseInstallOptions` en `src/application/use-cases/InstallUseCaseBase.ts`
- [x] Leer `src/cli/main.ts` para localizar dónde se construyen las options de Clean/Project install
- [x] Leer `src/application/postInstall.ts` para entender el fallback `version ?? "0.0.0"`
- [x] **Plan de inyección:**
  - Importar `VERSION` (o constante equivalente) desde `src/cli/version.ts` en `main.ts`
  - Pasar `version: VERSION` en el objeto `options` que se pasa a CleanInstallUseCase y ProjectInstallUseCase
- [x] Editar `src/cli/main.ts`:
  - Añadir import: `import { VERSION } from "./version.js"` (verificar extensión .js para Bun)
  - Localizar la construcción de options para Clean Install (buscar `mode === "clean-install"` o similar)
  - Localizar la construcción de options para Project Install
  - Añadir `version: VERSION` en ambos sitios
- [x] Verificar que `runPostInstallSteps()` ahora recibe `version` no-undefined
- [x] **Test integración:**
  - Crear/editar `tests/integration/use-cases/CleanInstallUseCase.test.ts`
  - Añadir test: tras Clean Install, leer `.codice-version` y verificar que contiene `VERSION` (no `"0.0.0"`)
  - Añadir test análogo para Project Install (regression: no debe romperse)
- [x] **Test E2E (escenario 32):**
  - Crear `tests/e2e/scripts/test-clean-install-version.sh`
  - El script debe: ejecutar Clean Install en directorio temporal, leer `.codice-version`, hacer grep del patrón `"version":"<actual>"`, exit 0 si pasa
  - Registrar el escenario en `tests/e2e/run-all.sh` (o equivalente — verificar estructura existente)
- [x] **Verificación:**
  - [x] `just test-unit` — verde
  - [x] `just test-integration` — verde, nuevo test incluido
  - [x] `just test-e2e` — 32/32 pasando (31 existentes + 1 nuevo)
  - [x] `just test-packaging` — 5/5 verde
  - [x] Manual: `bunx . --mode clean-install --dest /tmp/codice-version-test && cat /tmp/codice-version-test/.codice-version` → versión correcta
- [x] **Commit:** `fix(installer): write .codice-version after Clean Install (closes #79)`
- [x] **Commit trailer:** `Co-Authored-By: Moctezuma <dev@fisherk2.com>`
- [x] **Commit body:** Referenciar issue #79 + diagnóstico fix14

### Checkpoint B — Phase 2 done

- [x] `just check` — 0 errores
- [x] `just test-unit` — 2053+ tests passing
- [x] `just test-integration` — verde, test CleanInstall.version incluido
- [x] `just test-e2e` — 32/32 escenarios (nuevo escenario 32 incluido)
- [x] `just test-packaging` — 5/5 verde
- [x] Coverage ≥95% production `src/`
- [x] Manual smoke test: Clean Install + read `.codice-version` → versión correcta
- [x] Project Install NO roto (regression check)
- [x] **🔄 PAUSA — Review con humano antes de Phase 3**

---

## Phase 3: Polish

### Task 5 — TD-V2-93: outdated comments FileMergeEngine

- [x] Leer `src/domain/services/FileMergeEngine.ts` completo
- [x] Identificar comentarios que referencian:
  - [x] Staging paths (ahora en `AtomicStager`)
  - [x] Comportamiento cambiado por refactor de F4.6 (TemplateResolver + AtomicStager extraction)
  - [x] Funciones o clases inexistentes
  - [x] Comentarios que dicen *what* en vez de *why*
- [x] Actualizar o eliminar cada comentario obsoleto
- [x] Si hay JSDoc público, verificar que describe el comportamiento actual
- [x] **NO tocar lógica** — solo comments y JSDoc
- [x] **Verificación:**
  - [x] `git diff src/domain/services/FileMergeEngine.ts` muestra solo cambios en comments/JSDoc
  - [x] `just test-unit` — verde (zero behavior change)
  - [x] `just check` — 0 errores
- [x] **Commit:** `docs(domain): refresh outdated comments in FileMergeEngine`
- [x] **Commit trailer:** `Co-Authored-By: Moctezuma <dev@fisherk2.com>`

### Checkpoint C — Phase 3 done

- [x] `just check` — 0 errores
- [x] `just test-unit` — 2053+ tests passing
- [x] `just test-integration` — verde
- [x] `just test-e2e` — 32/32 escenarios
- [x] Coverage ≥95% production `src/`
- [x] **Actualizar documentación de cierre:**
  - [x] `CHANGELOG.md` — Añadir entradas por cada item (Security, Fixes, Documentation sections)
  - [x] `docs/TECH_DEBT.md` — Marcar TD-V2-90, TD-V2-91, TD-V2-93 como resolved en v2.1.1; TD-V2-70 también
  - [x] `docs/WORKFLOW.md` — Marcar FEV-26 como ✅ Completo en línea 21
  - [x] **Commit:** `docs: close FEV-26 (changelog + tech debt + workflow)`

---

## Definition of Done (final)

- [x] Todos los items marcados como completados arriba
- [x] Branch `fix/tech-debt-2.1.1` con 5-6 commits limpios
- [x] `git log --oneline fix/tech-debt-2.1.1 ^develop` muestra todos los commits
- [x] PR abierto a `develop` con título `fix(tech-debt): resolve FEV-26 quick wins (#79, TD-V2-70/90/91/93)`
- [x] PR description lista los 5 items + link a `tasks/plan.md`
- [x] CI pasa en Linux, macOS, Windows (3 checks required)
- [x] Code review aprobado
- [x] Squash merge a `develop`
- [x] Post-merge: `git checkout develop && git pull && git checkout fix/tech-debt-2.1.1 && git branch -d` para limpiar local

---

## Notas operacionales

- **No tocar** el branch protection — los required checks ya están configurados para 3 OS.
- **Si un test falla**, NO deshabilitar el test. Diagnosticar root cause y arreglar.
- **Si Task 4 requiere cambiar la firma de `BaseInstallOptions`**, coordinar: pasar `version` como parte del `BaseInstallOptions` (no añadir param nuevo) para mantener ISP limpio.
- **Si el escenario E2E 32 falla en Windows pero pasa en Linux/macOS**, puede ser un issue de path handling — abrir issue separado, no bloquear FEV-26.

---

*Prepared by Moctezuma · 2026-08-20*
*Co-Authored-By: Moctezuma <dev@fisherk2.com>*
