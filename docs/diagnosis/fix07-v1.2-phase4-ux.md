# Diagnosis: FEV-14 — UX Enhancements (Issues #47, #56)

**Issues:** [#47](https://github.com/fisherk2/codice-opencode/issues/47) — Mejorar UX para la progresion de instalacion, [#56](https://github.com/fisherk2/codice-opencode/issues/56) — Nuevo comando /help
**Date:** 2026-07-27
**Severity:** medium (user experience improvements)
**Status:** pending

---

## Summary

Two user experience enhancements:
1. **Issue #47:** Add a progress bar during workspace installation/update, showing which files are being copied and an estimated time remaining.
2. **Issue #56:** Create a new `/help` command (assigned to Huitzilopochtli) that overrides OpenCode's default `/help` to provide workspace-specific guidance.

Both changes improve the user's first impression and ongoing experience with the workspace.

## Symptoms

### Issue #47 — No installation progress feedback
- When running `bunx @fisherk2-dev/codice`, the user sees a spinner but no indication of:
  - How many files have been copied
  - How many files remain
  - Which file is currently being processed
  - Estimated time remaining
- For large installations (52 skills, 104 agents, 12 commands, 59 references), the process can take 3-5 seconds with no visible progress
- Users may think the process is frozen or hung

### Issue #56 — Default /help is not workspace-aware
- OpenCode's built-in `/help` command lists all available slash commands but doesn't explain:
  - What Códice is
  - How the SDD workflow works
  - Where to find documentation
  - How to get started
- New users see a list of commands (`/spec`, `/plan`, `/build`, etc.) with no context
- Users must be directed to the Wiki or README for onboarding

## Root Cause

### Issue #47
The current installation logic uses `@clack/prompts` spinner (`spinner.start()`) which shows a generic "Installing..." message. The `FileMergeEngine` processes files sequentially but doesn't report progress to the UI layer. There's no callback mechanism between the merge engine and the TUI adapter.

> Why wasn't this done earlier? → _The installer was designed for speed and atomicity. Progress reporting was considered a "nice to have" that was deferred. Now that the workspace is mature, UX polish is a priority._

### Issue #56
The workspace provides 12 slash commands but no built-in onboarding command. Users who install the workspace and run `/help` see OpenCode's default help (which lists commands) but not Códice-specific guidance. The workspace needs a welcome/onboarding command that explains the SDD workflow and directs users to resources.

> Why wasn't this done earlier? → _The assumption was that users would read the README or Wiki before using the workspace. In practice, many users install and immediately start exploring via `/help`._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All users (installation experience, onboarding) |
| Functionality | Enhanced (progress feedback, workspace-specific help) |
| Data integrity | Safe (UI changes only, no data flow changes) |
| Risk | Low (additive changes, no breaking changes) |

## Environment

- **Version:** v1.1.3
- **TUI Framework:** @clack/prompts
- **Commands:** 12 slash commands in `template/obligatorio/commands/`
- **Platform:** Linux, Bun, TypeScript

---

## Proposed Solution — FEV-14

### Scope

1. **Issue #47:** Implement progress bar with file-level feedback during installation
2. **Issue #56:** Create `/help` command assigned to Huitzilopochtli with workspace onboarding flow

### Tasks

| ID | Description | File(s) | Effort |
|----|-------------|---------|--------|
| FEV14-T1 | Add progress callback to `IFileMergeEngine` interface | `src/domain/ports/IFileMergeEngine.ts` | 30min |
| FEV14-T2 | Implement progress reporting in `FileMergeEngine.execute()` | `src/domain/services/FileMergeEngine.ts` | 1h |
| FEV14-T3 | Add progress bar rendering to `ClackPromptsAdapter` | `src/infrastructure/adapters/ClackPromptsAdapter.ts` | 1h |
| FEV14-T4 | Wire progress callback from use cases to TUI adapter | `src/application/use-cases/*.ts` | 1h |
| FEV14-T5 | Test progress bar with various installation sizes | `tests/integration/` | 1h |
| FEV14-T6 | Create `/help` command file | `template/obligatorio/commands/help.md` (new) | 1h |
| FEV14-T7 | Add `/help` to `COMMAND_AGENT_MAP` in sdd-pipeline.ts | `template/obligatorio/.opencode/plugins/sdd-pipeline.ts` | 15min |
| FEV14-T8 | Add `/help` to `INTENT_PATTERNS` in sdd-pipeline.ts | Same file | 15min |
| FEV14-T9 | Update Wiki Commands.md with `/help` documentation | `docs/wiki-source/Commands.md` | 30min |
| FEV14-T10 | Update README.md commands section | `README.md` | 15min |

### Implementation Steps for Issue #47 — Progress Bar

**Design:**

```
┌─────────────────────────────────────────┐
│  Installing workspace...                │
│  ████████████░░░░░░░░  60%              │
│  Current: skills/clean-code/SKILL.md    │
│  Progress: 312/520 files                │
│  Estimated time: ~12s remaining         │
└─────────────────────────────────────────┘
```

**Implementation approach:**

1. **Add progress callback to `IFileMergeEngine`:**
   ```typescript
   interface IFileMergeEngine {
     execute(
       rules: readonly FileRule[],
       onProgress?: (progress: MergeProgress) => void
     ): Promise<Result<void, MergeError>>;
   }
   
   interface MergeProgress {
     currentFile: string;
     filesProcessed: number;
     totalFiles: number;
     percentage: number;
   }
   ```

2. **Emit progress events in `FileMergeEngine.execute()`:**
   - Before staging each file, call `onProgress()` with current state
   - Calculate percentage based on files processed vs total files

3. **Render progress in `ClackPromptsAdapter`:**
   - Use `@clack/prompts` spinner with dynamic message
   - Update spinner message with current file name and progress
   - Example: `spinner.message(\`Installing... (\${percentage}%) — \${currentFile}\`)`

4. **Wire callback in use cases:**
   - `CleanInstallUseCase`, `ProjectInstallUseCase`, `UpdateWorkspaceUseCase` pass progress callback to `FileMergeEngine.execute()`
   - Callback delegates to `IUserPrompt.showProgress()`

5. **Estimate time remaining:**
   - Track average time per file (rolling average)
   - Multiply by remaining files to estimate time
   - Update estimate every 10 files to avoid jitter

### Implementation Steps for Issue #56 — /help Command

**Command file: `template/obligatorio/commands/help.md`**

```markdown
---
description: Welcome to Códice — learn how to use the workspace and get started with SDD
agent: huitzilopochtli
---

## Pre-Flight

1. Greet the user and welcome them to the Códice workspace
2. Provide a brief summary of what Códice is:
   - "Códice is an OpenCode workspace that installs a complete Spec-Driven Development (SDD) workflow into your project"
   - Link to Wiki: https://github.com/fisherk2/codice-opencode/wiki
   - Link to Repository: https://github.com/fisherk2/codice-opencode
   - Contact: dev@fisherk2.com

## Phase 1: Understand User Needs

Use the `question` tool to ask: "What do you need?" with these options:

A) **How to use Códice?** — Explain how to configure Códice and which commands to invoke. Research the Wiki for up-to-date information.

B) **I want a summary of this project's state** — Read project documentation (SPEC.md, docs/, README.md). If documentation doesn't exist, read source code and explain what the project does. Generate a human-readable summary.

C) **What is the next step for this project?** — Read project documentation and generate a step-by-step guide with recommendations. Suggest Códice commands as the primary guide for next steps.

D) **How to install a Skill?** — Research the Wiki (Skills page) and provide a step-by-step guide for installing external skills.

E) **How to install a command?** — Research the Wiki (Commands page) and provide a step-by-step guide for installing custom commands.

F) **How to install a Primary Agent - Subagent?** — Research the Wiki (Agents page) and provide a step-by-step guide for installing additional agents.

## Phase 2: Provide Guidance

Based on the user's selection:

- For option A: Explain the SDD cycle (/spec → /plan → /build → /test → /review → /ship) and recommend starting with /spec for new projects
- For option B: Read project files and generate a summary. If the project is empty or has only placeholders, explain the situation
- For option C: Analyze project state and suggest next commands. For example: "Your project has a SPEC.md but no tasks/ directory. Run /plan to break the spec into tasks."
- For options D, E, F: Fetch the relevant Wiki page and provide step-by-step instructions

## Rules

1. If the Wiki doesn't have sufficient information, use the official OpenCode documentation (https://opencode.ai/docs/) as the source of truth
2. "Project" refers to the user's project where Códice was installed, not the Códice project itself
3. Always provide actionable next steps, not just information

## Suggested Next Step

> Now that you're familiar with Códice, run /spec to define your project, or run /plan if you already have a specification.
```

**Plugin registration:**

Add to `COMMAND_AGENT_MAP`:
```typescript
"/help": "huitzilopochtli"
```

Add to `INTENT_PATTERNS`:
```typescript
"/help": [
  "help", "ayuda", "how to use", "como usar",
  "getting started", "primeros pasos", "welcome",
  "what is codice", "que es codice"
]
```

### DoD (Definition of Done)

- [ ] Progress bar displays during installation (Clean, Project, Update modes)
- [ ] Progress shows: current file, files processed, total files, percentage, estimated time
- [ ] Progress bar updates in real-time (no UI freezes)
- [ ] `/help` command file created with correct frontmatter
- [ ] `/help` assigned to Huitzilopochtli
- [ ] `/help` registered in `COMMAND_AGENT_MAP` and `INTENT_PATTERNS`
- [ ] `/help` provides 6 options via question tool
- [ ] `/help` fetches Wiki content for options D, E, F
- [ ] Wiki Commands.md updated with `/help` documentation
- [ ] README.md updated (commands section)
- [ ] `bun test`: 0 fail, no regression
- [ ] `just check`: 0 errors
- [ ] E2E test for progress bar (optional, low priority)

---

## References

- **Issue #47:** https://github.com/fisherk2/codice-opencode/issues/47
- **Issue #56:** https://github.com/fisherk2/codice-opencode/issues/56
- **@clack/prompts:** https://www.npmjs.com/package/@clack/prompts
- **Wiki:** https://github.com/fisherk2/codice-opencode/wiki

---

_Diagnosed by Quetzalcoatl (Visionary Sage) — 2026-07-27_
