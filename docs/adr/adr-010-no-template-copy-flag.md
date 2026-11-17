# ADR-010: noTemplateCopy Flag for Virtual Manifest Entries

## Status
Accepted

## Date
2026-06-26

## Author
Quetzalcoatl (Visionary Sage)

## Context

Códice maintains a `FileRuleManifest` that categorizes every template file as `mandatory`, `standard`, or `optional`. The manifest drives both the file staging pipeline and the user-facing optional file selection UX.

During FEV-2 (v1.0.5), symlinks in `.opencode/{agents,commands,skills}` were removed from the manifest because npm strips symlinks during packaging. These symlinks are generated post-installation by `BunSymlinkCreator`.

During FEV-2-D (v1.0.10), a similar issue was discovered with `.devin/`:

1. **`.devin/` contains ONLY symlinks** — `rules/*.md` files are symlinks to `../../docs/`, `../../skills/`, etc., and `skills`/`workflows` are symlinks to `../skills`/`../commands`
2. **npm strips symlinks** during packaging, so `.devin/` does not exist in the published npm tarball
3. **All `.devin/` content is already generated post-installation** by `BunSymlinkCreator` via `DEVIN_SYMLINKS` (7 symlinks, same set as ADR-008)

However, unlike `.opencode/{agents,commands,skills}` — which are always needed — `.devin/` is **optional**. The user should be able to choose whether to include it via the optional file selection checklist.

## Decision

Add a `noTemplateCopy?: boolean` field to the `FileRule` interface. When `true`:

1. **FileMergeEngine skips `stageFile()`** — no template file is resolved or staged
2. **The entry still appears in `selectOptional()`** — the user can select/deselect it in the UX
3. **The selection state is recorded** in `.codice-version` under `optionalSelections`
4. **`ProjectInstallUseCase` uses the selection** to decide whether to create `.devin/` symlinks

### Implementation

```typescript
// FileRule.ts
export interface FileRule {
    readonly path: string;
    readonly category: RuleCategory;
    readonly isDirectory: boolean;
    readonly description: string;
    readonly noTemplateCopy?: boolean;
}

// FileMergeEngine.ts (within execute loop)
if (rule.noTemplateCopy) continue;  // Skip staging

// FileRuleManifestData.ts
{
    path: ".devin",
    category: "optional",
    isDirectory: true,
    noTemplateCopy: true,
    description: "Devin configuration directory (rules, skills, workflows); team-specific AI agent customization",
}
```

## Consequences

### Positive

- **Clean separation of concerns**: The manifest controls UX (what the user can select), while staging logic handles what gets copied
- **Consistent with existing patterns**: Same approach as `.opencode/{agents,commands,skills}` removal in FEV-2-B — content handled post-installation
- **No changes to `TemplateResolver`**: It already handles directories via `fs.existsSync()`, but doesn't need to for this case
- **Backward compatible**: Existing entries without `noTemplateCopy` behave identically. The flag defaults to `undefined` (falsy) for all current entries
- **Non-breaking**: All 465 existing tests pass with this change

### Negative

- **Slightly more complex manifest**: Entries now have an additional boolean field
- **Cognitive load**: Developers must understand that `noTemplateCopy` entries are "virtual" — they appear in the UX but generate no template output

## Alternatives Considered

### 1. Remove `.devin` from manifest entirely (rejected)

This would break the optional UX — `.devin` would no longer appear in the file selection checklist, and users couldn't opt out of `.devin/` symlink creation.

### 2. Handle `.devin` as a special case in use cases (rejected)

Adding special-case logic in `CleanInstallUseCase` and `ProjectInstallUseCase` for `.devin` would violate Open/Closed Principle and create a maintenance burden.

### 3. Keep `.devin` in manifest but add separate "virtual entries" array (rejected)

Adding a separate list of "virtual optional entries" would duplicate the manifest structure and create synchronization issues.

### 4. Make `TemplateResolver.resolvePath()` return the template root for virtual entries (rejected)

This would force a directory copy that includes ALL symlinks, which npm has already stripped from the package, and would still fail at runtime.

## References

- ADR-008: Post-Installation Symlink Generation
- FEV-2-B: `.opencode/{agents,commands,skills}` manifest removal
- FEV-2-D: `.devin` directory support + Clean Install optional menu
- `src/domain/entities/FileRule.ts`
- `src/domain/services/FileMergeEngine.ts`
- `src/domain/entities/FileRuleManifestData.ts`
