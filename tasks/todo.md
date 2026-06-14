# TODO: F2 – Núcleo (Dominio y Lógica de Negocio)

**Estado:** 🟢 Listo para Planificar
**Fecha:** 2026-06-14
**Dependencias:** F0 ✅ Completado → F1 ✅ Completado → F2 🟢 Listo para Planificar

---

## Phase 1: Value Objects

### F2-T1: WorkspaceVersion — métodos de comparación

**Descripción:** Añadir métodos de comparación semántica a `WorkspaceVersion` usando `semver`: `isNewerThan()`, `isOlderThan()`, `equals()`, `compare()`.

**Criterios de aceptación:**
- [ ] `isNewerThan(other: WorkspaceVersion): boolean` — true si `this` > `other` (semver)
- [ ] `isOlderThan(other: WorkspaceVersion): boolean` — true si `this` < `other` (semver)
- [ ] `equals(other: WorkspaceVersion): boolean` — true si `this` == `other` (semver)
- [ ] `compare(other: WorkspaceVersion): ComparisonResult` — retorna `"newer" | "older" | "equal"`
- [ ] `VersionComparator.compare()` usa `semver.valid()` para validar formato y `semver.compare()` para la comparación
- [ ] Formato inválido retorna `Failure` con mensaje accionable

**Verificación:**
- [ ] `bun test tests/unit/domain/` → todos pasan
- [ ] `just lint` pasa con cero warnings
- [ ] Cobertura de `WorkspaceVersion.ts` > 90%

**Dependencias:** Ninguna
**Scope:** S

---

## Phase 2: Entities

### F2-T2: FileRule — validación, factory y manifest

**Descripción:** Crear `FileRuleManifest.ts` con 27 paths clasificados, métodos de validación en `FileRule`, y función factory `createFileRule(path)`.

**Criterios de aceptación:**
- [ ] `src/domain/entities/FileRuleManifest.ts` existe con `FILE_RULE_MANIFEST: readonly FileRule[]` conteniendo las 27 rutas de `spec-file-rules.md`
- [ ] `FileRule.isValid(path): boolean` — verifica que la ruta existe en el manifest
- [ ] `FileRule.getCategory(path): RuleCategory | null` — retorna la categoría o null
- [ ] `createFileRule(path: string): FileRule | null` — factory que retorna la regla completa o null
- [ ] `getRulesByCategory(category: RuleCategory): readonly FileRule[]`
- [ ] `getMandatoryRules()`, `getStandardRules()`, `getOptionalRules()`
- [ ] Las 27 rutas cubren: Obligatorio (12), Estandar (11), Opcional (10), sin duplicados

**Verificación:**
- [ ] `bun test tests/unit/domain/` → todos pasan
- [ ] `just lint` pasa con cero warnings
- [ ] Cobertura de `FileRuleManifest.ts` > 90%

**Dependencias:** Ninguna (paralelo con F2-T1)
**Scope:** M

---

## Phase 3: Domain Services

### F2-T3: VersionComparator — implementación

**Descripción:** Implementar `VersionComparator.compare()` usando `semver`. Valida formato, retorna `"newer" | "older" | "equal"` via `Result`.

**Criterios de aceptación:**
- [ ] `compare(local: string, remote: string): Result<ComparisonResult, Error>`
- [ ] `semver.valid()` null → `Failure` con mensaje `"Invalid version format: {value}. Expected vX.Y.Z"`
- [ ] `semver.compare(local, remote)` → mapea a `"newer" | "older" | "equal"`
- [ ] `isUpdateAvailable(local: string, remote: string): boolean`
- [ ] `getReleaseType(local: string, remote: string): Result<"major" | "minor" | "patch" | "none", Error>`
- [ ] Zero runtime dependencies (solo `semver` y tipos del dominio)

**Verificación:**
- [ ] `bun test tests/unit/domain/` → todos pasan
- [ ] Cobertura de `VersionComparator.ts` > 90%

**Dependencias:** F2-T1
**Scope:** S

---

### F2-T4: FileMergeEngine — estrategia de fusión

**Descripción:** Implementar el motor de fusión completo con Strategy Pattern. Recibe `IFileSystem` via constructor, procesa `FileRule[]` aplicando la estrategia correcta por categoría.

**Criterios de aceptación:**
- [ ] Constructor recibe `IFileSystem` (inyección via `ports/IFileSystem`)
- [ ] `execute(rules, selectedOptionals?): Promise<Result<void, MergeError>>`
- [ ] `MergeError` con campos: `phase`, `path?`, `message`
- [ ] Obligatorio: siempre `stageFile()` (sobrescribe)
- [ ] Estandar: solo `stageFile()` si `destinationExists() === false`
- [ ] Opcional: solo `stageFile()` si path en `selectedOptionals` Y `destinationExists() === false`
- [ ] `commitStaging()` al final si todo OK
- [ ] `cleanStaging()` en caso de error
- [ ] Zero runtime dependencies

**Verificación:**
- [ ] `bun test tests/unit/domain/` → todos pasan
- [ ] Cobertura de `FileMergeEngine.ts` > 90%

**Dependencias:** F2-T1, F2-T2
**Scope:** M

---

## Phase 4: Testing

### F2-T5: Unit tests para la capa de dominio

**Descripción:** Tests exhaustivos para todos los componentes de dominio. Patrón AAA, mocks de `IFileSystem` inyectados via constructor.

**Criterios de aceptación:**
- [ ] `WorkspaceVersion`: ≥6 tests
- [ ] `FileRuleManifest`: ≥10 tests
- [ ] `VersionComparator`: ≥6 tests
- [ ] `FileMergeEngine`: ≥10 tests
- [ ] Cobertura total del dominio > 90%
- [ ] `bun test tests/unit/domain/` → todos pasan

**Verificación:**
- [ ] `bun test --coverage tests/unit/domain/` → cobertura > 90%

**Dependencias:** F2-T1, F2-T2, F2-T3, F2-T4
**Scope:** M

---

## Preguntas Abiertas — Resueltas

| # | Pregunta | Respuesta |
|---|----------|-----------|
| F2-O1 | ¿Dónde se define el manifest de clasificación? | En `src/domain/entities/FileRuleManifest.ts` como constante `FILE_RULE_MANIFEST`. Es estático por release del template. |
| F2-O2 | ¿Cómo se relaciona `FileMergeEngine` con `IFileSystem` si el dominio no puede importar de aplicación? | **Dependency Inversion**: `FileMergeEngine` recibe `IFileSystem` via constructor. La interfaz está en `application/ports/`, pero el dominio depende de la abstracción, no de la implementación. |
| F2-O3 | ¿Los tests de `FileMergeEngine` necesitan mocks del filesystem? | Sí, pero solo de `IFileSystem`. Los tests injectan un mock/stub de `IFileSystem` que registra las llamadas sin tocar disco. |

---

## Checkpoint: Después de F2-T1 a F2-T5

| Elemento de Checkpoint | Estado |
|------------------------|--------|
| WorkspaceVersion: métodos de comparación implementados | ⏳ Pendiente |
| FileRuleManifest: 27 paths clasificados correctamente | ⏳ Pendiente |
| VersionComparator: compare() con semver, retorna Result | ⏳ Pendiente |
| FileMergeEngine: estrategia completa con staging | ⏳ Pendiente |
| Unit tests: todos pasando, cobertura > 90% | ⏳ Pendiente |
| `just lint` pasa en todos los archivos F2 | ⏳ Pendiente |
| `bun test` pasa sin regresión | ⏳ Pendiente |

---

*Última actualización: 2026-06-14*
