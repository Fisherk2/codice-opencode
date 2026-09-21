# Implementation Plan: FEV-29 — Agent Pack Migration `permission:` → `tools:` (Opencode V2)

> **SUPERSEDED 2026-09-22.** Wrong migration direction — native V2 format is
> the `permissions:` list, not `tools:` (see `docs/diagnosis/fix28-…` and the
> fix26 supersession banner). Fase 2 superseded this plan entirely
> (`scripts/migrate-v1-to-v2-permissions.ts` + `scripts/migrate-all-packs.ts`,
> 8 per-pack commits). Body preserved as history; do not execute.

**Source issue:** #91
**Branch:** `hotfix/opencode-v2-migrate`
**Target release:** v2.1.3 (Hotfix Opencode V2)
**Created:** 2026-09-19
**Spec anchors:** `docs/diagnosis/fix26-permission-tools-migration.md`, `specs/spec-agent-format-v2.md` §3, `specs/spec-agent-packs.md` §4

---

## Overview

Opencode V2 replaced the `permission:` key in agent `.md` frontmatter with `tools:`. The legacy key is silently ignored in V2, which makes restrictive agents (e.g. Moctezuma) appear unrestricted. The main, software-development, and writers packs were already migrated in earlier commits on this branch. FEV-29 finishes the migration for the remaining **205 agent files across 7 packs**, plus the validator/tests/scripts/specs that still consume the old key.

## Architecture Decisions

- **Flat rename as default rule.** Confirmed against `packs/software-development/accessibility-auditor.md`: scalar (`write: deny`) and nested-map (`bash: {"*": "deny"}`) values are byte-identical between V1 and V2 — only the top-level key changes.
- **Primary agents (main/) are out of scope.** Already migrated in commit `8f34f5c` with custom task-deny-lists under `tools.task`.
- **Validator accepts both `tools:` scalar and nested-object forms** (primary mode needs `tools.task: {"*": allow, "name": deny}`). Existing V1 object-permission logic is generalised to `tools:`.
- **One commit per pack** (user decision) so individual packs are revertible.

## Task List

### Phase 1 — Migration script + 7 packs reverted per-pack (F1)

- [ ] **Task 1.1 — Codemod script.** Create `scripts/migrate-permission-to-tools.ts` that walks `template/obligatorio/packs/`, parses each agent's YAML frontmatter, renames top-level `permission:` → `tools:` and rewrites the file preserving indentation and trailing content. Must fail (non-zero exit) if a file already has `tools:` in frontmatter, or if the file declares both keys, or if the YAML cannot be parsed.
- [ ] **Task 1.2 — Script dry-run + golden test.** Add `tests/unit/scripts/migrate-permission-to-tools.test.ts` covering: pure scalar value, nested-map value, file already migrated (must error), mixed keys (must error), malformed YAML (must error), idempotency (running twice yields identical content).
- [ ] **Task 1.3 — Migrate `business/` (91 files).** `bun run scripts/migrate-permission-to-tools.ts template/obligatorio/packs/business/` → single atomic commit `refactor(agents): migrate business pack permission -> tools`.
- [ ] **Task 1.4 — Migrate `creative/` (10).** Commit `refactor(agents): migrate creative pack permission -> tools`.
- [ ] **Task 1.5 — Migrate `finance/` (11).** Commit `refactor(agents): migrate finance pack permission -> tools`.
- [ ] **Task 1.6 — Migrate `government-legal/` (8).** Commit `refactor(agents): migrate government-legal pack permission -> tools`.
- [ ] **Task 1.7 — Migrate `hardware-emerging/` (36).** Commit `refactor(agents): migrate hardware-emerging pack permission -> tools`.
- [ ] **Task 1.8 — Migrate `operations-support/` (18).** Commit `refactor(agents): migrate operations-support pack permission -> tools`.
- [ ] **Task 1.9 — Migrate `science-research/` (31).** Commit `refactor(agents): migrate science-research pack permission -> tools`.

**Checkpoint F1:** `grep -rl '^permission:' template/obligatorio/packs/ | wc -l` returns `0`. `just check` is green (linter + tsc). The validator does not yet test `tools:`, so legacy field errors are expected; we run them only as a guard that no file accidentally keeps the old key.

### Phase 2 — Validator + test suites ported to `tools:` (F2)

