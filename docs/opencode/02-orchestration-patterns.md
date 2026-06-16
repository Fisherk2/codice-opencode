# Orchestration Patterns

Reference catalog of agent orquestation patterns this repo endorses, plus anti-patterns to avoid, agent personas, and their orchestration rules. Read this before adding a new slash command that coordinates multiple personas, or before introducing a new persona that "wraps" existing ones.

The governing rule: **the user (or a slash command) is the orchestrator. Personas do not invoke other personas.** Skills are mandatory hops inside a persona's workflow.

---

## Agent Personas

Specialist personas that play a single role with a single perspective. Each persona is a Markdown file in `agents/` (sincronizado con `.opencode/agents/`) y consumido como system prompt por OpenCode.

> **Full agent catalog (96+ subagents):** See [03-agent-index.md](./03-agent-index.md) for the complete classified index of all available subagents. This section only lists the 6 primary agents that participate in orchestration patterns.

| Persona | Role | Best for |
|---------|------|----------|
| [huitzilopochtli](../../agents/huitzilopochtli.md) | Supreme Orchestrator | Full-lifecycle orchestration, pure delegation, deciding which agent should act |
| [quetzalcoatl](../../agents/quetzalcoatl.md) | Visionary Architect | Spec-driven analysis, architecture design, documentation delegation |
| [moctezuma](../../agents/moctezuma.md) | Strategic Commander | Task breakdown, planning, effort estimation, roadmap creation |
| [tlaloc](../../agents/tlaloc.md) | Rain God Builder | Code implementation, testing, infrastructure, with delegation to specialized subagents |
| [mictlantecuhtli](../../agents/mictlantecuhtli.md) | Underworld Judge | Testing, validation, quality assurance, shipping preparation |
| [tezcatlipoca](../../agents/tezcatlipoca.md) | Smoking Mirror Critic | Code review, security audit, performance analysis, hidden flaw detection |

### How personas relate to skills and commands

Three layers, each with a distinct job:

| Layer | What it is | Example | Composition role |
|-------|-----------|---------|------------------|
| **Skill** | A workflow with steps and exit criteria | `code-review-and-quality` | The *how* — invoked from inside a persona or command |
| **Persona** | A role with a perspective and an output format | `code-reviewer` | The *who* — adopts a viewpoint, produces a report |
| **Command** | A user-facing entry point | `/review`, `/ship` | The *when* — composes personas and skills |

The user (or a slash command) is the orchestrator. **Personas do not call other personas.** Skills are mandatory hops inside a persona's workflow.

### When to use each

**Direct persona invocation** — Pick this when you want one perspective on the current change and the user is in the loop.

> For the full catalog of 96 available subagents beyond those listed here, see [03-agent-index.md](./03-agent-index.md).

- "Handle any general task end-to-end" → invoke `huitzilopochtli` directly
- "Review this PR" → invoke `code-reviewer` directly
- "Are there security issues in `auth.ts`?" → invoke `security-auditor` directly
- "What tests are missing for the checkout flow?" → invoke `test-engineer` directly
- "Analyze and plan this feature" → invoke `quetzalcoatl` directly
- "Build this feature" → invoke `tlaloc` directly
- "Plan this implementation" → invoke `moctezuma` directly
- "Write tests and validate" → invoke `mictlantecuhtli` directly
- "Review and critique the code" → invoke `tezcatlipoca` directly
- "Write docs for this API" → invoke `docs-writer` directly
- "Design a deployment pipeline" → invoke `deployment-engineer` directly
- "Check database performance" → invoke `database-optimizer` directly
- "We have a production incident" → invoke `incident-responder` directly
- "Audit our dependencies" → invoke `dependency-manager` directly
- "Optimize the Docker image" → invoke `build-engineer` directly
- "Fix this git mess" → invoke `git-workflow-manager` directly
- "Debug this flaky test" → invoke `debugger` directly

**Slash command (single persona behind it)** — Pick this when there's a repeatable workflow you'd otherwise re-explain every time.

