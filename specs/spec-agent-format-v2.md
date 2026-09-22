# Agent Format v2.0 — FEV-18 Specification

**Spec ID:** S5-PACKS §3 (format standardization)
**Date:** 2026-08-04
**Author:** Moctezuma (Strategic Planner)
**Status:** Approved (FEV-18 Phase 1) · Amended 2026-09-21 (Fase 2 — native V2 `permissions:`, delegation brake)
**Amends:** §§3–4, 7–8 supersede the V1 `tools:` / `temperature` / `task()` contract below; FEV-18 conversion history is preserved. See `docs/diagnosis/fix28-subagent-delegation-kill-switch.md` and `scripts/migrate-v1-to-v2-permissions.ts`.

---

## 1. Purpose

FEV-18 migrates 267 new agents from external sources into pack directories.
These source files use a minimalist frontmatter that is incompatible with the
Códice workspace standard. This spec defines the **target v2.0 format** and the
conversion rules applied by `scripts/migrate-v1-to-v2-permissions.ts` (Fase 2 —
V1 `tools:`/`permission:` maps → native V2 `permissions:` list). The FEV-18
producer `scripts/reformat-agent.ts` was retired because it emitted the V1
`tools:` map; see §7.

## 2. Source Format

```yaml
---
name: AI Engineer
description: Expert AI/ML engineer specializing in model development...
color: blue
emoji: 🤖
vibe: Turns ML models into production features.
---

# AI Engineer Agent

<body content — free-form markdown>
```

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Display name (Title Case) |
| `description` | string | One-line purpose |
| `color` | string | Named color OR hex (`"#059669"`) — optional |
| `emoji` | string | Decorative emoji — optional |
| `vibe` | string | Personality tagline — optional |

## 3. Target Format (v2.0 — Códice standard; Fase-2: native V2 permissions)

```yaml
---
description: "AI Engineer — Expert AI/ML engineer specializing in model development..."
mode: subagent
request:
  body:
    temperature: 0.1
color: "#dcb03b"
hidden: true
permissions:
  - action: edit
    resource: "*"
    effect: allow
  - action: shell
    resource: "less *"
    effect: allow
  - action: shell
    resource: "more *"
    effect: allow
  - action: grep
    resource: "*"
    effect: allow
  - action: glob
    resource: "*"
    effect: allow
  - action: lsp
    resource: "*"
    effect: allow
  - action: skill
    resource: "*"
    effect: allow
  - action: todowrite
    resource: "*"
    effect: allow
  - action: webfetch
    resource: "*"
    effect: allow
  - action: websearch
    resource: "*"
    effect: allow
  - action: question
    resource: "*"
    effect: allow
  - action: subagent
    resource: "*"
    effect: deny
---

# AI Engineer

<body content — preserved from source>

## COMPOSITION

- **Invoke directly when:** <purpose snippet>
- **Invoke via:** Primary agents (via subagent delegation)
- **Do not invoke from:** Another persona without a specific task requiring this specialization.
```

### Field mapping

| Source field | Target field | Rule |
|--------------|--------------|------|
| `name` | H1 title + description prefix | `# <name>`; description = `"<name> — <source description>"` |
| `description` | `description` | Kept verbatim after the name prefix |
| `color` | `color` | Normalized: hex kept, named colors → `#dcb03b` |
| `emoji` | *(dropped)* | Not part of the Códice standard |
| `vibe` | *(dropped)* | Not part of the Códice standard |
| — | `mode` | Always `subagent` |
| — | `request.body.temperature` | Always `0.1` (top-level `temperature` is legacy in V2) |
| — | `hidden` | Always `true` |
| — | `permissions` | V2 native list, converted from the V1 `tools:` map (see §Permission block) |
| — | `subagent: "*": deny` | Delegation brake, appended last for every `mode: subagent` (Fase 2) |

### Permission block (canonical, V2 native)

```yaml
permissions:
  - action: edit
    resource: "*"
    effect: allow
  - action: shell
    resource: "<command> *"
    effect: allow
  # … one rule per tool/resource, file order preserved …
  - action: subagent
    resource: "*"
    effect: deny
```

Conversion is mechanical (applied by `scripts/migrate-v1-to-v2-permissions.ts`):

| V1 (`tools:` / `permission:` map) | V2 (`permissions:` list) |
|-----------------------------------|--------------------------|
| Scalar `key: effect` | `- action: <key>` / `resource: "*"` / `effect` |
| Nested `group: {pattern: effect}` | One rule per entry, file order kept |
| `bash` → `shell`, `task` → `subagent`, `write`/`patch` → `edit` | Renamed per `https://opencode.ai/v2/docs/migrate-v1/` |
| Top-level `temperature`/`top_p` | Moved under `request.body` |
| `maxSteps` | Renamed to `steps` |
| `mode: subagent` without subagent rules | Append `subagent "*": deny` (chain brake) |

