# Technical Debt — Códice

**Last updated:** 2026-11-18
**Status:** v2.1.5-beta.1 FEV-31 COMPLETED (2026-11-17) + pre-launch review 2026-11-18 done — 2027 tests, 31/31 E2E, `tsc --noEmit` 0, lint 0 · beta **published 2026-11-18** (release run 44443767080 success; dist-tag `beta`, `latest` intact at 2.1.4; `just verify-release` OK) · issues #111/#112/#114/#115/#116 closed + orphan references repaired · adjacent out-of-scope payload registered in `docs/WORKFLOW.md` · 4 deferred Phase-2 findings + TD-V2-97 remain open (below)
**Current version:** v2.1.5-beta.1 (FEV-31) — annotated tag `926006f` on the `main` tip (`c579948`), after PR #119 squash `3883288` (`hotfix/update-payload` → `develop`) + sync `d03191a` + PR #121 squash (`develop` → `main`); route proven via `gh pr view --json headRefName,mergeCommit` (a squash does not preserve lineage — `merge-base --is-ancestor` proves nothing here). The local-only `release/v2.1.5` was cut after the tag from `81a360d` for the stable promotion; never pushed, not part of the beta's path
**Next version:** v2.2.0 (Medium Effort — 9 items, 18-24h)

---

## Resolved Debt (v1.x → v2.0.0)

All technical debt from v1.x and v2.0.0 development has been resolved. For historical reference:

| Version | Key Resolutions |
|---------|-----------------|
| **v1.1.0** | IFileSystem port split (ISP), TypeScript 6.x upgrade, npm packaging tests |
| **v1.1.1** | Code review fixes (11 findings), documentation synchronization |
| **v1.2.0** | Binary removal (ADR-011), references restructuring, documentation overhaul, UX enhancements (progress bar, /help), community standards (Code of Conduct) |
| **v2.0.0** | Agent pack system (FEV-17/18), permission unification (FEV-19), plugin auto-discovery (FEV-20), installer UX v2 (FEV-21/22), testing closure (FEV-23) |
| **v2.1.0-beta.1** | 4 slash commands (`/sync`, `/migrate`, `/deploy`, `/analyze`), SDD intent auto-discovery, bilingual intents, agent delegation protocol (FEV-25), CI/CD hardening (SHA-pins, branch protection, PR/issue templates, npm provenance), SPEC.md modularization (ADR-020) |
| **v2.1.1** | Bug #79 regression test, shell injection fix (TD-V2-70), manifest count corrections (TD-V2-90/91), FileMergeEngine comment refresh (TD-V2-93), injection guard hardening, plugin cleanup (#80), external directory permissions (#81), backup integrity (TD-V2-9), staging cleanup event (TD-V2-51), CI/CD SHA-pin bumps to Node 24 (TD-V2-7), parsed-semver cache in VersionComparator (TD-V2-61), code review findings resolved |
| **v2.1.5** | FEV-31: issues #111/#112/#114/#115/#116 closed (delegation scan, `/hotfix` phases, background ban, `find-skills` setup, VSA skill + phases), orphan references repaired (ADR move to `docs/adr/`, `skills-lock.json`/`.gitmessage` mentions), 100/120/none prompt-budget contradiction unified at 180 lines |

**Resolved in v2.0.0 (FEV-17 to FEV-23):**
- Template directory restructuring → pack-based organization
- 351 agents across 10 packs (8 selectable + 2 mandatory)
- Permission unification (106 allow-list entries removed)
- VALID_SUBAGENTS hardcoded set removed (auto-discovery)
- Pack selection wizard + version-gated updates
- Install summary screen
- Coverage gate achieved (95.68% overall)
- 30/30 E2E scenarios passing

**Resolved in v2.1.0-beta.1 (FEV-24 to FEV-25):**
- 4 new slash commands (`/sync`, `/migrate`, `/deploy`, `/analyze`)
- SDD plugin intent auto-discovery (replaces hardcoded INTENT_PATTERNS)
- Bilingual intent support (EN/ES)
- Agent delegation protocol for 6 primary agents (FEV-25)
- CI/CD hardening: SHA-pinned actions, branch protection, PR/issue templates
- npm provenance SLSA v1 on publish
- SPEC.md modularized (441 → 44 lines + 8 sub-specs, ADR-020) (TD-V2-8)
- 2052 tests / 0 fail, 31/31 E2E

