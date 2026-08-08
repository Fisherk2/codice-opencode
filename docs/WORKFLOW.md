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
| Integración | Adaptadores, Use Cases, CLI | Bun test | > 90% func/lines |
| E2E | 6 escenarios binario compilado | bash + mock server | 6/6 pasando |
| Coverage | Cobertura general | bun test --coverage | > 88% lines, > 89% funcs |

## 5. Métricas de Progreso

- **Tests unit+int:** 844 tests, 0 fail, 1806 expects
- **Tests E2E:** 20/20 pasando
- **Coverage:** 98.90% functions / 98.10% lines (domain: 100% lines)
- **`just check`:** 0 errores
- **Fix rate:** 10+ bugs encontrados y corregidos durante desarrollo E2E
- **Release ready:** v1.0.11 – 476/0 tests, 15/15 E2E, 0 Biome/tsc errors
- **Release ready:** v1.0.13 – 481/0 tests, 15/15 E2E, 12 SDD commands
- **Release ready:** v1.0.14 – 487/0 tests, 15/15 E2E, 98.13% coverage
- **v1.1.0 completado:** FEV-6, FEV-7, FEV-8, FEV-9, FEV-10 completados
- **v1.1.2 completado:** Pre-release verified, production release published
- **v1.1.3 completado:** Hotfix — EPERM on Windows CI, CONTRIBUTING.md simplified
- **FEV-11:** ✅ Completo — Binary Removal (Issue #46, npm-only distribution)
- **FEV-12:** ✅ Completado — References Restructuring (Issues #54, #52)
- **FEV-13:** ✅ Completo — Documentation Overhaul + SDD Decoupling (Issues #51, #53)
- **FEV-14:** ✅ Completo — UX Enhancements (Issues #47, #56) — 809 tests, 0 fail
- **FEV-15:** ✅ Completo — Community Standards (Issue #55) — 810 tests, 0 fail
- **FEV-16:** ✅ Completo — Pre-release Tech Debt Closure — 844 tests, 0 fail
- **v2.0.0 completo:** FEV-17 ✅, FEV-18 ✅, FEV-19 ✅ (2026-08-05), FEV-20 ✅ (2026-08-05), FEV-21 ✅ (2026-08-06), FEV-22 ✅ (2026-08-06), FEV-23 ✅ (2026-08-07) — **v2.0.0 released** (2026-08-07) (1920 tests, 30/30 E2E, coverage 95.68%)
- **Esfuerzo estimado v2.0.0:** ~50h (FEV-17: 7h ✅, FEV-18: 8h ✅, FEV-19: 3h ✅, FEV-20: 3h ✅, FEV-21: 8h ✅, FEV-22: 6h ✅, FEV-23: 6h ✅ = 41h de implementación + ~9h de overhead: code reviews 5-axis, wiki sync, release coordination)
