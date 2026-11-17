# Decision Guide: Methodology and Phase Count

Purpose: one page that turns project signals into a methodology and a phase-count range, with five worked scenarios.

## The matrix

| Signal | Waterfall / cascade | Agile (Scrum) | Agile (Kanban) | Phase count implication |
|---|---|---|---|---|
| **Requirement stability** | Frozen; changes priced through a gate | Churns between iterations | Churns continuously | Frozen → fewer, larger phases; churning → more, smaller |
| **Feedback loop** | Weeks to months | 1-2 weeks per iteration | Hours to days | Longer loop → plan more per phase and accept more risk |
| **Team size** | Many teams on fixed interfaces, or 1-3 with external review | 3-9 co-located | Any size with a defined flow | More teams → more phases, but one per capability owner, not per layer |
| **Compliance / contractual gates** | Mandatory external gates | Gates accept per-iteration evidence | Gates as flow checkpoints | Each mandatory gate is a phase boundary |
| **Blast radius** | Unrecoverable failure (safety, money, data) | Recoverable behind a flag | Recoverable and frequently released | High blast radius → more verification per phase, not more layers |
| **Scope class** | — | — | — | **Prototype 1-3 · MVP 4-6 · Enterprise 7+** |

## Reading the matrix

The five signals rarely agree. Resolve them in this order:

1. **Blast radius sets the floor.** If a wrong slice can destroy data or move money irreversibly, every phase needs a rollback and a verification step, and the slice must be small. This raises quality cost, not phase count.
2. **Requirement stability picks the family.** Frozen scope with mandatory gates → waterfall as container. Anything still being discovered → agile.
3. **Team size picks the ceremony.** One to three people do not need sprint planning; many teams need an explicit cross-team cadence and interface contracts.
4. **Feedback loop picks the phase size.** A one-week feedback loop makes a six-week phase indefensible regardless of process name.
5. **Scope class picks the number.** Apply Prototype/MVP/Enterprise last, as the sanity check on the count you derived.

Conflict rule: **when a gate and a short loop collide, keep the gate as the boundary and slice inside it.** Never let the gate force layer-by-layer work.

## Scenario table

| # | Scenario | Signals | Methodology | Scope | Phases |
|---|---|---|---|---|---|
| 1 | Solo developer testing an idea; the concept may be discarded | Unknown requirements, one developer, hours-long loop, no external gates, low blast radius (throwaway) | No formal methodology; continuous flow, demo daily | **Prototype** | **1-3** |
| 2 | Small team launching a first product version to real users | Known user, scope still moving, 1-week feedback, 3-5 people, no compliance gate, recoverable failures | Scrum, 1-2 week iterations | **MVP** | **4-6** |
| 3 | Multi-team platform with audit requirements and a long life | Multiple teams, shared interfaces, quarterly audit gates, regulated data, 2-week loops | Waterfall as container (gates) + Scrum inside each gate interval | **Enterprise** | **7+** |
| 4 | On-call platform team absorbing interrupts while the product team ships | Continuous interrupts, unpredictable work, 3-4 people, recoverable | Kanban with WIP limits | **MVP** (flow-shaped) | **4-6**, boundaries only at releases |
| 5 | Embedded payments or medical dosing logic inside an otherwise agile product | Frozen interface, irrecoverable failure, external certification, 2-week product loop | Waterfall for the safety-critical subsystem; Scrum for the product around it; seam documented | **Enterprise** for the subsystem, **MVP** around it | **7+** subsystem, **4-6** product |

## Scenario detail

**1 — Prototype.** The only real risk is building the wrong thing. Phase 1 is a walking skeleton, phase 2 the uncertain core, phase 3 the output someone can react to. Do not write a roadmap beyond that; anything more is speculation about a product that may not exist.

**2 — MVP.** Requirements are discoverable but the user is real. Cut by capability, ship one per iteration, and expect re-ordering. Five phases is typical: skeleton, the riskiest capability, the value-producing capability, the retention capability, and hardening. If the plan has eight phases, some are probably layers.

**3 — Enterprise.** Gates are non-negotiable; the mistake is treating them as an excuse for horizontal phases. Map each gate to a set of demoable capabilities, then slice inside the interval. Teams own capabilities, not layers; shared interfaces get contracts and versioning. Seven or more phases is normal because gates and teams multiply the boundaries.

**4 — Kanban.** Phase boundaries are release boundaries. The plan is a capability list with WIP limits and a lead-time target. The main risk is invisible work: make the board the plan or nothing is planned.

**5 — Mixed.** Decide per subsystem and record the seam. The safety-critical part gets frozen interfaces, formal verification, and a waterfall plan; the surrounding product ships slices against a stable contract. Adapters isolate the two so the frozen part does not freeze the whole product.

## Fast triage (30 seconds)

```
Can the design be wrong in a way you cannot undo?
├─ Yes, and a gate must certify it   → waterfall for that part, slices inside the gates → Enterprise, 7+
└─ No
   ├─ Do requirements change after users touch it?
   │  ├─ Yes → agile
   │  │  ├─ Work arrives as a backlog you can order → Scrum → phase ≈ a few sprints
   │  │  └─ Work arrives as interrupts, flow-bound  → Kanban → phase ≈ releases
   │  └─ No → waterfall is honest → phase = gate interval
   └─ Is the product itself still a hypothesis?
      └─ Yes → Prototype, 1-3 phases, no roadmap beyond that
```

## Verification questions

1. Does the chosen methodology explain how being wrong gets cheap, or only how the calendar is drawn?
2. Does every mandatory gate appear as a phase boundary or as an explicit task inside a slice?
3. Is the phase count inside its scope range, and if not, is the reason written down?
4. Would re-ordering phases be treated as a discovery, or as a failure?
