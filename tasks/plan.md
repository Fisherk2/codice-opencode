# Plan: F4 – Pruebas (Unitarias, Integración y E2E)

**Fecha:** 2026-06-14 | **Autor:** Fisherk2 | **Estado:** 🟢 Listo para Implementar

## Overview

Implementar la fase de pruebas completa: scripts E2E que compilan el binary, lo ejecutan en directorios temporales aislados, y validan el comportamiento real. También cerrar gaps de coverage y wirear E2E en CI.

**Goal:** Todos los tests E2E pasan en CI, coverage >90% overall, Gate 4 aprobado.

---

## Estado Actual

| Artefacto | Estado | Detalle |
|-----------|--------|---------|
| Unit + Integration tests | ✅ | 269 tests passing |
| E2E scripts | ❌ | `tests/e2e/` vacío — 0 scripts |
| `just test-e2e` | ⚠️ | Existe en Justfile pero llama script inexistente |
| CI E2E step | ❌ | No corre E2E en GitHub Actions |
| Coverage | ✅ | 89.69% functions / 88.36% lines (>80%) |
| VersionComparator coverage | ⚠️ | 80% functions (test gap: pre-release versions) |
| ClackPromptsAdapter coverage | ⚠️ | 86.67% functions (test gap: promptForMode cancel) |
| output.ts coverage | ❌ | 0% functions (sin tests) |

---

## Architecture Decisions

| # | Decision | Rationale |
|---|----------|------------|
| F4-A1 | E2E usa `bash` puro | SPEC.md §Phase 3 pide `bash`/`zx`; bash puro evita dependencia adicional |
| F4-A2 | Mock server HTTP con Bun `serve` API | Puerto fijo `localhost:4567`, responde `{"tag_name":"v1.0.0"}`, retorna PID |
| F4-A3 | Binary compilado una vez al inicio del runner | `just test-e2e` compila; todos los tests usan `dist/codice-*` |
| F4-A4 | Temp dirs con `mktemp -d` + `trap` cleanup | Garantiza isolation y cleanup automático en EXIT |
| F4-A5 | 6 escenarios E2E completos | Clean Install, Project Selective, Optional Skip, Update, Rollback, Path Traversal |
| F4-A6 | Optional Skip: fuerza + interactivo piped | `--force` no copia opcionales; sin `--force` pipea input que deselecciona todos |

---

## Dependency Graph

```
F4-T1: E2E lib (common.sh)          ← base para todos
F4-T2: Clean Install E2E             ← depende de T1
F4-T3: Project Install E2E           ← depende de T1
F4-T4: Project Optional Skip E2E     ← depende de T1
F4-T5: Update Workspace E2E          ← depende de T1 + mock server
F4-T6: Atomic Rollback E2E           ← depende de T1
F4-T7: Path Traversal E2E            ← depende de T1
F4-T8: CI Integration                ← depende de T2-T7
F4-T9: Coverage gaps                 ← independiente, paralelo con T8
```

---

## Task List

### Phase 1: E2E Infrastructure

#### Task F4-T1: E2E shared library (`tests/e2e/common.sh`)

**Descripción:** Script de utilidades compartido por todos los E2E tests. Provee: binary path resolution, temp dir creation con trap cleanup, assertion helpers, mock server startup/shutdown.

**Acceptance criteria:**
- [ ] `setup_temp_dir()` — crea `mktemp -d`, registra trap para cleanup en EXIT
- [ ] `assert_file_exists(dir, path)` — falla si `$dir/$path` no existe
- [ ] `assert_file_missing(dir, path)` — falla si `$dir/$path` existe
- [ ] `assert_exit_code(cmd, expected)` — falla si exit code no coincide
- [ ] `assert_contains(file, substring)` — falla si substring no está en file
- [ ] `start_mock_server()` — inicia Bun serve en puerto 4567, responde `{"tag_name":"v1.0.0"}`, retorna PID
- [ ] `stop_mock_server(pid)` — mata el proceso mock
- [ ] `CODICE_BINARY` resolved from `dist/codice-*`
- [ ] Todos los E2E scripts hacen `set -e` y `source common.sh`

