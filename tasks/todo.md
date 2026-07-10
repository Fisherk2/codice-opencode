# TODO: Fase FEV-5 — CI/CD Workflow + GitHub Wiki (v1.0.14)

**Estado:** 🟡 Pendiente — 0/21 tareas ejecutadas
**Fecha:** 2026-07-09
**Dependencias:** F0-F6 ✅ → FEV-1 ✅ → FEV-2 ✅ → FEV-2-B ✅ → FEV-2-C ✅ → FEV-2-D ✅ → FEV-3 ✅ → FEV-4 ✅ → **FEV-5 🟡 En curso**
**Branch:** `feat/ci-cd-wiki` (basada en `main`, con 4 commits previos de docs/diagnosis)
**Wiki source:** `docs/wiki-source/` (en repo principal, 9 archivos .md, sincronizados al wiki repo tras merge)
**Wiki repo:** `https://github.com/fisherk2/codice-opencode.wiki.git` (repo independiente)
**Issues principales:** #23 (CI/CD Workflow) + #25 (GitHub Wiki)

---

## Contexto Rápido

**Issue #23** — Estandarizar el flujo CI/CD con proceso 3-etapas (develop → test publish → main). Requiere infraestructura (`.github/workflows/`) + documentación (`CONTRIBUTING.md`).

**Issue #25** — Migrar documentación a GitHub Wiki (customization guide basada en `template/obligatorio/`), eliminar `docs/opencode/` (24 archivos en 2 ubicaciones), y actualizar 74+ referencias internas.

**Versión:** v1.0.14 (minor feature sobre v1.0.13)

---

## Tareas Pendientes

### 📦 Phase 1: CI/CD Infrastructure (Issue #23 Track A)

#### ⏳ FEV5-T1: Modify `ci.yml` — Add `develop` branch support
**Descripción:** Añadir `develop` a los triggers de `ci.yml` (push y pull_request).

**Criterios de Aceptación:**
- [ ] `on.push.branches` incluye `main` Y `develop`
- [ ] `on.pull_request.branches` incluye `main` Y `develop`
- [ ] Tags `v*` siguen triggereando
- [ ] Comentario explica la estrategia de 2 branches

**Verificación:**
- [ ] `just check` — 0 errores
- [ ] Push de un commit a `develop` triggerea CI
- [ ] PR contra `develop` triggerea CI

**Dependencias:** Ninguna.
**Archivos:** `.github/workflows/ci.yml` (modificar líneas 3-8)
**Scope:** S (15min).

---

#### ⏳ FEV5-T2: Modify `release.yml` — Pre-release tag support
**Descripción:** Detectar pre-release tags (`vX.Y.Z-beta.N` o `vX.Y.Z-rc.N`) y publicar con `npm publish --tag beta|rc` + `prerelease: true` en GitHub.

**Criterios de Aceptación:**
- [ ] Step `Publish to npm` detecta el sufijo del tag y selecciona el `--tag` correcto
- [ ] Step `Create Release` configura `prerelease: true` para beta/rc
- [ ] `make_latest: true` solo para tags sin sufijo
- [ ] Validación regex impide publicar tags con formato inválido
- [ ] Logging explícito de qué tipo de release se está creando

**Verificación:**
- [ ] `just check` — 0 errores
- [ ] Test con tag real `v1.0.14-beta.1` (push + verify en npm y GitHub)
- [ ] Cleanup: eliminar tag de prueba después de validar

**Dependencias:** Ninguna.
**Archivos:** `.github/workflows/release.yml` (modificar pasos 126-154)
**Scope:** S (30min).

---

#### ⏳ FEV5-T3: Create `develop` branch in repository
**Descripción:** Crear la rama `develop` desde `main`.

**Criterios de Aceptación:**
- [ ] Rama `develop` existe localmente
- [ ] Rama `develop` pusheada a `origin`
- [ ] Apunta al mismo commit que `main`
- [ ] Branch protection configurada (opcional)

**Verificación:**
- [ ] `git branch -r` muestra `origin/develop`
- [ ] `git log origin/develop..origin/main` está vacío

