---
description: Conduct a five-axis code review.
agent: tezcatlipoca
---

## Pre-Flight: Obtain project context and review scope

1. Analyze user input to determine the review scope.
2. **Delegate** `codebase-onboarding-engineer` subagent and **Load** `codebase-onboarding` skill to understand the scope codebase, its architecture, and the changes being reviewed.
3. Count source files, test files, and documentation files to understand the codebase scope and prioritize review axes.
4. Estimate codebase size (LOC, file count) to scope analysis depth.
5. Output a summary of the files, commits, and/or changes to be reviewed, and confirm with the user.

If the user's request is vague or missing context, **Load** the `interview-me` skill to extract intent before proceeding and use the `question` tool to clarify interactively what is the scope of the review.

## Phase 1: Five-Axis Code Review

If user confirms the scope of the review, **Load** `code-review-and-quality` skill to perform a thorough code review.

Review the target changes (staged, unstaged, recent commits or specified files) across all five axes, one axis at a time, sequentially. For each axis, load the relevant skill and delegate to the appropriate subagents:

1. **Correctness** — Does it match the spec? Edge cases handled? Tests adequate? **Delegate** `error-coordinator` subagent and **Load** `error-handling-patterns` skill for error path and resilience review
2. **Readability** — Clear names? Straightforward logic? Well-organized? **Delegate** `code-reviewer` subagent and **Load** `solid` skill to evaluate SOLID principles and clean code
3. **Architecture** — Follows existing patterns? Clean boundaries? Right abstraction level? **Delegate** `software-architect` and **Load** `design-patterns` skill for architectural decisions and pattern usage
4. **Security** — Input validated? Secrets safe? Auth checked? **Delegate** `security-auditor`, `ai-generated-code-auditor`, `senior-secops` and `appsec-engineer` subagents in parallel. **Load** `security-and-hardening` alongside `security-audit` skill for each subagents.
5. **Performance** — No N+1 queries? No unbounded ops? **Delegate** `performance-benchmarker` and domain-specific subagents in parallel. **Load** `performance-optimization` skill for each subagents.

For frontend changes, also, **Delegate** `frontend-developer`, `mobile-developer` or another frontend-specific subagents in parallel. **Load** `design-taste-frontend` skill to review visual consistency and design quality.

## Phase 2: Clasify findings and output the report

1. Categorize findings as Critical, Important, or Suggestion. For structural improvements, **Load** `refactoring-patterns` skill to suggest patterns and fix recommendations.

2. Before make reviews, use the `question` tool to resolve ambiguities:
- Flag findings that could be **false positives** — ask the user to confirm
- Ask if any observation is **intentional** — the user may have a valid reason
- Let the user dismiss, accept, or modify each disputed finding

3. Output a structured review with specific file:line references and fix recommendations. Use the `question` tool to ask the user to confirm the review before proceeding with fixes.

## Phase 3: Fixing observations

1. If user confirms, **Delegate** `minimal-change-engineer` subagent and **Load** `incremental-implementation` skill to apply all observations incrementally, **Load** `solid` skill to maintain SOLID principles 
2. Run tests after each change, if tests fail after a change, revert that change and reconsider.
3. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

**Important**: If you/subagents get stuck or the fixing process fails, **STOP** and **Delegate** to `debugger` subagent and **Load** `debugging-and-error-recovery` skill to diagnose and fix issues. If the debugger can't resolve the issue, **Delegate** to `error-detective` subagent and **Load** `observability-and-instrumentation` skill to identify the root cause and implement a fix with appropriate subagents, always report to the user what is the issue and what you have to do to fix it, ask user for confirmation before proceeding with `question` tool.

## Rules

- **Do not** modify `CODE_STYLE.md` if it exists, follow the conventions and best practices defined in it.
- If `CODE_STYLE.md` does not exist, use the best practices and conventions of the project and write it in `docs/CODE_STYLE.md`.
- Always follow the rules of the project and conventions.
- You can stop and ask the user for clarification if you need more information to complete the task.
- Use the best available tools for the job.
- Research external resources every time, specially if you are stuck or the fixing process fails.

## Suggested Next Step

> Review complete. Use `/plan` to repeat development cycle or `/ship` to prepare for launch once your project is ready.

---

User instructions:

