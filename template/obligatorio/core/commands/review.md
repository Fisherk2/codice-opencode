---
description: Conduct a five-axis code review.
agent: tezcatlipoca
---

**Load** `code-review-and-quality` skill to perform a thorough code review.

Review the target changes (staged or recent commits) across all five axes, one axis at a time, sequentially. For each axis, load the relevant skill and delegate to the appropriate subagents:

1. **Correctness** — Does it match the spec? Edge cases handled? Tests adequate? **Delegate** `error-coordinator` subagent and **Load** `error-handling-patterns` skill for error path and resilience review
2. **Readability** — Clear names? Straightforward logic? Well-organized? **Delegate** `code-reviewer` subagent and **Load** `solid` skill to evaluate SOLID principles and clean code
3. **Architecture** — Follows existing patterns? Clean boundaries? Right abstraction level? **Delegate** `software-architect` and **Load** `design-patterns` skill for architectural decisions and pattern usage
4. **Security** — Input validated? Secrets safe? Auth checked? **Delegate** `security-auditor`, `ai-generated-code-auditor`, `senior-secops` and `appsec-engineer` subagents in parallel. **Load** `security-and-hardening` skill for each subagents.
5. **Performance** — No N+1 queries? No unbounded ops? **Delegate** `performance-benchmarker` and domain-specific subagents in parallel. **Load** `performance-optimization` skill for each subagents.

For frontend changes, also, **Delegate** `frontend-developer`, `mobile-developer` or another frontend-specific subagents in parallel. **Load** `design-taste-frontend` skill to review visual consistency and design quality.

6. Categorize findings as Critical, Important, or Suggestion. For structural improvements, **Load** `refactoring-patterns` skill to suggest patterns and fix recommendations.

Before make reviews, use the `question` tool to resolve ambiguities:
- Flag findings that could be **false positives** — ask the user to confirm
- Ask if any observation is **intentional** — the user may have a valid reason
- Let the user dismiss, accept, or modify each disputed finding

7. Output a structured review with specific file:line references and fix recommendations. Use the `question` tool to ask the user to confirm the review before proceeding with fixes.
8. If user confirms, **Delegate** `refactorer` subagent and **Load** `incremental-implementation` skill to apply all observations incrementally, **Load** `solid` skill to maintain SOLID principles — run tests after each change, if tests fail after a change, revert that change and reconsider.
9. **Delegate** `code-reviewer` subagent and **Load** `code-review-and-quality` skill to review the corrected code. For UI tasks, also verify **Loading** `browser-testing-with-devtools` skill
10. Fix any discrepancies found during review before proceeding and run test after each change.
11. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

If agents are stuck or the corrections process fails, **Delegate** to `debugger` subagent and **Load** `debugging-and-error-recovery` skill to diagnose and fix issues. If the debugger can't resolve the issue, **Delegate** to `error-detective` subagent and **Load** `observability-and-instrumentation` skill to identify the root cause and implement a fix with appropriate subagents.

## Suggested Next Step

> Review complete. Use `/plan` to repeat development cycle or `/ship` to prepare for launch once your project is ready.
