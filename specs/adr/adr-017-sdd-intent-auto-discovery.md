# ADR-017: SDD Intent Auto-Discovery

**Status:** Accepted

**Date:** 2026-08-06

**Author:** Fisherk2

**Reference:** FEV-24 — SDD Plugin Refactor (part of Issue #53 follow-up) | PRD RF-13, RF-14

## Context

The SDD pipeline plugin (`sdd-pipeline.ts`, 665 lines) maps user intents to commands via the `INTENT_PATTERNS` constant (lines 62–135 in the pre-refactor version, see ADR-013). This map is hardcoded: every new command requires a manual entry listing its trigger keywords.

This creates two problems:

1. **Maintenance coupling** — Adding a command to `template/obligatorio/core/commands/*.md` (the documented user workflow) silently breaks intent detection unless the developer also edits the plugin. The Wiki never mentions the second step.
2. **Bilingual gap** — Keywords are English-only. Spanish-speaking users must use English triggers even though the workspace and documentation are bilingual (PRD/TRD in Spanish, code in English).

ADR-013 already replaced `COMMAND_AGENT_MAP` and `VALID_SUBAGENTS` with filesystem auto-discovery and JSON config. `INTENT_PATTERNS` is the last hardcoded coupling of the same class.

## Decision

We replace the hardcoded `INTENT_PATTERNS` map with **filesystem-based intent auto-discovery** plus a **bilingual overlay**:

### Auto-Discovery

* On plugin initialization, scan `template/obligatorio/core/commands/*.md`.
* Extract intent keywords from each command file's frontmatter and heading structure (e.g., `description`, `intent` fields and `## Intent` sections where present; fallback to filename-derived keywords).
* Build the intent → command map dynamically. New commands are detected automatically — no plugin edit required.
* The previous `INTENT_PATTERNS` constant is deleted. `SPANISH_INTENT_KEYWORDS` overlay (see below) is the only remaining static keyword map.

### Bilingual Support (EN/ES)

* A static overlay map `SPANISH_INTENT_KEYWORDS` translates discovered English keywords to Spanish equivalents (e.g., `sync` → `sincronizar`, `migrate` → `migrar`, `deploy` → `desplegar`, `analyze` → `analizar`).
* Detection is locale-aware: `translateIntent(keyword, locale)` resolves the effective keyword before matching.
* New languages are added as independent overlay maps — no changes to the discovery logic.

### Exposed Interfaces

| Symbol | Responsibility |
|--------|----------------|
| `discoverIntents()` | Filesystem scan of `commands/*.md` → intent map |
| `translateIntent(keyword, locale)` | Overlay translation (EN ↔ ES) |

### Architectural Properties

* **OCP (Open/Closed)** — New commands are added without modifying the plugin; new languages without modifying discovery.
* **SRP** — Discovery and translation are separate functions with independent test coverage.

## Consequences

### Positive

* Eliminates the last hardcoded command coupling in the SDD plugin — command addition is now a single-file operation in `template/`.
* Bilingual intent detection with zero per-command bilingual overhead.
* Consistent with ADR-013's auto-discovery direction; completes the three-pillar refactor.

### Negative

* Filesystem scan adds I/O at plugin startup (bounded: ≤ ~15 command files, negligible latency).
* Command files must follow a consistent frontmatter convention for reliable keyword extraction; malformed files degrade gracefully (filename fallback) but with lower precision.
* Spanish overlay requires manual curation per new command (small, bounded cost).

### Neutral

* Establishes the convention that `template/obligatorio/core/commands/*.md` is the source of truth for command metadata — future tooling should read from the same location.

## Related Decisions

* ADR-013 — SDD Plugin Auto-Discovery & Configuration (predecessor; same refactor track)
* ADR-016 — Slash Commands v2.1 (the four commands now auto-discovered)
* ADR-018 — Agent Delegation Protocol (agents rely on intent routing to select the correct command)
