# ADR-018: Agent Delegation Protocol

**Status:** Accepted

**Date:** 2026-08-06

**Author:** Fisherk2

**Reference:** FEV-25 — Agent Delegation Rules (Issue #69) | PRD RF-15, HU-13

## Context

The workspace ships six primary agents (`packs/main/`: huitzilopochtli, quetzalcoatl, tlaloc, mictlantecuhtli, tezcatlipoca, xipe-totec) that orchestrate work by delegating to specialized subagents via the `task()` tool.

Before this decision, delegation was informal: each primary agent described its behavior in free-form prose. There was no shared protocol for:

1. **When to delegate vs. handle directly** — inconsistent decisions across agents.
2. **How to invoke a subagent** — `task()` calls varied in structure, missing skills or acceptance criteria.
3. **Traceability** — no deterministic record of which skills were loaded or how success was verified.

This led to quality divergence between agents, poor auditability, and onboarding friction for new primary agents. PRD HU-13 requires that every `task()` include deterministic instructions, skills to load, and an acceptance checklist, with the protocol documented in `docs/ARCHITECTURE.md`.

## Decision

We adopt a uniform **Analyze → Plan → Execute** delegation protocol for all six primary agents:

### Protocol

```
1. Analyze — Understand the request, identify required capabilities, map to subagents and skills.
2. Plan   — Select the target subagent(s), declare skills to load, define acceptance criteria.
3. Execute — Invoke via task() with deterministic instructions + skills + checklist.
```

### task() Contract

Every delegation call must include:

* **Deterministic instructions** — explicit task description, input/output expectations, constraints.
* **Skills to load** — enumerated skill names (e.g., `clean-ddd-hexagonal`, `dependency-audit`).
* **Acceptance checklist** — verifiable criteria the subagent's output must satisfy.

### Scope

* Applies to all six primary agents in `packs/main/`. Subagents are not required to follow this protocol (they are leaf executors).
* Documented in `docs/ARCHITECTURE.md` and enforced via code review of agent markdown files.

### Architectural Properties

* **DIP (Dependency Inversion)** — The protocol is independent of the concrete subagent invoked; agents depend on the `task()` abstraction.
* **SRP** — Each phase (Analyze, Plan, Execute) has a distinct responsibility; blending them is a review finding.

## Consequences

### Positive

* Consistent delegation quality across all six primary agents — auditable and testable.
* Deterministic `task()` calls improve reproducibility and reduce subagent misinterpretation.
* Clear onboarding path for future primary agents (follow the three phases + contract).

### Negative

* Additional prose per primary agent (~20–30 lines each) — maintenance cost when the protocol evolves.
* Slightly more verbose `task()` invocations (explicit skills + checklist vs. terse prompt).

### Neutral

* Aligns with the skill-based architecture: delegation becomes the composition mechanism for skills.
* No runtime code change — this is a workspace convention enforced by documentation and review.

## Related Decisions

* ADR-016 — Slash Commands v2.1 (commands are the entry points that primary agents delegate through)
* ADR-017 — SDD Intent Auto-Discovery (intent routing precedes delegation)
* FEV-25 — Implementation milestone that applied this protocol to all six agents
