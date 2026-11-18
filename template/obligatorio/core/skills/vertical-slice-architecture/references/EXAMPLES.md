# Worked Roadmap Examples

Purpose: show the output format from `SKILL.md` filled in, and show a layer-shaped plan rewritten as slices. Copy the structure, not the domain.

## Example A: filled MVP roadmap

Scope: a small team shipping its first billing product to real users. Methodology: Scrum, 2-week iterations, because scope still moves with use but the user is known and failures are recoverable behind flags. Five phases — inside the MVP range.

### Implementation roadmap — MVP (5 phases)

| Phase | Capability | Touchpoints | Acceptance test | Rollback | Dependency |
|-------|------------|-------------|-----------------|----------|------------|
| 1 | A signed-in user creates one invoice with a line item and sees it listed | auth, validation, persistence, list render | `create-invoice.test` — POST one invoice, GET list contains it | flag `invoices` off, revert commit | none |
| 2 | An approver approves an invoice; a non-approver is rejected | role check, state transition, audit record | `approve-invoice.test` — one approve succeeds, second attempt and wrong role fail | revert commit + audit-row delete script | Phase 1 |
| 3 | The approver exports an approved invoice as a parseable file | formatting, file generation, download | `export-invoice.test` — approve then export returns a file with the same total | flag `export` off | Phase 2 |
| 4 | A user sees a payment recorded against an invoice | payment API contract, idempotency, persistence, audit | `record-payment.test` — one charge per idempotency key, declined card refused | flag `payments` off + down-migration | Phase 2 |
| 5 | An owner sees a monthly total of paid invoices | event projection, read model, render | `monthly-total.test` — total equals the sum of payments in phases 3-4 | drop read model, rebuild from events | Phase 4 |

Methodology: Scrum, 2-week iterations — scope still moves with user feedback and failures are recoverable behind flags.
Deliberately out of scope: teammate invitations and configurable tax rules — separate capabilities that do not block learning about billing.

Why this shape works:

- Every row answers "what can a user do after this phase?" without reading code.
- The riskiest slice (approve: state rules, permissions, audit) is phase 2, before the lower-risk export.
- Each rollback names a mechanism. Phase 4's down-migration is there because payment rows are data, not just code.
- Phase 5 is a query slice: its read shape differs, so a projection is justified rather than habitual.
- Nothing is named after a layer even though all five phases touch one.

## Example B: layer-shaped plan rewritten as slices

Before — a plan that looks tidy and ships nothing until the end:

| Phase | Title | Why it fails |
|---|---|---|
| 1 | Database schema and migrations | Nothing demoable; assumptions about usage stay untested |
| 2 | Repository and service layer | Still nothing a user can do; integration deferred to phase 4 |
| 3 | REST API and validation | Components meet for the first time late |
| 4 | Frontend screens | First demo, after all risk has accumulated |
| 5 | Hardening and tests | Tests assert the implementation, not the need |

After — the same system cut by capability:

| Phase | Capability | Touchpoints | Acceptance test | Rollback | Dependency |
|---|---|---|---|---|---|
| 1 | A user signs up and can log back in | auth, schema (minimal), login UI, session | `signup.test` — register, log out, log back in | flag `accounts` off + down-migration | none |
| 2 | A signed-in user creates and lists one record | validation, schema extension, handler, list UI | `create-record.test` — create one, see it in the list | revert commit | Phase 1 |
| 3 | A user edits a record and sees the change persist | state rules, handler, persistence, UI | `edit-record.test` — edit, reload, new value shown | revert commit | Phase 2 |
| 4 | A user deletes a record with confirmation | permission check, soft delete, UI | `delete-record.test` — deleted record absent from list | restore row script | Phase 2 |

What changed, and why:

- The "schema" phase disappeared. Schema work now happens inside the slice whose capability needs it — a prerequisite is folded into the slice it blocks.
- "Hardening and tests" disappeared. Tests are inside each slice; a separate test phase asserts what was already built.
- Phase 1 is a walking skeleton with real auth and persistence, not stubs: it de-risks the architecture while delivering something usable.
- Four phases rather than five, with a demo after each one and a smaller blast radius per change.
- Shared code appears only after a second consumer needs it; the `shared/` directory earned each entry.

## Verification questions

1. Can a reader answer "what can a user do after phase N?" for every row?
2. Does every row name a test, a rollback, and a dependency — with no dashes?
3. Is the first phase demoable and end-to-end, rather than a schema or a framework?
4. Could any row be split into two independently useful capabilities? If yes, why was it kept together?
5. Does the "before" plan of your own roadmap contain a phase that exists only to produce a document?

## External References

| Source | What to consult it for | URL |
|--------|------------------------|-----|
| DevIQ — Vertical Slices | Classic example of horizontal build-out versus a vertical cut | https://deviq.com/practices/vertical-slices/ |
| Jimmy Bogard — Vertical Slice Architecture | Grouping code by request and by axis of change | https://www.jimmybogard.com/vertical-slice-architecture/ |
| Kieran Potts — Walking skeleton | Cockburn's definition, used to justify phase 1 of example B | https://kieranpotts.com/garden/walking-skeleton.html |
| Atlassian — Agile software development for developers | Checkable DoD items for filling the acceptance and rollback columns | https://www.atlassian.com/agile/software-development/ |
