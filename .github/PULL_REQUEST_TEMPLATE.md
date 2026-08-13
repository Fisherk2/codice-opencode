---
name: Pull Request
about: Describe your changes to review before merging
title: ''
labels: ''
assignees: ''

---

## Description

<!--
  Please include a summary of the change and which issue is fixed.
  Format: Fixes #<issue_number>
-->

Fixes #<!-- issue number -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactor / chore / tech debt
- [ ] Documentation update

## Checklist

- [ ] `just check` passes locally (lint + format + typecheck)
- [ ] `bun test` passes (unit + integration)
- [ ] E2E tests pass: `just test-e2e` (if applicable)
- [ ] No `any` types introduced in production code
- [ ] Public API or CLI commands documented (if changed)
- [ ] ADR created / updated (if architecture decision changed — see `docs/ARCHITECTURE.md`)
- [ ] Branch protection rules satisfied (CI green on all platforms)

## Testing

Brief description of how you tested this change:

## Screenshots (if applicable)

If changes include UI updates, please include screenshots.

## Post-merge Checklist (Maintainer)

- [ ] Squash merge into `develop` (or `main` for hotfixes)
- [ ] Sync `develop` ← `main` after production release
- [ ] Delete branch