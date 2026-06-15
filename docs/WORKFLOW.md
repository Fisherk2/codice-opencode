# Plan de implementación – Códice v1.0.0
**Fecha:** 2026-06-15 | **Metodología:** TDD Iterativo

## 1. Visión de Fases

| Fase | Objetivo | Entregables | Estado |
|------|----------|-------------|--------|
| F0 | Preparación | entorno, convenciones, CI/CD | ✅ Completo |
| F1 | Infraestructura | BunFileSystem, GitHubRestClient, ClackPromptsAdapter | ✅ Completo |
| F2 | Núcleo/Dominio | FileMergeEngine, VersionComparator, Result type | ✅ Completo |
| F3 | Interfaces | CLI, DI, Use Cases, tests integración | ✅ Completo |
| F4 | Pruebas | E2E (6 escenarios), CI integration, coverage gaps | ✅ Completo |
| F5 | CI/CD + Cross-platform | Builds multi-plataforma, release automation | Pendiente |
| F6 | Documentación | README, CHANGELOG, ADRs finales | Pendiente |

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

## 3. Estrategia de Pruebas por Fase

| Tipo | Alcance | Herramienta | Criterio de Éxito |
|------|---------|-------------|-------------------|
| Unitarias | Dominio (entities, services, types) | Bun test | 100% func lines |
| Integración | Adaptadores, Use Cases, CLI | Bun test | > 90% func/lines |
| E2E | 6 escenarios binario compilado | bash + mock server | 6/6 pasando |
| Coverage | Cobertura general | bun test --coverage | > 88% lines, > 89% funcs |

## 4. Métricas de Progreso

- **Tests unit+int:** 279 tests, 0 fail, 578 expects
- **Tests E2E:** 6/6 pasando
- **Coverage:** 89.69% funciones / 88.41% líneas
- **Domain coverage:** 100% líneas
- **`just check`:** 0 errores
- **Binary:** compilado a dist/codice-linux (74MB ELF x64)
- **Fix rate:** 10+ bugs encontrados y corregidos durante desarrollo de E2E

## 5. Próximos Pasos (F5-F6)

- F5: Builds multi-plataforma (Windows/macOS), release automation, GitHub Releases
- F6: README completo, CHANGELOG, documentación de arquitectura