**Dependencias:** FEV5-T1.
**Archivos:** (ninguno — solo git operations)
**Scope:** XS (5min).

---

### 📚 Phase 2: CI/CD Documentation (Issue #23 Track B)

#### ⏳ FEV5-T4: Document Git Workflow in CONTRIBUTING.md
**Descripción:** Añadir sección "Git Workflow" con estrategia de branches, proceso 3-etapas, y naming conventions.

**Criterios de Aceptación:**
- [ ] Sección "Git Workflow" añadida
- [ ] Documenta: `main`, `develop`, `feat/*`, `fix/*`, `release/*`
- [ ] Proceso de 3 etapas explícito
- [ ] Tabla de naming conventions
- [ ] Sección "PR Requirements" con checklist
- [ ] Link a Issue #23 y diagnosis

**Verificación:**
- [ ] `just check` — 0 errores
- [ ] Manual: sección autoexplicativa

**Dependencias:** FEV5-T1, FEV5-T2.
**Archivos:** `CONTRIBUTING.md` (modificar)
**Scope:** M (45min).

---

#### ⏳ FEV5-T5: Document npm test publish nomenclature
**Descripción:** Documentar convención de versiones para test publishes.

**Criterios de Aceptación:**
- [ ] Tabla de nomenclatura: `vX.Y.Z-beta.N`, `vX.Y.Z-rc.N`, `vX.Y.Z`
- [ ] Comandos para crear tag de prueba
- [ ] Comandos para verificar el paquete
- [ ] Advertencia: pre-release tags sobrescribibles; `latest` no
- [ ] Sección "How to consume a test package"

**Verificación:**
- [ ] `just check` — 0 errores
- [ ] Manual: tabla correcta, comandos copy-paste ready

**Dependencias:** FEV5-T4.
**Archivos:** `CONTRIBUTING.md` (añadir sección)
**Scope:** S (20min).

---

#### ⏳ FEV5-T6: Document CI/CD Pipeline + troubleshooting
**Descripción:** Documentar cada workflow y troubleshooting de problemas comunes.

**Criterios de Aceptación:**
- [ ] Sección "CI/CD Pipeline" con subsecciones:
  - `ci.yml` — triggers, jobs, artifacts
  - `release.yml` — triggers, jobs, secrets requeridos
- [ ] Tabla de triggers
- [ ] Sección "Troubleshooting CI/CD" con ≥4 casos comunes
- [ ] Link a logs y docs externas

**Verificación:**
- [ ] `just check` — 0 errores
- [ ] Manual: troubleshooting cubre ≥4 casos

**Dependencias:** FEV5-T4.
**Archivos:** `CONTRIBUTING.md` (añadir sección)
**Scope:** M (30min).

---

#### ⏳ FEV5-T7: Add Release Checklist template
**Descripción:** Checklist pre-release, release, y post-release.

**Criterios de Aceptación:**
- [ ] Sección "Release Checklist" con 3 subsecciones:
  - Pre-release
  - Release
  - Post-release
- [ ] Checklist con checkboxes Markdown
- [ ] Ejemplo concreto: release `v1.0.14` con tag `v1.0.14-beta.1` previo

**Verificación:**
- [ ] `just check` — 0 errores
- [ ] Manual: checklist ejecutable paso a paso

**Dependencias:** FEV5-T4.
**Archivos:** `CONTRIBUTING.md` (añadir sección)
**Scope:** S (20min).

---

### 📖 Phase 3: Wiki Content Creation (Issue #25 Track C — content)

#### ⏳ FEV5-T8: Clone wiki repo + create `docs/wiki-source/` directory
**Descripción:** Verificar que la Wiki está habilitada (ya lo está), clonar el wiki repo para conocer su estructura, y crear el directorio `docs/wiki-source/` en el repo principal como source of truth para las 9 páginas.

