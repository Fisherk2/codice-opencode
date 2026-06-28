# Slash Commands in OpenCode

> **Official documentation:** [opencode.ai/docs/commands](https://opencode.ai/docs/commands/)
>
> **Project reference:** For the complete list of available commands, see [USER_GUIDE.md > Commands](./USER_GUIDE.md#commands). For command-agent orchestration patterns, see [02-orchestration-patterns.md](./02-orchestration-patterns.md).

Custom commands let you define reusable prompts that run when the user types `/<command-name>` in the TUI. They're defined either as Markdown files in the `commands/` directory or as JSON entries in `opencode.json`.

---

## Configuration Approaches

Commands can be defined in **two ways**:

---

### Markdown Files (Per-Project)

Create `.opencode/commands/<name>.md`:

```yaml
---
description: What the command does — appears in the TUI command palette
agent: agent-name          # optional — defaults to current agent
model: provider/model-id   # optional — override the model
subtask: true              # optional — force subagent invocation
---

Run the full test suite with coverage and show failures.

Focus on failing tests and suggest fixes.
```

The filename becomes the command name. Run it with `/<name>` in the TUI.

### Supported Paths

| Path                               | Scope              |
|------------------------------------|--------------------|
| `commands/<name>.md`               | Project (symlinked)|
| `.opencode/commands/<name>.md`     | Project (native)   |
| `~/.config/opencode/commands/`     | Global             |

---

### JSON (In Config)

Define commands under the `command` key in `opencode.json`:

```json
{
  "command": {
    "test": {
      "template": "Run the full test suite with coverage...",
      "description": "Run tests with coverage",
      "agent": "build",
      "model": "anthropic/claude-3-5-sonnet-20241022"
    }
  }
}
```

| JSON Field    | Markdown Frontmatter | Required | Description                    |
|---------------|----------------------|----------|--------------------------------|
| `template`    | (body)               | Yes (JSON) | The prompt sent to the LLM    |
| `description` | `description`        | Yes      | Shown in TUI command palette   |
| `agent`       | `agent`              | No       | Override the executing agent   |
| `model`       | `model`              | No       | Override the model             |
| `subtask`     | `subtask`            | No       | Force subagent invocation      |

---

## Frontmatter Options

| Field         | Type    | Required | Description                                        |
|---------------|---------|----------|----------------------------------------------------|
| `description` | string  | **Yes**  | Shown in the TUI when typing `/` (1-200 chars)     |
| `agent`       | string  | No       | Agent to execute this command (defaults to current)|
| `model`       | string  | No       | Override the model for this command                |
| `subtask`     | boolean | No       | Force subagent invocation (avoids context pollution)|

**The `agent` field is optional.** If omitted, the command runs with the user's current agent. In this project, we always set it to the target primary agent for explicit routing.

---

## Prompt Template Features

The command body (or `template` in JSON) supports several special syntaxes:

---

### Arguments

Pass arguments with `$ARGUMENTS` or positional `$1`, `$2`, `$3`, etc.

```yaml
---
description: Create a new component
---
Create a React component named $ARGUMENTS with TypeScript support.
```

Usage: `/component Button` → `$ARGUMENTS` becomes `Button`.

Positional example:

```yaml
---
description: Create a file with content
---
Create a file named $1 in directory $2 with content: $3
```

Usage: `/create-file config.json src "{ \"key\": \"value\" }"`

---

### Shell Output

Inject bash command output using `!`command`` (backtick with exclamation mark).

```yaml
---
description: Analyze test coverage
---
Here are the current test results:

!`npm test`

Based on these results, suggest improvements.
```

Or to review recent changes:

```yaml
---
description: Review recent changes
---
Recent git commits:

!`git log --oneline -10`

Review these changes and suggest improvements.
```

The command runs in the project root and its output becomes part of the prompt.

---

### File References

Include file contents using `@filename`:

```yaml
---
description: Review a component
---
Review the component in @src/components/Button.tsx.
Check for performance issues and suggest improvements.
```

The file content is automatically inlined into the prompt.

---

## Anatomy of Commands in This Project

Commands in this project follow a structured workflow pattern tailored to the SDD pipeline:

### 1. Skill Invocation

Start by loading required skills:

```markdown
Invoke @skills/incremental-implementation/SKILL.md alongside @skills/test-driven-development/SKILL.md.
```

Skills are referenced inline via `@skills/<skill-name>/SKILL.md`.

### 2. Pre-Flight / State Detection

For commands that need context (e.g., `/spec`, `/evolve`):

```markdown
## Pre-Flight: Detect Project State

1. Read @SPEC.md — does it exist? Has real content or placeholders?
2. Read @tasks/ — what plan exists?
```

### 3. Phases with Numbered Steps

Break the workflow into clear numbered steps:

```markdown
## Phase 1: Execute

1. **Step one** — specific action with measurable outcome
2. **Step two** — reference @skills/ as needed
3. **Step three** — exit criteria
```

### 4. Routes and Branching

For commands with multiple paths (like `/evolve`):

```markdown
### Route A — Update Documentation

1. Audit current docs
2. Update or create specific files

### Route B — Resolve an Issue

1. Understand the issue
2. Propose a solution
```

### 5. Rules Section

Constrain agent behavior:

```markdown
## Rules

1. Command is for specific scenarios only
2. Use the `question` tool before proceeding
3. Preserve previous versions
```

---

## Best Practices

### 1. Description Must Be Action-Oriented

Good: `"Implement the next task incrementally — build, test, verify, commit"`
Bad: `"Build command"`

### 2. Reference Skills Inline

Don't list skills in a separate section — reference them where used:

```markdown
1. Write a failing test using @skills/test-driven-development/SKILL.md
2. Implement using @skills/solid/SKILL.md
```

### 3. Use `question` at Decision Points

Commands should not auto-pilot. Use the `question` tool when:
- The user must choose between routes
- A decision requires user confirmation
- The change is destructive or irreversible

### 4. Handoff Implementation

Primary agents that don't write code (Quetzalcoatl, Tezcatlipoca) should redirect:

```markdown
8. Recommend the user run `/build` if coding is required
```

### 5. Fail Fast with Clear Rules

If a command is used in the wrong context, redirect:

```markdown
1. `/evolve` is for **existing projects only**. Redirect to `/spec` for new projects.
```

---

## Examples from This Project

| Command | Agent | Phase | When to Use |
|---------|-------|-------|-------------|
| [`/spec`](../../commands/spec.md) | quetzalcoatl | DEFINE | New projects — establish specs from scratch |
| [`/evolve`](../../commands/evolve.md) | quetzalcoatl | EVOLVE | Mature projects — create new or modify specs |
| [`/design`](../../commands/design.md) | quetzalcoatl | DESIGN | UI/UX projects — design specification |
| [`/docs-update`](../../commands/docs-update.md) | quetzalcoatl | DOCS | Sync documentation with code changes |
| [`/diagnosis`](../../commands/diagnosis.md) | quetzalcoatl | DIAGNOSE | Analyze issues and document technical diagnoses |
| [`/plan`](../../commands/plan.md) | moctezuma | PLAN | After spec — decompose into tasks |
| [`/build`](../../commands/build.md) | tlaloc | BUILD | After plan — implement incrementally |
| [`/test`](../../commands/test.md) | mictlantecuhtli | VERIFY | After build — prove it works |
| [`/webperf`](../../commands/webperf.md) | mictlantecuhtli | WEBPERF | Web projects — performance audit |
| [`/code-simplify`](../../commands/code-simplify.md) | tlaloc | SIMPLIFY | After build — code clarity pass |
| [`/review`](../../commands/review.md) | tezcatlipoca | REVIEW | Before merge — multi-axis review |
| [`/ship`](../../commands/ship.md) | mictlantecuhtli | SHIP | Before release — go/no-go decision |

---

## Command-Agent Mapping

The SDD pipeline plugin maps commands to agents. See the full mapping in [02-orchestration-patterns.md](./02-orchestration-patterns.md#agent-personas) and the plugin's Command-Agent Map in [`.opencode/plugins/README.md`](../../.opencode/plugins/README.md#2-command-agent-map-slash-commands).

When adding a new command, register it in:
1. The plugin's `COMMAND_AGENT_MAP` in `.opencode/plugins/sdd-pipeline.ts`
2. The documented mapping in `.opencode/plugins/README.md`

---

## Relationship to Other Concepts

| Concept | Role | Example |
|---------|------|---------|
| **Command** | User-facing entry point | `/review` invokes `tezcatlipoca` |
| **Agent** | The executor (who does the work) | `tezcatlipoca` reviews code |
| **Skill** | The how (workflow steps) | `code-review-and-quality` skill |

Commands compose agents and skills: the user triggers a command, the command activates an agent, and the agent follows skills to complete the work.

---

## Built-in Commands

OpenCode includes several built-in commands that can be overridden by custom ones:

| Command   | Purpose            |
|-----------|--------------------|
| `/init`   | Initialize project |
| `/undo`   | Undo last change   |
| `/redo`   | Redo last undo     |
| `/share`  | Share session      |
| `/help`   | Show help          |

Custom commands with the same name override built-in commands.

---

## Summary: Required vs Recommended

| Element | Required? |
|---------|-----------|
| `.opencode/commands/<name>.md` file | **Required** |
| `description` in frontmatter | **Required** |
| `agent` in frontmatter | **Project convention** (optional in OpenCode) |
| Description starting with action verb | **Recommended** |
| Numbered step-by-step workflow | **Recommended** |
| Inline skill references | **Recommended** |
| Rules section | **Recommended** |
| `question` tool at decision points | **Recommended** |
| Implementation handoff instruction | **Recommended** |
