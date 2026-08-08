# Technical Debt — Códice

**Last updated:** 2026-08-07
**Status:** v2.0.0 released — 1920 tests, 30/30 E2E, coverage 95.68% overall / 99.12% production `src/`
**Current version:** v2.0.0
**Next version:** v2.3.0 (pack removal, i18n, alternative package managers)

---

## Resolved Debt (v1.x → v2.0.0)

All technical debt from v1.x and v2.0.0 development has been resolved. For historical reference:

| Version | Key Resolutions |
|---------|-----------------|
| **v1.1.0** | IFileSystem port split (ISP), TypeScript 6.x upgrade, npm packaging tests |
| **v1.1.1** | Code review fixes (11 findings), documentation synchronization |
| **v1.2.0** | Binary removal (ADR-011), references restructuring, documentation overhaul, UX enhancements (progress bar, /help), community standards (Code of Conduct) |
| **v2.0.0** | Agent pack system (FEV-17/18), permission unification (FEV-19), plugin auto-discovery (FEV-20), installer UX v2 (FEV-21/22), testing closure (FEV-23) |

**Resolved in v2.0.0 (FEV-17 to FEV-23):**
- Template directory restructuring → pack-based organization
- 352 agents across 10 packs (8 selectable + 2 mandatory)
- Permission unification (106 allow-list entries removed)
- VALID_SUBAGENTS hardcoded set removed (auto-discovery)
- Pack selection wizard + version-gated updates
- Install summary screen
- Coverage gate achieved (95.68% overall)
- 30/30 E2E scenarios passing

---

## Known Limitations

### Tarball Size (8.0MB vs SC-15 <5MB)

SC-15 requires npm tarball < 5MB. The pack system (ADR-014) deliberately ships all 8 selectable packs, bringing the tarball to **8.0MB** (797 files). This deviation was accepted 2026-08-04 as a trade-off of the pack system. Will be revisited if distribution size becomes a user concern.

**Mitigation options (future):** (a) Lazy-download packs; (b) gzip-compress agent bodies; (c) split packs into separate npm packages.

### Nested `.gitignore` Files Excluded by npm

npm excludes `.gitignore` files at any depth. Files like `template/obligatorio/core/skills/ui-ux-design-pro/cli/.gitignore` are not in the published tarball. These serve internal skill development purposes only.

---

## Open Debt for v2.3.0

| ID | Item | Effort | Risk | Description |
|----|------|--------|------|-------------|
| **TD-V2-6** | No pack removal mechanism | 4-6h | Medium | Once installed, agents from a pack persist in destination. Users cannot remove a pack without reinstalling from scratch. Requires `--remove-pack <id>` flag or new installer mode. |

### Planned Features (v2.3.0)

| Feature | Issue | Effort | Description |
|---------|-------|--------|-------------|
| **Alternative Package Managers** | [#24](https://github.com/fisherk2/codice-opencode/issues/24) | 8-12h | uv, cargo, composer, pnpm, yarn support |
| **Internationalization (i18n)** | [#22](https://github.com/fisherk2/codice-opencode/issues/22) | 6-10h | Language selection (English, Spanish, +3 more) |
| **Pack Removal** | TD-V2-6 | 4-6h | `--remove-pack <id>` flag |
| **Pack Update Diff** | — | 3-4h | Show changelog for user's installed packs during update |

---

## Summary

| Category | Status |
|----------|--------|
| v1.x debt | ✅ All resolved |
| v2.0.0 debt | ✅ All resolved |
| Open items | 1 (TD-V2-6: pack removal) |
| Planned features | 4 (alternative managers, i18n, pack removal, update diff) |

---

*Maintained by Códice team. Update when tech debt items are added or resolved.*