**Verification:**
- [ ] `bash -n tests/e2e/common.sh` → sin errores de sintaxis
- [ ] `source tests/e2e/common.sh && start_mock_server && curl localhost:4567 && stop_mock_server $!` → mock responde JSON

**Dependencies:** Ninguna

**Files touched:**
- `tests/e2e/common.sh` — nuevo

**Estimated scope:** S

---

### Phase 2: E2E Scenarios

#### Task F4-T2: Clean Install E2E (`tests/e2e/01-clean-install.sh`)

**Descripción:** Scenario 1 de SPEC.md. Ejecuta el binary en directorio vacío con `--clean --force`, verifica que todos los archivos del template aparezcan en destino.

**Acceptance criteria:**
- [ ] Crea temp dir vacío
- [ ] Ejecuta `codice --clean --force`
- [ ] Verifica `.codice-version` existe y es JSON válido con `installedVersion`
- [ ] Verifica archivos de `template/obligatorio/` fueron copiados (≥5)
- [ ] Verifica archivos de `template/estandar/` fueron copiados (≥5)
- [ ] Verifica archivos de `template/opcional/` fueron copiados
- [ ] Exit code = 0
- [ ] Cleanup automático via trap

**Verification:**
- [ ] `just test-e2e` → test pasa
- [ ] Mismo test en Ubuntu CI runner pasa

**Dependencies:** F4-T1 ✅

**Files touched:**
- `tests/e2e/01-clean-install.sh` — nuevo

**Estimated scope:** M

---

#### Task F4-T3: Project Install Selective E2E (`tests/e2e/02-project-install.sh`)

**Descripción:** Scenario 2 de SPEC.md. Pre-pobla destino con archivo existente en `template/estandar/`, ejecuta `--project --force`, verifica que el archivo pre-existente es preservado.

**Acceptance criteria:**
- [ ] Crea temp dir con `docs/README.md` pre-existente (que también existe en template/estandar/)
- [ ] Guarda contenido original de `docs/README.md`
- [ ] Ejecuta `codice --project --force`
- [ ] Verifica que `docs/README.md` **preserva** contenido original (no fue sobreescrito)
- [ ] Verifica que otros archivos Obligatorio + Estandar sí fueron copiados
- [ ] Exit code = 0

**Verification:**
- [ ] `just test-e2e` → test pasa

**Dependencies:** F4-T1 ✅

**Files touched:**
- `tests/e2e/02-project-install.sh` — nuevo

**Estimated scope:** M

---

#### Task F4-T4: Project Install Optional Skip E2E (`tests/e2e/03-optional-skip.sh`)

**Descripción:** Scenario 3 de SPEC.md. Verifica que `--force` no copia opcionales y que sin `--force` piped input puede deseleccionarlos.

**Acceptance criteria:**
- [ ] Ejecuta `codice --project --force` (non-interactive)
- [ ] Verifica que ningún archivo de `template/opcional/` fue copiado
- [ ] Verifica que Obligatorio + Estandar sí fueron copiados
- [ ] Ejecuta `codice --project` (sin force) con input piped que presiona Enter (acepta defaults = nada seleccionado)
- [ ] Verifica que opcionales no fueron copiados
- [ ] Exit code = 0 en ambos casos

**Verification:**
- [ ] `just test-e2e` → test pasa

**Dependencies:** F4-T1 ✅

**Files touched:**
- `tests/e2e/03-optional-skip.sh` — nuevo

**Estimated scope:** M

---

#### Task F4-T5: Update Workspace E2E (`tests/e2e/04-update-workspace.sh`)

**Descripción:** Scenario 4 de SPEC.md. Pre-pobla con `.codice-version` antiguo, mock server devuelve `v1.0.0`, verifica que solo Obligatorio + Estandar se actualizan (Opcional preservado).

