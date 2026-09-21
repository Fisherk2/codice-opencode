# FEV-29 — Permission → Tools Migration — Todo

> **SUPERSEDED 2026-09-22.** The `permission:` → `tools:` direction was wrong:
> native V2 format is the `permissions:` list (see `docs/diagnosis/fix28-…`,
> `specs/spec-agent-format-v2.md`). Fase 2 migrated all 349 files via
> `scripts/migrate-v1-to-v2-permissions.ts` + `scripts/migrate-all-packs.ts`;
> the FEV-29 codemod and its test were deleted. Body preserved as history.

**Plan:** `tasks/plan.md`
**Branch:** `hotfix/opencode-v2-migrate`
**Target:** v2.1.3

> Quality gate: `just check` 0 errors + `just test` 0 failures before any commit in this list.
> Atomicity rule: one commit per task. Pack migrations (1.3-1.9) must not be batched.

## Phase 1 — Migration script + 7 packs (F1)

- [ ] **1.1** Create `scripts/migrate-permission-to-tools.ts` — codemod w/ guard rails (already-migrated/mixed-key/YAML-error fail-loud). Subagents: `backend-developer`, `code-reviewer`.
- [ ] **1.2** Add `tests/unit/scripts/migrate-permission-to-tools.test.ts` — 6 cases (scalar, nested-map, already-migrated, mixed-keys, malformed-YAML, idempotency). Subagents: `qa-automation`.
- [ ] **1.3** Run codemod on `business/` (91 files). Commit `refactor(agents): migrate business pack permission -> tools`.
- [ ] **1.4** Run codemod on `creative/` (10 files). Commit `refactor(agents): migrate creative pack permission -> tools`.
- [ ] **1.5** Run codemod on `finance/` (11 files). Commit `refactor(agents): migrate finance pack permission -> tools`.
- [ ] **1.6** Run codemod on `government-legal/` (8 files). Commit `refactor(agents): migrate government-legal pack permission -> tools`.
- [ ] **1.7** Run codemod on `hardware-emerging/` (36 files). Commit `refactor(agents): migrate hardware-emerging pack permission -> tools`.
- [ ] **1.8** Run codemod on `operations-support/` (18 files). Commit `refactor(agents): migrate operations-support pack permission -> tools`.
- [ ] **1.9** Run codemod on `science-research/` (31 files). Commit `refactor(agents): migrate science-research pack permission -> tools`.

**Checkpoint F1**
- [ ] `grep -rl '^permission:' template/obligatorio/packs/ | wc -l` returns `0`.
- [ ] `just check` 0 errors.

## Phase 2 — Validator + tests ported to `tools:` (F2)

- [ ] **2.1** Port `tests/unit/domain/helpers/agentFrontmatterValidator.ts`: `validatePermission` → `validateTools`, field `permission` → `tools`, extend object handling to cover `task:` deny-list map. Subagents: `typescript-pro`, `code-reviewer`.
- [ ] **2.2** Update `tests/unit/domain/agent-frontmatter-validation.test.ts`: replace `parsed.permission` reads with `parsed.tools`; rename describe blocks ("permission value errors" → "tools value errors"); port the FEV-19 invariants suite to `tools.task` deny-list shape. Subagents: `typescript-pro`, `test-engineer`.
- [ ] **2.3** Update `tests/unit/scripts/reformat-agent.test.ts`: change `expect(output).toContain("permission:")` → `expect(output).toContain("tools:")` (line 62). Subagents: `qa-automation`.

**Checkpoint F2**
- [ ] `just test` green; agent-frontmatter-validation suite covers all 211 files (205 migrated + 6 primary).
- [ ] No leftover `permission` references in `tests/unit/domain/helpers/agentFrontmatterValidator.ts` and `tests/unit/domain/agent-frontmatter-validation.test.ts`.

## Phase 3 — Generator + specs aligned (F3)

- [ ] **3.1** Port `scripts/reformat-agent.ts`: rename `SUBAGENT_PERMISSION` → `SUBAGENT_TOOLS`, emit top-level `tools:`. Subagents: `backend-developer`.
- [ ] **3.2** Update `specs/spec-agent-format-v2.md` §3 (canonical block) and §8 (delegation references `permission.task` → `tools.task`). Subagents: `docs-writer`, `technical-writer`.
- [ ] **3.3** Update `specs/spec-agent-packs.md` §4 (unified permission table): flip `task:` to `tools.task` with deny-list examples. Subagents: `docs-writer`.
- [ ] **3.4** Verify + update `CONTRIBUTING.md` and `docs/wiki-source/` for any leftover `permission:` references. Subagents: `docs-writer`.

**Checkpoint F3**
- [ ] `just check && just test` green.
- [ ] `grep -rln 'permission:' specs/ CONTRIBUTING.md docs/wiki-source/ scripts/` returns only matches in `fix26-*` diagnosis file (allowed) and the V1/V2 comparison prose (audit case-by-case).
- [ ] No commit has bundled more than one pack change (atomicity check).

## Notes

- Codemod script lives outside `src/` and is **not shipped** in the npm package; it is a contributor tool only.
- The V2 `tools:` schema is identical in shape to V1 `permission:` — only the top-level key changes. No value rewrites are required.
- Subagent delegation must list **subagents only** (e.g. `docs-writer`, `typescript-pro`, `qa-automation`). Main agents (`huitzilopochtli`, `quetzalcoatl`, `tlaloc`, `moctezuma`, `mictlantecuhtli`, `tezcatlipoca`) are NEVER invoked from `/plan`.
