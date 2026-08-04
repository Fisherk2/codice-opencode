---
name: changelog-generate
description: Generate CHANGELOG.md and create releases from git history in Keep a Changelog format with Added, Changed, Deprecated, Removed, Fixed, and Security categories. Use when preparing a release, drafting release notes, or backfilling a changelog.
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: general
---

## What I do

- Parse git history (commits, tags, PR titles) since the last release
- Categorize changes into Keep a Changelog sections
- Generate or update CHANGELOG.md with properly formatted entries
- Link entries to commits or PRs where available
- Determine the appropriate next version based on change types
- Draft release notes grouped by category
- Propose a semantic version bump following Conventional Commits
- Generate a `gh release create` command for publishing

## When to use me

Use this skill when you need to:
- Generate a changelog for an upcoming release
- Update CHANGELOG.md after a batch of changes
- Convert unstructured git history into a formatted changelog
- Backfill a changelog for a project that doesn't have one
- Draft release notes with version bump and GitHub release command
- Prepare a tagged release with release notes

## Process

1. **Find the baseline**: Identify the last release tag
   ```bash
   git describe --tags --abbrev=0
   ```

2. **Collect commits**: List all commits since the baseline
   ```bash
   git log v1.2.3..HEAD --pretty=format:"%H %s" --reverse
   ```

3. **Collect merged PRs** (if using GitHub):
   ```bash
   gh pr list --state merged --search "merged:>=2024-01-01" --json number,title,labels
   ```

4. **Categorize**: Map each commit/PR to a changelog section
   - `feat:` or label `enhancement` -> **Added**
   - `change:` or `refactor:` -> **Changed**
   - `deprecate:` -> **Deprecated**
   - `remove:` -> **Removed**
   - `fix:` or `bug:` or label `bug` -> **Fixed**
   - `security:` or label `security` -> **Security**
   - `perf:` -> **Changed**
   - `BREAKING CHANGE` or `!` suffix -> flagged as breaking
   - `chore:`, `ci:`, `docs:`, `test:` -> Omit unless significant

5. **Format**: Write entries following Keep a Changelog

6. **Determine version**: Follow Semantic Versioning
   - **BREAKING CHANGE** or `!` suffix -> Major bump
   - **Added** or **Security** -> Minor bump
   - **Fixed** only -> Patch bump
   - Follow [Conventional Commits](https://www.conventionalcommits.org/) for mapping

7. **Update file**: Prepend the new release section to CHANGELOG.md

8. **Publish release** (optional): Create the GitHub release
   ```bash
   gh release create vX.Y.Z --title "vX.Y.Z" --notes-file release-notes.md
   ```

## Output Format

Follow [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.3.0] - 2024-06-15

### Added
- User export functionality for CSV and JSON formats (#142)
- Rate limiting middleware with configurable thresholds (#138)

### Changed
- Upgraded database driver from v2 to v3 for connection pooling (#145)

### Fixed
- Race condition in concurrent session handling (#140)
- Incorrect timezone conversion for UTC-offset dates (#137)

### Security
- Updated `xml-parser` to 2.1.0 to fix CVE-2024-XXXXX (#143)
```

## Commit Message Mapping

| Prefix | Category | Example |
|--------|----------|---------|
| `feat:` | Added | `feat: add CSV export` |
| `fix:` | Fixed | `fix: correct timezone handling` |
| `refactor:` | Changed | `refactor: simplify auth flow` |
| `deprecate:` | Deprecated | `deprecate: old v1 endpoint` |
| `remove:` | Removed | `remove: legacy XML support` |
| `security:` | Security | `security: patch XSS in templates` |
| `perf:` | Changed | `perf: optimize query execution` |
| `BREAKING CHANGE` / `!` | Breaking (flagged) | `feat!: redesign auth` |

## Rules

- Follow [Keep a Changelog](https://keepachangelog.com/) specification exactly
- Follow [Semantic Versioning](https://semver.org/) for version numbers
- Follow [Conventional Commits](https://www.conventionalcommits.org/) for commit parsing
- Always include the `[Unreleased]` section at the top
- Each entry should be human-readable, not a raw commit message
- Include PR or issue numbers as links when available
- Group related commits into a single changelog entry
- Do not include internal chores unless they affect end users
- Dates must use ISO 8601 format (YYYY-MM-DD)
- Maintain reverse chronological order (newest first)
- Credit contributors when possible
