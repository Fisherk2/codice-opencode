# ADR-021: Codemod Parser and Placement

* **Status:** Accepted
* **Date:** 2026-09-21
* **Decision Makers:** Fisherk2
* **Consulted:** Mictlantecuhtli (adversarial review axis), Tezcatlipoca (documentation)
* **Informed:** Technical Writer (doc sync)
* **Traceability:** Fase-2 (349→359 agent files migrated to native V2 `permissions:`), issue #91, `docs/diagnosis/fix29-fase2-tools-key-and-nul-audit.md`, `specs/spec-agent-format-v2.md`

## 1. Context and Problem Statement

Fase-2 migrated 349 → 359 agent files to native V2 `permissions:` lists. In the
process two YAML readers emerged:

1. **The validator** — `tests/unit/domain/helpers/agentFrontmatterValidator.ts`,
   built on the `yaml` package. It parses, validates the V2 schema, and is the
   gate CI runs against every shipped agent file.
2. **The codemod parser** — a hand-rolled line parser in
   `scripts/migrate-v1-to-v2-permissions.ts`, which exists to emit the migrated
   frontmatter verbatim, preserving every original line as `rawLine` with no
   `yaml`-package round trip.

Two readers for one format invites the question: which is normative, which is
a tool, and where should each live? Also pending: the schema constants used by
the validator (`VALID_AGENT_FIELDS`, `VALID_PERMISSION_ACTIONS`, …) may need a
promoted home if external code starts importing them.

## 2. Decision Drivers

* **Byte fidelity** — the codemod must not re-serialize agent files; a `yaml`
  dump would reorder keys, rescale quotes, and destroy formatting in 359 files.
* **Single normative schema** — users and CI must have exactly one authoritative
  definition of the V2 agent schema.
* **No unshipped code** — the coverage gate (`just coverage-check 95`) fails on
  production code without callers; promotion into `src/` requires a real use case.
* **One-shot lifecycle** — the V1→V2 migration is a completed event, not a
  permanent pipeline; tooling for it must not accrete production weight.

## 3. Considered Options

* **Option A:** Validator is normative; codemod parser stays in `scripts/` as
  one-shot tooling with its emit path frozen.
* **Option B:** Hand parser is extended into a full second reader and both live
  in `src/domain/services/`.
* **Option C:** Replace the hand parser with the `yaml` package everywhere,
  accepting re-serialization of shipped agent files.

## 4. Decision Outcome

**Chosen option:** Option A — three interlocking decisions:

### (a) Validate-then-emit priority

The **validator is the normative schema reader** for template files. The hand
parser in `scripts/migrate-v1-to-v2-permissions.ts` exists ONLY for verbatim
byte-preserving emit and MUST NOT be extended (no new field support, no
re-serialization, no general parsing surface). The codemod is one-shot tooling:
retained for reproducibility of the Fase-2 migration, but not promoted into
`src/`.

### (b) Promotion trigger to `src/domain/services/`

The promotion of `ACTION_RENAME`, rule-expansion, and edit-conflict detection
into `src/domain/services/` is conditional, not immediate. The trigger is a
**real use case: external users bringing V1 agent files into the workspace at
install/update time.** Today's coverage gate would otherwise fail on
unshipped code, and speculating the API before that use case exists is debt, not
design. When the trigger fires, open a new ADR covering the promotion.

### (c) Schema constants stay exported in the validator

`VALID_AGENT_FIELDS`, `VALID_PERMISSION_ACTIONS` and related constants remain
exported from `tests/unit/domain/helpers/agentFrontmatterValidator.ts` as the
named schema surface. Verified by grep: **no external importers** of
`VALID_PERMISSION_ACTIONS` exist; the export is symmetry with the other named
constants, not dead API. No move, no re-home.

## 5. Pros and Cons of the Options

### Option A — Validator normative, codemod frozen (chosen)

* ✅ **Pros:** one schema authority; zero re-serialization risk; no unshipped
  production code; one-shot lifecycle honored.
* ⚠️ **Cons:** two parsers coexist — the drift risk is bounded only by the
  validator as the gate and by the frozen hand parser.

### Option B — Dual promoted readers

* ✅ **Pros:** single language for all YAML reading.
* ⚠️ **Cons:** violates the coverage gate; promotes speculative API; two
  normative readers with different fidelity guarantees.
* **Rejected.** No current use case justifies `src/` placement.

### Option C — `yaml` package everywhere

* ✅ **Pros:** one parser, no hand-maintenance.
* ⚠️ **Cons:** re-serializes shipped files (quote style, key order, line
  folding); the entire point of Fase-2 was verbatim preservation.
* **Rejected.** Byte fidelity is a hard requirement.

## 6. Consequences

* ✅ The validator remains the single check CI trusts for agent format.
* ✅ The codemod can be retired without deprecation once no further V1 files
  appear; its `scripts/` placement documents that (see
  `specs/spec-project-structure.md` for the `scripts/` boundary).
* ⚠️ Extending the codemod parser for new formats is a violation of this ADR —
  new format work must route through the validator + a new ADR.
* ⚖️ If the promotion trigger never fires, the codemod eventually retires with
  no `src/` footprint — the intended outcome.

## 7. Related Decisions

* ADR-014 — Agent Pack System (the file population the codemod migrated)
* ADR-020 — SPEC Modularization (spec home of format rules)

## 8. Compliance and Review

* **Success metrics:** validator remains sole schema gate in CI; codemod emits
  byte-identical frontmatter (verbatim golden test); no `src/` imports of
  `scripts/`.
* **Next review date:** 2027-03-21 (6 months) or on promotion trigger.
* **Revisit triggers:** a real V1-file ingestion use case lands at install/update
  time; `VALID_PERMISSION_ACTIONS` gains an external importer; the codemod is
  requested for a second migration wave.

---
*Template based on [MADR v4.0](https://adr.github.io/madr/) and [Nygard's ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).*
