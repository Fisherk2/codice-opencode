# Plan de implementación – [Producto] v[MVP]
**Fecha:** [YYYY-MM-DD] | **Autor:** [Nombre] | **Metodología:** [Agile/Iterativo]

## 1. Visión de Fases
| Fase | Objetivo | Entregables | Duración Estimada |
|------|----------|-------------|-------------------|

## 2. Desglose por Fase

### Fase 4 – Pruebas (E2E + CI + Coverage)

**Tareas:**

| ID | Descripción | Estado |
|----|-------------|--------|
| F4-T1 | Infraestructura E2E: common.sh, mock-server.ts | ✅ Completo |
| F4-T2 | Escenario E2E: Clean Install | ✅ Completo |
| F4-T3 | Escenario E2E: Project Install | ✅ Completo |
| F4-T4 | Escenario E2E: Optional Skip | ✅ Completo |
| F4-T5 | Escenario E2E: Update Workspace | ✅ Completo |
| F4-T6 | Escenario E2E: Atomic Rollback (SIGINT) | ✅ Completo |
| F4-T7 | Escenario E2E: Path Traversal | ✅ Completo |
| F4-T8 | Integración CI: step just test-e2e en workflow | ✅ Completo |
| F4-T9 | Coverage gaps: output.test.ts (0% → 100%) | ✅ Completo |

**Criterios de completitud (DoD):**
- ✅ `bun test`: 279 pass, 0 fail (578 expects)
- ✅ `just check`: 0 errors (biome ci + tsc --noEmit)
- ✅ E2E: 6/6 escenarios pasando
- ✅ Coverage: ~89.69% funciones, output.ts 100%
- ✅ Justfile con todas las recipes (check, test, build, test-e2e, etc.)
- ✅ CI integrado con paso just test-e2e en Linux

### Fase 4.5 – Workspace Seguro (`--dest` + `tests/fixtures/workspace/`)

**Problema:** `just dev` ejecuta el instalador con CWD=raíz del proyecto, sobrescribiendo la configuración real de OpenCode (`.opencode/`, `agents/`, `AGENTS.md`, etc.).

**Solución:** Añadir flag `--dest <path>` al CLI + crear `tests/fixtures/workspace/` como playground seguro + actualizar `just dev` para usarlo.

**Tareas:**

| ID | Descripción | Estado |
|----|-------------|--------|
| F45-T1 | Crear `tests/fixtures/workspace/.gitkeep` (gitignored, safe dev target) | ✅ Completo |
| F45-T2 | Añadir `--dest <path>` en `parse-args.ts` (value flag, consume next arg) | ✅ Completo |
| F45-T3 | Actualizar `main.ts`: `destination ?? process.cwd()` | ✅ Completo |
| F45-T4 | Actualizar `just dev`: `mkdir -p workspace && bun run ... --dest workspace` | ✅ Completo |
| F45-T5 | Agregar `workspace/` al `.gitignore` (excepto `.gitkeep`) | ✅ Completo |
| F45-T6 | Tests unitarios para `--dest` (5 casos: parsing, error, combinación) | ✅ Completo |
| F45-T7 | ADR-005 documentando la decisión arquitectónica | ✅ Completo |

**Criterios de completitud (DoD F4.5):**
- ✅ `bun test`: 284 pass, 0 fail (593 expects, +5 tests para `--dest`)
- ✅ `just check`: 0 errors (biome ci + tsc --noEmit)
- ✅ E2E: 6/6 pasando (sin regresión)
- ✅ Coverage: 94.96% funciones / 93.61% líneas (sin pérdida)
- ✅ `just dev` escribe en `tests/fixtures/workspace/`, no en la raíz
- ✅ ADR-005 creado en `specs/adr/adr-005-dest-flag-and-workspace.md`

### Fase 4.6 — Code Review + Refactor (F4/F4.5 post-review)

**Tareas:**

| ID | Descripción | Estado |
|----|-------------|--------|
| F46-T1 | Code review 5-ejes (Correctness, Readability, Architecture, Security, Performance) | ✅ Completo |
| F46-T2 | R1: Extraer `resolveNewVersion()` helper en `UpdateWorkspaceUseCase.ts` | ✅ Completo |
| F46-T3 | R2: Extraer `TemplateResolver.ts` de `BunFileSystem.ts` | ✅ Completo |
| F46-T4 | R2: Extraer `AtomicStager.ts` de `BunFileSystem.ts` | ✅ Completo |
| F46-T5 | R2: Refactorizar `BunFileSystem.ts` como fachada que compone ambas clases | ✅ Completo |
| F46-T6 | Formateo Biome + verificación completa (`bun test`, `just check`, E2E) | ✅ Completo |

