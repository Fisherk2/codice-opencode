# Diagnosis: SDD Plugin Incompatible with Opencode V2 — Full Removal

**ID:** FEV-30 (issue #90 — deferred from v2.1.3 hotfix scope)
**Date:** 2026-09-19
**Severity:** high
**Status:** diagnosed

---

## Summary

Deployment of the SDD plugin (`sdd-pipeline.ts`) to Opencode V2 hosts fails on every startup with "Plugin must export a default definition with an id and an effect or setup function". After fix15 the plugin was reduced to destructive-command blocking only (~13 modules removed), so its residual value does not justify a V1→V2 plugin API migration. Decision: **remove the plugin from the project by decision of the maintainer** and add deprecation warnings: versions ≤ 2.1.2 are Opencode-Legacy-only; target version > 2.1.3 will support Opencode V2.

## Symptoms

- Every Opencode V2 startup prints plugin error and disables it
- Destructive-command blocking is non-functional in V2 installs

## Root Cause

V1 plugin API (export shape used by `sdd-pipeline.ts`) is not accepted by the V2 plugin runtime.

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All V2 users with plugin deployed |
| Functionality | Safe-guard hook lost; plugin code is dead weight |
| Data integrity | Hardening reduced — mitigate elsewhere if needed |
| Reproducibility | Always under Opencode V2 |

## Environment

- **Platform:** Any; **Opencode:** V2 host; **Códice:** ≤ 2.1.2 installs

## Proposed Solution

1. **Removal (template + repo):**
   - Delete `template/obligatorio/core/.opencode/plugins/` (`sdd-pipeline.ts`, `package.json`, `README.md`).
   - Delete repo dev copy `.opencode/plugins/` (src modules, `__tests__`).
   - Remove plugin test suites: `tests/plugin/` (integration/e2e), `tests/types/opencode-plugin.d.ts`; retire the "55/55 plugin integration" metric everywhere.
   - Audit `src/` for plugin-aware installer bits (e.g., `FileRuleManifestData.ts` plugin path entries, FEV-20 auto-discovery leftovers) and strip.
2. **Docs/specs cleanup:** `specs/spec-sdd-plugin-decoupling.md`, ADR-013, ADR-017, `docs/diagnosis/fix15-plugin-cleanup.md` (append "superseded by FEV-30" banner), manifest counts, README.
3. **Removal of the plugin does NOT remove destructive-block hardening obligations** — record any residual risk in this doc's References.
4. **Deprecation warnings for v ≤ 2.1.2 ("Opencode Legacy only"):**
   - README: compatibility matrix section.
   - GitHub Releases notes (template for: releases are generated from CHANGELOG; add the note there and in release workflow).
   - Installer wizard: version banner printed at startup/wizard step:
     - ≤2.1.2 → "des-opencode-legacy"
     - V2 users → "update to `>= vX`" (final version for FEV-30) — phrasing decided while implementing.
5. Versions note (user decision): `<2.1.3` = Opencode Legacy only; the V2 hotfix release will add the converged warning.

## References

- Remote issue: https://github.com/Fisherk2/codice-opencode/issues/90
- V1→V2 plugin migration guides (evaluated, rejected): https://opencode.ai/v2/docs/build/plugins/migrate-v1/
- Prior reduction: `docs/diagnosis/fix15-plugin-cleanup.md` (v2.1.1, #80)
- ADRs: `specs/adr/adr-013-plugin-auto-discovery.md`, `specs/adr/adr-017-sdd-intent-auto-discovery.md`