**Criterios de Aceptación:**
- [ ] Wiki de GitHub habilitada y accesible en `https://github.com/fisherk2/codice-opencode/wiki`
- [ ] Wiki repo clonado localmente en `/tmp/codice-opencode.wiki` (verificar URL)
- [ ] Directorio `docs/wiki-source/` creado en el repo principal
- [ ] `docs/wiki-source/README.md` con instrucciones de sincronización

**Verificación:**
- [ ] `ls docs/wiki-source/README.md` existe
- [ ] `git clone https://github.com/fisherk2/codice-opencode.wiki.git /tmp/test-wiki` funciona (luego borrar)
- [ ] Wiki visible en GitHub repo sidebar

**Dependencias:** Ninguna.
**Archivos:**
- `docs/wiki-source/` (nuevo directorio)
- `docs/wiki-source/README.md` (instrucciones de sync)
**Scope:** S (15min).

---

#### ⏳ FEV5-T9: Create Home + Getting Started Wiki pages
**Descripción:** Escribir 2 páginas introductorias.

**Criterios de Aceptación:**
- [ ] `docs/wiki-source/Home.md`: workspace (1 párrafo), problema, quick links, link a OpenCode docs
- [ ] `docs/wiki-source/Getting-Started.md`: prerequisites, install via bunx, file tree, first steps, link a OpenCode installation
- [ ] Ambos: template-driven, no copy

**Verificación:**
- [ ] Manual: lectura fluida
- [ ] No hay duplicación de OpenCode docs

**Dependencias:** FEV5-T8.
**Archivos:** `docs/wiki-source/Home.md`, `docs/wiki-source/Getting-Started.md`
**Scope:** M (45min).

---

#### ⏳ FEV5-T10: Create Workspace Structure + Configuration Wiki pages
**Descripción:** Páginas sobre estructura física y `opencode.json`.

**Criterios de Aceptación:**
- [ ] `docs/wiki-source/Workspace-Structure.md`: árbol real, cada directorio explicado, patrones, link a OpenCode workspace
- [ ] `docs/wiki-source/Configuration.md`: cada sección de `opencode.json`, customizaciones comunes, ejemplo NVIDIA→Anthropic, link a OpenCode config

**Verificación:**
- [ ] Manual: estructura coincide con árbol real
- [ ] Ejemplo ejecutable

**Dependencias:** FEV5-T8.
**Archivos:** `docs/wiki-source/Workspace-Structure.md`, `docs/wiki-source/Configuration.md`
**Scope:** M (45min).

---

#### ⏳ FEV5-T11: Create Agents + Commands Wiki pages (with end-user guides)
**Descripción:** Páginas sobre agents y commands + guías paso a paso para usuarios finales.

**Criterios de Aceptación:**
- [ ] `docs/wiki-source/Agents.md`: arquitectura 2 niveles, patrón de agent, **guía paso a paso para añadir agent** (end-user), ejemplo funcional, link a OpenCode agents
- [ ] `docs/wiki-source/Commands.md`: ciclo SDD, patrón de command, **guía paso a paso para añadir command** (end-user), ejemplo funcional, link a OpenCode commands

**Verificación:**
- [ ] Manual: guía "añadir agent" ejecutable
- [ ] Ejemplo compila y funciona

**Dependencias:** FEV5-T8.
**Archivos:** `docs/wiki-source/Agents.md`, `docs/wiki-source/Commands.md`
**Scope:** L (1h).

---

#### ⏳ FEV5-T12: Create Skills + Customization Guide Wiki pages
**Descripción:** Páginas sobre skills y guía de customización con recetas.

**Criterios de Aceptación:**
- [ ] `docs/wiki-source/Skills.md`: patrón de skill, **guía paso a paso para añadir skill** (end-user), ejemplo funcional, link a OpenCode skills
- [ ] `docs/wiki-source/Customization-Guide.md`: ≥6 recetas prácticas (cambiar modelo, eliminar skill, añadir command, renombrar proyecto, cambiar permisos, añadir provider)

**Verificación:**
- [ ] Manual: guía de skills ejecutable
- [ ] Recetas copy-paste listas