**Acceptance criteria:**
- [ ] Crea temp dir con `.codice-version` = `{"installedVersion":"0.9.0","installedAt":"...","optionalSelections":[]}`
- [ ] Crea archivos opcionales pre-existentes en destino
- [ ] Inicia mock server en puerto 4567
- [ ] Ejecuta `GITHUB_API_BASE=http://localhost:4567 codice --update --force`
- [ ] Verifica `.codice-version` actualizado a `1.0.0`
- [ ] Verifica Obligatorio fueron copiados
- [ ] Verifica Estandar fueron copiados
- [ ] Verifica Opcional **no fueron tocados** (ni creados ni modificados)
- [ ] Stop mock server
- [ ] Exit code = 0

**Verification:**
- [ ] `just test-e2e` → test pasa

**Dependencies:** F4-T1 ✅

**Files touched:**
- `tests/e2e/04-update-workspace.sh` — nuevo

**Estimated scope:** M

---

#### Task F4-T6: Atomic Rollback E2E (`tests/e2e/05-atomic-rollback.sh`)

**Descripción:** Scenario 5 de SPEC.md. Envía `kill -9` (SIGKILL) durante operación, verifica destino intacto y staging limpio.

**Acceptance criteria:**
- [ ] Crea temp dir vacío
- [ ] Ejecuta `codice --clean` en background, guarda PID
- [ ] Espera 200ms para que el proceso empiece a escribir staging
- [ ] Envía `kill -9 $PID`
- [ ] Verifica que destino **no tiene archivos nuevos**
- [ ] Verifica que no hay staging directory leftover
- [ ] Cleanup del temp dir

**Verification:**
- [ ] `just test-e2e` → test pasa
- [ ] Ejecución repetida produce resultado consistente

**Dependencies:** F4-T1 ✅

**Files touched:**
- `tests/e2e/05-atomic-rollback.sh` — nuevo

**Estimated scope:** M

---

#### Task F4-T7: Path Traversal Rejection E2E (`tests/e2e/06-path-traversal.sh`)

**Descripción:** Scenario 6 de SPEC.md. Intenta escribir fuera del directorio destino usando `../`, verifica exit code 1.

**Acceptance criteria:**
- [ ] Crea temp dir `/tmp/codice-test-XXXX`
- [ ] Ejecuta `codice --clean --force` con destino que contiene `../outside`
- [ ] Verifica exit code = 1
- [ ] Verifica que NO se escreveu ningún archivo fuera del temp dir
- [ ] Test similar con `../../../../etc/passwd`
- [ ] Verifica que no hay archivos creados fuera del temp dir

**Verification:**
- [ ] `just test-e2e` → test pasa

**Dependencies:** F4-T1 ✅

**Files touched:**
- `tests/e2e/06-path-traversal.sh` — nuevo

**Estimated scope:** S

---

### Phase 3: CI Integration

#### Task F4-T8: CI Integration (`tests/e2e/run-e2e.sh` + CI workflow)

**Descripción:** Crear runner script que ejecuta todos los E2E tests secuencialmente, y wirear en CI.

**Acceptance criteria:**
- [ ] `tests/e2e/run-e2e.sh` ejecuta cada test script en orden numérico
- [ ] `run-e2e.sh` retorna exit code 0 si todos pasan, 1 si alguno falla
- [ ] `run-e2e.sh` imprime "X/Y tests passed"
- [ ] `run-e2e.sh` cleanup del mock server si está corriendo
- [ ] CI workflow añade paso `just test-e2e` después de `just build`
- [ ] Si `just test-e2e` falla, el job de CI falla

**Verification:**
- [ ] `just test-e2e` → "6/6 tests passed"
- [ ] CI corre en Ubuntu y pasa

**Dependencies:** F4-T2 ✅, F4-T3 ✅, F4-T4 ✅, F4-T5 ✅, F4-T6 ✅, F4-T7 ✅

**Files touched:**
- `tests/e2e/run-e2e.sh` — nuevo
- `.github/workflows/ci.yml` — añade paso E2E

**Estimated scope:** S

---

### Phase 4: Coverage Improvements

