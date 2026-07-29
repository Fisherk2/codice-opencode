# Plan de implementación – Códice v1.0.0 → v1.2.0
**Fecha:** 2026-06-15 | **Última actualización:** 2026-07-29 (FEV-12 ✅ Completo, FEV-13 📋 Spec creada, FEV-14 📋 Pendiente, FEV-15 📋 Pendiente) | **Metodología:** TDD Iterativo

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
| FEV-1 | Resolución de Issues Críticos (v1.0.5) | Issues #6, #2, #3, #4, #5 + Ship review fixes | ✅ Completo |
| FEV-2 | Resolución de Issues Críticos (v1.0.6) | Issue #8 (bunx template resolution) | ✅ Completo |
| FEV-2-B | Symlink post-install generation + review fixes | Issue #8 (symlink packaging root cause) | ✅ Completo |
| FEV-2-C | Gitignore post-install generation | Issue #11 (npm excludes .gitignore) | ✅ Completo |
| FEV-2-D | Directory support + Clean Install UX | `.devin` directory + optional files menu in Clean Install | ✅ Completo |
| FEV-3 | Update Workspace fix + GitHub API fix | Update mode preserves standard files + GitHub version check | ✅ Completo |
| FEV-4 | SDD Command Refactor + Governance (v1.0.13) | Issue #15: docs-update/, diagnosis/, evolve/ refactor, agent governance | ✅ Completo |
| FEV-5 | CI/CD Workflow + GitHub Wiki (v1.0.14) | Issue #23 (CI/CD workflow), Issue #25 (GitHub Wiki + eliminar docs/opencode/) | ✅ Completo |
| FEV-6 | Quick Configuration + Documentation (v1.1.0) | Issue #27 (steps), Issue #28 (SECURITY.md), TD-1.2 (coverage artifact) | ✅ Completo |
| FEV-7 | Agent Governance & Security Hardening | Issue #26 (system prompts), Issue #30 (command restrictions) | ✅ Completo |
| FEV-8 | Obsidian Subagent | Issue #21 (obsidian-vault-writer + 6 skills) | ✅ Completo |
| FEV-9 | MCP Server Integration | Issue #29 (5 MCP servers) | ✅ Completo |
| FEV-10 | Code Quality + Dependency Upgrades | TD-1.1, TD-2.1, TD-3.1, TD-3.2, TD-5.3 | ✅ Completo |
| FEV-11 | Binary Removal (v1.2 Phase 1) | Issue #46: eliminar binarios, solo npm/bunx | ✅ Completo |
| FEV-12 | References Restructuring (v1.2 Phase 2) | Issues #54, #52: referencias configurables vía opencode.json | ✅ Completo |
| FEV-13 | Documentation Overhaul (v1.2 Phase 3) | Issues #51, #53: actualizar docs, reducir acoplamiento SDD + quality infra | 📋 Spec creada |
| FEV-14 | UX Enhancements (v1.2 Phase 4) | Issues #47, #56: progress bar + comando /help | 📋 Pendiente |
| FEV-15 | Community Standards (v1.2 Phase 5) | Issue #55: CODE_OF_CONDUCT.md proyecto + template | 📋 Pendiente |

## 2. Desglose por Fase (Completadas)

### Fase 4 — Pruebas (E2E + CI + Coverage) ✅ Completo
E2E infrastructure + 7 escenarios (Clean Install, Project Install, Optional Skip, Update, Rollback SIGINT, Path Traversal) + CI integration + coverage gaps cerrados.
**Resultados:** 279 tests, 0 fail, 578 expects, 6/6 E2E, ~89.69% coverage.

### Fase 4.5 — Workspace Seguro (`--dest` + `tests/fixtures/workspace/`) ✅ Completo
`--dest <path>` flag en parse-args.ts + `tests/fixtures/workspace/` como playground + `just dev` escribe en workspace. ADR-005.
**Resultados:** 284 tests, 0 fail, 593 expects.