**Dependencias:** FEV5-T8.
**Archivos:** `docs/wiki-source/Skills.md`, `docs/wiki-source/Customization-Guide.md`
**Scope:** L (1h).

---

#### ⏳ FEV5-T13: Create Troubleshooting + OpenCode cross-references page
**Descripción:** Página final de troubleshooting + verificación de cross-references.

**Criterios de Aceptación:**
- [ ] `docs/wiki-source/Troubleshooting.md`: ≥5 problemas comunes, link a OpenCode troubleshooting
- [ ] `rg "opencode.ai/docs" docs/wiki-source/` → ≥8 matches
- [ ] `_Sidebar.md` opcional para navegación

**Verificación:**
- [ ] `rg "opencode.ai/docs" docs/wiki-source/` muestra ≥8 matches
- [ ] Manual: troubleshooting cubre ≥5 problemas

**Dependencias:** FEV5-T9, T10, T11, T12.
**Archivos:** `docs/wiki-source/Troubleshooting.md`
**Scope:** S (30min).

---

### 🗑️ Phase 4: docs/opencode/ Elimination (Issue #25 Track C — removal)

#### ⏳ FEV5-T14: Remove `docs/opencode/` from project root
**Descripción:** Eliminar `docs/opencode/` (12 archivos) del proyecto root.

**Criterios de Aceptación:**
- [ ] `docs/opencode/` eliminado completamente
- [ ] `git status` muestra 12 archivos eliminados
- [ ] Commit: `chore(docs): remove docs/opencode/ from project root`
- [ ] Backup en `~/.cache/codice-backup/` antes de eliminar

**Verificación:**
- [ ] `ls docs/opencode/ 2>&1` → "No such file or directory"
- [ ] `git log --diff-filter=D --name-only` muestra los 12 archivos

**Dependencias:** FEV5-T9, T10, T11, T12, T13 (Wiki debe existir antes).
**Archivos:** `docs/opencode/` (eliminar)
**Scope:** XS (5min).

---

#### ⏳ FEV5-T15: Remove `template/opcional/docs/opencode/`
**Descripción:** Eliminar `template/opcional/docs/opencode/` (12 archivos).

**Criterios de Aceptación:**
- [ ] `template/opcional/docs/opencode/` eliminado completamente
- [ ] `git status` muestra 12 archivos eliminados
- [ ] Commit: `chore(template): remove docs/opencode/ from template opcional`
- [ ] Backup antes de eliminar

**Verificación:**
- [ ] `ls template/opcional/docs/opencode/ 2>&1` → "No such file or directory"
- [ ] `git log --diff-filter=D --name-only` muestra los 12 archivos

**Dependencias:** FEV5-T14.
**Archivos:** `template/opcional/docs/opencode/` (eliminar)
**Scope:** XS (5min).

---

#### ⏳ FEV5-T16: Remove `docs/opencode` entry from `FileRuleManifestData.ts`
**Descripción:** Eliminar entrada del manifest.

**Criterios de Aceptación:**
- [ ] Líneas 167-171 de `src/domain/entities/FileRuleManifestData.ts` eliminadas
- [ ] `bun test` sigue pasando
- [ ] `just check` sin errores
- [ ] Commit: `chore(manifest): remove docs/opencode from FileRuleManifestData`

**Verificación:**
- [ ] `rg "docs/opencode" src/` → 0 matches
- [ ] `bun test` — sin regresión (481/0)

**Dependencias:** FEV5-T14, FEV5-T15.
**Archivos:** `src/domain/entities/FileRuleManifestData.ts` (modificar)
**Scope:** XS (5min).

---

#### ⏳ FEV5-T17: Update 74+ internal references
**Descripción:** Actualizar referencias a `docs/opencode/` en CONTRIBUTING.md, README.md, comandos, specs, código.

**Criterios de Aceptación:**
- [ ] `rg "docs/opencode" CONTRIBUTING.md README.md specs/ docs/ template/obligatorio/commands/ template/obligatorio/agents/ src/ tests/` → 0 matches
- [ ] Referencias reemplazadas con Wiki links o OpenCode docs links
- [ ] Commit: `docs(refs): replace docs/opencode/ references with Wiki links`
- [ ] `rg "opencode.ai/docs" .` → ≥10 matches

