# ADR-020: SPEC Modularization

**Status:** Accepted

**Date:** 2026-08-08

**Author:** Fisherk2

**Reference:** FEV-24 — Documentation Restructure | SPEC.md v2.1.0

## Context

`SPEC.md` grew to 441 lines covering objective, problem statement, user stories, tech stack, project structure, file classification, testing strategy, CLI commands, success criteria, code style, and boundaries. This created three problems:

1. **Review friction** — A single-file spec forces reviewers to load the entire document for any scoped change (e.g., updating CLI flags touches the same file as architecture decisions).
2. **Merge conflicts** — Parallel work on different spec areas (e.g., tech stack vs. testing) collides on the same file.
3. **Discoverability** — Readers seeking a specific topic (e.g., file rules or CLI modes) must scroll or search a long monolith.

The spec is also the source of truth for PRD/TRD/WORKFLOW cross-references. A modular structure should preserve a single entry point (`SPEC.md` as index) while allowing independent evolution of each section.

## Decision

We modularize `SPEC.md` into an **index + 8 sub-specs** under `specs/`:

### New Structure

| File | Topic | Extracted From |
|------|-------|----------------|
| `SPEC.md` (44 lines) | Index — objective, repository, modular spec table with links | Header + objective (retained) |
| `specs/spec-overview.md` | Objective, problem statement, user stories (US-1..US-5), v2.0/v2.1 progress | SPEC.md §1–2 |
| `specs/spec-tech-stack.md` | Tech stack table, runtime constraints (Bun, TypeScript strict, no `any`) | SPEC.md §3 |
| `specs/spec-project-structure.md` | Directory tree, layer dependency rules (Clean Architecture) | SPEC.md §4 |
| `specs/spec-file-rules.md` | File classification (Obligatorio/Estándar/Opcional) | SPEC.md §5 |
| `specs/spec-cli-commands.md` | CLI modes and command specification | SPEC.md §6 |
| `specs/spec-testing-strategy.md` | Three-phase testing (Unit/Integration/E2E), 31 scenarios | SPEC.md §7 |
| `specs/spec-success-criteria.md` | Functional, performance, quality, documentation, v2.1 criteria (SC-1..SC-24) | SPEC.md §8 |
| `specs/spec-code-style-summary.md` | Brief code style rules linking to `docs/CODE_STYLE.md` | SPEC.md §9 |
| `specs/spec-boundaries.md` | Always / Ask First / Never rules, agent delegation protocol | SPEC.md §10 |

Additional v2.x specs (`spec-agent-packs.md`, `spec-installer-ux-v2.md`, `spec-agent-format-v2.md`, `spec-template.md`, `spec-sdd-plugin-decoupling.md`) remain as peers — they were already modular.

### What Stays in SPEC.md

* Title, status, author, date, version, repository URL.
* One-paragraph objective (unchanged).
* Modular spec table — the only navigation surface. No duplicated content.

### Migration

* `SPEC.md` reduced from 441 → 44 lines in a single commit to avoid intermediate broken references.
* All internal links updated (`docs/ARCHITECTURE.md`, `docs/PRD.md`, `docs/TRD.md`, `docs/WORKFLOW.md`).
* Git history preserved via `git log --follow` for each sub-spec's origin.

## Consequences

### Positive

* Scoped reviews and reduced merge conflicts — changes to CLI commands no longer touch the same file as tech stack.
* Faster onboarding: readers jump directly to the relevant sub-spec via the index table.
* Clear ownership boundary per sub-spec for future ADRs and reviews.

### Negative

* More files to maintain (8 additional markdown files); link integrity must be checked on rename.
* Slight indirection for first-time readers — they must follow the index table instead of scrolling a single file.

### Neutral

* No runtime or template change — purely documentation structure.
* Establishes the convention that new spec topics are added as `specs/spec-*.md` and linked from `SPEC.md`.

## Related Decisions

* ADR-014 — Agent Pack System (documented in `spec-agent-packs.md`, peer to this modularization)
* ADR-015 — Installer UX v2 (documented in `spec-installer-ux-v2.md`)
* ADR-016..ADR-019 — v2.1 decisions that populate `spec-commands.md` and `spec-boundaries.md`
