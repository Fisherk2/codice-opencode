# Vertical Slice Architecture in Depth

Purpose: define what a slice is, how to cut one, how slices relate to CQRS, how to test them, and where the approach is unnecessary — with a worked three-slice roadmap.

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

## Relationship to CQRS

VSA and CQRS are compatible but independent. They meet at the request boundary:

- A slice handles **one request**. In a CQRS system that is naturally one command or one query, which gives command handlers and query handlers a one-to-one mapping with slices. Read models become their own slices and can be optimised separately.
- VSA **does not require** CQRS. Most slices read and write the same model; introducing separate read models too early doubles the surface for no benefit.
- Adopting both means: **commands are slices, queries are slices, and the split exists because the read and write shapes genuinely differ** — not because the diagram looked cleaner.

Anti-pattern: CQRS applied per slice mechanically, so every trivial read gets an event projection. If the query is a filtered select, it is a query slice with no projection.

## Testing per slice

| Level | What it proves | Scope |
|---|---|---|
| **Acceptance test** | The capability works end to end | Through the public boundary (HTTP, CLI command, UI action) |
| **Slice tests** | The rules inside the slice are right | Slice's handler/logic with real domain code, faked I/O |
| **Contract tests** | The slice honours what others depend on | Schema, events, external API responses |
| **Regression pin** | A past defect cannot return | One focused test per fixed bug, kept forever |

Test placement rule: **the acceptance test is written before the slice, and it is the slice's definition of done.** A slice with only unit tests has not proven it crosses its touchpoints; a slice with only an acceptance test cannot localise a failure. Both, scaled to risk.

Do not write a separate integration layer per technical layer. The acceptance test already integrates the slice; extra per-layer integration suites duplicate it at higher maintenance cost.

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

Even then, keep the *planning* habit: name phases after capabilities. It costs nothing and prevents layer phases.

## Worked example: 3-slice roadmap (Prototype scope)

Capability list for a small invoicing tool: create invoice, approve invoice, export invoice, list invoices, invite teammate, set tax rules.

Cut: the thinnest end-to-end path is **create invoice** — it touches auth, persistence, validation, and rendering. Riskiest is **approve invoice** (state rules, permissions, audit). **Export invoice** depends on approve.

| Phase | Slice | Capability | Touchpoints crossed | Acceptance test |
|---|---|---|---|---|
| **1** | Walking skeleton | A signed-in user creates one invoice with a single line item and sees it listed | auth, validation, persistence, list render | `create-invoice.test` — POST one invoice, GET list contains it |
| **2** | Risky path | A user with the approver role approves an invoice; a non-approver is rejected | role check, state transition, audit record | `approve-invoice.test` — approve succeeds once, second attempt and wrong role fail |
| **3** | Output path | An approved invoice can be exported as a file in a stable format | formatting, file generation, download | `export-invoice.test` — approve then export returns a parseable file with the same total |

Nothing in this plan is a layer phase: each row is demoable, each row is revertible, and phase 2's risk was scheduled before the low-risk export. Note what was *not* scheduled: inviting teammates and tax rules stayed out of the prototype because they are capabilities that do not block learning.

## Verification questions

1. Can each slice be demoed with one sentence and one test?
2. Does `shared/` have a named second consumer for every member?
3. Is CQRS present because read and write shapes differ, or by habit?
4. Has any slice grown too large to finish inside the planning unit? Narrow the capability, do not extend the unit.
5. Are slices ordered by risk, or by comfort?
