---
description: Perform multi-dimensional architectural analysis.
agent: tezcatlipoca
---

## Pre-Flight: Detect Project Type

**Delegate** `codebase-onboarding-engineer` subagent and **Load** `codebase-onboarding` skill to understand the project:

1. Identify project root and tech stack (read metadata/dependency files, lock files, config files, manifests, etc.).
2. Detect language(s), framework(s), and architecture pattern (monolith, microservices, serverless, etc.).
3. Count source files, test files, and documentation files.
4. Estimate codebase size (LOC, file count) to scope analysis depth.

## Phase 1: Multi-Dimensional Analysis

Use `question` tool to ask: **"What analysis depth do you want?"**:
- **A) Quick scan** — Surface-level issues only
- **B) Standard analysis** — All 8 dimensions, medium depth
- **C) Deep audit** — All 8 dimensions, deep dive

Then, **Load** `doubt-driven-development` skill and analyze the project across 8 dimensions sequentially. For each dimension, load the relevant skill and delegate to the appropriate subagents:

### 1. System Structure
- **Delegate:** `software-architect` and `backend-architect` subagents in parallel.
- **Load:** `clean-ddd-hexagonal` skill
- **Output:** Component hierarchy, module boundaries, architectural pattern adherence, layer separation

### 2. Design Patterns
- **Delegate:** `code-reviewer` subagent.
- **Load:** `design-patterns` skill
- **Output:** Pattern usage, anti-patterns, consistency across codebase, design pattern effectiveness

### 3. Dependency Architecture
- **Delegate:** `dependency-manager` subagent.
- **Load:** `dependency-audit` skill
- **Output:** Coupling metrics, circular dependencies, DI effectiveness, version conflicts

### 4. Data Flow
- **Load:** `observability-and-instrumentation` skill
- **Delegate:** `platform-engineer` subagent.
- **Output:** Traceability, state management, persistence strategies, data flow optimization

### 5. Scalability and Performance
- **Delegate:** `performance-benchmarker` and domain-specific subagents in parallel.
- **Load:** `performance-analysis` skill
- **Output:** Bottlenecks, caching strategies, resource management, scalability patterns

### 6. Security
- **Delegate:** `security-auditor`, `ai-generated-code-auditor`, `appsec-engineer`, `senior-secops`, `penetration-tester`, `security-architect` and `security-compliance-auditor` subagents in parallel.
- **Load:** `security-and-hardening` and `security-audit` skill 
- **Output:** Trust boundaries, auth/authz patterns, data protection, vulnerabilities

### 7. Testability
- **Delegate:** `test-engineer` subagent.
- **Load:** `test-driven-development` skill
- **Output:** Coverage, test quality, untested areas, gaps, test strategy

### 8. Documentation
- **Delegate:** `technical-writer` subagent.
- **Load:** `documentation-and-adrs` skill
- **Output:** Comment quality, API docs completeness, ADR coverage, mermaid diagrams, missing docs

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

**Delegate** to `docs-writer` subagent and **Load** `tech-debt` skill to create and/or update entries in @docs/TECH_DEBT.md with this requirements:

- TD-XXX identifier
- Analysis date
- Type of scan (quick, standard, deep)
- Total findings by severity
- Summary of findings by severity
- Detailed findings for each issue
- Methodology used

## Phase 3: Finalize

1. **Analysis is complete — do NOT touch or implement code files.**
2. Use the `question` tool to confirm with the user before proceeding.
3. Make atomic commits for each meaningful changes with a descriptive message, **Load** `git-workflow-and-versioning` skill to follow best practices and conventions.

## Rules

- Use the `question` tool to resolve ambiguities with the user
- Go for each dimension in order
- If `docs/TECH_DEBT.md` doesn't exist, create it
- Don't implement or fix anything, just document them.
- Research external sources and/or oficial documentation to contrast your findings.
- **Never** write to `tasks/` directories.

## Suggested Next Step

> Analysis complete. Run `/diagnosis` on critical findings to create diagnostic documents, then `/plan` to create implementation plans for the fixes.

---

User instructions:

