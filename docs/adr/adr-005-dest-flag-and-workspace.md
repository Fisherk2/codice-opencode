# ADR-005: `--dest` Flag and E2E/Dev Workspace Directory

## Status
Accepted

## Date
2026-06-15

## Context
The Códice installer writes files to a destination directory. By default, the destination is the current working directory (`process.cwd()`). This creates a problem:

1. Running `bun run src/cli/main.ts` or `just dev` from the project root causes the installer to overwrite the project's own OpenCode configuration files (`.opencode/`, `agents/`, `AGENTS.md`, `SPEC.md`, etc.).
2. The E2E test suite already uses temporary directories (`mktemp -d`) for isolation, so those are safe. But manual testing and development runs were destructive to the project root.
3. Restoring overwritten files from `template/obligatorio/` is tedious and error-prone.

The project needs a safe, repeatable way to run the installer during development without polluting the project root.

## Decision

### 1. Add `--dest <path>` CLI Flag

Extend the CLI argument parser to accept an optional `--dest <path>` flag that specifies the target installation directory. When not provided, the behavior is unchanged (defaults to `process.cwd()`), preserving full backward compatibility.

**Implementation:**
- `parse-args.ts`: Parse `--dest <path>` as a value flag (consumes the next argument)
- `main.ts`: Use `parsed.destination ?? process.cwd()` as the destination path
- `container.ts`: Already accepts an optional `destinationPath` parameter

### 2. Create `tests/fixtures/workspace/` as Safe Playground

A permanent, gitignored directory (`tests/fixtures/workspace/`) serves as the development target. It contains only a `.gitkeep` to track the directory in version control while ignoring all generated contents.

### 3. Update `just dev` to Target the Workspace

The `just dev` recipe now:
1. Creates `tests/fixtures/workspace/` if it doesn't exist
2. Runs the installer with `--dest tests/fixtures/workspace`

The template is resolved from the project root (`process.cwd() + "/template"`) while the destination is the workspace directory. No template copying is needed.

## Consequences

### Positive
- **Safe development**: `just dev` never touches the project root.
- **Backward compatible**: Existing E2E tests (temp dirs) and direct binary usage (defaults to CWD) continue to work unchanged.
- **Configurable**: Users can target any directory with `--dest /path/to/project`.
- **No template duplication**: The template is resolved from the project root, not copied to the workspace.
- **Git-clean**: The workspace directory is gitignored; only `.gitkeep` is tracked.

### Negative
- **New CLI flag**: Additional documentation burden for the `--dest` flag.
- **Path resolution assumption**: The template resolution (`process.cwd() + "/template"`) assumes the binary is run from a directory that has a `template/` subdirectory. This is true for development and CI, but users running the compiled binary from an arbitrary CWD without a `template/` directory will get an error (which is the existing behavior).

## Alternatives Considered

### Only update `just dev` without `--dest` flag
- **Pros**: No CLI changes, simpler implementation
- **Cons**: No way for users to specify a custom destination from the CLI; requires users to `cd` to the target directory first
- **Rejected**: `--dest` is a natural, discoverable UX improvement

### Move `template/` into `tests/fixtures/template/` and use `import.meta.dir` resolution
- **Pros**: Keeps the project root cleaner (template source in tests/)
- **Cons**: The compiled binary needs to find the template at runtime relative to its CWD; `import.meta.dir` resolves differently in compiled vs. source mode. Increases complexity for marginal benefit.
- **Rejected**: Simpler to keep `template/` at the project root (Opción 1 per user preference)

### Use environment variable (`CODICE_DEST`) instead of CLI flag
- **Pros**: Easy to set in CI/scripts without modifying CLI
- **Cons**: Less discoverable, doesn't appear in `--help`, inconsistent with existing flag-based design
- **Rejected**: CLI flag is more idiomatic and user-friendly

## References
- SPEC.md §CLI Runtime Commands — Binary entry point documentation
- AGENTS.md §Estrategia de Manejo de Errores — Error handling conventions
- ARCHITECTURE.md — Layer diagram showing CLI → Container → Use Cases flow
