---
description: Run a web performance audit via the web-performance-auditor persona
agent: mictlantecuhtli
---

`/webperf` targets web applications specifically. Do not use it for utility libraries, CLIs, or server-only code with no browser-facing output.

## Determine the mode

**Deep mode** — activate when any of these is available:
- A Lighthouse JSON report file (e.g. `npx lighthouse <url> --output json --output-path ./report.json`, or `npx -p chrome-devtools-mcp chrome-devtools lighthouse_audit --output-format=json`)
- A PageSpeed Insights JSON response (includes Lighthouse + CrUX)
- A CrUX API response (requires `CRUX_API_KEY` or `GOOGLE_API_KEY`)
- A DevTools performance trace
- A live URL plus the `chrome-devtools` MCP server configured in the harness
- The Chrome DevTools MCP CLI invoked locally — use @skills/browser-testing-with-devtools/SKILL.md for setup and live capture guidance

**Quick mode** — default when none of the above are available. The agent scans source code for structural anti-patterns. Use @skills/performance-analysis/SKILL.md to detect N+1 queries, algorithmic complexity, and memory allocation issues.

## Run the audit

Spawn the `web-performance-auditor` subagent. Pass it explicitly:

- The files, components, or diff under review
- Any artifact paths (Lighthouse JSON, PSI JSON, CrUX response, trace) or pasted JSON content
- The target URL or page name when known
- A note on which mode you expect (Quick or Deep), so the agent surfaces missing inputs if Deep was intended

The subagent returns a scorecard (only populated with sourced values), a ranked list of findings, positive observations, and proactive recommendations.

## Output

Return the full audit report to the user. For remediation of findings, invoke @skills/performance-optimization/SKILL.md for granular optimization guidance and implementation steps.

## Suggested Next Step

> Performance audit complete. Run `/code-simplify` to refactor and simplify the code with performance improvements applied.
