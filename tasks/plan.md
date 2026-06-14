# Plan: F3 – Interfaces (Casos de Uso y CLI)

## Overview

Implementar la capa de aplicación (use cases) y el punto de entrada CLI. Esta fase conecta el dominio (F2) con la infraestructura (F1) y expone todo a través de una TUI interactiva y CLI flags.

**Goal:** CLI funcional en modo desarrollo (`bun run`), los 3 flujos completos ejecutando con datos mockeados/integrados, pasando los gates de calidad.

---

## Architecture Decisions

| # | Decision | Rationale |
|---|----------|------------|
| F3-A1 | Cada use case recibe los ports via constructor (DIP) | Clean Architecture: el caso de uso no conoce Bun, fetch ni @clack/prompts directamente |
| F3-A2 | `main.ts` es el composition root | Todas las dependencias se instancian aquí; los use cases solo reciben interfaces |
| F3-A3 | CleanInstallUseCase trata todos los archivos como Obligatorio | El FileMergeEngine recibe solo las reglas Obligatorio (todas); el motor aplica overwrite |
| F3-A4 | UpdateWorkspaceUseCase filtra reglas internamente | Recibe todas las reglas pero solo pasa Obligatorio + Estándar al motor; Opcional se excluye |
| F3-A5 | Modo interactivo es el default (`codice` sin flags) | UX: usuarios nuevos deben ver el menú guided; power users usan flags |

---

## Dependency Graph

```
T3.1: CleanInstallUseCase          T3.2: ProjectInstallUseCase         T3.3: UpdateWorkspaceUseCase
    │                                  │                                   │
    ├── IFileSystem                    ├── IFileSystem                     ├── IFileSystem
    ├── FileMergeEngine                ├── FileMergeEngine                 ├── FileMergeEngine
    ├── IUserPrompt                    ├── FileRuleManifest (F2 ✅)        ├── VersionComparator (F2 ✅)
    │                             T3.1 + T3.2 en paralelo               ├── IGitHubClient
    │                                                                        │
    └──────────────────────────┬─────────────────────────────────────────────┘
                               │
                         T3.4: main.ts (CLI wiring)
                               │
                         T3.5: SIGINT handling
                               │
                         T3.6: Integration tests
```

**T3.1 y T3.2 son completamente paralelos** — no comparten estado ni dependencias cruzadas.
**T3.3 depende de T3.1/T3.2?** No — usa los mismos puertos pero tiene lógica adicional de version check. Puede implementarse en paralelo.
**T3.4 requiere T3.1, T3.2, T3.3** — necesita los 3 use cases instanciados.
**T3.5 requiere T3.4** — el handler referencia las funciones de cleanup.
**T3.6 requiere todos los anteriores** — tests de integración end-to-end.

---

## Task List

### Phase 1: Use Cases

#### Task F3-T1: CleanInstallUseCase — implementación completa

**Descripción:** Implementar el caso de uso para instalación limpia. Recibe `IFileSystem` y `FileMergeEngine` via constructor. Obtiene todas las reglas del `FILE_RULE_MANIFEST`, las pasa todas como Obligatorio al motor, y ejecuta. Si `isEmpty()` retorna false Y `--force` no está activo, pide confirmación. Al terminar exitosamente, escribe `.codice-version`.

**Acceptance criteria:**
- [ ] Constructor recibe `IFileSystem`, `FileMergeEngine`, `IUserPrompt`
- [ ] `execute(destinationPath: string, options?: { force?: boolean }): Promise<Result<void, Error>>`
- [ ] Si `destinationExists()` es false → error accionable "Directory does not exist"
- [ ] Si `isWritable()` es false → error accionable "Permission denied"
- [ ] Si `isEmpty()` es false Y `force === false` → pide confirmación via `confirm()`
- [ ] Si usuario rechaza → retorna `Result.ok()` (no error, cancelación graceful)
- [ ] Obtiene todas las reglas de `FILE_RULE_MANIFEST` y las pasa al motor
- [ ] Llama `fileMergeEngine.execute(allRules)` — todas como Obligatorio
- [ ] En éxito → `writeVersionFile()` con la versión actual
- [ ] En error → retorna `Result.err()` con mensaje accionable
- [ ] **Zero runtime dependencies** en el use case (sin Bun, fetch, process)
- [ ] Logs en verbose mode: cada decisión emit un objeto JSON a stderr

**Verification:**
- [ ] `bun test tests/integration/` → todos pasan
- [ ] `just lint` pasa con cero warnings
- [ ] `tsc --noEmit` pasa (ningún `any`)
- [ ] Cobertura del use case > 70%

**Dependencies:** F1 (IFileSystem, FileMergeEngine) ✅, F2 (FILE_RULE_MANIFEST) ✅

