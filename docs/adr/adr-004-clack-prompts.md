# ADR-004: @clack/prompts for Terminal UI

## Status
Accepted

## Context
The CLI needs an interactive, modern, and lightweight TUI. It must work in compiled binaries without bloating the output size.

## Decision
Use @clack/prompts for all interactive elements:
- `intro()` — Welcome message
- `select()` — Mode selection (Clean/Project/Update)
- `multiselect()` — Optional files checklist
- `confirm()` — Destructive action confirmation
- `spinner()` — Progress during file operations and API calls
- `outro()` — Success/error summary
- `cancel()` — SIGINT handling

## Consequences
### Positive
- Zero-dependency tree (lightweight)
- Modern UX with colors, icons, and animations
- Ideal for compiled binaries (small bundle size)
- Simple API, easy to mock for testing
- Active maintenance

### Negative
- Less customizable than Inquirer or Enquirer
- Limited to basic prompt types (no autocomplete, no fuzzy search)
- Relatively new library (smaller community than Inquirer)

## Alternatives Considered
- **Inquirer**: Rejected — heavier dependency tree, older UI style, larger bundle
- **Enquirer**: Rejected — good but less maintained, slightly heavier
- **Custom TUI with ink/react**: Rejected — React dependency is too heavy for a CLI binary
- **Native readline**: Rejected — too primitive, poor UX for non-technical users

## References
- AGENTS.md §TUI Framework
- SPEC.md §TUI Component Mapping
