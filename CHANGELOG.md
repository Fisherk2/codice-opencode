# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.3] - 2026-09-22

Primera release estable de la línea nativa V2. Consolida la migración FEV-29/30 publicada en `2.1.3-beta.1` y todo el trabajo posterior: avisos de upgrade para instalaciones legacy, banner de deprecación single-source, endurecimiento fail-closed del gate de cobertura e infraestructura de tests formalizada. Métricas finales: 1913 tests, 31/31 e2e, cobertura 96.16% total / 98.95% en `src/cli/main.ts`.

### Added

- **ADR-021** (`specs/adr/adr-021-codemod-parser-and-placement.md`): el validador es el lector normativo del esquema V2; el parser del codemod queda congelado como herramienta one-shot de emisión verbatim; el trigger de promoción a `src/domain/services/` queda documentado y las constantes de esquema permanecen exportadas en el helper del validador.
- **Guard de higiene de código fuente**: `tests/unit/quality/source-hygiene.test.ts` falla ante cualquier byte de control crudo (C0 menos TAB/LF/CR, más DEL) en las superficies de texto rastreadas (`src`, `tests`, `scripts`, `template/obligatorio/packs`).
- **Aviso de remanentes del plugin SDD en update**: al actualizar desde una instalación `< 2.1.3` el flujo muestra la lista exacta de ficheros del plugin retirado que sobreviven como no gestionados (`.opencode/plugins/sdd-pipeline.ts`, `.opencode/plugins/src/destructivePatterns.ts`, `.opencode/plugins/src/normalizeBash.ts`, `.opencode/plugins/README.md`, `.opencode/plugins/tsconfig.json`) y advierte de no borrar `plugins/` (puede contener plugins de terceros). Cubre Option A, Option B y no interactivo.
- **Banner de deprecación runtime "Opencode Legacy" (FEV-30, #90)**: helper `src/application/legacyBanner.ts` que lee `.codice-version` e imprime `⚠ Opencode Legacy only — upgrade to ≥ 2.1.3 for native Opencode V2 support` para instalaciones ≤ 2.1.2. No bloqueante: archivo ausente o corrupto degrada a no-op silencioso.

### Changed

- **FEV-29 completado (#91)**: migración del template al formato nativo OpenCode V2 `permissions:` cerrada — 349 archivos, auditoría `tools:`/NUL, simplificación y review-round; salida verificada limpia con gates verdes.
- **FEV-30 completado (#90)**: remoción total del plugin SDD + banner runtime + hardening del review de 5 ejes (6 commits de fixes) — 20 commits en `hotfix/opencode-v2-migrate`.
- **Contrato de exit-code del codemod CLI** (`scripts/migrate-v1-to-v2-permissions.ts`): un dry-run con errores de validación sale `2` en lugar de `0`, para que el gating de CI no apruebe silenciosamente un review fallido; apply-with-errors sigue siendo `1` y una corrida limpia `0`. Ver `specs/spec-agent-format-v2.md` §6.
- **Aviso de deprecación V2 en la detección**: el banner "v2.0+ Installation Detected" ahora añade el aviso Opencode Legacy para instalaciones `< 2.1.3` antes del menú de modos; el flujo de update ya no lo repite (fuente única en `versionInfoMessages`).
- **Banner legacy single-source**: se elimina la llamada duplicada desde `CleanInstallUseCase`/`ProjectInstallUseCase` (main() ya muestra el header de detección); `isLegacyVersion`/`LEGACY_BANNER_MESSAGE` permanecen como fuente única consumida por el header y el flujo de update.
- **Infraestructura de tests formalizada**: los tests de validación de setup se mueven a `tests/setup/` (nueva recipe `just test-setup`), se elimina el agregador muerto `tests/setup/index.ts`, y se añaden tests que pinnean las recipes del Justfile y el workflow de release.
- **Umbrales de cobertura extraídos a `scripts/coverage-thresholds.json`**: fuente única para el umbral global (95%) y el sub-gate por fichero (`src/cli/main.ts`), consumida por `scripts/coverage-check.sh` y por CI sin duplicar el número.

### Fixed

- **Flags `disabled` explícitos por MCP** (`template/obligatorio/core/opencode.json`): cada servidor MCP declara su estado; solo context7, gitmcp y vercel-grep quedan habilitados, el resto explícitamente `disabled: true`.
- **Banner legacy corregido a ≥ 2.1.3**: el mensaje apuntaba a `2.1.4`, versión inexistente; ahora apunta a la release V2-native real.
- **Gate de cobertura endurecido (fail-closed)**: umbrales fuera de rango o `NaN`, sub-gate per-file inválido, override fuera de rango y sub-gate inaplicable (fichero ausente del reporte) ahora fallan en lugar de aprobar silenciosamente.
- **Ventana de retry del smoke de release ampliada a ~7.5 min** (30×15s): la propagación del registro puede tardar varios minutos y una ventana corta producía falsos negativos.
- **Brake emission position**: la cadena `subagent "*": deny` se añade después de todas las reglas de permisos existentes en lugar de a mitad del bloque.
- **Action/effect quoting + validation**: los valores `action:`/`effect:` emitidos se citan de forma consistente y se validan contra el conjunto de acciones conocidas antes de emitirse.
- **Depth fail-loud**: estructuras V1 `tools:` profundamente anidadas fallan de forma ruidosa en lugar de emitir salida parcial silenciosa.
- **Verbatim golden test**: un test dorado fija la emisión byte-preserving del frontmatter del codemod (`rawLine` passthrough).
- **Clave legacy `tools:` rechazada**: el validador de agentes ya no acepta el mapa V1 `tools:` ni su alias `validatePermission`, cerrando el hueco de shadowing silencioso (#91); eliminar la ruta muerta sube `coverage-check 95` de 93.34% a 96.00%.
- **Byte NUL crudo eliminado** de la clave duplicada del guard de permisos: el `0x00` literal pasa a ser el escape `\u0000`, de modo que grep/ripgrep y las herramientas de diff/lectura ya no tratan el fichero del validador como binario; la semántica no cambia y queda fijada por un test de colisión de separador.
- **Encabezados U+1F504 restaurados en 2 packs**: bytes UTF-8 que habían decaído a `=` + `0x04` quedan reparados.
- **Validación de charset en `installedPacks` de `WorkspaceVersion.fromJSON`**: las entradas que no son strings se rechazan en la deserialización en lugar de propagarse al estado del workspace.

### Removed

- **`scripts/migrate-all-packs.ts`** (+ `tests/unit/scripts/migrate-all-packs.test.ts`): el runner bulk de Fase 2 quedó redundante tras completarse la migración de los 8 packs pendientes; se conserva solo en el historial de git. Una futura re-migración llama directamente a `scripts/migrate-v1-to-v2-permissions.ts` (ver `specs/spec-agent-format-v2.md` §7).
- **Productor legacy `reformat-agent` retirado**: `scripts/reformat-agent.ts`, su wrapper CLI y su suite de tests se eliminan; el conversor FEV-18 emitía el mapa V1 `tools:`, que OpenCode V2 ignora y el validador ahora rechaza. Usa `scripts/migrate-v1-to-v2-permissions.ts`.
- **Plugin SDD eliminado por completo (FEV-30, #90)**: fuera del template `sdd-pipeline.ts` + sus módulos (`destructivePatterns.ts`, `normalizeBash.ts`), la copia dev, las suites de tests del plugin, el fixture `sdd-workflow-test`, las recipes `*-plugin` y el job `qa-plugin` de CI, además de los specs/ADR/diagnósticos históricos con scrub de prosa en docs/wiki. El plugin fallaba en cada startup en hosts Opencode V2; su única función residual (bloqueo de comandos destructivos) ya vive en las `permission.bash` deny-lists de `template/obligatorio/core/opencode.json`, conservadas como defensa en profundidad. Diagnóstico: `docs/diagnosis/fix27-sdd-plugin-removal-v2-incompatibility.md`.
- **ADR-017 retirado** (auto-discovery del plugin, superado por FEV-30).

### Security

- **Endurecimiento de permisos del template tras retirar el plugin SDD**: la auditoría de seguridad encontró que la deny-list estática no reemplaza la normalización/bloqueo exec que hacía el plugin retirado, y que varios comandos en `allow` eran bypassables: `find -execdir`/`xargs sh -c`/pipes `curl|sh` encadenan ejecución arbitraria, y `echo >> ~/.ssh/authorized_keys`, `sed → /etc/cron.d/`, `awk 'print > "path"'` escriben archivos arbitrarios (la redirección no es cubrible con wildcards de deny). Cambios en `template/obligatorio/core/opencode.json`: (1) `find`, `echo`, `printf`, `awk`, `sed`, `xargs`, `curl` (y `http`/httpie, misma clase de riesgo fetch-and-pipe) movidos de `allow` a `ask`; (2) nuevas denies de defensa en profundidad (`find * -exec *`, `find * -execdir *`, `xargs sh *`, `xargs bash *`, `xargs chmod *`, `xargs curl *`), variantes rm (`rm -fir`, `--force --recursive` y permutaciones) y secret-read sin ancla de espacio (`*.env`, `*.ssh/id_*`, `*aws/credentials`); (3) gaps de `read` cerrados (`*id_rsa*`, `*id_ed25519*`, `*id_ecdsa*`, `*.envrc*`, `**/.npmrc`, `credentials.json*`). Ninguna deny existente fue eliminada; suite de regresión en `tests/setup/opencode-config.test.ts` pinnea el JSON de permisos.

### Dependencies

- **`@clack/prompts` 1.8.1** (`^1.7.0` → `^1.8.1`; arrastra `@clack/core` 1.5.1).
- **`@biomejs/biome` 2.5.14** (`^2.5.10` → `^2.5.14`).
- **`@types/bun` 1.4.2** (`^1.4.0` → `^1.4.2`; arrastra `bun-types` 1.4.2).
- **`yaml` 2.9.1** (`^2.9.0` → `^2.9.1`).
- **`typescript` 7.0.2** (`^6.0.3` → `^7.0.2`): compilador nativo; `tsc --noEmit` limpio sobre 466 ficheros sin cambios de código. Cierra el PR #97 de Dependabot.
- **`softprops/action-gh-release` v3.0.3** (`3.0.2` → `3.0.3`, pin por SHA en `.github/workflows/release.yml`).

## [2.1.3-beta.1] - 2026-09-22

### Changed

- **FEV-29 completado (2026-09-22, #91)**: migración del template al formato nativo OpenCode V2 `permissions:` cerrada — 349 archivos, auditoría `tools:`/NUL, simplificación y review-round; salida verificada limpia con gates verdes. **FEV-30 completado (2026-09-22, #90)**: remoción total del plugin SDD + banner runtime `src/application/legacyBanner.ts` + hardening del review de 5 ejes (6 commits de fixes) — 20 commits en `hotfix/opencode-v2-migrate`, 1865 tests, 31/31 e2e. Release v2.1.3-beta.1.
- **Dry-run-with-errors exit-code contract for the codemod CLI** (`scripts/migrate-v1-to-v2-permissions.ts`): a dry run that surfaces validation errors now exits `2` instead of `0`, so CI gating cannot silently pass a failed review; apply-with-errors remains `1` and a clean run remains `0`. See `specs/spec-agent-format-v2.md` §6.

### Fixed

- **Brake emission position**: the `subagent "*": deny` chain brake is now appended after all existing permission rules instead of potentially landing mid-block.
- **Action/effect quoting + validation**: emitted `action:`/`effect:` values are quoted consistently and validated against the known-action set before emission.
- **Depth fail-loud**: deeply nested V1 `tools:` structures now fail loudly instead of silently emitting partial output.
- **Verbatim golden test**: a golden test pins byte-preserving frontmatter emit of the codemod (`rawLine` passthrough).
- **Legacy `tools:` frontmatter key now rejected**: The agent validator (`tests/unit/domain/helpers/agentFrontmatterValidator.ts`) no longer accepts the V1 `tools:` map or its `validatePermission` alias, closing the silent-shadowing loophole where OpenCode V2 ignores unknown keys (#91); removing the dead path lifts `coverage-check 95` from 93.34% to 96.00%.
- **Raw NUL byte removed from the permissions duplicate-guard key**: The literal `0x00` byte is now the `\u0000` escape, so grep/ripgrep and diff/read tooling no longer treat the validator file as binary; semantics are unchanged and pinned by a separator-collision test.
- **Mangled U+1F504 headings restored in 2 pack files**: UTF-8 bytes that had decayed into `=` + `0x04` are repaired.
- **Validación de charset en `installedPacks` de `WorkspaceVersion.fromJSON`**: entradas que no son strings se rechazan en la deserialización en lugar de propagarse al estado del workspace.

### Added

- **ADR-021** (`specs/adr/adr-021-codemod-parser-and-placement.md`): validator is the normative V2 schema reader; codemod parser is frozen verbatim-emit one-shot tooling; promotion trigger to `src/domain/services/` documented; schema constants stay exported in the validator helper.
- **CI Linux suite dedup**: `just test` in `.github/workflows/ci.yml` is now gated to non-Linux runners, removing the duplicated Linux suite execution.
- **Source-hygiene raw-control-byte guard**: New `tests/unit/quality/source-hygiene.test.ts` fails on any raw control byte (C0 minus TAB/LF/CR, plus DEL) across the tracked text surfaces (`src`, `tests`, `scripts`, `template/obligatorio/packs`).
- **Banner de deprecación runtime "Opencode Legacy" (FEV-30, #90)**: nuevo helper `src/application/legacyBanner.ts` lee `.codice-version` y, si la instalación es ≤ 2.1.2, imprime `⚠ Opencode Legacy only — upgrade to ≥ 2.1.4 for native Opencode V2 support`. No bloqueante — archivo ausente o corrupto degrada a no-op silencioso. Cableado en `CleanInstallUseCase`, `ProjectInstallUseCase` y `UpdateWorkspaceUseCase`, antes del primer prompt interactivo de cada flujo.

### Removed

- **`scripts/migrate-all-packs.ts` (+ `tests/unit/scripts/migrate-all-packs.test.ts`)**: the Fase-2 bulk runner was redundant after completion — all 8 pending packs were migrated; retained only in git history. A future re-migration calls `scripts/migrate-v1-to-v2-permissions.ts` directly (see `specs/spec-agent-format-v2.md` §7).
- **Legacy `reformat-agent` producer retired**: `scripts/reformat-agent.ts`, its CLI wrapper and its test suite were deleted; the FEV-18 converter emitted the V1 `tools:` map, which OpenCode V2 ignores and the validator now rejects. Use `scripts/migrate-v1-to-v2-permissions.ts` instead.
- **Plugin SDD eliminado por completo (FEV-30, #90)**: fuera del template `sdd-pipeline.ts` + sus módulos (`destructivePatterns.ts`, `normalizeBash.ts`), la copia dev, las suites de tests del plugin, el fixture `sdd-workflow-test`, las recipes `*-plugin` y el job `qa-plugin` de CI, además de los specs/ADR/diagnósticos históricos `spec-sdd-plugin-decoupling`, `adr-013`, `fix15` y `fix06` con scrub de prosa en docs/wiki. El plugin fallaba en cada startup en hosts Opencode V2; su única función residual (bloqueo de comandos destructivos) ya vive en las `permission.bash` deny-lists de `template/obligatorio/core/opencode.json`, que se conservan como defensa en profundidad. Diagnóstico: `docs/diagnosis/fix27-sdd-plugin-removal-v2-incompatibility.md`.
- **ADR-017 retirado** (auto-discovery del plugin, superado por FEV-30) + follow-ups del review de 5 ejes: predicado `isOnLegacyLine` extraído en el banner legacy y suite de edge tests del banner ampliada de 5 a 13 casos.

### Security

- **Endurecimiento de permisos del template tras retirar el plugin SDD**: la auditoría de seguridad encontró que la deny-list estática no reemplaza la normalización/bloqueo exec que hacía el plugin retirado, y que varios comandos en `allow` eran bypassables: `find -execdir`/`xargs sh -c`/pipes `curl|sh` encadenan ejecución arbitraria, y `echo >> ~/.ssh/authorized_keys`, `sed → /etc/cron.d/`, `awk 'print > "path"'` escriben archivos arbitrarios (la redirección no es cubrible con wildcards de deny). Cambios en `template/obligatorio/core/opencode.json`: (1) `find`, `echo`, `printf`, `awk`, `sed`, `xargs`, `curl` (y `http`/httpie, misma clase de riesgo fetch-and-pipe) movidos de `allow` a `ask`; (2) nuevas denies de defensa en profundidad (`find * -exec *`, `find * -execdir *`, `xargs sh *`, `xargs bash *`, `xargs chmod *`, `xargs curl *`), variantes rm (`rm -fir`, `--force --recursive` y permutaciones) y secret-read sin ancla de espacio (`*.env`, `*.ssh/id_*`, `*aws/credentials`); (3) gaps de `read` cerrados (`*id_rsa*`, `*id_ed25519*`, `*id_ecdsa*`, `*.envrc*`, `**/.npmrc`, `credentials.json*`). Ninguna deny existente fue eliminada; suite de regresión en `tests/unit/setup/opencode-config.test.ts` pinnea el JSON de permisos.

## [2.1.2] - 2026-08-28

### Fixed

- **Explicit subagent delegation in docs-update command**: Replaced vague "appropriate subagents" with specific `docs-writer` and `technical-writer` subagent references in Phase 1 of the docs-update command, ensuring correct agent routing for documentation synchronization tasks.

### Changed

- **Tech debt reorganization**: Moved v2.1.2 planned debt items (9 items, 18-24h) to v2.1.3. Created clean v2.1.2 hotfix scope with no debt items. Shifted v2.1.3 (Larger Refactoring) to v2.1.4.

## [2.1.1] - 2026-08-25

### Changed

- **CI/CD SHA-pins bumped to Node 24** (TD-V2-7): Updated `actions/checkout` to v7.0.1, `actions/cache` to v6.1.0, `extractions/setup-just` to v4.0.0, and `softprops/action-gh-release` to v3.0.2. All SHA-pinned actions now target Node 24 runtimes, eliminating CI deprecation warnings.
- **VersionComparator cache** (TD-V2-61): Added instance-level `Map<string, string>` cache to `VersionComparator.compare()` that avoids redundant `semver.valid()` normalization on repeated calls. `validateVersion`/`validateVersions` remain pure functions.
- **VersionComparator constructor refactored** for testability: accepts optional `validateFn` parameter (backward-compatible, no interface change). Removed stale `biome-ignore` suppression.

### Added

- **Spy-based cache verification test**: Proves cache hit by counting `validateVersion` calls — second identical `compare()` call triggers zero additional validation.

### Fixed

- **Class JSDoc accuracy**: Updated `VersionComparator` class comment from "no side effects" to "memoized; no I/O" to reflect internal cache state.


### Security

- **SDD plugin reduced to minimal destructive-command block** (#80): Plugin now only blocks destructive bash commands (rm -rf, git push --force, DROP TABLE, etc.) via `tool.execute.before` hook. Removed 13 obsolete modules (~1200 lines) that duplicated `opencode.json` permissions.
- **External directory permissions** (#81): Added `external_directory` permission block to template with deny-by-default strategy. Explicit allowlist for known-safe paths (~/.agents/, ~/.bun/, ~/.cargo/, ~/go/, ~/.local/, ~/.cache/, ~/Projects/, /tmp/).
- **Backup integrity protection** (TD-V2-9): `AtomicStager.commitStaging()` now writes `.codice-backup-intent` marker before commit. If a previous commit was interrupted, the marker is detected and the overwrite is refused with an actionable error message.
- **Hardened permission denies** (review): Extended `read` deny-list with `.cargo/credentials`, `.s3cfg`, `.config/gh/hosts.yml`, `*.mobileprovision`; narrowed `export PATH=*` to total-replacement only; added git deny entries for `--force-with-lease`, `checkout -- .`, `checkout -f`, `restore`, `reset --mixed`, `clean -fdx/-fxd`; added `rm -r -f`, `rm -f -r`, `rm -rfv` variants.
- **Plugin pattern gaps closed** (review): Added `git push --force-with-lease`, `git reset --mixed`, `git clean -fdx/-fxd`, `git checkout -- .`, `git checkout -f`, `git restore`, and SQL `DELETE ... WHERE 1=1/true` tautology patterns. `normalizeBash` now strips comments only at token start, preserving in-word/in-URL `#`.
- **Removed dead `escapeRegExp` module** (dead code, no longer imported; `destructivePatterns` uses literal regex).
- **Destructive command gate fix** (code review C1): `extractBashCommand` now reads `output.args.command` — plugin gate was non-functional before this fix.
- **Backup marker cleanup on handled failure** (code review I2): `AtomicStager` removes `.codice-backup-intent` marker when failure is handled; only hard-kill leaves an orphan marker.
- **Split-flag rm pattern coverage** (code review I3): Added `rm -r -f` and `rm -f -r` to destructive patterns.
- **Flag-based orphan detection** (code review I4): Replaced fragile string-matching with flag-based guard for backup marker orphan detection.
- **Staging/backup gitignore entries** (code review S2): Added staging and backup patterns to `template/estandar/gitignore`.

Final metrics: 1935 tests, 31/31 E2E, 55/55 plugin integration, `just check` 0 errors.

### Added

- **Staging cleanup observability** (TD-V2-51): New `staging_cleanup` event in `ProgressEvent` discriminated union. Emitted by `AtomicStager.cleanStaging()` and visible in `--verbose` mode.

### Changed

- Plugin export renamed from `SddPipelinePlugin` to `DestructiveCommandBlockPlugin`
- Plugin integration test suite reduced from 4 test files to 1 (destructive patterns only)
- Plugin E2E scenarios reduced from 3 to 2 (installation + lint only)

## [2.1.0] — 2026-08-19

### Added
- **4 New Agent-Orchestration Commands:**
  - `/sync` (FEV-24-A, Issue #68) — Bidirectional git sync with 4 modes
    (full-sync, incremental-sync, dry-run, conflict-resolution) and 4 conflict
    resolution strategies (NEWER_WINS, GITHUB_WINS, LOCAL_WINS,
    INTELLIGENT_MERGE). Agent: `tlaloc`.
  - `/migrate` (FEV-24-B, Issue #67, **OPTIONAL**) — Technology stack migration
    planner with impact analysis, breaking change detection, and automatic
    documentation updates (`MIGRATION.md`, `WORKFLOW.md`, `specs/`). Agent:
    `quetzalcoatl`.
  - `/deploy` (FEV-24-C, Issue #64) — Git workflow and CI/CD configuration
    assistant. 3 modes (no workflow, betterable, established), generates
    branch protection rules, PR templates, and pipeline YAML. Agent:
    `mictlantecuhtli`.
  - `/analyze` (FEV-24-D, Issue #57) — Multi-dimensional architectural
    analysis (8 dimensions: system structure, design patterns, dependency
    architecture, data flow, scalability, security, testability, documentation).
    Generates prioritized `TECH_DEBT.md` with Critical/High/Medium/Low findings.
    Agent: `quetzalcoatl`.
- **SDD Plugin Intent Auto-Discovery (FEV-24, Issue #53):** Filesystem-based
  detection of command keywords replaces hardcoded `INTENT_PATTERNS` map.
  Auto-discovers keywords from `commands/*.md` frontmatter, merges with
  Spanish intent extensions and user overrides.
- **Bilingual Intent Support:** Spanish-language intent keywords for all
  17 commands. Keywords like "especificar" route to `/spec`, "sincronizar"
  routes to `/sync`. Uses Unicode-aware tokenization with stopword filtering.
- **FEV-24-D Integration:** `/diagnosis` now reads `docs/TECH_DEBT.md` as
  authoritative input for severity assessment and finding references.
- **Command Frontmatter Validation:** Schema-validated YAML frontmatter for all commands. New `commandFrontmatterValidator` ensures `description`, `agent`, and optional fields are correct. Tests in `tests/unit/domain/command-frontmatter-validation.test.ts` and `tests/unit/plugins/intentDiscovery.test.ts`.
- **Agent Delegation Protocol (FEV-25, Issue #69):** The six primary agents now
  analyze before acting — mapping the available subagents in `agents/` and the
  relevant skills in `skills/` before executing any instruction.
  - The four delegating agents (`huitzilopochtli`, `quetzalcoatl`, `tlaloc`,
    `mictlantecuhtli`) gained `### DELEGATION PROTOCOL`: every `task()` call must
    carry deterministic instructions, the skills the subagent must load, and a goal
    checklist the primary agent grades the returned work against.
  - The two non-delegating agents (`moctezuma`, `tezcatlipoca`) gained
    `### SKILL LOADING PROTOCOL`: the same up-front analysis without delegation,
    plus a self-review checklist.
  - Canonical contract documented in `specs/spec-agent-format-v2.md` §8.
- **CI/CD Hardening (ADR-019):** Branch protection for `main` and `develop`,
  PR/Issue templates, pinned GitHub Actions by SHA, OIDC npm provenance,
  `just test-packaging` + `just check-plugin` + `just test-plugin-integration`
  wired into CI, `bun pm scan` security audit, reusable quality gate for
  releases, and post-publish smoke test verification.

### Changed
- **Command count:** 13 → 17 (4 new commands added to `template/obligatorio/core/commands/`)

### Deprecated
- N/A (no deprecations in v2.1.0)

### Removed
- N/A (no removals in v2.1.0)

### Fixed
- **BunSymlinkCreator mkdir guard:** `createLink` now guards `mkdir({recursive:true})`
  with try/catch returning `SymlinkError` so a parent-dir creation failure degrades
  gracefully as a warning (was an unhandled rejection → fatal crash). Added unit test
  for nested parent-dir creation (10 scenarios, 1692 pass).
- **Chrome DevTools MCP reference:** Broken `@anthropic/chrome-devtools-mcp@latest`
  reference replaced with pinned `chrome-devtools-mcp@1.7.0` (the `@anthropic/`
  scoped package returns 404 on npm).
- **Git workflow agent permissions:** Explicit git command allowlists with
  `git apply *` / `git am *` denied in `git-workflow-master.md` and
  `git-workflow-manager.md`.
- **Jupyter token handling:** `MCP_JUPYTER_TOKEN` moved to env indirection
  instead of a literal placeholder.
- **Sync command `lastCommit` validation:** Malformed or missing `lastCommit`
  rejected with actionable error.
- **Progress bar double-advance:** `createProgressCallback` now advances the progress bar once per staged file (on `stage_complete`) instead of twice (was advancing on both `stage_start` and `stage_complete`).
- **Confirm prompt default alignment:** `ClackPromptsAdapter.confirm()` now defaults to `No` when `defaultYes` is unspecified, matching `confirmOverwrite()`'s defensive default. `UpdateWorkspaceUseCase` explicitly passes `true` to preserve the update confirmation UX.
- **UpdateWorkspaceUseCase refactor:** Extracted `maybeConfirmUpdate` and `finishUpdate` to `updateHelpers.ts` for single-responsibility compliance.

### Security
- **Branch protection enforced** on `main` and `develop` (required status checks, no force pushes, PR flow required).
- **npm publish with provenance:** OIDC-based trusted publishing with `--provenance` replaces static token-only flow.
- **Git-workflow-master permission tightening:** `write` and `edit` permissions changed from `allow` to `ask`. Bash allowlist restricted to safe read-only commands plus specific git operations.
- **Confirm-default-No safety:** Destructive operations default to "No" confirmation, preventing accidental overwrites.

## [2.0.0] — 2026-08-07

Final release of v2.0.0. Package: `@fisherk2-dev/codice`. Previous stable release: v1.2.0.

This release includes all changes from [2.0.0-beta.1](#200-beta1--2026-08-07) plus final integration testing (FEV-23): 1920 tests, 30/30 E2E scenarios, coverage 95.68% overall / 99.12% production `src/`.

### Added (since beta.1)

- **5 new E2E scenarios** (26–30): update blocked pre-1.2.0, update Option B, flat agents destination, non-interactive packs, project install packs.
- **8 new unit/integration tests**: Option B cancel path, pack-aware project install, clean-install summary passthrough, version-context classification.
- **33 plugin source tests**: `directoryScanner.ts` and `autoDiscovery.ts` coverage (overall coverage 93.78% → 95.68%).

### Changed (since beta.1)

- **E2E 23 rewritten** as a real Option A pack-scoped merge — the FEV-21 transitional no-op removed; update merge is now functional with the bundled v2.0.0 template.
- **Version bumped** 1.2.0 → 2.0.0 for final release.

### Fixed (since beta.1)

- **E2E 10**: equal-version "already up to date" short-circuit confirmed as permanent behavior, not transitional workaround.
- **E2E 04/15/16**: comment-only cleanup.

## [2.0.0-beta.1] — 2026-08-07

Pre-release for v2.0.0. Package: `@fisherk2-dev/codice`. Previous stable release: v1.2.0.

### Added

- **Agent pack system** with 8 selectable packs (software-development, business, hardware-emerging, science-research, operations-support, finance, creative, government-legal) + 2 mandatory directories (main, writers). 352 unique agents distributed across packs. (`FEV-17`, `FEV-18`)
- **Installer UX v2** with pack selection wizard, version-gated updates, and install summary screen showing agent counts per pack. (`FEV-21`, `FEV-22`)
- **Update status check** — remote version comparison before update; Update mode blocked for installations older than v2.0.0 with specific migration guidance. (`FEV-21`)
- **SDD plugin auto-discovery** — filesystem-based detection of commands, agents, and intent patterns; config-driven behavior via optional `opencode.json` `sddPipeline` section. (`FEV-13`, ADR-013)
- **References co-located with skills** — 59 reference files moved from centralized `references/` to `skills/<name>/references/` for co-location. (`FEV-12`, ADR-012)
- **Post-installation symlink generation** — `ISymlinkCreator` port + `BunSymlinkCreator` adapter generates `.opencode/` symlinks after npm extraction. (`ADR-008`)
- **Post-installation gitignore generation** — `IGitignoreCreator` port + `BunGitignoreCreator` adapter generates `.gitignore` after npm extraction. (`ADR-009`)
- **`noTemplateCopy` flag** on `FileRule` for virtual manifest entries whose content is generated post-installation. (`ADR-010`)
- **Atomic staging with backup/rollback** — all writes go through staging directory + rename; interrupted operations leave destination untouched. (`ADR-003`)
- **Path traversal prevention** — all paths validated against destination boundary before any write operation. Exit code 1 on rejection.
- **SIGINT cleanup** — staging directories removed on normal exit and interrupt signal.
- **CLI flags:** `--version`, `--help`, `--verbose`, `--dest <path>`, `--force`, `--mode <mode>`, `--packs <list>`, `--packs-all`, `--update-add-packs <list>`.
- **Install summary screen** (`FEV-22`) — shows packs with agent counts, mandatory dirs, selected optionals, and total agents/files estimate before merge.
- **Update modes** (`FEV-21`) — Option A (current packs only) and Option B (add packs with installed packs locked).
- **Progress bar during installation** (`FEV-14`) — structured `ProgressEvent` union with `clack.progress()` rendering across all three modes.
- **`/help` slash command** (`FEV-14`) — interactive help menu with 6 onboarding options.
- **Permission unification** (`FEV-19`) — 4 primary delegators unified to `"*": allow` + deny pattern; 106 explicit allow-list entries removed.
- **Subagent table removal** (`FEV-19`) — all subagent index/catalog sections removed from 6 primary agents; RULES now reference `agents/` directory directly.
- **1920+ tests** (unit, integration, E2E, packaging) with 30/30 E2E scenarios passing.
- **Coverage:** 95.68% overall / 99.12% production `src/`.

### Changed

- **BREAKING: Binary compilation removed.** npm/bunx is the sole distribution method. Compiled binaries are no longer produced. See [ADR-011](specs/adr/adr-011-binary-removal.md) for migration details.
- **Template resolver extracted** to dedicated `TemplateResolver` class (was inline in `BunFileSystem`).
- **AtomicStager extracted** from `BunFileSystem` — separate class for staging, commit, and rollback operations.
- **`parse-args.ts` split** — `validateDestPath` extracted to its own module.
- **`UpdateWorkspaceUseCase` split** — `updateStatusCheck` extracted as a standalone function.
- **`main.ts` split** — signal handlers extracted to separate module.
- **`errorTypeGuards` relocated** to `src/domain/types/` for domain purity. (`ADR-010`)
- **`FileRuleManifestData`** restructured from flat mandatory entries to hierarchical `core/` + `packs/` groupings with `destPath` support.
- **`IFileMergeEngine.execute`** accepts `MergeExecuteOptions` object instead of positional parameters.
- **FileMergeEngine** — tree-level diff replaces directory-level skip for standard rules in update mode.
- **Coverage thresholds** — CI now enforces ≥95% lines/functions.

### Fixed

- **Pre-existing test flakiness** — `mock.module` leak and hardcoded `/tmp` paths resolved.
- **SIGINT during `commitStaging`** leaving residual artifacts — staging cleanup now runs on all exit paths.
- **Biome import ordering violations** — consistent import grouping enforced.
- **Domain purity** — `NodeJS.ErrnoException` reference removed from domain layer.
- **Progress bar re-creation** (`FEV-14`) — `showProgressBar()` was called on every event, orphaning previous instances. Fixed with `barStarted` closure flag.
- **Progress total included skipped files** (`FEV-14`) — `total` now reflects only staged files.
- **Symlink/gitignore logs emitted before operations** (`FEV-14`) — success logs moved inside `runPostInstallSteps()`.
- **Standard directory updates** (`FEV-16`) — new files in standard directories now reach existing users during update.

### Security

- **Path traversal rejection** validated via E2E tests — `../` sequences in destination paths cause exit code 1.
- **Staging directory cleanup** on normal exit and SIGINT — prevents residual artifacts in user projects.
- **Destructive command restrictions** (`FEV-7`) — 53 bash command patterns blocked at runtime and config level.
- **Windows system directory protection** — `C:\ProgramData`, `C:\Users`, and drive root check added to `--dest` validation blocklist.
- **Symlink path containment hardened** — `BunSymlinkCreator` normalizes `workspaceRoot` via `path.resolve()` before prefix matching.

## [1.2.0] — 2026-08-03

### Added

- **Review fixes from `/ship` v1.2.0-beta.1:** Security (URL validation gated behind `NODE_ENV=test`), path safety (`withTrailingSeparator` handles root), performance (`FileMergeEngine.execute` lazy allocation), comments (untrusted-input notes), tests (direct unit tests for `isPathWithin`/`withTrailingSeparator`).
- **Dependencies:** `@biomejs/biome` 2.5.3 → 2.5.6, `@types/semver` 7.7.1 → 7.8.0.
- **ADR-011:** Binary Removal — documents the architectural decision.
- **SDD Plugin Auto-Discovery** (`FEV-13`): 6 hardcoded maps extracted to `autoDiscovery.ts` — commands, agents, and intent patterns detected from filesystem.
- **Config-Driven Plugin Behavior** (`FEV-13`): `INTENT_PATTERNS`, `COMMAND_PHASE_MAP`, `PHASE_SUGGESTIONS` moved to `defaults.ts` with optional `opencode.json` override.
- **Progress bar during installation** (`FEV-14`): `ProgressEvent` discriminated union, `clack.progress()` rendering, `logProgressEvent()` dispatcher.
- **`/help` slash command** (`FEV-14`): Interactive help menu with 6 options assigned to Huitzilopochtli.
- **Spec/ADR templates** (`FEV-14`): MADR v4.0 ADR template and RFC-based spec template.
- **Project Code of Conduct** (`FEV-15`): `CODE_OF_CONDUCT.md` adapted from Contributor Covenant v2.1.
- **Template Code of Conduct** (`FEV-15`): `template/estandar/CODE_OF_CONDUCT.md` with placeholders.
- **Pre-release Tech Debt Closure** (`FEV-16`): 5 TECH_DEBT.md items resolved — coverage foundation, use case refactor (Template Method), performance benchmarks, update granularity, coverage instrumentation.
- **`/test` command:** Ensures `test/` directory with `unit/`, `integration/`, `e2e/` subdirectories; prompts to refactor existing tests.
- **`/ship` command:** Post-Phase-C incremental-fix phase for resolving review observations.

### Changed

- **BREAKING: Binary compilation removed.** See ADR-011 for details.
- **References Restructuring** (`FEV-12`): 59 reference files moved to `skills/<name>/references/` for co-location.
- **Wiki Rewrite** (`FEV-13`): 8 Wiki pages rewritten for end users.
- **Quality Infrastructure** (`FEV-13`): Biome config extended to plugin directories; Justfile targets added.
- **Documentation Reduction** (`FEV-13`): WORKFLOW.md, CHANGELOG.md, SPEC.md trimmed to target line counts.
- **DRY extraction** (`FEV-14`): `createProgressCallback()` shared helper; symlink/gitignore logs moved to `postInstall.ts`.
- **Coverage thresholds:** CI now enforces ≥95% lines/functions.
- **main.ts:** `runMode` restructured from switch to if/else for complete branch coverage.

### Fixed

- **Progress bar re-creation on every `stage_start`** (`FEV-14`): Orphaned `clack.progress()` instances.
- **Progress total included skipped files** (`FEV-14`): Bar always reaches 100%.
- **Symlink/gitignore logs emitted before operations** (`FEV-14`): False success on failure.
- **Standard directory updates** (`FEV-16`): New files in standard directories now reach existing users.
- **Error context enrichment:** `wrapMergeError()` preserves phase/path in user-facing messages.

### Removed

- **BREAKING: `.devin/` optional directory removed.** Compatibility layer no longer installed.

## [1.1.3] — 2026-07-11

### Fixed

- **Windows EPERM in `destinationExists()`:** `fs.access()` throws `EPERM` instead of `EACCES` on Windows with restricted permissions. Both now treated as "path exists but unreadable".

## [1.1.2] — 2026-07-11

### Changed

- **`confirmOverwrite()` DRY extraction:** Shared helper extracted from 3 use cases (~40 lines eliminated).
- **`VERSION` module extraction:** Moved from `output.ts` to `src/cli/version.ts` for layer boundary compliance.
- **`GitHubRestClient` error handling:** Consolidated HTTP error branches; removed dead `AbortError` branch.
- **`AtomicStager` I/O:** Switched from `Bun.file().text()` + `Bun.write()` to `fs.copyFile()` for kernel-level copy.

### Fixed

- **Windows system directory validation:** Path prefix matching uses `path.sep` instead of hardcoded `/`.
- **`AtomicStager` backup detection:** `Bun.file().exists()` returns `false` for directories — switched to `fs.access()`.

### Security

- **Windows system directory protection expanded:** Added `C:\ProgramData`, `C:\Users`, and drive root check.
- **Symlink path containment hardened:** `workspaceRoot` normalized via `path.resolve()`.

## [1.1.1] — 2026-07-11

### Added

- **Documentation synchronization:** Comprehensive audit across 14 files — SPEC.md, README.md, CONTRIBUTING.md, ARCHITECTURE.md, Wiki pages all updated.

### Fixed

- **Update Workspace version comparison:** Now compares against bundled template version instead of GitHub remote API.
- **CI version validation:** Pre-release suffix stripped before comparing tag vs package.json version.

## [1.1.0] — 2026-07-10

### Added

- **Agent Governance** (`#26`): No-assumption and delegation-first rules merged into primary agents.
- **Destructive Command Restrictions** (`#30`): 53 bash command patterns restricted in defense-in-depth configuration.
- **Step counts** (`#27`): Adjusted for 6 primary agents.
- **SECURITY.md** (`#28`): Created at `docs/SECURITY.md` and `template/estandar/docs/SECURITY.md`.
- **5 new MCP servers** (`#29`): tavily, firecrawl, vercel-grep, gitmcp; total now 9.
- **Agent KNOWLEDGE chain updated** (`#29`): All 6 primary agents reference MCP server category.
- **npm packaging integration tests** (`TD-5.3`): 5 scenarios validating tarball structure.
- **Obsidian subagent** (`#21`): `obsidian-vault-writer` with 3 Obsidian skills.
- **Wiki expansion** (`#29`): `MCP-Servers.md` extended to 9 pre-configured servers.

### Changed

- **`opencode.json` mcp section** (`#29`): Now lists 9 MCP servers.
- **`IFileSystem` port split** (`TD-2.1`): Interface Segregation — `IFileSystem` reduced from 10 to 6 methods; new `IStagingSystem` port extracted.
- **TypeScript 6.0.3 upgrade** (`TD-3.1`): No breaking changes.
- **Regex hardening:** `chmod 777`, `find -exec`, `export PATH=` patterns broadened and refined.

### Fixed

- **Side-effect tarball cleanup:** `bun pm pack` artifact cleaned in test teardown.

### Security

- **Destructive command hardening** (`#30`): rm -rf, git push --force, DROP DATABASE, and 40+ patterns blocked.
- **Bypass vector closure:** `chmod 0777` (leading octal zero) and `find -execdir` variants closed.

## [1.0.15] — 2026-07-09

### Fixed

- Wiki README removed from GitHub Wiki; npm republish blocked.

### Changed

- Wiki repo cloned inside project (`docs/wiki-source/.wiki/`).

## [1.0.14] — 2026-07-09

### Added

- GitHub Wiki (9 end-user pages), pre-release tag support (beta/rc).

### Changed

- `ci.yml` triggers on `develop` branch; `release.yml` detects pre-release tags.

### Removed

- `docs/opencode/` from project root and template.

## [1.0.13] — 2026-06-27

### Added

- `docs-update/` command, `diagnosis/` command.

### Changed

- `evolve/` command simplified; agent governance strengthened.

## [1.0.12] — 2026-06-27

### Fixed

- Windows CI symlink test skipped on Windows; E2E stdout verification.

## [1.0.11] — 2026-06-26

### Fixed

- Update workspace directory detection; GitHub version check repository name corrected.

## [1.0.10] — 2026-06-26

### Added

- `noTemplateCopy` flag on `FileRule`; optional files menu in Clean Install; `.devin` directory support.

### Fixed

- `.devin` directory not found in bunx mode (CRITICAL); inconsistent Clean/Project Install UX.

## [1.0.9] — 2026-06-26

### Added

- `IGitignoreCreator` port, `GitignoreError` type, `BunGitignoreCreator` adapter, 10 new tests, 2 E2E scenarios.

### Fixed

- `.gitignore` post-install generation for bunx compatibility (`#11`).

### Deprecated

- v1.0.8 (gitignore not found in bunx mode).

## [1.0.8] — 2026-06-26

### Fixed

- TypeScript strict mode errors (3 `tsc --noEmit` fixes).

### Deprecated

- v1.0.7 (TypeScript compilation errors).

## [1.0.7] — 2026-06-26

### Added

- `ISymlinkCreator` port + `BunSymlinkCreator` adapter; post-install symlink generation (10 symlinks).

### Fixed

- npm resolves symlinks in tarballs — `.opencode/{agents,commands,skills}` removed from manifest (`#8` CRITICAL).

### Deprecated

- v1.0.6 (symlink packaging issue).

## [1.0.6] — 2026-06-25

### Added

- 4 missing optional manifest entries; manifest completeness test.

### Fixed

- Template path resolution in bunx mode (`#8` CRITICAL).

## [1.0.5] — 2026-06-25

### Added

- ADR-007 (template resolution for bunx/npm); credential file permissions; TECH_DEBT.md.

### Changed

- UpdateWorkspace rule transformation preserves Estándar files; CONTRIBUTING.md rewritten.

### Fixed

- bunx template detection cascade (`#6` CRITICAL); update preserves standard files (`#2` CRITICAL).

### Security

- Extended credential denial patterns.

## [1.0.4] — 2026-06-17

### Added

- VersionComparator exported validators; 8 new unit tests; pathResolver guard test; ClackPromptsAdapter tests; TECH_DEBT.md.

### Changed

- Coverage to 97.66% functions / 96.52% lines.

## [1.0.3] — 2026-06-16

### Added

- CLI with 3 installation modes (Clean, Project, Update); interactive TUI (@clack/prompts); atomic file operations; file classification engine; semantic version checking; path traversal prevention; `--dest`/`--force`/`--verbose` flags; cross-platform binaries; CI/CD pipeline; npm publication; ADR-001–006; E2E test suite (6 scenarios); 343 unit/integration tests.

### Changed

- Codebase DRY refactored; BunFileSystem decomposed (TemplateResolver + AtomicStager); IFileSystem port relocated; package renamed to `@fisherk2-dev/codice`.

### Fixed

- Template path resolution in compiled binaries; `console.warn` removed; cross-platform echo normalization; release workflow SHA pinning.

### Removed

- Legacy F5/F6 planning files.

### Security

- Path traversal prevention; symlink skipping in directory walk; SHA-256 checksums.

[Unreleased]: https://github.com/fisherk2/codice-opencode/compare/v2.1.3...HEAD
[2.1.3]: https://github.com/fisherk2/codice-opencode/compare/v2.1.3-beta.1...v2.1.3
[2.1.2]: https://github.com/fisherk2/codice-opencode/compare/v2.1.1...v2.1.2
[2.1.1]: https://github.com/fisherk2/codice-opencode/compare/v2.1.0...v2.1.1
[2.1.0]: https://github.com/fisherk2/codice-opencode/compare/v2.0.0...v2.1.0
[2.0.0]: https://github.com/fisherk2/codice-opencode/compare/v2.0.0-beta.1...v2.0.0
[2.0.0-beta.1]: https://github.com/fisherk2/codice-opencode/compare/v1.2.0...v2.0.0-beta.1
[1.2.0]: https://github.com/fisherk2/codice-opencode/compare/v1.1.3...v1.2.0
[1.1.3]: https://github.com/fisherk2/codice-opencode/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/fisherk2/codice-opencode/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/fisherk2/codice-opencode/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/fisherk2/codice-opencode/compare/v1.0.15...v1.1.0
[1.0.15]: https://github.com/fisherk2/codice-opencode/compare/v1.0.14...v1.0.15
[1.0.14]: https://github.com/fisherk2/codice-opencode/compare/v1.0.13...v1.0.14
[1.0.13]: https://github.com/fisherk2/codice-opencode/compare/v1.0.12...v1.0.13
[1.0.12]: https://github.com/fisherk2/codice-opencode/compare/v1.0.11...v1.0.12
[1.0.11]: https://github.com/fisherk2/codice-opencode/compare/v1.0.10...v1.0.11
[1.0.10]: https://github.com/fisherk2/codice-opencode/compare/v1.0.9...v1.0.10
[1.0.9]: https://github.com/fisherk2/codice-opencode/compare/v1.0.8...v1.0.9
[1.0.8]: https://github.com/fisherk2/codice-opencode/compare/v1.0.7...v1.0.8
[1.0.7]: https://github.com/fisherk2/codice-opencode/compare/v1.0.6...v1.0.7
[1.0.6]: https://github.com/fisherk2/codice-opencode/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/fisherk2/codice-opencode/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/fisherk2/codice-opencode/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/fisherk2/codice-opencode/releases/tag/v1.0.3
