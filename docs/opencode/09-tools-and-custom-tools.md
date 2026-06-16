# Tools & Custom Tools in OpenCode

OpenCode comes with a set of built-in tools and allows you to create your own Custom Tools.

> **Official documentation:** [opencode.ai/docs/tools](https://opencode.ai/docs/tools/) | [opencode.ai/docs/custom-tools](https://opencode.ai/docs/custom-tools/)

---

## Built-in Tools

| Tool       | Description                                    | Permission Key |
|------------|------------------------------------------------|----------------|
| `bash`     | Execute shell commands                         | `bash`         |
| `edit`     | Edit files (exact string replacement)      | `edit`         |
| `write`    | Create new files / overwrite          | `edit`         |
| `read`     | Read file contents                    | `read`         |
| `grep`     | Search contents with regex                    | `grep`         |
| `glob`     | Find files by pattern                  | `glob`         |
| `list`     | List directories                              | `list`         |
| `patch`    | Apply patches                                | `edit`         |
| `skill`    | Load skills                                  | `skill`        |
| `todowrite` | Manage task lists                    | `todowrite`    |
| `webfetch` | Fetch web contents                          | `webfetch`     |
| `websearch` | Web search (Exa AI)                         | `websearch`   |
| `question` | Ask questions to the user                     | `question`     |
| `lsp`      | LSP queries (experimental)                   | `lsp`          |

### Configure Tool Permissions

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "edit": "ask",
    "bash": "ask",
    "webfetch": "allow",
    "read": "allow"
  }
}
```

### Wildcards for MCP Tools

```json
{
  "permission": {
    "mymcp_*": "ask"
  }
}
```

---

## Creating Custom Tools

Custom Tools are TypeScript/JavaScript files that the LLM can call during conversations.

### Storage Locations

- **Local:** `.opencode/tools/`
- **Global:** `~/.config/opencode/tools/`

### Basic Structure

```typescript
// .opencode/tools/database.ts
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Query the project database",
  args: {
    query: tool.schema.string().describe("SQL query to execute"),
  },
  async execute(args) {
    return `Executed query: ${args.query}`
  },
})
```

The **filename** becomes the **tool name** (`database.ts` -> Tool `database`).

### Multiple Tools Per File

```typescript
// .opencode/tools/math.ts
import { tool } from "@opencode-ai/plugin"

export const add = tool({
  description: "Add two numbers",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args) {
    return args.a + args.b
  },
})

export const multiply = tool({
  description: "Multiply two numbers",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args) {
    return args.a * args.b
  },
})
```

Creates: `math_add` and `math_multiply`.

### Using Context

```typescript
export default tool({
  description: "Get project information",
  args: {},
  async execute(args, context) {
    const { agent, sessionID, messageID, directory, worktree } = context
    return `Agent: ${agent}, Dir: ${directory}`
  },
})
```

### Tools in Other Languages

Example: Python Tool via TypeScript Wrapper:

```typescript
// .opencode/tools/python-add.ts
import { tool } from "@opencode-ai/plugin"
import path from "path"

export default tool({
  description: "Add two numbers using Python",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args, context) {
    const script = path.join(context.worktree, ".opencode/tools/add.py")
    const result = await Bun.$`python3 ${script} ${args.a} ${args.b}`.text()
    return result.trim()
  },
})
```

---

## .ignore File

Tools like `grep`, `glob`, `list` internally use ripgrep and respect `.gitignore`. To include ignored files:

```
# .ignore
!node_modules/
!dist/
!build/
```

---

## Best Practices

1. **Custom Tools for recurring tasks:** DB queries, API calls, build scripts
2. **Clear descriptions:** The agent decides based on the description when to use the tool
3. **Use Zod schemas:** Typed arguments with good `.describe()` text
4. **Respect permissions:** Custom Tools with the same name as Built-in Tools override them
5. **Use context.worktree:** For relative paths within the project