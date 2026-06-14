# TODO: F3 – Interfaces (Casos de Uso y CLI)

**Estado:** 🟢 Listo para Planificar
**Fecha:** 2026-06-14
**Dependencias:** F0 ✅ Completado → F1 ✅ Completado → F2 ✅ Completado → F3 🟢 En Planificación

---

## Phase 1: Use Cases

### F3-T1: CleanInstallUseCase — implementación completa

**Descripción:** Implementar el caso de uso para instalación limpia. Recibe `IFileSystem`, `FileMergeEngine`, `IUserPrompt` via constructor. Valida directorio, confirma si no-vacío, copia todos los archivos como Obligatorio, escribe `.codice-version`.

**Criterios de aceptación:**
- [ ] Constructor recibe `IFileSystem`, `FileMergeEngine`, `IUserPrompt`
- [ ] `execute(destinationPath, options?)` retorna `Promise<Result<void, Error>>`
- [ ] Valida `isWritable()` → error accionable si no
- [ ] Si directorio no-vacío + `force=false` → pide confirmación
- [ ] Si usuario rechaza → `Result.ok()` (cancelación graceful)
- [ ] Copia todas las reglas como Obligatorio via `FileMergeEngine`
- [ ] En éxito → `writeVersionFile()`
- [ ] Logs en verbose mode (JSON a stderr)

**Verificación:**
- [ ] `bun test tests/integration/` → todos pasan
- [ ] `just lint` pasa con cero warnings
- [ ] Cobertura del use case > 70%

**Dependencias:** F1 ✅, F2 ✅
**Scope:** M

---

### F3-T2: ProjectInstallUseCase — implementación completa

**Descripción:** Instalación selectiva en proyecto existente. Clasifica archivos: Obligatorio siempre, Estandar si no existe, Opcional si usuario los selecciona.

**Criterios de aceptación:**
- [ ] Constructor recibe `IFileSystem`, `FileMergeEngine`, `FileRuleManifest`, `IUserPrompt`
- [ ] `execute(destinationPath, options?)` retorna `Promise<Result<void, Error>>`
- [ ] Obligatorio → siempre al motor
- [ ] Estandar → solo si `destinationExists() === false`
- [ ] Opcional → presenta multiselect, solo si seleccionado
- [ ] `force=true` → skip multiselect, no opcionales
- [ ] En éxito → `writeVersionFile()` con selections
- [ ] Logs en verbose mode

**Verificación:**
- [ ] `bun test tests/integration/` → todos pasan
- [ ] Cobertura del use case > 70%

**Dependencias:** F1 ✅, F2 ✅
**Scope:** M

---

### F3-T3: UpdateWorkspaceUseCase — implementación completa

**Descripción:** Actualización con version check. Consulta GitHub, compara versiones, copia solo Obligatorio + Estandar (nunca Opcional).

**Criterios de aceptación:**
- [ ] Constructor recibe `IFileSystem`, `FileMergeEngine`, `FileRuleManifest`, `IGitHubClient`, `IUserPrompt`
- [ ] `execute(destinationPath, options?)` retorna `Promise<Result<void, Error>>`
- [ ] Lee `.codice-version` con `readVersionFile()` — treat as unknown si missing
- [ ] Consulta `getLatestReleaseTag()` — proceed con advertencia si falla
- [ ] `VersionComparator.compare()`: equal/older → info + `Result.ok()`; newer → proceed
- [ ] Si `force=false` → pide confirmación
- [ ] Copia Obligatorio + Estandar (excluye Opcional)
- [ ] En éxito → `writeVersionFile()` con nueva versión
- [ ] Logs en verbose mode

**Verificación:**
- [ ] `bun test tests/integration/` → todos pasan
- [ ] Cobertura del use case > 70%

**Dependencias:** F1 ✅, F2 ✅
**Scope:** M

---

## Phase 2: CLI Wiring

### F3-T4: main.ts — argument parsing y dependency injection

**Descripción:** Composition root completo. Parsea args, instancia adaptadores, inyecta en use cases, dispatch al modo interactivo o flags. Incluye `--verbose` logging.

