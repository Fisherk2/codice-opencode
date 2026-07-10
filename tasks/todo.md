# TODO: Fase FEV-6 — Quick Configuration + Documentation (v1.1.0)

**Estado:** 🟡 Pendiente — 0/5 tareas ejecutadas
**Fecha:** 2026-07-10
**Dependencias:** F0-F6 ✅ → FEV-1 ✅ → FEV-2 ✅ → FEV-2-B ✅ → FEV-2-C ✅ → FEV-2-D ✅ → FEV-3 ✅ → FEV-4 ✅ → FEV-5 ✅ → **FEV-6 🟡 En curso**
**Branch:** `feat/v1.1.0-fev-6` (basada en `main`)
**Issues principales:** #27 (steps) + #28 (SECURITY.md)
**Tech Debt:** TD-1.2 (coverage artifact)

---

## Contexto Rápido

**Issue #27** — Ajustar el campo `steps` en `opencode.json` para 6 agentes primarios según propuesta del issue. NO modificar otros parámetros (model, color, temperature).

**Issue #28** — Crear `docs/SECURITY.md` (proyecto) y `template/estandar/docs/SECURITY.md` (placeholder) con formato estándar de GitHub.

**TD-1.2** — Añadir constructores explícitos vacíos a `VersionComparator` y `ClackPromptsAdapter` para resolver el artifact de coverage de Bun (constructores implícitos contados como funciones).

**Versión:** v1.1.0 (minor feature sobre v1.0.14)

---

## Tareas Pendientes

### ⚙️ Phase 1: Configuration (Issue #27)

#### ⏳ FEV6-T1: Adjust `steps` for 6 primary agents
**Descripción:** Modificar solo el campo `steps` de los 6 agentes primarios en `template/obligatorio/opencode.json`.

**Cambios:**

| Agente | Actual | Objetivo |
|--------|--------|----------|
| huitzilopochtli | 20 | 25 |
| quetzalcoatl | 15 | 60 |
| moctezuma | 20 | 20 (sin cambio) |
| tlaloc | 40 | 90 |
| mictlantecuhtli | 40 | 60 |
| tezcatlipoca | 15 | 50 |

**Criterios de Aceptación:**
- [ ] 6 valores de `steps` actualizados
- [ ] Ningún otro campo modificado
- [ ] JSON válido

**Verificación:**
- [ ] `bun -e "JSON.parse(require('fs').readFileSync('template/obligatorio/opencode.json', 'utf8'))"` exit 0
- [ ] `git diff` muestra solo 6 líneas modificadas
- [ ] `just check` — 0 errores

**Dependencias:** Ninguna.
**Archivos:** `template/obligatorio/opencode.json` (líneas 348, 354, 360, 364, 372, 378)
**Commit:** `chore(config): adjust steps for 6 primary agents (#27)`
**Scope:** XS (10min).

---

### 📚 Phase 2: Documentation (Issue #28)

#### ⏳ FEV6-T2: Create `docs/SECURITY.md`
**Descripción:** Crear el archivo de política de seguridad del proyecto Códice.

**Criterios de Aceptación:**
- [ ] Archivo `docs/SECURITY.md` existe
- [ ] 4 secciones: Supported Versions, Reporting a Vulnerability, Response Process, Disclosure Policy
- [ ] Tabla de versiones soportadas: v1.1.x ✅, v1.0.x ✅

**Verificación:**
- [ ] `test -f docs/SECURITY.md` exit 0
- [ ] `rg "^## " docs/SECURITY.md` → 4 matches
- [ ] Manual: archivo legible y accionable

**Dependencias:** Ninguna.
**Archivos:** `docs/SECURITY.md` (nuevo)
**Commit:** `docs(security): add SECURITY.md to project root (#28)`
**Scope:** S (20min).

---

#### ⏳ FEV6-T3: Create `template/estandar/docs/SECURITY.md` placeholder
**Descripción:** Crear el placeholder de SECURITY.md para usuarios del workspace.

**Criterios de Aceptación:**
- [ ] Archivo `template/estandar/docs/SECURITY.md` existe
- [ ] Contiene enlace al SECURITY.md canónico de Códice
- [ ] 4 secciones mínimas recomendadas
- [ ] < 30 líneas (es un placeholder)

**Verificación:**
- [ ] `test -f template/estandar/docs/SECURITY.md` exit 0
- [ ] `wc -l template/estandar/docs/SECURITY.md` < 30
- [ ] `rg "github.com/fisherk2/codice-opencode/blob/main/docs/SECURITY.md" template/estandar/docs/SECURITY.md` → 1 match

**Dependencias:** Ninguna.
**Archivos:** `template/estandar/docs/SECURITY.md` (nuevo)
**Commit:** `docs(template): add SECURITY.md placeholder to standard docs (#28)`
**Scope:** XS (15min).