### Fase 4.6 — Code Review + Refactor (post-review) ✅ Completo
5-axis code review → TemplateResolver + AtomicStager extraídos de BunFileSystem (412→115 líneas). **Bugs encontrados:** resolveTemplatePath() fs.access→Bun.file(); stageFile() directory walk; walkDirectory() symlink skip; FileRuleManifest eliminó .opencode/config.json inexistente; UpdateWorkspaceUseCase standard→mandatory en update; main.ts SIGINT exit inmediato; ProjectInstallUseCase --force skip optional; GitHubRestClient CODICE_GITHUB_API_URL env var; E2E `set -e`→`|| EXIT_CODE=$?`.
**Resultados:** 284 tests, 0 fail, 96.23% func coverage.

### Fase 5 — CI/CD + Cross-platform ✅ Completo
CI matrix ubuntu/macos/windows + `just build-all` + release con binary assets + CHANGELOG extraction + smoke tests. **Code review fixes:** echo format normalization, Bun version env var consistency, action-gh-release SHA pinning.

### Fase 5.5 — Publicación npm + bunx ✅ Completo
package.json bin entry + TemplateResolver source mode + npm publish en release pipeline. **Problema conocido:** `bunx @fisherk2-dev/codice --version` sin output (bun 1.3.14 scoped package bug). Workaround: `bunx @fisherk2-dev/codice@latest` o `npx`.

### Fase 6 — Documentación ✅ Completo
README (Quick Install, 3 modos, Troubleshooting, CI/CD badge) + CHANGELOG (Security section) + ARCHITECTURE.md (ADR coverage table) + CONTRIBUTING.md (12 secciones).

### Fase 6.5 — Tech Debt + Coverage Gap Closure ✅ Completo
VersionComparator refactor + pathResolver defense-in-depth tests + ClackPromptsAdapter/WorkspaceVersion coverage + TECH_DEBT.md creado.

## 3. Desglose por Fase evolutiva

### Fase FEV-1 — Resolución de Issues Críticos (v1.0.5) ✅ Completo
**Fecha:** 2026-06-17 → 2026-06-25 | **Issues:** #6 (bunx), #2 (update overwrite), #3 (credenciales), #4 (enlaces), #5 (TECH_DEBT)
**Root causes:**
- **#6 (bunx):** `TemplateResolver.detectTemplateRoot()` solo 2 rutas; modo bunx necesita ruta desde `import.meta.dir`. Solución: añadir tercera ruta `../template/`.
- **#2 (update overwrite):** `buildUpdateRules()` convertía standard→mandatory, ignorando `destinationExists()`. Solución: no convertir standard rules en update mode.
- **#3 (credenciales):** Permisos solo incluían `.env`. Solución: añadir `.npmrc, .pem, *.key, *.p12, service-account*.json` a `permissions.read.deny`.
- **#4 (enlaces):** Documentos template con rutas relativas rotas tras reorganización en categorías.
- **#5 (TECH_DEBT):** No estaba en template. Solución: `template/estandar/TECH_DEBT.md`.
**Resultados:** 382 tests, 0 fail, 6/6 E2E, ADR-007. Ship review: 0/4 Critical → GO.

### Fase FEV-2 — Issue #8 bunx (v1.0.6) ✅ Completo
**Root cause:** `detectTemplateRoot()` en `src/infrastructure/adapters/` usaba `../../template` (debería ser `../../../template` por profundidad del adapter). Solución: ajustar ruta relativa.
**Resultados:** 382 tests, 0 fail, 6/6 E2E.

### Fase FEV-2-B — Symlink Post-Install Generation ✅ Completo
**Root cause:** npm tarballs strippen symlinks. 10 symlinks no existían en paquete npm. Solución: `ISymlinkCreator` port + `BunSymlinkCreator` + `SymlinkError` + generar symlinks post-instalación (Clean/Project Install, NO Update). ADR-008.
**Code review (10/10):** C1 (path containment), I1-I3 (docs, .devin/ validation, atomicity order), S1-S5 (test helpers, barrel export, ENOENT handling, coverage, CHANGELOG).
**Resultados:** 419 tests, 896 expects, 8/8 E2E.

