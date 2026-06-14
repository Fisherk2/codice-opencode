# TODO: F4 – Pruebas (Unitarias, Integración y E2E)

**Estado:** 🟢 Listo para Implementar
**Fecha:** 2026-06-14
**Dependencias:** F0 ✅ Completado → F1 ✅ Completado → F2 ✅ Completado → F3 ✅ Completado → F4 🟢 En Implementación

---

## Phase 1: E2E Infrastructure

### F4-T1: E2E shared library (`tests/e2e/common.sh`)

**Descripción:** Script de utilidades compartido. Provee: binary resolution, temp dir con trap, assertions, mock server.

**Criterios de aceptación:**
- [ ] `setup_temp_dir()` — mktemp -d + trap cleanup en EXIT
- [ ] `assert_file_exists()`, `assert_file_missing()`, `assert_exit_code()`, `assert_contains()`
- [ ] `start_mock_server()` — Bun serve en puerto 4567, responde `{"tag_name":"v1.0.0"}`, retorna PID
- [ ] `stop_mock_server(pid)`
- [ ] `CODICE_BINARY` desde `dist/codice-*`
- [ ] Todos los E2E scripts hacen `set -e` y `source common.sh`

**Verificación:**
- [ ] `bash -n tests/e2e/common.sh` pasa
- [ ] Mock server responde en puerto 4567

**Dependencias:** Ninguna
**Scope:** S

---

## Phase 2: E2E Scenarios

### F4-T2: Clean Install E2E (`tests/e2e/01-clean-install.sh`)

**Descripción:** Ejecuta `codice --clean --force` en dir vacío. Verifica todos los archivos copiados, .codice-version existe.

**Criterios de aceptación:**
- [ ] Temp dir vacío
- [ ] `codice --clean --force` → exit 0
- [ ] `.codice-version` existe, JSON válido, tiene `installedVersion`
- [ ] template/obligatorio/ copiado (≥5 archivos)
- [ ] template/estandar/ copiado (≥5 archivos)
- [ ] template/opcional/ copiado
- [ ] Cleanup automático

**Verificación:**
- [ ] `just test-e2e` → pasa

**Dependencias:** F4-T1 ✅
**Scope:** M

---

### F4-T3: Project Install Selective E2E (`tests/e2e/02-project-install.sh`)

**Descripción:** Archivo pre-existente en template/estandar/ es preservado (no sobreescrito).

**Criterios de aceptación:**
- [ ] Temp dir con `docs/README.md` pre-existente (contenido original guardado)
- [ ] `codice --project --force` → exit 0
- [ ] `docs/README.md` preserva contenido original
- [ ] Obligatorio + Estandar copiados

**Verificación:**
- [ ] `just test-e2e` → pasa

**Dependencias:** F4-T1 ✅
**Scope:** M

---

### F4-T4: Project Install Optional Skip E2E (`tests/e2e/03-optional-skip.sh`)

**Descripción:** Verifica que `--force` no copia opcionales y piped input puede deseleccionar.

**Criterios de aceptación:**
- [ ] `codice --project --force` → no copia template/opcional/
- [ ] Obligatorio + Estandar sí copiados
- [ ] `codice --project` con input piped (Enter) → no copia opcionales
- [ ] Exit 0 en ambos

**Verificación:**
- [ ] `just test-e2e` → pasa

**Dependencias:** F4-T1 ✅
**Scope:** M

---

### F4-T5: Update Workspace E2E (`tests/e2e/04-update-workspace.sh`)

**Descripción:** Mock server + `.codice-version` antiguo. Solo Obligatorio + Estandar se actualizan.

**Criterios de aceptación:**
- [ ] Temp dir con `.codice-version` = `{"installedVersion":"0.9.0",...}`
- [ ] Archivos opcionales pre-existentes en destino
- [ ] Mock server puerto 4567
- [ ] `GITHUB_API_BASE=http://localhost:4567 codice --update --force` → exit 0
- [ ] `.codice-version` actualizado a `1.0.0`
- [ ] Obligatorio copiados
- [ ] Estandar copiados
- [ ] Opcional **preservados** (no tocados)

**Verificación:**
- [ ] `just test-e2e` → pasa

**Dependencias:** F4-T1 ✅
**Scope:** M

---

### F4-T6: Atomic Rollback E2E (`tests/e2e/05-atomic-rollback.sh`)

