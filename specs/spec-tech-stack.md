# Spec: Tech Stack

## Tech Stack

| Component | Technology | Version / Constraint | Justification |
|-----------|-----------|---------------------|---------------|
| Runtime | Bun | >= 1.1.x | Superior startup time, modern filesystem API, single runtime dependency |
| Language | TypeScript | Strict mode enabled | Type safety, explicit interfaces for Clean Architecture ports |
| TUI Framework | @clack/prompts | Latest stable | Zero-dependency tree, modern UX, ideal for CLI tools, lightweight spinner and prompt primitives |
| Testing Framework | bun:test | Bundled with Bun | Native test runner, built-in mocking, coverage reporting, no additional dependencies |
| Linting & Formatting | Biome (or eslint + prettier) | Latest stable | Fast formatting, consistent code style enforcement in CI |
| Task Runner | Just | Latest stable | Cross-platform task definitions (`just setup`, `just test`, `just check`) |
| CI/CD Platform | GitHub Actions | Native | Tight integration with repository, free runners for Linux/macOS/Windows, automatic release asset attachment |
| Version Parsing | semver | Latest stable | Standard semantic version comparison, tag validation |

### Runtime Constraints

- The package is distributed as source via npm and executed via `bunx @fisherk2-dev/codice` or `npx @fisherk2-dev/codice`. Bun >= 1.1.x is the recommended runtime.
- All filesystem operations must use Bun's native `Bun.file()` and `Bun.write()` APIs or standard Node.js `fs` polyfills provided by Bun.
- Network operations are limited to GitHub REST API calls for version checking.
