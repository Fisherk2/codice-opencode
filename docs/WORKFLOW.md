# Plan de implementación – Códice v1.0.0 → v2.0.0
**Fecha:** 2026-06-15 | **Última actualización:** 2026-08-07 (v2.0.0 released) | **Metodología:** TDD Iterativo

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

## 4. Estrategia de Pruebas por Fase

| Tipo | Alcance | Herramienta | Criterio de Éxito |
|------|---------|-------------|-------------------|
| Unitarias | Dominio (entities, services, types) | Bun test | 100% func lines |
| Integración | Adaptadores, Use Cases, CLI | Bun test | > 95% func/lines |
| E2E | 30 escenarios CLI en directorios aislados | bash + fixtures | 30/30 pasando |
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

### Histórico de releases

| Release | Tests | E2E | Coverage | Fecha |
|---------|-------|-----|----------|-------|
| v1.0.3 | 343 | 6/6 | ~89% | 2026-06-16 |
| v1.0.11 | 476 | 15/15 | ~89% | 2026-06-26 |
| v1.0.14 | 487 | 15/15 | 98.13% | 2026-07-09 |
| v1.1.0 | 581 | 15/15 | 98.13% | 2026-07-10 |
| v1.2.0 | 844 | 15/15 | 98.1% | 2026-08-03 |
| v2.0.0 | 1920 | 30/30 | 95.68% | 2026-08-07 |
