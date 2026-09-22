# Plan de implementación – Códice v1.0.0 → v2.1.3
**Fecha:** 2026-06-15 | **Última actualización:** 2026-09-19 (v2.1.3 Hotfix Opencode V2 🔧) | **Metodología:** TDD Iterativo

## 1. Visión de Fases

| Fase | Objetivo | Entregables | Estado |
|------|----------|-------------|--------|
| F0 | Preparación | entorno, convenciones, CI/CD | ✅ Completo |
| F1 | Infraestructura | BunFileSystem, GitHubRestClient, ClackPromptsAdapter | ✅ Completo |
| F2 | Núcleo/Dominio | FileMergeEngine, VersionComparator, Result type | ✅ Completo |
| F3 | Interfaces | CLI, DI, Use Cases, tests integración | ✅ Completo |
| F4 | Pruebas | E2E (6 escenarios), CI integration, coverage gaps | ✅ Completo |
| F4.5 | Workspace seguro | `--dest` flag, `tests/fixtures/workspace/`, `just dev` protegido | ✅ Completo |
| F5 | CI/CD + Cross-platform | Builds multi-plataforma, release automation | ✅ Completo |
| F5.5 | Publicación npm + bunx | Paquete npm @fisherk2-dev/codice, instalación vía bunx | ✅ Completo |
| F6 | Documentación | README, CHANGELOG, ADRs finales | ✅ Completo |
| F6.5 | Tech Debt + Coverage Gap Closure | VersionComparator refactor, pathResolver defense-in-depth, TECH_DEBT.md | ✅ Completo |
| FEV-1 a FEV-23 | Ver sección 3 | Issues críticos, SDD refactor, CI/CD, docs, agent packs, installer UX | ✅ Completo |
| FEV-24 | Nuevos comandos v2.1: `/sync`, `/migrate`, `/deploy`, `/analyze` + SDD plugin refactor | #68, #67, #64, #57 | ✅ Completo (2026-08-11) |
| FEV-25 | Reglas de delegación en agentes principales | #69 | ✅ Completo (2026-08-11) |
| FEV-26 | Quick Wins: Bug fixes + Security patches + Documentation | #79, TD-V2-70, TD-V2-90, TD-V2-91, TD-V2-93 | ✅ Completo (2026-08-20) |
| FEV-27 | Security & Observability: Plugin cleanup + Permissions + Backup safety | #80, #81, TD-V2-9, TD-V2-51 | ✅ Completo (2026-08-20) |
| FEV-28 | Infrastructure & Performance: CI SHA-pins Node 24 + VersionComparator cache | TD-V2-7, TD-V2-61 | ✅ 2026-08-21 (1935 tests) |
| FEV-29 | Migración `permission:`/`tools:` → `permissions:` (lista nativa V2) en los packs restantes de agentes (Opencode V2) | #91 | ✅ Completo (2026-09-22) — 349 archivos, 8 commits por pack |
| FEV-30 | Remoción del plugin SDD + warnings de deprecación ≤ 2.1.2 (Opencode Legacy) | #90 | 📋 Listo para planificarse — Alcance: por definir en planificación |

## 2. Fases Iniciales (F0 – F6.5)

| Fase | Descripción | Resultados Clave | Fecha |
|------|-------------|------------------|-------|
| **F0** | Preparación del entorno | TypeScript strict, Biome, Just, CI/CD matrix | 2026-06-15 |
| **F1** | Infraestructura base | BunFileSystem, GitHubRestClient, ClackPromptsAdapter | 2026-06-16 |
| **F2** | Dominio y servicios | FileMergeEngine, VersionComparator, Result type | 2026-06-16 |
| **F3** | CLI y use cases | main.ts, DI container, 3 modes, parse-args | 2026-06-16 |
| **F4** | E2E + CI | 6 escenarios, CI matrix, coverage ~89% | 2026-06-17 |
| **F4.5** | Workspace seguro | `--dest` flag, fixtures, ADR-005 | 2026-06-17 |
| **F4.6** | Code review post-F4 | TemplateResolver + AtomicStager extraídos, bugs críticos | 2026-06-17 |
| **F5** | CI/CD completo | Multi-platform builds, release automation | 2026-06-25 |
| **F5.5** | Publicación npm | @fisherk2-dev/codice, bunx support | 2026-06-25 |
| **F6** | Documentación | README, CHANGELOG, CONTRIBUTING, ARCHITECTURE | 2026-06-26 |
| **F6.5** | Tech debt closure | Coverage gaps cerrados, benchmarks, TECH_DEBT.md | 2026-06-26 |

