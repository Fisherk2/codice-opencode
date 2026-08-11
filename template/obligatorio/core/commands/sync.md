---
description: Bidirectional git sync with intelligent conflict resolution strategies.
agent: tlaloc
---

## Pre-Flight: Detect Git State

**Delegate** `git-workflow-manager` subagent to:

1. Verify `git` is installed and accessible.
2. Verify the project is a git repository.
3. Verify at least one remote is configured.

If any check fails, **abort** with actionable error message.

## Phase 0: Sync Modes

**Load** `interview-me` skill to let the user confirm the sync mode using `question` tool:

- **A) `full-sync`** — Bidirectional sync. Fetch + pull --rebase + push.
- **B) `incremental-sync`** — Only changes since last sync (tracked in `docs/.codice-sync-state.json`).
- **C) `dry-run`** — Preview changes without applying. No mutations.
- **D) `conflict-resolution`** — Interactive mode. Detect conflicts, ask user strategy.

If the user selects **A** or **B**, use `question` tool to ask the resolution strategy:

- **`NEWER_WINS`** — Latest timestamp wins (file content from newer mtime).
- **`GITHUB_WINS`** — Remote changes take precedence.
- **`LOCAL_WINS`** — Local changes take precedence.
- **`INTELLIGENT_MERGE`** — Contextual field-level merge (best-effort, may require manual review).

## Phase 1: Execute Sync

**Delegate** `git-workflow-master` subagent to execute the chosen sync mode with the selected strategy.

For mode **full-sync**:
1. `git fetch --all --prune`
2. `git status` to check working tree
3. If dirty: stash or commit (ask user)
4. `git pull --rebase` (or `git pull` if rebase fails)
5. Detect conflicts via `git diff --name-only --diff-filter=U`
6. If conflicts: apply selected strategy

For mode **incremental-sync**:
1. Read `docs/.codice-sync-state.json` (if exists) to find the last synced commit (`lastCommit` field)
2. Use `git diff <lastCommit>..HEAD` and `<lastCommit>..origin/main` to detect changes
3. Show preview; apply strategy if approved

For mode **dry-run**:
1. Run all `git fetch` / `git status` / `git diff` commands
2. Show summary of changes that WOULD be applied
3. Exit without mutations

For mode **conflict-resolution**:
1. `git fetch`
2. `git status` + `git diff` to identify conflicts
3. For each conflict: use `question` tool to ask strategy per-file
4. Apply resolutions

**Always show dry-run output** before applying — even in `full-sync` mode, print what will change.

## Phase 2: Review Merge Conflicts

1. **Delegate** `code-reviewer` subagent to run the full test suite to check for regressions and **Load** `code-review-and-quality` skill to review the result. For UI tasks, also verify **Load** `browser-testing-with-devtools` skill
2. Fix any discrepancies found during merge before proceeding and run test after each change.
3. Commit atomic changes with a descriptive message following @skills/git-workflow-and-versioning/SKILL.md conventions.

If agents are stuck or the merge process fails, **Delegate** to `debugger` subagent and follow @skills/debugging-and-error-recovery/SKILL.md to diagnose and fix issues. If the debugger can't resolve the issue, **Delegate** to `error-detective` subagent and **Load** `observability-and-instrumentation` skill to identify the root cause and implement a fix with appropriate subagents. If conflict resolution fails mid-way, leave git in a recoverable state.

**Never `git push --force`** to shared branches. Only force-push to feature branches.

## Phase 3: Post-Sync Report

Generate entry report to `docs/.codice-sync-history.md`:
- **Conflicts detected:** N files
- **Strategy applied:** [NAME]
- **Files changed:** N
- **Push status:** success / skipped
- **Time elapsed:** Xs

Sync state updated in `docs/.codice-sync-state.json` (mode **incremental-sync** only):

```json
{
  "lastSync": "2026-08-07T10:00:00.000Z",
  "lastCommit": "<sha>",
  "mode": "incremental-sync",
  "strategy": "INTELLIGENT_MERGE"
}
```

## Suggested Next Step

> Sync complete. Run `/diagnosis` if conflicts revealed underlying issues and `/plan` to create a fixing plan.
