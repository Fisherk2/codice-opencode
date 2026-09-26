---
description: Run a web performance audit.
agent: tezcatlipoca
---

## Pre-flight: Detect UI/UX project

Before to continue, detect whether the project has UI components. Check for files matching:

```
**/*.{html,htm,jsx,tsx,vue,svelte,astro}
**/*.{css,scss,less}
**/components/**/*
**/pages/**/*
**/views/**/*
```

- **If UI files exist** → Continue to Phase 1
- **If NO UI files** → stop and suggest using `/review` or `/design` instead.

## Phase 1: Detect audit mode

**Deep mode** — activate when any of these is available:
- A Lighthouse JSON report file (e.g. `npx lighthouse <url> --output json --output-path ./report.json`, or `npx -p chrome-devtools-mcp chrome-devtools lighthouse_audit --output-format=json`)
- A PageSpeed Insights JSON response (includes Lighthouse + CrUX)
- A CrUX API response (requires `CRUX_API_KEY` or `GOOGLE_API_KEY`)
- A DevTools performance trace
- A live URL plus the `chrome-devtools` MCP server configured in the harness
- The `Chrome-DevTools` MCP CLI invoked locally — **Load** `browser-testing-with-devtools` skill for setup and live capture guidance

**Quick mode** — default when none of the above are available. The agent scans source code for structural anti-patterns. **Load** `performance-analysis` skill to detect N+1 queries, algorithmic complexity, and memory allocation issues.

## Phase 2: Run the audit

**Delegate** the `web-performance-auditor` subagent. Pass it explicitly:

- The files, components, or diff under review
- Any artifact paths (Lighthouse JSON, PSI JSON, CrUX response, trace) or pasted JSON content
- The target URL or page name when known
- A note on which mode you expect (Quick or Deep), so the agent surfaces missing inputs if Deep was intended

The subagent returns a scorecard (only populated with sourced values), a ranked list of findings, positive observations, and proactive recommendations.

## Phase 3: Output

Before make audit report, use the `question` tool to resolve ambiguities:
- Flag findings that could be **false positives** — ask the user to confirm
- Ask if any observation is **intentional** — the user may have a valid reason
- Let the user dismiss, accept, or modify each disputed finding

Return the full audit report to the user. For remediation of findings, **Load** `performance-optimization` skill for granular optimization guidance and implementation steps.

## Phase 4: Corrective Action

1. Use the `question` tool to ask the user to confirm the review before proceeding with fixes.
2. If user confirms, **Delegate** `refactorer` subagent and **Load** `incremental-implementation` skill to apply all observations incrementally, **Load** `solid` skill to maintain SOLID principles — run tests after each change, if tests fail after a change, revert that change and reconsider.
3. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

If agents are stuck or the corrections process fails, **Delegate** to `debugger` subagent and **Load** `debugging-and-error-recovery` skill to diagnose and fix issues. If the debugger can't resolve the issue, **Delegate** to `error-detective` subagent and **Load** `observability-and-instrumentation` skill to identify the root cause and implement a fix with appropriate subagents.

## Suggested Next Step

> Performance UI/UX corrections are complete. Run `/review` to review the latest implementations and ensure quality and correctness.
