# ADR-002: Bun as Runtime and Compiler

## Status
Superseded (see ADR-011)

> **Note — v1.2.0 (ADR-011):** Binary compilation was removed in v1.2.0. Bun remains the development runtime, but standalone binary distribution is no longer supported. The only installation method is via `bunx @fisherk2-dev/codice` or `npx @fisherk2-dev/codice`. See [ADR-011: Binary Removal](./adr-011-binary-removal.md) for details.

## Context
The CLI must be distributed as a single binary with zero runtime dependencies. Users should not need Node.js, Bun, or any other runtime installed. *(Note: this requirement was removed in v1.2.0 — ADR-011)*

## Decision
Use Bun (>= 1.1.x) for both development and compilation:
- Development: `bun run src/cli/main.ts`
- Compilation: `bun build --compile src/cli/main.ts --outfile ./dist/codice`
- Runtime APIs: Bun.file(), Bun.write(), fetch() via Bun

## Consequences
### Positive
- Single native binary output
- Superior startup time vs Node.js + pkg
- Modern fs API (Bun.file, Bun.write)
- Built-in test runner (bun:test)
- Cross-platform compilation (Linux, macOS, Windows x64)

### Negative
- Bun is newer/less mature than Node.js
- Smaller ecosystem than npm
- Some Node.js APIs may behave differently
- CI/CD must install Bun on runners

## Alternatives Considered
- **Node.js + pkg**: Rejected — larger binary size, slower startup, pkg is deprecated
- **Deno + compile**: Rejected — Deno compile has limitations with dynamic imports and npm compatibility
- **Go/Rust**: Rejected — would require rewriting template logic in another language, losing TypeScript type safety

## References
- AGENTS.md §Tech Stack
- SPEC.md §Tech Stack
