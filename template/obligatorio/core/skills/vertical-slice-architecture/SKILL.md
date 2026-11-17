---
name: vertical-slice-architecture
description: Plans implementation phases as vertical slices through every layer instead of horizontal layer-by-layer work. Use when writing or updating an implementation roadmap in docs/WORKFLOW.md, when asked how many phases a project needs, when choosing between waterfall/cascade and agile (Scrum, Kanban) delivery, or when cutting work into feature slices by user-visible capability. Triggers on vertical slice, feature slice, phase count, roadmap, waterfall, cascade, agile, scrum, kanban, sprint, incremental delivery, CQRS slice, prototype, MVP, enterprise scope.
---

# Vertical Slice Architecture

A vertical slice is one user-visible capability delivered end to end — input, logic, persistence, output — so every phase ships something a person can use and a test can prove. Plan by capability, not by layer: "user can reset their password" is a slice; "build the database layer" is not.

## When to Use (and When NOT to)

| Use When | Skip When |
|----------|-----------|
| Planning implementation phases for a feature, spec, or migration | The work is a single-file change with no roadmap |
| Writing or revising `docs/WORKFLOW.md` | The roadmap already exists and you are only executing a phase |
| Choosing between waterfall/cascade and agile delivery | The organisation mandates a process you cannot change |
| Deciding how many phases a scope needs | The phase count is fixed by an external contract |
| A roadmap is layer-shaped (DB → API → UI) and keeps slipping | Pure research spikes with no deliverable |
| Phase 1 has never been demoed | |

**Rule of thumb:** the smaller the feedback loop, the more slices; the more frozen the scope, the more a sequential plan is honest rather than harmful.

## How to Decide the Methodology

Waterfall and agile are not moral choices — they price the cost of being wrong. Pick the model whose failure mode you can afford.

| Signal | Ask | Lean waterfall/cascade | Lean agile |
|--------|-----|------------------------|------------|
| **Requirement stability** | Can scope change after sign-off? | Frozen, contractually fixed, change is expensive | Discovered by use, change is expected |
| **Feedback loop length** | How long until a user sees it? | Weeks-months; release windows controlled externally | Hours-days; deploy on demand |
| **Team size** | How many people must agree? | 1-3 with external review, or many teams on fixed interfaces | 3-9 co-located, or many teams owning separate slices |
| **Regulatory/contractual gates** | Are external gates mandatory? | Certification, audit, fixed-price milestone, safety case | Internal review only, or gates that accept incremental evidence |
| **Blast radius** | What breaks if the design is wrong? | Unrecoverable: safety, money movement, destructive migrations | Recoverable behind a flag, feature toggle, or revert |

Three consequences worth stating plainly:

1. **Waterfall as container, agile as inside.** Keep mandatory gates (audit, certification, procurement) as fixed outer milestones; inside each milestone, still plan vertical slices. Gates do not force layer-by-layer work.
2. **Agile does not mean no plan.** It means the plan is a hypothesis you revise at each slice boundary. A roadmap with no phase boundaries is not agile, it is unplanned.
3. **Mixed is normal.** A safety-critical subsystem can be waterfall (frozen interface, formal verification) while the surrounding product is agile. Record the split and the seam.

If two signals conflict (frozen scope but a one-week feedback loop), prefer **agile** and honour the gate: the gate constrains *when* you may ship, not *how* you build.

## Phase Count by Scope

| Scope | Phases | Signals |
|-------|--------|---------|
| **Prototype** | 1-3 | Unknown requirements, throwaway code, one developer |
| **MVP** | 4-6 | Known user, iterating on feedback, small team |
| **Enterprise** | 7+ | Multiple teams, compliance gates, long-lived system |

The range is a sanity check, not a quota. Too few phases usually means a phase bundles unrelated capabilities; too many usually means a phase exists only to produce another plan. Justify any phase count outside the range before writing it down.

## Cascade Thinking Inside an Agile Project (Anti-Patterns)

| Anti-pattern | Symptom | Fix |
|--------------|---------|-----|
| **Layer phases** | "Phase 1: schema. Phase 2: service layer. Phase 3: UI." | Re-cut by capability; each phase crosses all layers |
| **Big-bang integration** | Components meet for the first time in the last phase | Every slice integrates with what exists |
| **Undemoable phase** | Status report is "80% done", nothing to click | Each phase ends with a demoable outcome |
| **Plan-only phase** | The deliverable is a design doc, a spec, or a refined plan | Fold it into the slice that needs it, or delete it |
| **Horizontal task list** | Tasks grouped by file, module, or technology | Group tasks under the slice they serve |
| **Phase-per-person** | Phases mirror the team chart | Phases mirror capabilities; assign people to slices |
| **Infra phase zero** | Weeks of scaffolding before any behaviour | Ship a thin walking skeleton, then thicken it |
| **Risk last** | Unknowns are scheduled for the end | Riskiest or least-known slice goes first |

## The Vertical Cut Algorithm

Apply in order. Do not assign phases before step 6.

1. **List capabilities.** Enumerate what an actor can *do* after the work ships, as verbs with an object ("import a CSV", "approve an invoice"). One capability per line; no technology words.
2. **Pick the thinnest end-to-end path.** Choose the capability that is narrowest yet still traverses every layer, preferring the one with the highest risk or the most unknowns.
3. **List the touchpoints it crosses.** Contract/schema, domain logic, persistence, transport or UI, operations (config, logging, permissions). This list is the vertical cut — if any touchpoint is missing, the slice is not vertical.
4. **Write the acceptance test that proves the slice.** The test is the definition of done and the demo script. If you cannot name the assertion, the slice is too vague to schedule.
5. **Order slices by risk and dependency.** Unknowns and irreversible decisions first; pure prerequisites only when they literally block a slice ("cannot store anything until the schema exists"), and then fold the prerequisite into that slice.
6. **Assign phases.** Group one or more completed slices into a phase, then check the count against the Prototype/MVP/Enterprise range. Name each phase after its capability, never after a layer.

## What a Phase Must Contain

- [ ] **Demoable outcome** — who can do what when the phase ends, in one sentence.
- [ ] **Acceptance test** — name of the test and the behaviour it proves.
- [ ] **Touchpoints** — the layers and contracts the slice crosses (one line, not a task list).
- [ ] **Rollback** — feature flag off, revert commit, or down-migration; state which.
- [ ] **Explicitly out of scope** — what this phase deliberately does not do.
- [ ] **Dependency** — the phase it needs, or "none".

## Red Flags

- A phase title containing "layer", "database", "API", or "frontend" — it is horizontal.
- More than one phase before the first demo.
- A phase whose tasks could all be done twice as fast by deleting it.
- Acceptance criteria written as "code complete" or "tests pass" with no behaviour named.
- A roadmap that cannot answer "what can a user do after phase 2?".
- Phase count outside 1-3 / 4-6 / 7+ without a written justification.

## References

| File | Purpose |
|------|---------|
| [./references/WATERFALL.md](./references/WATERFALL.md) | Sequential/cascade model: gates, when it is right, failure modes |
| [./references/AGILE.md](./references/AGILE.md) | Scrum and Kanban: iterations vs flow, ceremony cost, effect on phases |
| [./references/VERTICAL-SLICE.md](./references/VERTICAL-SLICE.md) | VSA in depth: heuristics, CQRS, testing, worked 3-slice roadmap |
| [./references/DECISION-GUIDE.md](./references/DECISION-GUIDE.md) | One-page matrix and five scenarios mapped to a scope |
