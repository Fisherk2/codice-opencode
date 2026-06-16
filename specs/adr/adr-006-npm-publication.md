# ADR-006: npm Publication as Primary Distribution Method

**Status:** Accepted

**Date:** 2026-06-16

**Author:** Fisherk2

## Context

Códice was initially distributed exclusively as a compiled binary via GitHub Releases. Users had to:

1. Download the correct binary for their platform (`codice-linux`, `codice-macos`, `codice-windows.exe`)
2. Make it executable (`chmod +x`)
3. Run it

This approach works well for offline/air-gapped environments and users without a runtime, but it adds friction for the primary use case: a quick, one-command workspace installation.

The reference project [awesome-opencode](https://github.com/weisser-dev/awesome-opencode) demonstrates a simpler UX with `npx @weisser-dev/awesome-opencode` — a single command that downloads and runs the tool directly.

Códice is built with [Bun](https://bun.sh), which provides `bunx` (equivalent to `npx`) — allowing npm packages to be executed directly without global installation.

## Decision

We will publish Códice as the npm package `@fisherk2/codice` and establish `bunx @fisherk2/codice` as the **official, primary** installation method.

The compiled binary (via `bun build --compile`) will be maintained as an **alternative, offline/air-gapped** distribution method.

### Dual Distribution Strategy

| Method | Command | Runtime Required | Use Case |
|--------|---------|------------------|----------|
| **npm (primary)** | `bunx @fisherk2/codice` | Bun | Quick setup, CI with Bun, daily use |
| **Binary (alternative)** | `./codice` | None | Offline, air-gapped, CI without Bun, Docker |

### Package Configuration

- **Scope:** `@fisherk2` (organization on npmjs.com)
- **Name:** `codice`
- **Entry point:** `src/cli/main.ts` (via `bin` field)
- **Runtime deps:** `@clack/prompts`, `semver` (moved from devDependencies)
- **Access:** Public (scoped packages require `"publishConfig": { "access": "public" }`)

## Consequences

### Positive

- **Simpler UX:** `bunx @fisherk2/codice` is shorter and more discoverable than downloading a binary
- **Automatic updates:** `bunx` always fetches the latest version (unless cached)
- **Consistency with ecosystem:** Matches the pattern established by awesome-opencode and other npx/bunx tools
- **Smaller initial download:** The npm package is source + templates (~KB), not a 74MB compiled binary
- **npm ecosystem integration:** Version management, dependents tracking, discoverability on npmjs.com

### Negative

- **Requires Bun:** The `bunx` method requires Bun to be installed. Users without Bun must use the binary
- **Dual maintenance:** Both the npm package and the compiled binary must be kept in sync
- **Template resolution complexity:** The `TemplateResolver` must detect whether it's running in source mode (via `import.meta.dir`) or compiled mode (via `process.execPath`) to locate template files
- **First publication overhead:** Requires npm account, organization setup, MFA configuration, and token generation

### Neutral

- **Dependencies move from devDependencies to dependencies:** `@clack/prompts` and `semver` become runtime deps (~400KB total). This is correct since they are required at runtime
- **CI pipeline:** `release.yml` gains an additional job to publish to npm on tagged releases

## Compliance

- ADR-002 (Bun compilation) remains valid — the binary distribution path is preserved
- ADR-003 (Atomic staging) is unaffected — the file merge engine and atomicity guarantees are identical regardless of distribution method
- ADR-005 (`--dest` flag) is unaffected — the CLI arguments and behavior are identical

## References

- [SPEC.md](../../SPEC.md) — Central specification
- [ADR-002: Bun as Runtime/Compiler](./adr-002-bun-compilation.md) — Binary compilation decision
- [npm Granular Access Tokens](https://docs.npmjs.com/cli/v11/commands/npm-token) — Token creation with --bypass-2fa and --scopes
- [awesome-opencode](https://github.com/weisser-dev/awesome-opencode) — Reference project using npx distribution
