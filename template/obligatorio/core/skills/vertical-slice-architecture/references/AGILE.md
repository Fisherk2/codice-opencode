# Agile Delivery: Scrum and Kanban

Purpose: distinguish the two dominant agile families, show what each optimises, and state how the choice changes the phase plan.

## The agile family in one line

Agile is not "no plan" and not "stand-ups". It is **shortening the loop between a decision and the evidence that the decision was wrong**, so the cost of being wrong stays small. Everything else — boards, ceremonies, story points — is instrumentation for that loop.

## Scrum vs Kanban

| Dimension | Scrum | Kanban |
|---|---|---|
| **Unit of planning** | Fixed-length iteration (sprint), usually 1-2 weeks | Continuous flow, no iteration boundary |
| **Commitment** | Sprint goal committed at planning; scope frozen inside the sprint | Pull-based; WIP limits, no scope freeze |
| **Optimises for** | Predictable cadence, learning through retrospectives, cross-functional delivery | Throughput and lead time, responsiveness to interrupts |
| **Change inside the unit** | Discouraged — replan at the boundary | Expected — reprioritise continuously |
| **Ceremony cost** | High: planning, daily, review, retro, refinement (roughly 10-15% of capacity) | Low: board review and replenishment, daily optional |
| **Needs** | Stable team, a product owner who can order a backlog, estimable items | Defined workflow states, WIP limits, discipline to finish before starting |
| **Fails when** | Items cannot be finished inside one iteration, or the team is constantly interrupted | Work is invisible, WIP is unbounded, or nobody owns priority |
| **Phase mapping** | A phase ≈ a small number of sprints sharing one demoable outcome | A phase ≈ a milestone in the flow: a capability is demoable when it crosses the board |

Neither is more agile than the other. Scrum buys cadence at the price of rigidity inside the iteration; Kanban buys responsiveness at the price of having nothing that forces a demo.

## How the choice changes the phase plan

**Scrum.** Phases become milestones containing several sprints. Each sprint must end with something demoable, so a slice larger than one sprint must be split or made demoable in a narrowed form. Phase count should roughly equal `capabilities / capabilities-per-sprint`, rounded up. If the roadmap has a single phase spanning five sprints with no demo, the plan is not Scrum-shaped regardless of the ceremonies.

**Kanban.** Phases are optional; the flow is the plan. Keep phase boundaries only where a stakeholder decision or a release is needed, otherwise track the capability through workflow states. A Kanban roadmap should list capabilities with their state and lead time, not dates. Watch for the failure mode: without phase boundaries nothing forces a demo, so put the demo in the definition of done for each capability.

**Mixed.** Scrum for the product team, Kanban for the platform/on-call team that absorbs interrupts. This is common and legitimate; write down which team uses which and where the handoff sits, or the platform team silently becomes the bottleneck.

## What agile changes about slicing

1. **A slice must fit the unit.** If the slice cannot be demoed inside one iteration, narrow the capability, do not extend the iteration.
2. **Thin first, then thicken.** The first slice proves the path; later slices add capability, not layers. This is what makes the walking skeleton different from a layer phase.
3. **Definition of done is the real phase boundary.** "Merged" is not done; "demoable, tested, deployable, rolled back if needed" is done.
4. **Backlog order is the plan.** In an agile project the roadmap is an ordering hypothesis, not a schedule. Re-ordering at a slice boundary is normal, and should not be reported as a delay.

## Ceremony cost vs phase count

More phases do not require more ceremony, but they do require more demo and review moments. Rough budget:

| Scope | Iterations/flow | Reasonable ceremony load |
|---|---|---|
| Prototype | Continuous, no true iterations | Daily sync only; skip planning and retro |
| MVP | 1-2 week iterations | Planning, review/demo, short retro |
| Enterprise | 2 week iterations per team, plus cross-team sync | Full Scrum per team + a scaled planning/ review layer |

A Prototype run with full Scrum ceremony is a planning tax on learning. An Enterprise run with no cross-team cadence produces integration surprises that no per-team retro catches.

## Common failure modes

| Failure | Looks like | Correction |
|---|---|---|
| **Scrum in name only** | Sprints with no demoable outcome; "hardening sprint" at the end | Split the slice until one iteration fits it |
| **Kanban without WIP limits** | Everything in progress, nothing finished | Enforce limits; finish before starting |
| **Estimation theatre** | Days spent sizing items that will be re-cut next week | Size only to decide whether a slice fits the unit |
| **Sprint as mini-waterfall** | Design sprint, then build sprint, then test sprint | One slice per sprint, all activities |
| **Roadmap as contract** | Re-ordering treated as breach | Publish capabilities and order, not dates |
| **Ceremony without loop** | Retros that produce no change | Drop the ceremony or act on one item per iteration |

## Verification questions

1. Can the team name what is demoable at the end of the current unit of work?
2. Is the slice small enough to finish inside that unit, or has the unit been stretched to fit the slice?
3. Are interrupts absorbed by a defined flow, or do they silently destroy the iteration?
4. Does the phase plan exist at all, or has "agile" become an excuse to skip stating outcomes?
