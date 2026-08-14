# Technical Debt — Códice

**Last updated:** 2026-08-13
**Status:** v2.1.0-beta.1 released — 2052 tests, 31/31 E2E, coverage ≥95% production `src/`
**Current version:** v2.1.0-beta.1
**Next version:** v2.1.1 (action pins, pack removal, i18n)

---

## Resolved Debt (v1.x → v2.0.0)

All technical debt from v1.x and v2.0.0 development has been resolved. For historical reference:

| Version | Key Resolutions |
|---------|-----------------|
| **v1.1.0** | IFileSystem port split (ISP), TypeScript 6.x upgrade, npm packaging tests |
| **v1.1.1** | Code review fixes (11 findings), documentation synchronization |
| **v1.2.0** | Binary removal (ADR-011), references restructuring, documentation overhaul, UX enhancements (progress bar, /help), community standards (Code of Conduct) |
| **v2.0.0** | Agent pack system (FEV-17/18), permission unification (FEV-19), plugin auto-discovery (FEV-20), installer UX v2 (FEV-21/22), testing closure (FEV-23) |
| **v2.1.0-beta.1** | 4 slash commands (`/sync`, `/migrate`, `/deploy`, `/analyze`), SDD intent auto-discovery, bilingual intents, agent delegation protocol (FEV-25), CI/CD hardening (SHA-pins, branch protection, PR/issue templates, npm provenance), SPEC.md modularization (ADR-020) |

**Resolved in v2.0.0 (FEV-17 to FEV-23):**
- Template directory restructuring → pack-based organization
- 352 agents across 10 packs (8 selectable + 2 mandatory)
- Permission unification (106 allow-list entries removed)
- VALID_SUBAGENTS hardcoded set removed (auto-discovery)
- Pack selection wizard + version-gated updates
- Install summary screen
- Coverage gate achieved (95.68% overall)
- 30/30 E2E scenarios passing

**Resolved in v2.1.0-beta.1 (FEV-24 to FEV-25):**
- 4 new slash commands (`/sync`, `/migrate`, `/deploy`, `/analyze`)
- SDD plugin intent auto-discovery (replaces hardcoded INTENT_PATTERNS)
- Bilingual intent support (EN/ES)
- Agent delegation protocol for 6 primary agents (FEV-25)
- CI/CD hardening: SHA-pinned actions, branch protection, PR/issue templates
- npm provenance SLSA v1 on publish
- SPEC.md modularized (441 → 44 lines + 8 sub-specs, ADR-020)
- 2052 tests / 0 fail, 31/31 E2E

---

## Known Limitations

### Tarball Size (8.0MB vs SC-15 <5MB)

SC-15 requires npm tarball < 5MB. The pack system (ADR-014) deliberately ships all 8 selectable packs, bringing the tarball to **8.0MB** (797 files). This deviation was accepted 2026-08-04 as a trade-off of the pack system. Will be revisited if distribution size becomes a user concern.

**Mitigation options (future):** (a) Lazy-download packs; (b) gzip-compress agent bodies; (c) split packs into separate npm packages.

### Nested `.gitignore` Files Excluded by npm

npm excludes `.gitignore` files at any depth. Files like `template/obligatorio/core/skills/ui-ux-design-pro/cli/.gitignore` are not in the published tarball. These serve internal skill development purposes only.

---

## Open Debt for v2.1.1

| ID | Item | Effort | Risk | Description |
|----|------|--------|------|-------------|
| **TD-V2-6** | No pack removal mechanism | 4-6h | Medium | Once installed, agents from a pack persist in destination. Users cannot remove a pack without reinstalling from scratch. Requires `--remove-pack <id>` flag or new installer mode. |
| **TD-V2-7** | Action SHA-pins force Node 24 (deprecated) | 1-2h | Low | `actions/cache`, `actions/checkout`, `extractions/setup-just` pins target Node 20; GitHub forces Node 24. Update to latest majors that support Node 24 to suppress deprecation warnings. |
| **TD-V2-8** | SPEC modularization (ADR-020) | 0h (done) | None | SPEC.md split into 8 sub-specs + index. Completed in v2.1.0-beta.1. |

### Planned Features (v2.1.1+)

| Feature | Issue | Effort | Description |
|---------|-------|--------|-------------|
| **Alternative Package Managers** | [#24](https://github.com/fisherk2/codice-opencode/issues/24) | 8-12h | uv, cargo, composer, pnpm, yarn support |
| **Internationalization (i18n)** | [#22](https://github.com/fisherk2/codice-opencode/issues/22) | 6-10h | Language selection (English, Spanish, +3 more) — partial progress in bilingual intents |
| **Pack Removal** | TD-V2-6 | 4-6h | `--remove-pack <id>` flag |
| **Pack Update Diff** | — | 3-4h | Show changelog for user's installed packs during update |
| **Action SHA-pins Update** | TD-V2-7 | 1-2h | Pin to latest Node 24-compatible majors |

---

## Summary

| Category | Status |
|----------|--------|
| v1.x debt | ✅ All resolved |
| v2.0.0 debt | ✅ All resolved |
| v2.1.0-beta.1 debt | ✅ All resolved (8 items including SPEC modularization) |
| Open items | 1 (TD-V2-6: pack removal) |
| Pending fixes | 1 (TD-V2-7: action SHA-pins for Node 24) |
| Planned features | 5 (alternative managers, i18n, pack removal, update diff, action pin update) |

---

*Maintained by Códice team. Update when tech debt items are added or resolved.*