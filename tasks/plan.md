# Plan: F2 – Núcleo (Dominio y Lógica de Negocio)

## Overview

Implementar la lógica de dominio pura: entidades, value objects y servicios de negocio. Esta fase **no tiene dependencias externas** (ningún `Bun`, `fetch`, `process`). Toda comunicación con el exterior se hace a través de las interfaces de aplicación (`IFileSystem`, `IGitHubClient`) inyectadas via constructor.

**Goal:** Cuatro artefactos de dominio production-ready + sus tests unitarios (cobertura >90%), todos pasando.

---

## Architecture Decisions

| # | Decision | Rationale |
|---|----------|------------|
| F2-A1 | `FileRuleManifest` como constante hardcodeada en el dominio | SPEC.md Decision #1 garantiza que el template está embebido; el manifest refleja la clasificación estática por release |
| F2-A2 | `FileMergeEngine` recibe `IFileSystem` via constructor (DIP) | El motor de fusión necesita leer template y escribir a staging; `IFileSystem` es la abstracción definida en la capa de aplicación |
| F2-A3 | Strategy Pattern para las 3 categorías de fusión | Cada categoría (Obligatorio/Estandar/Opcional) tiene comportamiento diferente; las estrategias son intercambiables sin modificar el motor |
| F2-A4 | `WorkspaceVersion` usa `semver` internamente para comparación | La librería ya está en `package.json`; el dominio la usa solo para parsing y comparación, no para instanciación directa |
| F2-A5 | `VersionComparator` retorna tipos discriminated union | Errores de parsing de semver se propagan como `Failure`, no como excepciones |

---

## Dependency Graph

```
F2-T1: WorkspaceVersion (comparación + semver)
        │
        └──▶ F2-T3: VersionComparator (usa WorkspaceVersion)
        │
F2-T2: FileRule (validación + manifest + factory)
        │
        ├──▶ F2-T4: FileMergeEngine (usa FileRule + IFileSystem)
        │
        └──▶ F2-T3: VersionComparator (independiente — paralelo)
                    │
                    └──▶ F2-T4: FileMergeEngine (depende de T1 + T2)
                            │
                            └──▶ F2-T5: Unit tests (todos los anteriores)
```

**T1 y T2 son completamente paralelos** — WorkspaceVersion y FileRule no tienen dependencias entre sí.

---

## Task List

### Phase 1: Value Objects

#### Task F2-T1: WorkspaceVersion — métodos de comparación

**Descripción:** Añadir métodos de comparación semántica a `WorkspaceVersion` usando la librería `semver`. El value object ya tiene `version: string` (e.g. "1.0.0"). Se añaden `isNewerThan()`, `isOlderThan()`, `equals()` y `compare()`.

**Acceptance criteria:**
- [ ] `isNewerThan(other: WorkspaceVersion): boolean` — true si `this` > `other` (semver)
- [ ] `isOlderThan(other: WorkspaceVersion): boolean` — true si `this` < `other` (semver)
- [ ] `equals(other: WorkspaceVersion): boolean` — true si `this` == `other` (semver)
- [ ] `compare(other: WorkspaceVersion): ComparisonResult` — retorna `"newer" | "older" | "equal"`
- [ ] Método `compare(other: WorkspaceVersion): Result<ComparisonResult, Error>` en `VersionComparator` que usa `semver.valid()` para validar formato y `semver.compare()` para la comparación
- [ ] Formato inválido retorna `Failure` con mensaje accionable (no lanza excepción)
- [ ] `compare()` de `VersionComparator` usa `semver.compare(local, remote)` donde local/remote son strings sin prefijo "v"

**Verification:**
- [ ] `bun test tests/unit/domain/` → todos pasan
- [ ] `just lint` pasa con cero warnings
- [ ] Cobertura de `WorkspaceVersion.ts` > 90%

**Dependencies:** Ninguna (solo `semver`, ya disponible en dependencies)

**Files touched:**
- `src/domain/entities/WorkspaceVersion.ts` — añadir métodos de comparación

**Estimated scope:** S

---

### Phase 2: Entities

#### Task F2-T2: FileRule — validación, factory y manifest

**Descripción:** Crear el sistema completo de clasificación de archivos. Esto incluye: (1) el manifest hardcodeado de todas las rutas del template con su categoría, (2) métodos de validación en la entidad `FileRule`, (3) función factory `createFileRule(path)` que busca en el manifest, (4) helper `classifyFile(path): RuleCategory` para uso directo.