**Métricas F0-F6.5:** 284 tests, 0 fail, 593 expects, coverage ~89%, 15/15 E2E

## 3. Fases Evolutivas (FEV-1 al presente)

Todas las fases evolutivas completadas y pendientes. Resumen por versión:

### v1.0.x (FEV-1 a FEV-5) Completado

| FEV | Objetivo | Issues | Resultado |
|-----|----------|--------|-----------|
| **FEV-1** | Issues críticos v1.0.5 | #6, #2, #3, #4, #5 | 382 tests, 6/6 E2E, ADR-007 |
| **FEV-2** | bunx template resolution | #8 | 382 tests, 6/6 E2E |
| **FEV-2-B** | Symlink post-install | #8 (root cause) | 419 tests, 8/8 E2E, ADR-008 |
| **FEV-2-C** | Gitignore post-install | #11 | 465 tests, 12/12 E2E, ADR-009 |
| **FEV-2-D** | Directory support + UX | .devin + optional menu | 472 tests, 14/14 E2E, ADR-010 |
| **FEV-3** | Update fix + GitHub API | standard overwrite, repo name | 476 tests, 15/15 E2E |
| **FEV-4** | SDD refactor + governance | #15 | 481 tests, 12 SDD commands |
| **FEV-5** | CI/CD + Wiki | #23, #25 | 487 tests, 98.13% coverage |

### v1.1.x (FEV-6 a FEV-10) Completado

| FEV | Objetivo | Issues | Resultado |
|-----|----------|--------|-----------|
| **FEV-6** | Quick config + docs | #27, #28 | 502 tests, 15/15 E2E |
| **FEV-7** | Agent governance + security | #26, #30 | 563 tests, 50+ restricted commands |
| **FEV-8** | Obsidian subagent | #21 | obsidian-vault-writer + 6 skills |
| **FEV-9** | MCP integration | #29 | 9 MCP servers, KNOWLEDGE chain |
| **FEV-10** | Code quality + deps | TD-1.1, 2.1, 3.1, 3.2, 5.3 | 581 tests, TS 6.x |

### v1.2.0 (FEV-11 a FEV-16) Completado

| FEV | Objetivo | Issues | Resultado |
|-----|----------|--------|-----------|
| **FEV-11** | Binary removal | #46 | npm-only distribution |
| **FEV-12** | References restructuring | #54, #52 | configurable references |
| **FEV-13** | Documentation overhaul | #51, #53 | SDD plugin auto-discovery |
| **FEV-14** | UX enhancements | #47, #56 | progress bar + /help |
| **FEV-15** | Community standards | #55 | Code of Conduct |
| **FEV-16** | Tech debt closure | TD-1.1, 2.1, 5.1, 5.2, 6.2 | 844 tests, 98.1% coverage |

### v2.0.0 (FEV-17 a FEV-23) Completado

| FEV | Objetivo | Resultado |
|-----|----------|-----------|
| **FEV-17** | Template restructuring | core/ + packs/ structure |
| **FEV-18** | Agent classification | 355 agents, 10 packs |
| **FEV-19** | Permission unification | 106 allow entries removed |
| **FEV-20** | Plugin cleanup | VALID_SUBAGENTS removed |
| **FEV-21** | Pack selection wizard | version gating, .codice-version v2.0 |
| **FEV-22** | Install summary screen | agent counts, pre-merge summary |
| **FEV-23** | Testing closure | 1920 tests, 30/30 E2E, v2.0.0 released |

**Métricas v2.0.0:** ~41h implementación, ~9h overhead (code reviews, wiki sync, release)

### v2.1.0 (FEV-24 y FEV-25 completos)

| FEV | Objetivo | Issues | Estado |
|-----|----------|--------|--------|
| **FEV-24** | Nuevos comandos: `/sync`, `/migrate` (opcional), `/deploy`, `/analyze` | #68, #67, #64, #57 | ✅ Completo (2026-08-07) |
| **FEV-25** | Reglas de delegación en agentes principales | #69 | ✅ Completo (2026-08-11) |

**Diagnósticos:** `docs/diagnosis/fix09` a `fix13`

