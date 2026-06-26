# ADR-008: Post-Installation Symlink Generation

## Status
Accepted

## Date
2026-06-26

## Author
Quetzalcoatl (Visionary Sage)

## Context

Códice distributes workspace templates via npm (`@fisherk2-dev/codice`) and compiled binaries. The template directory in `template/obligatorio/` contains 10 symlinks that reference other template directories:

- `.opencode/agents` → `../agents`
- `.opencode/commands` → `../commands`
- `.opencode/skills` → `../skills`
- `.devin/skills` → `../skills`
- `.devin/workflows` → `../commands`
- `.devin/rules/CODE_STYLE.md` → `../../docs/CODE_STYLE.md`
- `.devin/rules/CONTRIBUTING.md` → `../../CONTRIBUTING.md`
- `.devin/rules/code-review-and-quality.md` → `../../skills/code-review-and-quality/SKILL.md`
- `.devin/rules/incremental-implementation.md` → `../../skills/incremental-implementation/SKILL.md`
- `.devin/rules/test-driven-development.md` → `../../skills/test-driven-development/SKILL.md`

**npm packaging strips symlinks.** When `npm pack` creates the tarball for `@fisherk2-dev/codice`, symlinks in `template/obligatorio/` are either converted to regular files (duplicating content) or lost entirely. This means:

1. The `FileRuleManifest` references `.opencode/agents`, `.opencode/commands`, `.opencode/skills` as entries to copy — but these don't exist as real files in the npm tarball
2. Users running `bunx @fisherk2-dev/codice` get `Template file not found: .opencode/agents` in all three install modes (Clean, Project, Update)
3. The `.devin/` symlinks (7 entries) are similarly absent from the tarball

Issue #8 confirmed this failure: `bunx @fisherk2-dev/codice` failed in all 3 install modes because the manifest referenced symlink targets that don't exist in the packaged tarball.

The root cause is an impedance mismatch: the manifest system was designed assuming symlinks would survive packaging, but npm tarballs flatten symlinks into regular files or omit them.

## Decision

**Remove symlink entries from the manifest and generate symlinks post-installation.**

1. **Remove 3 manifest entries** from `FileRuleManifestData`:
   - `.opencode/agents` — symlink doesn't exist in npm tarball
   - `.opencode/commands` — symlink doesn't exist in npm tarball
   - `.opencode/skills` — symlink doesn't exist in npm tarball

2. **Rename manifest entry** `.devin/rules` → `.devin` for clearer UX (the `.devin` directory is presented as a single optional group)

3. **Generate ALL symlinks post-installation** via a new `ISymlinkCreator` port (application layer) and `BunSymlinkCreator` adapter (infrastructure layer):

```typescript
// Application layer port
interface ISymlinkCreator {
  createSymlinks(destination: string, context: SymlinkContext): Promise<Result<void, SymlinkError>>;
}

// Infrastructure adapter
class BunSymlinkCreator implements ISymlinkCreator {
  async createSymlinks(destination: string, context: SymlinkContext): Promise<Result<void, SymlinkError>> {
    const symlinks = this.resolveSymlinksForContext(destination, context);
    for (const { target, linkPath } of symlinks) {
      // Idempotent: skip if link already exists (including broken symlinks)
      // or if destination is a real directory
      const stat = await this.safeStat(linkPath);
      if (stat?.isSymbolicLink()) continue;
      if (stat?.isDirectory()) continue;
      await Bun.write(linkPath, ''); // placeholder, then rename
      // Actually: use fs.symlink(target, linkPath)
    }
    return Result.ok();
  }
}
```

4. **Mode restriction**: Symlinks generated only in **Clean Install** and **Project Install** modes. **Update Workspace** mode does NOT generate symlinks — users who replaced symlinks with real directories during customization should not have them overwritten.

5. **Idempotency**: Skip generation if:
   - Link already exists (including broken symlinks — user may have customized the target)
   - Destination is a real directory (user replaced symlink with a real folder)

6. **`.devin/` conditional generation**: The 7 `.devin/` symlinks are generated only if the user selects `.devin` during the optional file selection in Project Install mode, or automatically in Clean Install mode.

### 10 Symlinks Generated

