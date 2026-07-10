# Diagnosis: GitHub Wiki Implementation for Workspace Documentation

**Issue:** [#25](https://github.com/fisherk2/codice-opencode/issues/25) — _Implementar la Wiki en GitHub_
**Date:** 2026-07-09
**Severity:** medium
**Status:** diagnosed

---

## Summary

The project currently maintains workspace documentation in three places: `docs/opencode/` (project root), `template/opcional/docs/opencode/` (template), and what should be a GitHub Wiki. This creates duplication with what should be a GitHub Wiki, and risks becoming outdated relative to the official OpenCode documentation. The proposal is to migrate this documentation to a GitHub Wiki, remove `docs/opencode/` from both the template and project root, and reference the official OpenCode docs instead.

## Symptoms

- Documentation exists in **three** places: `docs/opencode/` (project root), `template/opcional/docs/opencode/` (template), and what should be the Wiki
- Risk of documentation becoming outdated when OpenCode updates their docs
- Users installing the template get documentation that may not match their OpenCode version
- Maintenance burden of keeping template docs in sync with upstream
- Wiki is not enabled or populated
- 74+ cross-references to `docs/opencode/` across CONTRIBUTING.md, README.md, commands, and source code comments

## Root Cause

The documentation strategy was not clearly defined during initial development. The template included comprehensive workspace documentation to help users, but this creates a maintenance burden and duplication. The proper approach is to use GitHub Wiki for project-specific guidance and reference official OpenCode docs for framework-specific information.

> Why is documentation duplicated? → _The template was designed to be self-contained, but this conflicts with the principle of single source of truth. OpenCode's official docs should be the authoritative source for framework usage._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All workspace users |
| Functionality | Degraded (documentation strategy misalignment) |
| Data integrity | Safe (no data risk) |
| Reproducibility | Always (documentation strategy issue) |

## Environment

- **Platform:** GitHub Wiki, template directory
- **Version:** v1.0.13
- **Configuration:** template/docs/opencode/ structure

## Clarification (2026-07-09)

> **Approach confirmed:** The Wiki will be a **customization guide** based on the actual content of `template/obligatorio/`, NOT a copy of OpenCode's official documentation. The existing `docs/opencode/` files are a reflection of what was being documented — but the Wiki will take a different approach: practical, template-driven, and maintainable.

## Goal

Create a GitHub Wiki that serves as a practical **customization and modification guide** for users who have installed the Códice workspace template. The Wiki should:

1. **Be organized around `template/obligatorio/`** — Each section maps to a real file or directory in the template
2. **Explain what each file does, how it's configured, and how to customize it**
3. **Reference [opencode.ai/docs](https://opencode.ai/docs/)** for official OpenCode documentation (never duplicate it)
4. **Be easier to follow and maintain** than the current `docs/opencode/` structure

## Proposed Wiki Structure

The Wiki is organized around the **physical structure of the installed workspace**, not around abstract concepts. Each page maps to real files the user can see and modify.

### Home (`Home.md`)
- What is this workspace? (one paragraph)
- What problem does it solve?
- Quick links to key pages
- Link to official OpenCode docs: [opencode.ai/docs](https://opencode.ai/docs/)

### Getting Started (`Getting-Started.md`)
- Prerequisites (link to OpenCode installation docs)
- How to install via `bunx @fisherk2-dev/codice`
- What happens after installation (file tree overview)
- First steps: verify commands, run `/spec`
- Reference: [opencode.ai/docs/installation](https://opencode.ai/docs/installation)

### Workspace Structure (`Workspace-Structure.md`)
- Based on the actual tree installed by Códice
- Each directory explained with: purpose, what files it contains, customization options
- **Not a static copy** — explains the **patterns** (why root files vs. agents/ vs. commands/ vs. skills/)
- Reference: [opencode.ai/docs/workspace](https://opencode.ai/docs/workspace)

### Configuration (`Configuration.md`)
- Based on: `template/obligatorio/opencode.json`
- Explain each section: `model`, `small_model`, `compaction`, `provider`, `permissions`
- Common customizations: changing models, adjusting token budgets, adding provider variants
- Example: switching from NVIDIA to Anthropic Claude
- Reference: [opencode.ai/docs/configuration](https://opencode.ai/docs/configuration)

### Agents (`Agents.md`)
- Based on: `template/obligatorio/agents/` (103 files: 6 primary + 97 subagents)
- Explain the two-tier architecture: Primary agents (huitzilopochtli, quetzalcoatl, etc.) vs. Subagents (96+ domain experts)
- Show the pattern of an agent file (frontmatter, composition block)
- **Step-by-step guide: How to add a new agent to your workspace** (end-user focused):
  1. Choose the type: subagent (domain expert) or primary agent (entry point)
  2. Create the agent file in `agents/` with proper frontmatter (role, scope, rules)
  3. Add a `## Composition` block (Invoke directly when / Invoke via / Do not invoke)
  4. For subagents: register in `VALID_SUBAGENTS` in `.opencode/plugins/sdd-pipeline.ts`
  5. For primary agents: add SDD plugin hooks (identity patterns, command mapping, role rules)
  6. Restart OpenCode session
  - Includes a **working example**: creating a custom subagent step by step
  - Reference: [opencode.ai/docs/agents](https://opencode.ai/docs/agents) for frontmatter format

### Commands (`Commands.md`)
- Based on: `template/obligatorio/commands/` (12 files)
- Explain the SDD lifecycle and how each command maps to a phase
- Show the frontmatter pattern (`description` + `agent`)
- **Step-by-step guide: How to add a new command to your workspace** (end-user focused):
  1. Create the command file in `commands/` with YAML frontmatter (`description` + `agent`)
  2. Write the numbered steps: reference skills inline, use `question` tool at decisions, include handoff instructions
  3. Register in `COMMAND_AGENT_MAP` in `.opencode/plugins/sdd-pipeline.ts`
  4. If it introduces a new SDD phase, add phase suggestion in the plugin
  5. Restart OpenCode session
  - Includes a **working example**: creating a custom command step by step
  - Reference: [opencode.ai/docs/commands](https://opencode.ai/docs/commands) for command format

### Skills (`Skills.md`)
- Based on: `template/obligatorio/skills/` (46 directories)
- Explain the skill pattern (SKILL.md with frontmatter + numbered steps)
- **Step-by-step guide: How to add a new skill to your workspace** (end-user focused):
  1. Create `skills/<skill-name>/SKILL.md` (kebab-case directory name)
  2. Add YAML frontmatter with valid `name` and `description`
  3. Write the numbered steps (specific, verifiable, battle-tested, minimal)
  4. If it has a `references/` directory inside, migrate content to root `references/`
  5. Update `skills/using-agent-skills/SKILL.md` to include it in the discovery tree and quick reference table
  6. Restart OpenCode session
  - Includes a **working example**: creating a custom skill step by step
  - Reference: [opencode.ai/docs/skills](https://opencode.ai/docs/skills) for SKILL.md format

### Customization Guide (`Customization-Guide.md`)
- Practical recipes for common modifications:
  - **"I want to use a different AI model"** → Modify `opencode.json` `model` field
  - **"I don't need the architecture-diagrams skill"** → Remove from `skills/` and `skills-lock.json`
  - **"I want to add a custom command"** → Create file in `commands/`, update SDD plugin
  - **"I want to rename my project"** → Update `README.md`, `package.json`, etc.
  - **"I want to change agent permissions"** → Modify `opencode.json` `permissions` section
  - **"I want to add a new provider"** → Add provider config in `opencode.json`
- Each recipe: what to modify, where the file is, what the change does

### Troubleshooting (`Troubleshooting.md`)
- Common issues and solutions
- Based on real user problems encountered during development
- Links to: [opencode.ai/docs/troubleshooting](https://opencode.ai/docs/troubleshooting)

---

## Implementation Steps

1. **Enable GitHub Wiki** — Enable the Wiki feature in repository settings

2. **Write Wiki content** (9 pages following the structure above) — Content is **original**, written specifically for the Wiki, never copied from OpenCode docs. Each page:
   - Explains the relevant files from `template/obligatorio/`
   - Shows how to customize them
   - Links to `opencode.ai/docs` for official API/configuration reference
   - Uses the existing `docs/opencode/USER_GUIDE.md` as inspiration for tone and structure, but rewritten to be simpler and template-content-driven

3. **Remove `docs/opencode/`** from both project root and template:
   - `template/opcional/docs/opencode/` (12 files)
   - `docs/opencode/` (12 files)
   - `FileRuleManifestData.ts` entry (lines 167-171)

4. **Update cross-references** (74+ internal links) to point to the Wiki instead of `docs/opencode/`

5. **Update CONTRIBUTING.md and README.md** — Add Wiki link, document documentation strategy

6. **Test** — Template installation must work without broken links

## Key Principles for Wiki Content

| Principle | What it means |
|-----------|---------------|
| **Template-driven** | Every page starts from a real file in `template/obligatorio/` |
| **Customization-focused** | Explain how to modify, not what OpenCode does |
| **No duplication** | Never copy OpenCode docs — link to them |
| **Maintainable** | Fewer pages, simpler content, easier to update |
| **Progressive disclosure** | Home → Getting Started → detailed pages as needed |

### Audience Distinction

The Wiki and CONTRIBUTING.md serve **different audiences**:

| Document | Audience | Focus | Refs to Códice internals? |
|----------|----------|-------|--------------------------|
| **CONTRIBUTING.md** | Contributors to Códice | How to add agents/skills/commands **to the template** (`template/obligatorio/`, `template/estandar/`, `template/opcional/`) | ✅ Yes (template/ dirs, FileRuleManifest, E2E tests) |
| **GitHub Wiki** | End users of the workspace | How to add agents/skills/commands **to their own project** (after installation) | ❌ No (`agents/`, `commands/`, `skills/`, `.opencode/plugins/`) |

**Key differences:**
- Wiki guides reference the **installed workspace files** (`agents/`, `commands/`, `skills/`), not `template/` directories
- Wiki guides skip Códice-specific steps (FileRuleManifest, template packaging, E2E tests)
- Wiki guides include **working examples** from scratch
- Wiki guides are simpler and focused on end-user goals, not contribution workflow

## Workarounds

> ⚠️ **WORKAROUND**
> Currently, users can refer to template/docs/opencode/ for workspace documentation. However, this may become outdated. Users should also consult the official OpenCode documentation at https://opencode.ai/docs/ for framework-specific information.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-06-27 | FEV-4 documentation updates | Documentation synchronization across multiple files |

_This pattern of documentation duplication has occurred before. Consider establishing a clear documentation strategy for future features._

## References

- [Issue #25](https://github.com/fisherk2/codice-opencode/issues/25)
- [OpenCode Official Documentation](https://opencode.ai/docs/)
- [docs/opencode/](../docs/opencode/) — Project root (12 files, to be removed)
- [template/opcional/docs/opencode/](../template/opcional/docs/opencode/) — Template copy (12 files, to be removed)
- [src/domain/entities/FileRuleManifestData.ts](../src/domain/entities/FileRuleManifestData.ts) — Line 167-171: manifest entry to remove
- [CONTRIBUTING.md](../CONTRIBUTING.md) — 10 references to docs/opencode/
- [README.md](../README.md) — 2 references to docs/opencode/
- [specs/spec-file-rules.md](../specs/spec-file-rules.md) — 2 references to docs/opencode/

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