**FEV-24 sub-fases:**
- **FEV-24-A /sync** — Bidirectional git sync (tlaloc) | Issue #68 | ✅ 2026-08-07
- **FEV-24-B /migrate** — Stack migration planner (quetzalcoatl, optional) | Issue #67 | ✅ 2026-08-07
- **FEV-24-C /deploy** — Git workflow + CI/CD (mictlantecuhtli) | Issue #64 | ✅ 2026-08-07
- **FEV-24-D /analyze** — Architectural analysis (quetzalcoatl) | Issue #57 | ✅ 2026-08-07
- **FEV-24 Docs** — CHANGELOG v2.1.0 + WORKFLOW + Wiki sync | — | ✅ 2026-08-07
- **FEV-24 Plugin** — COMMAND_PHASE_MAP + OQ-3 removal + SDD pipeline refactor | — | ✅ 2026-08-08
- **FEV-24 Integration** — Intent auto-discovery, command reference fixes, test consolidation | — | ✅ 2026-08-10
- **FEV-24 Review** — Bilingual intents (SPANISH_INTENT_KEYWORDS), stopwords extraction, spec update | — | ✅ 2026-08-11

**FEV-24 métricas finales:** 4 comandos nuevos, 17→17 commands, SDD plugin simplificado (INTENT_PATTERNS eliminado, auto-discovery), 2052 tests / 0 fail, 31/31 E2E, just check 0 errores

---

### v2.1.1

#### FEV-26: Quick Wins — Bug fixes + Security patches + Documentation

**Objetivo:** Resolver el bug crítico #79, parches de seguridad, y correcciones de metadata.
**Effort total:** 4-6h | **Riesgo:** Bajo | **Estado:** ✅ Completo (2026-08-20)

| ID | Item | Effort | Risk | Diagnóstico |
|----|------|--------|------|-------------|
| **#79** | `.codice-version` no escrito tras Clean Install | 2-3h | High | `fix14-clean-install-version-file.md` |
| **TD-V2-70** | Shell injection via `github.ref_name` | 0.5h | Medium | `fix17-shell-injection-github-ref-name.md` |
| **TD-V2-90** | Business pack agent count mismatch (92→91) | 0.5h | Low | `fix06-business-pack-agent-count.md` |
| **TD-V2-91** | Writers pack agent count mismatch (2→4) | 0.5h | Low | `fix07-writers-pack-agent-count.md` |
| **TD-V2-93** | Outdated comments in FileMergeEngine | 1h | Low | `fix10-outdated-comments-file-merge-engine.md` |

**Criterios de éxito:**
- Bug #79 resuelto: Clean Install escribe `.codice-version` con versión correcta
- Shell injection corregido: `release.yml` usa `$GITHUB_REF_NAME` en lugar de `${{ github.ref_name }}`
- Manifest actualizado: business pack (91 agentes), writers pack (4 agentes)
- Comentarios actualizados en `FileMergeEngine.ts`
- Tests: 2052+ pasando, coverage ≥95%

**Diagnósticos:** `fix14`, `fix17`, `fix20`, `fix24`, `fix23`

---

#### FEV-27: Security & Observability — Plugin cleanup + Permissions + Backup safety

**Objetivo:** Simplificar plugin SDD, gobernanza de directorios externos, mejorar seguridad de backups.
**Effort total:** 6-8h + code review | **Riesgo:** Medio | **Estado:** ✅ Completo (2026-08-21, code review hardened)

| ID | Item | Effort | Risk | Diagnóstico |
|----|------|--------|------|-------------|
| **#80** | Limpieza del plugin (solo bloqueo destructivo) | 3-4h | Medium | `fix15-plugin-cleanup.md` |
| **#81** | Permisos directorios externos (deny-by-default) | 1-2h | Medium | `fix16-external-directory-permissions.md` |
| **TD-V2-9** | SIGINT mid-commit backup overwrite | 2-3h | Low | `fix05-sigint-backup-overwrite.md` |
| **TD-V2-51** | Missing staging_cleanup event | 1h | Low | `fix09-missing-staging-cleanup-event.md` |

**Criterios de éxito:**
- Plugin simplificado: solo bloquea comandos destructivos
- `opencode.json` incluye `external_directory` con deny-by-default
- Backup safety: `AtomicStager` persiste rollback intent o documenta limitación
- Evento `staging_cleanup` emitido y visible en verbose mode
- Code review hardening: 1 Critical + 4 Important + 3 Suggestions aplicados
- Tests: 1935 tests, 31/31 E2E, 55/55 plugin integration, just check 0 errors

##### Resultados de code review (commit `a2964fd`)

