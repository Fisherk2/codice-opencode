# TODO: Fase FEV-10 — Code Quality + Dependency Upgrades (v1.1.0)

**Estado:** 🟡 Pendiente — 0/38 tareas completadas
**Fecha:** 2026-07-10
**Items TECH_DEBT:** TD-1.1, TD-2.1, TD-3.1, TD-3.2, TD-5.3
**Branch:** `feat/v1.1.0-fev-10`
**Versión objetivo:** v1.1.0

## Estrategia

4 vertical slices + cierre, ordenados por riesgo creciente:

1. **Slice 1** — TD-1.1: main.ts tests (riesgo bajo, ~2.5h)
2. **Slice 2** — TD-3.1: TypeScript 6.x upgrade (riesgo medio, ~2h)
3. **Slice 3** — TD-2.1: IFileSystem → IFileSystem + IStagingSystem (riesgo medio, ~3.5h)
4. **Slice 4** — TD-5.3: npm packaging integration test (riesgo medio-alto, ~4h)
5. **Slice 5** — TECH_DEBT update + release prep (riesgo bajo, ~1.5h)

**Total esfuerzo:** ~13.5h distribuidas en 4-5 sesiones.

**Decisión arquitectónica confirmada (TD-2.1):** Opción A — solo 4 métodos de staging migran a `IStagingSystem`. `destinationExists()` se queda en `IFileSystem`.

---

## Slice 1: TD-1.1 — main.ts Integration Tests (2.5h)

### T1.1: Cubrir flag handling `--version`/`-V` y `--help`/`-h`
- [ ] Test `args.includes("--version")` → `printVersion()` + `EXIT_SUCCESS`
- [ ] Test `args.includes("-V")` → idem
- [ ] Test `args.includes("--help")` → `printHelp()` + `EXIT_SUCCESS`
- [ ] Test `args.includes("-h")` → idem
- [ ] Test: `parseArgs` NO se llama cuando flag terminal está presente
- **Archivo:** `tests/integration/cli/main.test.ts`
- **Estimado:** 30min

### T1.2: Cubrir parse failure
- [ ] Test `parseArgs(args) === null` → `console.error("Usage error...")` + `EXIT_USAGE`
- [ ] Test: mensaje de error es accionable
- **Archivo:** idem
- **Estimado:** 20min

### T1.3: Cubrir SIGINT handler
- [ ] Test `process.on("SIGINT", handleSigint)` setup
- [ ] Test doble SIGINT idempotente (`if (interrupted) return`)
- [ ] Test primer SIGINT → `process.exit(EXIT_INTERRUPT)`
- **Archivo:** idem
- **Estimado:** 30min

### T1.4: Cubrir interactive mode flow
- [ ] Test `mode === "interactive"` → `showIntro()` + `promptForMode()`
- [ ] Test `selected === null` → `showCancel("Installation cancelled.")` + `EXIT_INTERRUPT`
- [ ] Test selección válida (`"clean"`/`"project"`/`"update"`) → resolución correcta
- **Archivo:** idem
- **Estimado:** 30min

### T1.5: Cubrir success/error path
- [ ] Test `result.ok === false` → `showError(result.error.message)` + `EXIT_ERROR`
- [ ] Test `result.ok === true` → `EXIT_SUCCESS` (sin showError)
- **Archivo:** idem
- **Estimado:** 20min

### T1.6: Cubrir catch + finally
- [ ] Test throw unexpected → `console.error("Fatal error: ...")` + `EXIT_ERROR`
- [ ] Test `finally`: `process.off("SIGINT", handleSigint)` se ejecuta siempre
- **Archivo:** idem
- **Estimado:** 20min

### T1.7: Checkpoint A verification
- [ ] `src/cli/main.ts` coverage ≥ 95% lines
- [ ] 0 regresión en tests (563 → ≥575)
- [ ] `just check` exit 0
- **Comandos:**
  ```bash
  bun test tests/integration/cli/main.test.ts
  bun test --coverage src/cli/main.ts
  just check
  ```

---

## Slice 2: TD-3.1 — TypeScript 6.x Upgrade (2h)

### T2.1: Verificar versión actual disponible de TS 6.x
- [ ] Confirmar TS 6.x es estable para producción
- [ ] Identificar breaking changes principales
- **Estimado:** 10min