**Files touched:**
- `src/application/use-cases/CleanInstallUseCase.ts` — reemplazar stub con implementación

**Estimated scope:** M

---

#### Task F3-T2: ProjectInstallUseCase — implementación completa

**Descripción:** Implementar el caso de uso para instalación en proyecto existente. Aplica clasificación: Obligatorio siempre, Estándar solo si no existe, Opcional solo si el usuario los selecciona. Presenta el checklist de opcionales al usuario vía `IUserPrompt.selectOptional()`. Al terminar, escribe `.codice-version` con las selecciones.

**Acceptance criteria:**
- [ ] Constructor recibe `IFileSystem`, `FileMergeEngine`, `FileRuleManifest`, `IUserPrompt`
- [ ] `execute(destinationPath: string, options?: { force?: boolean }): Promise<Result<void, Error>>`
- [ ] Valida `isWritable()` antes de cualquier operación
- [ ] Obtiene reglas Obligatorio: `getMandatoryRules()` → siempre al motor
- [ ] Obtiene reglas Estandar: `getStandardRules()` → solo si `destinationExists() === false`
- [ ] Obtiene reglas Opcional: `getOptionalRules()` → presenta multiselect al usuario
- [ ] Si `force === true` → salta el multiselect, no copia opcionales
- [ ] Si usuario cancela multiselect → continúa sin opcionales (no es error)
- [ ] Construye array de reglas a aplicar y llama `fileMergeEngine.execute(rules)`
- [ ] En éxito → `writeVersionFile()` con selections de opcionales
- [ ] **Zero runtime dependencies** en el use case
- [ ] Logs en verbose mode: cada categoría procesada y count de archivos

**Verification:**
- [ ] `bun test tests/integration/` → todos pasan
- [ ] `just lint` pasa con cero warnings
- [ ] Cobertura del use case > 70%

**Dependencies:** F1 (IFileSystem, FileMergeEngine) ✅, F2 (FileRuleManifest) ✅

**Files touched:**
- `src/application/use-cases/ProjectInstallUseCase.ts` — reemplazar stub con implementación

**Estimated scope:** M

---

#### Task F3-T3: UpdateWorkspaceUseCase — implementación completa

**Descripción:** Implementar el caso de uso para actualización de workspace existente. Consulta GitHub para la versión latest, compara con la local, y si hay update disponible aplica solo Obligatorio + Estandar (nunca Opcional). El flujo es el más complejo por el version check.

**Acceptance criteria:**
- [ ] Constructor recibe `IFileSystem`, `FileMergeEngine`, `FileRuleManifest`, `IGitHubClient`, `IUserPrompt`
- [ ] `execute(destinationPath: string, options?: { force?: boolean }): Promise<Result<void, Error>>`
- [ ] Lee `.codice-version` con `readVersionFile()` — si null/missing, treat as unknown
- [ ] Consulta `githubClient.getLatestReleaseTag()` — si null, proceed con advertencia
- [ ] Si `githubClient.getLatestReleaseNotes()` disponible, la muestra al usuario
- [ ] `VersionComparator.compare(local, remote)`:
  - `"equal"` → info al usuario "already latest", retorna `Result.ok()`
  - `"older"` (local > remote) → info "local is newer", retorna `Result.ok()`
  - `"newer"` (local < remote) → proceed con update
  - Error → proceed con advertencia
- [ ] Si `force === false` → pide confirmación con `confirm()`
- [ ] Si usuario rechaza → retorna `Result.ok()` (no error)
- [ ] Obtiene Obligatorio + Estandar (nunca Opcional) y pasa al motor
- [ ] En éxito → `writeVersionFile()` con la nueva versión
- [ ] **Zero runtime dependencies** en el use case
- [ ] Logs en verbose mode: local/remote version, tipo de release, count de archivos

**Verification:**
- [ ] `bun test tests/integration/` → todos pasan
- [ ] `just lint` pasa con cero warnings
- [ ] Cobertura del use case > 70%

**Dependencies:** F1 ✅, F2 (FileRuleManifest, VersionComparator) ✅

**Files touched:**
- `src/application/use-cases/UpdateWorkspaceUseCase.ts` — reemplazar stub con implementación

**Estimated scope:** M

---

### Phase 2: CLI Wiring

#### Task F3-T4: main.ts — argument parsing y dependency injection

**Descripción:** Implementar el composition root completo en `main.ts`. Parsear args, instanciar adaptadores, inyectar en use cases, y hacer dispatch al modo correspondiente (interactive default o flags). Incluye también la gestión de `--verbose` (logs JSON a stderr).

