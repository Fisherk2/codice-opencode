# ADR-007: Template Resolution for bunx/npm Mode

## Status
Accepted (partially superseded)

> **Note — v1.2.0 (ADR-011):** The compiled binary mode (Ruta 3) described below was removed in v1.2.0. The three-path cascade is now a two-path cascade (bunx/npm, source, CWD fallback). See [ADR-011: Binary Removal](./adr-011-binary-removal.md) for details.

## Date
2026-06-17

## Author
Quetzalcoatl (Visionary Sage)

## Context

Códice was originally distributed via two channels:

1. **Compiled binary** (GitHub Releases) — template resolved relative to `process.execPath` *(removed in v1.2.0 — ADR-011)*
2. **npm package** (`@fisherk2-dev/codice`) via `bunx` — template resolved relative to `import.meta.dir` (*now the sole distribution method*)

ADR-006 established npm publication as the primary distribution method. However, `TemplateResolver.detectTemplateRoot()` only implemented two detection paths:

```typescript
// v1.0.4 — two paths only
private detectTemplateRoot(): string {
  // Ruta 1: Modo compilado (binario)
  const compiledPath = path.resolve(process.execPath, '../template/');
  if (fs.existsSync(compiledPath)) return compiledPath;

  // Ruta 2: Modo source (desarrollo)
  const sourcePath = path.resolve(import.meta.dir, '../../template/');
  if (fs.existsSync(sourcePath)) return sourcePath;

  // CWD fallback
  return path.resolve(process.cwd(), 'template');
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

| Mode | `import.meta.dir` | Template path | Works? |
|------|-------------------|---------------|--------|
| Source development | `/repo/src/cli/` | `../../template/` → `/repo/template/` | ✅ Yes |
| bunx/npm | `.../node_modules/@fisherk2-dev/codice/src/cli/` | `../../template/` → `.../node_modules/@fisherk2-dev/codice/template/` | ❌ No (off by one level) |
| Compiled binary | *(removed in v1.2.0 — ADR-011)* | N/A | ❌ Removed |

The missing path is `../template/` relative to `import.meta.dir` in bunx mode.

## Decision

Add a bunx/npm detection path to `TemplateResolver.detectTemplateRoot()`. The detection order prioritizes bunx/npm first because `import.meta.dir` resolves in ALL source-like modes, requiring bunx to be checked before source development:

```typescript
// v1.0.5 — three-path cascade + CWD fallback
static detectTemplateRoot(): string {
  // Ruta 1: Modo bunx/npm (paquete en node_modules)
  // import.meta.dir = src/cli/, template = ../template/
  const bunxPath = path.resolve(import.meta.dir, '../template/');
  if (fs.existsSync(bunxPath)) return bunxPath;

  // Ruta 2: Modo source desarrollo (raíz del repo)
  // import.meta.dir = src/cli/, template = ../../template/
  const sourcePath = path.resolve(import.meta.dir, '../../template/');
  if (fs.existsSync(sourcePath)) return sourcePath;

  // Ruta 3: Modo compilado (binario standalone)
  const binaryDir = path.dirname(process.argv[0] ?? process.execPath);
  const binaryRelativePath = path.resolve(binaryDir, '../template/');
  if (fs.existsSync(binaryRelativePath)) return binaryRelativePath;

  // Fallback: template relativo a CWD (compatibilidad retroactiva)
  return path.resolve(process.cwd(), 'template');
}
```

The detection order is:
1. bunx/npm mode (must be first — `import.meta.dir` resolves in all source modes)
2. Source development mode (repo root — checked only if bunx path doesn't exist)
3. CWD fallback (backward compatibility, error surfaces at file-read time)

> **Note:** A compiled binary mode path (Ruta 3) was removed in v1.2.0 (ADR-011). The cascade is now two paths plus CWD fallback.

Note: The CWD fallback replaces the previously planned `TemplateNotFoundError` throw. This is intentional — if the template exists at CWD, it works without error; if not, the error surfaces naturally when `resolvePath()` attempts to read a file from the non-existent directory.

## Consequences

### Positive

- **bunx/npm mode works**: `bunx @fisherk2-dev/codice` now resolves templates correctly in all execution contexts
- **No configuration required**: Detection is automatic based on filesystem existence checks
- **ADR-006 validated**: Confirms that npm publication as primary distribution is viable

### Negative
- **Order sensitivity**: The detection order matters; swapping paths could cause incorrect resolution in edge cases
- **Test coverage required**: Each path needs explicit integration tests to prevent regression

### Neutral

- **No performance impact**: Each `exists()` check is a fast filesystem stat call; the cascade completes in microseconds
- **No API changes**: The public interface of `TemplateResolver` remains unchanged
- **No breaking changes**: Existing users of compiled binaries or source mode see no difference

## Compliance

- ADR-002 (Bun compilation) — superseded by ADR-011 for binary compilation; Bun remains the development runtime
- ADR-003 (Atomic staging) is unaffected — file merge engine behavior is identical
- ADR-004 (@clack/prompts) is unaffected — TUI layer is unchanged
- ADR-005 (`--dest` flag) is unaffected — CLI arguments and behavior are identical
- ADR-006 (npm publication) — reaffirmed; npm/bunx is now the sole distribution method
- ADR-011 (Binary removal) — cascading note; compiled binary path removed from template resolution

## References

- [SPEC.md](../../SPEC.md) — Central specification, §Runtime Constraints
- [ADR-006: npm Publication as Primary Distribution](./adr-006-npm-publication.md) — Context for bunx mode
- [TemplateResolver.ts](../../src/infrastructure/adapters/TemplateResolver.ts) — Implementation
- [Issue #6](https://github.com/fisherk2/11-codice-opencode/issues/6) — Bug report
