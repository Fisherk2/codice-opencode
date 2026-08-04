# Plan de implementación – Códice v1.0.0 → v2.0.0
**Fecha:** 2026-06-15 | **Última actualización:** 2026-08-04 (v2.0.0 planning: FEV-17 a FEV-23) | **Metodología:** TDD Iterativo

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
| FEV-13 | Documentation Overhaul (v1.2 Phase 3) | Issues #51, #53: actualizar docs, reducir acoplamiento SDD + quality infra | ✅ Completo |
| FEV-14 | UX Enhancements (v1.2 Phase 4) | Issues #47, #56: progress bar + comando /help | ✅ Completo |
| FEV-15 | Community Standards (v1.2 Phase 5) | Issue #55: CODE_OF_CONDUCT.md proyecto + template | ✅ Completo |
| FEV-16 | Pre-release Tech Debt Closure (v1.2 Phase 6) | TD-1.1, TD-2.1, TD-5.1, TD-5.2, TD-6.2 closure | ✅ Completo |
| FEV-17 | Template Directory Restructuring (v2.0 Phase 1) | `core/` + `packs/` restructure, FileRuleManifestData + TemplateResolver update | 🔲 Planificado |
| FEV-18 | Agent Classification & Migration (v2.0 Phase 2) | ~345 IDEAL agents → packs, 59 IMPROVABLE merged, 13 REDUNDANT removed | 🔲 Planificado |
| FEV-19 | Permission Unification & Subagent Table Removal (v2.0 Phase 3) | TD-V2-2, TD-V2-3, TD-V2-4: unified `task:` + docs update | 🔲 Planificado |
| FEV-20 | Plugin VALID_SUBAGENTS Removal (v2.0 Phase 4) | TD-V2-1, TD-V2-5: plugin cleanup + auto-discovery recursive scan | 🔲 Planificado |
| FEV-21 | Installer UX — Pack Selection & Version Detection (v2.0 Phase 5) | Pack wizard, version gating, `.codice-version` metadata format | 🔲 Planificado |
| FEV-22 | Installer UX — Updater with Pack Scoping (v2.0 Phase 6) | Option A (current packs) + Option B (add packs), CLI flags | 🔲 Planificado |
| FEV-23 | v2.0.0 Testing & Integration | Unit/integration/E2E updates for pack-aware installer | 🔲 Planificado |

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

### Fase FEV-13 — Documentation Overhaul (v1.2 Phase 3) ✅ Completo

**Fecha:** 2026-07-29 | **Issues:** #51 (Documentación desactualizada), #53 (Acoplamiento SDD plugin ↔ documentación)

#### Resultados

SDD plugin refactorizado con auto-discovery y configuración-driven behavior:

