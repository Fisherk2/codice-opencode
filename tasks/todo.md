# FEV-30 — Remove SDD Plugin + Opencode Legacy Banner — Todo

> **COMPLETADO 2026-09-22.** FEV-30 cerrado en `hotfix/opencode-v2-migrate` —
> 20 commits (F1 deletes, F2 CI strip, F3 banner TDD, F4 docs, review 5 ejes + 6 fixes),
> gates verdes (`just check` 0, `just test` 1865/0, e2e 31/31).
> Trabajo FEV-30 HEAD `7cdb65d`. Issue #90.
> Release: v2.1.3-beta.1 lista para lanzarse (sin push; pendiente decisión de release).

> **Plan:** [`tasks/plan.md`](./plan.md)
> **Branch:** `hotfix/opencode-v2-migrate`
> **Target:** v2.1.3 (mismo hotfix que FEV-29)
> **Issue:** [#90](https://github.com/Fisherk2/codice-opencode/issues/90)
>
> Quality gate: `just check` 0 errors + `just test` 0 failures antes de cada commit.
> Atomicity rule: 10 commits, uno por concern (no batching).

## Phase 1 — Eliminación de archivos (F1)

- [x] **1.1** Delete `template/obligatorio/core/.opencode/plugins/` (sdd-pipeline.ts + 2 src modules + package.json + README.md + tsconfig.json + .gitignore). Commit `chore(plugin): remove SDD plugin from template (FEV-30)`. Subagents: `backend-developer`, `git-workflow-manager`. Skills: `git-workflow-and-versioning`, `bash-defensive-patterns`.
- [x] **1.2** Delete `.opencode/plugins/` (dev copy + 16 src modules + __tests__). Commit `chore(plugin): remove dev plugin copy (FEV-30)`. Subagents: `git-workflow-manager`. Skills: `git-workflow-and-versioning`, `bash-defensive-patterns`.
- [x] **1.3** Delete `tests/plugin/` (integration + e2e + 3 bash scripts) + `tests/types/opencode-plugin.d.ts` + `tests/unit/config/destructive-patterns.test.ts`. Commit `test(plugin): drop plugin test suites (FEV-30)`. Subagents: `qa-automation`, `git-workflow-manager`. Skills: `git-workflow-and-versioning`, `test-driven-development`.

**Checkpoint F1**
- [x] `find . -path '*/.opencode/plugins*' -not -path '*/node_modules/*' -not -path '*/fixtures/*'` retorna **0 paths** en `template/` y `.opencode/` raíz.
- [x] `grep -rln 'sdd-pipeline\|DestructiveCommandBlock\|destructivePatterns\|tests/plugin\|tests/types/opencode-plugin' src/ scripts/ tests/ template/` retorna **0 matches**.
- [x] `just check` 0 errores.

## Phase 2 — Cleanup de recipes de CI + Biome + Justfile + Manifest (F2)

- [x] **2.1** Strip `Justfile` plugin targets (líneas 60-80) + delete `.github/workflows/ci.yml` job `qa-plugin` (líneas 78-112). Commit `chore(ci): remove plugin recipes and CI job (FEV-30)`. Subagents: `devops-engineer`, `code-reviewer`. Skills: `ci-cd-and-automation`, `code-review-and-quality`, `git-workflow-and-versioning`.

**Checkpoint F2**
- [x] `grep -n 'check-plugin\|test-plugin\|qa-plugin\|tests/plugin' Justfile .github/workflows/ci.yml biome.json` retorna **0 matches**.
- [x] `just check` 0 errores.

## Phase 3 — Banner runtime "Opencode Legacy only" (F3)

- [x] **3.1** Crear `src/application/helpers/opencodeLegacyBanner.ts`: lee `.codice-version`, compara con 2.1.2, imprime warning si ≤ 2.1.2. Commit `feat(installer): warn on Opencode Legacy installs ≤ 2.1.2 (FEV-30)`. Subagents: `backend-developer`, `test-engineer`. Skills: `test-driven-development`, `clean-code`, `clean-ddd-hexagonal`.
- [x] **3.2** Wire `maybePrintLegacyBanner()` en `CleanInstallUseCase`, `ProjectInstallUseCase`, `UpdateWorkspaceUseCase` antes del primer prompt. Commit `feat(installer): wire legacy banner into install flows (FEV-30)`. Subagents: `backend-developer`. Skills: `clean-ddd-hexagonal`, `refactoring-patterns`.
- [x] **3.3** Crear `tests/unit/application/helpers/opencodeLegacyBanner.test.ts` con 5 casos (sin version, ≤ 2.1.2, ≥ 2.1.3, inválida, sin loadVersionFile). Commit `test(installer): add legacy banner unit tests (FEV-30)`. Subagents: `qa-automation`. Skills: `test-driven-development`, `debugging-and-error-recovery`. **Nota:** el test se creó dentro de Task 3.1 vía TDD (commit `0593910`), no como commit separado.

**Checkpoint F3**
- [x] `just test` 0 fallos; nuevos tests pasan.
- [x] `just check` 0 errores.
- [x] Banner visible en `--verbose` con fixture `.codice-version` = `2.1.2`.
- [x] Banner NO aparece con `.codice-version` = `2.1.3`.

## Phase 4 — Limpieza documental completa + release (F4)

- [x] **4.1** Delete `specs/spec-sdd-plugin-decoupling.md`, `specs/adr/adr-013-plugin-auto-discovery.md`, `docs/diagnosis/fix15-plugin-cleanup.md`. Commit `docs(workflow): retire plugin specs and ADRs (FEV-30)`. Subagents: `docs-writer`, `git-workflow-manager`. Skills: `documentation-and-adrs`, `git-workflow-and-versioning`.
- [x] **4.2** Update `README.md`, `SPEC.md`, `docs/WORKFLOW.md`, `docs/TRD.md`, `docs/ARCHITECTURE.md`, `docs/wiki-source/.wiki/SDD-Pipeline.md` + `Commands.md` + `Configuration.md`: scrub plugin refs + replace "55/55 plugin integration" con métrica actual. Commit `docs(workflow): scrub plugin references from active docs (FEV-30)`. Subagents: `docs-writer`, `technical-writer`. Skills: `documentation-and-adrs`, `crafting-effective-readmes`.
- [x] **4.3** Update `CHANGELOG.md`: añadir `[2.1.3]` con FEV-30 completo (remoción + banner). Mantener historia inmutable de v2.1.1/v2.1.2. Commit `docs(changelog): FEV-30 release entry v2.1.3 (FEV-30)`. Subagents: `technical-writer`. Skills: `changelog-generate`, `documentation-and-adrs`.

**Checkpoint F4 (final)**
- [x] `grep -rln 'plugin\|sdd-pipeline\|sddPipeline\|DestructiveCommandBlock\|destructivePatterns\|tests/plugin\|qa-plugin' docs/ specs/ wiki-source/ README.md SPEC.md 2>/dev/null` retorna **0 matches** (excepto CHANGELOG history).
- [x] `docs/ARCHITECTURE.md` tabla ADRs: ADR-013 ausente.
- [x] `git status --porcelain` limpio.
- [x] Gates verdes: `just check && just test` + Linux `just coverage-check 95` + `just test-e2e`.

## Notes

- **Defensa en profundidad preservada:** `template/obligatorio/core/opencode.json` mantiene `permission.bash` deny-lists que ya cubren el bloqueo destructivo (FEV-27 + code review). El plugin eliminado era redundante.
- **Banner runtime es no bloqueante.** Usuarios en ≤ 2.1.2 ven el warning pero pueden continuar.
- **Historia documental eliminada por completo.** No hay banners "superseded" en specs/ADRs. El CHANGELOG v2.1.1 conserva el registro inmutable del release pasado.
- **20 commits reales** (conteo `git log --oneline c168586..7cdb65d` + base = 10 planificados F1–F4 + review 5 ejes y 6 fixes) — el plan original preveía 10 atómicos; el review añadió el resto.
- **Subagent delegation:** solo subagents (`backend-developer`, `git-workflow-manager`, `qa-automation`, `devops-engineer`, `code-reviewer`, `test-engineer`, `docs-writer`, `technical-writer`). Main agents NUNCA.