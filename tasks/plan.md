# Implementation Plan: FEV-27 — Security & Observability

**Phase:** FEV-27 (v2.1.1) — ⏳ Pendiente
**Issues/TD:** [#80](https://github.com/Fisherk2/codice-opencode/issues/80), [#81](https://github.com/Fisherk2/codice-opencode/issues/81), TD-V2-9, TD-V2-51
**Diagnósticos:** [`docs/diagnosis/fix15`](../docs/diagnosis/fix15-plugin-cleanup.md), [`fix16`](../docs/diagnosis/fix16-external-directory-permissions.md), [`fix19`](../docs/diagnosis/fix19-sigint-backup-overwrite.md), [`fix21`](../docs/diagnosis/fix21-missing-staging-cleanup-event.md)
**Date:** 2026-08-20
**Author:** Moctezuma (Strategic Planner)
**Branch:** `fix/fev-27-security-observability` (continúa de v2.1.1 post-FEV-26)
**Todo list:** [todo.md](./todo.md)
**Methodology:** Vertical slicing (1 item = 1 slice completo) · commits atómicos por fase · TDD donde aplique · checkpoint quality gates
**Wall-clock estimate:** ~6-8h (Phase 1: 2h · Phase 2: 2-3h · Phase 3: 3-4h)

---

## Overview

FEV-27 cierra el ciclo de Security & Observability antes del release v2.1.1. Resuelve 4 items identificados en el deep audit (2026-08-19): simplificación del plugin SDD (elimina deuda de mantenimiento), gobernanza de directorios externos (mitigación de seguridad), protección contra overwrite de backups durante SIGINT (data integrity), y observabilidad del cleanup de staging (debugging aid).

**Lo que FEV-27 hace:**
1. Reduce el plugin SDD de 403 líneas a un módulo mínimo que solo bloquea comandos destructivos vía `tool.execute.before` (preserva la red de seguridad, elimina duplicación con `opencode.json` permissions).
2. Añade `external_directory` con deny-by-default + allowlist explícita en `template/obligatorio/core/opencode.json` (mitigación de acceso no controlado a `~/.ssh/`, `~/.aws/`, etc.).
3. Implementa marcador `.codice-backup-intent` en `AtomicStager` para preservar originales cuando un commit previo fue interrumpido por SIGINT.
4. Emite evento `staging_cleanup` en `ProgressEvent` para observabilidad del cleanup post-commit (visible en `--verbose`).

**Decisiones del usuario (confirmadas vía question tool 2026-08-20):**
- **#81 external_directory:** Deny-by-default + allowlist explícita (~/.agents/, ~/.bun/, ~/.cargo/, ~/go/, /tmp/, ~/.local/, ~/.cache/, ~/Projects/).
- **#80 plugin scope:** Solo bloqueo destructivo + normalizeBash (eliminar audit log, system.transform, intentDiscovery, chatMessage, mentionPatterns, validSubagents, stopwords, spanishIntents, frontmatter, defaults, configLoader, mergeConfig, directoryScanner, autoDiscovery).
- **TD-V2-9 backup safety:** Marcador `.codice-backup-intent` con timestamp + commit intent; abortar si existe al inicio del run.
- **TD-V2-51 event metadata:** Solo `{ type: "staging_cleanup", stagingPath: string }`.
- **Orden de ejecución:** TD-V2-51 → #81 → TD-V2-9 → #80 (fail-fast en tareas chicas primero).
- **Release:** Esperar FEV-27+28 antes de publicar v2.1.1 estable (no RC intermedio).

---

## Architecture Decisions

| Decisión | Rationale | ADR Reference |
|----------|-----------|---------------|
| Plugin reducido a un solo hook (`tool.execute.before`) | `opencode.json` ya maneja agent/command/intent permissions; el plugin debe ser solo el "safety net" para comandos destructivos que el usuario podría quitar accidentalmente. | ADR-013 (plugin auto-discovery) implícito; crear ADR-021 si el cambio es significativo. |
| Marcador `.codice-backup-intent` (no `.lock`) | Lock file requiere estado interactivo; marcador con timestamp es fail-safe y automático. El archivo `.codice-backup-intent` se elimina al commit exitoso. | ADR-003 (atomic staging) extendido. |
| `external_directory` con esquema Rule estándar | OpenCode schema (`packages/core/src/v1/config/permission.ts:26`) define `external_directory: Schema.optional(Rule)` con misma semántica `allow`/`deny`/`ask` + globs. | Ninguno nuevo — usa schema existente. |
| Evento `staging_cleanup` con payload mínimo | Spec rule "WHY not WHAT" + logs verbosos ya tienen timestamp; metadata extra (duration, filesRemoved) no aporta valor diagnóstico real. | Discriminated union extension in `ProgressEvent.ts`. |

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Observability Foundation (TD-V2-51)               │
│  src/domain/types/ProgressEvent.ts                         │
│    └─ Add "staging_cleanup" variant                        │
│  src/infrastructure/adapters/AtomicStager.ts               │
│    └─ Emit staging_cleanup event in cleanStaging()         │
│  tests/integration/adapters/atomic-stager.test.ts          │
│    └─ Verify event emission via verbose logger             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: External Directory Governance (#81)               │
│  template/obligatorio/core/opencode.json                   │
│    └─ Add "external_directory" block with deny + allowlist │
│  docs/wiki-source/Configuration.md                         │
│    └─ Document new permission block                        │
│  tests/e2e (no new scenario — config validation only)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Backup Safety (TD-V2-9)                           │
│  src/infrastructure/config/constants.ts                    │
│    └─ Add BACKUP_INTENT_FILE constant                      │
│  src/infrastructure/adapters/AtomicStager.ts               │
│    └─ Check intent marker in commitStaging() pre-check     │
│    └─ Write intent marker at start of commitStaging()      │
│    └─ Remove intent marker on successful commit            │
│  src/application/use-cases/InstallUseCaseBase.ts           │
│    └─ Detect orphan intent marker at install start         │
│  tests/integration/adapters/atomic-stager.test.ts          │
│    └─ Test backup preservation across interrupted commits  │
│  docs/diagnosis/fix19-sigint-backup-overwrite.md (update)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Plugin Reduction (#80)                            │
│  template/obligatorio/core/.opencode/plugins/              │
│    └─ Delete: autoDiscovery, chatMessage, configLoader,    │
│       defaults, directoryScanner, frontmatter,             │
│       intentDiscovery, mentionPatterns, mergeConfig,       │
│       spanishIntents, stopwords, validSubagents           │
│    └─ Keep: destructivePatterns, escapeRegExp,             │
│       normalizeBash                                        │
│  template/obligatorio/core/.opencode/plugins/sdd-pipeline.ts│
│    └─ Reduce to: bash destructive-command block only       │
│  template/obligatorio/core/.opencode/plugins/src/          │
│    └─ Delete obsolete tests in __tests__/                  │
│  tests/plugin/integration/                                 │
│    └─ Delete obsolete test files                           │
│    └─ Create new test file for minimal plugin              │
│  tests/plugin/e2e/                                         │
│    └─ Update bash scenarios for reduced surface area       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Release Prep                                                │
│  CHANGELOG.md — Add v2.1.1 entry with 4 items             │
│  docs/TECH_DEBT.md — Mark 4 items as resolved              │
│  docs/WORKFLOW.md — Mark FEV-27 as ✅ Completo             │
│  docs/wiki-source/ — Sync to GitHub Wiki                   │
│  package.json — Bump version to v2.1.1                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Task List

### Phase 1: Observability Foundation (TD-V2-51) — 1h

#### Task 1.1: Add `staging_cleanup` event variant

**Description:** Extends `ProgressEvent` discriminated union with a new variant `{ type: "staging_cleanup", stagingPath: string }`. `AtomicStager.cleanStaging()` emits the event via `VerboseLogger.log("staging_cleanup", stagingPath)`. This surfaces the cleanup operation in `--verbose` mode for debugging installation failures.

**Acceptance criteria:**
- [ ] `ProgressEvent` union includes `staging_cleanup` variant (S task: 1 file).
- [ ] `AtomicStager.cleanStaging()` calls `this.logger.log("staging_cleanup", this.stagingRoot)` before `fs.rm()`.
- [ ] Integration test asserts `verboseLogSpy` is called with operation `"staging_cleanup"` and detail equal to staging root.
- [ ] `just check` + `just test-integration` pass.

**Verification:**
- [ ] `bun test tests/integration/adapters/atomic-stager.test.ts -- --grep "staging_cleanup"`
- [ ] Manual: run `bun run src/cli/main.ts --dest /tmp/test --verbose` and verify log entry.

**Dependencies:** None.

**Files likely touched:**
- `src/domain/types/ProgressEvent.ts` (add variant, ~3 lines)
- `src/infrastructure/adapters/AtomicStager.ts` (add log call in `cleanStaging()`, ~2 lines)
- `tests/integration/adapters/atomic-stager.test.ts` (add 1 test case, ~15 lines)

**Estimated scope:** XS (~3 files, ~20 lines total)

**Commit message:**
```
feat(observability): emit staging_cleanup event in --verbose mode

Adds a new ProgressEvent variant to surface staging directory cleanup
operations. Helps debugging installation failures where cleanup phase
is suspected.

Closes TD-V2-51
```

---

### Checkpoint 1: After Task 1.1
- [ ] `just check` — 0 errores
- [ ] `just test-integration` — 0 fallos (atomic-stager suite)
- [ ] Coverage ≥95% production `src/`
- [ ] Human review: confirm event variant shape before Phase 2

---

### Phase 2: External Directory Governance (#81) — 1-2h

#### Task 2.1: Add `external_directory` permission block to template

**Description:** Adds the `external_directory` permission block to `template/obligatorio/core/opencode.json` after the `read` permission block (line 326). Uses deny-by-default with explicit allowlist for known-safe paths (skill/agent caches, build tools, project locations).

**Acceptance criteria:**
- [ ] `opencode.json` has `"external_directory"` block with `"*": "deny"` first.
- [ ] Allowlist includes: `~/.agents/*`, `~/.bun/*`, `~/.cargo/*`, `~/go/*`, `~/.local/*`, `~/.cache/*`, `~/Projects/*`, `/tmp/*`.
- [ ] JSON schema validation passes (no trailing commas, valid structure).
- [ ] `just check` passes.
- [ ] Documentation updated in `docs/wiki-source/Configuration.md`.

**Verification:**
- [ ] `bun run jsonlint template/obligatorio/core/opencode.json` (if available) or `bun -e "JSON.parse(await Bun.file(...).text())"`.
- [ ] Manual: copy `opencode.json` to a test workspace, verify `~/.ssh/*` is denied and `~/.bun/*` is allowed (requires OpenCode runtime).

**Dependencies:** None (independent config change).

**Files likely touched:**
- `template/obligatorio/core/opencode.json` (add block after line 326, ~15 lines)
- `docs/wiki-source/Configuration.md` (document new permission, ~30 lines)

**Estimated scope:** S (~2 files, ~45 lines)

**Commit message:**
```
feat(security): add external_directory permission block to template

Implements deny-by-default + allowlist strategy for files outside the
project directory. Agents can still access known-safe paths (skill
caches, build toolchains, project locations) but sensitive paths
(~/.ssh, ~/.aws, ~/.kube) are blocked by default.

Closes #81
```

---

### Checkpoint 2: After Task 2.1
- [ ] `just check` — 0 errores (biome ci + tsc --noEmit)
- [ ] Manual JSON validation passes
- [ ] Wiki sync confirmed
- [ ] Human review: confirm allowlist scope before Phase 3

---

### Phase 3: Backup Safety (TD-V2-9) — 2-3h

#### Task 3.1: Define `BACKUP_INTENT_FILE` constant

**Description:** Adds the constant `BACKUP_INTENT_FILE = ".codice-backup-intent"` to `src/infrastructure/config/constants.ts` (next to `STAGING_DIR_NAME`). Centralizes the filename so future code can reference it without hardcoding strings.

**Acceptance criteria:**
- [ ] Constant exported from `constants.ts` with `SCREAMING_SNAKE_CASE` naming.
- [ ] No other constants changed.

**Verification:**
- [ ] `grep -rn "BACKUP_INTENT_FILE" src/` returns the export + usage.
- [ ] `just check` passes.

**Dependencies:** None.

**Files likely touched:**
- `src/infrastructure/config/constants.ts` (add 1 line)

**Estimated scope:** XS (~1 file, ~1 line)

**Commit message:**
```
chore(infra): define BACKUP_INTENT_FILE constant

Centralizes the .codice-backup-intent filename used by the backup
safety mechanism introduced for TD-V2-9.
```

---

#### Task 3.2: Implement backup intent marker in `AtomicStager.commitStaging()`

**Description:** Modifies `commitStaging()` to write the intent marker before the commit loop starts, and remove it on success. If interrupted, the marker persists. The next run detects it and refuses to overwrite the true originals.

**Algorithm:**
```
commitStaging() {
  intentPath = path.join(destinationRoot, BACKUP_INTENT_FILE)
  // 1. Fail-fast: refuse if orphan intent exists
  if (await fs.access(intentPath).catch(() => null)) {
    throw new Error("Previous commit was interrupted. Backup integrity preserved. Inspect .codice-backup manually before retrying.")
  }
  // 2. Write intent marker
  await fs.writeFile(intentPath, new Date().toISOString())
  // 3. Existing commit logic (backups, renames, rollback)
  try {
    // ... existing code ...
    // 4. Cleanup intent marker on success
    await fs.unlink(intentPath).catch(() => {})  // Ignore errors
  } catch (error) {
    // Rollback restores originals; leave intent marker for diagnosis
    throw error
  }
}
```

**Acceptance criteria:**
- [ ] `commitStaging()` writes `BACKUP_INTENT_FILE` with ISO timestamp before commit loop.
- [ ] `commitStaging()` removes `BACKUP_INTENT_FILE` on successful commit.
- [ ] `commitStaging()` leaves `BACKUP_INTENT_FILE` on failure (for diagnosis).
- [ ] `commitStaging()` throws explicit error if `BACKUP_INTENT_FILE` exists at start.
- [ ] Integration test: simulate interrupted commit (delete staging mid-loop), verify intent persists, verify next commit refuses with clear error.
- [ ] Existing integration tests still pass (intent marker cleanup works).

**Verification:**
- [ ] `bun test tests/integration/adapters/atomic-stager.test.ts -- --grep "backup.intent"`
- [ ] Manual: create mock scenario with orphan intent, verify error message.

**Dependencies:** Task 3.1.

**Files likely touched:**
- `src/infrastructure/adapters/AtomicStager.ts` (modify `commitStaging()`, ~15 lines added)
- `tests/integration/adapters/atomic-stager.test.ts` (add 2-3 test cases, ~50 lines)

**Estimated scope:** M (~2 files, ~65 lines)

**Commit message:**
```
feat(security): protect backup integrity with .codice-backup-intent marker

Prevents AtomicStager from overwriting true original files when a
previous commit was interrupted by SIGINT. The intent marker is
written before commit, removed on success, and detected on next run
to refuse the overwrite.

Closes TD-V2-9
```

---

#### Task 3.3: Update diagnosis document

**Description:** Updates `docs/diagnosis/fix19-sigint-backup-overwrite.md` to reflect the implemented solution instead of the "documented limitation" proposed in the original diagnosis.

**Acceptance criteria:**
- [ ] "Proposed Solution" section replaced with "Implemented Solution".
- [ ] Status changed from `diagnosed` to `resolved (FEV-27)`.
- [ ] Reference to PR/commit added.

**Verification:**
- [ ] `grep "Implemented Solution\|resolved" docs/diagnosis/fix19-sigint-backup-overwrite.md` returns expected matches.

**Dependencies:** Task 3.2.

**Files likely touched:**
- `docs/diagnosis/fix19-sigint-backup-overwrite.md` (rewrite solution section, ~10 lines)

**Estimated scope:** XS (~1 file, ~10 lines)

**Commit message:**
```
docs(diagnosis): mark TD-V2-9 backup overwrite as resolved in FEV-27
```

---

### Checkpoint 3: After Tasks 3.1-3.3
- [ ] `just check` — 0 errores
- [ ] `just test-integration` — atomic-stager suite 0 fallos
- [ ] Manual verification: SIGINT simulation preserves backups correctly
- [ ] Human review: confirm error message wording before Phase 4

---

### Phase 4: Plugin Reduction (#80) — 3-4h

#### Task 4.1: Audit plugin dependencies

**Description:** Before deletion, confirm the only remaining consumer of each plugin module. Some modules might be referenced by skills, agents, or tests outside the plugin folder.

**Acceptance criteria:**
- [ ] `grep -rn "from.*autoDiscovery\|from.*chatMessage\|from.*configLoader\|from.*defaults\|from.*directoryScanner\|from.*frontmatter\|from.*intentDiscovery\|from.*mentionPatterns\|from.*mergeConfig\|from.*spanishIntents\|from.*stopwords\|from.*validSubagents" template/ tests/ skills/` returns no unexpected consumers.
- [ ] `chatMessage.test.ts`, `systemTransform.test.ts` marked for deletion.
- [ ] `help-command-discovery.test.ts` purpose verified — keep if tests external behavior, delete if tests deleted module.

**Verification:**
- [ ] Manual grep audit.
- [ ] Identify all obsolete test files.

**Dependencies:** None (read-only audit).

**Files likely touched:**
- None (audit only).

**Estimated scope:** XS (audit, no code changes)

**Commit message:** (no commit — audit-only step)

---

#### Task 4.2: Delete obsolete plugin modules

**Description:** Removes the 12 obsolete modules from `template/obligatorio/core/.opencode/plugins/src/`. Keeps only `destructivePatterns.ts`, `escapeRegExp.ts`, `normalizeBash.ts`. Also deletes the now-empty `__tests__/` directory contents that test the deleted modules.

**Modules to delete:**
- `autoDiscovery.ts` (122 lines)
- `chatMessage.ts` (186 lines)
- `configLoader.ts` (88 lines)
- `defaults.ts` (159 lines) — **NOTE:** PRIMARY_AGENTS lives here. Extract to a new minimal `validSubagents.ts` that only exports the 6 primary agents for the bash gate? **Decision:** PRIMARY_AGENTS is no longer needed if we delete the subagent validation logic from the hook. Delete entire file.
- `directoryScanner.ts` (99 lines)
- `frontmatter.ts` (50 lines)
- `intentDiscovery.ts` (163 lines)
- `mentionPatterns.ts` (24 lines)
- `mergeConfig.ts` (165 lines)
- `spanishIntents.ts` (31 lines)
- `stopwords.ts` (188 lines)
- `validSubagents.ts` (50 lines)

**Modules to KEEP:**
- `destructivePatterns.ts` (95 lines) — core of the safety net
- `escapeRegExp.ts` (18 lines) — utility used by destructivePatterns
- `normalizeBash.ts` (30 lines) — bypass prevention

**Acceptance criteria:**
- [ ] Only 3 files remain in `template/obligatorio/core/.opencode/plugins/src/`.
- [ ] `__tests__/` only contains tests for the 3 kept modules.
- [ ] `just check` passes (no dangling imports).
- [ ] All existing plugin integration tests updated (Phase 4.3).

**Verification:**
- [ ] `ls template/obligatorio/core/.opencode/plugins/src/ | wc -l` returns 3.
- [ ] `just check` — 0 errores.
- [ ] `just test-plugin-integration` — 0 fallos (after Task 4.3).

**Dependencies:** Task 4.1.

**Files likely touched:**
- `template/obligatorio/core/.opencode/plugins/src/*` (delete 12 files)
- `template/obligatorio/core/.opencode/plugins/src/__tests__/*` (delete obsolete test files)

**Estimated scope:** S (~15 file deletions, ~1300 lines removed)

**Commit message:**
```
refactor(plugin): reduce SDD plugin to destructive command block only

Deletes 12 modules (~1300 lines) that duplicated functionality now
provided by opencode.json permissions. The plugin is now minimal:
it only blocks destructive bash commands as a safety net.

Closes #80
```

---

#### Task 4.3: Rewrite `sdd-pipeline.ts` to minimal form

**Description:** Reduces `sdd-pipeline.ts` from 403 lines to a minimal plugin that exports a single `DestructiveCommandBlockPlugin` with only the `tool.execute.before` hook. Preserves `DESTRUCTIVE_PATTERNS` check + `normalizeBash` preprocessing + `SddError` class.

**Minimal shape:**
```typescript
import type { Plugin } from "@opencode-ai/plugin";
import { DESTRUCTIVE_PATTERNS } from "./src/destructivePatterns";
import { normalizeBash } from "./src/normalizeBash";

class DestructiveCommandError extends Error {
  constructor() {
    super("Destructive command blocked. Use safe alternatives.");
    this.name = "DestructiveCommandError";
  }
}

export const DestructiveCommandBlockPlugin: Plugin = async () => ({
  "tool.execute.before": async (input, output) => {
    const inp = input as { tool?: string } | undefined;
    const out = output as { args?: Record<string, unknown> } | undefined;
    if (inp?.tool?.toLowerCase() !== "bash") return;
    const cmd = normalizeBash((out?.args?.command as string) ?? "");
    if (DESTRUCTIVE_PATTERNS.some((p) => p.test(cmd))) {
      throw new DestructiveCommandError();
    }
  },
};
```

**Acceptance criteria:**
- [ ] `sdd-pipeline.ts` is < 50 lines (down from 403).
- [ ] Plugin only exports `DestructiveCommandBlockPlugin`.
- [ ] `tool.execute.before` hook preserves all 21 destructive patterns.
- [ ] `normalizeBash` preprocessing applied before pattern matching.
- [ ] Error message preserved verbatim from original.
- [ ] `just check` passes.

**Verification:**
- [ ] `wc -l template/obligatorio/core/.opencode/plugins/sdd-pipeline.ts` returns < 50.
- [ ] `bun test tests/plugin/integration/toolExecuteBefore.test.ts` — 0 fallos.
- [ ] Manual: verify `rm -rf /tmp/test` is blocked, `rm file.txt` is allowed.

**Dependencies:** Task 4.2.

**Files likely touched:**
- `template/obligatorio/core/.opencode/plugins/sdd-pipeline.ts` (rewrite, ~40 lines net)

**Estimated scope:** S (~1 file, ~360 lines removed)

**Commit message:**
```
refactor(plugin): rewrite sdd-pipeline.ts as minimal destructive gate

The plugin is now a single-responsibility safety net: it blocks
destructive bash commands and nothing else. Agent/command/intent
governance is handled by opencode.json permissions.
```

---

#### Task 4.4: Update plugin integration tests

**Description:** Updates `tests/plugin/integration/` to match the reduced plugin surface. Deletes obsolete test files (`chatMessage.test.ts`, `systemTransform.test.ts`, possibly `help-command-discovery.test.ts` if it tested deleted modules). Updates `toolExecuteBefore.test.ts` to import only from the minimal modules.

**Files to UPDATE:**
- `toolExecuteBefore.test.ts` — remove imports of `PRIMARY_AGENTS`, `discoverValidSubagents`, etc. Keep only `DESTRUCTIVE_PATTERNS` + `normalizeBash` tests.

**Files to DELETE:**
- `chatMessage.test.ts` — tests deleted `chatMessage.ts`
- `systemTransform.test.ts` — tests deleted system.transform hook
- `help-command-discovery.test.ts` — verify if still relevant; delete if not

**Files to CREATE:**
- New `destructiveCommandBlock.test.ts` covering the minimal plugin shape (if not covered by existing tests).

**Acceptance criteria:**
- [ ] All obsolete test files deleted.
- [ ] `toolExecuteBefore.test.ts` updated to only test kept modules.
- [ ] `just test-plugin-integration` — 0 fallos.
- [ ] Coverage ≥95% on kept plugin code.

**Verification:**
- [ ] `bun test tests/plugin/integration/` — 0 fallos.
- [ ] `just check` — 0 errores.

**Dependencies:** Task 4.3.

**Files likely touched:**
- `tests/plugin/integration/chatMessage.test.ts` (delete)
- `tests/plugin/integration/systemTransform.test.ts` (delete)
- `tests/plugin/integration/help-command-discovery.test.ts` (delete or update)
- `tests/plugin/integration/toolExecuteBefore.test.ts` (rewrite)

**Estimated scope:** M (~4 files, ~300 lines removed)

**Commit message:**
```
test(plugin): update integration tests for minimal destructive gate

Removes tests for deleted modules and focuses the test suite on
the plugin's new single responsibility: blocking destructive bash
commands.
```

---

#### Task 4.5: Update plugin E2E scenarios

**Description:** Updates `tests/plugin/e2e/*.sh` bash scenarios to match the reduced plugin. The 3 existing scenarios (16-plugin-installation, 17-plugin-lint, 18-audit-log) need adjustment: scenario 18-audit-log.sh must be deleted (no more audit log), scenarios 16 and 17 simplify to focus on installation + lint only.

**Files to UPDATE:**
- `16-plugin-installation.sh` — verify plugin loads, command block works.
- `17-plugin-lint.sh` — verify biome/tsc on reduced plugin code.

**Files to DELETE:**
- `18-audit-log.sh` — audit log no longer exists.

**Acceptance criteria:**
- [ ] Scenario 18 deleted.
- [ ] Scenarios 16 + 17 pass with reduced plugin.
- [ ] `just test-plugin-e2e` — 2/2 passing.

**Verification:**
- [ ] `bash tests/plugin/e2e/run-plugin-e2e.sh` — all passing.

**Dependencies:** Task 4.4.

**Files likely touched:**
- `tests/plugin/e2e/16-plugin-installation.sh` (simplify)
- `tests/plugin/e2e/17-plugin-lint.sh` (simplify)
- `tests/plugin/e2e/18-audit-log.sh` (delete)

**Estimated scope:** S (~3 files)

**Commit message:**
```
test(plugin): update E2E scenarios for minimal plugin

Removes audit-log scenario (no longer applicable) and simplifies
installation + lint scenarios to match the reduced plugin surface.
```

---

### Checkpoint 4: After Tasks 4.1-4.5
- [ ] `just check` — 0 errores
- [ ] `just test-unit` — 0 fallos
- [ ] `just test-integration` — 0 fallos
- [ ] `just test-plugin-integration` — 0 fallos (reduced suite)
- [ ] `just test-plugin-e2e` — 2/2 passing
- [ ] `just test-e2e` — 31/31 passing (no regression)
- [ ] Coverage ≥95% production `src/`
- [ ] Plugin file count: 4 files (sdd-pipeline.ts + 3 src/ modules + __tests__)
- [ ] Human review: confirm plugin reduction scope before Release Prep

---

### Phase 5: Release Prep

#### Task 5.1: Update `CHANGELOG.md`

**Description:** Adds v2.1.1 entry with 4 FEV-27 items + 5 FEV-26 items (since v2.1.1 will publish after FEV-26+27). Follows Keep a Changelog format with `Added`, `Changed`, `Fixed`, `Security` sections.

**Acceptance criteria:**
- [ ] Entry added under `## [2.1.1] - YYYY-MM-DD`.
- [ ] 4 FEV-27 items documented with issue/TD IDs.
- [ ] 5 FEV-26 items documented (already merged but part of same release).

**Verification:**
- [ ] `head -50 CHANGELOG.md` shows v2.1.1 entry.

**Dependencies:** All Phase 1-4 tasks.

**Files likely touched:**
- `CHANGELOG.md` (add ~30 lines)

**Estimated scope:** XS (~1 file, ~30 lines)

**Commit message:**
```
docs(changelog): add v2.1.1 entry with FEV-26+FEV-27 items
```

---

#### Task 5.2: Update `docs/TECH_DEBT.md`

**Description:** Adds a new section "Resolved in v2.1.1 (FEV-26+27)" listing all 9 items (5 from FEV-26 already merged + 4 from FEV-27). Updates the v2.1.1 backlog table to mark FEV-27 as ✅.

**Acceptance criteria:**
- [ ] New "Resolved in v2.1.1 (FEV-26+27)" section with all 9 items.
- [ ] FEV-27 row in backlog table marked ✅.
- [ ] v2.1.1 row in "Summary" table updated.

**Verification:**
- [ ] `grep "FEV-27.*Resolved\|FEV-27.*✅" docs/TECH_DEBT.md` returns matches.

**Dependencies:** Task 5.1.

**Files likely touched:**
- `docs/TECH_DEBT.md` (add ~15 lines, update 2 rows)

**Estimated scope:** XS (~1 file, ~15 lines)

**Commit message:**
```
docs(tech-debt): mark FEV-27 4 items as resolved in v2.1.1
```

---

#### Task 5.3: Update `docs/WORKFLOW.md`

**Description:** Marks FEV-27 as ✅ Completo in the phases table. Adds summary metrics (lines removed, test count, coverage). Does NOT bump version (that's `package.json`).

**Acceptance criteria:**
- [ ] FEV-27 row in phases table marked ✅ Completo.
- [ ] Metrics summary section added under FEV-27.
- [ ] Date updated to completion date.

**Verification:**
- [ ] `grep "FEV-27.*✅" docs/WORKFLOW.md` returns match.

**Dependencies:** Task 5.2.

**Files likely touched:**
- `docs/WORKFLOW.md` (update 1 row + add ~10 lines)

**Estimated scope:** XS (~1 file, ~15 lines)

**Commit message:**
```
docs(workflow): mark FEV-27 as completed with metrics summary
```

---

#### Task 5.4: Sync GitHub Wiki

**Description:** Runs the wiki sync procedure per `CONTRIBUTING.md` to update the GitHub Wiki with the new permission block (#81) and the plugin changes (#80).

**Acceptance criteria:**
- [ ] `rsync -a --delete --exclude='README.md' docs/wiki-source/*.md docs/wiki-source/.wiki/` executed.
- [ ] Wiki commit pushed with message referencing v2.1.1.

**Verification:**
- [ ] `git -C docs/wiki-source/.wiki log --oneline -3` shows new commit.

**Dependencies:** Task 5.3.

**Files likely touched:**
- `docs/wiki-source/.wiki/*` (synced from `docs/wiki-source/*.md`)

**Estimated scope:** XS (script execution)

**Commit message:**
```
docs(wiki): sync v2.1.1 changes to GitHub Wiki

Updates Configuration page (external_directory block) and removes
references to deleted plugin modules.
```

---

### Checkpoint 5: After Tasks 5.1-5.4
- [ ] All documentation consistent with code
- [ ] Wiki synced and pushed
- [ ] `just check` + `just test` (all suites) pass
- [ ] Coverage ≥95% production `src/`
- [ ] Human review: approve release v2.1.1 to be published after FEV-28 completes

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Plugin deletion breaks external skills/agents that imported from deleted modules | High | Low | Task 4.1 audit identifies all consumers before deletion; if found, refactor consumers or keep module as compat shim. |
| Backup intent marker creates false positives on legitimate concurrent runs | Medium | Low | Document that Códice must not be run concurrently against the same destination; error message guides user to inspect `.codice-backup`. |
| `external_directory` allowlist too restrictive breaks valid workflows | Medium | Medium | Start with conservative allowlist based on common toolchains; document customization in `Configuration.md` wiki page. |
| Plugin reduction removes features users depend on | High | Low | The diagnosis explicitly states agent/command governance is duplicated by `opencode.json`; verify with 1 week of user feedback after release. |
| Staging cleanup event pollutes verbose logs | Low | Low | Event only emitted once per commit (not per file); minimal payload. |
| Release delays from FEV-28 dependencies | Medium | Medium | FEV-27 release is independent; can publish v2.1.1 immediately after FEV-28 if needed. |

---

## Parallelization Opportunities

| Phase | Tasks | Safe to parallelize? |
|-------|-------|----------------------|
| Phase 1 | 1.1 | No (foundation) |
| Phase 2 | 2.1 | Yes (independent config) |
| Phase 3 | 3.1, 3.2, 3.3 | Sequential (3.2 depends on 3.1, 3.3 depends on 3.2) |
| Phase 4 | 4.1, 4.2, 4.3, 4.4, 4.5 | Sequential (4.2-4.5 depend on 4.1; 4.4-4.5 depend on 4.3) |
| Phase 5 | 5.1, 5.2, 5.3, 5.4 | Mostly sequential (CHANGELOG → TECH_DEBT → WORKFLOW → wiki) |

**Recommended:** Single agent works sequentially through Phases 1-5. Estimated wall-clock: 6-8h.

---

## Open Questions

- **Q1:** Should we add an E2E scenario for #81 (external_directory permission) or rely on manual verification + integration test? → **Decision:** Manual verification + integration test only. E2E scenarios require OpenCode runtime; permission blocks are JSON-config validated.
- **Q2:** Should TD-V2-9 use a separate `.codice-backup-intent` file or piggyback on `.codice-version` metadata? → **Decision:** Separate file (clearer semantics, easier to detect, no version-file coupling).
- **Q3:** Should the reduced plugin keep the `SddError` class name or rename to `DestructiveCommandError`? → **Decision:** Rename to reflect new single responsibility (consistent with reduced scope).
- **Q4:** Should we extract `DESTRUCTIVE_PATTERNS` from the plugin into a shared template file (e.g., `template/obligatorio/core/.opencode/destructive-patterns.json`) so `opencode.json` permissions and the plugin can share the same source of truth? → **Decision:** Defer to future FEV. For FEV-27, keep duplication; the audit confirmed both lists already match (last verified FEV-26).

---

## Definition of Done

- [ ] All 12 tasks completed with acceptance criteria met
- [ ] `just check` — 0 errores (biome ci + tsc --noEmit)
- [ ] `just test-unit` — 0 fallos
- [ ] `just test-integration` — 0 fallos
- [ ] `just test-plugin-integration` — 0 fallos (reduced suite)
- [ ] `just test-plugin-e2e` — 2/2 passing
- [ ] `just test-e2e` — 31/31 passing (no regression)
- [ ] `just test-packaging` — 5/5 passing
- [ ] Coverage ≥95% production `src/`
- [ ] `CHANGELOG.md` updated with v2.1.1 entry (4 FEV-27 items)
- [ ] `docs/TECH_DEBT.md` updated (4 items marked as resolved in v2.1.1)
- [ ] `docs/WORKFLOW.md` updated — FEV-27 marcado como ✅ Completo
- [ ] GitHub Wiki synced via `docs/wiki-source/` rsync procedure
- [ ] Branch `fix/fev-27-security-observability` lista para PR a `develop`
- [ ] PR abierto con título `fix(security+observability): resolve FEV-27 (#80, #81, TD-V2-9, TD-V2-51)`

---

## References

- [SPEC.md](../SPEC.md) — Especificación central del proyecto
- [docs/WORKFLOW.md](../docs/WORKFLOW.md) §FEV-27 — Descripción original de la fase
- [docs/TECH_DEBT.md](../docs/TECH_DEBT.md) — Backlog v2.1.1
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) — Clean Architecture & ADRs
- [docs/CODE_STYLE.md](../docs/CODE_STYLE.md) — Convenciones TypeScript
- [docs/diagnosis/fix15](../docs/diagnosis/fix15-plugin-cleanup.md) — Diagnóstico #80
- [docs/diagnosis/fix16](../docs/diagnosis/fix16-external-directory-permissions.md) — Diagnóstico #81
- [docs/diagnosis/fix19](../docs/diagnosis/fix19-sigint-backup-overwrite.md) — Diagnóstico TD-V2-9
- [docs/diagnosis/fix21](../docs/diagnosis/fix21-missing-staging-cleanup-event.md) — Diagnóstico TD-V2-51
- [OpenCode config schema](../home/fisherk2/.local/share/opencode/repos/github.com/anomalyco/opencode@dev/packages/core/src/v1/config/permission.ts) — `external_directory: Schema.optional(Rule)`
- [AGENTS.md](../AGENTS.md) §Reglas estrictas — Clean Architecture, no `any`, pre-commit checklist
- [CONTRIBUTING.md](../CONTRIBUTING.md) §Git Workflow — Conventional Commits, branch naming

---

**Plan Status:** ⏳ Pendiente de aprobación por usuario
**Next Step:** Confirm plan con usuario → commit a `tasks/plan.md` → ejecutar `/build` para Task 1.1

Co-Authored-By: Moctezuma <dev@fisherk2.com>
