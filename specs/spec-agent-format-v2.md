# Agent Format v2.0 — FEV-18 Specification

**Spec ID:** S5-PACKS §3 (format standardization)
**Date:** 2026-08-04
**Author:** Moctezuma (Strategic Planner)
**Status:** Approved (FEV-18 Phase 1)

---

## 1. Purpose

FEV-18 migrates 267 new agents from external sources into pack directories.
These source files use a minimalist frontmatter that is incompatible with the
Códice workspace standard. This spec defines the **target v2.0 format** and the
conversion rules applied by `scripts/reformat-agent.ts`.

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

## 3. Target Format (v2.0 — Códice standard)

```yaml
---
description: "AI Engineer — Expert AI/ML engineer specializing in model development..."
mode: subagent
temperature: 0.1
color: "#dcb03b"
hidden: true
permission:
  write: allow
  edit: allow
  bash:
    "*": ask
  grep: allow
  glob: allow
  lsp: allow
  skill: allow
  todowrite: allow
  webfetch: allow
  websearch: allow
  question: allow
---

# AI Engineer

<body content — preserved from source>

## COMPOSITION

- **Invoke directly when:** <purpose snippet>
- **Invoke via:** Primary agents (via task delegation)
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
| — | `temperature` | Always `0.1` |
| — | `hidden` | Always `true` |
| — | `permission` | Fixed standard subagent permission block |

### Permission block (canonical)

```yaml
permission:
  write: allow
  edit: allow
  bash:
    "*": ask
  grep: allow
  glob: allow
  lsp: allow
  skill: allow
  todowrite: allow
  webfetch: allow
  websearch: allow
  question: allow