| Link Path | Target | Condition |
|-----------|--------|-----------|
| `.opencode/agents` | `../agents` | Clean or Project mode |
| `.opencode/commands` | `../commands` | Clean or Project mode |
| `.opencode/skills` | `../skills` | Clean or Project mode |
| `.devin/skills` | `../skills` | `.devin` selected |
| `.devin/workflows` | `../commands` | `.devin` selected |
| `.devin/rules/CODE_STYLE.md` | `../../docs/CODE_STYLE.md` | `.devin` selected |
| `.devin/rules/CONTRIBUTING.md` | `../../CONTRIBUTING.md` | `.devin` selected |
| `.devin/rules/code-review-and-quality.md` | `../../skills/code-review-and-quality/SKILL.md` | `.devin` selected |
| `.devin/rules/incremental-implementation.md` | `../../skills/incremental-implementation/SKILL.md` | `.devin` selected |
| `.devin/rules/test-driven-development.md` | `../../skills/test-driven-development/SKILL.md` | `.devin` selected |

## Consequences

### Positive

- **Manifest stays accurate**: No phantom entries referencing non-existent symlinks in the npm tarball
- **Clean Architecture compliant**: `ISymlinkCreator` port in application layer, `BunSymlinkCreator` adapter in infrastructure — follows the same pattern as `IFileSystem`/`BunFileSystem`
- **Cross-platform**: `BunSymlinkCreator` detects directory vs file targets for Windows compatibility (directory symlinks require different flags on Windows)
- **Defense-in-depth**: Path containment validation ensures symlinks cannot escape the destination directory
- **Idempotent**: Safe to run multiple times — existing symlinks and real directories are never overwritten
- **Zero duplication**: Symlinks reference shared content rather than copying 100+ files

### Negative

- **Post-install step adds complexity**: A new phase must run after file copying completes, before the operation is marked successful
- **Symlink failures are non-fatal**: If a symlink cannot be created (e.g., permissions), the operation continues with a warning — this is intentional to avoid blocking the core installation
- **Test coverage required**: Each symlink path needs explicit tests to prevent regression

### Neutral

- **No impact on Update mode**: Existing users who never had symlinks see no change
- **No API changes**: The public interface of existing use cases is unchanged; symlinks are an internal implementation detail
- **No breaking changes**: Users of compiled binaries or source mode see no difference — the `TemplateResolver` path resolution was already fixed in ADR-007

## Alternatives Considered

### 1. Replace Symlinks with Real Files in Template

Copy the actual file content into `template/obligatorio/.opencode/agents/` instead of using symlinks.

**Rejected because:** This duplicates 100+ files across the template. Maintenance burden doubles — every file change must be applied in two places. The manifest system already handles the source files; symlinks are just pointers.

### 2. Embed Symlinks in Binary at Compile Time

Use Bun's compilation to preserve symlinks in the embedded template.

**Rejected because:** Bun's `--compile` flag does not support symlinks in the bundled asset graph. The compilation step flattens the directory tree, losing symlink information. This is a Bun limitation, not a design choice.

### 3. Generate Symlinks in All Modes Including Update

Apply symlink generation uniformly across Clean, Project, and Update modes.

**Rejected because:** Users who adopted the template before ADR-008 may have replaced symlinks with real directories (e.g., `.opencode/agents/` as a real folder with custom files). Generating symlinks in Update mode would silently destroy those customizations. Symlinks are a fresh-install concern only.

## Compliance

- ADR-002 (Bun compilation) remains valid — compiled binary path is preserved
- ADR-003 (Atomic staging) is unaffected — symlinks are created after staging completes
- ADR-004 (@clack/prompts) is unaffected — TUI layer handles optional selection for `.devin/`
- ADR-005 (`--dest` flag) is unaffected — symlinks are relative to the destination directory
- ADR-006 (npm publication) is now fully functional — symlink packaging gap is resolved
- ADR-007 (Template resolution) is unaffected — template discovery works; this ADR fixes content completeness

## References

- [SPEC.md](../../SPEC.md) — Central specification, §File Classification Rules
- [ADR-003: Atomic File Operations](./adr-003-atomic-staging.md) — Symlinks created after staging commit
- [ADR-006: npm Publication](./adr-006-npm-publication.md) — Context for npm packaging behavior
- [ADR-007: Template Resolution for bunx/npm](./adr-007-template-resolver-source-mode.md) — Template discovery path fix
- [Issue #8](https://github.com/fisherk2/11-codice-opencode/issues/8) — Bug report for symlink packaging failure
- [src/application/ports/ISymlinkCreator.ts](../../src/application/ports/ISymlinkCreator.ts) — Port interface
- [src/infrastructure/adapters/BunSymlinkCreator.ts](../../src/infrastructure/adapters/BunSymlinkCreator.ts) — Adapter implementation