**Verificación:**
- [ ] `rg "docs/opencode" .` (excluyendo `.git/`, `dist/`, `docs/wiki-source/`, `docs/diagnosis/`) → 0 matches
- [ ] Cross-references añadidas

**Dependencias:** FEV5-T14, FEV5-T15, FEV5-T16.
**Archivos:** `CONTRIBUTING.md`, `README.md`, `specs/spec-file-rules.md`, `template/obligatorio/commands/*.md`, `src/**/*.ts`
**Scope:** M (45min).

---

#### ⏳ FEV5-T18: Update E2E tests to reflect docs/opencode/ removal
**Descripción:** Tests E2E actualizados para no esperar `docs/opencode/`.

**Criterios de Aceptación:**
- [ ] `tests/e2e/*.sh` actualizado
- [ ] `tests/fixtures/` limpiado
- [ ] `just test-e2e` 15/15 pasando
- [ ] Commit: `test(e2e): remove docs/opencode/ assertions`

**Verificación:**
- [ ] `rg "docs/opencode" tests/` → 0 matches
- [ ] `just test-e2e` — 15/15 pasando
- [ ] `bun test` — 481/0

**Dependencias:** FEV5-T14, FEV5-T15, FEV5-T16.
**Archivos:** `tests/e2e/*.sh`, `tests/fixtures/`
**Scope:** M (30min).

---

### 🚀 Phase 5: Release (v1.0.14)

#### ⏳ FEV5-T19: Update CHANGELOG.md with v1.0.14 section
**Descripción:** Añadir sección `[1.0.14]` con Added/Changed/Removed/Fixed.

**Criterios de Aceptación:**
- [ ] Sección `## [1.0.14] - 2026-07-XX` añadida
- [ ] `### Added`: Wiki, pre-release tag support, Git Workflow, Release Checklist
- [ ] `### Changed`: ci.yml triggers, release.yml pre-release, CONTRIBUTING expanded
- [ ] `### Removed`: docs/opencode/ (root + template + manifest)
- [ ] `### Fixed`: Issue #23, Issue #25

**Verificación:**
- [ ] `head -50 CHANGELOG.md` muestra la nueva sección
- [ ] Formato Keep a Changelog respetado

**Dependencias:** FEV5-T17, FEV5-T18.
**Archivos:** `CHANGELOG.md` (modificar)
**Scope:** S (10min).

---

#### ⏳ FEV5-T20: Bump version to 1.0.14 in package.json
**Descripción:** Actualizar `package.json` de `1.0.13` a `1.0.14`.

**Criterios de Aceptación:**
- [ ] `package.json` → `"version": "1.0.14"`
- [ ] `just check` sin errores
- [ ] `bun test` sin regresión

**Verificación:**
- [ ] `grep "1.0.14" package.json` → match
- [ ] `bun pm pkg get version` → `1.0.14`

**Dependencias:** FEV5-T17, FEV5-T18.
**Archivos:** `package.json` (modificar)
**Scope:** XS (5min).

---

#### ⏳ FEV5-T21: Commit + PR + Tag + Release
**Descripción:** Test publish con `v1.0.14-beta.1`, validar, release de producción con `v1.0.14`.

**Criterios de Aceptación:**
- [ ] Test publish: `v1.0.14-beta.1` → release pipeline → `--tag beta` → GitHub Pre-release
- [ ] Validar con `npm view @fisherk2-dev/codice@beta`
- [ ] Cleanup del tag beta
- [ ] PR `feat/ci-cd-wiki` → `develop` → CI pasa → squash merge
- [ ] PR `develop` → `main` → CI pasa → squash merge
- [ ] Tag `v1.0.14` → release pipeline → npm `latest` → GitHub Release
- [ ] Rama `feat/ci-cd-wiki` eliminada localmente tras merge
- [ ] `develop` sincronizado con `main`