- [ ] **Task 2.1 — Port `agentFrontmatterValidator.ts` to `tools:` semantics.** Rename internal `validatePermission` → `validateTools`, switch field read from `frontmatter.permission` to `frontmatter.tools`, keep scalar/object rules but extend object handling to: (a) accept `task` as a map of `agent-name → "allow" | "ask" | "deny"` for primaries (deny-list pattern); (b) accept arbitrary shell-glob keys under `bash` (already supported) — V2 same syntax. Update exported function name only if the test imports are also updated (keep backward-compat shim if simpler).
- [ ] **Task 2.2 — Update `tests/unit/domain/agent-frontmatter-validation.test.ts`.** Replace `parsed?.permission` with `parsed?.tools` everywhere (line ~110), rename describe blocks ("permission value errors" → "tools value errors"), and port the FEV-19 invariants suite (lines ~175-205) to assert `tools.task` structure with deny-list primaries.
- [ ] **Task 2.3 — Update `tests/unit/scripts/reformat-agent.test.ts`.** Switch the single assertion at line 62 from `expect(output).toContain("permission:")` to `expect(output).toContain("tools:")`; verify all 10 reformat test cases still pass against the new `scripts/reformat-agent.ts` output (handled in 3.1).

**Checkpoint F2:** `just test` green; full frontmatter validation suite covers all 211 agent files (205 migrated + 6 main). Discover count assertion at line 60 unchanged (`>300`).

### Phase 3 — Generator + specs aligned with V2 contract (F3)

- [ ] **Task 3.1 — Port `scripts/reformat-agent.ts` to emit `tools:`.** Rename `SUBAGENT_PERMISSION` → `SUBAGENT_TOOLS`; rewrite the template literal so its top-level key is `tools:` with the same canonical content (write/edit/ask/allow/deny pattern). Spec cross-reference at `specs/spec-agent-format-v2.md` §3 also updated in 3.2.
- [ ] **Task 3.2 — Update `specs/spec-agent-format-v2.md` for V2 contract.** Replace the two YAML examples that still start with `permission:` (lines ~50 and ~93) with `tools:` equivalents. Update §8 references from `permission.task` to `tools.task` (lines 177 and 227). Bump status line to reflect "FEV-29 v2 contract".
- [ ] **Task 3.3 — Update `specs/spec-agent-packs.md` §4.** Replace the table headers/cells that show `task:` under the unified-permission example (lines 154-167) with `tools.task` and `{"*": "allow", "<other-primary>": "deny"}` examples matching the migrated primaries. Bump version note to "2.0.0+ (FEV-29 tools migration)".
- [ ] **Task 3.4 — Update contributor cross-reference.** If `CONTRIBUTING.md` or the wiki mentions `permission:` for pack agents, replace with `tools:` examples. (Verify with `grep -rn "permission:" CONTRIBUTING.md docs/wiki-source/` — fix only if matches found.)

**Checkpoint F3:** `just check` 0 errors; `just test` 0 fail; grep confirms `^permission:` returns 0 inside `template/obligatorio/packs/`; specs and validator reference `tools:` only.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Codemod silently corrupts frontmatter indentation | High | Idempotency golden test + dry-run flag (`--dry-run`) + per-pack atomic commits (user chose) so a broken pack reverts in one command |
| Validator over-permissive on `task:` deny-list shape | Medium | FEV-19 invariants suite reuses existing assertions (deny-list primaries) but on `tools.task` |
| A legacy `permission:` nested inside body markdown trips the codemod | Low | Script only matches the top-level YAML key, not inline content; golden test covers body strings that contain the word "permission" |
| Specs and CONTRIBUTING out of sync after migration | Low | F3 closes with `grep` for any leftover `permission:` references in non-template docs |

## Verification (run after each phase)

```bash
# after F1
just check
grep -rl '^permission:' template/obligatorio/packs/ | wc -l   # expect 0
# after F2
just test
# after F3
just check && just test
```

## Subagent Delegation Matrix

Tasks 1.3-1.9 are mechanical and independent — they can be parallelised across subagents of the same pack domain (e.g. multiple `*-developer` subagents), or run sequentially in one session. Tasks 2.x require focused sequential work by a TypeScript-aware subagent (e.g. `typescript-pro` or `code-reviewer`) because they touch the validator and its tests. Tasks 3.x require documentation-fluent subagents (`docs-writer`, `technical-writer`).

Suggested subagents (write to `tasks/todo.md` per pack, **no main agents**):

| Task | Suggested subagents |
|------|---------------------|
| 1.1 | `backend-developer` (script + Bun fs APIs), `code-reviewer` (idempotency) |
| 1.2 | `test-engineer`, `bun-test-specialist` (closest: `qa-automation`) |
| 1.3-1.9 | `devops-engineer` (run + verify) — sequential per pack |
| 2.1-2.3 | `typescript-pro`, `test-engineer` |
| 3.1 | `backend-developer` |
| 3.2-3.3 | `docs-writer`, `technical-writer` |
| 3.4 | `docs-writer` |

## Open Questions

None — all design decisions confirmed with the user before plan save.

## Out of Scope

- Primary agents (main/) — already migrated.
- `template/opcional/` agents — already on V2 or not present (verify in F1).
- `sin-clasificar/` legacy agents — kept on V1 per `spec-agent-format-v2.md` §9 ("Hybrid decision 2026-08-04").
- Removal of the SDD plugin — covered by FEV-30 in a separate plan.

---

*End of plan — see `tasks/todo.md` for the live checklist.*