**Acceptance criteria:**
- [ ] `src/domain/entities/FileRuleManifest.ts` existe con array `FILE_RULE_MANIFEST: readonly FileRule[]` conteniendo las 27 rutas de `spec-file-rules.md`
- [ ] `FileRule.isValid(path): boolean` — verifica que la ruta existe en el manifest
- [ ] `FileRule.isDirectory(path): boolean` — verifica si la ruta es directorio
- [ ] `FileRule.getCategory(path): RuleCategory | null` — retorna la categoría o null si no existe
- [ ] `createFileRule(path: string): FileRule | null` — factory que retorna la regla completa o null
- [ ] `getRulesByCategory(category: RuleCategory): readonly FileRule[]` — filtra el manifest por categoría
- [ ] `getMandatoryRules(): readonly FileRule[]` — alias para Obligatorio
- [ ] `getStandardRules(): readonly FileRule[]` — alias para Estandar
- [ ] `getOptionalRules(): readonly FileRule[]` — alias para Opcional
- [ ] Las rutas de `spec-file-rules.md` están reflejadas: obligatorio (12), estandar (11), opcional (10), sin duplicados ni conflictos
- [ ] Helper `isPathDirectoryInTemplate(path: string): boolean` — verifica si la ruta en el manifest es directorio
- [ ] Helper `getRuleDescription(path: string): string` — retorna la descripción del manifest

**Classification manifest coverage (27 paths):**

*Obligatorio (12):*
- `opencode.json`, `skills-lock.json`, `agents/`, `commands/`, `.opencode/`, `.opencode/plugins/`, `.opencode/skills/`, `.opencode/references/`, `skills/`, `references/`, `docs/REQUIRED.md` (futuro), `specs/required.md` (futuro)

*Estandar (11):*
- `AGENTS.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `LICENSE`, `README.md`, `SPEC.md`, `.env.example`, `tasks/`, `docs/` (base), `specs/` (base), `.opencode/config.json`

*Opcional (10):*
- `Justfile`, `Makefile`, `requirements.txt`, `scripts/`, `docs/DESIGN.md`, `docs/SCHEMA.md`, `docs/opencode/`, `specs/design/`, `.opencode/plugins/sdd-workflow-test.md`

**Verification:**
- [ ] `bun test tests/unit/domain/` → todos pasan
- [ ] `just lint` pasa con cero warnings
- [ ] `tsc --noEmit` pasa (ningún `any`)
- [ ] Cobertura de `FileRuleManifest.ts` > 90%

**Dependencies:** Ninguna (T1 y T2 son paralelos — no se necesitan entre sí)

**Files touched:**
- `src/domain/entities/FileRule.ts` — añadir métodos de validación y factory
- `src/domain/entities/FileRuleManifest.ts` — nuevo archivo con el manifest hardcodeado

**Estimated scope:** M

---

### Phase 3: Domain Services

#### Task F2-T3: VersionComparator — implementación

**Descripción:** Implementar `VersionComparator.compare()` usando `semver`. El servicio recibe un string local y remote, valida el formato, y retorna el resultado de la comparación. También implementa `compareForUpdate()` que mapea `semver.compare()` a `"newer" | "older" | "equal"`.

**Acceptance criteria:**
- [ ] `compare(local: string, remote: string): Result<ComparisonResult, Error>`
  - Si `semver.valid(local)` o `semver.valid(remote)` es null → `Failure` con mensaje `"Invalid version format: {value}. Expected vX.Y.Z"`
  - Si `semver.compare(local, remote) < 0` → `Success("newer")` (remote es más nuevo)
  - Si `semver.compare(local, remote) > 0` → `Success("older")` (local es más nuevo)
  - Si `semver.compare(local, remote) === 0` → `Success("equal")`
- [ ] `isUpdateAvailable(local: string, remote: string): boolean` — convenience method que retorna true si remote > local
- [ ] `getReleaseType(local: string, remote: string): Result<"major" | "minor" | "patch" | "none", Error>` — determina el tipo de release basándose en semver diff
- [ ] **Zero imports de runtime** — solo `semver` (librería pura) y tipos del dominio
- [ ] Todos los mensajes de error son accionables

**Verification:**
- [ ] `bun test tests/unit/domain/` → todos pasan
- [ ] `just lint` pasa con cero warnings
- [ ] Cobertura de `VersionComparator.ts` > 90%

**Dependencies:** F2-T1 (WorkspaceVersion necesita los métodos de comparación)

**Files touched:**
- `src/domain/services/VersionComparator.ts` — reemplazar stub con implementación

**Estimated scope:** S

---

#### Task F2-T4: FileMergeEngine — estrategia de fusión

**Descripción:** Implementar el motor de fusión completo usando el Strategy Pattern. El motor recibe `IFileSystem` via constructor y procesa `FileRule[]` aplicando la estrategia correcta por categoría. El algoritmo principal:

```
1. Para cada rule en rules:
   a. Obtener staging path desde fileSystem
   b. Si category == "mandatory":
      - stageFile() siempre (sobrescribe)
      - log "[OBLIGATORIO] Copiado: {path}"
   c. Si category == "standard":
      - Si destinationExists() == false:
        - stageFile()
        - log "[ESTANDAR] Creado: {path}"
      - Si no:
        - log "[ESTANDAR] Preservado: {path}"
   d. Si category == "optional":
      - Si userSelected(path) == true AND destinationExists() == false:
        - stageFile()
        - log "[OPCIONAL] Copiado: {path}"
      - Si no:
        - log "[OPCIONAL] Omitido: {path}"
