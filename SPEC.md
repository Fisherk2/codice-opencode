# Spec: Códice — Opencode Workspace Installer

**Status:** Approved  
**Author:** Fisherk2  
**Date:** 2026-07-11  
**Current Version:** v2.1.0-beta.1  
**Repository:** `https://github.com/fisherk2/codice-opencode`

> **v2.1.0 Released** (2026-08-12): FEV-24 ✅ (4 new commands, SDD intent auto-discovery, bilingual intents) + FEV-25 ✅ (agent delegation protocol). 2052 tests, 31/31 E2E scenarios, coverage ≥ 95% production src/. v2.1.0-beta.1 published to npm (`@fisherk2-dev/codice@2.1.0-beta.1`, dist-tag beta).

## Objective

Códice is a command-line interface (CLI) tool built with Bun that installs and updates OpenCode workspace templates atomically, safely, and intelligently. It resolves the fragmentation and customization-loss problem that occurs when users manually merge template updates into existing projects. Códice automates three installation modes (Clean Install, Project Install, Update Workspace) with guaranteed atomic file operations and zero external runtime dependencies beyond Bun.

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
| [spec-sdd-plugin-decoupling.md](specs/spec-sdd-plugin-decoupling.md) | SDD plugin auto-discovery and configuration |
| [spec-agent-packs.md](specs/spec-agent-packs.md) | Agent pack system (8 selectable packs + 2 mandatory) |
| [spec-installer-ux-v2.md](specs/spec-installer-ux-v2.md) | Installer UX v2 with pack wizard and version gating |
| [spec-agent-format-v2.md](specs/spec-agent-format-v2.md) | Agent format v2 with YAML frontmatter schema |
| [spec-template.md](specs/spec-template.md) | Template directory structure and conventions |

Resolved decisions are documented in the respective ADRs (see [specs/adr/](specs/adr/)).

## References

- **AGENTS.md** — Strict AI agent rules, project context, and documentation index.
- **docs/WORKFLOW.md** — Implementation phases, task breakdown, and formal technical review gates.
- **docs/PRD.md** — Product Requirements Document (if exists).
- **docs/TRD.md** — Technical Requirements Document (if exists).
- **Reference Repository:** `https://github.com/weisser-dev/awesome-opencode` — Similar installation system for UX and flow inspiration.

*End of Spec*