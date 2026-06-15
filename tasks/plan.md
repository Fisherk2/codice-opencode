# Plan: F5 — CI/CD + Cross-platform Release Automation

**Fecha:** 2026-06-15 | **Autor:** Fisherk2 | **Estado:** 🟡 En Revisión

## Overview

Implementar builds cross-platform (Linux, macOS, Windows x64) en CI y automatizar GitHub Releases con binarios adjuntos. El objetivo es que cada tag `v*` produzca un GitHub Release con los 3 binarios listos para descargar, y que cada commit/PR suba artifacts de build.

---

## Estado Actual

| Artefacto | Estado | Detalle |
|-----------|--------|---------|
| CI Linux build | ✅ | `just build` → `dist/codice-linux` |
| CI E2E (Linux only) | ✅ | 6/6 escenarios pasando |
| CI artifacts on failure | ✅ | Upload `dist/` on failure |
| Release workflow | ⚠️ | Crea release desde CHANGELOG, pero **no sube binarios** |
| macOS build in CI | ❌ | No existe |
| Windows build in CI | ❌ | No existe |
| `just build:all` | ❌ | No existe |
| Release changelog extraction | ⚠️ | Script existe pero puede fallar en edge cases |

---

## Architecture Decisions

| # | Decision | Rationale |
|---|----------|------------|
| F5-A1 | Build nativo por OS en CI | Bun `build --compile` produce el binario correcto automáticamente en cada SO. No se necesita cross-compilation. |
| F5-A2 | Matrix job para 3 plataformas | Cada platform corre en su propio runner (ubuntu/macos/windows). Más simple y más rápido que secuencial. |
| F5-A3 | Artifacts upload en cada commit | `actions/upload-artifact@v4` con path `dist/codice-*`. Disponibles para debugging sin necesidad de release. |
| F5-A4 | Release usa workflow_dispatch + tag trigger | `on: push: tags: [v*]` para automático. `workflow_dispatch` para re-ejecutar. |
| F5-A5 | `just build:all` paraleliza 3 builds | `&` background processes para build linux/macos/windows secuencial en local. |

---

## Dependency Graph

```
F5-T1: Cross-platform CI matrix        ← base (todos dependen)
F5-T2: Upload artifacts en CI          ← depende de T1
F5-T3: just build:all recipe           ← independiente (local dev)
F5-T4: Release workflow: build step    ← depende de T1, T2
F5-T5: Release workflow: attach assets ← depende de T4
F5-T6: Fix CHANGELOG extraction        ← independiente (bug fix)
F5-T7: Test cross-platform E2E         ← depende de T1
```

---

## Task List

### Phase 1: Cross-Platform CI Build

#### Task F5-T1: Cross-platform CI matrix

**Descripción:** Extender el job `quality` de `ci.yml` para que compile en las 3 plataformas (ubuntu, macos, windows) usando Bun nativo. El binary name cambia por platform: `codice-linux`, `codice-macos`, `codice-windows.exe`.

**Acceptance criteria:**
- [ ] `ci.yml` tiene strategy matrix con `os: [ubuntu-latest, macos-latest, windows-latest]`
- [ ] Step `Build binary` usa `just build` que produce `codice-linux` en ubuntu, `codice-macos` en macos, `codice-windows.exe` en windows
- [ ] El binary path se resuelve dinámicamente por OS (output filename diferente por plataforma)
- [ ] `dist/` se limpia antes de cada build con `just clean`
- [ ] E2E tests corren solo en Linux (ya existe, no cambia)
- [ ] Quality gates (lint, test) corren en las 3 plataformas
- [ ] Upload artifact solo en failure (ya existe, no cambia)

**Verification:**
- [ ] `just check` pasa en las 3 plataformas localmente (o verify via CI)
- [ ] `just test` pasa en las 3 plataformas
- [ ] `just build` produce el binary correcto para la plataforma actual
- [ ] CI muestra 3 jobs parallel (ubuntu/macos/windows)

**Dependencies:** Ninguna

**Files touched:**
- `.github/workflows/ci.yml` — modificar
- `Justfile` — puede necesitar ajuste de output path

**Estimated scope:** M

---

#### Task F5-T2: Upload artifacts on every build

