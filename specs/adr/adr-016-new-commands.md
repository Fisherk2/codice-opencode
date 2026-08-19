# ADR-016: Slash Commands v2.1

**Status:** Accepted

**Date:** 2026-08-05

**Author:** Fisherk2

**Reference:** FEV-24 — New Commands v2.1 (Issues #68, #67, #64, #57) | PRD RF-09–RF-12

## Context

The v2.0.0 workspace (ADR-014, ADR-015) completes the agent pack system and installer UX. Users can install categorized agents, but lack standardized workflows for recurring tasks: bidirectional git synchronization, tech-stack migration planning, post-ship deployment setup, and architecture health analysis.

These workflows are currently manual, inconsistent across projects, and require deep knowledge of git, CI/CD, and codebase structure. The SDD skill ecosystem already provides reusable capabilities (`git-workflow-and-versioning`, `dependency-audit`, `ci-cd-and-automation`, `clean-ddd-hexagonal`), but no slash command surfaces them as user-facing entry points.

We need a small, composable set of commands that expose these skills through the OpenCode command system (`template/obligatorio/core/commands/*.md`) without duplicating logic in the CLI installer itself.

## Decision

We adopt **four slash commands** for v2.1, each implemented as a command markdown file that delegates to existing skills. No business logic lives in the command file — it orchestrates skills and documents the workflow.

| Command | Purpose | Modes / Strategies | Delegated Skills |
|---------|---------|--------------------|------------------|
| `/sync` | Bidirectional git sync between local and remote | 4 modes: full-sync, incremental-sync, dry-run, conflict-resolution. 4 strategies: NEWER_WINS, GITHUB_WINS, LOCAL_WINS, INTELLIGENT_MERGE | `git-workflow-and-versioning` |
| `/migrate` | Tech-stack migration analysis and planning | Stack detection from lock files, breaking-change evaluation, phased plan + rollback documented in `docs/MIGRATION.md` | `dependency-audit`, `deprecation-and-migration` |
| `/deploy` | Post-`/ship` deployment automation | 3 modes: no-workflow (generate from scratch), improvable (analyze + optimize), established (execute documented workflow) | `ci-cd-and-automation`, `bash-defensive-patterns` |
| `/analyze` | Architecture analysis across 8 dimensions | System structure, design patterns, dependency architecture, data flow, scalability, security, testability, documentation → updates `docs/TECH_DEBT.md` | `clean-ddd-hexagonal`, `design-patterns`, `dependency-audit` |

### Design Principles

1. **Skill delegation, not duplication** — Commands invoke skills via the SDD plugin; they do not reimplement git, migration, or analysis logic.
2. **Template-owned** — Command files live under `template/obligatorio/core/commands/` and are installed atomically with the workspace (Obligatorio classification).
3. **Composable** — `/deploy` explicitly follows `/ship`; `/analyze` feeds `TECH_DEBT.md` consumed by future `/migrate` runs.
4. **Bilingual-ready** — Command keywords are surfaced for intent detection (see ADR-017).

## Consequences

### Positive

* Standardizes four high-frequency workflows that were previously ad-hoc and undocumented.
* Reuses the existing skill library — no new runtime dependencies or duplicated logic.
* Keeps installer (`src/`) decoupled from workspace commands (template-only change).
* Enables incremental adoption: teams can use `/sync` without adopting `/migrate`/`/deploy`.

### Negative

* Four additional template files to maintain; changes to skill interfaces require command updates.
* Increased E2E coverage requirement (+1 scenario, 30 → 31 in v2.1).
* Command proliferation risk — future commands need a gating criterion (reusable skill + distinct workflow).

### Neutral

* Establishes the pattern for future workspace commands: markdown file + skill delegation + intent keywords.
* Requires documentation sync (Wiki → Commands, SPEC.md → spec-commands.md) on every new command.

## Related Decisions

* ADR-013 — SDD Plugin Auto-Discovery (command → agent/skill mapping now extended)
* ADR-017 — SDD Intent Auto-Discovery (keyword detection for these commands)
* ADR-018 — Agent Delegation Protocol (how primary agents execute these commands)