**Descripción:** `kill -9` durante operación. Destino intacto, staging limpio.

**Criterios de aceptación:**
- [ ] Temp dir vacío
- [ ] `codice --clean` en background
- [ ] `kill -9` tras 200ms
- [ ] Destino sin archivos nuevos
- [ ] Staging directory limpio
- [ ] Cleanup

**Verificación:**
- [ ] `just test-e2e` → pasa
- [ ] Consistente en ejecuciones múltiples

**Dependencias:** F4-T1 ✅
**Scope:** M

---

### F4-T7: Path Traversal E2E (`tests/e2e/06-path-traversal.sh`)

**Descripción:** Intenta escribir fuera del temp dir con `../`. Exit code 1.

**Criterios de aceptación:**
- [ ] `codice --clean --force` con `../outside` en destino → exit 1
- [ ] No archivos fuera del temp dir
- [ ] Mismo test con `../../../../etc/passwd` → exit 1

**Verificación:**
- [ ] `just test-e2e` → pasa

**Dependencias:** F4-T1 ✅
**Scope:** S

---

## Phase 3: CI Integration

### F4-T8: CI Integration (`tests/e2e/run-e2e.sh` + CI workflow)

**Descripción:** Runner que ejecuta los 6 E2E tests secuencialmente. Wirear en CI.

**Criterios de aceptación:**
- [ ] `run-e2e.sh` ejecuta en orden numérico
- [ ] `run-e2e.sh` → "X/6 tests passed"
- [ ] Exit 0 si todos pasan, 1 si alguno falla
- [ ] Cleanup del mock server
- [ ] CI workflow: `just test-e2e` después de `just build`

**Verificación:**
- [ ] `just test-e2e` → "6/6 tests passed"
- [ ] CI (Ubuntu) pasa

**Dependencias:** F4-T2 ✅, F4-T3 ✅, F4-T4 ✅, F4-T5 ✅, F4-T6 ✅, F4-T7 ✅
**Scope:** S

---

## Phase 4: Coverage Improvements

### F4-T9: Coverage gap closure

**Descripción:** Cerrar gaps: output.ts (0%), VersionComparator (80%), ClackPromptsAdapter (86.67%), main.ts (50%).

**Criterios de aceptación:**
- [ ] output.ts: tests para `printVersion()` y `printHelp()`
- [ ] VersionComparator: test `getReleaseType()` con premajor/prerelease
- [ ] ClackPromptsAdapter: tests `promptForMode()` con cancel y cada modo
- [ ] main.ts: tests `--help`, `--version` exit codes
- [ ] Coverage >90% functions overall

**Verificación:**
- [ ] `bun test --coverage` → >90% functions

**Dependencias:** Ninguna (paralelo con F4-T8)
**Scope:** M

---

## Checkpoint: Después de F4-T1 a F4-T9

| Elemento | Estado |
|---------|--------|
| E2E lib (common.sh) | ⏳ Pendiente |
| Clean Install E2E | ⏳ Pendiente |
| Project Selective E2E | ⏳ Pendiente |
| Optional Skip E2E | ⏳ Pendiente |
| Update Workspace E2E | ⏳ Pendiente |
| Atomic Rollback E2E | ⏳ Pendiente |
| Path Traversal E2E | ⏳ Pendiente |
| CI Integration + run-e2e.sh | ⏳ Pendiente |
| Coverage gap closure | ⏳ Pendiente |
| Gate 4: F4 Review | ⏳ Pendiente |

---

## Gate 4: F4 Review Checklist

- [ ] Los 6 escenarios E2E pasan en CI (Ubuntu runner)
- [ ] `bun test` → todos pasan sin regresión
- [ ] `bun test --coverage` → >90% functions overall
- [ ] `just check` → 0 errors, 0 warnings
- [ ] `tsc --noEmit` → limpio
- [ ] SC-14: E2E tests pasan en CI ✅
- [ ] SC-18: Path traversal rechazado con exit 1 ✅
- [ ] SC-9: Clean Install < 5s ✅
- [ ] SC-10: GitHub API timeout < 3s ✅

---

## Risks y Mitigaciones

| Risk | Mitigation |
|------|------------|
| SIGKILL test flaky (timing) | Retry logic, esperar 200ms |
| Mock server en Windows CI | E2E solo corre en Unix |
| E2E lento en CI (>5 min) | Binary compilation es el bottleneck |

---

*Última actualización: 2026-06-14*
