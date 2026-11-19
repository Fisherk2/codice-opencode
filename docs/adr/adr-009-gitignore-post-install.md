# ADR-009: Post-Installation Gitignore Generation

## Status
Accepted

## Date
2026-06-26

## Author
Quetzalcoatl (Visionary Sage)

## Context

Códice distributes workspace templates via npm (`@fisherk2-dev/codice`) and compiled binaries. The template includes a comprehensive `.gitignore` file at `template/estandar/.gitignore` (2930 bytes) that covers common ignore patterns for Node.js, Bun, IDEs, OS artifacts, build outputs, and environment files.

**npm hard-excludes `.gitignore` files from packages.** This is a built-in behavior of npm's packager — `.gitignore` files are stripped from the tarball regardless of whether they are listed in the `files` field of `package.json` or protected by `.npmignore`. This is not a bug; it is a deliberate npm design decision.

The consequence:

1. The `FileRuleManifest` references `.gitignore` as a `standard` category entry to copy during installation
2. Users running `bunx @fisherk2-dev/codice` get `Template file not found: .gitignore` in all three install modes (Clean, Project, Update)
3. The file exists in the repository (`template/estandar/.gitignore`, 2930 bytes) but is absent from the published npm tarball

Issue #11 confirmed this failure: `bunx @fisherk2-dev/codice` failed with `Template file not found: .gitignore` because npm's packager silently removed the file during `npm publish`.

The root cause is the same impedance mismatch identified in ADR-008 (symlink packaging): the manifest system assumes all declared files survive npm packaging, but npm applies hard exclusions to certain filenames (`.gitignore`, `.npmignore`, `.devcontainer`, etc.).

## Decision

**Rename the template file to bypass npm's exclusion and generate `.gitignore` post-installation.**

1. **Rename `template/estandar/.gitignore` to `template/estandar/gitignore`** (remove the dot prefix). npm does not exclude files without the leading dot, so `gitignore` survives packaging intact.

2. **Remove the `.gitignore` entry from `FileRuleManifestData`** — the file is no longer copied through the standard manifest pipeline.

3. **Generate `.gitignore` post-installation** via a new `IGitignoreCreator` port (application layer) and `BunGitignoreCreator` adapter (infrastructure layer):

```typescript
// Application layer port
interface IGitignoreCreator {
  createGitignore(destination: string): Promise<Result<void, GitignoreError>>;
}

// Infrastructure adapter
class BunGitignoreCreator implements IGitignoreCreator {
  async createGitignore(destination: string): Promise<Result<void, GitignoreError>> {
    // 1. Resolve template source: read `gitignore` (no dot) from template/estandar/
    // 2. Check idempotency: skip if `.gitignore` already exists at destination
    // 3. Validate path containment: ensure destination is within allowed boundary
    // 4. Write `.gitignore` to destination with template content
    return Result.ok();
  }
}
```

4. **Mode restriction**: `.gitignore` generated only in **Clean Install** and **Project Install** modes. **Update Workspace** mode does NOT generate `.gitignore` — users who have customized their `.gitignore` should not have it overwritten during an update.

5. **Idempotency**: Skip generation if:
   - `.gitignore` already exists at the destination (user has an existing gitignore)
   - Destination path is a real directory (not a file path)

6. **Error handling**: `GitignoreError` type in `domain/types/` with 4 error codes:
   - `READ_FAILED` — cannot read the template `gitignore` source file
   - `WRITE_FAILED` — cannot write `.gitignore` to destination (permissions, disk full)
   - `TEMPLATE_NOT_FOUND` — the `gitignore` source file is missing from the template
   - `PATH_ESCAPE` — destination path resolves outside the allowed boundary (defense-in-depth)

## Consequences

### Positive

- **npm-compatible**: `gitignore` (no dot) survives `npm pack` and `npm publish` without any workarounds
- **Clean Architecture compliant**: `IGitignoreCreator` port in application layer, `BunGitignoreCreator` adapter in infrastructure — follows the same pattern as ADR-008 (`ISymlinkCreator`/`BunSymlinkCreator`)
- **Idempotent**: Safe to run multiple times — existing `.gitignore` files are never overwritten
- **User-safe in Update mode**: Existing users' customized `.gitignore` files are preserved during workspace updates
- **Consistent pattern**: Reuses the post-install generation pattern established in ADR-008, reducing cognitive load for future maintainers
- **Defense-in-depth**: Path containment validation prevents writes outside the destination directory

