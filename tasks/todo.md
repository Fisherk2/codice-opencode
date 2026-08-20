# FEV-26 Todo List — Quick Wins (Bug fixes + Security patches + Documentation)

> **⏳ PENDIENTE** (inicio 2026-08-20) — 5 items · ~4-6h estimada

**Phase:** FEV-26 (v2.1.1) — ⏳ Pendiente
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

- [ ] Abrir `src/domain/entities/FileRuleManifestData.ts` línea 66
- [ ] Cambiar `"Business pack (92 agents...)"` → `"Business pack (91 agents...)"`
- [ ] Abrir `tests/unit/domain/entities/FileRuleManifestData.test.ts`
- [ ] Añadir test parametrizado que cuenta `template/obligatorio/packs/business/*.md` y compara con el manifest
- [ ] `just test-unit --test-name-pattern="business.*pack.*count"` — verde
- [ ] **Commit:** `docs(manifest): correct business pack agent count (92→91)`
- [ ] **Commit trailer:** `Co-Authored-By: Moctezuma <dev@fisherk2.com>`

### Task 2 — TD-V2-91: writers pack count 2→4

- [ ] Abrir `src/domain/entities/FileRuleManifestData.ts` línea 53
- [ ] Cambiar `"2 writer agents"` → `"4 writer agents"`
- [ ] Extender el test de Task 1 para incluir writers pack
- [ ] `just test-unit --test-name-pattern="pack.*count"` — verde
- [ ] **Commit:** `docs(manifest): correct writers pack agent count (2→4)` *(o unirlo al commit de Task 1)*

### Task 3 — TD-V2-70: shell injection release.yml

- [ ] Abrir `.github/workflows/release.yml`
- [ ] Reemplazar `${{ github.ref_name }}` por `$GITHUB_REF_NAME` en líneas 38, 47, 63, 82
- [ ] Mantener la validación regex `^v[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9.]+)?$` DESPUÉS de la env var
- [ ] `grep -rn '\${{ github\.ref_name }}' .github/workflows/` → 0 hits
- [ ] Validar sintaxis YAML: `just ci-lint-workflows` o `act --dryrun` si está disponible
- [ ] **Commit:** `fix(security): prevent shell injection in release.yml via $GITHUB_REF_NAME`
- [ ] **Commit trailer:** `Co-Authored-By: Moctezuma <dev@fisherk2.com>`

### Checkpoint A — Phase 1 done

- [ ] `just check` — 0 errores
- [ ] `just test-unit` — 2052+ tests passing
- [ ] Manifest counts verificados manualmente (91 business, 4 writers)
- [ ] Shell injection grep returns 0
- [ ] 2-3 commits subidos a `fix/tech-debt-2.1.1`
- [ ] **🔄 PAUSA — Review con humano antes de Phase 2**

---

## Phase 2: Critical Bug Fix

### Task 4 — #79: .codice-version no escrito tras Clean Install

- [ ] **Diagnóstico:** leer [`docs/diagnosis/fix14-clean-install-version-file.md`](../docs/diagnosis/fix14-clean-install-version-file.md) si no lo has hecho
- [ ] Leer firma actual de `BaseInstallOptions` en `src/application/use-cases/InstallUseCaseBase.ts`
- [ ] Leer `src/cli/main.ts` para localizar dónde se construyen las options de Clean/Project install
- [ ] Leer `src/application/postInstall.ts` para entender el fallback `version ?? "0.0.0"`
- [ ] **Plan de inyección:**
  - Importar `VERSION` (o constante equivalente) desde `src/cli/version.ts` en `main.ts`
  - Pasar `version: VERSION` en el objeto `options` que se pasa a CleanInstallUseCase y ProjectInstallUseCase
- [ ] Editar `src/cli/main.ts`:
  - Añadir import: `import { VERSION } from "./version.js"` (verificar extensión .js para Bun)
  - Localizar la construcción de options para Clean Install (buscar `mode === "clean-install"` o similar)
  - Localizar la construcción de options para Project Install
  - Añadir `version: VERSION` en ambos sitios
- [ ] Verificar que `runPostInstallSteps()` ahora recibe `version` no-undefined
- [ ] **Test integración:**
  - Crear/editar `tests/integration/use-cases/CleanInstallUseCase.test.ts`
  - Añadir test: tras Clean Install, leer `.codice-version` y verificar que contiene `VERSION` (no `"0.0.0"`)
  - Añadir test análogo para Project Install (regression: no debe romperse)
- [ ] **Test E2E (escenario 32):**
  - Crear `tests/e2e/scripts/test-clean-install-version.sh`
  - El script debe: ejecutar Clean Install en directorio temporal, leer `.codice-version`, hacer grep del patrón `"version":"<actual>"`, exit 0 si pasa
  - Registrar el escenario en `tests/e2e/run-all.sh` (o equivalente — verificar estructura existente)
