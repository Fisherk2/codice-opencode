# ADR-012: References Co-location

**Status:** Accepted

**Date:** 2026-07-28

**Author:** Fisherk2

## Context

The Códice workspace template originally stored all reference documents in a centralized `template/obligatorio/references/` directory. This design had several problems:

1. **No discoverability:** 59 files with no metadata linking them to their parent skills. A file like `architecture.md` could belong to `architecture-diagrams`, `clean-ddd-hexagonal`, or any of 16 skills that reference it.
2. **Broken skill encapsulation:** Skills in `skills/<name>/` referenced files in `../../references/` — creating a cross-layer dependency that violated the principle of self-contained skills.
3. **Scaling failure:** The upcoming addition of 100+ new skills would make the centralized directory unmanageable — 100+ reference files with no organizational structure.
4. **OpenCode support:** OpenCode 1.x+ supports a native `reference` section in `opencode.json` that can serve local directories as reference material, but the template did not use this feature.

Issue [#54](https://github.com/fisherk2/codice-opencode/issues/54) proposed moving references into skill directories. Issue [#52](https://github.com/fisherk2/codice-opencode/issues/52) proposed implementing the `reference` configuration section.

## Decision

We will co-locate reference files with their primary skill and expose them via OpenCode's native `reference` section:

1. **Each reference file moves to `skills/<primary-skill>/references/<file>`** — determined by a 3-level analysis algorithm (SKILL.md mention, cross-reference clustering, content analysis).
2. **No reference files are deleted.** All 59 files are preserved and relocated.
3. **A `reference` section is added to `opencode.json`** with one entry per skill that has a `references/` subdirectory.
4. **The centralized `references/` directory is removed** from the template structure and from `FileRuleManifestData.ts`.

### Algorithm for Determining Primary Skill

| Level | Method | Confidence |
|-------|--------|------------|
| 1 | Direct filename mention in `skills/<name>/SKILL.md` | HIGH |
| 2 | Cross-referenced by other reference files with known mappings | MEDIUM |
| 3 | Content-based keyword matching + manual overrides | LOW |

## Consequences

### Positive

- **Self-contained skills:** Each skill directory contains its knowledge (`SKILL.md`) and supporting reference material (`references/`). Installing a skill installs everything needed.
- **Discoverability:** The mapping of 59 files → 18 skills is documented in `docs/diagnosis/fix05-mapping-table.md`.
- **Scalability:** Adding 100+ new skills is feasible because each skill's references stay in its own directory.
- **OpenCode integration:** The `reference` section makes references accessible via `@<skill-name>` in the OpenCode TUI, eliminating the need for manual `read()` calls in SKILL.md files.
- **Preserved history:** `git mv` preserves the revision history of all 59 files via `git log --follow`.

### Negative

- **Cross-skill references:** If skill A's SKILL.md references a file that now lives in skill B's `references/`, the relative path in SKILL.md must be updated. This was done for 49 references across 5 SKILL.md files. Future cross-skill references will need `../<other-skill>/references/<file>` paths.
- **Backwards incompatibility:** Users who relied on the centralized `references/` directory (e.g., custom scripts that read from it) must update their scripts. This is documented in the CHANGELOG.
- **Slightly more complex paths:** Instead of `../../references/<file>.md`, references are at `./references/<file>.md` (same skill) or `../<other>/references/<file>.md` (cross-skill).

### Neutral

- 3 skills (`baoyu-format-markdown`, `baoyu-url-to-markdown`, `obsidian-markdown`) already had pre-existing `references/` subdirectories, confirming the pattern was already emerging organically.

## Alternatives Considered

### 1. Keep centralized with an index file

A single `references/INDEX.md` mapping each file to its skills. Rejected because it does not solve the scaling problem — 100+ files in a flat directory with a single index is still unmanageable.

### 2. Group by domain (carpetas por tema)

Group references by domain (e.g., `references/architecture/`, `references/testing/`). Rejected because it still creates a separate directory hierarchy that does not map to skills directly.

### 3. Virtual manifest (noTemplateCopy for all references)

Remove references from the file system entirely and generate them post-installation. Rejected because it adds complexity and breaks the principle that templates are self-contained.

### 4. Co-location (chosen)

Each skill contains its own references. This is the simplest, most maintainable approach and aligns with OpenCode's `reference` feature.

## References

- Issue [#54](https://github.com/fisherk2/codice-opencode/issues/54) — Reubicar ficheros de references/
- Issue [#52](https://github.com/fisherk2/codice-opencode/issues/52) — Implementación de la sección reference
- [fix05-v1.2-phase2-references.md](../diagnosis/fix05-v1.2-phase2-references.md) — Diagnosis document
- [fix05-mapping-table.md](../diagnosis/fix05-mapping-table.md) — Complete 59-file mapping table
- [OpenCode References Docs](https://opencode.ai/docs/references/) — Official OpenCode reference configuration