**Verificación:**
- [ ] `npm view @fisherk2-dev/codice version` → `1.0.14`
- [ ] `npm view @fisherk2-dev/codice dist-tags` → `{ latest: '1.0.14' }`
- [ ] GitHub Release v1.0.14 con 3 binarios + checksums
- [ ] Wiki poblada y visible

**Dependencias:** FEV5-T19, FEV5-T20.
**Archivos:** (ninguno — git + GitHub UI)
**Scope:** S (30min).

---

## Checkpoints

### Checkpoint 1: After T1, T2, T3 (CI/CD Infrastructure)
- [ ] `ci.yml` triggerea en PRs a `develop`
- [ ] `release.yml` parsea correctamente tag `v1.0.14-beta.1`
- [ ] Rama `develop` existe en `origin`
- [ ] `just check` — 0 errores

### Checkpoint 2: After T4, T5, T6, T7 (CI/CD Documentation)
- [ ] `CONTRIBUTING.md` tiene 4 secciones nuevas
- [ ] Cada sección es ejecutable
- [ ] Links a OpenCode docs presentes
- [ ] `just check` — 0 errores

### Checkpoint 3: After T8-T13 (Wiki Content - docs/wiki-source/)
- [ ] `docs/wiki-source/` con 9 archivos `.md` listos para sync a la Wiki
- [ ] Cada página sigue el principio: template-driven, no duplication
- [ ] ≥8 referencias a `opencode.ai/docs/` en docs/wiki-source/
- [ ] Wiki repo clonado y accesible (`git clone https://github.com/fisherk2/codice-opencode.wiki.git`)
- [ ] `docs/wiki-source/README.md` con instrucciones de sync
- [ ] Wiki visible en GitHub repo sidebar (ya habilitada)

### Checkpoint 4: After T14-T18 (docs/opencode/ Removal)
- [ ] `docs/opencode/` eliminado de root y template
- [ ] `FileRuleManifestData.ts` sin entrada
- [ ] `rg "docs/opencode" .` → 0 matches
- [ ] `bun test` — 481/0
- [ ] `just test-e2e` — 15/15

### Gate FEV-5: After T19, T20, T21 (Release Published)
- [ ] `npm view @fisherk2-dev/codice version` → `1.0.14`
- [ ] GitHub Release v1.0.14 con assets
- [ ] CHANGELOG actualizado
- [ ] `main` y `develop` sincronizados
- [ ] Wiki importada y visible

---

## Resumen Rápido

| Tarea | Scope | Esfuerzo |
|-------|-------|----------|
| FEV5-T1: ci.yml develop | S | 15min |
| FEV5-T2: release.yml pre-release | S | 30min |
| FEV5-T3: develop branch | XS | 5min |
| FEV5-T4: Git Workflow docs | M | 45min |
| FEV5-T5: npm nomenclature | S | 20min |
| FEV5-T6: CI/CD Pipeline docs | M | 30min |
| FEV5-T7: Release Checklist | S | 20min |
| FEV5-T8: Clone wiki repo + create docs/wiki-source/ | S | 15min |
| FEV5-T9: Home + Getting Started | M | 45min |
| FEV5-T10: Workspace + Config | M | 45min |
| FEV5-T11: Agents + Commands | L | 1h |
| FEV5-T12: Skills + Customization | L | 1h |
| FEV5-T13: Troubleshooting | S | 30min |
| FEV5-T14: Remove root docs/opencode/ | XS | 5min |
| FEV5-T15: Remove template docs/opencode/ | XS | 5min |
| FEV5-T16: Update FileRuleManifestData | XS | 5min |
| FEV5-T17: Update 74+ references | M | 45min |
| FEV5-T18: Update E2E tests | M | 30min |
| FEV5-T19: CHANGELOG v1.0.14 | S | 10min |
| FEV5-T20: Bump version 1.0.14 | XS | 5min |
| FEV5-T21: Commit + PR + Tag + Release | S | 30min |
| **Total** | | **~12h** |

---

*Última actualización: 2026-07-09*
