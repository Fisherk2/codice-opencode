# Vertical Slice Architecture in Depth

Purpose: define what a slice is, how to cut and size one, how slices relate to CQRS, how much testing each risk level needs, and where the approach is unnecessary — with two worked roadmaps.

## Definition

A **vertical slice** is the smallest change that delivers a complete, user-observable capability across every technical concern it needs. It owns its request handling, its logic, its persistence access, and its response — even if the codebase otherwise organises those concerns in layers.

A slice has three properties:

1. **Capability-shaped** — it is named after something an actor can do, not after a component.
2. **End-to-end** — removing any of its touchpoints breaks the behaviour.
3. **Independently shippable** — it can be deployed, demoed, and reverted without waiting for another slice.

The contrast is architectural as well as procedural. In a layered plan, features are added by touching the same five directories in sequence. In VSA, features are added by adding one cohesive unit, and reuse happens where it is actually shared rather than being assumed in advance.

## Slicing heuristics

| Heuristic | Cut when | Do not cut when |
|---|---|---|
| **Actor / intent** | Different roles trigger the same data differently ("customer refunds" vs "support refunds") | The variation is a permission check, not different behaviour |
| **State transition** | Each lifecycle step has distinct rules (draft → submitted → approved) | Steps are pure data entry with identical rules |
| **Data boundary** | The slice reads or writes a self-contained aggregate | The slice needs half of every table |
| **Risk** | Splitting the risky decision out lets you learn early | Splitting only defers the integration |
| **Change frequency** | Two parts change for unrelated reasons and at different rates | One part is a trivial helper of the other |

Two rules that keep slices honest:

- **If two slices always ship together, they are one slice.** Either merge them or find the capability that truly separates them.
- **If a slice cannot be named without a technical noun, it is a layer in disguise.** "Add the repository layer" is not a capability.

## Sizing a slice

A slice is the right size when it fits inside one planning unit (one sprint, one phase, one session) and still behaves like a real system: it survives a restart, enforces its rules, and can be reverted.

| Signal | Slice is right-sized | Slice is too large |
|---|---|---|
| **Demo sentence** | One sentence names an actor and an outcome | The sentence needs "and" between unrelated outcomes |
| **Acceptance test** | One assertion names observable behaviour | The test name lists several scenarios or a module |
| **Touchpoints** | All are present and each has one owner | The slice needs a new shared abstraction before it can run |
| **Duration** | Finishes inside the unit with room for review | The unit must be stretched to fit the slice |
| **Revert** | A flag, a revert, or a down-migration exists | Only "we would never roll this back" |

Narrowing moves, in order of preference:

1. **One actor** — cut the admin variant from the customer variant.
2. **One state transition** — "submit a draft" instead of "manage the whole lifecycle".
3. **Happy path first** — defer rejects, retries, and edge cases into the next slice; keep the rule that makes the happy path meaningful.
4. **One data boundary** — use the aggregate the slice already owns; do not join three tables to save a second slice.
5. **Thin cross-cutting concerns** — real auth and real persistence, but the simplest version of each; a stub is not a slice.

Do not shrink a slice by removing a layer. Dropping persistence or the real permission check makes the demo cheaper and the learning worthless: the integration risk simply moves to the next phase.

## Relationship to CQRS

VSA and CQRS are compatible but independent. They meet at the request boundary:

- A slice handles **one request**. In a CQRS system that is naturally one command or one query, which gives command handlers and query handlers a one-to-one mapping with slices. Read models become their own slices and can be optimised separately.
- VSA **does not require** CQRS. Most slices read and write the same model; introducing separate read models too early doubles the surface for no benefit.
- Adopting both means: **commands are slices, queries are slices, and the split exists because the read and write shapes genuinely differ** — not because the diagram looked cleaner.

Anti-pattern: CQRS applied per slice mechanically, so every trivial read gets an event projection. If the query is a filtered select, it is a query slice with no projection. Fowler's warning is worth keeping in view: CQRS adds risky complexity to most systems, and belongs on a specific part of the system rather than everywhere.

## Testing per slice

| Level | What it proves | Scope |
|---|---|---|
| **Acceptance test** | The capability works end to end | Through the public boundary (HTTP, CLI command, UI action) |
| **Slice tests** | The rules inside the slice are right | Slice's handler/logic with real domain code, faked I/O |
| **Contract tests** | The slice honours what others depend on | Schema, events, external API responses |
| **Regression pin** | A past defect cannot return | One focused test per fixed bug, kept forever |

Test placement rule: **the acceptance test is written before the slice, and it is the slice's definition of done.** A slice with only unit tests has not proven it crosses its touchpoints; a slice with only an acceptance test cannot localise a failure. Both, scaled to risk.

Do not write a separate integration layer per technical layer. The acceptance test already integrates the slice; extra per-layer integration suites duplicate it at higher maintenance cost.

## Test strategy by risk

More tests are not the goal; evidence proportional to the cost of being wrong is.

| Slice risk | Test mix | Why |
|---|---|---|
| **Low** — internal tool, reversible, trivial data | Acceptance test + a few slice tests; no contract suite | The acceptance test already crosses the layers; extra suites cost more than the failure |
| **Medium** — user-facing write, shared schema, external API | Acceptance + slice rules + contract test on the boundary | A schema or API change breaks consumers without breaking the slice's own tests |
| **High** — money, permissions, destructive migration, regulated data | Full mix + regression pins + explicit rollback rehearsal + negative-path acceptance cases | A defect is expensive or irreversible, so prove both the happy path and the refusal path |

Add tests when a defect escapes, not in proportion to how nervous the team feels. Every fixed bug gets one regression pin kept forever — that pin is cheaper than re-reading the incident report.

## Slice directory shape (illustrative, any stack)