**Criterios de completitud (DoD F4.6):**
- ✅ `bun test`: 284 pass, 0 fail, 593 expects (sin regresión)
- ✅ `just check`: 0 errors (biome ci + tsc --noEmit)
- ✅ E2E: 6/6 escenarios pasando (sin regresión)
- ✅ Coverage: 96.23% funciones / 94.26% líneas (↑ 1.27pp / 0.65pp)
- ✅ `BunFileSystem.ts` reducido de 412 → 115 líneas
- ✅ Todos los archivos de infraestructura < 200 líneas
- ✅ Commit `33f58b4` en `feat/installer-updater`

**Bugs encontrados y corregidos durante E2E:**
- `resolveTemplatePath()`: usa `fs.access()` en vez de `Bun.file().exists()`
- `stageFile()`: maneja directorios (walk recursivo)
- `walkDirectory()`: salta symlinks
- `FileRuleManifest`: eliminado `.opencode/config.json` inexistente
- `UpdateWorkspaceUseCase`: reglas standard → mandatory en update mode
- `main.ts` SIGINT: sale inmediatamente, sin race condition
- `ProjectInstallUseCase`: `--force` salta selección opcional
- `GitHubRestClient`/`constants`: `CODICE_GITHUB_API_URL` env var para mocking
- `set -e` en scripts E2E: patrón `|| EXIT_CODE=$?` para evitar errexit

### Fase 5 — CI/CD + Cross-platform (Builds multi-plataforma + Release automation)

**Tareas:**

| ID | Descripción | Estado |
|----|-------------|--------|
| F5-T1 | Cross-platform CI matrix (ubuntu/macos/windows) | ✅ Completo |
| F5-T2 | Upload artifacts on every CI run (platform-specific naming) | ✅ Completo |
| F5-T3 | `just build-all` recipe para cross-compile local (3 targets Bun) | ✅ Completo |
| F5-T4 | Release workflow: job build con matrix + job release descarga artifacts | ✅ Completo |
| F5-T5 | Release workflow: attach 3 binarios como assets del release | ✅ Completo |
| F5-T6 | Fix CHANGELOG extraction con fallback body si no hay sección | ✅ Completo |
| F5-T7 | Smoke test (--version, --help) para macOS/Windows en CI | ✅ Completo |

**Criterios de completitud (DoD F5):**
- ✅ `ci.yml` con 3-platform matrix, `just build` OS-aware, smoke test + artifact upload
- ✅ `just build-all` cross-compila 3 targets con Bun `--target=` flags (uno falla no detiene los demás)
- ✅ `release.yml` con `build` (matrix) → `release` (assets) pipeline
- ✅ CHANGELOG extraction con fallback body genérico si no se encuentra sección
- ✅ `bun test`: 284 pass, 0 fail, 593 expects (sin regresión)
- ✅ `just check`: 0 errors (biome ci + tsc --noEmit)
- ✅ E2E: 6/6 pasando
- ✅ Commits F5: `7d9c4df`, `15a1e92`, `828acc2`, `8682d3a`, `3b5ad76` en `feat/installer-updater`
- ✅ Commits F5 review fixes (2026-06-15): echo format normalization, Bun version env var consistency, action-gh-release SHA pinning

**Code review findings and corrections (2026-06-15):**
- R1: Formato echo normalizado entre `build` y `build-all` — ambos usan convención `===` en `Justfile`
- R2: Bun version unificada — `release.yml` ahora usa `env.BUN_VERSION` (consistente con `ci.yml`)
- R3: `softprops/action-gh-release` pineado a SHA commit `b4309332` con comentario `# v3` para supply-chain hardening

**Verificación tras correcciones:**
- ✅ `bun test`: 284 pass, 0 fail, 593 expects (sin regresión)
- ✅ `just check`: 0 errors (biome ci + tsc --noEmit)
- ✅ E2E: 6/6 pasando (sin regresión)
- ✅ Coverage sin pérdida, sin regresión en ningún test

## 3. Estrategia de Pruebas por Fase

| Tipo | Alcance | Herramienta | Criterio de Éxito |
|------|---------|-------------|-------------------|

## 4. Revisiones Técnicas Formales (FTRs)
| Gate | Artefacto a Revisar | Checklist | Participantes | Resultado |
|------|---------------------|-----------|---------------|-----------|

## 5. Gestión de Riesgos
| Riesgo | Probabilidad | Impacto | Mitigación | Contingencia |
|--------|--------------|---------|------------|--------------|

## 6. Métricas de Progreso
- Velocidad, lead time, defect density, cobertura:
- Definición de "Done" por capa (UI, lógica, datos, infra):

## 7. Cronograma y Hitos
- Diagrama de Gantt o tabla de hitos:
- Fechas de integración, UAT, release:

## 8. Control de Cambios y Lecciones Aprendidas