### T2.2: Bump version en package.json
- [ ] `"typescript": "^5.9.3"` → `"^6"`
- [ ] Commit: `chore(deps): upgrade typescript to v6.x`
- **Archivo:** `package.json`
- **Estimado:** 5min

### T2.3: `bun install` + `just check` para detectar breaking changes
- [ ] `bun install` exit 0
- [ ] `just check` exit 0
- **Estimado:** 30min

### T2.4: Resolver errores de tipo introducidos por TS 6.x
- [ ] 0 errores `tsc --noEmit`
- [ ] Si hay cambios no triviales: `docs/diagnosis/fixTS6-migration.md`
- **Estimado:** 60min

### T2.5: Verificar suite completa
- [ ] `bun test tests/` 563/0 pass
- [ ] `just test-e2e` 15/15 passing
- **Estimado:** 10min

### T2.6: Checkpoint B verification
- [ ] `tsc --version` ≥ 6.0
- [ ] `just check` exit 0
- [ ] Tests sin regresión

---

## Slice 3: TD-2.1 — IFileSystem → IFileSystem + IStagingSystem (3.5h)

### T3.1: Crear `IStagingSystem` port en domain
- [ ] Archivo `src/domain/ports/IStagingSystem.ts` con 4 métodos
- [ ] JSDoc por método
- [ ] Cohesión 100%
- **Estimado:** 20min

### T3.2: Reducir `IFileSystem` a 6 métodos
- [ ] Quedan: `readTemplateFile`, `destinationExists`, `isWritable`, `isEmpty`, `writeVersionFile`, `readVersionFile`
- [ ] Eliminar 4 métodos de staging
- [ ] JSDoc actualizado
- **Archivo:** `src/domain/ports/IFileSystem.ts`
- **Estimado:** 10min

### T3.3: `BunFileSystem implements IFileSystem, IStagingSystem`
- [ ] Agregar `implements IFileSystem, IStagingSystem`
- [ ] 4 métodos de staging ya existen como delegates
- [ ] `tsc --noEmit` exit 0
- **Archivo:** `src/infrastructure/adapters/BunFileSystem.ts`
- **Estimado:** 20min

### T3.4: Cambiar firma de `FileMergeEngine` y `helpers.ts`
- [ ] `FileMergeEngine` constructor acepta `IFileSystem & IStagingSystem`
- [ ] `helpers.ts` acepta `IStagingSystem` para `cleanStaging()`
- [ ] `tsc --noEmit` exit 0
- **Archivos:**
  - `src/domain/services/FileMergeEngine.ts`
  - `src/application/helpers.ts`
- **Estimado:** 30min

### T3.5: Cambiar constructores de los 3 use cases
- [ ] `CleanInstallUseCase` + `ProjectInstallUseCase` aceptan `IFileSystem & IStagingSystem`
- [ ] `UpdateWorkspaceUseCase` acepta solo `IStagingSystem` (Update solo muta)
- [ ] `tsc --noEmit` exit 0
- **Archivos:**
  - `src/application/use-cases/CleanInstallUseCase.ts`
  - `src/application/use-cases/ProjectInstallUseCase.ts`
  - `src/application/use-cases/UpdateWorkspaceUseCase.ts`
- **Estimado:** 30min

### T3.6: Actualizar `container.ts`
- [ ] `createDependencies` pasa `BunFileSystem` casteada a `IStagingSystem`
- [ ] Firma pública de `createDependencies` sin cambios
- [ ] `tsc --noEmit` exit 0
- **Archivo:** `src/cli/container.ts`
- **Estimado:** 15min

### T3.7: Tests `bun-file-system.test.ts` — IStagingSystem conformance
- [ ] Test: `BunFileSystem` satisface `IStagingSystem` (compile-time + runtime)
- [ ] Tests existentes sin regresión
- **Archivo:** `tests/integration/adapters/bun-file-system.test.ts`
- **Estimado:** 20min

### T3.8: Tests `main.test.ts` mock — añadir IStagingSystem
- [ ] `createMockDeps` con `IStagingSystem`
- [ ] Tests existentes sin regresión
- **Archivo:** `tests/integration/cli/main.test.ts`
- **Estimado:** 15min

