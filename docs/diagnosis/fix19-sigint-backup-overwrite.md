# Diagnosis: SIGINT Mid-Commit Backup Overwrite

**ID:** TD-V2-9
**Date:** 2026-08-19
**Severity:** low
**Status:** resolved (FEV-27)

---

## Summary

`AtomicStager.commitStaging()` overwrites `.codice-backup` originals if interrupted mid-commit. The next run's backups hold the mixed state, losing true pre-interrupt originals. This is deliberate and documented, but could be improved by persisting rollback intent across runs.

## Symptoms

- User runs Códice installer
- Installer begins committing files from staging to destination
- User presses Ctrl+C (SIGINT) mid-commit
- Some files are committed, others are not
- `.codice-backup` contains the mixed state (some original files, some partially-committed files)
- Next run's backup overwrites the true originals with the mixed state

## Root Cause

`AtomicStager.commitStaging()` iterates through files and renames them from staging to destination. If interrupted, the backup directory (`.codice-backup`) has already been populated with the original files, but the commit is incomplete. The next run sees the partial state and backs it up, losing the true originals.

**Why does this happen?** → The backup is created before the commit starts, but the commit is not atomic at the file level. SIGINT can interrupt the commit loop, leaving a partial state.

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | Users who interrupt the installer mid-commit |
| Functionality | Degraded — backup integrity compromised |
| Data integrity | At risk — true originals lost after next run |
| Reproducibility | Intermittent — requires SIGINT during commit |

## Environment

- **Platform:** All
- **Version:** v2.0.0+
- **Configuration:** `AtomicStager` in `src/infrastructure/adapters/BunFileSystem/`

## Proposed Solution

1. **`.codice-backup-intent` marker file** — Before starting the commit loop, `AtomicStager.commitStaging()` writes a `.codice-backup-intent` file containing the ISO timestamp of the commit start. On successful commit, the marker is removed. If interrupted, the marker persists.

2. **Fail-fast detection** — On the next run, `commitStaging()` checks for an orphan `.codice-backup-intent` file. If found, it throws an actionable error: *"Previous commit was interrupted (intent recorded at ...). Inspect .codice-backup manually before retrying. Remove .codice-backup-intent to force a retry."*

3. **Preservation on failure** — The intent marker is intentionally NOT removed when `commitStaging()` fails (rollback restores originals). This preserves the diagnostic information for the user.

**Implementation:** `BACKUP_INTENT_FILE` constant in `constants.ts`, imported by `AtomicStager.ts`. Two integration tests verify: (a) successful commit cleans up marker, (b) orphan marker causes error with clear message.

## Workarounds (resolved in FEV-27)

> ✅ **RESOLVED**
> The `.codice-backup-intent` marker file now prevents backup overwrite across interrupted commits. Users who interrupted mid-commit will see an actionable error on next run with instructions to inspect backups manually.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-08-19 | Initial report | SIGINT mid-commit backup overwrite |
| 2026-08-20 | Resolved in FEV-27 | `.codice-backup-intent` marker prevents overwrite |

## References

- TD-V2-9 in `docs/TECH_DEBT.md`
- `src/infrastructure/adapters/BunFileSystem/AtomicStager.ts`
- ADR-003 (Atomic File Operations)

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