**Descripción:** Cambiar el step de upload-artifact para que suba los binaries siempre (no solo en failure), y renombrar el artifact con la plataforma para evitar colisiones.

**Acceptance criteria:**
- [ ] `actions/upload-artifact@v4` corre siempre (sin `if: failure()`), o sea un step separado
- [ ] Artifact name es `codice-${{ runner.os }}` (codice-ubuntu-latest, codice-macos-latest, codice-windows-latest)
- [ ] Artifact path incluye el binary específico (no todo `dist/`)
- [ ] Los artifacts están disponibles como build artifacts en cada run

**Verification:**
- [ ] Ir a cualquier CI run → Artifacts section muestra `codice-<platform>`

**Dependencies:** F5-T1 ✅

**Files touched:**
- `.github/workflows/ci.yml` — modificar step de upload

**Estimated scope:** S

---

### Phase 2: Local Build Automation

#### Task F5-T3: `just build:all` recipe

**Descripción:** Añadir recipe `build:all` al Justfile que compila los 3 binaries secuencialmente en la máquina local (para developers que quieren los 3 binarios sin CI).

**Acceptance criteria:**
- [ ] `just build:all` compila `codice-linux`, `codice-macos`, `codice-windows.exe` en `dist/`
- [ ] Cada build usa el flag correcto de output filename
- [ ] Si un build falla, los otros continúan y el comando final retorna exit 1
- [ ] Mensaje claro indicando qué se está compilando y resultado

**Verification:**
- [ ] `just build:all` → 3 archivos en `dist/`
- [ ] `ls -la dist/codice-*` → 3 archivos

**Dependencies:** Ninguna

**Files touched:**
- `Justfile` — añadir recipe

**Estimated scope:** S

---

### Phase 3: Release Workflow

#### Task F5-T4: Release workflow: build step

**Descripción:** Modificar `release.yml` para que en el job de release primero compile los 3 binaries antes de crear el release. Crear un job separado de build (necesita matrix de platforms).

**Acceptance criteria:**
- [ ] `release.yml` tiene job `build` con matrix `[ubuntu, macos, windows]`
- [ ] Cada platform compila su binary y lo sube como artifact
- [ ] Job `release` descarga los 3 artifacts de build
- [ ] Los artifacts se renombran a `codice-linux`, `codice-macos`, `codice-windows.exe`
- [ ] Binary naming coincide con SPEC.md (sin sufijos de versión)

**Verification:**
- [ ] Hacer tag `v99.0.0-test` y verificar que el release draft incluye los 3 binarios (no ejecutar release real, solo verificar el workflow corre)

**Dependencies:** F5-T1 ✅, F5-T2 ✅

**Files touched:**
- `.github/workflows/release.yml` — restructure completo

**Estimated scope:** M

---

#### Task F5-T5: Release workflow: attach assets

**Descripción:** Configurar `softprops/action-gh-release@v3` para que adjunte los 3 binarios como release assets. Los assets deben tener nombres limpios: `codice-linux`, `codice-macos`, `codice-windows.exe`.

**Acceptance criteria:**
- [ ] `with: files: codice-linux,codice-macos,codice-windows.exe` en la acción release
- [ ] Los assets se suben con nombres legibles (sin paths de artifact internos)
- [ ] El release body sigue viniendo del CHANGELOG (no cambiar esa parte)
- [ ] El release se marca como `Latest` en GitHub

**Verification:**
- [ ] En un tag test, verificar que el release draft tiene los 3 binarios adjuntos
- [ ] Los binarios son descargables desde la página del release

**Dependencies:** F5-T4 ✅

**Files touched:**
- `.github/workflows/release.yml` — modificar step de release

**Estimated scope:** S

---

### Phase 4: Bug Fixes and Testing

#### Task F5-T6: Fix CHANGELOG extraction

**Descripción:** El script actual de CHANGELOG extraction en `release.yml` tiene edge cases (e.g., versión no encontrada, empty output). Mejorar el script awk para manejar mejor los casos edge y añadir un fallback.

**Acceptance criteria:**
- [ ] Si no hay sección para la versión, el script no falla en silencio (da error claro)
- [ ] Si el CHANGELOG está vacío o malformado, usa un body mínimo genérico
- [ ] El script no deja líneas en blanco extrañas en el release body
- [ ] El release body incluye la sección de la versión y las transiciones correctly

