# ADR-011: Binary Removal

**Status:** Accepted

**Date:** 2026-07-28

**Author:** Fisherk2

## Context

Códice was originally distributed via two parallel methods:

1. **npm package** (`@fisherk2-dev/codice`) — source + template files, executed via `bunx` or `npx`
2. **Compiled binary** (`codice-linux`, `codice-macos`, `codice-windows.exe`) — attached to GitHub Releases

Since ADR-006 established npm as the primary distribution method, the compiled binary has been maintained as a secondary distribution path. Maintaining this dual distribution has several costs:

- **CI complexity:** Binary compilation requires cross-platform build steps in CI/CD workflows (ci.yml, release.yml), increasing pipeline complexity and failure surface.
- **Build system maintenance:** `bun build --compile` flags change across Bun versions, requiring ongoing maintenance of three target platform flags.
- **Test complexity:** E2E tests require a `setup_binary` function with fallback logic (binary → `bun run`), adding ~60 lines of infrastructure code.
- **Binary size:** Compiled binaries are ~74MB each, bloating release assets despite GitHub's LFS-free allowance.
- **Source code complexity:** The `TemplateResolver`, `version.ts`, and `output.ts` all have conditional logic and comments for "compiled mode" vs "source mode", adding cognitive overhead.
- **User confusion:** Two installation methods create support surface ("Permission denied" errors, binary not found, platform mismatch).
- **Low usage:** The primary distribution method (`bunx @fisherk2-dev/codice`) serves >95% of users. The binary serves mainly air-gapped environments.

The project's maturity and user adoption patterns now justify removing the secondary path entirely.

## Decision

Remove all binary compilation and distribution logic from Códice. The only installation method will be via package managers (`bunx @fisherk2-dev/codice`).

### Specific Changes

1. **Remove build recipes** from Justfile (`build`, `build-all`, `release`)
2. **Remove binary compilation** from CI/CD workflows (ci.yml, release.yml)
3. **Remove binary resolution logic** from E2E test infrastructure (setup_binary in common.sh)
4. **Update package.json** — remove `scripts.build`, `scripts.build:all`, update `scripts.clean`
5. **Update source code comments** — remove references to "compiled mode" vs "source mode"
6. **Update documentation** — README, CONTRIBUTING, SPEC.md, Wiki pages
7. **Remove binary-specific ADR references** — update ADR-002, ADR-006
8. **Add ADR-011** (this document)

### What Stays

- **Historical binary artifacts** in past GitHub Releases (v1.1.3 and earlier) remain available for download
- **Source code distribution** via npm remains the primary path (unchanged)
- **`bunx @fisherk2-dev/codice`** remains the recommended installation command

### Version

This change ships as **v1.2.0** (minor bump, no breaking change for >95% of users).

## Consequences

### Positive

- **Reduced maintenance burden:** ~30% reduction across CI, test infrastructure, and build system
- **Simpler CI/CD:** ci.yml drops ~30 lines, release.yml drops ~40 lines
- **Simpler E2E tests:** `setup_binary` function (50+ lines) replaced with direct `bun run`
- **Smaller npm package:** No dist/ directory in the published tarball
- **Cleaner codebase:** No more conditional "compiled mode" logic or comments
- **Faster CI:** No 2-3 minute binary compilation step per platform
- **Reduced cognitive load:** Only one distribution method to reason about

### Negative

- **Breaking for <5% of users:** Users in air-gapped environments or without Bun/Node.js must install a runtime
- **Loss of offline distribution:** Users can no longer download a single binary and run without any runtime
- **No "zero runtime" path:** The installer now requires Bun (or Node.js with npm/npx)

### Migration Path

Users currently using the compiled binary should transition to:

```bash
# Recommended: use bunx
bunx @fisherk2-dev/codice

# Alternative: use npx
npx @fisherk2-dev/codice

# Or install globally and run
npm install -g @fisherk2-dev/codice
codice
```

For air-gapped environments, users can use `npm pack` to download the tarball on a connected machine and transfer it:

```bash
# On connected machine:
npm pack @fisherk2-dev/codice
# Transfer the .tgz file to the air-gapped machine
# On air-gapped machine:
npm install -g ./fisherk2-dev-codice-*.tgz
codice
```

## Compliance

- ADR-002 (Bun compilation) is superseded for distribution (binary compilation removed; Bun remains the development runtime)
- ADR-006 (npm publication) is reinforced — npm is now the sole distribution method
- ADR-007 (Template resolver source mode) is simplified — source mode is now the only mode

## References

- Issue [#46](https://github.com/fisherk2/codice-opencode/issues/46) — Binary removal tracking
- [ADR-002: Bun as Runtime/Compiler](./adr-002-bun-compilation.md) — Original binary compilation decision
- [ADR-006: npm Publication as Primary Distribution](./adr-006-npm-publication.md) — npm-first distribution
- [SPEC.md](../../SPEC.md) — Central specification (updated SC-15, SC-16)
- [FEV-11 Plan](../../tasks/plan.md) — Implementation plan
- [FEV-11 Audit Results](../../docs/diagnosis/fix04-audit-results.md) — Comprehensive binary reference audit