- `/review` → wraps `tezcatlipoca` with the project's review skill
- `/test` → wraps `mictlantecuhtli` with TDD skill
- `/code-simplify` → wraps `tlaloc` with code simplification skill
- `/design` → wraps `quetzalcoatl` with UI/UX design skills (fan-out to `ux-researcher` + `frontend-developer` + `accessibility-tester`)
- `/evolve` → wraps `quetzalcoatl` with living documentation and specs evolution workflow for existing projects
- `/webperf` → wraps `mictlantecuhtli` with web performance audit (delegates to `web-performance-auditor` subagent)

**Slash command (orchestrator — fan-out)** — Pick this only when **independent** investigations can run in parallel and produce reports that a single agent then merges.

- `/ship` → `mictlantecuhtli` orchestrates fan-out to `code-reviewer` + `security-auditor` + `test-engineer` + `dependency-manager` + `accessibility-tester` in parallel, then synthesizes their reports into a go/no-go decision
- `/design` → `quetzalcoatl` orchestrates fan-out to `ux-researcher` + `frontend-developer` + `accessibility-tester` in parallel, then synthesizes their reports into a design specification

### Rules for personas

1. A persona is a single role with a single output format. If you find yourself adding a second role, create a second persona.
2. **Personas do not invoke other personas.** Composition is the job of slash commands or the user. This rule refers to OpenCode personas (files in `agents/` loaded as system prompts). It does **not** prohibit a persona from delegating specialized sub-tasks to subagents via the `task` tool — that is a different mechanism (isolated sub-contexts, not persona chaining).
3. A persona may invoke skills (the *how*).
4. **All primary agents may delegate specialized sub-tasks to subagents**, subject to task allowlists:
   - `huitzilopochtli` (orchestrator) may delegate to any subagent in the catalog (flexible).
   - `quetzalcoatl` (architect) may delegate to architecture, data, documentation, review, and UI/UX subagents.
   - `tlaloc` (builder) may delegate to implementation, testing, DevOps, AI, and security subagents.
   - `moctezuma` (planner) does NOT delegate — writes plans directly.
   - `mictlantecuhtli` (judge) may delegate to code review, security, testing, dependency, accessibility, debugging, and deployment subagents.
   - `tezcatlipoca` (critic) does NOT delegate — only observes and critiques.
5. Every persona file ends with a "Composition" block stating where it fits.

---

## Endorsed Patterns

### 1. Direct invocation (no orchestration)

Single persona, single perspective, single artifact. The default and the cheapest option.

```
user → code-reviewer → report → user
```

**Use when:** the work is one perspective on one artifact and you can describe it in one sentence.

**Examples:**
- "Handle any task end-to-end" → `huitzilopochtli`
- "Review this PR" → `code-reviewer`
- "Find security issues in `auth.ts`" → `security-auditor`
- "What tests are missing for the checkout flow?" → `test-engineer`
- "Analyze and plan this feature" → `quetzalcoatl`
- "Build this feature" → `tlaloc`
- "Plan this implementation" → `moctezuma`
- "Write tests and validate" → `mictlantecuhtli`
- "Review and critique the code" → `tezcatlipoca`
- "Write docs for this API" → `docs-writer`
- "Design a deployment pipeline" → `deployment-engineer`
- "Check database performance" → `database-optimizer`
- "We have a production incident" → `incident-responder`
- "Audit our dependencies" → `dependency-manager`
- "Optimize the Docker image" → `build-engineer`
- "Fix this git mess" → `git-workflow-manager`
- "Debug this flaky test" → `debugger`

**Cost:** one round trip. The baseline you should always compare orchestrated patterns against.

---

### 2. Single-persona slash command

A slash command that wraps one persona with the project's skills. Saves the user from re-explaining the workflow every time.

```
/review → tezcatlipoca (with code-review-and-quality skill) → report
```

**Use when:** the same single-persona invocation happens repeatedly with the same setup.

**Examples in this repo:** `/review` (tezcatlipoca), `/test` (mictlantecuhtli), `/code-simplify` (code-simplifier).

**Cost:** same as direct invocation. The slash command is just a saved prompt.

**Anti-signal:** if the slash command's body is mostly "decide which persona to call," delete it and let the user call the persona directly.

---

### 3. Parallel fan-out with merge (canonical examples: `/ship`, `/design`)

