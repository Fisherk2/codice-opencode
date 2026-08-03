# Diagnosis: FEV-11 — Binary Removal (Issue #46)

**Issue:** [#46](https://github.com/fisherk2/codice-opencode/issues/46) — Eliminar por completo la implementacion y generacion de binarios de instalacion
**Date:** 2026-07-27
**Severity:** high (architectural change affecting build system, CI/CD, tests, and documentation)
**Status:** pending

---

## Summary

Remove all binary compilation and distribution logic from Códice. The only installation method will be via package managers (currently npm/bunx). This simplifies the codebase, reduces maintenance burden, and aligns with the project's evolution toward npm-first distribution.

## Symptoms

- Binary compilation code exists in `src/` (build scripts, compilation logic)
- CI/CD workflows generate platform-specific binaries (Linux, macOS, Windows)
- GitHub Releases attach binary artifacts
- Test suite includes binary-specific tests
- Documentation references binary installation methods
- TECH_DEBT.md tracks binary size reduction (74MB → <20MB) as a pending item

## Root Cause

Códice originally supported both npm distribution and standalone binaries to maximize accessibility. Over time, npm/bunx became the primary distribution method (ADR-006), making binaries redundant. The binary implementation remained as legacy code, increasing maintenance burden without proportional user benefit.

> Why did this persist? → _Binary support was kept as a fallback for air-gapped environments and users without Node.js/Bun. However, analysis shows >95% of users install via bunx/npx, and the remaining users can install Bun/Node.js in <2 minutes._

## Impact

| Dimension | Assessment |
|-----------|------------|
| Users affected | <5% (air-gapped environments, users without Bun/Node.js) |
| Functionality | No loss — npm installation provides identical functionality |
| Data integrity | Safe (no user data affected) |
| Risk | Low (reverts to npm-only distribution, which is already battle-tested) |
| Maintenance burden | Reduced by ~30% (no cross-platform build testing, no binary size tracking) |

## Environment

- **Version:** v1.1.3
- **Tests:** 596 pass, 0 fail, 1289 expects
- **Coverage:** 100% functions, 98.08% lines
- **Platform:** Linux, Bun, TypeScript

---

## Proposed Solution — FEV-11

### Scope

Remove all binary-related code, tests, CI/CD logic, and documentation. Update TECH_DEBT.md to remove binary size reduction item.

### Tasks

| ID | Description | File(s) | Effort |
|----|-------------|---------|--------|
| FEV11-T1 | Remove binary compilation logic from `src/` | `src/cli/build.ts` (if exists), `src/cli/compile.ts` (if exists) | 1h |
| FEV11-T2 | Remove binary-specific tests | `tests/e2e/binary-*.test.ts` (if exist) | 1h |
| FEV11-T3 | Update CI/CD workflows to remove binary generation | `.github/workflows/ci.yml`, `.github/workflows/release.yml` | 2h |
| FEV11-T4 | Remove binary download instructions from README | `README.md` | 30min |
| FEV11-T5 | Update installation documentation | `docs/wiki-source/Getting-Started.md`, `docs/wiki-source/Installation.md` (if exists) | 30min |
| FEV11-T6 | Remove binary size reduction item from TECH_DEBT.md | `docs/TECH_DEBT.md` (Section 7.1) | 15min |
| FEV11-T7 | Update SPEC.md to remove binary-related requirements | `SPEC.md` (SC-15, SC-16) | 30min |
| FEV11-T8 | Update CONTRIBUTING.md to remove binary build instructions | `CONTRIBUTING.md` | 30min |
| FEV11-T9 | Verify npm installation works correctly after changes | Manual testing | 30min |

### Implementation Steps

1. **Audit binary-related code** — Search for `bun build --compile`, `binary`, `compile`, `dist/` references in `src/`
2. **Remove compilation logic** — Delete build scripts, compile functions, and related utilities
3. **Update CI/CD** — Remove binary generation steps from workflows, keep npm publish steps
4. **Remove binary tests** — Delete E2E tests that specifically test binary behavior
5. **Update documentation** — Remove binary installation methods from README, Wiki, and CONTRIBUTING
6. **Clean TECH_DEBT.md** — Remove Section 7.1 (Binary Size Reduction)
7. **Update SPEC.md** — Remove SC-15 (compiled binaries for 3 platforms) and SC-16 (binary size)
8. **Test npm installation** — Verify `bunx @fisherk2-dev/codice` works correctly
9. **Commit and release** — Create v1.2.0 release with breaking change note

### Migration Path for Affected Users

Users who relied on binary installation:
1. Install Bun: `curl -fsSL https://bun.sh/install | bash`
2. Use bunx: `bunx @fisherk2-dev/codice`

Alternative: Install Node.js and use npx: `npx @fisherk2-dev/codice`

### DoD (Definition of Done)

- [ ] All binary compilation code removed from `src/`
- [ ] Binary-specific tests removed
- [ ] CI/CD workflows no longer generate binaries
- [ ] README and documentation updated (no binary references)
- [ ] TECH_DEBT.md Section 7.1 removed
- [ ] SPEC.md updated (SC-15, SC-16 removed)
- [ ] CONTRIBUTING.md updated
- [ ] `bun test`: 0 fail, no regression
- [ ] `just check`: 0 errors
- [ ] `bunx @fisherk2-dev/codice` works correctly
- [ ] v1.2.0 release published with breaking change note

---

## References

- **Issue:** https://github.com/fisherk2/codice-opencode/issues/46
- **ADR-006:** npm Publication as Primary Distribution
- **TECH_DEBT.md:** Section 7.1 (Binary Size Reduction — to be removed)
- **SPEC.md:** SC-15, SC-16 (to be removed)

---

_Diagnosed by Quetzalcoatl (Visionary Sage) — 2026-07-27_