### T3.9: Checkpoint C verification
- [ ] `just check` exit 0
- [ ] `bun test tests/` ≥563/0 pass
- [ ] `just test-e2e` 15/15 passing
- **Comandos:**
  ```bash
  just check
  bun test tests/
  just test-e2e
  rg -c "^\s*\w*(\w*\(|\w*):" src/domain/ports/IFileSystem.ts
  ```

### T3.10: ADR-011 + CHANGELOG
- [ ] `specs/adr/adr-011-ifilesystem-split.md` con contexto, decisión, consecuencias, alternativas
- [ ] CHANGELOG entry v1.1.0
- [ ] Commit: `docs(adr): add ADR-011 for IFileSystem split`
- **Estimado:** 30min

---

## Slice 4: TD-5.3 — npm Packaging Integration Test (4h)

### T4.1: Setup: helper `packTarball()`
- [ ] Helper que ejecuta `bun pm pack` o `npm pack` en temp dir
- [ ] Captura tarball path
- [ ] Skip automático si `SKIP_NETWORK_TESTS=1`
- **Archivo:** `tests/integration/packaging/packaging-helpers.ts` (nuevo)
- **Estimado:** 30min

### T4.2: Setup: helper `extractAndInspect()`
- [ ] Extrae tarball a temp dir
- [ ] Verifica estructura mínima: `template/`, `package.json`, `bin`
- [ ] Retorna metadata
- **Archivo:** idem
- **Estimado:** 30min

### T4.3: Test A — `npm pack --dry-run` lista archivos esperados
- [ ] Tarball incluye: `template/obligatorio/opencode.json`, `template/obligatorio/agents/`, `template/obligatorio/commands/`, `template/estandar/gitignore`
- [ ] Tarball NO incluye: `template/estandar/.gitignore`, `template/obligatorio/.opencode/.gitignore`
- **Archivo:** `tests/integration/packaging/npm-pack.test.ts` (nuevo)
- **Estimado:** 30min

### T4.4: Test B — Install tarball + ejecutar binary `--version`
- [ ] Install tarball en `node_modules/@fisherk2-dev/codice-test/`
- [ ] Ejecutar `--version` exit 0
- [ ] Output esperado
- **Archivo:** idem
- **Estimado:** 60min

### T4.5: Test C — Ejecutar modo `clean` desde paquete instalado
- [ ] `clean` mode en temp dir
- [ ] Template resolution funciona (no `Template file not found`)
- [ ] `.gitignore` se genera post-installation
- [ ] Symlinks se generan post-installation
- **Archivo:** idem
- **Estimado:** 60min

### T4.6: Test D — Verificar que symlinks NO están en el tarball
- [ ] Tarball NO contiene symlinks en `template/`
- [ ] Documenta ADR-008 (symlinks post-installation)
- **Archivo:** idem
- **Estimado:** 20min

### T4.7: Test E — Verificar que `.gitignore` no está en el tarball
- [ ] Tarball NO contiene `template/estandar/.gitignore` (npm excluye)
- [ ] Tarball SÍ contiene `template/estandar/gitignore` (renombrado)
- [ ] Documenta ADR-009
- **Archivo:** idem
- **Estimado:** 20min

### T4.8: Wire-up CI — nuevo job en `ci.yml`
- [ ] Job `test-packaging` en `.github/workflows/ci.yml`
- [ ] Solo Linux
- [ ] Setup: `bun install` + `bun test tests/integration/packaging/`
- [ ] Timeout: 5min
- **Archivo:** `.github/workflows/ci.yml`
- **Estimado:** 20min

### T4.9: Documentación en CONTRIBUTING.md
- [ ] Sección "Packaging tests"
- [ ] Cómo correr localmente
- [ ] Skip con `SKIP_NETWORK_TESTS=1`
- [ ] Interpretación de fallos
- **Archivo:** `CONTRIBUTING.md`
- **Estimado:** 15min

### T4.10: Checkpoint D verification
- [ ] 5 nuevos tests pasan localmente
- [ ] Job CI agregado
- [ ] Coverage Slices 1-4 sin regresión
- **Comandos:**
  ```bash
  bun test tests/integration/packaging/
  just check
  just test-e2e
  ```

---

## Slice 5: TECH_DEBT Update + Release Prep (1.5h)

### T5.1: Mover TD-3.2 a "Resolved"
- [ ] Sección `## Resolved` con TD-3.2 fechada 2026-07-10
- **Archivo:** `docs/TECH_DEBT.md`
- **Estimado:** 5min

