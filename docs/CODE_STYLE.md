# Code Style – Códice: Opencode Workspace Installer

## Naming Conventions

| Construct | Convention | Examples |
|-----------|------------|----------|
| **Files** | PascalCase for classes, camelCase for utilities | `FileMergeEngine.ts`, `VersionComparator.ts` (classes); `stagePlanner.ts`, `mergeRules.ts` (utilities) |
| **Classes** | Descriptive nouns | `FileMergeEngine` (not `Merger`), `VersionComparator` (not `VersionCheck`) |
| **Interfaces** | Prefixed with `I` | `IFileSystem`, `IGitHubClient`, `IUserPrompt` |
| **Functions** | Verb or verb-phrase | `computeStagePlan`, `checkWritable`, `promptForMode` |
| **Constants** | `SCREAMING_SNAKE_CASE` | `GITHUB_API_TIMEOUT_MS`, `STAGING_DIR_PREFIX` |

## TypeScript Rules

- **Strict mode enabled.** No implicit `any` anywhere in the codebase.
- **Explicit return types** on all public methods and exported functions.
- **No `any` type usage.** Use `unknown` with type guards when the type is genuinely uncertain.
- **Prefer `readonly`** arrays and properties where mutation is not intended.
- **No implicit returns.** Every branch of a function must return a value explicitly.

## File Structure

- **Maximum 200 lines per file.** If a file grows beyond this limit, extract responsibilities into new modules.
- **Known exceptions (measured 2026-11-18):** 5 production files are over the limit — `AtomicStager.ts` (610), `FileMergeEngine.ts` (233), `BunSymlinkCreator.ts` (228), `BunFileSystem.ts` (206), `ClackPromptsAdapter.ts` (204); tracked as TD-V2-101 in [TECH_DEBT.md](TECH_DEBT.md).
- **Template Markdown prompts (primary agents and commands): body ≤ 180 lines**, excluding YAML frontmatter. Enforced by `tests/unit/domain/{agent,command}-frontmatter-validation.test.ts`.
- **One primary export per file.** Secondary utilities may be co-exported if tightly coupled to the primary export.
- **Import grouping** (top to bottom):
  1. External libraries (`@clack/prompts`, `semver`)
  2. Infrastructure layer (`src/infrastructure/`)
  3. Application layer (`src/application/`)
  4. Domain layer (`src/domain/`)

> **Note:** Domain imports are forbidden outside the domain layer. No domain file may import from `application/` or `infrastructure/`.

## Comments

- **Explain WHY, never WHAT.** Comments must describe intent and rationale, not restate the code.
- **JSDoc for public APIs.** All ports, use cases, and exported domain services include JSDoc describing purpose, parameters, return values, and error conditions.
- **No obvious comments.** Avoid `// increment i` next to `i++`.

## Error Handling

- **Fail-fast validation** at function entry points. Validate inputs immediately.
- **Domain returns `Result<T, Error>`** instead of throwing exceptions.
- **Actionable error messages.** Example: `"Permission denied at /path/to/file. Run with appropriate permissions or check directory access."` instead of `"Error EACCES"`.
- **Infrastructure maps low-level errors** (network, filesystem) to domain error types before returning them to the application layer.

## Examples

### Good

```typescript
// src/domain/services/FileMergeEngine.ts
import type { FileRule } from "../entities/FileRule";
import type { IStagedFileSystem } from "../ports/IStagedFileSystem";
import { type MergeError, stagingError } from "../types/MergeError";
import { failure, success, type Result } from "../types/Result";

/**
 * Orchestrates file merging according to classification rules.
 * Atomicity comes from the injected port: writes land in the per-run staging
 * directory and are promoted with a single rename.
 */
export class FileMergeEngine {
  constructor(private readonly fileSystem: IStagedFileSystem) {}

  /**
   * Execute all merge rules against the destination directory.
   * @param rules - Ordered list of classification rules to apply.
   * @returns Result indicating success or a structured MergeError.
   */
  async execute(rules: readonly FileRule[]): Promise<Result<void, MergeError>> {
    for (const rule of rules) {
      try {
        await this.fileSystem.stageFile(rule.path, rule.destPath);
      } catch (err) {
        // A failed stage must not leave a partial staging directory behind.
        await this.fileSystem.cleanStaging();
        return failure(stagingError(rule.path, String(err)));
      }
    }
    await this.fileSystem.commitStaging();
    return success(undefined);
  }
}
```

### Avoid

```typescript
// bad-merger.ts
import * as fs from "fs"; // ❌ Don't use Node fs directly in domain

export class Merger {           // ❌ Too vague
  constructor(fs: any) {}       // ❌ No any!

  async run(rules) {            // ❌ Missing return type
    // loop through rules       // ❌ Obvious comment
    for (let i = 0; i < rules.length; i++) {
      // increment i            // ❌ Useless comment
      i++;
      await fs.copyFile(rules[i].src, rules[i].dst);
    }
  }
}
```

## Pre-Commit Checklist

Before every commit, verify the following:

- [ ] `just check` passes with zero errors (biome ci + tsc --noEmit).
- [ ] `just test` passes with 0 failures (2027 tests; use `just test-unit` / `just test-integration` for subsets).
- [ ] No `any` types introduced in production code.
- [ ] Names are descriptive and follow the convention.
- [ ] Documentation updated if a public API changed.

---

*Last updated: 2026-11-18*