| ID | Severidad | Hallazgo | Resolución |
|----|-----------|----------|------------|
| C1 | Critical | Plugin gate no leía `output.args.command` correctamente | `extractBashCommand` ahora lee `output.args.command` |
| I1 | Important | Tests no invocaban el hook real del plugin | 5 integration tests nuevos con `output.args.command` correcto |
| I2 | Important | Marker de backup no se limpiaba en fallo manejado | `AtomicStager` remueve marker en fallo manejado |
| I3 | Important | Patrones `rm -r -f` y `rm -f -r` no cubiertos | Añadidos a destructivePatterns |
| I4 | Important | Detección de huérfanos frágil (string matching) | Flag-based guard reemplaza string matching |
| S1 | Suggestion | Variante `staging_cleanup` muerta en ProgressCallback | Eliminada (evento se emite via VerboseLogger, no ProgressCallback) |
| S2 | Suggestion | Faltaban patrones staging/backup en gitignore | Añadidos a `template/estandar/gitignore` |

**Diagnósticos:** `fix15`, `fix16`, `fix19`, `fix21`

---

#### FEV-28: Infrastructure & Performance — CI/CD updates + Caching

**Objetivo:** Actualizar SHA-pins de GitHub Actions para Node 24, optimizar comparación de versiones.
**Effort total:** 2-3h | **Riesgo:** Bajo | **Estado:** ✅ Completo (2026-08-21)

| ID | Item | Effort | Risk | Diagnóstico |
|----|------|--------|------|-------------|
| **TD-V2-7** | Action SHA-pins force Node 24 (deprecated) | 1-2h | Low | `fix10-action-sha-pins-node24.md` |
| **TD-V2-61** | No caching for version comparison | 1h | Low | `fix09-no-caching-version-comparison.md` |

**Dependencias:** Ninguna — inicio limpio tras FEV-27 completo.

**Criterios de éxito:**
- CI/CD: SHA-pins actualizados a últimas versiones compatibles con Node 24
- `VersionComparator` cachea parsed semver objects
- Tests: 1935 tests, 31/31 E2E, 55/55 plugin integration, just check 0 errors
- CI matrix (Linux, macOS, Windows) sin warnings de Node 24 deprecation

**Diagnósticos:** `fix23`, `fix22`

---

#### Resumen de Fases v2.1.1

| Fase | Items | Effort Total | Risk | Prioridad |
|------|-------|--------------|------|-----------|
| FEV-26 | 5 items (1 bug + 4 TD) | 4-6h | Bajo | ✅ Completo |
| FEV-27 | 4 items (2 issues + 2 TD) + code review | 6-8h | Medio | ✅ Completo (code review hardened) |
| FEV-28 | 2 items (2 TD) | 2-3h | Bajo | ✅ Completo (2026-08-21) |
| **Total** | **11 items** | **12-17h** | — | — |

**Estrategia:** FEV-26 ✅ + FEV-27 ✅ (code review hardened) + FEV-28 ✅ completados. v2.1.1 released 2026-08-25 (1935 tests, 31/31 E2E, 55/55 plugin).

**Release v2.1.1:** Todas las fases completadas. Publish con dist-tag `latest` → `@fisherk2-dev/codice@2.1.1`.

#### Resumen v2.1.2 — Hotfix ✅ (2026-08-28)

| Item | Type | Description |
|------|------|-------------|
| docs-update delegation fix | Fix | Explicit `docs-writer` and `technical-writer` subagent references |
| Tech debt reorg | Chore | v2.1.2 debt → v2.1.3, v2.1.3 → v2.1.4 |

**Release v2.1.2:** Hotfix released 2026-08-28. Publish con dist-tag `latest` → `@fisherk2-dev/codice@2.1.2`.

### v2.1.3 (Hotfix Opencode V2 — FEV-29 ✅ Completado 2026-09-22 y FEV-30 📋 listo para planificarse)

> Deuda 2.1.x previamente planificada para v2.1.3 se recorre a v2.1.4 (ver TECH_DEBT.md). Alcance reservado para issues surgidas con Opencode V2.

| Item | Type | Issue | Description |
|------|------|-------|-------------|
| **FEV-29** | Fix | #91 | Migración completa `permission:`/`tools:` → `permissions:` (lista nativa V2) de los 349 archivos de agentes pendientes de `template/obligatorio/packs/` (8 packs, un commit por pack; main/ y writers/ ya eran nativos V2). Codemods `scripts/migrate-v1-to-v2-permissions.ts` + `scripts/migrate-all-packs.ts`, spec `spec-agent-format-v2.md` + tests de frontmatter + guard `tests/unit/quality/source-hygiene.test.ts`. Diagnósticos: `docs/diagnosis/fix28-subagent-delegation-kill-switch.md`, `docs/diagnosis/fix29-fase2-tools-key-and-nul-audit.md` |
| **FEV-30** | Removal | #90 | 📋 Listo para planificarse — Alcance: por definir en planificación. Base: remoción completa del plugin SDD (template, `.opencode/plugins/`, tests, specs/ADRs — no se migra a V2) + warnings de deprecación (versiones ≤ 2.1.2 solo Opencode Legacy). Diagnóstico: `docs/diagnosis/fix27-sdd-plugin-removal-v2-incompatibility.md` |

