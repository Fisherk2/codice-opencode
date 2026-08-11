---
description: Perform multi-dimensional architectural analysis.
agent: quetzalcoatl
---

## Pre-Flight: Detect Project Type

**Delegate** `codebase-onboarding-engineer` subagent to understand the project:

1. Identify project root and tech stack (read `package.json`, lock files, config files).
2. Detect language(s), framework(s), and architecture pattern (monolith, microservices, serverless, etc.).
3. Count source files, test files, and documentation files.
4. Estimate codebase size (LOC, file count) to scope analysis depth.

## Phase 1: Multi-Dimensional Analysis

Use `question` tool to ask: **"What analysis depth do you want?"**:
- **A) Quick scan** — Surface-level issues only
- **B) Standard analysis** — All 8 dimensions, medium depth
- **C) Deep audit** — All 8 dimensions, deep dive

Then, analyze the project across 8 dimensions sequentially. For each dimension, load the relevant skill and delegate to the appropriate subagent.

### 1. System Structure
- **Load:** `clean-ddd-hexagonal` skill
- **Delegate:** `software-architect` and `backend-architect` subagents in parallel.
- **Output:** Component hierarchy, module boundaries, architectural pattern adherence

### 2. Design Patterns
- **Load:** `design-patterns` skill
- **Delegate:** `code-reviewer` subagent.
- **Output:** Pattern usage, anti-patterns, consistency across codebase

### 3. Dependency Architecture
- **Load:** `dependency-audit` skill
- **Delegate:** `dependency-manager` subagent.
- **Output:** Coupling metrics, circular dependencies, DI effectiveness

### 4. Data Flow
- **Load:** `observability-and-instrumentation` skill
- **Delegate:** `platform-engineer` subagent
- **Output:** Traceability, state management, persistence strategies

### 5. Scalability and Performance
- **Load:** `performance-analysis` skill
- **Delegate:** `performance-benchmarker` and domain-specific subagents in parallel.
- **Output:** Bottlenecks, caching strategies, resource management

### 6. Security
- **Load:** `security-and-hardening` skill
- **Delegate:** `security-auditor`, `penetration-tester`, `security-architect` and `security-compliance-auditor` subagents in parallel.
- **Output:** Trust boundaries, auth/authz patterns, data protection

### 7. Testability
- **Load:** `test-driven-development` skill
- **Delegate:** `test-engineer` subagent.
- **Output:** Coverage, test quality, untested areas

### 8. Documentation
- **Load:** `documentation-and-adrs` skill
- **Delegate:** `technical-writer` subagent.
- **Output:** Comment quality, API docs completeness, ADR coverage

Before finalizing, use the `question` tool to resolve ambiguities:
- Flag findings that could be **false positives** — ask the user to confirm
- Ask if any observation is **intentional** — the user may have a valid reason
- Let the user dismiss, accept, or modify each disputed finding

For each dimension, the subagent returns findings categorized as:
- **Critical** — must fix immediately (blocks production)
- **High** — should fix soon (within sprint)
- **Medium** — should fix eventually (within quarter)
- **Low** — nice to fix (backlog)

## Phase 2: Generate `TECH_DEBT.md`

Create or update entries in @docs/TECH_DEBT.md with this content:

- TD-XXX identifier
- Analysis date
- Type of scan (quick, standard, deep)
- Total findings by severity
- Summary of findings by severity
- Detailed findings for each issue
- Methodology used

## Suggested Next Step

> Analysis complete. Run `/diagnosis` on critical findings to create diagnostic documents, then `/plan` to create implementation plans for the fixes.