---

### 🔧 Phase 3: Code Quality (TD-1.2)

#### ⏳ FEV6-T4: Add explicit constructors to resolve coverage artifact
**Descripción:** Añadir `constructor() {}` explícito a `VersionComparator` y `ClackPromptsAdapter` con JSDoc explicativo.

**Criterios de Aceptación:**
- [ ] Constructor explícito en `VersionComparator`
- [ ] Constructor explícito en `ClackPromptsAdapter`
- [ ] Ambos con JSDoc (REF: TECH_DEBT.md TD-1.2)
- [ ] Sin cambio de comportamiento

**Verificación:**
- [ ] `rg "constructor\(\) \{\}" src/domain/services/VersionComparator.ts src/infrastructure/adapters/ClackPromptsAdapter.ts` → 2 matches
- [ ] `bun test` — 500/0 sin regresión
- [ ] `bun test --coverage src/domain/services/VersionComparator.ts` → 100% functions
- [ ] `bun test --coverage src/infrastructure/adapters/ClackPromptsAdapter.ts` → 100% functions

**Dependencias:** Ninguna.
**Archivos:**
- `src/domain/services/VersionComparator.ts` (modificar)
- `src/infrastructure/adapters/ClackPromptsAdapter.ts` (modificar)
**Commit:** `refactor(domain): add explicit constructors to resolve coverage artifact (TD-1.2)`
**Scope:** XS (15min).

---

### ✅ Phase 4: Verification

#### ⏳ FEV6-T5: Verify `FileRuleManifestData` covers `docs/SECURITY.md`
**Descripción:** Verificar si `docs/` (líneas 120-124 de `FileRuleManifestData.ts`) ya cubre `template/estandar/docs/SECURITY.md`. Se espera que SÍ, dado que `docs/` es standard entry con `isDirectory: true`.

**Análisis esperado:**
- `path: "docs"` con `isDirectory: true` y `category: "standard"` → FileMergeEngine stagea todo el árbol `docs/` del template
- `template/estandar/docs/SECURITY.md` está DENTRO de `docs/` → **cubierto automáticamente**
- No se requiere cambio

**Criterios de Aceptación:**
- [ ] Verificación ejecutada: `rg "path: \"docs\"" src/domain/entities/FileRuleManifestData.ts` → 1 match
- [ ] Análisis documentado en commit message
- [ ] Si NO cubierto: entrada añadida en sección ESTÁNDAR
- [ ] Si SÍ cubierto: solo commit de verificación o skip

**Verificación (caso "no change needed"):**
- [ ] `git diff src/domain/entities/FileRuleManifestData.ts` → empty
- [ ] `bun test` — 500/0 sin regresión
- [ ] `just check` — 0 errores

**Dependencias:** FEV6-T2, FEV6-T3.
**Archivos:** `src/domain/entities/FileRuleManifestData.ts` (verificar, posiblemente modificar)
**Commit (opcional):** `chore(manifest): verify docs/SECURITY.md covered by docs/ standard entry`
**Scope:** XS (10min).

---

## Checkpoints

### Checkpoint 1: After T1, T2, T3, T4
- [ ] 4 commits atómicos creados
- [ ] `bun test` — 500 pass, 0 fail
- [ ] `just check` — 0 errores
- [ ] `template/obligatorio/opencode.json` JSON válido
- [ ] `docs/SECURITY.md` existe con 4 secciones
- [ ] `template/estandar/docs/SECURITY.md` existe con placeholder
- [ ] Constructores explícitos añadidos
- [ ] Coverage artifact resuelto (100% functions en ambas clases)

**Bloqueante para T5:** Si Checkpoint 1 falla, NO proceder.

### Checkpoint 2: After T5
- [ ] Análisis de cobertura documentado
- [ ] Cambio aplicado (o verificado como innecesario)
- [ ] `bun test` — 500/0 sin regresión
- [ ] `just check` — 0 errores

### Gate FEV-6
- [ ] 4-5 commits en `feat/v1.1.0-fev-6`
- [ ] Issues #27 y #28 cerrados
- [ ] TD-1.2 cerrado
- [ ] Sin regresión

---

## Resumen Rápido

| Tarea | Scope | Esfuerzo |
|-------|-------|----------|
| FEV6-T1: steps opencode.json | XS | 10min |
| FEV6-T2: docs/SECURITY.md | S | 20min |
| FEV6-T3: template SECURITY.md | XS | 15min |
| FEV6-T4: Constructores explícitos | XS | 15min |
| FEV6-T5: Verificar manifest | XS | 10min |
| Checkpoint 1 | — | 10min |
| Checkpoint 2 | — | 5min |
| Commits atómicos | — | 10min |
| **Total** | | **~1.5h** |

---

*Última actualización: 2026-07-10*
