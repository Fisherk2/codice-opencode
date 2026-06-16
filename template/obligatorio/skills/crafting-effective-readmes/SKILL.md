---
name: crafting-effective-readmes
description: Use when writing or improving README files. Not all READMEs are the same — provides templates and guidance matched to your audience and project type.
---

# Crafting Effective READMEs

## Overview

READMEs answer questions your audience will have. Different audiences need different information - a contributor to an OSS project needs different context than future-you opening a config folder.

**Always ask:** Who will read this, and what do they need to know?

## Process

### Step 1: Identify the Task

**Ask:** "What README task are you working on?"

| Task | When |
|------|------|
| **Creating** | New project, no README yet |
| **Adding** | Need to document something new |
| **Updating** | Capabilities changed, content is stale |
| **Reviewing** | Checking if README is still accurate |

### Step 2: Task-Specific Questions

**Creating initial README:**
1. What type of project? (see Project Types below)
2. What problem does this solve in one sentence?
3. What's the quickest path to "it works"?
4. Anything notable to highlight?

**Adding a section:**
1. What needs documenting?
2. Where should it go in the existing structure?
3. Who needs this info most?

**Updating existing content:**
1. What changed?
2. Read current README, identify stale sections
3. Propose specific edits

**Reviewing/refreshing:**
1. Read current README
2. Check against actual project state (package.json, main files, etc.)
3. Flag outdated sections
4. Update "Last reviewed" date if present

### Step 3: Always Ask

After drafting, ask: **"Anything else to highlight or include that I might have missed?"**

## Project Types

| Type | Audience | Key Sections | Template |
|------|----------|--------------|----------|
| **Open Source** | Contributors, users worldwide | Install, Usage, Contributing, License | `templates/oss.md` |
| **Personal** | Future you, portfolio viewers | What it does, Tech stack, Learnings | `templates/personal.md` |
| **Internal** | Teammates, new hires | Setup, Architecture, Runbooks | `templates/internal.md` |
| **Config** | Future you (confused) | What's here, Why, How to extend, Gotchas | `templates/xdg-config.md` |

**Ask the user** if unclear. Don't assume OSS defaults for everything.

## Essential Sections (All Types)

Every README needs at minimum:

1. **Name** - Self-explanatory title
2. **Description** - What + why in 1-2 sentences  
3. **Usage** - How to use it (examples help)

## Common Rationalizations

| Rationalization | Rebuttal |
|---|---|
| “Nobody reads the README anyway” | READMEs are the first thing users and contributors see. A bad README costs adoption. |
| “I’ll write the README after the code is done” | READMEs written after the fact miss context and are rarely accurate. Write as you build. |
| “A single paragraph is enough” | One paragraph works for a config file. Open‑source projects need install, usage, and contribution docs. |
| “README is just for setup instructions” | READMEs also communicate architecture decisions, design intent, and troubleshooting. |
| “Templates are too rigid for my project” | Templates are starting points. Adapt sections to your audience — don’t skip them entirely. |

## Red Flags

- No “Description” section — the reader can’t tell what the project does.
- No “Usage” section — the reader can’t tell how to run it.
- Out‑of‑date install instructions — indicates the README is stale.
- Walls of text with no code examples — readers scan examples first.
- Missing license for open‑source projects — blocks adoption.
- Overly long README with everything in one file — use progressive disclosure (link to deeper docs).

## Verification

After applying this skill, confirm:

1. [ ] The README answers “What does this project do?” within the first paragraph.
2. [ ] The README includes a working **Usage** section with at least one example.
3. [ ] All commands and code blocks are copy‑pasteable and tested.
4. [ ] The audience is identified (OSS / internal / personal / config) and the content matches.
5. [ ] Outdated or stale sections have been updated or flagged.
6. [ ] For OSS projects: contributing guidelines, license, and install instructions are present.

## References

- `section-checklist.md` - Which sections to include by project type
- `style-guide.md` - Common README mistakes and prose guidance
- `using-references.md` - Guide to deeper reference materials
