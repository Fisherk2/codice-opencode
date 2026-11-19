# ADR-[NNN]: [Short Descriptive Title in Imperative Mood]

* **Status:** [Proposed | Accepted | Deprecated | Superseded by ADR-XXX]
* **Date:** [YYYY-MM-DD]
* **Decision Makers:** [Roles or people, e.g. Tech Lead, Architect, Product Owner]
* **Consulted:** [Subject-matter experts consulted, e.g. Security Engineer, SRE Lead]
* **Informed:** [Stakeholders kept up-to-date, e.g. Product Manager, QA Lead]
* **Traceability:** [Links to PRD, TRD, GitHub Issues, etc.]
<!-- Delete all HTML comments once the placeholders are filled. -->

<!-- State the problem and the forces that make a decision necessary. -->
## 1. Context and Problem Statement

[Describe the technical or business problem. What forces are pressuring the system? What non-functional requirements (from TRD) are at risk? Use 2-3 sentences or a question format.]

<!-- List the criteria the chosen option must satisfy. -->
## 2. Decision Drivers

[Forces, concerns, constraints, and goals driving this decision. These are the criteria the chosen option must satisfy.]

* [Driver 1 — e.g. "Must support >10k concurrent connections"]
* [Driver 2 — e.g. "Team has existing expertise in X"]
* [Driver 3 — e.g. "Regulatory compliance requires Y"]

<!-- List every viable alternative evaluated, with a one-line description each. -->
## 3. Considered Options

[List all viable alternatives that were evaluated. Include a brief description of each.]

* **Option A:** [Name] — [Brief description]
* **Option B:** [Name] — [Brief description]
* **Option C:** [Name] — [Brief description]

<!-- Name the chosen option and justify it against the decision drivers. -->
## 4. Decision Outcome

**Chosen option:** [Option X], because [concise justification].

[Explain the rationale. Reference the Decision Drivers from section 2 to show how this option best satisfies the constraints.]

<!-- Say how compliance will be verified after the decision ships. -->
### 4.1 Confirmation

[How will we verify this decision is implemented correctly? What fitness functions, reviews, or checks will confirm compliance?]

* [e.g. "Architecture review must verify layer boundaries"]
* [e.g. "Load test must pass 10k connections within latency SLA"]

<!-- Repeat the pros/cons table for each option, including the discarded ones. -->
## 5. Pros and Cons of the Options

<!-- Fill one block per option with benefits, drawbacks and trade-offs. -->
### [Option A — Name]

* ✅ **Pros:** [Benefits]
* ⚠️ **Cons:** [Drawbacks and risks]
* ⚖️ **Neutral:** [Trade-offs, paradigm shifts]

<!-- Repeat this block for the next option. -->
### [Option B — Name]

* ✅ **Pros:** [Benefits]
* ⚠️ **Cons:** [Drawbacks and risks]
* ⚖️ **Neutral:** [Trade-offs, paradigm shifts]

<!-- Record what becomes easier and what becomes harder after the decision. -->
## 6. Consequences

[The broader impact of this decision. Every architectural decision has a cost — be honest about the disadvantages.]

* ✅ **Positives:** [What becomes easier]
* ⚠️ **Negatives / Risks:** [What becomes harder or new risks introduced]
* ⚖️ **Neutral / Paradigm Shifts:** [Team practices, tooling, or workflow changes]

<!-- Link to other ADRs that influenced this one or are influenced by it. -->
## 7. Related Decisions

* [Links to other ADRs that influenced or are influenced by this decision]

<!-- Define success metrics, review date and the triggers for re-evaluation. -->
## 8. Compliance and Review

* **Success metrics:** [How will we know this decision was correct in 6 months?]
* **Next review date:** [YYYY-MM-DD]
* **Revisit triggers:** [Conditions that would force re-evaluation, e.g. "If latency exceeds 200ms at p99"]

---
*Template based on [MADR v4.0](https://adr.github.io/madr/) and [Nygard's ADR format](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).*