### Fase FEV-2-C — Gitignore Post-Install Generation ✅ Completo
**Root cause #11:** npm excluye archivos `.gitignore` del tarball incluso en `package.json files`. Solución: renombrar `template/estandar/.gitignore`→`gitignore` + `IGitignoreCreator` port + `BunGitignoreCreator` + generar `.gitignore` post-instalación. ADR-009.
**Resultados:** 465 tests, 986 expects, 12/12 E2E. Ship review: 2 rounds GO.

### Fase FEV-2-D — Directory Support + Clean Install UX ✅ Completo
**Root causes: (1)** `.devin` es un directorio — `TemplateResolver` fallaba. Solución: detección de directorios + copia recursiva. **(2)** Clean Install no mostraba menú de opcionales (inconsistente con Project Install). Solución: mostrar menú en CleanInstallUseCase.
**Resultados:** 472 tests, 1009 expects, 14/14 E2E, ADR-010.

### Fase FEV-3 — Update fix + GitHub API fix ✅ Completo
**Root causes: (1)** `Bun.file().exists()` no funciona con directorios → standard dirs sobrescritos en Update. Solución: `fs.access()`. **(2)** `GITHUB_REPO = "11-codice-opencode"` (incorrecto; debía ser `"codice-opencode"`). Solución: corregir constant.
**Resultados:** 476 tests, 1032 expects, 15/15 E2E.

### Fase FEV-4 — SDD Command Refactor + Governance (v1.0.13) ✅ Completo
Issue #15: 5 problemas de gobernanza. Nuevos comandos: `docs-update/`, `diagnosis/`. Refactor: `evolve/` scope reducido. Gobernanza: Quetzalcoatl no escribe en `tasks/`, Moctezuma solo escribe en `tasks/`. Determinismo: cada comando SDD sugiere el siguiente paso.
**Resultados:** 481 tests, 12 SDD commands, 15/15 E2E.

### Fase FEV-5 — CI/CD Workflow + GitHub Wiki (v1.0.14) ✅ Completo
Issue #23: 3-stage pipeline (develop→test publish→main) + pre-release tags (beta/rc). Issue #25: GitHub Wiki habilitada, `docs/opencode/` eliminado (raíz + template), 74+ referencias actualizadas.
**Resultados:** 487 tests, 98.13% coverage, 15/15 E2E. Branches: main+develop. npm dist-tags: latest, beta, rc.

### Fase FEV-6 — Quick Configuration + Documentation (v1.1.0) ✅ Completo
Issue #27: steps para 6 agentes primarios. Issue #28: SECURITY.md (proyecto + template). TD-1.2: constructores explícitos en VersionComparator + ClackPromptsAdapter.
**Resultados:** 502 tests, 0 fail, 15/15 E2E.

### Fase FEV-7 — Agent Governance & Security Hardening ✅ Completo
Issue #26: no-assumption rule + question-tool en 6 agentes, delegation-first en 3. Issue #30: 50+ comandos destructivos restringidos en sdd-pipeline.ts + opencode.json.
**Code review (5/5):** I1 (tests conductuales insuficientes → +33 tests); I2 (`export PATH=` regex refinado); S1-S3 (README count, `[existing]` convention, `chmod 777` redundante eliminado).
**Resultados:** 563 tests, 1204 expects, 50+ restricted commands.

### Fase FEV-8 — Obsidian Subagent ✅ Completo
Issue #21: subagente `obsidian-vault-writer` (solo Huitzilopochtli) + 6 Obsidian/Markdown skills. Catálogo + tablas delegación + VALID_SUBAGENTS actualizados.

