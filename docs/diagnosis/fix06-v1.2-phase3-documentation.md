# Diagnosis: FEV-13 — Documentation Overhaul (Issues #51, #53)

**Issues:** [#51](https://github.com/fisherk2/codice-opencode/issues/51) — Optimizar y reducir lineas de documentacion, [#53](https://github.com/fisherk2/codice-opencode/issues/53) — Corregir la Wiki
**Date:** 2026-07-27
**Severity:** medium (documentation quality and accuracy)
**Status:** pending

---

## Summary

Two related documentation improvements:
1. **Issue #51:** Refactor and simplify all project documentation exceeding 500 lines, removing obsolete entries while preserving error history.
2. **Issue #53:** Correct the Wiki — it currently contains guides for maintainers/contributors when it should be written for end users.

Both issues address documentation quality: one focuses on size/complexity reduction, the other on audience alignment.

## Symptoms

### Issue #51 — Bloated documentation
- Multiple documents exceed 500 lines (WORKFLOW.md: 700+ lines, CHANGELOG.md: 383 lines, SPEC.md: 459 lines)
- Historical implementation details mixed with current state
- Obsolete entries from early development phases still present
- Difficult for new contributors to find relevant information
- Note: README.md and CONTRIBUTING.md are well-documented and excluded from this refactor

### Issue #53 — Wiki audience mismatch
- Wiki pages reference internal project files (`src/`, `tests/`, `template/`) that end users don't have access to
- Guides assume the reader is a maintainer modifying the Códice project itself
- End users need guides for customizing their own workspace, not contributing to Códice
- Example: Wiki says "update `FileRuleManifestData.ts`" — end users don't have this file

## Root Cause

### Issue #51
Documentation grew organically as the project evolved through 10+ FEV phases. Each phase added entries to WORKFLOW.md, CHANGELOG.md, and other documents. No systematic cleanup was performed, leading to accumulation of historical context that's no longer actionable.

> Why wasn't this done earlier? → _Each FEV phase prioritized functional fixes and features over documentation cleanup. The "500+ lines" threshold was never enforced._

### Issue #53
The Wiki was created by migrating content from `docs/opencode/` (FEV-5), which was written for project maintainers. The migration didn't adapt the content for the Wiki's actual audience: end users who installed the workspace and want to customize it.

> Why wasn't this caught? → _The Wiki was created as part of Issue #25 (GitHub Wiki implementation). The audience distinction wasn't explicitly addressed during migration._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All users (contributors via #51, end users via #53) |
| Functionality | No change (documentation only) |
| Data integrity | Safe (no code changes) |
| Risk | Low (documentation edits, reversible) |

## Environment

- **Version:** v1.1.3
- **Documents >500 lines:** WORKFLOW.md (~700), CHANGELOG.md (383), SPEC.md (459)
- **Excluded from refactor:** README.md (319 lines), CONTRIBUTING.md (209 lines) — well-documented
- **Wiki pages:** 12 pages in `docs/wiki-source/`
- **Platform:** GitHub Wiki, Markdown

---

## Proposed Solution — FEV-13

### Scope

1. **Issue #51:** Reduce all documents >500 lines to <500 lines by removing obsolete content while preserving error/fix history
2. **Issue #53:** Rewrite Wiki pages for end users (workspace customizers), not maintainers (Códice contributors)

### Tasks

| ID | Description | File(s) | Effort |
|----|-------------|---------|--------|
| FEV13-T1 | Audit WORKFLOW.md — remove completed phase details, keep only current state | `docs/WORKFLOW.md` | 2h |
| FEV13-T2 | Audit CHANGELOG.md — consolidate old entries, keep detailed history for v1.0+ | `CHANGELOG.md` | 1h |
| FEV13-T3 | Audit SPEC.md — remove implemented requirements, keep only active spec | `SPEC.md` | 1h |
| FEV13-T4 | Rewrite Wiki Home.md for end users | `docs/wiki-source/Home.md` | 1h |
| FEV13-T5 | Rewrite Wiki Getting-Started.md — remove maintainer references | `docs/wiki-source/Getting-Started.md` | 1h |
| FEV13-T6 | Rewrite Wiki Workspace-Structure.md — focus on user-customizable files | `docs/wiki-source/Workspace-Structure.md` | 1h |
| FEV13-T7 | Rewrite Wiki Configuration.md — remove internal references | `docs/wiki-source/Configuration.md` | 1h |
| FEV13-T8 | Rewrite Wiki Agents.md — focus on how users can add agents to their workspace | `docs/wiki-source/Agents.md` | 1h |
| FEV13-T9 | Rewrite Wiki Commands.md — focus on how users can add commands | `docs/wiki-source/Commands.md` | 1h |
| FEV13-T10 | Rewrite Wiki Skills.md — focus on how users can add skills | `docs/wiki-source/Skills.md` | 1h |
| FEV13-T11 | Rewrite Wiki Customization-Guide.md — ensure all guides are user-facing | `docs/wiki-source/Customization-Guide.md` | 1h |
| FEV13-T12 | Sync Wiki to GitHub remote | `docs/wiki-source/.wiki/` | 30min |

### Implementation Steps for Issue #51

**Principle:** Preserve error history (what went wrong and how it was fixed), remove implementation details (how the fix was coded).

1. **WORKFLOW.md** — Current: 700+ lines with all FEV phases detailed
   - **Keep:** Phase summary table, current phase status, metrics
   - **Remove:** Detailed task breakdowns for completed phases (FEV-1 through FEV-10)
   - **Move to:** Git history (already there via commits)
   - **Target:** <300 lines

2. **CHANGELOG.md** — Current: 383 lines with all versions detailed
   - **Keep:** All entries (this is the error/fix history we want to preserve)
   - **Optimize:** Consolidate pre-v1.0 entries into a single "Early Development" section
   - **Target:** <350 lines

3. **SPEC.md** — Current: 459 lines
   - **Keep:** Current specification (objectives, tech stack, commands, structure, boundaries, success criteria)
   - **Remove:** Resolved decisions that are now implemented (move to ADRs)
   - **Target:** <400 lines

4. **Excluded documents** — README.md and CONTRIBUTING.md are well-documented and do not require refactoring

### Implementation Steps for Issue #53

**Principle:** Wiki is for end users who installed the workspace and want to customize it. Not for contributors modifying Códice itself.

**Audience shift:**
- ❌ Before: "To add a new agent to the template, update `FileRuleManifestData.ts`"
- ✅ After: "To add a new agent to your workspace, create `agents/my-agent.md` with this structure..."

**Pages to rewrite:**

1. **Home.md** — Remove references to `src/`, `tests/`, `template/`. Focus on what Códice provides and how to use it.

2. **Getting-Started.md** — Remove maintainer setup (no `just setup`, no `bun test`). Focus on: install → configure models → run first command.

3. **Workspace-Structure.md** — Remove `src/`, `tests/`, `dist/`. Focus on user-facing directories: `agents/`, `commands/`, `skills/`, `docs/`, `specs/`.

4. **Configuration.md** — Remove internal references. Focus on `opencode.json` sections that users customize: `model`, `agent`, `permissions`, `mcp`.

5. **Agents.md** — Remove "How to Add a New Subagent" steps that reference `VALID_SUBAGENTS` in `sdd-pipeline.ts`. Replace with: "Create `agents/my-agent.md` with this frontmatter..."

6. **Commands.md** — Remove "How to Add a New Command" steps that reference `COMMAND_AGENT_MAP` in `sdd-pipeline.ts`. Replace with: "Create `commands/my-command.md` with this frontmatter..."

7. **Skills.md** — Remove references to `skills/using-agent-skills/SKILL.md` discovery tree maintenance. Replace with: "Create `skills/my-skill/SKILL.md` with this frontmatter..."

8. **Customization-Guide.md** — Ensure all recipes are user-facing (no references to Códice source code).

### Tech Debt Note

Issue #53 also requests adding a tech debt item about reducing coupling between the SDD plugin and documentation when adding commands/agents/skills. This will be added to TECH_DEBT.md after FEV-13 is complete.

### DoD (Definition of Done)

- [ ] WORKFLOW.md < 300 lines (completed phase details removed)
- [ ] CHANGELOG.md < 350 lines (pre-v1.0 entries consolidated)
- [ ] SPEC.md < 400 lines (resolved decisions moved to ADRs)
- [ ] All Wiki pages rewritten for end users (no references to `src/`, `tests/`, `template/`)
- [ ] Wiki synced to GitHub remote
- [ ] All internal links verified (no broken references)
- [ ] `bun test`: 0 fail, no regression (documentation changes shouldn't affect tests)
- [ ] `just check`: 0 errors

---

## References

- **Issue #51:** https://github.com/fisherk2/codice-opencode/issues/51
- **Issue #53:** https://github.com/fisherk2/codice-opencode/issues/53
- **Wiki Source:** `docs/wiki-source/`
- **Wiki Remote:** https://github.com/fisherk2/codice-opencode/wiki

---

_Diagnosed by Quetzalcoatl (Visionary Sage) — 2026-07-27_
