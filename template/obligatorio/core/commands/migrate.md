---
description: Generate a complete technology stack migration plan with impact analysis, breaking changes, and documentation updates
agent: quetzalcoatl
---

**Optional command** — Only run when the user needs to migrate technologies (frameworks, libraries, databases, architectures). Similar to `/design` which only runs for UI/UX work.

**SDD Flow Position:** Before `/diagnosis`, `/docs-update`, and `/evolve` (migration may require new specs and documentation updates).

## Pre-Flight: Detect Stack

1. Identify project root (where `package.json`, `requirements.txt`, `Gemfile`, `go.mod`, `Cargo.toml`, or similar lives).
2. Read lock files (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `Cargo.lock`, etc.) to detect current versions.
3. Read config files (`tsconfig.json`, `vite.config.ts`, `next.config.js`, `webpack.config.js`, etc.).
4. Use the `question` tool to ask the user: **"What technology do you want to migrate?"** with options:
   - **A) Framework** (e.g., Next.js 14 → 15, React 18 → 19)
   - **B) Language** (e.g., JavaScript → TypeScript, Python 2 → 3)
   - **C) Database** (e.g., PostgreSQL 14 → 16, MongoDB 5 → 6)
   - **D) Architecture** (e.g., monolith → microservices, REST → GraphQL)
   - **E) Other** (specify)

## Phase 1: Impact Analysis

For the selected migration, evaluate:

### Breaking Changes
- Major version bumps in dependencies
- API deprecations and removals
- Configuration format changes
- Runtime requirements (Node version, OS support)

### Dependency Analysis
- Use `@skills/dependency-audit/SKILL.md` to identify affected dependencies
- Check for transitive dependency conflicts
- Identify unmaintained packages

### Code Surface
- Files affected (search for deprecated API usages)
- Tests covering the affected code
- Documentation references

Use `interview-me` skill to ask the user for clarification if multiple migration paths exist.

## Phase 2: Generate Migration Plan

Create `docs/MIGRATION.md` (or update if exists) with:

```markdown
# Migration Plan: [FROM] → [TO]

## Overview
- **Date:** YYYY-MM-DD
- **Scope:** [framework | language | database | architecture]
- **Estimated effort:** Xh
- **Risk level:** [low | medium | high]

## Pre-Migration Checklist
- [ ] Backup current state
- [ ] Document current behavior
- [ ] Identify rollback procedure

## Phase 1: Preparation
1. Update [package.json | requirements.txt | etc.] to new version
2. Run [test command] to identify failures
3. Document baseline metrics

## Phase 2: Code Updates
- [Specific code changes with file paths]
- [Migration codemods if available]
- [Manual interventions required]

## Phase 3: Testing
- [Run full test suite]
- [Visual regression tests if UI changes]
- [Performance benchmarks]

## Phase 4: Documentation
- [Update README]
- [Update CHANGELOG]
- [Update SPEC.md if architecture changes]
- [Update WORKFLOW.md if process changes]

## Phase 5: Deployment
- [Staging deployment]
- [Production deployment with feature flag]
- [Monitoring and rollback triggers]

## Rollback Procedure
- [Exact steps to revert]
- [Data migration reversal if applicable]
- [Communication plan]

## Success Criteria
- [ ] All tests pass
- [ ] Performance within X% of baseline
- [ ] No new bugs filed in first 7 days
```

## Phase 3: Update Affected Documentation

If migration changes architecture or process:

- `docs/WORKFLOW.md` — Update workflow phases if process changes
- `docs/SPEC.md` — Update spec if requirements change
- `specs/` — Update affected modular specs
- `README.md` — Update installation/usage instructions if user-facing

## Rules

1. **Always include rollback procedure** — every migration must be reversible.
2. **Never skip impact analysis** — even for "minor" version bumps, breaking changes can hide.
3. **Atomic commits per phase** — don't bundle migration phases into a single commit.
4. **Preserve git history** — use `git mv` for renames, never delete + create.
5. **Test before and after** — capture baseline metrics.
6. **Document as you go** — update MIGRATION.md in the same commit as the code change.

## Skills Used

- `@skills/dependency-audit/SKILL.md` — for analyzing dependency impact
- `@skills/interview-me/SKILL.md` — for clarifying migration scope
- `@skills/deprecation-and-migration/SKILL.md` — for planning the migration
- `@skills/test-driven-development/SKILL.md` — for writing tests for the new stack
- `@skills/changelog-generate/SKILL.md` — for documenting changes

## Suggested Next Step

> Migration plan generated. Run `/build` to execute Phase 1 (preparation), then `/test` to verify, then commit each phase atomically.