### Fase FEV-9 — MCP Server Integration ✅ Completo
Issue #29: +5 MCPs (9 total: Tavily, Firecrawl, Vercel Grep, GitMCP, etc.). KNOWLEDGE chain actualizada en 6 agentes: `Context7`→`MCP servers → Web search → Question-tool`.
**Resultados:** 563 tests, 9 MCPs configurados (3 enabled default).

### Fase FEV-10 — Code Quality + Dependency Upgrades ✅ Completo
TD-2.1: IFileSystem split (IFileSystem 6 + IStagingSystem 4). TD-1.1: main.ts 33%→86.21% coverage. TD-5.3: 5 npm packaging tests. TD-3.1: TS 5.9.3→6.0.3.
**Code review (Tezcatlipoca):** 🔴 Critical: biome.json tabs→spaces revertido. ⚠️ I1 (test cleanup try/finally), I2 (env var restore), I3 (EACCES branching). 💡 S4-S5 (exit codes, comments).
**Resultados:** 581 tests, 1245 expects, 6 items completados.

### Fase FEV-11 — Binary Removal (v1.2 Phase 1) ✅ Completo
Issue #46: Binarios eliminados (74MB→0MB). `just build/build:all/release` eliminados. CI/CD sin build steps. README/CONTRIBUTING/SPEC actualizados.
**Resultados:** 593 tests, 0 fail. Solo distribución npm/bunx.

### Fase FEV-12 — References Restructuring (v1.2 Phase 2) ✅ Completo
Issues #54, #52: references configurables vía `opencode.json` + auto-discovery. Directorio `references/` opcional. Wiki documenta configuración.
**Resultados:** Mergeado a develop, sin regresión.

---

### Fase FEV-13 — Documentation Overhaul (v1.2 Phase 3) 📋 Spec creada — Listo para planificación

#### Contexto

Issues #51 y #53 identifican problemas de documentación:
- **Issue #51:** Documentación desactualizada en `docs/` y `template/estandar/docs/` (README.md y CONTRIBUTING.md excluidos por estar bien documentados)
- **Issue #53:** Acoplamiento excesivo entre el plugin SDD (`sdd-pipeline.ts`) y la documentación al añadir comandos, agentes y skills

**Propuesta:** Refactorizar la documentación para reducir acoplamiento y actualizar contenido desactualizado.

#### Plan de Implementación