**Dependencias:** FEV-29 y FEV-30 son independientes entre sí. FEV-29 completado 2026-09-22 en `hotfix/opencode-v2-migrate` (migración a la lista nativa `permissions:` — 349 archivos — + reasignación de comandos). FEV-30 pendiente de planificación — Alcance: por definir en planificación.

**FEV-29 — Entregado (2026-09-22):**
- Codemod V1→V2 (`scripts/migrate-v1-to-v2-permissions.ts`) + bulk runner `scripts/migrate-all-packs.ts` (retirado tras completar los 8 packs).
- Auditoría `tools:`/NUL + claves `system:`/`disabled:` aceptadas; retiro del productor legacy `reformat-agent`.
- Simplificación (filtros de pack resueltos una vez, ramas muertas eliminadas, duplicados colapsados, freno `subagent "*": deny` dentro de la lista).
- Review-round: freno dentro de la lista, quote/validación action-effect, depth fail-loud, exit 2 en dry-run con errores, dedup CI (`just test` solo non-Linux).
- Gates verdes: salida migrada verificada limpia.

## 4. Estrategia de Pruebas por Fase

| Tipo | Alcance | Herramienta | Criterio de Éxito |
|------|---------|-------------|-------------------|
| Unitarias | Dominio (entities, services, types) | Bun test | 100% func lines |
| Integración | Adaptadores, Use Cases, CLI | Bun test | > 95% func/lines |
| E2E | 31 escenarios CLI en directorios aislados | bash + fixtures | 31/31 pasando |
| Packaging | Estructura del tarball npm | Bun test | 5/5 escenarios |
| Coverage | Cobertura general | bun test --coverage | ≥95% lines, ≥95% funcs |

## 5. Métricas de Progreso

### v2.0.0 (release final — 2026-08-07)

- **Tests totales:** 1920 tests, 0 fail
- **Tests E2E:** 30/30 pasando
- **Coverage:** 95.68% overall / 99.12% production `src/`
- **`just check`:** 0 errores
- **FEV-17 a FEV-23:** Todos completos
- **Esfuerzo total v2.0.0:** ~41h implementación + ~9h overhead (code reviews, wiki sync, release)

### v2.1.0 (FEV-24 y FEV-25 completos — 2026-08-12)

- **Tests totales:** 2052 tests, 0 fail
- **Tests E2E:** 31/31 pasando (v2.1 añadió escenario 31)
- **`just check`:** 0 errores (146 archivos)
- **Coverage:** ≥95% lines, ≥95% funcs (production `src/`)
- **FEV-24:** Completo (8 sub-fases: 4 commands + docs + plugin + integration + review)
- **FEV-25:** Completo — delegation protocol en 6 agentes principales (Issue #69)
- **SDD plugin:** INTENT_PATTERNS eliminado → auto-discovery + SPANISH_INTENT_KEYWORDS overlay
- **CI/CD:** Branch protection real (main/develop), SHA-pinned actions, PR/issue templates, npm provenance SLSA v1
- **Release:** v2.1.0-beta.1 publicado a npm (dist-tag beta), tag v2.1.0-beta.1

### Histórico de releases

| Release | Tests | E2E | Coverage | Fecha |
|---------|-------|-----|----------|-------|
| v1.0.3 | 343 | 6/6 | ~89% | 2026-06-16 |
| v1.0.11 | 476 | 15/15 | ~89% | 2026-06-26 |
| v1.0.14 | 487 | 15/15 | 98.13% | 2026-07-09 |
| v1.1.0 | 581 | 15/15 | 98.13% | 2026-07-10 |
| v1.2.0 | 844 | 15/15 | 98.1% | 2026-08-03 |
| v2.0.0 | 1920 | 30/30 | 95.68% | 2026-08-07 |
| v2.1.0-beta.1 | 2052 | 31/31 | ≥95% | 2026-08-12 |
| v2.1.1 | 1935 | 31/31 | ≥95% | 2026-08-25 |
| v2.1.2 | 1935 | 31/31 | ≥95% | 2026-08-28 |
