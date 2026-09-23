# Spec: Códice — Opencode Workspace Installer

**Status:** Approved  
**Author:** Fisherk2  
**Date:** 2026-07-11  
**Current Version:** v2.1.3
**Repository:** `https://github.com/fisherk2/codice-opencode`

> **v2.1.3** (2026-09-22): FEV-29 ✅ + FEV-30 ✅ — template migrated to the native OpenCode V2 `permissions:` format (349 agent files; legacy `tools:` frontmatter rejected) and the SDD plugin fully removed from the template (destructive-command blocking now lives in the `permissions.bash` deny-lists); runtime "Opencode Legacy" banner (`src/application/legacyBanner.ts`) reads `.codice-version` offline and warns installs ≤ 2.1.2. 1941 tests, 31/31 E2E, coverage 96.30% total / 98.95% `src/cli/main.ts`.
>
> **Previous: v2.1.2 Released** (2026-08-28): Hotfix — explicit docs-writer/technical-writer delegation in docs-update command; tech debt reorganization (v2.1.2 debt → v2.1.3, v2.1.3 → v2.1.4).
>
> **Previous: v2.1.1** (2026-08-25): FEV-26 ✅ + FEV-27 ✅ + FEV-28 ✅ — Bug #79, shell injection fix (TD-V2-70), manifest corrections (TD-V2-90/91), FileMergeEngine refresh (TD-V2-93), plugin cleanup (#80), external directory permissions (#81), backup integrity (TD-V2-9), staging cleanup (TD-V2-51), CI SHA-pins Node 24 (TD-V2-7), VersionComparator cache (TD-V2-61). Code review hardened (1 Critical + 4 Important + 3 Suggestions). 1935 tests, 31/31 E2E, coverage ≥95% production src/.

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

Resolved decisions are documented in the respective ADRs (see [specs/adr/](specs/adr/)).

## References

- **AGENTS.md** — Strict AI agent rules, project context, and documentation index.
- **docs/WORKFLOW.md** — Implementation phases, task breakdown, and formal technical review gates.
- **docs/PRD.md** — Product Requirements Document.
- **docs/TRD.md** — Technical Requirements Document.
- **Reference Repository:** `https://github.com/weisser-dev/awesome-opencode` — Similar installation system for UX and flow inspiration.

*End of Spec*