**Verification:**
- [ ] Crear tag `v99.99.99-test` y verificar que el release body no está vacío ni malformado

**Dependencies:** Ninguna (independiente)

**Files touched:**
- `.github/workflows/release.yml` — modificar script awk

**Estimated scope:** S

---

#### Task F5-T7: Test cross-platform E2E

**Descripción:** Aunque E2E full solo corre en Linux por ser bash scripts, verificar que los binaries de macOS y Windows al menos ejecutan `--version` y `--help` sin error. Esto se hace en CI como smoke test.

**Acceptance criteria:**
- [ ] En macOS CI job: `dist/codice-macos --version` → exit 0, output contiene versión
- [ ] En Windows CI job: `dist/codice-windows.exe --version` → exit 0, output contiene versión
- [ ] En macOS CI job: `dist/codice-macos --help` → exit 0
- [ ] En Windows CI job: `dist/codice-windows.exe --help` → exit 0

**Verification:**
- [ ] CI macOS job muestra `--version` passing
- [ ] CI Windows job muestra `--version` passing

**Dependencies:** F5-T1 ✅

**Files touched:**
- `.github/workflows/ci.yml` — añadir smoke test step

**Estimated scope:** S

---

## Checkpoints

### After F5-T1 (Cross-platform CI matrix)
- [ ] CI corre en 3 plataformas (ubuntu/macos/windows)
- [ ] `just build` produce binary correcto por platform
- [ ] Quality gates (lint, test) pasan en las 3 plataformas

### After F5-T2 (Artifacts upload)
- [ ] Cada CI run tiene 3 artifacts (codice-ubuntu-latest, etc.)

### After F5-T3 (`just build:all`)
- [ ] `just build:all` produce 3 binarios en `dist/`

### After F5-T4 + F5-T5 (Release workflow)
- [ ] Tag `v*` produce release con 3 binarios adjuntos
- [ ] Release body viene del CHANGELOG

### After F5-T6 + F5-T7 (Bug fixes + smoke tests)
- [ ] CHANGELOG extraction robusta
- [ ] Binarios de las 3 plataformas funcionan (smoke test)
- [ ] Gate 5 (F5 Review) listo para ejecutar

---

## Gate 5: F5 Review Checklist

Antes de marcar F5 como completo, verificar:

- [ ] **SC-15:** Compiled binaries produced for Linux, macOS, and Windows x64 ✅
- [ ] CI corre en las 3 plataformas y pasa
- [ ] `just build:all` produce 3 binarios
- [ ] Tag `v*` crea release con 3 binarios en assets
- [ ] CHANGELOG parsing genera release notes correctas
- [ ] Smoke test (`--version`) pasa en macOS y Windows
- [ ] `just check` → 0 errors en las 3 plataformas
- [ ] `bun test` → 0 failures en las 3 plataformas
- [ ] `just test-e2e` → 6/6 en Linux

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Bun build en macOS/windows lento (>10 min) | Medium | Matrix parallelization; Bun build es rápido (~10-15s por platform) |
| Artifact naming collisions en upload | Low | Usar `codice-${{ runner.os }}` como name |
| Release workflow secrets insuficientes | Low | `contents: write` ya está configurado |
| Tag sin sección en CHANGELOG | Medium | Script improved en F5-T6 con fallback |
| Windows binary no funciona (path issues) | Medium | Smoke test en CI (F5-T7) |

---

## Phase Summary

| Task | Description | Estimated |
|------|-------------|-----------|
| F5-T1 | Cross-platform CI matrix | 1.5 hrs |
| F5-T2 | Upload artifacts on every build | 0.5 hr |
| F5-T3 | `just build:all` recipe | 0.5 hr |
| F5-T4 | Release workflow: build step | 1.5 hrs |
| F5-T5 | Release workflow: attach assets | 1 hr |
| F5-T6 | Fix CHANGELOG extraction | 0.5 hr |
| F5-T7 | Test cross-platform E2E smoke test | 0.5 hr |
| **Total F5** | **7 tasks** | **~6 hrs** |

---

*Last updated: 2026-06-15*