**Acceptance criteria:**
- [ ] Flags terminales (`--help`, `--version`) se procesan primero, exit inmediato
- [ ] Flags de modo (`--clean`, `--project`, `--update`) son mutuamente excluyentes
- [ ] Si múltiples mode flags → exit 2 con mensaje de error claro
- [ ] `--force` (`-f`) se propaga a los use cases
- [ ] `--verbose` activa logging estructurado JSON a stderr
- [ ] Modo interactivo (sin flags): renderiza TUI con `ClackPromptsAdapter`, presenta menú de 3 opciones
- [ ] Modo non-interactive: ejecuta el use case correspondiente directamente sin TUI
- [ ] Instanciación de adaptadores:
  ```
  BunFileSystem → IFileSystem
  GitHubRestClient → IGitHubClient
  ClackPromptsAdapter → IUserPrompt
  ```
- [ ] Instanciación de use cases:
  ```
  CleanInstallUseCase(fileSystem, mergeEngine, prompts)
  ProjectInstallUseCase(fileSystem, mergeEngine, manifest, prompts)
  UpdateWorkspaceUseCase(fileSystem, mergeEngine, manifest, github, prompts)
  ```
- [ ] Exit codes: 0 (éxito), 1 (runtime error), 2 (CLI usage), 130 (SIGINT)
- [ ] Error messages son accionables (ej: no "Error EACCES", sí "Permission denied at /path...")
- [ ] `VERSION` se importa de `package.json` o se hardcodea en `constants.ts`

**Verification:**
- [ ] `bun run src/cli/main.ts --help` → muestra help y exit 0
- [ ] `bun run src/cli/main.ts --version` → muestra versión y exit 0
- [ ] `bun run src/cli/main.ts --clean --project` → exit 2 con mensaje de modo冲突
- [ ] `bun run src/cli/main.ts` → запускает интерактивное меню (проверить что no error en этом режиме)

**Dependencies:** T3.1 ✅, T3.2 ✅, T3.3 ✅

**Files touched:**
- `src/cli/main.ts` — reemplazar stub con implementación completa

**Estimated scope:** L

---

#### Task F3-T5: SIGINT handler y graceful shutdown

**Descripción:** Añadir manejo de señales `SIGINT` (`Ctrl+C`) en `main.ts`. Si una operación está en curso, cancelar el spinner activo, limpiar el staging directory, y salir con código 130.

**Acceptance criteria:**
- [ ] `process.on("SIGINT", handler)` registrado antes de cualquier operación async
- [ ] Si hay staging directory activo → `fileSystem.cleanStaging()` antes de salir
- [ ] Si no hay operación en curso → exit 130 inmediato (sin cleanup)
- [ ] El handler solo se registra una vez (no double-registration en re-ejecuciones)
- [ ] El handler no mata el proceso si no hay operación activa
- [ ] Mensaje: `"⚠️ Operation cancelled by user."` antes de exit 130
- [ ] En verbose mode → emite `{"level":"warn","phase":"sigint","message":"..."}` a stderr

**Verification:**
- [ ] Enviar SIGINT durante spinner → staging limpiado, exit 130
- [ ] Enviar SIGINT antes de cualquier operación → exit 130 inmediato
- [ ] `bun test` pasa sin regression

**Dependencies:** T3.4 ✅

**Files touched:**
- `src/cli/main.ts` — añadir handler

**Estimated scope:** S

---

### Phase 3: Testing

#### Task F3-T6: Integration tests para use cases

**Descripción:** Tests de integración para los 3 use cases usando mocks de los ports. Los tests verifican el flujo completo de cada modo sin tocar disco real ni red real.

**CleanInstallUseCase tests:**
- `execute()` con directorio vacío → éxito, staging + commit
- `execute()` con directorio no vacío + `force=false` → pide confirmación
- `execute()` con directorio no vacío + usuario rechaza → `Result.ok()`, no copy
- `execute()` con directorio no vacía + `force=true` → éxito sin confirmación
- `execute()` con directorio no writable → `Result.err()` con EACCES
- `execute()` llama `writeVersionFile()` al terminar

**ProjectInstallUseCase tests:**
- `execute()` copia Obligatorio siempre
- `execute()` copia Estandar solo si destination no existe
- `execute()` NO sobrescribe Estandar existente
- `execute()` presenta multiselect para Opcional
- `execute()` con `force=true` → skip multiselect, no opcionales
- `execute()` con usuario cancelando → continúa sin opcionales

**UpdateWorkspaceUseCase tests:**
- `execute()` con local == remote → info + `Result.ok()` sin copy
- `execute()` con local > remote → info + `Result.ok()` sin copy
- `execute()` con local < remote → proceed con copy
- `execute()` con red fallida → proceed con advertencia
- `execute()` con `force=false` → pide confirmación
- `execute()` copia solo Obligatorio + Estandar (no Opcional)