**Resolved in v2.1.1 (FEV-26):**
- Bug #79: regression test guards `.codice-version` version passthrough (integration + E2E)
- TD-V2-70: shell injection via `github.ref_name` → `$GITHUB_REF_NAME` in release.yml
- TD-V2-90: business pack agent count 92→91 (manifest + tests)
- TD-V2-91: writers pack agent count 2→4 (manifest + tests)
- TD-V2-93: FileMergeEngine comments refreshed (WHAT→WHY)
- Injection guard test hardened (asserts against actual `${{ }}` pattern)
- Doc sync: wiki, specs, TECH_DEBT counts corrected
- 1935 tests / 0 fail, 31/31 E2E

**Resolved in v2.1.1 (FEV-27 + code review):**
- TD-V2-51: staging_cleanup event emitted in --verbose mode (ProgressEvent + AtomicStager)
- #81: External directory permissions — deny-by-default + allowlist in opencode.json
- TD-V2-9: Backup integrity — .codice-backup-intent marker prevents overwrite on interrupted commits
- #80: SDD plugin reduced to destructive-command block only (13 modules deleted, ~1200 lines removed)
- **Code review hardening (commit `a2964fd`):**
  - C1: `extractBashCommand` reads `output.args.command` (plugin gate was non-functional)
  - I1: 5 new integration tests invoking actual plugin hook with correct shape
  - I2: AtomicStager removes marker on handled failure (only hard-kill leaves orphan)
  - I3: Added `rm -r -f` and `rm -f -r` split-flag patterns
  - I4: Flag-based guard replaces fragile string-matching for orphan detection
  - S1: Removed dead `staging_cleanup` variant from ProgressCallback
  - S2: Added staging/backup patterns to `template/estandar/gitignore`
- 1935 tests / 0 fail, 31/31 E2E, coverage ≥95%

