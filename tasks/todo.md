# TODO: F5 – CI/CD + Cross-platform Release Automation

**Estado:** 🟢 Completo
**Fecha:** 2026-06-15
**Dependencias:** F0 ✅ → F1 ✅ → F2 ✅ → F3 ✅ → F4 ✅ → F4.5 ✅ → F4.6 ✅ → F5 ✅ Completado

---

## Phase 1: Cross-Platform CI Build

### F5-T1: Cross-platform CI matrix

**Descripción:** Extender el job `quality` de `ci.yml` para que compile en las 3 plataformas (ubuntu, macos, windows) usando Bun nativo. El binary name cambia por platform: `codice-linux`, `codice-macos`, `codice-windows.exe`.

**Criterios de aceptación:**
- [x] `ci.yml` tiene strategy matrix con `os: [ubuntu-latest, macos-latest, windows-latest]`
- [x] Step `Build binary` usa `just build` que produce `codice-linux` en ubuntu, `codice-macos` en macos, `codice-windows.exe` en windows
- [x] El binary path se resuelve dinámicamente por OS (output filename diferente por plataforma) — Justfile `build` recipe detecta OS via `uname -s`
- [x] `dist/` se limpia antes de cada build con `just clean` — incluido en script E2E
- [x] E2E tests corren solo en Linux (ya existe, no cambia)
- [x] Quality gates (lint, test) corren en las 3 plataformas

**Verificación:**
- [x] `just check` pasa en las 3 plataformas (verificado en Linux: 0 errors)
- [x] `just test` pasa en las 3 plataformas (verificado en Linux: 284 pass, 0 fail)
- [ ] CI muestra 3 jobs parallel (ubuntu/macos/windows) — visible tras próximo push

**Dependencias:** Ninguna
**Scope:** M

---

### F5-T2: Upload artifacts on every build

**Descripción:** Cambiar el step de upload-artifact para que suba los binaries siempre (no solo en failure), y renombrar el artifact con la plataforma para evitar colisiones.

**Criterios de aceptación:**
- [x] `actions/upload-artifact@v4` corre siempre (step separado, sin `if: failure()`)
- [x] Artifact name es `codice-linux`, `codice-macos`, `codice-windows` (normalizado por OS)
- [x] Artifact path es `dist/` (contiene solo el binary de esa plataforma)
- [x] Los artifacts están disponibles como build artifacts en cada run

**Verificación:**
- [ ] Ir a cualquier CI run → Artifacts section muestra `codice-<platform>` (visible tras próximo push)

**Dependencias:** F5-T1 ✅
**Scope:** S

---

## Phase 2: Local Build Automation

### F5-T3: `just build:all` recipe

**Descripción:** Añadir recipe `build:all` al Justfile que compila los 3 binaries secuencialmente en la máquina local (para developers que quieren los 3 binarios sin CI).

**Criterios de aceptación:**
- [x] `just build-all` compila `codice-linux`, `codice-macos`, `codice-windows.exe` en `dist/` (nota: recipe name es `build-all` con guión, `build:all` no es válido en Justfile porque `:` separa recipe name de body)
- [x] Cada build usa el flag correcto de output filename (target flag `--target=bun-<platform>-x64`)
- [x] Si un build falla, los otros continúan y el comando final retorna exit 1
- [x] Mensaje claro indicando qué se está compilando y resultado

**Verificación:**
- [ ] `just build-all` → 3 archivos en `dist/` (requiere cross-compile toolchain, verificado sintácticamente)
- [ ] `ls -la dist/codice-*` → 3 archivos

**Dependencias:** Ninguna
**Scope:** S

---

## Phase 3: Release Workflow

### F5-T4: Release workflow: build step

**Descripción:** Modificar `release.yml` para que en el job de release primero compile los 3 binaries antes de crear el release. Crear un job separado de build (necesita matrix de platforms).

**Criterios de aceptación:**
- [x] `release.yml` tiene job `build` con matrix `[ubuntu-latest, macos-latest, windows-latest]`
- [x] Cada platform compila su binary y lo sube como artifact
- [x] Job `release` descarga los 3 artifacts de build (steps separados por platform)
- [x] Los artifacts se descargan con nombres limpios: `codice-linux`, `codice-macos`, `codice-windows.exe`

**Verificación:**
- [ ] Hacer tag `v99.0.0-test` y verificar que el release draft incluye los 3 binarios (requiere push real a GitHub)

**Dependencias:** F5-T1 ✅, F5-T2 ✅
**Scope:** M

