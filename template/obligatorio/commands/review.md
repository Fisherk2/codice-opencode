---
description: Conduct a five-axis code review — correctness, readability, architecture, security, performance
agent: tezcatlipoca
---

Invoke @skills/code-review-and-quality/SKILL.md.

Review the current changes (staged or recent commits) across all five axes:

1. **Correctness** — Does it match the spec? Edge cases handled? Tests adequate? Use @skills/error-handling-patterns/SKILL.md for error path and resilience review
2. **Readability** — Clear names? Straightforward logic? Well-organized? Use @skills/solid/SKILL.md to evaluate SOLID principles and clean code
3. **Architecture** — Follows existing patterns? Clean boundaries? Right abstraction level? Use @skills/design-patterns/SKILL.md for architectural decisions and pattern usage
4. **Security** — Input validated? Secrets safe? Auth checked? Use @skills/security-and-hardening/SKILL.md
5. **Performance** — No N+1 queries? No unbounded ops? Use @skills/performance-optimization/SKILL.md

For frontend changes, also use @skills/design-taste-frontend/SKILL.md to review visual consistency and design quality.

Categorize findings as Critical, Important, or Suggestion. For structural improvements, reference @skills/refactoring-patterns/SKILL.md in fix recommendations.

Before finalizing, use the `question` tool to resolve ambiguities:
- Flag findings that could be **false positives** — ask the user to confirm
- Ask if any observation is **intentional** — the user may have a valid reason
- Let the user dismiss, accept, or modify each disputed finding

Output a structured review with specific file:line references and fix recommendations. Only after user confirmation, delegate fixes to Tlaloc via `/build`.

## Suggested Next Step

> Review complete. Switch to agent `tlaloc` to fix the observations, then run `/ship` to prepare for launch once your project is ready.