**Criterios de aceptación:**
- [ ] `--help` / `-h` → help text + exit 0
- [ ] `--version` / `-V` → versión + exit 0
- [ ] Mode flags (`--clean`, `--project`, `--update`) mutuamente excluyentes → exit 2
- [ ] `--force` / `-f` se propaga a use cases
- [ ] `--verbose` activa logging JSON a stderr
- [ ] Sin flags → modo interactivo (TUI con @clack/prompts)
- [ ] Non-interactive → ejecuta use case sin TUI
- [ ] Instancia: BunFileSystem, GitHubRestClient, ClackPromptsAdapter
- [ ] Instancia los 3 use cases con sus dependencias
- [ ] Exit codes: 0, 1, 2, 130 según spec-cli-commands.md

**Verificación:**
- [ ] `bun run src/cli/main.ts --help` → exit 0
- [ ] `bun run src/cli/main.ts --version` → exit 0
- [ ] `bun run src/cli/main.ts --clean --project` → exit 2
- [ ] `bun run src/cli/main.ts` → no crash

**Dependencias:** F3-T1, F3-T2, F3-T3 ✅
**Scope:** L

---

### F3-T5: SIGINT handler y graceful shutdown

**Descripción:** Manejo de Ctrl+C. Limpia staging directory activo y sale con código 130.

**Criterios de aceptación:**
- [ ] `process.on("SIGINT", handler)` registrado antes de cualquier async
- [ ] Si staging activo → `cleanStaging()` antes de exit
- [ ] Si no hay operación activa → exit 130 inmediato
- [ ] Mensaje: `"⚠️ Operation cancelled by user."`
- [ ] No double-registration del handler
- [ ] Verbose mode → JSON log a stderr

**Verificación:**
- [ ] SIGINT durante operación → staging limpiado, exit 130
- [ ] `bun test` pasa sin regresión

**Dependencias:** F3-T4 ✅
**Scope:** S

---

## Phase 3: Testing

### F3-T6: Integration tests para use cases

**Descripción:** Tests de integración con mocks de ports. ≥5 tests por use case.

**Criterios de aceptación:**
- [ ] CleanInstallUseCase: ≥5 tests (vacío, no-vacío+confirm, force, permisos, versionFile)
- [ ] ProjectInstallUseCase: ≥5 tests (obligatorio, estandar, opcional, multiselect, force)
- [ ] UpdateWorkspaceUseCase: ≥5 tests (equal, older, newer, network fail, confirmation)
- [ ] Mocks manuales de `IFileSystem`, `IGitHubClient`, `IUserPrompt`
- [ ] `bun test tests/integration/` → todos pasan
- [ ] Cobertura de use cases > 70%

**Verificación:**
- [ ] `bun test --coverage` → cobertura > 70% en use cases

**Dependencias:** F3-T1, F3-T2, F3-T3, F3-T4 ✅
**Scope:** M

---

## Checkpoint: Después de F3-T1 a F3-T6

| Elemento de Checkpoint | Estado |
|------------------------|--------|
| CleanInstallUseCase: implementada con staging + commit | ⏳ Pendiente |
| ProjectInstallUseCase: clasificación 3 vías funcionando | ⏳ Pendiente |
| UpdateWorkspaceUseCase: version check + selective update | ⏳ Pendiente |
| main.ts: CLI completo con modo interactivo y flags | ⏳ Pendiente |
| SIGINT: cleanup de staging + exit 130 | ⏳ Pendiente |
| Integration tests: ≥15 tests, >70% cobertura use cases | ⏳ Pendiente |
| `just lint` pasa en todos los archivos F3 | ⏳ Pendiente |
| `bun test` pasa sin regresión | ⏳ Pendiente |

---

## Preguntas Abiertas — Resueltas

| # | Pregunta | Respuesta |
|---|----------|-----------|
| F3-O1 | ¿Se puede mockear `@clack/prompts` en tests? | Los integration tests mockean `IUserPrompt` (la interfaz), no el adapter concreto. |
| F3-O2 | ¿De dónde viene la versión para `--version`? | Se hardcodea en `src/infrastructure/config/constants.ts` como `CODICE_VERSION`. |
| F3-O3 | ¿Dónde se define el template path absoluto? | En `BunFileSystem` se resuelve desde `import.meta.dirname`. El template se embebe en el binary en F5. |

---

*Última actualización: 2026-06-14*