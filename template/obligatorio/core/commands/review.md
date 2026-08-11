---
description: Conduct a five-axis code review.
agent: tezcatlipoca
---

**Load** @skills/code-review-and-quality/SKILL.md.

Review the current changes (staged or recent commits) across all five axes:

1. **Correctness** — Does it match the spec? Edge cases handled? Tests adequate? **Load** `error-handling-patterns` skill for error path and resilience review
2. **Readability** — Clear names? Straightforward logic? Well-organized? **Load** `solid` skill to evaluate SOLID principles and clean code
3. **Architecture** — Follows existing patterns? Clean boundaries? Right abstraction level? **Load** `design-patterns` skill for architectural decisions and pattern usage
4. **Security** — Input validated? Secrets safe? Auth checked? **Load** `security-and-hardening` skill
5. **Performance** — No N+1 queries? No unbounded ops? **Load** `performance-optimization` skill

For frontend changes, also **Load** `design-taste-frontend` skill to review visual consistency and design quality.

Categorize findings as Critical, Important, or Suggestion. For structural improvements, reference @skills/refactoring-patterns/SKILL.md in fix recommendations.

Before finalizing, use the `question` tool to resolve ambiguities:
- Flag findings that could be **false positives** — ask the user to confirm
- Ask if any observation is **intentional** — the user may have a valid reason
- Let the user dismiss, accept, or modify each disputed finding

Output a structured review with specific file:line references and fix recommendations.
**Review is done — do NOT touch or implement code files.**

## Suggested Next Step

> Review complete. Switch to agent `tlaloc` to fix the observations, then run `/ship` to prepare for launch once your project is ready.
