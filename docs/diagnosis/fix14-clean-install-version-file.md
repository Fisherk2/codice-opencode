# Diagnosis: .codice-version Not Written After Clean Install

**Issue:** [#79](https://github.com/Fisherk2/codice-opencode/issues/79) — .codice-version no detecta paquetes instalados en clean install
**Date:** 2026-08-19
**Severity:** high
**Status:** diagnosed

---

## Summary

After a Clean Install, the `.codice-version` file is either not created or written with version `"0.0.0"`. This means the Update Workspace mode cannot detect prior installations and falls back to "No Installation Detected", breaking the update cycle entirely.

## Symptoms

- User performs Clean Install → `.codice-version` not present or contains `"version":"0.0.0"`
- Re-running the installer shows "No Installation Detected"
- Update Workspace mode unavailable after Clean Install
- Only Project Install writes correct version data

## Root Cause

`CleanInstallUseCase` calls `runPostInstallSteps()` (in `postInstall.ts`) which does write the version file. However, the `options.version` parameter is `undefined` for Clean/Project installs (the CLI doesn't pass the current Códice version), so `runPostInstallSteps` falls back to `version ?? "0.0.0"`.

The update logic in `updateStatusCheck.ts` then compares `"0.0.0"` against the current version and may classify it as "no installation" or "ancient version", breaking the update detection flow.

**Why does this happen?** → The CLI layer (`src/cli/main.ts`) does not inject the current package version into `BaseInstallOptions.version`. The version constant exists in `src/cli/version.ts` but is not wired into the install use cases.

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All Clean Install users |
| Functionality | Broken — Update mode cannot detect prior clean installs |
| Data integrity | Safe — no data loss, just missing metadata |
| Reproducibility | Always — 100% reproducible |

## Environment

- **Platform:** All (Linux, macOS, Windows)
- **Version:** v2.1.0+
- **Configuration:** `src/application/use-cases/InstallUseCaseBase.ts`, `src/cli/main.ts`

## Proposed Solution

1. **Wire `version` constant into use case options.** In `src/cli/main.ts`, pass `version: VERSION` (from `version.ts`) to both `CleanInstallUseCase.execute()` and `ProjectInstallUseCase.execute()`.
2. **Verify `postInstall.ts` writes correctly.** Confirm the version string flows through `writeVersionFileSafe()` into `.codice-version`.
3. **Add a regression test.** Assert that after Clean Install, `.codice-version` contains the correct version (not `"0.0.0"`).
4. **Handle legacy `"0.0.0"` gracefully.** In `updateStatusCheck.ts`, treat `"0.0.0"` as "unknown version" rather than "no installation".

## Workarounds

> ⚠️ **WORKAROUND**
> Users can manually create `.codice-version` with the correct version and pack list after Clean Install:
> ```json
> { "version": "2.1.0", "installedPacks": ["creative", "science-research"] }
> ```

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-08-19 | #79 | Initial report |

## References

- [Issue #79](https://github.com/Fisherk2/codice-opencode/issues/79)
- `src/application/use-cases/InstallUseCaseBase.ts` (line 170 — `runPostInstallSteps`)
- `src/application/postInstall.ts` (line 147 — `writeVersionFileSafe`)
- `src/cli/main.ts` (missing version passthrough)
- `src/cli/version.ts` (version constant)

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