- **Auto-discovery (Pillar 1):** 6 hardcoded maps extraídos a `autoDiscovery.ts` — `COMMAND_AGENT_MAP`, `VALID_SUBAGENTS`, y `AGENT_MENTION_PATTERNS` ahora se detectan automáticamente desde el filesystem (`commands/*.md`, `agents/*.md`).
- **Config-driven (Pillar 2):** `INTENT_PATTERNS`, `COMMAND_PHASE_MAP`, `PHASE_SUGGESTIONS` movidos a configuración (opencode.json `sddPipeline` section), con defaults en `defaults.ts`.
- **Quality infrastructure (Pillar 3):** Biome extendido a directorios del plugin, Justfile targets añadidos (`check-plugin`, `test-plugin-unit`, `test-plugin-integration`), tests unitarios e integración creados.
- **Wiki rewrite:** 8 páginas del Wiki reescritas para usuarios finales — eliminadas referencias a "edit sdd-pipeline.ts", instrucciones simplificadas.
- **ADR-013:** Documenta la decisión de auto-discovery + config-driven para el plugin.
- **Documentation reduction (Issue #51):** WORKFLOW.md, CHANGELOG.md, SPEC.md bajo límites de líneas.

**Métricas finales:** 761 tests, 0 fail, `just check` 0 errores, 12 archivos modificados.

**Archivos clave:**
- `autoDiscovery.ts` (61→182 líneas) — filesystem scanning
- `destructivePatterns.ts` (nuevo) — DESTRUCTIVE_PATTERNS extraído
- `normalizeBash.ts` (nuevo) — bash normalization extraído
- `specs/adr/adr-013-plugin-auto-discovery.md` — ADR aceptado

---

### Fase FEV-14 — UX Enhancements (v1.2 Phase 4) ✅ Completo

**Fecha:** 2026-07-29 → 2026-07-30 | **Issues:** #47 (Progress bar), #56 (/help command)

#### Resultados

Progress bar implementado durante la instalación (modos Clean, Project, Update):
- `ProgressEvent` discriminated union (6 variantes) en capa Domain — zero external deps
- `ProgressCallback` opcional en `IFileMergeEngine.execute()` (backward compatible)
- `FileMergeEngine` pre-computa qué archivos serán staged para total preciso (barra siempre llega 100%)
- `ClackPromptsAdapter` implementa `clack.progress()` + `clack.log()` con eventos estructurados
- Callback `createProgressCallback()` extraído a `helpers.ts` (DRY — eliminó duplicación en 3 use cases)

Comando `/help` creado y asignado a Huitzilopochtli:
- 6 opciones interactivas vía question tool: discover Códice, start project, update workspace, learn SDD cycle, list all 13 commands, troubleshoot
- Registrado en `COMMAND_AGENT_MAP`, `INTENT_PATTERNS`, `COMMAND_PHASE_MAP`, `PHASE_SUGGESTIONS`
- Plugin auto-discovers `commands/help.md` via filesystem scanning (Pillar 1, FEV-13)

Spec/ADR templates actualizados a formatos industriales (MADR v4.0 + RFC-based).

**Code review (Tezcatlipoca):** 🔴 Critical: progress bar re-creation on every stage_start (fixed: barStarted flag); symlink/gitignore logs emitted BEFORE operations (fixed: moved to postInstall.ts). ⚠️ IMPORTANT: total included skipped files (fixed: pre-computed stageDecisions); premature log events DRY violation (fixed: moved to shared postInstall.ts); redundant completeProgress() calls (fixed: removed). 💡 SUGGESTIONS: inline import() types (fixed); JSDoc mismatch (fixed).

**Métricas finales:** 809 tests, 0 fail, 1727 expects, `just check` 0 errores, 12 warnings (pre-existing).

**Archivos clave:**
- `src/domain/types/ProgressEvent.ts` (nuevo) — discriminated union 6 variantes
- `src/domain/services/FileMergeEngine.ts` (actualizado) — pre-computación stageDecisions + emisión eventos
- `src/application/helpers.ts` (actualizado) — `createProgressCallback()` extraído (DRY)
- `src/application/postInstall.ts` (actualizado) — log events emitidos después de cada operación
- `template/obligatorio/commands/help.md` (nuevo) — /help command definition
- `template/obligatorio/.opencode/plugins/src/defaults.ts` (actualizado) — /help en 4 maps
- `tests/integration/use-cases/progress-flow.test.ts` (nuevo) — 9 tests de progress events
- `tests/integration/use-cases/progress-logs.test.ts` (nuevo) — 5 tests de structured logs
- `tests/integration/adapters/clack-prompts-progress.test.ts` (nuevo) — 7 tests de adapter

---

### Fase FEV-15 — Community Standards (v1.2 Phase 5) ✅ Completo

**Fecha:** 2026-07-30 | **Issue:** [#55](https://github.com/fisherk2/codice-opencode/issues/55) | **Esfuerzo:** ~1.5h

#### Resultados

Issue #55 resuelto — Code of Conduct para el proyecto y el template de workspace:

- **Project `CODE_OF_CONDUCT.md`** (root): Contributor Covenant v2.1, contacto `dev@fisherk2.com`, 7 secciones (Pledge, Standards, Enforcement Responsibilities, Scope, Enforcement, Enforcement Guidelines, Attribution).
- **Template `CODE_OF_CONDUCT.md`** (`template/estandar/`): Placeholder personalizable con 2 placeholders (`[PROJECT_NAME]`, `[CONTACT_EMAIL]`). Misma estructura que el proyecto.
- **Manifest integration (CRÍTICO):** `CODE_OF_CONDUCT.md` registrado en `FileRuleManifestData.ts` con `category: "standard"`. Sin este cambio, el template CoC nunca llegaría al destino.
- **Unit test:** Dos nuevos tests en `file-rule-manifest.test.ts`: verifica que `CODE_OF_CONDUCT.md` está en el manifest con `category: "standard"` e `isDirectory: false`.
- **Cross-references:** `CONTRIBUTING.md` ganó sección `## Code of Conduct` (antes de Quick Start); `README.md` ganó la misma sección (antes de License) con referencia al template.
- **E2E test:** `tests/e2e/01-clean-install.sh` extendido con 2 asserts (file exists + contenido `Our Pledge`).
- **Sin menciones en Wiki** (decisión del usuario — cobertura transitiva desde README/CONTRIBUTING).

#### Métricas Finales

| Métrica | Baseline (FEV-14) | FEV-15 |
|---------|-------------------|--------|
| Tests (pass/fail) | 809 / 0 | 810 / 0 |
| E2E scenarios | 19 / 19 | 19 / 19 (1 extended) |
| `just check` errores | 0 | 0 |
| Code of Conduct files | 0 | 2 (project + template) |
| Manifest entries (standard) | 10 | 11 |
| Issues resueltos | — | #55 |
| Files touched | — | 10 (2 new + 8 modified) |

---

### Fase FEV-16 — Pre-release Tech Debt Closure (v1.2 Phase 6) ✅ Completo

**Fecha:** 2026-07-30 | **Esfuerzo:** 24h

#### Resultados

FEV-16 cierra 5 items del TECH_DEBT.md preparados para v1.2.0 sin FEV registrado:

- **TD-1.1 (Coverage main.ts):** `resolveInteractiveMode()` extracted. 9 unit tests + 1 catch-block test. main.ts coverage 86.21% → 98.90%.
- **TD-2.1 (Template Method):** `InstallUseCaseBase` creada. CleanInstall 166→73, ProjectInstall 147→72 líneas (-168 líneas de duplicación).
- **TD-5.1 (Coverage instrumentation):** `c8` evaluado (incompatible con Bun/JSC). CI gate ≥95% nativo. Coverage overall 98.10%.
- **TD-5.2 (Benchmarks):** `just bench` con hyperfine. 3 scripts standalone + regression assertion (<10%).
- **TD-6.2 (Update granularity):** `diffTrees()` tree-level diff. 11 unit + 3 integration + 1 E2E test. E2E #16 passes.
Código simplificado: `stageOne()` extraído, `stagePlanner` total plegado, `walkRelative` helper, `resolveInteractiveMode` tipo retornado acotado. Code review post-FEV-16: `wrapMergeError()` para preservar contexto de fase/path en errores, `stageOne` retorna `Result` estándar, guardia de exhaustividad en `shouldStage`.

**7 commits atómicos**, 0 errores `just check`, 844 tests 0 fail.

#### Métricas

| Métrica | Baseline (FEV-15) | FEV-16 |
|---------|-------------------|--------|
| Tests (pass/fail) | 810 / 0 | 844 / 0 |
| E2E scenarios | 19 / 19 | 20 / 20 (scenario 16 new) |
| `just check` errores | 0 | 0 |
| Coverage (lines) | 97.0% | 98.1% |
| Coverage main.ts | 86.21% | 98.90% |
| TECH_DEBT items closed | 1 (Issue #55) | 5 (TD-1.1, 2.1, 5.1, 5.2, 6.2) |
| Performance benchmarks | 0 | 3 + regression assertion |
| Use case lines | 313 (Clean+Project) | 145 (+195 base = 340 total) |

---

### Estado del Pre-release v1.2.0 ✅ Listo para ajustes finales

**Fecha:** 2026-07-31 | **Tests:** 910+ pass / 0 fail | **Coverage:** 98.77% func / 97.84% line | **E2E:** 16/16 (06-path-traversal corregido)

Todos los FEV (FEV-11 a FEV-16) completados. Code review aplicado. Pre-release v1.2.0 listo para:
- Ajustes finales de documentación
- Validación en entorno CI completo
- Tag de pre-release (beta/rc) cuando el autor lo indique

---

## 5. Desglose por Fase evolutiva — v2.0.0 (Planificado)

> **Specs:** [spec-agent-packs.md](../specs/spec-agent-packs.md), [spec-installer-ux-v2.md](../specs/spec-installer-ux-v2.md)
> **ADRs:** [ADR-014](../specs/adr/adr-014-agent-pack-system.md), [ADR-015](../specs/adr/adr-015-installer-ux-v2.md)
> **Tech Debt:** [TECH_DEBT.md](./TECH_DEBT.md) — TD-V2-1 a TD-V2-5

### FEV-17 — Template Directory Restructuring 🔲
**Esfuerzo:** ~4h | **Dependencias:** ninguna | **Spec:** S5-PACKS §2
- Restructure `template/obligatorio/` → `core/` (infra: .opencode, commands, skills) + `packs/` (agentes)
- Mover agentes existentes a `packs/main/` (6 primarios) y `packs/writers/` (3 writers)
- Crear directorios vacíos para los 8 packs seleccionables
- Actualizar `FileRuleManifestData.ts` para nuevas rutas `core/` y `packs/`
- Actualizar `TemplateResolver` para resolver desde `core/` y `packs/<pack-id>/`
- Actualizar tests E2E para nueva estructura de directorios
**Resultado:** Template con estructura `core/` + `packs/` funcional. 0 regresiones E2E.

### FEV-18 — Agent Classification & Migration 🔲
**Esfuerzo:** ~8h | **Dependencias:** FEV-17 | **Spec:** S5-PACKS §3
- Formatear y mover ~345 agentes IDEAL desde `agency-agents-main/` a packs correspondientes
- Fusionar contenido de 59 agentes IMPROVABLE en agentes existentes
- Eliminar 13 agentes REDUNDANT (ya cubiertos por existentes)
- Cada agente: YAML frontmatter estándar + markdown body + bloque Composition
**Resultado:** ~345 agentes clasificados en 8 packs + 2 obligatorios (main, writers).

### FEV-19 — Permission Unification & Subagent Table Removal 🔲
**Esfuerzo:** ~3h | **Dependencias:** FEV-18 | **Spec:** S5-PACKS §4 | **Tech Debt:** TD-V2-2, TD-V2-3, TD-V2-4
- Unificar permisos `task:` de 4 agentes primarios → `"*": allow` + deny 5 primarios (huitzilopochtli, quetzalcoatl, tlaloc, mictlantecuhtli)
- Moctezuma y tezcatlipoca sin cambios (`task: "*": deny`)
- Eliminar secciones "AVAILABLE SUBAGENTS" de quetzalcoatl, tlaloc, mictlantecuhtli
- Actualizar CONTRIBUTING.md: eliminar paso "Update delegation tables" y "persona table updates"
- Actualizar Wiki Agents.md: eliminar "Step 4", actualizar modelo de permisos y conteo
**Resultado:** 4 agentes con permisos unificados, 3 archivos sin tablas redundantes, docs actualizados.

### FEV-20 — Plugin VALID_SUBAGENTS Removal 🔲
**Esfuerzo:** ~3h | **Dependencias:** FEV-19 | **Spec:** S5-PACKS §5 | **Tech Debt:** TD-V2-1, TD-V2-5
- Eliminar `VALID_SUBAGENTS` Set de `validSubagents.ts`; conservar `PRIMARY_AGENTS`
- Actualizar `defaults.ts` para eliminar referencias a VALID_SUBAGENTS
- Cambiar fallback en `sdd-pipeline.ts` de `DEFAULTS.VALID_SUBAGENTS` a `new Set(PRIMARY_AGENTS)`
- Actualizar mensajes de error: "VALID_SUBAGENTS catalog" → "agents/ directory"
- Actualizar tests en `defaults.test.ts`
- Actualizar auto-discovery para escanear recursivamente `packs/` subdirectorios
- Actualizar Wiki SDD-Pipeline.md (TD-V2-5)
**Resultado:** Plugin sin VALID_SUBAGENTS, auto-discovery recursivo en packs, tests actualizados.

### FEV-21 — Installer UX: Pack Selection & Version Detection 🔲
**Esfuerzo:** ~8h | **Dependencias:** FEV-17, FEV-18 | **Spec:** S6-UX-V2 §2, §3, §5
- Implementar detección de versión: parseo de `.codice-version` (JSON con `version`, `installedPacks`, `installedAt`)
- Bloquear opción Update para versiones <2.0.0 con mensajes apropiados (pre-1.2.0, 1.x, sin archivo)
- Implementar pantalla de pack selection (checkbox multiselect, software-development pre-seleccionado)
- Validación: mínimo 1 pack seleccionado
- Extender formato `.codice-version` con array `installedPacks`
- Actualizar CleanInstallUseCase y ProjectInstallUseCase con flujo de pack selection
- Agregar pantalla de installation summary antes de ejecutar
**Resultado:** Wizard de instalación con selección de packs, version gating, metadata persistente.

### FEV-22 — Installer UX: Updater with Pack Scoping 🔲
**Esfuerzo:** ~6h | **Dependencias:** FEV-21 | **Spec:** S6-UX-V2 §4, §7
- Option A: actualizar solo packs instalados (leer `installedPacks` de metadata, scope update)
- Option B: actualizar + agregar packs (packs instalados bloqueados, permitir seleccionar nuevos)
- Actualizar `UpdateWorkspaceUseCase` para scoping basado en metadata
- Nuevos CLI flags: `--packs <pack1,pack2>`, `--packs-all`, `--update-add-packs <pack1,pack2>`
**Resultado:** Updater con 2 opciones, scoping por metadata, 3 nuevos CLI flags funcionales.

### FEV-23 — v2.0.0 Testing & Integration 🔲
**Esfuerzo:** ~6h | **Dependencias:** FEV-17 a FEV-22 | **Spec:** S5-PACKS §9, S6-UX-V2 §9
- Actualizar unit tests para nueva estructura de directorios (`core/`, `packs/`)
- Actualizar integration tests para use cases pack-aware
- Nuevos escenarios E2E:
  - Clean Install con pack selection (default + custom)
  - Project Install con pack selection
  - Update bloqueado para versión <2.0.0 (3 variantes: sin archivo, pre-1.2.0, 1.x)
  - Update Option A (solo packs actuales)
  - Update Option B (agregar nuevos packs)
  - Persistencia de metadata `.codice-version` con `installedPacks`
  - Validación: mínimo 1 pack, `--packs` flag no-interactivo
**Resultado:** Suite completa para v2.0.0, 0 regresiones, coverage ≥95%.

---

## 6. Estrategia de Pruebas por Fase

| Tipo | Alcance | Herramienta | Criterio de Éxito |
|------|---------|-------------|-------------------|
| Unitarias | Dominio (entities, services, types) | Bun test | 100% func lines |
| Integración | Adaptadores, Use Cases, CLI | Bun test | > 90% func/lines |
| E2E | 6 escenarios binario compilado | bash + mock server | 6/6 pasando |
| Coverage | Cobertura general | bun test --coverage | > 88% lines, > 89% funcs |

## 7. Métricas de Progreso

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
- **v2.0.0 planificado:** FEV-17 a FEV-23 — Agent Pack System + Installer UX v2 (specs: S5-PACKS, S6-UX-V2)
- **Esfuerzo estimado v2.0.0:** ~38h (FEV-17: 4h, FEV-18: 8h, FEV-19: 3h, FEV-20: 3h, FEV-21: 8h, FEV-22: 6h, FEV-23: 6h)
