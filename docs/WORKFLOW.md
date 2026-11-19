# Plan de implementación – Códice v1.0.0 → v2.1.5
**Fecha:** 2026-06-15 | **Última actualización:** 2026-11-18 (v2.1.5-beta.1 **publicado** en dist-tag `beta` — release run 44443767080 success, 2027 tests, 31/31 e2e, tsc 0, lint 0; `latest` intacto en 2.1.4) | **Metodología:** TDD Iterativo

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
| FEV-30 | Remoción plugin SDD + banner Legacy + hardening review (5 ejes) | #90 | ✅ Completo (2026-09-22) — 20 commits, 1865 tests, 31/31 e2e |
| FEV-31 | Issues #111–#116 + reparación de referencias huérfanas + registro del payload fuera de alcance | #111 #112 #113 #114 #115 #116 | ✅ Completo (2026-11-17) — 2027 tests, 31/31 e2e |

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

| Versión | FEVs | Entregable clave | Resultado |
|---------|------|------------------|-----------|
| v1.0.x | FEV-1–5 | Issues críticos, resolución bunx, post-install symlink/gitignore, refactor SDD, CI/CD | 487 tests, 15/15 E2E, 98.13% coverage |
| v1.1.x | FEV-6–10 | Quick config, agent governance, Obsidian subagent, MCP, TypeScript 6.x | 581 tests, 15/15 E2E, 98.13% coverage |
| v1.2.0 | FEV-11–16 | Binary removal (npm-only), references, UX, community standards, debt closure | 844 tests, 15/15 E2E, 98.1% coverage |
| v2.0.0 | FEV-17–23 | Template packs, agent classification, permission unification, pack wizard, install summary | 1920 tests, 30/30 E2E, 95.68% overall / 99.12% src |
| v2.1.0 | FEV-24–25 | `/sync`, `/migrate`, `/deploy`, `/analyze` + agent delegation protocol | 2052 tests, 31/31 E2E, ≥95% coverage |
| v2.1.1 | FEV-26–28 | Bug #79, security patches, plugin cleanup, external permissions, CI Node 24, semver cache | 1935 tests, 31/31 E2E, ≥95% coverage |
| v2.1.2 | Hotfix (sin FEV) | docs-update delegation fix + debt reorganization | 1935 tests, 31/31 E2E, ≥95% coverage |
| v2.1.3-beta.1 | FEV-29–30 | Migración `permissions:` nativa V2 (349 archivos), remoción plugin SDD + banner legacy | 1865 tests, 31/31 E2E, ≥95% coverage |
| v2.1.5 | FEV-31 + pre-launch | Issues #111–#116, orphan references repaired, beta publicada en dist-tag `beta` | 2027 tests, 31/31 E2E, 96.95% coverage (local) |

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
| v2.1.3-beta.1 | 1865 | 31/31 | ≥95% | 2026-09-22 |
| v2.1.3 (estable) | 1959 | 31/31 | 96.39% | 2026-09-23 |
| v2.1.4 (hotfix, npm `latest`) | 1959 | 31/31 | ≥95% | 2026-09-25 |
| v2.1.5-beta.1 (publicado, dist-tag `beta`) | 2027 | 31/31 | 96.95% (local) | 2026-11-18 |