Fail-loud: mixed `tools:` + `permissions:`, both legacy maps, malformed
frontmatter. The V1 `tools:` map and the singular `permission:` are **not** valid
V2 agent keys — OpenCode V2 silently ignores unknown frontmatter keys, so they are
rejected loudly by `tests/unit/domain/helpers/agentFrontmatterValidator.ts`
(issue #91). Warn: `write`/`patch`/`edit` conflicts, non-consecutive
action+resource duplicates (collapsed keeping the last, V2 last-match-wins).

**Rationale:** Subagents may write/edit files (unlike most primaries) and have
access to read/query/skill tools; shell stays gated per command. The trailing
`subagent: "*": deny` prevents delegation chains: a child session merges the
global `ask` with its own frontmatter, so without the brake it could launch
grandchildren (see `docs/diagnosis/fix28-subagent-delegation-kill-switch.md`).
This matches the migrated `template/obligatorio/packs/writers/*.md`.

## 4. COMPOSITION Block

The `## COMPOSITION` block is appended to every converted agent. It follows the
existing convention found in primary agents (`template/obligatorio/packs/main/tlaloc.md`)
and legacy subagents (`template/obligatorio/packs/sin-clasificar/typescript-pro.md`).

### Template (subagent)

```markdown
## COMPOSITION

- **Invoke directly when:** <first sentence of description, ≤120 chars>
- **Invoke via:** Primary agents (via subagent delegation)
- **Do not invoke from:** Another persona without a specific task requiring this specialization.
```

### Content rules

- `Invoke directly when` = first sentence of the source description (truncated to 120 chars).
- `Invoke via` = always "Primary agents (via subagent delegation)" for subagents.
- `Do not invoke from` = standard guard text.
- The block must appear AFTER the body content (last section of the file).

## 5. Body Transformation Rules

1. **Remove** the source H1 if it duplicates the generated title:
   - `# AI Engineer Agent` → removed (replaced by generated `# AI Engineer`)
   - Pattern: `^# <name> (Agent|Specialist|Expert)$`
2. **Preserve** all other body content verbatim.
3. **Do not** convert emoji headers (`## 🧠 Your Identity`) — they are body content.

## 6. Idempotency Guarantees

`scripts/migrate-v1-to-v2-permissions.ts` must leave an already-migrated file
untouched when run twice:

- A file that already carries a `permissions:` list is skipped, never rewritten.
- Conversion preserves every other key and the Markdown body verbatim, so a
  second pass over the same file is a no-op.

### Exit-code contract (amended 2026-09-21)

The codemod CLI exposes distinct exit codes so CI can distinguish review from
emission outcomes:

| Outcome | Exit code |
|---------|-----------|
| Clean run (no errors, dry-run or apply) | `0` |
| **Dry-run with errors** — validation failures reported, no files written | **`2`** |
| **Apply with errors** — a real pass produced errors alongside any writes | **`1`** |

The dry-run-with-errors code changed from `0` to `2`: a dry run that surfaces
validation failures is a *finding*, not a success, and gating on exit code must
not silently pass it. The `1` code remains reserved for apply-mode errors so a
pass that wrote files and then failed can be told apart from a read-only failed
review.

## 7. Reference Implementations

> **Removed:** the Fase-2 bulk runner `scripts/migrate-all-packs.ts` (plus its
> test `tests/unit/scripts/migrate-all-packs.test.ts`) retired this round —
> all 8 pending packs were migrated and the per-pack bookkeeping made it
> redundant. It lives only in git history (`9abb2f0`..HEAD; `git log --follow
> scripts/migrate-all-packs.ts`).
>
> **A future re-migration calls the codemod directly.** One pack per invocation,
> one commit per pack (the Fase-2 batching rule):
>
> ```bash
> # review first — exit 2 if validation errors surface, nothing written
> bun run scripts/migrate-v1-to-v2-permissions.ts --dry-run template/obligatorio/packs/<pack>
> # then emit — exit 1 if the apply pass produced errors, 0 when clean
> bun run scripts/migrate-v1-to-v2-permissions.ts template/obligatorio/packs/<pack>
> ```
>
> Gate each pack with `tests/unit/domain/helpers/agentFrontmatterValidator.ts`
> and the coverage gate (`just coverage-check 95`), as Fase-2 did.

> **Retired:** the FEV-18 `reformat-agent` producer (`scripts/reformat-agent.ts`,
> its CLI wrapper and its test suite) was deleted — it emitted the V1 `tools:` map,
> which OpenCode V2 ignores, so it could only produce agents the validator now
> rejects. Its transformation rules remain as history in §§2 and 5. Author new
> agents against the native V2 `permissions:` list (§§3–4) or convert existing
> ones with `scripts/migrate-v1-to-v2-permissions.ts` (Fase 2).

| File | Role |
|------|------|
| `scripts/migrate-v1-to-v2-permissions.ts` | Fase-2 codemod V1→V2 (`permissions:` list, renames, dedupe, chain brake) |
| `tests/unit/scripts/migrate-v1-to-v2-permissions.test.ts` | 23 TDD cases (RED→GREEN verified) |
| `docs/diagnosis/fix28-subagent-delegation-kill-switch.md` | Merge semantics, kill-switch, chain-brake design |
| `template/obligatorio/packs/main/huitzilopochtli.md` | Primary agent reference |
| `template/obligatorio/packs/sin-clasificar/backend-developer.md` | Legacy subagent reference |

## 8. Delegation Protocol (Fase-2: native `subagent` tool)

Primary agents delegate through the V2 `subagent` tool (rename of V1 `task`).
Global `permissions` in `opencode.json` carry `subagent: "*": ask` — a global
`deny` acts as an absolute kill-switch for the tool (see fix28), so per-agent
frontmatter refines allow/deny on top of `ask`. This section is the canonical
source of truth (SSOT) for delegation — the six primary agents in
`template/obligatorio/packs/main/` carry these blocks. Within each group the
instances are byte-identical; re-verify the spec against the agents when
either side changes.

### Block selection rule

| Agent capability | Block | Agents |
|------------------|-------|--------|
| `permissions` has `subagent: "*": allow` (+ deny-lists) | **A — DELEGATION PROTOCOL** | `huitzilopochtli`, `quetzalcoatl`, `tlaloc`, `mictlantecuhtli`, `tezcatlipoca` |
| `permissions` has `subagent: "*": deny` | **B — SKILL LOADING PROTOCOL** | `moctezuma` |

### Block A — DELEGATION PROTOCOL (delegating agents)

```markdown
### DELEGATION PROTOCOL

Before executing ANY instruction — analyze first, act second:

1. **Understand** the requested outcome, its constraints, and what "done" means.
2. **Map subagents** — which specialists in `agents/` cover this work?
3. **Map skills** — scan `skills/` and select every skill that raises the quality of
   this task. Two or ten: the count is your judgement, the relevance is the rule.
4. **Decide** — delegate or execute yourself (last resort, only when no specialist exists).

Every subagent call (via the `subagent` tool) you send MUST carry these three blocks:

- **Deterministic instructions** — context (why + constraints) plus small, verifiable steps with explicit deliverables: paths, names, formats. Never an open-ended ask.
- **Skills to load** — name the `skills/` the subagent must load, in priority order, with one line of justification each.
- **Goal checklist** — the acceptance rubric you will grade the returned work against, including what counts as rework.

When the subagent returns, grade its output against that checklist. Any unmet item goes
back to the subagent with the specific gap named.
```

Per-role constraints that originally replaced `<HOOK>` in step 4 now live in each
agent's `### RULES` / `## COMPOSITION` sections:

| Agent | Constraint location |
|-------|---------------------|
| `huitzilopochtli` | `### RULES` — last resort: inform the user, you cannot write directly |
| `quetzalcoatl` | `## COMPOSITION` — you only delegate documentation — never code |
| `tlaloc` | `### RULES` — only write directly if no specialized subagent exists |
| `mictlantecuhtli` | `### RULES` — your verdicts are unappealable |

### Block B — SKILL LOADING PROTOCOL (non-delegating agents)

```markdown
### SKILL LOADING PROTOCOL

Before executing ANY instruction — analyze
first, act second:

1. **Understand** the requested outcome, its constraints, and what "done" means.
2. **Map skills** — scan `skills/` and load every skill that raises the quality of this task. The number of skills to load is your judgement, the relevance is the rule.
3. **Define the goal checklist** — the acceptance criteria your own output must satisfy.
4. **Self-review** against that checklist before returning; state any item you could not meet.
```

Non-delegation is enforced by `permissions: subagent "*": deny` in the frontmatter and
the `### RULES` bullet "**NEVER** delegate to subagents" — not by prose in the block.

### Line budget

Primary agent **bodies** must stay ≤100 lines (excluding YAML frontmatter). This is the
enforced invariant (unit test: `tests/unit/domain/agent-frontmatter-validation.test.ts`).
Total file length is frontmatter-dependent — V2 `permissions:` lists push some primaries
past the old ≈150-line total (e.g. `quetzalcoatl.md`) — so no total budget is enforced.
Block A ≈ 18 lines, Block B ≈ 9 lines — both fit within the body budget.
Bullets in the three-block list and Block B step 2 render as single long lines.

---

## 9. Out of Scope

- **Legacy agents** (95 in `sin-clasificar/`) keep their v1.x format — hybrid decision (user, 2026-08-04).
- **Primary agents** (`packs/main/`) keep their format — not converted.
- **Permisos unification** → FEV-19.
- **`VALID_SUBAGENTS` removal** → FEV-20.

---

*End of Spec: Agent Format v2.0*