### Negative

- **Post-install step adds complexity**: A new phase must run after file copying completes, similar to the symlink generation step from ADR-008
- **Gitignore failures are non-fatal**: If `.gitignore` cannot be created (e.g., permissions), the operation continues with a warning — this is intentional to avoid blocking the core installation
- **Test coverage required**: The generation logic needs explicit tests to prevent regression, including idempotency and error scenarios

### Neutral

- **No impact on Update mode**: Existing users who have customized `.gitignore` see no change during updates
- **No API changes**: The public interface of existing use cases is unchanged; gitignore generation is an internal implementation detail
- **No breaking changes**: Users of compiled binaries or source mode see no difference — the `TemplateResolver` path resolution was already fixed in ADR-007
- **Manifest stays accurate**: Removing the `.gitignore` entry from the manifest eliminates a phantom reference to a file that doesn't exist in the npm tarball

## Alternatives Considered

### 1. Use `.npmignore` to Force-Include `.gitignore`

Add an `.npmignore` file that explicitly includes `.gitignore` to override npm's default exclusion.

**Rejected because:** npm's `.gitignore` exclusion is a hard-coded behavior that cannot be overridden by `.npmignore` or the `files` field in `package.json`. This is a documented npm limitation, not a configuration issue.

### 2. Rename to `.gitignore.template` and Post-Process

Keep the dot prefix but add a secondary extension (e.g., `.gitignore.template`), then rename during post-install.

**Rejected because:** This adds unnecessary complexity. The `gitignore` (no dot) approach is simpler, equally clear in intent, and follows the same pattern as ADR-008's symlink solution. The file is only read by the installer, not by users directly.

### 3. Generate `.gitignore` in All Modes Including Update

Apply gitignore generation uniformly across Clean, Project, and Update modes.

**Rejected because:** Users who adopted the template before ADR-009 may have heavily customized their `.gitignore` (adding project-specific patterns, removing defaults they don't need). Generating `.gitignore` in Update mode would silently destroy those customizations. Gitignore generation is a fresh-install concern only.

### 4. Embed `.gitignore` Content as a String Constant

Hardcode the `.gitignore` content as a TypeScript string constant in the source code instead of reading from a template file.

**Rejected because:** This makes the content harder to maintain (no syntax highlighting, no easy editing). Keeping the content in a separate `gitignore` file allows template contributors to edit it naturally. The file-based approach also keeps the adapter pattern consistent with ADR-008.

## Compliance

- ADR-002 (Bun compilation) — superseded by ADR-011 for binary compilation; Bun remains the development runtime
- ADR-003 (Atomic staging) is unaffected — gitignore is created after staging completes
- ADR-004 (@clack/prompts) is unaffected — TUI layer is not involved in gitignore generation
- ADR-005 (`--dest` flag) is unaffected — gitignore is written relative to the destination directory
- ADR-006 (npm publication) is now fully functional — gitignore packaging gap is resolved
- ADR-007 (Template resolution) is unaffected — template discovery works; this ADR fixes content completeness
- ADR-008 (Symlink post-install) — this ADR follows the identical post-install generation pattern, extending it to a second npm-excluded artifact

## References

- [SPEC.md](../../SPEC.md) — Central specification, §File Classification Rules
- [ADR-003: Atomic File Operations](./adr-003-atomic-staging.md) — Gitignore created after staging commit
- [ADR-006: npm Publication](./adr-006-npm-publication.md) — Context for npm packaging behavior
- [ADR-007: Template Resolution for bunx/npm](./adr-007-template-resolver-source-mode.md) — Template discovery path fix
- [ADR-008: Post-Installation Symlink Generation](./adr-008-symlink-post-install.md) — Precedent for post-install generation pattern
- [Issue #11](https://github.com/fisherk2/codice-opencode/issues/11) — Bug report for gitignore packaging failure
- [src/application/ports/IGitignoreCreator.ts](../../src/application/ports/IGitignoreCreator.ts) — Port interface
- [src/infrastructure/adapters/BunGitignoreCreator.ts](../../src/infrastructure/adapters/BunGitignoreCreator.ts) — Adapter implementation
- [src/domain/types/GitignoreError.ts](../../src/domain/types/GitignoreError.ts) — Error type with 4 error codes
