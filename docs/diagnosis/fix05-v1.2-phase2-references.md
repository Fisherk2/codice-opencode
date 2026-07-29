# Diagnosis: FEV-12 — References Restructuring (Issues #54, #52)

**Issues:** [#54](https://github.com/fisherk2/codice-opencode/issues/54) — Reubicar ficheros de references/, [#52](https://github.com/fisherk2/codice-opencode/issues/52) — Implementacion de la seccion reference
**Date:** 2026-07-27
**Severity:** medium (template restructuring + configuration enhancement)
**Status:** pending

---

## Summary

Two related changes to how references work in the workspace:
1. **Issue #54:** Move reference files from the centralized `references/` directory back into their respective skill directories (`skills/<skill-name>/references/`).
2. **Issue #52:** Add the `reference` configuration section to `opencode.json` to leverage OpenCode's native reference system.

Both changes address the same underlying problem: references are currently disconnected from the skills that use them, making it hard to understand which reference belongs to which skill.

## Symptoms

### Issue #54 — Centralized references/ directory
- 59 reference files in `template/obligatorio/references/` with no clear mapping to skills
- File names like `architecture.md`, `testing-patterns.md` don't indicate which skill uses them
- Adding new skills requires manually extracting references to the centralized directory
- Approaching 100+ new skills to install — centralized approach becomes unmanageable

### Issue #52 — Missing `reference` section in opencode.json
- OpenCode supports a `reference` configuration section for external references
- The workspace doesn't use this feature
- Users can't configure custom reference directories or Git repositories

## Root Cause

### Issue #54
References were originally extracted from skills to centralize modification in `skills/` and keep reference content separate. However, this created a discoverability problem: there's no metadata linking reference files to their parent skills. As the skill count grows, this separation becomes a maintenance burden.

> Why was this done? → _The original intent was to separate "what the skill teaches" (SKILL.md) from "reference material" (references/). But this created a many-to-many relationship with no index._

### Issue #52
The `reference` section in `opencode.json` is a native OpenCode feature that was never configured in the template. It allows users to specify local directories and Git repositories as reference sources for the AI model.

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All workspace users (improved skill organization, new reference capabilities) |
| Functionality | Enhanced — skills become self-contained, references become configurable |
| Data integrity | Safe (file moves, no deletions) |
| Risk | Low (relocating files within template, adding config section) |

## Environment

- **Version:** v1.1.3
- **Template references:** 59 files in `template/obligatorio/references/`
- **Template skills:** 52 skill directories in `template/obligatorio/skills/`
- **Platform:** Linux, Bun, TypeScript

---

## Proposed Solution — FEV-12

### Scope

1. Relocate all 59 reference files from `references/` to their corresponding skill directories
2. Delete the empty `references/` directory
3. Update `FileRuleManifestData.ts` to remove the `references/` entry
4. Add `reference` section to `opencode.json` with example configuration
5. Update Wiki and CONTRIBUTING.md to reflect new skill structure
6. Update source code and tests that reference the old `references/` path

### Tasks

| ID | Description | File(s) | Effort |
|----|-------------|---------|--------|
| FEV12-T1 | Map each reference file to its corresponding skill | Analysis document | 2h |
| FEV12-T2 | Create `references/` subdirectory in each skill that has references | `template/obligatorio/skills/<name>/references/` | 1h |
| FEV12-T3 | Move reference files to their skill directories | `template/obligatorio/skills/` | 1h |
| FEV12-T4 | Delete empty `template/obligatorio/references/` directory | — | 5min |
| FEV12-T5 | Update `FileRuleManifestData.ts` — remove `references/` entry, add skill-level references | `src/domain/entities/FileRuleManifestData.ts` | 1h |
| FEV12-T6 | Update `directoryWalker.ts` if it has special handling for `references/` | `src/infrastructure/adapters/directoryWalker.ts` | 30min |
| FEV12-T7 | Add `reference` section to `opencode.json` | `template/obligatorio/opencode.json` | 30min |
| FEV12-T8 | Update Wiki Skills.md to reflect new skill structure | `docs/wiki-source/Skills.md` | 30min |
| FEV12-T9 | Update CONTRIBUTING.md — remove reference extraction step from skill installation guide | `CONTRIBUTING.md` | 15min |
| FEV12-T10 | Update tests for new directory structure | `tests/` | 1h |
| FEV12-T11 | Update README.md workspace structure section | `README.md` | 15min |

### Implementation Steps for Issue #54

1. **Scan reference files** — List all 59 files in `template/obligatorio/references/`
2. **Search for skill associations** — For each reference file, search `template/obligatorio/skills/` for mentions of the file name
3. **Build mapping** — Create a mapping table: `reference file → skill directory`
4. **Handle orphans** — For references that don't clearly map to a skill, use content analysis to determine the best match. If truly orphaned, place in the most relevant skill or create a `general-references/` skill
5. **Move files** — Create `references/` subdirectory in each skill, move files
6. **Update manifest** — Remove the `references/` directory entry from `FileRuleManifestData.ts`
7. **Update source code** — Search `src/` for any hardcoded references to the `references/` path
8. **Update tests** — Fix any tests that reference the old path
9. **Verify** — Run `just test` and `just check`

### Implementation Steps for Issue #52

1. **Research OpenCode reference configuration** — Consult [official docs](https://opencode.ai/docs/es/references/)
2. **Add `reference` section to `opencode.json`** — Include:
   - Example local directory reference
   - Example Git repository reference (using `fisherk2/codice-opencode` as example)
3. **Update Wiki Configuration.md** — Document the new `reference` section
4. **Test** — Verify OpenCode loads references correctly

### Example `reference` Section for opencode.json

```json
"reference": {
  "local": {
    "description": "Local directory with project-specific reference material",
    "path": "./references"
  },
  "git": {
    "description": "Git repository for additional context and examples",
    "url": "https://github.com/Fisherk2/codice-opencode",
    "branch": "main"
  }
}
```

### Reference-to-Skill Mapping (Preliminary)

| Reference File | Likely Skill |
|---------------|--------------|
| `architecture.md` | `clean-ddd-hexagonal` or `architecture-diagrams` |
| `testing-patterns.md` | `test-driven-development` |
| `security-checklist.md` | `security-and-hardening` |
| `performance-checklist.md` | `performance-optimization` or `performance-analysis` |
| `clean-code.md` | `clean-code` |
| `code-smells.md` | `code-simplification` or `refactoring-patterns` |
| `design-patterns.md` | `design-patterns` |
| `solid-principles.md` | `solid` |
| `error-handling.md` | `error-handling-patterns` |
| `tdd.md` | `test-driven-development` |
| `DDD-STRATEGIC.md` | `clean-ddd-hexagonal` |
| `DDD-TACTICAL.md` | `clean-ddd-hexagonal` |
| `HEXAGONAL.md` | `clean-ddd-hexagonal` |
| `CQRS-EVENTS.md` | `clean-ddd-hexagonal` |
| ... | (full mapping requires systematic analysis) |

### DoD (Definition of Done)

- [ ] All 59 reference files relocated to skill directories
- [ ] `template/obligatorio/references/` directory deleted
- [ ] `FileRuleManifestData.ts` updated (references/ entry removed)
- [ ] Source code updated (no hardcoded references/ paths)
- [ ] Tests pass with new structure
- [ ] `reference` section added to `opencode.json`
- [ ] Wiki updated (Skills.md, Configuration.md)
- [ ] CONTRIBUTING.md updated (skill installation guide)
- [ ] README.md updated (workspace structure)
- [ ] `bun test`: 0 fail, no regression
- [ ] `just check`: 0 errors

---

## References

- **Issue #54:** https://github.com/fisherk2/codice-opencode/issues/54
- **Issue #52:** https://github.com/fisherk2/codice-opencode/issues/52
- **OpenCode References Docs:** https://opencode.ai/docs/es/references/
- **FileRuleManifestData.ts:** `src/domain/entities/FileRuleManifestData.ts`

---

_Diagnosed by Quetzalcoatl (Visionary Sage) — 2026-07-27_

---

## Results (2026-07-28)

FEV-12 has been implemented. Here are the final results:

### Metrics

| Metric | Value |
|--------|-------|
| Reference files relocated | 59 (57 .md + 2 non-.md) |
| Skills with references/ subdirectories | 18 (15 from mapping + 3 pre-existing) |
| Confidence: HIGH (direct SKILL.md match) | 51 files |
| Confidence: LOW (manual override) | 8 files |
| Entries in `reference` section | 2 (local + remote example) |
| Manifest entries removed | `references` entry (mandatory count: 8→7) |
| SKILL.md paths updated | 49 references across 5 files |
| Tests passing | 593 pass, 0 fail |

### Skills Receiving References

| Skill | Files | Example References |
|-------|-------|-------------------|
| `ui-ux-design-pro` | 13 | typography, color system, spacing, tokens |
| `architecture-diagrams` | 10 | C4, UML, deployment, sequence diagrams |
| `clean-ddd-hexagonal` | 7 | DDD strategic/tactical, hexagonal, CQRS |
| `clean-code` | 6 | naming, functions, formatting, code smells |
| `refactoring-patterns` | 6 | all refactoring-* files |
| `crafting-effective-readmes` | 6 | art-of-readme, standard-readme spec |
| `solid` | 3 | SOLID principles, object design, TDD |
| Others (10 skills) | 1-2 each | |

### Lessons Learned

1. **The 3-level detection algorithm was effective.** 51/59 files (86%) had direct SKILL.md mentions.
2. **Cross-reference analysis confirmed clusters** but did not change any assignments — all 59 files mapped cleanly to one skill.
3. **6 orphan files** (no SKILL.md references) were resolved via manual content analysis. All 6 belonged to `crafting-effective-readmes` (README-related) or `ui-ux-design-pro` (icon-patterns).
4. **2 non-.md files** (`arch-migration-template.sql`, `arch-validate-schema.sh`) were in the references directory and belong to `db-migration`.
5. **3 skills already had pre-existing `references/` subdirectories** (baoyu-format-markdown, baoyu-url-to-markdown, obsidian-markdown) — these were already following the co-located pattern.

---

_Implementado por Tlaloc — 2026-07-28_