- [ ] **Verificación:**
  - [ ] `just test-unit` — verde
  - [ ] `just test-integration` — verde, nuevo test incluido
  - [ ] `just test-e2e` — 32/32 pasando (31 existentes + 1 nuevo)
  - [ ] `just test-packaging` — 5/5 verde
  - [ ] Manual: `bunx . --mode clean-install --dest /tmp/codice-version-test && cat /tmp/codice-version-test/.codice-version` → versión correcta
- [ ] **Commit:** `fix(installer): write .codice-version after Clean Install (closes #79)`
- [ ] **Commit trailer:** `Co-Authored-By: Moctezuma <dev@fisherk2.com>`
- [ ] **Commit body:** Referenciar issue #79 + diagnóstico fix14

### Checkpoint B — Phase 2 done

- [ ] `just check` — 0 errores
- [ ] `just test-unit` — 2053+ tests passing
- [ ] `just test-integration` — verde, test CleanInstall.version incluido
- [ ] `just test-e2e` — 32/32 escenarios (nuevo escenario 32 incluido)
- [ ] `just test-packaging` — 5/5 verde
- [ ] Coverage ≥95% production `src/`
- [ ] Manual smoke test: Clean Install + read `.codice-version` → versión correcta
- [ ] Project Install NO roto (regression check)
- [ ] **🔄 PAUSA — Review con humano antes de Phase 3**

---

## Phase 3: Polish

### Task 5 — TD-V2-93: outdated comments FileMergeEngine

- [ ] Leer `src/domain/services/FileMergeEngine.ts` completo
- [ ] Identificar comentarios que referencian:
  - [ ] Staging paths (ahora en `AtomicStager`)
  - [ ] Comportamiento cambiado por refactor de F4.6 (TemplateResolver + AtomicStager extraction)
  - [ ] Funciones o clases inexistentes
  - [ ] Comentarios que dicen *what* en vez de *why*
- [ ] Actualizar o eliminar cada comentario obsoleto
- [ ] Si hay JSDoc público, verificar que describe el comportamiento actual
- [ ] **NO tocar lógica** — solo comments y JSDoc
- [ ] **Verificación:**
  - [ ] `git diff src/domain/services/FileMergeEngine.ts` muestra solo cambios en comments/JSDoc
  - [ ] `just test-unit` — verde (zero behavior change)
  - [ ] `just check` — 0 errores
- [ ] **Commit:** `docs(domain): refresh outdated comments in FileMergeEngine`
- [ ] **Commit trailer:** `Co-Authored-By: Moctezuma <dev@fisherk2.com>`

### Checkpoint C — Phase 3 done

- [ ] `just check` — 0 errores
- [ ] `just test-unit` — 2053+ tests passing
- [ ] `just test-integration` — verde
- [ ] `just test-e2e` — 32/32 escenarios
- [ ] Coverage ≥95% production `src/`
- [ ] **Actualizar documentación de cierre:**
  - [ ] `CHANGELOG.md` — Añadir entradas por cada item (Security, Fixes, Documentation sections)
  - [ ] `docs/TECH_DEBT.md` — Marcar TD-V2-90, TD-V2-91, TD-V2-93 como resolved en v2.1.1; TD-V2-70 también
  - [ ] `docs/WORKFLOW.md` — Marcar FEV-26 como ✅ Completo en línea 21
  - [ ] **Commit:** `docs: close FEV-26 (changelog + tech debt + workflow)`

---

## Definition of Done (final)

- [ ] Todos los items marcados como completados arriba
- [ ] Branch `fix/tech-debt-2.1.1` con 5-6 commits limpios
- [ ] `git log --oneline fix/tech-debt-2.1.1 ^develop` muestra todos los commits
- [ ] PR abierto a `develop` con título `fix(tech-debt): resolve FEV-26 quick wins (#79, TD-V2-70/90/91/93)`
- [ ] PR description lista los 5 items + link a `tasks/plan.md`
- [ ] CI pasa en Linux, macOS, Windows (3 checks required)
- [ ] Code review aprobado
- [ ] Squash merge a `develop`
- [ ] Post-merge: `git checkout develop && git pull && git checkout fix/tech-debt-2.1.1 && git branch -d` para limpiar local

---

## Notas operacionales

- **No tocar** el branch protection — los required checks ya están configurados para 3 OS.
- **Si un test falla**, NO deshabilitar el test. Diagnosticar root cause y arreglar.
- **Si Task 4 requiere cambiar la firma de `BaseInstallOptions`**, coordinar: pasar `version` como parte del `BaseInstallOptions` (no añadir param nuevo) para mantener ISP limpio.
- **Si el escenario E2E 32 falla en Windows pero pasa en Linux/macOS**, puede ser un issue de path handling — abrir issue separado, no bloquear FEV-26.

---

*Prepared by Moctezuma · 2026-08-20*
*Co-Authored-By: Moctezuma <dev@fisherk2.com>*