**Resolved in v2.1.5 (FEV-31, 2026-11-17):**
- Completes the **INCOMPLETE** stabilization of `1941ed3` (green gates, zero issue gaps closed) recorded in `docs/diagnosis/fix30-fev31-partial-issue-implementation.md` §4.1
- #111: delegation scan covers `agents/` and `.opencode/agents/`; readable fallback that forbids Glob; roster in `/plan`
- #112: `/hotfix` phases 1–6 complete (GO/NOT-GO, no deploy); `/evolve` → `/feature`; hotfix cycle documented
- #114: background-execution ban + `websearch`/`webfetch` in the source-of-truth list (6 agents)
- #115: `find-skills` setup phase in `/spec`, `/feature`, `/diagnosis`, `/migrate` (project-level only)
- #116: mandatory skill `vertical-slice-architecture` (+4 references) and real VSA phases (Prototype 1-3 / MVP 4-6 / Enterprise 7+) in 5 commands
- Orphan references repaired: 32 ADR links → `docs/adr/` (23 ADRs); deleted skills/artifacts removed from specs, writer and wiki. **Residual (second-wave `/docs-update`, not this sweep's claim):** 3 dead references to the old register location survive outside the repaired set — `specs/spec-agent-packs.md:277` and `specs/spec-installer-ux-v2.md:349` (relative `./adr/adr-014…`/`./adr/adr-015…` links) and `specs/spec-project-structure.md:99` (directory tree still lists an `adr/` folder under `specs/`)
- Prompt-body budget contradiction (100 agent / 120 test override / none for commands) unified at **180 lines** for agents and commands (spec §8 + 2 guards + CODE_STYLE)
- 1991 tests / 0 fail, 31/31 E2E, `tsc --noEmit` 0, lint 0 (workaround in TD-V2-97)
- **Still open:** TD-V2-93-f2…96 (Phase-2 findings), TD-V2-97 and TD-V2-98 (coverage gate counts `tests/`+`scripts/` under bun 1.4.4). The adjacent out-of-scope payload of `hotfix/update-payload` (6 primary-agent model swaps, 6 plugins, ADR move, skills churn) is **not** FEV-31 work and is registered in `docs/WORKFLOW.md`, not tracked as debt here

---

## Known Limitations

### Tarball Size (8.0MB vs SC-15 <5MB)

SC-15 requires npm tarball < 5MB. The pack system (ADR-014) deliberately ships all 8 selectable packs, bringing the tarball to **8.0MB** (797 files). This deviation was accepted 2026-08-04 as a trade-off of the pack system. Will be revisited if distribution size becomes a user concern.

**Mitigation options (future):** (a) Lazy-download packs; (b) gzip-compress agent bodies; (c) split packs into separate npm packages.

### Nested `.gitignore` Files Excluded by npm

npm excludes `.gitignore` files at any depth. Files like `template/obligatorio/core/skills/ui-ux-design-pro/cli/.gitignore` are not in the published tarball. These serve internal skill development purposes only.

---

## Backlog by Version

### v2.1.1 Released (FEV-26 ✅ + FEV-27 ✅ + FEV-28 ✅ — code review hardened)

#### FEV-26: Quick Wins ✅ Resuelto (2026-08-20)

| ID | Item | Type | Effort | Risk | Diagnóstico |
|----|------|------|--------|------|-------------|
| **#79** | `.codice-version` regression test | Bug | 2-3h | High | `fix14-clean-install-version-file.md` |
| **TD-V2-70** | Shell injection → `$GITHUB_REF_NAME` | Debt | 0.5h | Medium | `fix17-shell-injection-github-ref-name.md` |
| **TD-V2-90** | Business pack count 92→91 | Debt | 0.5h | Low | `fix25-business-pack-agent-count.md` |
| **TD-V2-91** | Writers pack count 2→4 | Debt | 0.5h | Low | `fix20-writers-pack-agent-count.md` |
| **TD-V2-93** | FileMergeEngine comments | Debt | 1h | Low | `fix24-outdated-comments-file-merge-engine.md` |

#### FEV-27: Security & Observability ✅ Resuelto (2026-08-21, code review hardened)

| ID | Item | Type | Effort | Risk | Diagnóstico |
|----|------|------|--------|------|-------------|
| **#81** | Permisos directorios externos (deny-by-default) | Feature | 1-2h → 0.5h | Medium | `fix16-external-directory-permissions.md` |
| **TD-V2-9** | SIGINT mid-commit backup overwrite | Debt | 2-3h → 1h | Low | `fix19-sigint-backup-overwrite.md` |
| **TD-V2-51** | Missing staging_cleanup event | Debt | 1h → 0.5h | Low | `fix21-missing-staging-cleanup-event.md` |

**Code review (commit `a2964fd`):** 1 Critical + 4 Important + 3 Suggestions — todos aplicados.
**Metrics finales:** 1935 tests, 31/31 E2E, just check 0 errors.

#### FEV-28: Infrastructure & Performance ✅ Completo (2026-08-21)

| ID | Item | Type | Effort | Risk | Diagnóstico |
|----|------|------|--------|------|-------------|
| **TD-V2-7** | Action SHA-pins force Node 24 (deprecated) | Debt | 1-2h | Low | `fix23-action-sha-pins-node24.md` |
| **TD-V2-61** | No caching for version comparison | Debt | 1h | Low | `fix22-no-caching-version-comparison.md` |

### v2.1.2 ✅ Released (2026-08-28)

> **Scope:** Hotfix — docs-update delegation fix + tech debt reorganization.

| ID | Item | Type | Effort | Risk | Description |
|----|------|------|--------|------|-------------|
| — | docs-update delegation fix | Fix | — | Low | Explicit `docs-writer` and `technical-writer` subagent references |
| — | Tech debt reorg | Chore | — | Low | v2.1.2 debt → v2.1.3, v2.1.3 → v2.1.4 |

**Metrics:** 1935 tests, 31/31 E2E.

### v2.1.3 ✅ FEV-29 + FEV-30 completados (2026-09-22) — estable lanzado (tag `v2.1.3`, npm 2026-09-23)

> **Alcance (ejecutado):** FEV-29 (#91) migró el template completo al formato nativo OpenCode V2 `permissions:` (349 archivos) y FEV-30 (#90) removió el plugin SDD + añadió el banner legacy y el hardening del review de 5 ejes — completados en `hotfix/opencode-v2-migrate` y consolidados en `v2.1.3-beta.1`; el trabajo post-beta quedó en `release/2.1.3`. La deuda 2.1.x previamente planificada se recorrió una versión (v2.1.3 → v2.1.4, v2.1.4 → v2.1.5). Los hallazgos diferidos y TD-V2-97 de abajo siguen abiertos.
> **Política 2026-09-25:** 2.1.x reservado a hotfixes; deuda/features recorridas a 2.2.x (v2.1.4→v2.2.0, v2.1.5→v2.3.0, v2.3→v2.5.0).

#### Hallazgos de Fase-2 diferidos (2026-09-21, prioridad Important — no perdidos)

Registrados durante la auditoría Fase-2 (fix29) y decidido diferirlos para no
bloquear el cierre del hotfix. Tipos/prioridad según la tabla de arriba (Effort
estimado, riesgo evaluado).

| ID | Item | Type | Effort | Risk | Description |
|----|------|------|--------|------|-------------|
| **TD-V2-93-f2** | Emisión atómica write-safe en el codemod | Debt | 1h | Medium | `scripts/migrate-v1-to-v2-permissions.ts` usa `writeFileSync` in-place: un fallo a mitad de escritura deja el archivo truncado/corrupto sin rollback. Recomendado: escribir a `.tmp` y `renameSync` (mismo esquema atómico que `AtomicStager`). |
| **TD-V2-94** | Gap de superficie en el escaneo de higiene | Debt | 2-3h | Medium | `SCAN_ROOTS` de `tests/unit/quality/source-hygiene.test.ts` omite directorios shipped pero no escaneados: `template/estandar`, `template/obligatorio/core` (`.sh`, plugin TS, Dockerfile), `template/opcional`; falta además una allowlist de archivos sin extensión (Dockerfile/Makefile/Justfile). |
| **TD-V2-95** | Punto ciego del invariant de brake | Debt | 1h | Low | El chequeo CI del chain brake (`subagent "*": deny`) solo inspecciona bloques `permissions:` existentes; un agente con `mode: subagent` sin ningún bloque `permissions:` escapa el gate y heredaría la `ask` global sin freno. |
| **TD-V2-96** | Pendientes cosméticos/semánticos del parser | Debt | 2h | Low | (a) El parser de líneas del codemod pierde líneas en blanco internas del frontmatter (emisión verbatim de claves, no de líneas intermedias — cosmético); (b) la degeneración `tools: <scalar>` → `action: "*"` no está confirmada contra las reglas de matching de OpenCode V2 — validar antes de promover cualquier uso del codemod. |

#### Falso verde del type-check local con TypeScript 7 en mounts que ignoran `chmod` (2026-09-22, prioridad Medium)

| ID | Item | Type | Effort | Risk | Description |
|----|------|------|--------|------|-------------|
| **TD-V2-97** | Falso verde del type-check local (TS 7 en fuseblk/NTFS) | Debt | 1h | Medium | `just check` valida con el `tsc` global (6.0.3) en vez del declarado (7.0.2) porque el mount ignora el bit de ejecución del binario nativo. Mitigado con un warning no bloqueante (`scripts/check-ts-version.sh`). |

- **Síntoma:** `just check` reporta 0 errores, pero `bun run tsc --version` resuelve el `tsc` global (6.0.3) en vez del declarado en `package.json` (7.0.2).
- **Causa:** el binario nativo de TypeScript 7 (`node_modules/@typescript/typescript-linux-x64/lib/tsc`) queda en modo `-rw-r--r--` porque el mount `nosuid,nodev` (fuseblk/NTFS) ignora `chmod`; Bun cae entonces al `tsc` global.
- **Impacto:** solo local. La CI (ext4) preserva el bit de ejecución y `release.yml` ejecuta la matriz de calidad antes de publicar, por lo que el falso verde no alcanza un release.
- **Mitigación actual:** warning no bloqueante emitido por `scripts/check-ts-version.sh`, invocado al inicio de `just check`; siempre `exit 0` y degradación silenciosa si `jq`, `package.json` o el propio `tsc` no se pueden resolver.
- **Workaround:** copiar `node_modules/@typescript/typescript-linux-x64` a un FS con ejecución (p. ej. `/tmp`) y ejecutar `lib/tsc --noEmit -p tsconfig.json` desde ahí.
- **Workaround verificado para biome (2026-11-17, FEV-31):** copiar el binario nativo de Biome a una ruta btrfs y ejecutarlo desde ahí — `/tmp/opencode/biome ci src/ tests/` devuelve **exit 0** sobre el árbol de v2.1.5. `just check` sigue siendo el gate de CI (ext4, donde el bit de ejecución se preserva); el lint local deja de ser un punto ciego y pasa a verificarse con este comando en cada fase.

#### Gate de cobertura rojo en local con bun 1.4.4 (2026-11-17, prioridad Low)

| ID | Item | Type | Effort | Risk | Description |
|----|------|------|--------|------|-------------|
| **TD-V2-98** | `just coverage-check` falla en local (94.2%) pero `src/` está al 96.8% | Debt | 1-2h | Low | Con bun 1.4.4 el denominador del reporte incluye `tests/**` y `scripts/**`, así que el global baja de 95 aunque el código de producción cumple. Medido también en el tag `v2.1.4`: **94.23% (2744/2912)** frente a **94.24% (2748/2916)** en `hotfix/update-payload` — no es regresión de FEV-31 (el trabajo del branch no toca `src/` y añade 18 tests). |

- **Síntoma:** `just coverage-check` → `Total line coverage: 94.24% (2748/2916)` · `main.ts coverage: 98.84% (85/86)` · `FAIL: Overall coverage below 95%`, reproducible dos veces. `src/` aislado: **96.78% (2044/2112)**.
- **Causa:** el reporte cuenta archivos no productivos en el denominador — `tests/` 86.62% (466/538) y `scripts/migrate-v1-to-v2-permissions.ts` 89.47% (238/266) — y arrastra el global desde 96.78% hasta 94.24%.
- **Verificación de no-regresión:** `git worktree add` sobre `v2.1.4` + `bash scripts/coverage-check.sh` con el mismo bun 1.4.4 → **94.23%**, es decir el tag publicado ya fallaba igual antes de FEV-31.
- **Impacto:** solo local. La CI fija **bun 1.3** (`package.json`/workflows), donde el reporte no instrumenta esos árboles; la autoridad es la matriz de CI.
- **Acción pendiente:** o bien acotar el denominador en `scripts/coverage-thresholds.json`/`coverage-check.sh` (ignorar `tests/**` y `scripts/**`) y documentarlo, o fijar bun 1.3 en local. Decidir con la evidencia de CI antes de tocar el umbral.

#### Deuda de simplificación diferida (2026-11-17, prioridad Low)

Registered during the FEV-31 payload cleanup sweep: items evaluated and deliberately deferred because churn > value.

| ID | Item | Type | Effort | Risk | Description |
|----|------|------|--------|------|-------------|
| **TD-V2-99** | Near-dead test-only exports (`createFileRule`, `getMandatoryRules`, `getStandardRules`, `validationError`) | Debt | 1h | Low | Production callers exist but no production path exercises these beyond tests; un-exporting/removing churns 4+ test files for zero readability gain. Deferred. |
| **TD-V2-100** | Naming drift: `updateFlow`/`updateHelpers`, `versionGateMessages`/`versionInfoMessages` | Debt | 1-2h | Low | Confusable sibling names; file renames touch many imports and git blame. Deferred (churn > value). |
| **TD-V2-101** | 5 files still >200 LOC (measured 2026-11-18 with `find src -name '*.ts' \| xargs wc -l`): `AtomicStager.ts` (610), `FileMergeEngine.ts` (233), `BunSymlinkCreator.ts` (228), `BunFileSystem.ts` (206), `ClackPromptsAdapter.ts` (204) | Debt | 2-3h | Low | AtomicStager extraction was done (rollbackFailedCommit) without forcing further splits per the ≤200 convention's escape hatch. Remaining splits deferred. Supersedes the earlier "3 files / 273 LOC" note — AtomicStager grew back past the limit with the review hardening (see TD-V2-107). |
| **TD-V2-102** | lcov-vs-test mismatch for `scripts/migrate-v1-to-v2-permissions.ts` | Debt | 0.5h | Low | A test file exists for the migration script, but the lcov report shows `0/266` for it — the script is not instrumented (executed differently from `bun test tests/`), so the gate counts its 266 lines as uncovered. Related to the TD-V2-98 denominator issue. |
| **TD-V2-103** | `src/cli/validateDestPath.ts` win32-only branches untestable under lcov | Debt | 2-3h | Low | Lines 21-28 (win32 SYSTEM_DIRS) and 71 (drive-root) only execute when `process.platform` is win32 at module load — bun's coverage does not instrument child-process execution, so lcov stays ~71% despite full Linux-branch regression tests (commit `bcfa1bb`). Fix options: inject a path/platform seam into the module, or delete the win32 branch (loses Windows CLI protection). |

- **TD-V2-99 evidence:** grep shows the four symbols are referenced only from `src/application/use-cases/*.ts` exports and their unit tests; no production execution path reaches them.
- **TD-V2-102 evidence:** `coverage/lcov.info` lists `SF:scripts/migrate-v1-to-v2-permissions.ts` with `LF:266, LH:0` while its test passes under `just test`.
- **TD-V2-103 evidence:** `tests/unit/cli/validateDestPath.test.ts` covers the Linux branches via a child-process harness, but lcov (`SF:src/cli/validateDestPath.ts`) still reports ~71% because bun instruments only in-process code.

#### Full-project review outcomes (2026-11-17, batch 2 of PR #119)

Registered during the two-axis full-project review fix batches. Decisions, FYIs, and deferred follow-ups with evidence.

| ID | Item | Type | Effort | Risk | Description |
|----|------|------|--------|------|-------------|
| **TD-V2-104** | cwd-template-fallback is INTENTIONAL per ADR-007 | Decision (no action) | — | Low | TemplateResolver's cwd fallback flagged in review as a potential injection path; it is the documented third rung of ADR-007's three-path detection cascade (source → bunx/npm → cwd). User decision 2026-11-17: intentional, no action. |
| **TD-V2-105** | zero required reviews on `develop` is documented single-contributor policy | FYI | — | Low | `scripts/setup-branch-protection.sh` posts `required_approving_review_count: 0` on both branches. Reviewer flagged as a governance gap; it is the documented single-contributor policy (see script design notes + CONTRIBUTING.md). FYI only. |
| **TD-V2-106** | hard-killed runs leave unswept `.codice-staging-*` residue | Debt | 2-3h | Low | Since the per-run mkdtemp staging dirs (commit `d357519`), a SIGKILL during staging leaves that run's `.codice-staging-<rand>` dir behind; later runs cannot sweep it safely because it is indistinguishable from a LIVE concurrent run's staging dir. Needs a safe-sweep design (e.g. marker-dir pid liveness per staging dir) before deleting anything. |
| **TD-V2-107** | `AtomicStager.ts` grew to 610 LOC across the review hardening (measured 2026-11-18; consistent with TD-V2-101) | Debt | 3-4h | Low | Symlink guards, interruption recovery, and concurrency control all live in one file by design (one safety story; escape hatch documented in the header comment). A dedicated refactor pass may split prepare/promote/recover into modules — only with fresh integration coverage around the split. |
| **TD-V2-108** | 5s-timeout flakes in `npm-pack.test.ts` and TUI/validation tests under load | Debt | 1-2h | Low | `npm package — tarball structure / extracted installation` (5,000ms hook timeouts) and `main() — execution path` fail intermittently only when the suite runs >60s under heavy machine load; isolated reruns always pass (verified repeatedly on 2026-11-17, incl. at baseline before any fix commits). Fix: raise the hooks' explicit timeouts to 15s or make them load-tolerant. |
| **TD-V2-109** | update-gating logic in main.ts is sanctioned | FYI | — | Low | Reviewer flagged `resolveInteractiveMode`'s pre-v2.0 update block living in main.ts rather than a use case; ARCHITECTURE.md assigns mode resolution/version context to the CLI layer (`versionContext.ts`, `resolveInteractiveMode`), so this is the documented placement. FYI only. |
| **TD-V2-110** | Pre-launch follow-ups (post-beta/GA, non-blocking) | Debt | 2-4h | Low | From the 2026-11-18 review: 16 coverage-gap cases tracked (prioritize rollback residue-reporting before GA); add `engines: bun>=1.3` to `package.json`; SIGINT-mid-install E2E advisory; wiki sync: the user's uncommitted work is preserved on the nested repo's local branch `backup/pre-docs-sync` (`docs/wiki-source/.wiki`, `7d9f337`) — decision is source-wins + publish; the rsync/push has not been executed yet; TD-V2-98 local coverage drift. None blocks the `2.1.5-beta.1` tag (now published). |
| **TD-V2-111** | Fix the 6 payload plugin versions (all shipped `@latest`) | Debt | 1-2h | Medium | `template/obligatorio/core/opencode.json` `plugins` (lines 104–110) ships `opencode-rpc`, `opencode-navigator`, `opencode-skills-collection`, `opencode-skill-creator`, `opencode-search-plugin` and `@dietrichgebert/ponytail` at floating `@latest`. Códice never executes them (AGENTS.md forbids it), but the OpenCode host loads every entry at workspace start — unpinned third-party code runs on the user's machine. Pin exact versions + payload regression guard. Decision record: `docs/adr/adr-025-plugins-suministrados-en-latest.md` (ADR-025, Accepted 2026-11-18). |
| **TD-V2-112** | No-`any` policy has no enforcement gate | Debt | 1h | Medium | The project forbids explicit `any` in three places (`AGENTS.md:27`, `AGENTS.md:37`, `docs/CODE_STYLE.md:17` + checklist `:117`), but no tool applies it: `biome.json:52` sets `"noExplicitAny": "off"`, ESLint does not exist in the repo (no `.eslintrc*`, no `eslint.config.*`, no `package.json` entry), and `tsconfig.json:18` only enables `strict: true` — which catches *implicit* `any`, never explicit ones; `biome check src/ tests/` exits 0 (2 warnings + 1 info), so no severity gate either. Empirical state is clean (`grep -rnE ':\s*any\b' src/` → 0 occurrences), so the risk is silent regression: tomorrow an `any` lands unnoticed. Remediation (pick one): (a) turn `noExplicitAny` on in `biome.json`, or (b) a test guard in the style of `tests/unit/quality/source-hygiene.test.ts` that fails on `: any` in `src/`. Either path must also fix the stale comment at `tests/setup/biome.test.ts:5`, which justifies the rule-off by invoking `@typescript-eslint/no-explicit-any` — a tool the repo does not have (code/tests: `/hotfix` decides; out of docs ownership). |

- **TD-V2-106 evidence:** FEV batch-1 item 15 commit body (`d357519`) states the leftover-staging trade-off; the concurrent-marker O_EXCL guard prevents interleaving but cannot authorize deleting another run's staging dir.
- **TD-V2-107 evidence:** `wc -l src/infrastructure/adapters/AtomicStager.ts` = **610** measured 2026-11-18 (545 at batch-2 item 1 `8083a3a`, plus the pre-launch review hardening since); header comment documents the escape.
- **TD-V2-108 evidence:** baseline run at `0826445` (before any batch-1 commit) already showed `1 fail / 1 error` with `npm-pack` timeouts; subsequent isolated `bun test tests/integration/packaging/npm-pack.test.ts` runs passed every time.
- **TD-V2-112 evidence:** measured 2026-11-18 — `biome.json:52` `"noExplicitAny": "off"`; `ls .eslintrc* eslint.config.*` → absent and `grep eslint package.json` → empty; `tsconfig.json:18` = `"strict": true` (no explicit-`any` catch); `/tmp/opencode/biome check src/ tests/` → exit 0 (2 warnings + 1 info); `grep -rnE ':\s*any\b' src/` → 0 occurrences.

### v2.2.0 (Medium Effort — 9 items, 18-24h total)

| ID | Item | Type | Effort | Risk | Description |
|----|------|------|--------|------|-------------|
| — | Pack Update Diff | Feature | 3-4h | Low | Show changelog for user's installed packs during update |
| **TD-V2-10** | Domain layer imports semver directly | Debt | 2-3h | Medium | WorkspaceVersion entity imports semver directly, violating Clean Architecture. Inject comparison logic or move to VersionComparator. |
| **TD-V2-11** | Application layer instantiates infrastructure adapters | Debt | 1-2h | Medium | Use cases directly instantiate BunFileSystem, GitHubRestClient. Move to DI container (container.ts). |
| **TD-V2-21** | GitHubRestClient returns null on all errors | Debt | 1-2h | Medium | getLatestVersion() returns `string \| null` instead of `Result`. Cannot distinguish "no release" from "network error". |
| **TD-V2-22** | FileMergeEngine uses intersection type | Debt | 1h | Low | Constructor requires `IFileSystem & IStagingSystem`. Accept two separate dependencies for ISP. |
| **TD-V2-30** | Strategy pattern implementation is implicit | Debt | 2h | Low | File merge rules use if/else instead of explicit Strategy. Extract to Strategy classes. |
| **TD-V2-50** | No structured error context in progress events | Debt | 2h | Low | ProgressEvent lacks error field. Add `error?: Error` for verbose debugging. |
| **TD-V2-81** | Missing integration tests for error paths | Debt | 2h | Low | Some error paths lack integration test coverage. |
| **TD-V2-92** | Missing JSDoc for some public methods | Debt | 2h | Low | Some public methods in ports/services lack JSDoc. |

### v2.3.0 (Larger Refactoring — 4 items, 12-16h total)

| ID | Item | Type | Effort | Risk | Description |
|----|------|------|--------|------|-------------|
| **TD-V2-20** | IFileSystem port is too large | Debt | 2-3h | Medium | Split into IFileReader, IFileWriter, IDirectoryWalker. |
| **TD-V2-31** | Missing Factory pattern for use case creation | Debt | 3h | Low | Extract UseCaseFactory for better extensibility. |
| **TD-V2-60** | Directory walking is synchronous | Debt | 4-6h | Medium | Convert directoryWalker to async operations. |
| **TD-V2-80** | Some use cases are hard to test | Debt | 3-4h | Medium | Refactor use cases to accept all dependencies via constructor. |

### v2.5.0 (3 items, 18-28h total)

| ID | Item | Type | Effort | Risk | Description |
|----|------|------|--------|------|-------------|
| **TD-V2-6** | No pack removal mechanism | Debt | 4-6h | Medium | `--remove-pack <id>` flag for removing installed packs. |
| [#24](https://github.com/fisherk2/codice-opencode/issues/24) | Alternative Package Managers | Feature | 8-12h | High | uv, cargo, composer, pnpm, yarn support. |
| [#22](https://github.com/fisherk2/codice-opencode/issues/22) | Internationalization (i18n) | Feature | 6-10h | High | Language selection (English, Spanish, +3 more). |

---

## Summary

| Category | Status |
|----------|--------|
| v1.x debt | ✅ All resolved |
| v2.0.0 debt | ✅ All resolved |
| v2.1.0 debt | ✅ All resolved (4 new commands, SDD intent auto-discovery, bilingual intents, agent delegation, CI/CD hardening) — intent auto-discovery + bilingual intents later retired in FEV-30 (plugin SDD removed) |
| v2.1.1 | ✅ Released — FEV-26+27+28 — 1935 tests |
| v2.1.2 | ✅ Released (2026-08-28) — docs-update delegation hotfix + debt reorg — 1935 tests |
| v2.1.3 | ✅ FEV-29+FEV-30 complete (1959 tests, 31/31 E2E, 96.39%) — beta published, stable pending GO/tag — open: 4 hallazgos Fase-2 diferidos (TD-V2-93-f2..96) + TD-V2-97 |
| v2.1.4 hotfix | ✅ Released (2026-09-25) — #104/#105, redundant `code-reviewer` delegation removed in 6 template commands + debt reschedule — npm `latest` today (`latest` = 2.1.4; `beta` = 2.1.5-beta.1) |
| v2.1.5-beta.1 FEV-31 | ✅ Deployed (2026-11-18) — FEV-31 complete 2026-11-17 + pre-launch review 2026-11-18; #111/#112/#114/#115/#116 closed, orphan references repaired (3 `specs/` dead links deferred to second wave — see FEV-31 section), prompt budget unified at 180 — 2027 tests, 31/31 E2E; tag `926006f` published under dist-tag `beta`, `latest` intact at 2.1.4 — open: TD-V2-93-f2..96 + TD-V2-97 + TD-V2-98 + TD-V2-110 + TD-V2-111 + TD-V2-112 |
| v2.2.0 backlog | 9 items (8 debt + 1 feature) — 18-24h |
| v2.3.0 backlog | 4 items (4 debt) — 12-16h |
| v2.5.0 backlog | 3 items (1 debt + 2 features) — 18-28h |

---

## Deep Audit Results (2026-08-19)

**Scan type:** Deep audit (all 8 dimensions)  
**Total findings:** 21 items across 8 dimensions

| Dimension | Findings | Critical | High | Medium | Low |
|-----------|----------|----------|------|--------|-----|
| 1. System Structure | 2 | 0 | 0 | 1 | 1 |
| 2. Backend Architecture | 3 | 0 | 0 | 2 | 1 |
| 3. Design Patterns | 2 | 0 | 0 | 1 | 1 |
| 4. Data Flow | 2 | 0 | 0 | 0 | 2 |
| 5. Scalability & Performance | 2 | 0 | 0 | 0 | 2 |
| 6. Security | 1 | 0 | 0 | 1 | 0 |
| 7. Testability | 2 | 0 | 0 | 0 | 2 |
| 8. Documentation | 4 | 0 | 2 | 0 | 2 |
| **Total** | **21** | **0** | **2** | **5** | **14** |

**Methodology:** 8 subagents analyzed the codebase in parallel across all dimensions, using clean-ddd-hexagonal, design-patterns, dependency-audit, observability-and-instrumentation, performance-analysis, security-and-hardening, test-driven-development, and documentation-and-adrs skills.

---

*Maintained by Códice team. Update when tech debt items are added or resolved.*
*Last updated: 2026-11-18 (post-deploy alignment of `v2.1.5-beta.1`; TD-V2-111 and TD-V2-112 added; >200-LOC claims re-measured)*
*Next deep audit: after v2.1.5 GA*
