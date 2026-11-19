# Spec: Códice — Opencode Workspace Installer

**Status:** Approved  
**Author:** Fisherk2  
**Date:** 2026-07-11  
**Current Version:** v2.1.5 (FEV-31 ✅ + pasada documental post-beta) — **lista para despliegue estable, aún no publicada**; `latest` sigue en 2.1.4. `v2.1.5-beta.1` se publicó bajo dist-tag `beta` el 2026-11-18 (release run success).
**Repository:** `https://github.com/fisherk2/codice-opencode`

> **v2.1.3** (2026-09-22): FEV-29 ✅ + FEV-30 ✅ — template migrated to the native OpenCode V2 `permissions:` format (349 agent files; legacy `tools:` frontmatter rejected) and the SDD plugin fully removed from the template (destructive-command blocking now lives in the `permissions.bash` deny-lists); runtime "Opencode Legacy" banner (`src/application/legacyBanner.ts`) reads `.codice-version` offline and warns installs ≤ 2.1.2. 1959 tests, 31/31 E2E, coverage 96.39% total / 98.95% `src/cli/main.ts`.
>
> **Previous: v2.1.2 Released** (2026-08-28): Hotfix — explicit docs-writer/technical-writer delegation in docs-update command; tech debt reorganization (v2.1.2 debt → v2.1.3, v2.1.3 → v2.1.4).
>
> **Previous: v2.1.1** (2026-08-25): FEV-26 ✅ + FEV-27 ✅ + FEV-28 ✅ — Bug #79, shell injection fix (TD-V2-70), manifest corrections (TD-V2-90/91), FileMergeEngine refresh (TD-V2-93), plugin cleanup (#80), external directory permissions (#81), backup integrity (TD-V2-9), staging cleanup (TD-V2-51), CI SHA-pins Node 24 (TD-V2-7), VersionComparator cache (TD-V2-61). Code review hardened (1 Critical + 4 Important + 3 Suggestions). 1935 tests, 31/31 E2E, coverage ≥95% production src/.
>
> **v2.1.5-beta.1** (2026-11-18): FEV-31 ✅ (issues #111–#116 + orphan references, cerrado 2026-11-17) más revisión/remediación pre-launch de 5 ejes — 4 especialistas, 47 hallazgos previos corregidos, 9 commits de remediación + 3 de alineación (`4ed7edb..196aed3`). Gates finales: `just test` **2027/0** (73 archivos, 4859 expect calls), `just test-e2e` **31/31**, `tsc --noEmit` **0**, biome **0** (2 warnings + 1 info preexistentes); release-gate OK (tag == `package.json` `2.1.5-beta.1`, sección CHANGELOG no vacía). **Estado beta (2026-11-18):** publicada bajo dist-tag `beta` (`latest` intacto en 2.1.4) — camino real: `hotfix/update-payload` (tip `417522a`) → PR #119 squash `3883288` → `develop` → sync `develop`←`main` `d03191a` (exigido por `strict: true`) → PR #121 squash `c579948` → `main` → tag anotado `v2.1.5-beta.1` (`926006f`) **sobre el tip de `main`**; ruta probada con `gh pr view --json headRefName,mergeCommit` (un squash no preserva linaje). `release/v2.1.5` se cortó después del tag para la promoción a estable — durante la beta nunca se empujó; hoy es la rama donde v2.1.5 se prepara como release estable (aún sin publicar). Release run 44443767080 completed/success: npm publish `--provenance` bajo dist-tag `beta` con `latest` intacto en 2.1.4 + GitHub Release Pre-release; `just verify-release` OK. Contingencia de rollback disponible (no pendiente): `just rollback v2.1.5-beta.1 <good> beta` (RTO < 15 min).
>
> **v2.1.5** (2026-11-19): FEV-31 + pasada documental post-beta (39 archivos `.md`). **Estado: lista para despliegue estable — aún no publicada; `latest` permanece en 2.1.4 hasta la publicación estable.**

## Objective

Códice is a command-line interface (CLI) tool built with Bun that installs and updates OpenCode workspace templates atomically, safely, and intelligently. It resolves the fragmentation and customization-loss problem that occurs when users manually merge template updates into existing projects. Códice automates three installation modes (Clean Install, Project Install, Update Workspace) with guaranteed atomic file operations and minimal runtime dependencies (`@clack/prompts` for TUI, `semver` for version comparison — both bundled with the npm package).

## Modular Specs

| File | Topic |
|------|-------|
| [spec-overview.md](specs/spec-overview.md) | Objective, Problem Statement, User Stories (US-1..US-5), v2.0/v2.1 progress |
| [spec-tech-stack.md](specs/spec-tech-stack.md) | Tech Stack table + Runtime Constraints |
| [spec-commands.md](specs/spec-commands.md) | Development, Testing, Build & Release, and CLI Runtime commands (incl. v2.1 `/sync`, `/migrate`, `/deploy`, `/analyze`) |
| [spec-project-structure.md](specs/spec-project-structure.md) | Project directory tree + Layer Dependency Rules |
| [spec-testing-strategy.md](specs/spec-testing-strategy.md) | Three-phase testing (Unit / Integration / E2E) with 31 scenarios |
| [spec-success-criteria.md](specs/spec-success-criteria.md) | Functional, Performance, Quality, Documentation, and v2.1 criteria (SC-1..SC-24) |
| [spec-code-style-summary.md](specs/spec-code-style-summary.md) | Brief code style rules linking to docs/CODE_STYLE.md |
| [spec-boundaries.md](specs/spec-boundaries.md) | Always / Ask First / Never rules (incl. v2.1 agent delegation protocol) |
| [spec-file-rules.md](specs/spec-file-rules.md) | File classification rules (Obligatorio/Estándar/Opcional) |
| [spec-cli-commands.md](specs/spec-cli-commands.md) | Exhaustive CLI command and mode specification |
| [spec-agent-packs.md](specs/spec-agent-packs.md) | Agent pack system (8 selectable packs + 2 mandatory) |
| [spec-installer-ux-v2.md](specs/spec-installer-ux-v2.md) | Installer UX v2 with pack wizard and version gating |
| [spec-agent-format-v2.md](specs/spec-agent-format-v2.md) | Agent format v2 with YAML frontmatter schema |
| [spec-template.md](specs/spec-template.md) | Template directory structure and conventions |

Resolved decisions are documented in the respective ADRs (see [docs/adr/](docs/adr/)).

## References

- **AGENTS.md** — Strict AI agent rules, project context, and documentation index.
- **docs/WORKFLOW.md** — Implementation phases, task breakdown, and formal technical review gates.
- **docs/PRD.md** — Product Requirements Document.
- **docs/TRD.md** — Technical Requirements Document.
- **Reference Repository:** `https://github.com/weisser-dev/awesome-opencode` — Similar installation system for UX and flow inspiration.

*End of Spec*
