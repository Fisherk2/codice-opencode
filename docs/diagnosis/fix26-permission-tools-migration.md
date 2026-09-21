# Diagnosis: Agent Packs Use Legacy `permission:` Syntax (Opencode V2 Incompatible)

**ID:** FEV-29 (issue #91 — deferred from v2.1.3 hotfix scope)
**Date:** 2026-09-19
**Severity:** high
**Status:** superseded (see notice below — do not apply §Proposed Solution)

## Supersession notice (2026-09-21)

The migration direction prescribed here (`permission:` → `tools:`) proved
**wrong** during Fase 2 (see `fix28-subagent-delegation-kill-switch.md`). The
body below is preserved as historical record; do not act on it. Corrections:

- V2 native agent format is the **`permissions:` list** (`{action, resource,
  effect}`), not `tools:`. `tools:` is itself legacy in current V2 — the FEV-29
  batch pointed the wrong way and Fase 2 overwrote it toward `permissions:`.
- `opencode.json` does **not** keep a `permission` schema; Fase 1 migrated it
  to the same `permissions:` list (commit `69332e6`).
- The mechanical rename is replaced by the codemod
  `scripts/migrate-v1-to-v2-permissions.ts` (TDD suite alongside it), which
  also renames `bash`→`shell`, `task`→`subagent`, `write`/`patch`→`edit`,
  collapses duplicates, and injects the `subagent *: deny` chain brake.
- Sources: use `https://opencode.ai/v2/docs/{agents,permissions,migrate-v1}/`,
  not the `/docs/es/` fork pages cited in §References.

---

## Summary

205 agent files across `template/obligatorio/packs/` still use V1 `permission:` frontmatter. In Opencode V2, the agent `.md` format replaces `permission:` with `tools:` (the two formats are distinct from `opencode.json`). Agents deployed with the legacy key silently lose all tool restrictions in V2 — observed as a write-restricted primary agent (Moctezuma) successfully calling Write/Edit.

## Symptoms

- Installed agents' tool restrictions are ignored under Opencode V2
- Restrictive agent performs forbidden Write/Edit calls
- Only `main/` (6 primaries) plus `software-development/` and `writers/` packs were migrated in the v2.1.3 hotfix; 205 files across the other 8 packs remain legacy

## Root Cause

Opencode V2 changed the agent-file config contract from `permission:` to `tools:`. `opencode.json` keeps its own `permission` schema (unchanged), but agent `.md` frontmatter no longer honors the old key — it fails closed-open (ignore) instead of erroring, so restrictions vanish silently.

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All V2 users installing non-main packs |
| Functionality | Write/Edit/bash restrictions not enforced on agents |
| Data integrity | At risk — restrictive agents can modify files |
| Reproducibility | Always under Opencode V2 with any non-migrated pack |

## Environment

- **Platform:** Any (Opencode V2 host)
- **Version:** Códice ≤ 2.1.3 (partials migrated) installed packs
- **Configuration:** agent `.md` frontmatter (`template/obligatorio/packs/**`)

## Proposed Solution

1. Run the batch migration for the 205 remaining files (8 packs). Conversion rule is a flat, mechanical rename — no value restructuring needed for subagents:
   - Top-level `permission:` → `tools:` in the YAML frontmatter.
   - Scalar/nested values remain as-is (verified against `packs/software-development/accessibility-auditor.md`, already migrated).
   - Keep hand-tuned nested maps for `main/` primaries untouched.
2. Guard rails: script must fail on any file already declaring `tools:` (none mix both keys today — verified) and on malformed frontmatter.
3. Update affected specs/tests: `specs/spec-agent-packs.md`, `specs/spec-agent-format-v2.md` (still document `permission:` for pack subagents), frontmatter validation fixtures.
4. Update manifest/docs mentioning the syntax if applicable.

## References

- Remote issue: https://github.com/Fisherk2/codice-opencode/issues/91
- Opencode V2 agent docs: https://opencode.ai/docs/es/agents/
- Opencode V2 `opencode.json` permission docs (different format): https://opencode.ai/docs/es/tools/
- Prior partial work: commits `8f34f5c`, `290f229` (branch `hotfix/opencode-v2-migrate`)
