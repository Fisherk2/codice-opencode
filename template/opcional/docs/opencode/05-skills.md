# Agent Skills in OpenCode

> **📖 For task-to-skill discovery, see the [Meta-Skill](../../skills/using-agent-skills/SKILL.md) — it contains the decision tree for finding which skill applies to your current task. For the complete skills reference by phase, see [USER_GUIDE.md > Skills Reference](./USER_GUIDE.md#skills-reference).

Skills are reusable instructions that OpenCode can discover from your repository or home directory. They are loaded on-demand through the native `skill` tool -- agents see available skills and can load the content when needed.

> **Official documentation:** [opencode.ai/docs/skills](https://opencode.ai/docs/skills/)

---

## Directory Structure

Create a folder per skill name with a `SKILL.md` inside:

```
skills/
  skill-name/
    SKILL.md           # Required: The skill definition
    supporting-file.md # Optional: Reference material loaded on demand
```

### Supported Paths

| Path                                             | Type                |
|--------------------------------------------------|---------------------|
| `skills/<name>/SKILL.md`               | Project (With symlink)|
| `.opencode/skills/<name>/SKILL.md`               | Project (OpenCode)  |
| `~/.config/opencode/skills/<name>/SKILL.md`     | Global (OpenCode)   |
| `.claude/skills/<name>/SKILL.md`                 | Project (Claude-compatible) |
| `~/.claude/skills/<name>/SKILL.md`               | Global (Claude-compatible) |
| `.agents/skills/<name>/SKILL.md`                 | Project (Agent-compatible) |
| `~/.agents/skills/<name>/SKILL.md`               | Global (Agent-compatible) |

---

## SKILL.md Structure

Each `SKILL.md` begins with YAML Frontmatter:

```markdown
---
name: git-release
description: Create consistent releases and changelogs
license: MIT
compatibility: opencode
metadata:
  audience: maintainers
  workflow: github
---

# Skill Title

## Overview
One-two sentences explaining what this skill does and why it matters.

## When to Use
- Bullet list of triggering conditions (symptoms, task types)
- When NOT to use (exclusions)

## [Core Process / The Workflow / Steps]
The main workflow, broken into numbered steps or phases.
Include code examples where they help.
Use flowcharts (ASCII) where decision points exist.

## [Specific Techniques / Patterns]
Detailed guidance for specific scenarios.
Code examples, templates, configuration.

## Common Rationalizations
| Rationalization | Reality |
|---|---|
| Excuse agents use to skip steps | Why the excuse is wrong |

## Red Flags
- Behavioral patterns indicating the skill is being violated
- Things to watch for during review

## Verification
After completing the skill's process, confirm:
- [ ] Checklist of exit criteria
- [ ] Evidence requirements
```

---

## Skill Writing Guide

### 1. Descriptions Matter (Most Critical)

Agents discover skills by reading descriptions. The `description` field in the frontmatter is injected into the agent's system prompt, so it must tell the agent **both what the skill provides and when to activate it**.

```
description: Guides agents through [task/workflow]. Use when [specific trigger conditions].
```

**Rules:**
- Start with what the skill does in third person
- Include one or more clear "Use when" trigger conditions
- Include both *what* and *when*
- Maximum 1024 characters

**Anti-pattern:** Do not summarize the workflow in the description. If the description contains process steps, the agent may follow the summary instead of reading the full skill content — skipping important context, edge cases, and rationalizations.

### 2. Required vs Recommended

| Element | Required? |
|---------|-----------|
| `skills/<skill-name>/SKILL.md` file | **Required** |
| Valid YAML frontmatter with `name` and `description` | **Required** |
| Description that includes both what the skill does and when to use it | **Required** |
| Standard section flow (Overview, When to Use, Core Process, etc.) | **Recommended** |
| Equivalent headings (e.g. "How It Works" or "Workflow" instead of "Core Process") | **Recommended** |
| Supporting files | Only when they keep the main `SKILL.md` focused |
| `scripts/` directory | Only when the skill ships runnable helpers |

Use the recommended section layout below when creating a new skill. Equivalent headings are fine — what matters is that the same purpose is served clearly.

### 3. Section Purposes

Each section in the standard template serves a distinct purpose:

| Section | Purpose | Good Example | Bad Example |
|---------|---------|-------------|-------------|
| **Overview** | Elevator pitch: what does this skill do and why should an agent follow it? | "TDD catches bugs before they reach production by writing tests first." | "This skill covers testing." |
| **When to Use** | Decision criteria for agents and humans. Include positive triggers AND negative exclusions. | "Use when implementing any new logic. NOT for pure config changes." | "Use when writing code." |
| **Core Process** | The heart of the skill. Step-by-step workflow the agent follows. Must be specific and actionable. | "Run `npm test` and verify all tests pass." | "Make sure the tests work." |
| **Common Rationalizations** | Excuses agents use to skip steps, with rebuttals. Prevents the agent from rationalizing its way out of following the process. | `"I'll add tests after" → "Tests written after validate implementation, not design."` | (missing — agent will skip steps) |
| **Red Flags** | Observable signs the skill is being violated. Useful during review and self-monitoring. | "Writing code without any corresponding tests." | "Bad code." |
| **Verification** | Exit criteria checklist. Every checkbox must be verifiable with evidence. | `[ ] All tests pass: npm test` | `[ ] Code works` |

### 4. Writing Principles

Apply these principles in priority order when crafting a skill:

1. **Process over knowledge** — Skills are workflows, not reference docs. Write steps, not facts.
2. **Specific over general** — "Run `npm test`" beats "verify the tests".
3. **Evidence over assumption** — Every verification checkbox requires proof (test output, build result, screenshot, etc.).
4. **Anti-rationalization** — Every skip-worthy step needs a counter-argument in the rationalizations table. Think of every time an agent has said "I'll add tests later" or "This is simple enough" — those go here with a factual rebuttal.
5. **Progressive disclosure** — Main `SKILL.md` is the entry point. Supporting files are loaded only when needed.
6. **Token-conscious** — Every section must justify its inclusion. If removing it wouldn't change agent behavior, remove it.

### 5. Supporting Files Guidance

Create supporting files only when:
- Reference material exceeds ~100 lines (keep the main SKILL.md focused)
- Code tools or scripts are needed
- Checklists are long enough to justify separate files

Keep patterns and principles inline when under 50 lines.

If a skill does not need runnable helpers, do **not** create an empty `scripts/` directory just to mirror other skills. Empty directories add noise without changing how the skill works.

---

### Required Fields

| Field         | Description                                     | Required |
|---------------|------------------------------------------------|----------|
| `name`        | Skill name (1-64 characters, lowercase)     | Yes      |
| `description` | Description (1-1024 characters)                 | Yes      |
| `license`     | License                                       | No       |
| `compatibility` | Compatibility                                | No       |
| `metadata`    | Key-Value Map (Strings)                       | No       |

### Naming Rules

- 1-64 characters
- Only lowercase alphanumeric characters with simple hyphens
- Cannot start or end with `-`
- No consecutive `--`
| **Must match the directory name**

Regex: `^[a-z0-9]+(-[a-z0-9]+)*$`

---

## How Agents Discover Skills

OpenCode lists available skills in the `skill` tool description:

```xml
<available_skills>
  <skill>
    <name>git-release</name>
    <description>Create consistent releases and changelogs</description>
  </skill>
</available_skills>
```

The agent loads a skill with:
```
skill({ name: "git-release" })
```

---

## Configure Permissions

### Global

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "pr-review": "allow",
      "internal-*": "deny",
      "experimental-*": "ask"
    }
  }
}
```

| Permission | Behavior                                      |
|------------|-----------------------------------------------|
| `allow`    | The skill loads immediately                  |
| `deny`     | The skill is hidden, access denied               |
| `ask`      | Ask the user before loading             |

### Per Agent (Markdown)

```yaml
---
permission:
  skill:
    "documents-*": "allow"
