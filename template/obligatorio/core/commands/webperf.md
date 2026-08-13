---
description: Run a web performance audit.
agent: mictlantecuhtli
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
- The `Chrome-DevTools` MCP CLI invoked locally — use @skills/browser-testing-with-devtools/SKILL.md for setup and live capture guidance

**Quick mode** — default when none of the above are available. The agent scans source code for structural anti-patterns. **Load** @skills/performance-analysis/SKILL.md to detect N+1 queries, algorithmic complexity, and memory allocation issues.

## Phase 2: Run the audit

**Delegate** the `web-performance-auditor` subagent. Pass it explicitly:

- The files, components, or diff under review
- Any artifact paths (Lighthouse JSON, PSI JSON, CrUX response, trace) or pasted JSON content
- The target URL or page name when known
- A note on which mode you expect (Quick or Deep), so the agent surfaces missing inputs if Deep was intended

The subagent returns a scorecard (only populated with sourced values), a ranked list of findings, positive observations, and proactive recommendations.

## Phase 3: Output

Return the full audit report to the user. For remediation of findings, **Load** @skills/performance-optimization/SKILL.md for granular optimization guidance and implementation steps.

## Suggested Next Step

> Performance UI/UX audit complete. Switch to agent `tlaloc` to fix the observations, then run `/review` to review the latest implementations and ensure quality and correctness.