#### Task F4-T9: Coverage gap closure

**Descripción:** Cerrar gaps de coverage identificados. Prioridad: output.ts (0%), VersionComparator (80% funcs), ClackPromptsAdapter (86.67% funcs), main.ts (50% lines).

**Acceptance criteria:**
- [ ] `output.ts`: tests para `printVersion()` y `printHelp()` (capturan stdout)
- [ ] `VersionComparator`: test para `getReleaseType()` con premajor, prerelease versions
- [ ] `ClackPromptsAdapter`: tests para `promptForMode()` con selección cancelada y cada modo
- [ ] `main.ts`: tests para `--help`, `--version` exit codes
- [ ] Coverage overall > 90% functions

**Verification:**
- [ ] `bun test --coverage` → >90% functions overall
- [ ] Domain layer > 90% functions
- [ ] Infrastructure adapters > 90% functions

**Dependencies:** Ninguna (paralelo con F4-T8)

**Files touched:**
- `tests/unit/cli/output.test.ts` — nuevo
- `tests/unit/cli/main.test.ts` — extensión
- `tests/integration/adapters/clack-prompts-adapter.test.ts` — extensión

**Estimated scope:** M

---

## Checkpoints

### After F4-T1 (E2E Infrastructure)
- [ ] `bash -n tests/e2e/common.sh` pasa
- [ ] Mock server inicia y responde correctamente en puerto 4567

### After F4-T2 to F4-T7 (All E2E Scenarios)
- [ ] `just test-e2e` → "6/6 tests passed"
- [ ] `bash tests/e2e/run-e2e.sh` → "6/6 tests passed"

### After F4-T8 (CI Integration)
- [ ] `just test-e2e` corre en CI (Ubuntu runner) y pasa
- [ ] Gate 4 (F4 Review) listo para ejecutar

### After F4-T9 (Coverage)
- [ ] `bun test --coverage` → >90% functions overall
- [ ] `bun test --coverage` → domain >90%, infra >90%

---

## Gate 4: F4 Review Checklist

Antes de marcar F4 como completo, verificar:

- [ ] Los 6 escenarios E2E pasan en CI (Ubuntu runner)
- [ ] `bun test` (unit + integration) → todos pasan sin regresión
- [ ] `bun test --coverage` → >90% functions overall
- [ ] `just check` → 0 errors, 0 warnings
- [ ] `tsc --noEmit` → limpio
- [ ] **SC-14:** E2E tests pasan en CI ✅
- [ ] **SC-18:** Path traversal rechazado con exit code 1 ✅
- [ ] **SC-9:** Clean Install < 5s (medir con `time just test-e2e`)
- [ ] **SC-10:** GitHub API timeout < 3s (mock server con delay injection)

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SIGKILL test es timing-sensitive y puede ser flaky | Medium | Retry logic, esperar suficiente para que el proceso haya creado staging |
| Mock server no disponible en Windows CI | Low | E2E corre solo en Unix (ubuntu/macos); windows solo corre lint/test |
| E2E tests lentos (>5 min en CI) | Low | Binary compilation es el bottleneck (~10s); tests son rápidos |
| output.ts tests requieren capturar stdout | Low | Redirección a archivo temporal, luego assert contenido |

---

## Phase Summary

| Task | Description | Estimated |
|------|-------------|-----------|
| F4-T1 | E2E shared lib (common.sh) | 1 hr |
| F4-T2 | Clean Install E2E | 1 hr |
| F4-T3 | Project Install Selective E2E | 1 hr |
| F4-T4 | Optional Skip E2E | 1 hr |
| F4-T5 | Update Workspace E2E | 1.5 hrs |
| F4-T6 | Atomic Rollback E2E | 1.5 hrs |
| F4-T7 | Path Traversal E2E | 1 hr |
| F4-T8 | CI Integration + run-e2e.sh | 1 hr |
| F4-T9 | Coverage gap closure | 2 hrs |
| **Total F4** | **9 tasks** | **~11 hrs** |

---

*Last updated: 2026-06-14*