---
```

### Per Agent (JSON)

```json
{
  "agent": {
    "plan": {
      "permission": {
        "skill": {
          "internal-*": "allow"
        }
      }
    }
  }
}
```

### Completely Disable the Skill Tool

```json
{
  "agent": {
    "plan": {
      "tools": {
        "skill": false
      }
    }
  }
}
```

---

## Troubleshooting

If a skill doesn't appear:

1. Check if `SKILL.md` is correctly capitalized
2. Check if the Frontmatter contains `name` and `description`
3. Ensure skill names are unique across all paths
4. Check permissions -- skills with `deny` are hidden

---

## Naming Conventions

- Skill directories: `lowercase-hyphen-separated`
- Skill files: `SKILL.md` (always uppercase)
- Supporting files: `lowercase-hyphen-separated.md`
- References: stored in `references/` at the project root, not inside skill directories

## Best Practices

1. **Write precise descriptions** -- The agent decides based on the Description whether to load the skill
2. **"When to use me" section** -- Helps the agent decide
3. **Modular skills** -- Each skill with a clear task
4. **Global skills for personal workflows** in `~/.config/opencode/skills/`
5. **Project skills for team workflows** in `.opencode/skills/` (commit to Git)

## Cross-Skill References

Reference other skills by name:

```markdown
Follow the @test-driven-development skill for writing tests.
If the build breaks, use the @debugging-and-error-recovery skill.
```

Don't duplicate content between skills — reference and link instead.

For **cross-phase navigation**, the [Meta-Skill](../../skills/using-agent-skills/SKILL.md) serves as the canonical index. Its Quick Reference table lists every skill alongside its phase, so agents and humans can find any skill from any entry point.

---

## Skill Examples

Ready-to-use skill definitions can be found in [`skills/`](../../skills/).