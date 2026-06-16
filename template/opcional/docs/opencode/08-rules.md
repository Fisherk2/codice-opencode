# Rules (AGENTS.md) in OpenCode

Rules are project-specific and user-specific instructions that OpenCode provides in the LLM context. They are defined through `AGENTS.md` files or the `instructions` configuration.

> **Official documentation:** [opencode.ai/docs/rules](https://opencode.ai/docs/rules/)

---

## Creating AGENTS.md

### Automatically

```bash
opencode
# Then in the TUI:
/init
```

Scans the project and generates an appropriate `AGENTS.md`.

### Manually

Create an `AGENTS.md` at the project root:

```markdown
# My Project

This is a TypeScript monorepo using bun workspaces.

## Project Structure
- `packages/` - Workspace packages (functions, core, web)
- `infra/` - Infrastructure definitions
- `sst.config.ts` - Main configuration

## Code Standards
- Use TypeScript with strict mode
- Shared code goes in `packages/core/`
- Import via workspace names: `@my-app/core/example`

## Testing
- Use vitest for unit tests
- Run `bun test` for full suite
- Minimum 80% coverage

## Conventions
- Conventional commits (feat:, fix:, chore:)
- PR reviews required before merge
```

---

## File Types and Locations

### Project-specific

`AGENTS.md` at the project root. Committed to Git and shared with the team.

### Global (personal)

`~/.config/opencode/AGENTS.md` -- applies to all OpenCode sessions.

**Recommendation:** Personal preferences here (e.g., language, code style, preferred patterns).

### Claude Code Compatibility

As fallback, the following are also supported:
- `CLAUDE.md` (if no `AGENTS.md` exists)
- `~/.claude/CLAUDE.md` (if no global `AGENTS.md` exists)

Can be disabled with:
```bash
export OPENCODE_DISABLE_CLAUDE_CODE=1
```

---

## Priority

1. Local files (searching upward from current directory): `AGENTS.md`, `CLAUDE.md`
2. Global file: `~/.config/opencode/AGENTS.md`
3. Claude Code file: `~/.claude/CLAUDE.md`

The first matching file per category wins.

---

## Custom Instructions via Config

### Include local files

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    "CONTRIBUTING.md",
    "docs/guidelines.md",
    ".cursor/rules/*.md"
  ]
}
```

### Remote URLs

```json
{
  "instructions": [
    "https://raw.githubusercontent.com/my-org/shared-rules/main/style.md"
  ]
}
```

Remote instructions are loaded with a 5-second timeout.

---

## Referencing External Files

### Recommended: opencode.json

```json
{
  "instructions": [
    "docs/development-standards.md",
    "test/testing-guidelines.md",
    "packages/*/AGENTS.md"
  ]
}
```

### Alternative: Lazy Loading in AGENTS.md

```markdown
# Project Rules

## External File Loading
CRITICAL: When you encounter a file reference (e.g., @rules/general.md),
use your Read tool to load it on a need-to-know basis.

## Guidelines
For TypeScript code style: @docs/typescript-guidelines.md
For React patterns: @docs/react-patterns.md
For API design: @docs/api-standards.md
For testing: @test/testing-guidelines.md
```

---

## Best Practices

1. **Commit AGENTS.md to Git:** Team standards
2. **Global AGENTS.md for personal preferences:** Language, style, editor behavior
3. **instructions in opencode.json:** Reuse existing docs instead of duplicating
4. **Glob Patterns for monorepos:** `packages/*/AGENTS.md`
5. **Keep it compact:** Only what's important. The agent has limited context.
6. **Document project structure:** Massively helps the agent navigate
7. **Use /init:** Automatic generation as a starting point