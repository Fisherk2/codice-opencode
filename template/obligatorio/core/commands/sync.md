---
description: Bidirectional git sync with intelligent conflict resolution (4 modes, 4 strategies)
agent: tlaloc
---

## Pre-Flight: Detect Git State

1. Verify `git` is installed and accessible.
2. Verify the project is a git repository (`.git/` exists).
3. Verify at least one remote is configured.
4. If any check fails, abort with actionable error message.

Use the `question` tool to let the user confirm the sync mode:

### Sync Modes (user selects ONE)

- **A) `full-sync`** — Bidirectional sync. Fetch + pull --rebase + push.
- **B) `incremental-sync`** — Only changes since last sync (tracked in `docs/.codice-sync-state.json`).
- **C) `dry-run`** — Preview changes without applying. No mutations.
- **D) `conflict-resolution`** — Interactive mode. Detect conflicts, ask user strategy.

If the user selects **A** or **B**, ask the resolution strategy (4 options).

## Phase 1: Resolution Strategy (only for modes A/B)

Use `question` tool:

- **`NEWER_WINS`** — Latest timestamp wins (file content from newer mtime).
- **`GITHUB_WINS`** — Remote changes take precedence.
- **`LOCAL_WINS`** — Local changes take precedence.
- **`INTELLIGENT_MERGE`** — Contextual field-level merge (best-effort, may require manual review).

## Phase 2: Execute Sync

For mode A:
1. `git fetch --all --prune`
2. `git status` to check working tree
3. If dirty: stash or commit (ask user)
4. `git pull --rebase` (or `git pull` if rebase fails)
5. Detect conflicts via `git diff --name-only --diff-filter=U`
6. If conflicts: apply selected strategy
7. `git push` (only if ahead)

For mode B:
1. Read `docs/.codice-sync-state.json` to find the last synced commit (`lastCommit` field)
2. Use `git diff <lastCommit>..HEAD` and `<lastCommit>..origin/main` to detect changes
3. Show preview; apply strategy if approved

For mode C (dry-run):
1. Run all `git fetch` / `git status` / `git diff` commands
2. Show summary of changes that WOULD be applied
3. Exit without mutations

For mode D (conflict-resolution):
1. `git fetch`
2. `git status` + `git diff` to identify conflicts
3. For each conflict: use `question` tool to ask strategy per-file
4. Apply resolutions
5. `git add` resolved files
6. Optional: commit and push

## Phase 3: Post-Sync Report

Generate report:
- **Conflicts detected:** N files
- **Strategy applied:** [NAME]
- **Files changed:** N
- **Push status:** success / skipped
- **Time elapsed:** Xs
- **Sync state updated:** `docs/.codice-sync-state.json` (mode B only)

## Phase 4: State Persistence (mode B only)

Update `docs/.codice-sync-state.json`:
```json
{
  "lastSync": "2026-08-07T10:00:00.000Z",
  "lastCommit": "<sha>",
  "mode": "incremental-sync",
  "strategy": "INTELLIGENT_MERGE"
}
```

> **TODO (FEV-25+):** Full sync history / audit trail (spec item 5) — append each sync
> entry to `docs/.codice-sync-history.md` (timestamp, mode, strategy, files changed,
> conflicts resolved) so past syncs remain inspectable instead of being overwritten.

## Rules

1. **Always pre-flight check first** — never run git commands on a non-git project.
2. **Never `git push --force`** to shared branches. Only force-push to feature branches.
3. **Atomic state updates** — if conflict resolution fails mid-way, leave git in a recoverable state.
4. **Always show dry-run output** before applying — even in `full-sync` mode, print what will change.
5. **Log all operations** if user passes `--verbose` flag (delegated to tlaloc's verbose logger).
6. **Back up uncommitted changes** before sync (stash or commit, ask user).

## Skills Used

- `@skills/git-workflow-and-versioning/SKILL.md` — for safe git operations
- `@skills/interview-me/SKILL.md` — for asking clarifying questions about conflict resolution
- `@skills/observability-and-instrumentation/SKILL.md` — for sync state tracking

## Suggested Next Step

> Sync complete. Run `/diagnosis` if conflicts revealed underlying issues, `/analyze` to refresh TECH_DEBT.md, or `/plan` to address new tasks surfaced.
