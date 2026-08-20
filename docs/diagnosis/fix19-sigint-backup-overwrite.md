# Diagnosis: SIGINT Mid-Commit Backup Overwrite

**ID:** TD-V2-9
**Date:** 2026-08-19
**Severity:** low
**Status:** diagnosed

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

1. **Persist rollback intent.** Write a `.codice-rollback-intent` file before starting the commit. If the file exists on the next run, restore from `.codice-backup` before proceeding.

2. **Make commit atomic at the file level.** Use a two-phase commit: (a) copy all files to a temporary "commit staging" area, (b) rename all files from "commit staging" to destination. If interrupted, the rollback intent file triggers restoration.

3. **Document the limitation.** Add a warning in the installer UX that interrupting mid-commit may compromise backup integrity.

## Workarounds

> ⚠️ **WORKAROUND**
> Do not interrupt the installer during the commit phase. Wait for the progress bar to complete before pressing Ctrl+C.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-08-19 | Initial report | SIGINT mid-commit backup overwrite |

## References

- TD-V2-9 in `docs/TECH_DEBT.md`
- `src/infrastructure/adapters/BunFileSystem/AtomicStager.ts`
- ADR-003 (Atomic File Operations)

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
