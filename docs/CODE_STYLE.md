# Code Style – Códice: Opencode Workspace Installer

## Naming Conventions

| Construct | Convention | Examples |
|-----------|------------|----------|
| **Files** | PascalCase for classes, camelCase for utilities | `FileMergeEngine.ts`, `versionComparator.ts` |
| **Classes** | Descriptive nouns | `FileMergeEngine` (not `Merger`), `VersionComparator` (not `VersionCheck`) |
| **Interfaces** | Prefixed with `I` | `IFileSystem`, `IGitHubClient`, `IUserPrompt` |
| **Functions** | Verb or verb-phrase | `compareVersions`, `stageFileAtomic`, `promptForMode` |
| **Constants** | `SCREAMING_SNAKE_CASE` | `GITHUB_API_TIMEOUT_MS`, `STAGING_DIR_NAME` |

## TypeScript Rules

- **Strict mode enabled.** No implicit `any` anywhere in the codebase.
- **Explicit return types** on all public methods and exported functions.
- **No `any` type usage.** Use `unknown` with type guards when the type is genuinely uncertain.
- **Prefer `readonly`** arrays and properties where mutation is not intended.
- **No implicit returns.** Every branch of a function must return a value explicitly.

## File Structure

- **Maximum 200 lines per file.** If a file grows beyond this limit, extract responsibilities into new modules.
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
// FileMergeEngine.ts
import { IFileSystem } from "../application/ports/IFileSystem";
import { FileRule } from "../domain/entities/FileRule";
import { Result, MergeError } from "../domain/types/Result";

/**
 * Orchestrates file merging according to classification rules.
 * Guarantees atomic writes via the injected IFileSystem.
 */
export class FileMergeEngine {
  constructor(private readonly fileSystem: IFileSystem) {}

  /**
   * Execute all merge rules against the destination directory.
   * @param rules - Ordered list of classification rules to apply.
   * @returns Result indicating success or a structured MergeError.
   */
  async execute(rules: readonly FileRule[]): Promise<Result<void, MergeError>> {
    for (const rule of rules) {
      const result = await this.applyRule(rule);
      if (result.isErr()) {
        return result;
      }
    }
    return Result.ok();
  }

  private async applyRule(rule: FileRule): Promise<Result<void, MergeError>> {
    // Staging path ensures atomicity even if the process crashes mid-write.
    const stagingPath = this.fileSystem.getStagingPath(rule.targetPath);
    // ...
    return Result.ok();
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

- [ ] `just lint` passes with zero errors and zero warnings.
- [ ] `just test:unit` passes with > 80% coverage.
- [ ] No `any` types introduced in production code.
- [ ] Names are descriptive and follow the convention.
- [ ] Documentation updated if a public API changed.

---

*Last updated: 2026-06-13*