Multiple personas operate on the same input concurrently, each producing an independent report. A merge step (in the main agent's context) synthesizes them into a single decision.

```
                    ┌─→ code-reviewer       ─┐
                    ├─→ security-auditor    ─┤
/ship → fan out  ───┼─→ test-engineer       ─┤→ merge → go/no-go + rollback
                    ├─→ dependency-manager  ─┤
                    └─→ accessibility-tester ─┘
```

```
                    ┌─→ ux-researcher       ─┐
/design → fan out ──┼─→ frontend-developer  ─┤→ merge → design specification
                    └─→ accessibility-tester ─┘
```

**Use when:**
- The sub-tasks are genuinely independent (no shared mutable state, no ordering dependency)
- Each sub-agent benefits from its own context window
- The merge step is small enough to stay in the main context
- Wall-clock latency matters

**Examples in this repo:** `/ship` (mictlantecuhtli orchestrates parallel review), `/design` (quetzalcoatl orchestrates parallel UI/UX design).

**Cost:** N parallel sub-agent contexts + one merge turn. Higher than direct invocation, but faster wall-clock and produces better reports because each sub-agent stays focused on its single perspective.

**Why this works (the `/ship` example):**
- Each sub-agent operates on the same diff but produces a **different perspective**
- They have no dependencies on each other → genuine parallelism, real wall-clock savings
- Each runs in a fresh context window → main session stays uncluttered
- The merge step is small and benefits from full context, so it stays in the main agent
- Five perspectives cover all launch concerns: code quality, security, testing, dependencies, and accessibility

**Why this works (the `/design` example):**
- `ux-researcher` focuses on user needs, personas, and journeys
- `frontend-developer` focuses on technical feasibility and architecture
- `accessibility-tester` focuses on WCAG compliance and inclusive design
- Three perspectives cover all design concerns: user experience, technical constraints, and accessibility

**Validation checklist before adopting this pattern:**
- [ ] Can I run all sub-agents at the same time without ordering issues?
- [ ] Does each persona produce a different *kind* of finding, not just the same finding from a different angle?
- [ ] Will the merge step fit in the main agent's remaining context?
- [ ] Is the user's wait time long enough that parallelism is actually noticeable?

If any answer is "no," fall back to direct invocation or a single-persona command.

---

### 4. Sequential pipeline as user-driven slash commands

The user runs slash commands in a defined order, carrying context (or commit history) between them. There is no orchestrator agent — the user IS the orchestrator.

```
user runs:  /spec  →  /plan  →  /build  →  /test  →  /review  →  /ship
```

**Secondary commands** (not part of the main pipeline) can be inserted at relevant points:

```
user runs:  /design  →  /spec  →  /plan  →  /build  →  /test  →  /webperf  →  /code-simplify  →  /review  →  /ship
user runs:  /evolve  →  /plan  →  /build  →  /test  →  /webperf  →  /code-simplify  →  /review  →  /ship  *(existing project)*
```

**Use when:** the workflow has dependencies (each step needs the previous step's output) and human judgment between steps adds value.

**Examples in this repo:** the entire DEFINE → PLAN → BUILD → VERIFY → REVIEW → SHIP lifecycle, with secondary commands `/design` (UI/UX design), `/evolve` (existing project evolution), and `/code-simplify` (code clarity) available as needed.

**Cost:** one sub-agent context per step. Free for the orchestration layer because there is no orchestrator agent.

**Why not automate it:** an LLM "lifecycle orchestrator" would (a) lose nuance between steps because it has to summarize for hand-off, (b) skip the human checkpoints that catch wrong-direction work early, and (c) double the token cost via paraphrasing turns.

---

### 5. Research isolation (context preservation)

When a task requires reading large amounts of material that shouldn't pollute the main context, spawn a research sub-agent that returns only a digest.

```
main agent → research sub-agent (reads 50 files) → digest → main agent continues
```

**Use when:**
- The main session needs to stay focused on a downstream task
- The investigation result is much smaller than the input it consumes
- The decision quality benefits from the main agent having room to think after

**Examples:** "Find every call site of this deprecated API across the monorepo," "Summarize what these 30 ADRs say about caching."

**Cost:** one isolated sub-agent context. Worth it any time the alternative is loading hundreds of files into the main context.

---

### 6. General-purpose agent (end-to-end lifecycle)

A single persona handles any task from conception to completion, working across domains (not just software). The agent does the core work itself — research, writing, planning, organization — and only delegates specialized sub-tasks to subagents when specific expertise is required.

```
user → huitzilopochtli (general purpose)
         ↓ (researches, analyzes, plans, executes core work)
         └─→ delegates specialized sub-tasks to subagents as needed
         ↓
      result → user
```

**Use when:**
- The task spans multiple domains or types of work (research + writing + planning)
- The work is not purely software development (documents, research, organization)
- You want a single entry point that can handle full lifecycle without SDD constraints
- The core work can be done by the generalist; only narrow concerns need specialist input

**Examples in this repo:** `huitzilopochtli` for end-to-end tasks like "research this topic and write a report," "plan and organize our documentation," or "investigate, plan, and implement a non-software project."

**Cost:** one main context + optional isolated subagent contexts for specialized delegation.

**How this differs from the Router anti-pattern:**
- Huitzilopochtli does actual work — it researches, writes, plans, and executes. It is not a pure routing layer.
- Delegation is for specialized expertise (e.g., "audit this code for security"), not for routing decisions.
- The agent handles the full lifecycle; delegation is a small part of the workflow, not the entirety of it.
- The user invokes it for the agent's own capabilities, not as a dispatcher.

**NOTE:** This pattern is exclusive to general-purpose personas like `huitzilopochtli`. Specialized subagents (code reviewers, security auditors, etc.) should **not** adopt it, as that would violate the single-perspective rule (Rule 1). However, specialized **primary agents** (like `quetzalcoatl` and `tlaloc`) have their own version of delegation — see [Pattern 7](#7-specialized-primary-agent-with-targeted-delegation).

---

### 7. Specialized primary agent with targeted delegation

A specialized primary agent (analysis or build) delegates domain-specific sub-tasks to relevant subagents, while keeping its core responsibility. Unlike the general-purpose pattern, the specialized primary agent stays within its single perspective and only delegates narrow, isolated concerns that require deeper expertise in its own domain.

```
user → quetzalcoatl (analysis/planning)
         ↓ (analyzes, plans, documents core work)
         └─→ delegates to analysis subagents (code-reviewer, security-auditor, etc.)
         ↓ (integrates results)
      spec → user
```
```
user → tlaloc (build/execution)
         ↓ (implements, tests, builds core work)
         └─→ delegates to build subagents (debugger, db-optimizer, docker-expert, etc.)
         ↓ (integrates results)
      code → user
```

**Use when:**
- The task is within the SDD lifecycle (plan → build)
- The primary agent can do most of the work itself
- A narrow, well-defined sub-task requires deeper specialized expertise
- Delegation is to subagents relevant to the agent's domain

**Examples in this repo:**
- `quetzalcoatl` delegates code review to `code-reviewer`, security audit to `security-auditor`, or database analysis to `database-optimizer` while keeping control of the spec
- `tlaloc` delegates a tricky bug to `debugger`, schema design to `database-optimizer`, or Docker optimization to `docker-expert` while keeping control of the build

**Cost:** one main context + one isolated subagent context per delegation. Each delegation costs 1 step from the primary agent's step budget.

**Key differences from Pattern 3 (Parallel fan-out):**
- Pattern 3 runs multiple subagents in parallel on the **same** input (e.g., `/ship`)
- Pattern 7 runs a single subagent sequentially on a **specific sub-task** within the primary agent's workflow
- Pattern 3 is a command-level orchestration pattern; Pattern 7 is an agent-level delegation pattern

**Rules for delegation:**
- The core work stays in the primary agent — delegation is for isolated, narrow concerns only
- Each delegated subagent must be relevant to the primary agent's domain (analysis → analysis subs; build → build subs)
- Do NOT delegate to other Primary Agents (huitzilopochtli, quetzalcoatl, moctezuma, tlaloc, mictlantecuhtli, tezcatlipoca) — those are for the user to invoke
- Review and integrate the subagent's output before continuing

---

## Anti-Patterns

### A. Router persona ("meta-orchestrator")

A persona whose job is to decide which other persona to call.

```
/work → meta-orchestrator
            ↓ (decides "this needs a review")
        code-reviewer
            ↓ (returns)
        meta-orchestrator (paraphrases result)
            ↓
        user
```

**Why it fails:**
- Pure routing layer with no domain value
- Adds two paraphrasing hops → information loss + roughly 2× token cost
- The user already knew they wanted a review; they could have called `/review` directly
- Replicates the work that slash commands and intent mapping in `AGENTS.md` already do
- The routing layer has no domain value — it adds latency, cost, and information loss for zero benefit

**What to do instead:** add or refine slash commands. Document intent → command mapping in `AGENTS.md`.

---

### B. Persona that calls another persona

A `code-reviewer` that internally invokes `security-auditor` when it sees auth code.

**Why it fails:**
- Personas were designed to produce a single perspective; chaining them defeats that
- The summary the calling persona passes loses context the called persona needs
- Failure modes multiply (which persona's output format wins? whose rules apply?)
- Hides cost from the user

**What to do instead:** have the calling persona *recommend* a follow-up audit in its report. The user or a slash command runs the second pass.

---

### C. Sequential orchestrator that paraphrases

An agent that calls `/spec`, then `/plan`, then `/build`, etc. on the user's behalf.

**Why it fails:**
- Loses the human checkpoints that catch wrong-direction work
- Each hand-off summarizes context — accumulated drift over a long pipeline
- Doubles token cost: orchestrator turn + sub-agent turn for every step
- Removes user agency at exactly the points where judgment matters most

**What to do instead:** keep the user as the orchestrator. Document the recommended sequence in `README.md` and let users invoke it.

---

### D. Deep persona trees

`/ship` calls a `pre-ship-coordinator` that calls a `quality-coordinator` that calls `code-reviewer`.

**Why it fails:**
- Each layer adds latency and tokens with no decision value
- Debugging becomes a multi-level investigation
- The leaf personas lose context to multiple summarization steps

**What to do instead:** keep the orchestration depth at most 1 (slash command → personas). The merge happens in the main agent.

---

## Decision Flow

When considering a new orchestrated workflow, walk this flow:

```
Is the work one perspective on one artifact?
├── Yes → Direct invocation. Stop.
└── No  → Will the same composition repeat?
         ├── No  → Direct invocation, ad hoc. Stop.
         └── Yes → Are sub-tasks independent?
                  ├── No  → Sequential slash commands run by user (Pattern 4).
                  └── Yes → Parallel fan-out with merge (Pattern 3).
                           Validate against the checklist above.
                           If any check fails → fall back to single-persona command (Pattern 2).
```

---

## Adding a New Persona

1. Create `agents/<role>.md` with the same frontmatter format used by existing personas.
2. Define the role, scope, output format, and rules.
3. Add a **Composition** block at the bottom (Invoke directly when / Invoke via / Do not invoke from another persona).
4. Add the persona to the catalog in [03-agent-index.md](./03-agent-index.md). If it's a primary agent that participates in orchestration patterns, also add it to the table in [Agent Personas](#agent-personas).
5. Update the task allowlists of primary agents that might delegate to this subagent:
   - **[agents/quetzalcoatl.md](../../agents/quetzalcoatl.md)** — If the agent is useful for analysis, review, specifications, or documentation
   - **[agents/tlaloc.md](../../agents/tlaloc.md)** — If the agent is useful for implementation, build, testing, or deployment
6. If the persona enables a new orchestration pattern, add it to this catalog's [Endorsed Patterns](#endorsed-patterns) or [Anti-Patterns](#anti-patterns) section rather than inventing the pattern in the persona file itself.

---

## When to Add a New Pattern to This Catalog

Add a new entry only after:

1. You've used the pattern at least twice in real work
2. You can name a concrete artifact in this repo that demonstrates it
3. You can explain why an existing pattern wouldn't have worked
4. You can describe its anti-pattern shadow (what people will mistakenly build instead)

Premature catalog entries become aspirational documentation that no one follows.