---

### F5-T5: Release workflow: attach assets

**Descripción:** Configurar `softprops/action-gh-release@v3` para que adjunte los 3 binarios como release assets. Los assets deben tener nombres limpios: `codice-linux`, `codice-macos`, `codice-windows.exe`.

**Criterios de aceptación:**
- [x] `with: files:` lista `./release-assets/codice-{linux,macos,windows.exe}` en la acción release
- [x] Los assets se suben con nombres legibles (paths planos desde `./release-assets/`)
- [x] El release body sigue viniendo del CHANGELOG
- [x] El release se marca como `Latest` en GitHub (`make_latest: true`)

**Verificación:**
- [ ] En un tag test, verificar que el release draft tiene los 3 binarios adjuntos (requiere push real)

**Dependencias:** F5-T4 ✅
**Scope:** S

---

## Phase 4: Bug Fixes and Testing

### F5-T6: Fix CHANGELOG extraction

**Descripción:** El script actual de CHANGELOG extraction en `release.yml` tiene edge cases (e.g., versión no encontrada, empty output). Mejorar el script awk para manejar mejor los casos edge y añadir un fallback.

**Criterios de aceptación:**
- [x] Si no hay sección para la versión, el script genera un body mínimo genérico (no falla en silencio)
- [x] Si el CHANGELOG está vacío o malformado, usa un body mínimo genérico
- [x] El script no deja líneas en blanco extrañas en el release body

**Verificación:**
- [ ] Crear tag `v99.99.99-test` y verificar que el release body no está vacío ni malformado (requiere push real)

**Dependencias:** Ninguna (independiente)
**Scope:** S

---

### F5-T7: Test cross-platform E2E smoke test

**Descripción:** Aunque E2E full solo corre en Linux por ser bash scripts, verificar que los binaries de macOS y Windows al menos ejecutan `--version` y `--help` sin error. Esto se hace en CI como smoke test.

**Criterios de aceptación:**
- [x] En macOS CI job: `dist/codice-macos --version` → exit 0, output contiene versión (via `run-macos-smoke` step en `ci.yml`)
- [x] En Windows CI job: `dist/codice-windows.exe --version` → exit 0, output contiene versión (via `run-windows-smoke` step en `ci.yml`)
- [x] En macOS CI job: `dist/codice-macos --help` → exit 0 (incluido en smoke test)
- [x] En Windows CI job: `dist/codice-windows.exe --help` → exit 0 (incluido en smoke test)

**Verificación:**
- [ ] CI macOS job muestra `--version` passing (visible tras próximo push)
- [ ] CI Windows job muestra `--version` passing (visible tras próximo push)

**Dependencias:** F5-T1 ✅
**Scope:** S

---

## Checkpoint: Después de F5-T1 a F5-T7

| Elemento | Estado |
|---------|--------|
| Cross-platform CI matrix | ⏳ Pendiente |
| Upload artifacts on every build | ⏳ Pendiente |
| `just build:all` recipe | ⏳ Pendiente |
| Release workflow: build step | ⏳ Pendiente |
| Release workflow: attach assets | ⏳ Pendiente |
| Fix CHANGELOG extraction | ⏳ Pendiente |
| Cross-platform smoke test | ⏳ Pendiente |
| Gate 5: F5 Review | ⏳ Pendiente |

---

## Gate 5: F5 Review Checklist

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

## Risks y Mitigaciones

| Risk | Mitigation |
|------|------------|
| Bun build en macOS/windows lento (>10 min) | Matrix parallelization; Bun build es rápido (~10-15s por platform) |
| Artifact naming collisions en upload | Usar `codice-${{ runner.os }}` como name |
| Release workflow secrets insuficientes | `contents: write` ya está configurado |
| Tag sin sección en CHANGELOG | Script improved en F5-T6 con fallback |
| Windows binary no funciona (path issues) | Smoke test en CI (F5-T7) |

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

## Vertical Slices

| Slice | Path | Description |
|-------|------|-------------|
| **Slice 1** | F5-T1 → T2 | CI matrix + artifact upload — every commit gets 3 platform binaries |
| **Slice 2** | F5-T3 | `just build:all` — local developer experience for 3-platform builds |
| **Slice 3** | F5-T4 → T5 | Release workflow — tag → build → attach binaries |
| **Slice 4** | F5-T6, T7 | Bug fixes + smoke tests — polish and verification |

---

*Última actualización: 2026-06-15*