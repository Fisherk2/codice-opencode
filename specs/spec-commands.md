# Spec: Commands

All commands are defined in the `Justfile` and mirrored as `package.json` scripts for compatibility.

## Development Commands

| Command | Purpose | Expected Behavior |
|---------|---------|-------------------|
| `just setup` | Bootstrap development environment | Install dependencies via `bun install`, verify Bun version >= 1.1.x, create required directories |
| `just dev` | Run CLI in development mode | Execute `src/cli/main.ts` via `bun run`, enable verbose logging |
| `just lint` | Static analysis | Run Biome (or eslint) across `src/` and `tests/`, fail on warnings, enforce no-explicit-any rule |
| `just format` | Code formatting | Run Biome format (or prettier) in write mode, fail if unformatted files detected in CI |
| `just check` | Pre-flight validation | Run `lint`, `format --check`, and `typecheck` in sequence; gate for commits |

## Testing Commands

| Command | Purpose | Expected Behavior |
|---------|---------|-------------------|
| `just test` | Full test suite | Execute `bun test` across all `*.test.ts` files; unit + integration tests |
| `just test:unit` | Unit tests only | Run tests matching `tests/unit/**/*.test.ts`; target < 1s execution |
| `just test:integration` | Integration tests only | Run tests matching `tests/integration/**/*.test.ts`; mock filesystem and network |
| `just test:e2e` | End-to-end tests | Execute via `bun run src/cli/main.ts` in isolated temporary directories, validate filesystem state and exit codes |
| `just test:coverage` | Coverage report | Run `bun test --coverage`, generate HTML and lcov reports, enforce > 80% threshold |

## Build & Release Commands

| Command | Purpose | Expected Behavior |
|---------|---------|-------------------|
| `just build` | *Removed in v1.2.0* | Binary compilation removed. Use `bun run src/cli/main.ts` for local development. |
| `just release` | Draft release | Create GitHub Release, generate release notes from `CHANGELOG.md` |

## CLI Runtime Commands (Package)

| Command | Purpose | Expected Behavior |
|---------|---------|-------------------|
| `codice` | Interactive menu | Launch TUI with three mode options; default entry point for all users |
| `codice --version` | Version display | Print current package version and exit with code 0 |
| `codice --verbose` | Verbose mode | Enable structured logging to stderr for all operations; useful for debugging |
| `codice --help` | Help display | Show usage instructions, available flags, and link to documentation |
| `codice --dest <path>` | Destination directory | Specify the target directory for installation (default: current working directory) |
| `codice --force` | Skip confirmations | Skip confirmation prompts and include all optional files without interactive selection |
| `codice --mode <mode>` | Direct mode selection | Skip interactive menu and go directly to the specified mode (`clean`, `project`, or `update`) |
| `codice --clean` | Direct clean install | Skip interactive menu and run Clean Install mode directly |
| `codice --project` | Direct project install | Skip interactive menu and run Project Install mode directly |
| `codice --update` | Direct update | Skip interactive menu and run Update Workspace mode directly |
| `codice --packs <list>` | Select packs | Install only the specified packs (comma-separated, e.g. `software-development,business`) |
| `codice --packs-all` | All packs | Install all 8 selectable packs without interactive selection |
| `codice --update-add-packs <list>` | Add packs on update | Add packs to an existing installation during update mode |

## Workspace Template Commands (v2.1)

| Command | Target Agent | Purpose |
|---------|--------------|---------|
| `/sync` (v2.1) | Quetzalcoatl | Context synchronization, agent discovery, memory graph indexing, doc sync |
| `/migrate` (v2.1) | Coatlicue | Database schema, data, and framework migrations |
| `/deploy` (v2.1) | Huitzilopochtli | Release, packaging, container build, and deployment automation |
| `/analyze` (v2.1) | Tezcatlipoca | Architecture, performance, security, and quality analysis |