```
src/
├── slices/
│   ├── reset-password/          # one capability
│   │   ├── handler              # entry point for the request
│   │   ├── logic                # rules specific to this capability
│   │   ├── data                 # what this slice reads/writes
│   │   └── acceptance.test      # proves the capability
│   └── approve-invoice/
└── shared/                      # only what at least two slices truly share
```

Keep `shared/` small and justify each addition by a second consumer. A slice may import shared code; shared code must never import a slice.

## When VSA is overkill

| Situation | Why VSA adds little |
|---|---|
| **One capability** in the whole system | There is nothing to cut; a simple layered structure is clearer |
| **Pure CRUD** with generated UI | Slices collapse into identical boilerplate |
| **Reporting / read-only analytics** | No user-visible write capabilities to slice |
| **Library or SDK** | Consumers see an API, not deployed capabilities |
| **Strong domain invariants across features** | Consistency is naturally aggregate-shaped; slice boundaries may cut aggregates |

Even then, keep the *planning* habit: name phases after capabilities. It costs nothing and prevents layer phases. VSA also assumes the team can recognise code smells and refactor; where that skill is missing, the "simple" slice turns into a tangle.

## Worked example 1: 3-slice roadmap (Prototype scope)

Capability list for a small invoicing tool: create invoice, approve invoice, export invoice, list invoices, invite teammate, set tax rules.

Cut: the thinnest end-to-end path is **create invoice** — it touches auth, persistence, validation, and rendering. Riskiest is **approve invoice** (state rules, permissions, audit). **Export invoice** depends on approve.

| Phase | Slice | Capability | Touchpoints crossed | Acceptance test |
|---|---|---|---|---|
| **1** | Walking skeleton | A signed-in user creates one invoice with a single line item and sees it listed | auth, validation, persistence, list render | `create-invoice.test` — POST one invoice, GET list contains it |
| **2** | Risky path | A user with the approver role approves an invoice; a non-approver is rejected | role check, state transition, audit record | `approve-invoice.test` — approve succeeds once, second attempt and wrong role fail |
| **3** | Output path | An approved invoice can be exported as a file in a stable format | formatting, file generation, download | `export-invoice.test` — approve then export returns a parseable file with the same total |

Nothing in this plan is a layer phase: each row is demoable, each row is revertible, and phase 2's risk was scheduled before the low-risk export. Note what was *not* scheduled: inviting teammates and tax rules stayed out of the prototype because they are capabilities that do not block learning.

## Worked example 2: 4-slice roadmap (MVP scope, sizing + CQRS decision)

Capability list for a subscription tool: start a trial, subscribe, renew, change plan, cancel, view billing history, email a receipt.

Cut: the thinnest path is **start a trial** (auth, plan lookup, entitlement check, one screen). The risky slice is **subscribe** — it moves money, so it carries a payment-provider contract, an idempotency key, and a rollback. **View billing history** has a genuinely different read shape (projection of events), which is the one place a query slice earns a separate read model.

| Phase | Slice | Capability | Touchpoints crossed | Acceptance test | Risk / test emphasis |
|---|---|---|---|---|---|
| **1** | Thin path | A visitor starts a trial and sees the product unlocked | auth, plan lookup, entitlement, UI, config | `start-trial.test` — POST trial, GET entitlement returns active | Low — acceptance + 2 slice tests |
| **2** | Money path | A trial user subscribes once; a retry with the same key does not charge twice | payment API contract, idempotency, entitlement, audit | `subscribe.test` — one charge per key, refusal on declined card | High — contract test, negative path, rollback rehearsal |
| **3** | Write slice | A subscriber changes plan and the new entitlement takes effect immediately | plan rules, proration logic, persistence, entitlement | `change-plan.test` — new plan active, old plan inactive | Medium — slice rules + acceptance |
| **4** | Query slice | A subscriber views billing history including past plan changes | event projection, read model, render | `billing-history.test` — history matches the events written in phases 2-3 | Medium — contract test on projection |

What this example adds over the first: phase 2 was sized down to one actor and one state transition (no plan changes, no cancellation) so it could fit a single iteration; phase 4 is a **query slice** because its read shape differs, while phases 1-3 deliberately share one model. Cancellation stayed out — it is a capability, not a phase, and it does not block learning.

## Verification questions

1. Can each slice be demoed with one sentence and one test?
2. Does `shared/` have a named second consumer for every member?
3. Is CQRS present because read and write shapes differ, or by habit?
4. Has any slice grown too large to finish inside the planning unit? Narrow the capability, do not extend the unit.
5. Are slices ordered by risk, or by comfort?
6. Does every slice survive a restart and have a revert path, or is it a stub with a green test?
7. Is the test mix proportional to the cost of being wrong, including a refusal path for high-risk slices?

## External References

| Source | What to consult it for | URL |
|--------|------------------------|-----|
| DevIQ — Vertical Slice Architecture | Definition, benefits and prerequisites (code smells and refactoring) | https://deviq.com/architecture/vertical-slice-architecture/ |
| DevIQ — Vertical Slices | Horizontal versus vertical construction and when to introduce VSA | https://deviq.com/practices/vertical-slices/ |
| Martin Fowler — CQRS | Complexity warning and use by bounded context | https://www.martinfowler.com/bliki/CQRS.html |
| Martin Fowler — Command Query Separation | Origin of the command/query principle and its exceptions | https://martinfowler.com/bliki/CommandQuerySeparation.html |
| Microsoft Azure Architecture Center — CQRS Pattern | When to separate read and write models, business-task commands and trade-offs | https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs |
| Kieran Potts — Walking skeleton | Cockburn's definition and the difference between skeleton, spike and MVP | https://kieranpotts.com/garden/walking-skeleton.html |