2. fileSystem.commitStaging()
3. En caso de error: fileSystem.cleanStaging() + rollback
```

**Acceptance criteria:**
- [ ] Constructor recibe `IFileSystem` (inyección via `ports/IFileSystem`)
- [ ] `execute(rules: readonly FileRule[], selectedOptionals?: readonly string[]): Promise<Result<void, MergeError>>`
  - `selectedOptionals` es un array de paths opcionales seleccionados por el usuario
  - Retorna `Result.ok()` en éxito, `Result.err(MergeError)` en fallo
- [ ] `MergeError` es un tipo de error del dominio con campos: `phase: "staging" | "commit" | "validation"`, `path?: string`, `message: string`
- [ ] Obligatorio: siempre `stageFile()`, sin verificar si existe en destino
- [ ] Estandar: solo `stageFile()` si `destinationExists() === false`
- [ ] Opcional: solo `stageFile()` si el path está en `selectedOptionals` Y `destinationExists() === false`
- [ ] `commitStaging()` se llama al final si todas las operaciones fueron exitosas
- [ ] Si alguna operación falla, se hace `cleanStaging()` y se retorna el error
- [ ] **Zero runtime dependencies** — sin `Bun`, `fetch`, `process`
- [ ] Todos los paths se normalizan a forward slashes (`/`) antes de operar
- [ ] Log en verbose mode: cada decisión de fusión emit un objeto JSON estructurado

**Verification:**
- [ ] `bun test tests/unit/domain/` → todos pasan
- [ ] `just lint` pasa con cero warnings
- [ ] `tsc --noEmit` pasa
- [ ] Cobertura de `FileMergeEngine.ts` > 90%

**Dependencies:** F2-T2 (FileRule manifest), F2-T1 (WorkspaceVersion para contexto)

**Files touched:**
- `src/domain/services/FileMergeEngine.ts` — implementación completa
- `src/domain/types/MergeError.ts` — nuevo tipo de error

**Estimated scope:** M

---

### Phase 4: Testing

#### Task F2-T5: Unit tests para toda la capa de dominio

**Descripción:** Escribir tests unitarios exhaustivos para `WorkspaceVersion`, `FileRule`, `FileRuleManifest`, `VersionComparator` y `FileMergeEngine`. Tests siguiendo el patrón AAA, sin mocks de filesystem (son tests de dominio puro).

**WorkspaceVersion tests:**
- `fromJSON()`: parsing válido, campos faltantes, tipos incorrectos, array inválido
- `isNewerThan()` / `isOlderThan()` / `equals()`: v1.0.0 vs v1.1.0, v1.0.0 vs v1.0.0, v2.0.0 vs v1.0.0
- `compare()`: todos los casos de ComparisonResult

**FileRuleManifest tests:**
- `FILE_RULE_MANIFEST` tiene exactamente 27 entradas sin duplicados
- `getMandatoryRules()` retorna exactamente las reglas Obligatorio
- `getStandardRules()` retorna exactamente las reglas Estandar
- `getOptionalRules()` retorna exactamente las reglas Opcional
- `getRulesByCategory()` filtra correctamente
- `createFileRule(path)` retorna la regla correcta para paths válidos y null para paths no clasificados
- `getRuleDescription(path)` retorna la descripción correcta

**VersionComparator tests:**
- `compare()`: v1.0.0 vs v1.1.0 → "newer"; v2.0.0 vs v1.0.0 → "older"; v1.0.0 vs v1.0.0 → "equal"
- `compare()` con formato inválido: retorna `Failure`
- `isUpdateAvailable()`: true/false según corresponda
- `getReleaseType()`: major/minor/patch/none

**FileMergeEngine tests (con mock de IFileSystem):**
- `execute()` con reglas Obligatorio: siempre stageFile
- `execute()` con reglas Estandar: solo stageFile si destination no existe
- `execute()` con reglas Opcional: solo stageFile si seleccionado Y destination no existe
- `execute()` retorna error si stageFile falla
- `execute()` hace commitStaging al final si todo OK
- `execute()` hace cleanStaging si hay error
- Verify que `destinationExists()` se consulta para Estandar y Opcional, pero NO para Obligatorio

**Acceptance criteria:**
- [ ] `WorkspaceVersion`: ≥6 tests
- [ ] `FileRuleManifest`: ≥10 tests
- [ ] `VersionComparator`: ≥6 tests
- [ ] `FileMergeEngine`: ≥10 tests
- [ ] Total coverage del dominio > 90%
- [ ] `bun test tests/unit/domain/` → todos pasan
- [ ] `bun test --coverage tests/unit/domain/` → cobertura > 90%
- [ ] Tests usan `bun:test` (no shell scripts)
- [ ] Zero dependencias de runtime (Bun, fetch, process) en los tests de dominio

**Verification:**
- [ ] `bun test` → todos pasan
- [ ] `bun test --coverage` → cobertura dominio > 90%
- [ ] `just lint` pasa con cero warnings

**Dependencies:** F2-T1, F2-T2, F2-T3, F2-T4 (todos los componentes deben existir)

**Files touched:**
- `tests/unit/domain/workspace-version.test.ts`
- `tests/unit/domain/file-rule.test.ts`
- `tests/unit/domain/file-rule-manifest.test.ts`
- `tests/unit/domain/version-comparator.test.ts`
- `tests/unit/domain/file-merge-engine.test.ts`

**Estimated scope:** M

---

### Checkpoint: Después de F2-T1 a F2-T5

| Checkpoint Item | Status |
|-----------------|--------|
| WorkspaceVersion: métodos de comparación implementados | ⏳ Pendiente |
| FileRuleManifest: 27 paths clasificados correctamente | ⏳ Pendiente |
| VersionComparator: compare() con semver, retorna Result | ⏳ Pendiente |
| FileMergeEngine: estrategia completa con staging | ⏳ Pendiente |
| Unit tests: todos pasando, cobertura > 90% | ⏳ Pendiente |
| `just lint` pasa en todos los archivos F2 | ⏳ Pendiente |
| `bun test` (138 + nuevos) pasa sin regresión | ⏳ Pendiente |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| El manifest hardcodeado se desincroniza del template real | High | El manifest se mantiene en `FileRuleManifest.ts` junto al template; verificar con test que todas las rutas existen |
| semver retorna `null` en `valid()` para versiones edge case | Medium | Verificar `null` antes de `compare()`; retornar `Failure` con mensaje claro |
| FileMergeEngine puede romper la atomicidad si commit falla parcialmente | High | `commitStaging()` es una sola operación atómica en `IFileSystem`; si falla, se hace `cleanStaging()` |
| El manifest crece con cada release de template | Low | Cada release de Códice actualiza el manifest junto con el template; no es responsabilidad del dominio |

---

## Open Questions — Resolved

| # | Question | Resolution |
|---|----------|------------|
| F2-O1 | ¿Dónde se define el manifest de clasificación? | **En `src/domain/entities/FileRuleManifest.ts`** como constante `FILE_RULE_MANIFEST`. Es estático por release del template. |
| F2-O2 | ¿Cómo se relaciona `FileMergeEngine` con `IFileSystem` si el dominio no puede importar de aplicación? | **Dependency Inversion**: `FileMergeEngine` recibe `IFileSystem` via constructor. La interfaz está en `application/ports/`, pero la implementación concreta (BunFileSystem) está en `infrastructure/adapters/`. El dominio depende de la abstracción, no de la implementación. |
| F2-O3 | ¿Los tests de `FileMergeEngine` necesitan mocks del filesystem? | **Sí, pero solo de `IFileSystem`**. Los tests injectan un mock/stub de `IFileSystem` que registra las llamadas sin tocar disco. Esto es inyección de dependencias, no un mock global. |

---

## Phase Summary

| Task | Description | Duration |
|------|-------------|----------|
| F2-T1 | WorkspaceVersion: métodos de comparación con semver | ~30 min |
| F2-T2 | FileRule: manifest + validación + factory | ~1.5 hrs |
| F2-T3 | VersionComparator: implementación con semver | ~30 min |
| F2-T4 | FileMergeEngine: estrategia de fusión completa | ~2 hrs |
| F2-T5 | Unit tests para toda la capa de dominio | ~2 hrs |
| **Total F2** | **5 tasks** | **~6.5 hrs** |

---

*Last updated: 2026-06-14*
