# Permissions in OpenCode

Permissions control which actions execute automatically, request confirmation, or are blocked.

> **Official documentation:** [opencode.ai/docs/permissions](https://opencode.ai/docs/permissions/)

---

## Actions

| Action   | Description                          |
|----------|--------------------------------------|
| `allow`  | Execute without asking               |
| `ask`    | Request confirmation before executing |
| `deny`   | Block action                     |

---

## Global Configuration

```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "*": "ask",
    "bash": "allow",
    "edit": "deny"
  }
}
```

Or all at once:

```json
{
  "permission": "allow"
}
```

---

## Granular Rules (Object Syntax)

The last matching rule wins. General `"*"` rule first, then specific ones.

### Bash Commands

```json
{
  "permission": {
    "bash": {
      "*": "ask",
      "git *": "allow",
      "npm *": "allow",
      "rm *": "deny",
      "grep *": "allow"
    }
  }
}
```

### File Edits

```json
{
  "permission": {
    "edit": {
      "*": "deny",
      "packages/web/src/content/docs/*.mdx": "allow"
    }
  }
}
```

### Wildcards

- `*` matches zero or more arbitrary characters
- `?` matches exactly one character

---

## Available Permission-Keys

| Key                   | Description                                | Granular Match |
|-----------------------|-------------------------------------------|----------------|
| `read`                | Read file                               | File path      |
| `edit`                | All file modifications (edit, write, patch) | File path |
| `glob`                | File search                      | Glob Pattern         |
| `grep`                | Content search                     | Regex Pattern        |
| `list`                | List directory                          | Directory path    |
| `bash`                | Shell commands                            | Parsed command     |
| `task`                | Start subagent                          | Subagent type     |
| `skill`               | Load skill                               | Skill name       |
| `lsp`                 | LSP queries                             | (not granular)        |
| `webfetch`            | Fetch URL                               | URL                  |
| `websearch`           | Web search                              | Query                |
| `external_directory`  | Access outside project directory  | Path                 |
| `doom_loop`           | Same tool-call repeated 3 times           | -                    |

---

## Default Values

- Most permissions are `"allow"` by default
- `doom_loop` and `external_directory` are `"ask"`
- `.env` files are blocked by default when reading:

```json
{
  "permission": {
    "read": {
      "*": "allow",
      "*.env": "deny",
      "*.env.*": "deny",
      "*.env.example": "allow"
    }
  }
}
```

---

## Per-Agent Permissions

Per-agent permissions merge with global permissions. Agent rules take priority.

### In opencode.json

```json
{
  "permission": {
    "bash": {
      "*": "ask",
      "git *": "allow"
    }
  },
  "agent": {
    "build": {
      "permission": {
        "bash": {
          "*": "ask",
          "git commit *": "ask",
          "git push *": "deny"
        }
      }
    }
  }
}
```

### In Markdown Agents

```yaml
---
description: Code review without edits
mode: subagent
permission:
  edit: deny
  bash: ask
  webfetch: deny
---
```

---

## External Directories

```json
{
  "permission": {
    "external_directory": {
      "~/projects/personal/**": "allow"
    },
    "edit": {
      "~/projects/personal/**": "deny"
    }
  }
}
```

---

## What "Ask" Does

With `ask`, the UI offers three options:
- **once** -- Approve only this request
- **always** -- Approve future matching requests (session duration)
- **reject** -- Reject request

---

## Best Practices

1. **Safe defaults:** `"*": "ask"` as base, specific permissions on top
2. **Control Git commands:** `git push` and `git commit` with `ask` or `deny`
3. **Block destructive commands:** `rm -rf *` with `deny`
4. **Read-only agents:** `edit: deny` and `bash: deny` for review agents
5. **Pay attention to pattern-match:** `"git status"` vs `"git status *"` (with arguments)
6. **Protect .env:** Keep the standard deny for `.env`