# ADR-007: Template Resolution for bunx/npm Mode

## Status
Accepted

## Date
2026-06-17

## Author
Quetzalcoatl (Visionary Sage)

## Context

Códice is distributed via two channels:

1. **Compiled binary** (GitHub Releases) — template resolved relative to `process.execPath`
2. **npm package** (`@fisherk2-dev/codice`) via `bunx` — template resolved relative to `import.meta.dir`

ADR-006 established npm publication as the primary distribution method. However, `TemplateResolver.detectTemplateRoot()` only implemented two detection paths:

```typescript
// v1.0.4 — two paths only
private detectTemplateRoot(): string {
  // Ruta 1: Modo compilado (binario)
  const compiledPath = path.resolve(process.execPath, '../template/');
  if (await this.exists(compiledPath)) return compiledPath;

  // Ruta 2: Modo source (desarrollo)
  const sourcePath = path.resolve(import.meta.dir, '../../template/');
  if (await this.exists(sourcePath)) return sourcePath;

  throw new TemplateNotFoundError('Template file not found');
}
```

In `bunx` mode, the package is installed at `node_modules/@fisherk2-dev/codice/`. The entry point `src/cli/main.ts` has `import.meta.dir` pointing to `src/cli/`. The template directory is at `template/` (one level up from `src/`), not two levels up.

**Directory structure in bunx mode:**

```
node_modules/@fisherk2-dev/codice/
├── src/
│   ├── cli/
│   │   └── main.ts          ← import.meta.dir = .../src/cli/
│   └── ...                  ← src/ (template is NOT here)
└── template/                 ← template is HERE (../template/ from src/cli/)
```

**Path resolution analysis:**

| Mode | `process.execPath` | `import.meta.dir` | Template path | Works? |
|------|-------------------|-------------------|---------------|--------|
| Compiled binary | `/path/to/codice-linux` | N/A | `../template/` → `/path/to/template/` | ✅ Yes |
| Source development | N/A | `/repo/src/cli/` | `../../template/` → `/repo/template/` | ✅ Yes |
| bunx/npm | `/usr/local/bin/bun` | `.../node_modules/@fisherk2-dev/codice/src/cli/` | `../../template/` → `.../node_modules/@fisherk2-dev/codice/template/` | ❌ No (off by one level) |

The missing path is `../template/` relative to `import.meta.dir` in bunx mode.

## Decision

Add a third detection path to `TemplateResolver.detectTemplateRoot()` for bunx/npm mode:

```typescript
// v1.0.5 — three paths
private detectTemplateRoot(): string {
  // Ruta 1: Modo compilado (binario)
  const compiledPath = path.resolve(process.execPath, '../template/');
  if (await this.exists(compiledPath)) return compiledPath;

  // Ruta 2: Modo bunx/npm (paquete en node_modules)
  const bunxPath = path.resolve(import.meta.dir, '../template/');
  if (await this.exists(bunxPath)) return bunxPath;

  // Ruta 3: Modo source desarrollo (raíz del repo)
  const sourcePath = path.resolve(import.meta.dir, '../../template/');
  if (await this.exists(sourcePath)) return sourcePath;

  throw new TemplateNotFoundError('Template file not found');
}
```

The detection order is:
1. Compiled binary mode (most specific, highest priority)
2. bunx/npm mode (package in node_modules)
3. Source development mode (repo root)

## Consequences

### Positive

- **bunx/npm mode works**: `bunx @fisherk2-dev/codice` now resolves templates correctly in all three execution contexts
- **Backward compatible**: Existing compiled binary and source development modes continue to work unchanged
- **No configuration required**: Detection is automatic based on filesystem existence checks
- **ADR-006 validated**: Confirms that npm publication as primary distribution is viable

### Negative

- **Slightly more complex**: Three detection paths instead of two increases cognitive load for future maintainers
- **Order sensitivity**: The detection order matters; swapping paths could cause incorrect resolution in edge cases
- **Test coverage required**: Each path needs explicit integration tests to prevent regression

### Neutral

- **No performance impact**: Each `exists()` check is a fast filesystem stat call; the cascade completes in microseconds
- **No API changes**: The public interface of `TemplateResolver` remains unchanged
- **No breaking changes**: Existing users of compiled binaries or source mode see no difference

## Compliance

- ADR-002 (Bun compilation) remains valid — compiled binary path is preserved as Ruta 1
- ADR-003 (Atomic staging) is unaffected — file merge engine behavior is identical
- ADR-004 (@clack/prompts) is unaffected — TUI layer is unchanged
- ADR-005 (`--dest` flag) is unaffected — CLI arguments and behavior are identical
- ADR-006 (npm publication) is now fully functional — the primary distribution method works as intended

## References

- [SPEC.md](../../SPEC.md) — Central specification, §Runtime Constraints
- [ADR-006: npm Publication as Primary Distribution](./adr-006-npm-publication.md) — Context for bunx mode
- [TemplateResolver.ts](../../src/infrastructure/adapters/TemplateResolver.ts) — Implementation
- [Issue #6](https://github.com/fisherk2/11-codice-opencode/issues/6) — Bug report