| ID | Descripción | Archivo | Estado |
|----|-------------|---------|--------|
| FEV13-T1 | Actualizar documentación en `docs/` (excluyendo README.md y CONTRIBUTING.md) | `docs/` | 📋 Pendiente |
| FEV13-T2 | Actualizar documentación en `template/estandar/docs/` | `template/estandar/docs/` | 📋 Pendiente |
| FEV13-T3 | Reducir acoplamiento SDD plugin ↔ documentación | `sdd-pipeline.ts` | 📋 Pendiente |
| FEV13-T4 | Implementar auto-discovery para comandos/agentes/skills | `sdd-pipeline.ts` | 📋 Pendiente |
| FEV13-T5 | Tests para auto-discovery | `tests/` | 📋 Pendiente |
| FEV13-T6 | Documentar cambios en Wiki | `docs/wiki-source/` | 📋 Pendiente |
| FEV13-T7 | Implement auto-discovery for COMMAND_AGENT_MAP (scan commands/*.md frontmatter) | `sdd-pipeline.ts` | 📋 Pendiente |
| FEV13-T8 | Implement auto-discovery for VALID_SUBAGENTS (scan agents/*.md filenames) | `sdd-pipeline.ts` | 📋 Pendiente |
| FEV13-T9 | Move INTENT_PATTERNS, COMMAND_PHASE_MAP, PHASE_SUGGESTIONS to opencode.json sddPipeline config | `sdd-pipeline.ts`, `opencode.json` | 📋 Pendiente |
| FEV13-T10 | Extend Biome config to include plugin directories | `biome.json`, `Justfile` | 📋 Pendiente |
| FEV13-T11 | Create plugin unit tests (normalizeBash, destructivePatterns, autoDiscovery, configLoading) | `tests/plugin/unit/` | 📋 Pendiente |
| FEV13-T12 | Create plugin integration tests (chatMessage, toolExecuteBefore, systemTransform) | `tests/plugin/integration/` | 📋 Pendiente |
| FEV13-T13 | Create ADR-013 documenting plugin auto-discovery decision | `specs/adr/adr-013-plugin-auto-discovery.md` | 📋 Pendiente |

#### Métricas de Referencia

| Métrica | v1.1.3 (actual) | Meta v1.2.0-FEV13 |
|---------|-----------------|-------------------|
| Tests (pass/fail) | 596 / 0 | ≥596 / 0 |
| Archivos docs actualizados | 0 | ~20+ |
| `just check` errores | 0 | 0 |

**Criterios de completitud (DoD FEV-13):**
- [ ] Issues #51 y #53 resueltos
- [ ] Documentación `docs/` actualizada (excluyendo README.md, CONTRIBUTING.md)
- [ ] Documentación `template/estandar/docs/` actualizada
- [ ] SDD plugin con auto-discovery (sin maps hardcodeados)
- [ ] Auto-discovery: adding a command in commands/ is detected without editing sdd-pipeline.ts
- [ ] Auto-discovery: adding an agent in agents/ is accepted by task() validation without editing sdd-pipeline.ts
- [ ] Config: INTENT_PATTERNS, COMMAND_PHASE_MAP, PHASE_SUGGESTIONS configurable via opencode.json
- [ ] Plugin passes Biome lint with zero errors
- [ ] Plugin has >80% test coverage
- [ ] Plugin file reduced from 665 to <400 lines
- [ ] ADR-013 documented
- [ ] `bun test`: sin regresión
- [ ] `just check`: 0 errores

---

### Fase FEV-14 — UX Enhancements (v1.2 Phase 4) 📋 Pendiente

#### Contexto

Issues #47 y #56 identifican mejoras de UX:
- **Issue #47:** Falta barra de progreso durante la instalación/actualización del workspace
- **Issue #56:** Falta un comando `/help` para onboarding de usuarios nuevos

**Propuesta:** Implementar barra de progreso con feedback de archivos y crear comando `/help` asignado a Huitzilopochtli.

#### Plan de Implementación

| ID | Descripción | Archivo | Estado |
|----|-------------|---------|--------|
| FEV14-T1 | Añadir progress callback a `IFileMergeEngine` | `src/domain/ports/IFileMergeEngine.ts` | 📋 Pendiente |
| FEV14-T2 | Implementar progress reporting en `FileMergeEngine.execute()` | `src/domain/services/FileMergeEngine.ts` | 📋 Pendiente |
| FEV14-T3 | Añadir progress bar rendering a `ClackPromptsAdapter` | `src/infrastructure/adapters/ClackPromptsAdapter.ts` | 📋 Pendiente |
| FEV14-T4 | Conectar progress callback desde use cases al TUI adapter | `src/application/use-cases/*.ts` | 📋 Pendiente |
| FEV14-T5 | Tests para progress bar | `tests/integration/` | 📋 Pendiente |
| FEV14-T6 | Crear archivo de comando `/help` | `template/obligatorio/commands/help.md` (nuevo) | 📋 Pendiente |
| FEV14-T7 | Añadir `/help` a `COMMAND_AGENT_MAP` en sdd-pipeline.ts | `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` | 📋 Pendiente |
| FEV14-T8 | Añadir `/help` a `INTENT_PATTERNS` en sdd-pipeline.ts | Mismo archivo | 📋 Pendiente |
| FEV14-T9 | Actualizar Wiki Commands.md con documentación de `/help` | `docs/wiki-source/Commands.md` | 📋 Pendiente |
| FEV14-T10 | Actualizar README.md sección de comandos | `README.md` | 📋 Pendiente |

#### Métricas de Referencia

| Métrica | v1.1.3 (actual) | Meta v1.2.0-FEV14 |
|---------|-----------------|-------------------|
| Tests (pass/fail) | 596 / 0 | ≥596 / 0 |
| Comandos SDD | 12 | 13 (+/help) |
| `just check` errores | 0 | 0 |

**Criterios de completitud (DoD FEV-14):**
- [ ] Issues #47 y #56 resueltos
- [ ] Progress bar muestra durante instalación (modos Clean, Project, Update)
- [ ] Progress muestra: archivo actual, archivos procesados, total, porcentaje, tiempo estimado
- [ ] Comando `/help` creado con frontmatter correcto
- [ ] `/help` asignado a Huitzilopochtli
- [ ] `/help` registrado en `COMMAND_AGENT_MAP` e `INTENT_PATTERNS`
- [ ] `/help` ofrece 6 opciones vía question tool
- [ ] Wiki Commands.md actualizado
- [ ] `bun test`: sin regresión
- [ ] `just check`: 0 errores

---

### Fase FEV-15 — Community Standards (v1.2 Phase 5) 📋 Pendiente

#### Contexto

Issue #55 identifica la falta de un Code of Conduct para el proyecto y el template.

**Propuesta:** Añadir `CODE_OF_CONDUCT.md` al proyecto (Contributor Covenant v2.1) y al template (placeholder personalizable).

#### Plan de Implementación

| ID | Descripción | Archivo | Estado |
|----|-------------|---------|--------|
| FEV15-T1 | Crear `CODE_OF_CONDUCT.md` para el proyecto | `CODE_OF_CONDUCT.md` (nuevo) | 📋 Pendiente |
| FEV15-T2 | Crear `template/estandar/CODE_OF_CONDUCT.md` placeholder | `template/estandar/CODE_OF_CONDUCT.md` (nuevo) | 📋 Pendiente |
| FEV15-T3 | Actualizar README.md con referencia al Code of Conduct | `README.md` | 📋 Pendiente |
| FEV15-T4 | Actualizar CONTRIBUTING.md con referencia al Code of Conduct | `CONTRIBUTING.md` | 📋 Pendiente |

#### Métricas de Referencia

| Métrica | v1.1.3 (actual) | Meta v1.2.0-FEV15 |
|---------|-----------------|-------------------|
| Tests (pass/fail) | 596 / 0 | ≥596 / 0 |
| Code of Conduct | 0 | 2 (proyecto + template) |
| `just check` errores | 0 | 0 |

**Criterios de completitud (DoD FEV-15):**
- [ ] Issue #55 resuelto
- [ ] `CODE_OF_CONDUCT.md` creado para el proyecto (Contributor Covenant v2.1)
- [ ] `template/estandar/CODE_OF_CONDUCT.md` creado como placeholder
- [ ] README.md referencia al Code of Conduct
- [ ] CONTRIBUTING.md referencia al Code of Conduct
- [ ] `bun test`: sin regresión
- [ ] `just check`: 0 errores

---

## 4. Estrategia de Pruebas por Fase

| Tipo | Alcance | Herramienta | Criterio de Éxito |
|------|---------|-------------|-------------------|
| Unitarias | Dominio (entities, services, types) | Bun test | 100% func lines |
| Integración | Adaptadores, Use Cases, CLI | Bun test | > 90% func/lines |
| E2E | 6 escenarios binario compilado | bash + mock server | 6/6 pasando |
| Coverage | Cobertura general | bun test --coverage | > 88% lines, > 89% funcs |

## 5. Métricas de Progreso

- **Tests unit+int:** 596 tests, 0 fail, 1289 expects
- **Tests E2E:** 15/15 pasando
- **Coverage:** 98.89% funciones / 96.98% líneas (domain: 100% líneas)
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
- **FEV-13:** 📋 Spec creada — Documentation Overhaul + SDD Decoupling (Issues #51, #53)
- **FEV-14:** 📋 Pendiente — UX Enhancements (Issues #47, #56)
- **FEV-15:** 📋 Pendiente — Community Standards (Issue #55)