### T5.2: Mover TD-1.1, TD-2.1, TD-3.1, TD-5.3 a "Resolved"
- [ ] 4 items con fecha, commit ref, métricas verificadas
- **Archivo:** idem
- **Estimado:** 10min

### T5.3: Actualizar `docs/WORKFLOW.md` con resumen FEV-10
- [ ] Sección FEV-10 marcada ✅ Completo
- [ ] Métricas finales, commits, code review findings
- **Archivo:** `docs/WORKFLOW.md`
- **Estimado:** 20min

### T5.4: CHANGELOG entries v1.1.0 FEV-10
- [ ] Sección `v1.1.0` con entries de FEV-10
- [ ] Categorías: Added, Changed, Fixed
- **Archivo:** `CHANGELOG.md`
- **Estimado:** 15min

### T5.5: Tag + release v1.1.0
- [ ] PR `feat/v1.1.0-fev-10` → `develop` (squash merge)
- [ ] PR `develop` → `main` (squash merge)
- [ ] Tag `v1.1.0` creado y pusheado
- [ ] Release workflow publica binarios + npm
- [ ] `npm view @fisherk2-dev/codice@latest version` → `1.1.0`
- **Estimado:** 20min

### T5.6: Checkpoint E verification
- [ ] `git tag v1.1.0 && git push --tags` exit 0
- [ ] `npm view @fisherk2-dev/codice@latest version` → `1.1.0`
- [ ] GitHub Release visible con 3 binarios

---

## Verificación Final (cierre v1.1.0)

| Check | Comando | Criterio |
|---|---|---|
| Tests | `bun test tests/` | ≥580 / 0 |
| main.ts coverage | `bun test --coverage src/cli/main.ts` | ≥95% lines |
| Coverage global | `bun test --coverage` | ≥98.5% funciones, ≥97% líneas |
| IFileSystem methods | `rg -c "^\s*[a-z]\w*\s*\(" src/domain/ports/IFileSystem.ts` | ≤6 |
| IStagingSystem methods | `rg -c "^\s*[a-z]\w*\s*\(" src/domain/ports/IStagingSystem.ts` | =4 |
| TypeScript | `tsc --version` | ≥ 6.0 |
| Packaging tests | `bun test tests/integration/packaging/` | 5/5 |
| E2E | `just test-e2e` | 15/15 |
| Biome | `just lint` | 0 errors |
| Tech debt open | `rg "^\|.*🟡\|🔴" docs/TECH_DEBT.md` | 0 |
| ADRs | `ls specs/adr/adr-011*` | existe |
| Release tag | `git tag -l "v1.1.0"` | existe |
| npm latest | `npm view @fisherk2-dev/codice@latest version` | `1.1.0` |

---

## Resumen de Commits Esperados

| Commit | Mensaje | Slice |
|---|---|---|
| 1 | `test(cli): add flag handling and parse failure coverage` | S1 |
| 2 | `test(cli): add SIGINT and interactive mode coverage` | S1 |
| 3 | `test(cli): add success/error and catch coverage` | S1 |
| 4 | `chore(deps): upgrade typescript to v6.x` | S2 |
| 5 | `refactor(domain): split IFileSystem into IFileSystem and IStagingSystem` | S3 |
| 6 | `refactor(infrastructure): BunFileSystem implements IFileSystem, IStagingSystem` | S3 |
| 7 | `refactor(application): use cases accept IStagingSystem for staging operations` | S3 |
| 8 | `test(adapters): verify BunFileSystem IStagingSystem conformance` | S3 |
| 9 | `docs(adr): add ADR-011 for IFileSystem split` | S3 |
| 10 | `test(packaging): add npm packaging integration tests` | S4 |
| 11 | `ci(workflows): add packaging test job to ci.yml` | S4 |
| 12 | `docs(contributing): add packaging tests section` | S4 |
| 13 | `docs(tech-debt): mark FEV-10 items as resolved` | S5 |
| 14 | `docs(workflow): add FEV-10 completion summary` | S5 |
| 15 | `docs(changelog): add v1.1.0 FEV-10 entries` | S5 |
| 16 | `chore(release): tag v1.1.0` | S5 |

**Co-Authored-By:** Moctezuma <dev@fisherk2.com> (en todos)