```

**Rationale:** Subagents may write/edit files (unlike primaries), require
confirmation for bash, and have access to read/query/skill tools. This matches
the existing convention in `template/obligatorio/packs/sin-clasificar/*.md`.

## 4. COMPOSITION Block

The `## COMPOSITION` block is appended to every converted agent. It follows the
existing convention found in primary agents (`template/obligatorio/packs/main/tlaloc.md`)
and legacy subagents (`template/obligatorio/packs/sin-clasificar/typescript-pro.md`).

### Template (subagent)

```markdown
## COMPOSITION

- **Invoke directly when:** <first sentence of description, ≤120 chars>
- **Invoke via:** Primary agents (via task delegation)
- **Do not invoke from:** Another persona without a specific task requiring this specialization.
```

### Content rules

- `Invoke directly when` = first sentence of the source description (truncated to 120 chars).
- `Invoke via` = always "Primary agents (via task delegation)" for subagents.
- `Do not invoke from` = standard guard text.
- The block must appear AFTER the body content (last section of the file).

## 5. Body Transformation Rules

1. **Remove** the source H1 if it duplicates the generated title:
   - `# AI Engineer Agent` → removed (replaced by generated `# AI Engineer`)
   - Pattern: `^# <name> (Agent|Specialist|Expert)$`
2. **Preserve** all other body content verbatim.
3. **Do not** convert emoji headers (`## 🧠 Your Identity`) — they are body content.

## 6. Idempotency Guarantees

`scripts/reformat-agent.ts` must produce identical output when run twice:

- Running on a source file always generates fresh v2.0 content (deterministic).
- Running on an **already-converted** file is not supported (source and
  target are in different directories, so re-conversion never happens on the same file).
- The test suite verifies: converting the same source to two targets yields
  identical content, and re-writing the same target does not duplicate the
  `## COMPOSITION` block.

## 7. Reference Implementations

| File | Role |
|------|------|
| `scripts/reformat-agent.ts` | Conversion module (`reformatAgent(source, target)`) |
| `scripts/reformat-agent-cli.ts` | CLI wrapper (`bun run scripts/reformat-agent-cli.ts <src> <dst> [--dry-run]`) |
| `tests/unit/scripts/reformat-agent.test.ts` | 10 test cases (RED→GREEN verified) |
| `template/obligatorio/packs/main/huitzilopochtli.md` | Primary agent reference |
| `template/obligatorio/packs/sin-clasificar/backend-developer.md` | Legacy subagent reference |

## 8. Delegation Protocol

Primary agents delegate implicitly today: their RULES say "always delegate via
`task()`" but there is no contract for how. This section is the canonical
source of truth (SSOT) for delegation — the six primary agents in
`template/obligatorio/packs/main/` are instances of these blocks.

### Block selection rule

| Agent capability | Block | Agents |
|------------------|-------|--------|
| `permission.task` contains `allow` entries | **A — DELEGATION PROTOCOL** | `huitzilopochtli`, `quetzalcoatl`, `tlaloc`, `mictlantecuhtli` |
| `permission.task` is `"*": deny` | **B — SKILL ANALYSIS PROTOCOL** | `moctezuma`, `tezcatlipoca` |

### Block A — DELEGATION PROTOCOL (delegating agents)

```markdown
## DELEGATION PROTOCOL

Before executing ANY instruction — analyze first, act second:

1. **Understand** the requested outcome, its constraints, and what "done" means.
2. **Map subagents** — which specialists in `agents/` cover this work?
3. **Map skills** — scan `skills/` and select every skill that raises the quality of
   this task. Two or ten: the count is your judgement, the relevance is the rule.
4. **Decide** — delegate (default) or execute yourself (last resort, only when no
   specialist exists). <HOOK>

Every `task()` you send MUST carry these three blocks:

- **Deterministic instructions** — context (why + constraints) plus small, verifiable
  steps with explicit deliverables: paths, names, formats. Never an open-ended ask.
- **Skills to load** — name the `skills/` the subagent must load, in priority order,
  with one line of justification each.
- **Goal checklist** — the acceptance rubric you will grade the returned work against,
  including what counts as rework.

When the subagent returns, grade its output against that checklist. Any unmet item goes
back to the subagent with the specific gap named — you do not silently fix it yourself.
```

The `<HOOK>` placeholder is replaced per role by the agent file:

| Agent | Hook (replaces `<HOOK>` in step 4) |
|-------|-------------------------------------|
| `huitzilopochtli` | You never execute: if no specialist exists, report it and stop. |
| `quetzalcoatl` | You delegate documentation only — never code, never tasks. |
| `tlaloc` | Execute directly only when no specialist in `agents/` covers the stack. |
| `mictlantecuhtli` | Delegate the audit, retain the verdict — the ruling is never delegated. |

### Block B — SKILL ANALYSIS PROTOCOL (non-delegating agents)

```markdown
## SKILL ANALYSIS PROTOCOL

You do not delegate (`task` is denied). Before executing ANY instruction — analyze
first, act second:

1. **Understand** the requested outcome, its constraints, and what "done" means.
2. **Map skills** — scan `skills/` and load every skill that raises the quality of this
   task. Two or ten: the count is your judgement, the relevance is the rule.
3. **Define the goal checklist** — the acceptance criteria your own output must satisfy.
4. **Self-review** against that checklist before returning; state any item you could not meet.

If the work needs a specialist or write access you do not hold, name the agent or command
that should take it instead of improvising.
```

### Line budget

Primary agent bodies must stay ≤100 lines (excluding YAML frontmatter) and ≤150 lines
total. Block A ≈ 20 lines, Block B ≈ 12 lines — both fit within the existing budgets.

---

## 9. Out of Scope

- **Legacy agents** (95 in `sin-clasificar/`) keep their v1.x format — hybrid decision (user, 2026-08-04).
- **Primary agents** (`packs/main/`) keep their format — not converted.
- **Permisos unification** → FEV-19.
- **`VALID_SUBAGENTS` removal** → FEV-20.

---

*End of Spec: Agent Format v2.0*