**Acceptance criteria:**
- [ ] ≥5 tests por use case (≥15 tests total)
- [ ] Mock de `IFileSystem` que registra calls sin tocar disco
- [ ] Mock de `IGitHubClient` que retorna predefined responses
- [ ] Mock de `IUserPrompt` que simula user input
- [ ] `bun test tests/integration/` → todos pasan
- [ ] Cobertura de use cases > 70%

**Verification:**
- [ ] `bun test` → todos pasan sin regression
- [ ] `just lint` pasa con cero warnings

**Dependencies:** T3.1 ✅, T3.2 ✅, T3.3 ✅, T3.4 ✅

**Files touched:**
- `tests/integration/use-cases/clean-install.test.ts` — nuevo
- `tests/integration/use-cases/project-install.test.ts` — nuevo
- `tests/integration/use-cases/update-workspace.test.ts` — nuevo

**Estimated scope:** M

---

## Checkpoint: Después de F3-T1 a F3-T6

| Checkpoint Item | Status |
|-----------------|--------|
| CleanInstallUseCase: implementada con staging + commit | ⏳ Pendiente |
| ProjectInstallUseCase: clasificación 3 vías funcionando | ⏳ Pendiente |
| UpdateWorkspaceUseCase: version check + selective update | ⏳ Pendiente |
| main.ts: CLI completo con modo interactivo y flags | ⏳ Pendiente |
| SIGINT: cleanup de staging + exit 130 | ⏳ Pendiente |
| Integration tests: ≥15 tests, >70% cobertura use cases | ⏳ Pendiente |
| `just lint` pasa en todos los archivos F3 | ⏳ Pendiente |
| `bun test` pasa sin regresión (214 + nuevos) | ⏳ Pendiente |

---

## Gate 3: F3 Review Checklist

Antes de marcar F3 como completo, verificar:

- [ ] `bun run src/cli/main.ts --help` funciona y muestra help correcta
- [ ] `bun run src/cli/main.ts --version` muestra versión y exit 0
- [ ] `bun run src/cli/main.ts` (sin args) запускает интерактивное меню (o al menos no crash)
- [ ] `bun run src/cli/main.ts --clean --project` → exit 2
- [ ] Los 3 use cases ejecutan sin `throw new Error("Not implemented")`
- [ ] `bun test tests/integration/` → todos pasando
- [ ] `just lint` → 0 errors, 0 warnings
- [ ] `tsc --noEmit` → limpio
- [ ] Los messages de error son accionables (no solo "Error")
- [ ] SIGINT durante operación limpia staging y sale 130

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Los use cases hacen demasiado (anemic domain) | Medium | Los use cases solo orquestan; toda la lógica está en domain (F2). Los use cases no tienen if/else de negocio, solo coordinación de puertos. |
| main.ts se convierte en god object | High | Mantener main.ts como wiring puro; extraer lógica de parsing a `cli/argument-parser.ts` si crece >100 líneas |
| ClackPromptsAdapter no puede mockearse en tests | Medium | Los integration tests usan mocks manuales de `IUserPrompt`; no dependen del adapter real |
| El staging cleanup en SIGINT no funciona en Windows | Low | Bun's `fs` polyfill maneja SIGINT de forma consistente; probar en CI con windows-latest |

---

## Open Questions — Resolved

| # | Question | Resolution |
|---|----------|-----------|
| F3-O1 | ¿Se puede mockear `@clack/prompts` en tests? | Los integration tests mockean `IUserPrompt` (la interfaz), no el adapter concreto. El ClackPromptsAdapter real solo se usa en main.ts. |
| F3-O2 | ¿De dónde viene la versión para `--version`? | Se hardcodea en `src/infrastructure/config/constants.ts` como `CODICE_VERSION`. Debe actualizarse manualmente en cada release. |
| F3-O3 | ¿Dónde se define el template path absoluto? | En `BunFileSystem` se resuelve desde `import.meta.dirname` o similar. El template se embebe en el binary en F5. |

---

## Phase Summary

| Task | Description | Duration |
|------|-------------|----------|
| F3-T1 | CleanInstallUseCase: implementación completa | ~1.5 hrs |
| F3-T2 | ProjectInstallUseCase: implementación completa | ~1.5 hrs |
| F3-T3 | UpdateWorkspaceUseCase: implementación completa | ~2 hrs |
| F3-T4 | main.ts: CLI wiring + argument parsing + DI | ~2 hrs |
| F3-T5 | SIGINT handler + graceful shutdown | ~1 hr |
| F3-T6 | Integration tests para use cases | ~2 hrs |
| **Total F3** | **6 tasks** | **~10 hrs** |

---

*Last updated: 2026-06-14*