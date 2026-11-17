# Waterfall / Cascade Delivery

Purpose: describe the sequential model, its gates, and the narrow cases where it beats slicing — plus how it fails when applied to discovery work.

## The model

Work moves through sequential phases; each phase completes before the next begins and hands over artifacts:

```
Requirements → Design → Implementation → Verification → Deployment → Maintenance
     │            │            │              │
   gate         gate         gate           gate
```

**Cascade** is the same shape with formal sign-off at each gate: a downstream phase may not start (or may not deploy) until the upstream artifact is approved. The gate is the defining feature, not the sequencing. Sequencing alone is just a plan.

## When it is genuinely the right choice

| Condition | Why sequential wins |
|---|---|
| **Scope is fixed and priced** | Fixed-price contracts, tender responses, regulated deliverables: the buyer needs a frozen baseline before spending |
| **Requirements are stable and knowable** | Hardware, protocols, interfaces defined by another party — discovery adds nothing |
| **Gates are external and mandatory** | Certification, safety case, security accreditation, audit evidence — the auditor needs a document to sign at a defined moment |
| **Change cost is asymmetric** | Safety-critical firmware, destructive data migrations, medical devices: a wrong turn late is unrecoverable |
| **Many teams share frozen interfaces** | Contract-first integration across organisational boundaries |
| **Work is genuinely repeatable** | You have built this exact system before and know every requirement |

In these cases waterfall is not bureaucratic theatre — it is the cheapest way to make the commit point explicit. Slicing would move the commitment later, which is exactly what the contract forbids.

## Failure modes on discovery work

| Failure | Mechanism | Observable symptom |
|---|---|---|
| **Late feedback** | Users first see the system at verification, months after requirements froze | "That is not what we meant" at UAT |
| **Requirements fiction** | The requirements document asserts knowledge the team does not have | Long requirement sections with no owner or example |
| **Change resistance** | Any change requires reopening a signed gate, so changes are suppressed rather than priced | Defects logged as "out of scope" instead of re-planned |
| **Integration cliff** | Components are built against documents, not against each other | The verification phase discovers interface mismatches at full cost |
| **Documentation as progress** | Completing a phase means producing a document, not a working behaviour | Green status with nothing runnable |
| **Risk back-loaded** | Unknowns surface at the phase where they are most expensive | The last 20% takes 60% of the schedule |
| **Test-last** | Verification is a phase, so tests are written after the design is frozen | Tests that assert the implementation, not the need |

The root cause is the same in every row: waterfall assumes the requirements are *known*, and treats *learning* as a phase failure. When the requirement is genuinely unknown, a sequential plan converts ignorance into schedule debt.

## Hybrid: gates outside, slices inside

The productive compromise for regulated or contracted work:

1. Keep the external gates untouched — they are commitments, not process preferences.
2. Treat each gate interval as a box. Inside the box, plan vertical slices.
3. Bring evidence to the gate as *working behaviour plus tests*, not only documents. Auditors accept demonstrable behaviour; it is usually stronger evidence than a design document.
4. Freeze only the interfaces the gate actually needs frozen. Everything else stays revisable inside the interval.

Aim the slice boundaries at the gates: a gate interval that ends with a demoable capability is far cheaper to defend than one that ends with a design review.

## How this changes the phase plan

- Do **not** name phases after the waterfall stages when the work is discovery-driven. "Design phase" and "implementation phase" are stage names masquerading as plan.
- Do name phases after capabilities, and record which external gate each phase must satisfy.
- If a gate cannot be satisfied by a demoable increment (for example, certification requires a complete hazard analysis), make that analysis a task inside the slice it protects, not a standalone phase.
- Keep a phase count in the Prototype/MVP/Enterprise range from `SKILL.md`; a waterfall plan with eleven stages usually means the stage names were copied from a template rather than derived from the work.

## Verification questions

1. Can every phase be traced to a gate or to a capability? If it maps to neither, delete it.
2. Is any requirement in the baseline actually an assumption? Mark it, and schedule the slice that tests it first.
3. Does any gate depend on a document that a working slice could not replace? If not, replace it.
4. If the scope changes after gate one, what is the priced procedure? If the answer is "there is none", agile is the honest choice.
