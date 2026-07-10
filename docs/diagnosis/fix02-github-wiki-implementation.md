# Diagnosis: GitHub Wiki Implementation for Workspace Documentation

**Issue:** [#25](https://github.com/fisherk2/codice-opencode/issues/25) — _Implementar la Wiki en GitHub_
**Date:** 2026-07-09
**Severity:** medium
**Status:** diagnosed

---

## Summary

The project currently maintains workspace documentation in three places: `docs/opencode/` (project root), `template/opcional/docs/opencode/` (template), and what should be a GitHub Wiki. This creates duplication with what should be a GitHub Wiki, and risks becoming outdated relative to the official OpenCode documentation. The proposal is to migrate this documentation to a GitHub Wiki, remove `docs/opencode/` from both the template and project root, and reference the official OpenCode docs instead.

## Symptoms

- Documentation exists in **three** places: `docs/opencode/` (project root), `template/opcional/docs/opencode/` (template), and what should be the Wiki
- Risk of documentation becoming outdated when OpenCode updates their docs
- Users installing the template get documentation that may not match their OpenCode version
- Maintenance burden of keeping template docs in sync with upstream
- Wiki is not enabled or populated
- 74+ cross-references to `docs/opencode/` across CONTRIBUTING.md, README.md, commands, and source code comments

## Root Cause

The documentation strategy was not clearly defined during initial development. The template included comprehensive workspace documentation to help users, but this creates a maintenance burden and duplication. The proper approach is to use GitHub Wiki for project-specific guidance and reference official OpenCode docs for framework-specific information.

> Why is documentation duplicated? → _The template was designed to be self-contained, but this conflicts with the principle of single source of truth. OpenCode's official docs should be the authoritative source for framework usage._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | All workspace users |
| Functionality | Degraded (documentation strategy misalignment) |
| Data integrity | Safe (no data risk) |
| Reproducibility | Always (documentation strategy issue) |

## Environment

- **Platform:** GitHub Wiki, template directory
- **Version:** v1.0.13
- **Configuration:** template/docs/opencode/ structure

## Proposed Solution

Implementation steps:

1. **Enable and Structure GitHub Wiki**
   - Enable Wiki feature in repository settings
   - Create Wiki home page with overview of the workspace
   - Structure Wiki with clear sections:
     - Getting Started
     - Workspace Structure
     - Using Agents
     - Using Commands
     - Using Skills
     - Customization Guide
     - Troubleshooting

2. **Migrate Content from template/docs/opencode/**
   - Identify which files in template/docs/opencode/ should move to Wiki
   - Prioritize user-facing documentation (guides, tutorials, how-tos)
   - Keep only essential reference files in template (if any)
   - Rewrite content to be Wiki-friendly (markdown with relative links)

3. **Reference Official OpenCode Documentation**
   - Add links to [OpenCode official docs](https://opencode.ai/docs/) throughout Wiki
   - Avoid duplicating information that's already in official docs
   - Focus Wiki content on project-specific guidance and customization
   - Create a "Prerequisites" section linking to OpenCode installation

4. **Remove docs/opencode/ from Template and Project Root**
   - Remove `template/opcional/docs/opencode/` directory (12 files)
   - Remove `docs/opencode/` directory from project root (12 files)
   - Remove the `docs/opencode` entry from `FileRuleManifestData.ts` (line 167-171)
   - Update any internal links that reference these files
   - Test template installation to ensure no broken references

5. **Update CONTRIBUTING.md and README.md**
   - Add link to GitHub Wiki in README.md
   - Update CONTRIBUTING.md to reference Wiki for workspace documentation
   - Add section explaining how to contribute to the Wiki
   - Document the documentation strategy (Wiki for user guides, official docs for framework)

6. **Create Wiki Contribution Guidelines**
   - Document how to edit Wiki pages
   - Establish style guide for Wiki content
   - Define review process for Wiki changes
   - Add template for new Wiki pages

7. **Add Cross-References**
   - Update template files to reference Wiki instead of local docs
   - Add Wiki links in agent documentation where appropriate
   - Update command documentation to link to relevant Wiki pages
   - Ensure all references are current and accurate

## Workarounds

> ⚠️ **WORKAROUND**
> Currently, users can refer to template/docs/opencode/ for workspace documentation. However, this may become outdated. Users should also consult the official OpenCode documentation at https://opencode.ai/docs/ for framework-specific information.

## Recurrences

| Date | Similar Issue | Variation |
|------|---------------|-----------|
| 2026-06-27 | FEV-4 documentation updates | Documentation synchronization across multiple files |

_This pattern of documentation duplication has occurred before. Consider establishing a clear documentation strategy for future features._

## References

- [Issue #25](https://github.com/fisherk2/codice-opencode/issues/25)
- [OpenCode Official Documentation](https://opencode.ai/docs/)
- [docs/opencode/](../docs/opencode/) — Project root (12 files, to be removed)
- [template/opcional/docs/opencode/](../template/opcional/docs/opencode/) — Template copy (12 files, to be removed)
- [src/domain/entities/FileRuleManifestData.ts](../src/domain/entities/FileRuleManifestData.ts) — Line 167-171: manifest entry to remove
- [CONTRIBUTING.md](../CONTRIBUTING.md) — 10 references to docs/opencode/
- [README.md](../README.md) — 2 references to docs/opencode/
- [specs/spec-file-rules.md](../specs/spec-file-rules.md) — 2 references to docs/opencode/

---

_Diagnosis created by `/diagnosis`. Update this file if the fix reveals additional insights._
