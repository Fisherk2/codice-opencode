# Customization Guide

The Códice workspace is designed to be adapted to your workflow — not the other way around. This guide covers the most common customizations, from changing AI models to adding custom commands, grouped into practical recipes.

Each recipe follows the same structure: **Problem** → **Solution** → **Step-by-step** → **Verification**.

---

## Recipe 1: "I want to use a different AI model"

**Problem:** The workspace ships one default AI model (`opencode/big-pickle`), but you prefer a different provider — Claude Sonnet for complex reasoning, GPT-5 for general tasks, or DeepSeek for cost-sensitive work.

**Solution:** Change the `model` field in `opencode.json`. The template ships **no `providers` block**, so a provider that is not in OpenCode's built-in catalog needs one added first (Recipe 6).

**Step-by-step:**

1. Open `opencode.json` at the project root.
2. Locate the `model` field near the top of the file:
   ```json
   "model": "opencode/big-pickle",
   ```
3. Replace it with your preferred model reference. For example, to use Claude Sonnet 4 via OpenRouter:
   ```json
   "model": "openrouter/anthropic/claude-sonnet-4",
   ```
4. There is no `small_model` field to update: V1's `small_model` has no native V2 equivalent — OpenCode maps it to the built-in `title` agent's model (`agents.title.model`), and the template ships neither field.
5. If your model comes from OpenCode's built-in catalog, no further changes are needed — credentials connect via `/connect`. The template pre-configures no provider of its own, so an `openrouter/…` or enterprise endpoint requires the `providers` entry described in Recipe 6.

**Per-agent overrides:** You can use different models for specific agents. The key is `agents` (plural in V2), and `temperature` lives under `request.body`:
```json
"agents": {
  "tlaloc": {
    "model": "openrouter/anthropic/claude-sonnet-4",
    "request": { "body": { "temperature": 0.2 } }
  },
  "moctezuma": {
    "model": "openrouter/deepseek/deepseek-v4-flash",
    "request": { "body": { "temperature": 0.1 } }
  }
}
```

The shipped assignments — the ones you are overriding — are in `agents` of `opencode.json`: `huitzilopochtli` `opencode/big-pickle`, `quetzalcoatl` and `tezcatlipoca` `opencode/glm-5.3-flash-free`, `moctezuma` `opencode/nemotron-3.5-super-vl-free`, `tlaloc` `opencode/deepseek-v4.1-flash-free`, `mictlantecuhtli` `opencode/mimo-v2.6-flash-free`. See [Configuration](Configuration#agent-settings-reference).

**Verification:** Run any slash command (e.g., `/help`). The agent's response should reflect the new model's style and reasoning capabilities. Check the model identifier in the agent's response header in the OpenCode UI.

---

## Recipe 2: "I don't need certain skills"

**Problem:** The workspace includes 61 skills, but your team doesn't use UI/UX design, mobile development, or data analysis. These skills clutter the discovery tree and waste context when the agent scans the `skills/` directory.

**Solution:** Remove or rename skill directories you do not need. The agent discovers skills by scanning the filesystem — if the directory is gone or renamed, the skill won't be found.

**Step-by-step:**

1. Identify the skills you want to remove. Browse `skills/` and list the directories:
   ```bash
   ls skills/
   ```
2. Remove unwanted skills:
   ```bash
   rm -rf skills/ui-ux-design-pro skills/design-taste-frontend skills/spreadsheet-analysis
   ```
3. Alternatively, archive them instead of deleting — rename the directory with a leading underscore or `.bak` suffix:
   ```bash
   mv skills/ui-ux-design-pro skills/_ui-ux-design-pro
   ```
   The agent will not find `@skills/_ui-ux-design-pro/SKILL.md` and will skip it.
4. Nothing to register: V2 rebuilds the advertised skill list at every model step from the discovered sources, so a removed or renamed directory simply stops appearing. No skill index file ships that needs editing. If a **command** loads the skill by name, that step now degrades — check it (see the Caution below).

**Verification:** Ask an agent a question in the removed skill's domain (e.g., "Create a professional color palette for my app"). The agent should not reference the removed skill and should handle the request using general knowledge instead.

**Caution:** Some skills are referenced by commands. Removing a skill that a command depends on (e.g., removing `test-driven-development` when `/build` expects it) may cause agents to proceed without the structured workflow. Check which commands reference the skill before removing it.

---

## Recipe 3: "I want to add a custom command"

**Problem:** The workspace has 18 SDD commands, but your workflow needs a custom phase — for example, your own `/deploy` that handles deployment to your specific infrastructure.

**Solution:** Create a new command file in `commands/`. OpenCode discovers command files automatically — no registration step is required.

**Step-by-step:**

1. Create `commands/deploy.md` with YAML frontmatter and numbered steps:
   ```markdown
   ---
   description: Deploy the application to a target environment with rollback support
   agent: tlaloc
   ---

   ## Phase 0 — Pre-flight: Detect Target Environment

   1. Check for deployment config files (Dockerfile, compose.yml, etc.).
   2. Use the `question` tool to let the user select the target environment.
   3. Validate required environment variables are set.

   ## Phase 1 — Build and Package

   1. Run the build step for the detected environment.
   2. Package the application into the deployable artifact.
   3. Verify the artifact is valid (checksum, size check).

   ## Rules

   1. Never deploy without a health check verification step.
   2. Always have a rollback plan before starting the deploy.

   ## Suggested Next Step

   > Deployment complete. Run `/diagnosis` to monitor for issues.
   ```

2. Save the file. OpenCode reloads command files as you edit them, so the command is available without restarting the session (see [Commands](Commands#step-3-its-live)). `/deploy` ships in the payload, so this override is re-copied by the next update — pick a name the template does not use (for example `commands/release-notes.md`) if you want your version to survive.

**Verification:** Type `/deploy` in OpenCode. The command should load and the target agent (tlaloc, in this example) should follow the workflow steps you defined.

---

## Recipe 4: "I want to rename my project"

**Problem:** You installed the workspace with placeholder names (e.g., "My Project") and now need to update it to your actual project name so agents use the correct name in documentation, configuration, and responses.

**Solution:** Update three key files that contain the project name. The workspace template uses your project directory name as a starting point, but you may want a distinct display name.

**Step-by-step:**

1. **Update `README.md`** — Change the title and description at the top of the file:
   ```markdown
   # Your Project Name
   > One-line description of what your project does.
   ```
   Update any usage instructions, installation paths, or links that reference the old name.

2. **Update `package.json`** (if your project uses one) — Change the `name`, `description`, and `repository` fields:
   ```json
   {
     "name": "your-project-name",
     "description": "What your project does",
     "repository": "https://github.com/your-org/your-project"
   }
   ```

3. **Update `opencode.json`** — the shipped configuration has **no** `name` field (its top-level keys are `$schema`, `formatter`, `compaction`, `model`, `default_agent`, `agents`, `instructions`, `references`, `plugins`, `mcp`, `permissions`), so there is nothing to rename here. Only touch it if you added project-specific fields yourself:
   ```jsonc
   // no name field in the template payload — skip unless you added one
   ```

4. **Update workspace name in agent context** — If you have agent files that reference the project by name, update those too. Agent files in `agents/` may mention the project in their role descriptions or rules:
   ```markdown
   # Your Project Name Agent Instructions
   ```

**Verification:** Run `/help` and check that agents refer to your project by the new name in their responses. Verify that `README.md` renders correctly with the updated name.

---

## Recipe 5: "I want to change agent permissions"

**Problem:** The default permission model is restrictive by design — agents must ask before running most shell commands and cannot read credential files. Your team may need to broaden or further restrict these boundaries.

**Solution:** Edit the `permission` section in `opencode.json`. The permission system has three levels: `allow` (no prompt), `ask` (prompt before executing), and `deny` (block entirely).

**Step-by-step:**

1. Open `opencode.json` and locate the `permissions` **array** — one ordered list of `{ "action": …, "resource": …, "effect": … }` rules, where the **last matching rule wins** (V1's singular `permission` map, keyed by tool with `allow`/`ask`/`deny` values, is legacy).

2. **Add new deny patterns for file reads** — Prevent agents from reading files you consider sensitive. Append the denies **after** the broad allow, and use whole-value wildcards: V2 has no `**` recursion syntax, and `*` already crosses `/`:
   ```json
   [
     { "action": "read", "resource": "*", "effect": "allow" },
     { "action": "read", "resource": "*.env", "effect": "deny" },
     { "action": "read", "resource": ".npmrc", "effect": "deny" },
     { "action": "read", "resource": "*.pem", "effect": "deny" },
     { "action": "read", "resource": "secrets/*", "effect": "deny" },
     { "action": "read", "resource": "deployment-keys/*", "effect": "deny" }
   ]
   ```
   The template already denies most of these — see [Credential Protection](Configuration#credential-protection) before duplicating a rule.

3. **Restrict shell commands** — V2 renamed the V1 `bash` action to `shell`. Append rules to the same array:

   ```json
   [
     { "action": "shell", "resource": "*", "effect": "ask" },
     { "action": "shell", "resource": "ls", "effect": "allow" },
     { "action": "shell", "resource": "cat *", "effect": "allow" },
     { "action": "shell", "resource": "docker exec *", "effect": "deny" },
     { "action": "shell", "resource": "kubectl exec *", "effect": "deny" },
     { "action": "shell", "resource": "sudo *", "effect": "deny" }
   ]
   ```

4. **Allow specific commands** — If your agents frequently need `npm install` or `go build`, append them as `allow` after the broad rule so they stop prompting:

   ```json
   [
     { "action": "shell", "resource": "npm install", "effect": "allow" },
     { "action": "shell", "resource": "npm install *", "effect": "allow" },
     { "action": "shell", "resource": "go build *", "effect": "allow" }
   ]
   ```

5. **Control delegation** — V1's `task` action is now `subagent`. Deny everything, then allow the specialists you trust:

   ```json
   [
     { "action": "subagent", "resource": "*", "effect": "deny" },
     { "action": "subagent", "resource": "code-reviewer", "effect": "allow" },
     { "action": "subagent", "resource": "docs-writer", "effect": "allow" }
   ]
   ```

   Global rules sit **before** agent-file rules, and an agent's own `permissions` are appended after them — that is how the six primaries keep their deny-lists. See [Configuration](Configuration#subagent-rules--subagent-delegation).

**Verification:** Ask an agent to run a blocked command (e.g., `sudo apt update`). It should either ask for permission or refuse. Then ask it to run an allowed command (e.g., `ls`). It should execute without prompting.

---

## Recipe 6: "I want to add a new provider"

**Problem:** The workspace ships **no providers at all** — `opencode.json` has no `providers` key — so the models that work out of the box come from OpenCode's built-in catalog with credentials via `/connect`. You want a provider that catalog does not cover: a custom enterprise endpoint or a less common AI service.

**Solution:** Add a `providers` section (plural in V2; the singular `provider` map is the legacy V1 name) with your endpoint and its models.

**Step-by-step:**

1. Open `opencode.json`. There is no provider section to locate — you are adding one, for example next to the `model` field.

2. Add your provider entry with the model key and its settings/variants (variants are an **array** of `{ id, settings }`, selected with `#variant`):
   ```jsonc
   "providers": {
     "my-enterprise": {
       "models": {
         "my-custom-model": {
           "settings": {
             "temperature": 0.3,
             "maxTokens": 4096
           },
           "variants": [
             { "id": "deep-think", "settings": { "temperature": 0.1, "maxTokens": 8192 } },
             { "id": "economy", "settings": { "temperature": 0.5, "maxTokens": 2048 } }
           ]
         }
       }
     }
   }
   ```
   See [Configuration](Configuration#per-model-options) for the full shape.

3. Set the model as your default (or use it for specific agents):
   ```json
   "model": "my-enterprise/my-custom-model"
   ```

4. Add the required API key as an environment variable (the provider configuration may reference it). Refer to your provider's documentation for the exact environment variable name and format.

**Verification:** Change the `model` field to your new provider's model key and run any command. The agent should use the new model. Check the response header in the OpenCode UI to confirm the model identifier matches.

---

## Recipe 7: "I want to disable the review step"

**Problem:** The SDD cycle includes a `/review` phase that runs a five-axis code review. For small personal projects or rapid prototyping, the review step adds friction without corresponding value — you want to skip it.

**Solution:** There is no configuration toggle for this. The SDD cycle is workflow guidance, not enforcement. Simply do not call `/review`, or configure the command to be hidden.

**Step-by-step (option A — skip it):**

1. Follow the SDD cycle as usual through `/spec` → `/plan` → `/build` → `/test`.
2. When `/test` finishes, it will suggest: *"Run `/code-simplify` to refactor and simplify the code, or run `/webperf` to optimize web performance, or run `/review` to review the latest implementations."*
3. Ignore the suggestion and call `/ship` directly if you are ready for launch. The SDD pipeline does not enforce a mandatory order.

**Step-by-step (option B — hide the command):**

1. Command frontmatter in the payload carries only `description` and `agent` (validated by `tests/unit/domain/command-frontmatter-validation.test.ts`); nothing ships a hidden command. Check the current V2 command reference before adding a `hidden:` key — if your build ignores it, the command stays in the picker.
2. To be sure it disappears, move the file out of `commands/` (e.g. `mv commands/review.md commands/_review.md.disabled`).
3. OpenCode reloads command files as you save them, so no session restart is needed.

**Verification:** Type `/ship` after a build without running `/review` first. The ship command should proceed normally. If you removed the command, typing `/review` should produce a "command not found" response.

---

## Recipe 8: "I want to use this workspace for a non-coding project"

**Problem:** The workspace is designed for software development — SDD cycles, code reviews, TDD, builds. But you work on a different domain: technical writing, data analysis, system administration, or project management.

**Solution:** The agents and skills adapt to your content. Skip the code-specific commands and focus on the ones that apply. The spec, plan, and documentation workflows work for any domain.

**Step-by-step:**

1. **Install the workspace** normally:
   ```bash
   bunx @fisherk2-dev/codice
   ```

2. **Run `/spec` to define your project** — Use this to describe what you are building, whether it is a documentation site, a research paper, a system architecture, or a training curriculum. Quetzalcoatl will ask about your goals, audience, and deliverables in domain-agnostic terms.

3. **Run `/plan` to break it into tasks** — Moctezuma will create a task breakdown regardless of domain. For a documentation project, tasks might be: "Write introduction section," "Create API reference," "Review for consistency."

4. **Run `/build` or work manually** — For non-coding projects, `/build` may be less useful. Use the generated plan as a checklist and work manually. Or skip `/build` entirely and use `/test` to verify deliverables against your criteria.

5. **Use applicable skills** — Many skills are domain-agnostic:
   - `crafting-effective-readmes` — Works for any project documentation
   - `architecture-diagrams` — System architecture, network topology, org charts
   - `documentation-and-adrs` — Decision records for any domain
   - `git-workflow-and-versioning` — Version control for any content
   - `incident-response` — Incident management regardless of domain
   - `spreadsheet-analysis` — Data analysis for spreadsheets

6. **Disable code-specific commands** — Commands that are code-specific (`/build`, `/test`, `/code-simplify`, `/review`) do nothing unless you call them, so the simplest route is to ignore them. To take them out of the picker entirely, move their files out of `commands/` (Recipe 7, option B).

**Verification:** Run through the SDD cycle for a non-coding deliverable. For example, run `/spec` with "I want to create a technical documentation site for a REST API." The agent should produce a `SPEC.md` with sections for audience analysis, content structure, style guide, and delivery timeline — without assuming code implementation.

---

## General Customization Tips

### Files You Should Never Edit

These files are marked as **obligatorio** in the template — they will be overwritten on every update:

| File | Reason |
|------|--------|
| `agents/*.md` | Agent behavior definitions are updated with template releases |
| `commands/*.md` | Command workflows may be updated to fix bugs or add features |
| `opencode.json` (model/permission sections) | Core configuration updated with each release |

### Files That Are Yours to Customize

These files are marked as **estándar** — they are created once and never overwritten:

| File | Reason |
|------|--------|
| `README.md` | Your project's public face |
| `CONTRIBUTING.md` | Your team's contribution guidelines |
| `SPEC.md` | Your project specification |
| `docs/*.md` | Your project documentation |
| `specs/*.md` | Your modular specs (ADRs go in `docs/adr/`) |

### Preserving Customizations During Updates

When you run **Update Workspace** mode, only **obligatorio** files are overwritten. Standard files are preserved exactly as you customized them. Optional files are never touched in update mode. This means you can safely customize `README.md`, `docs/`, `specs/`, and `tasks/` without fear of losing changes during an update.

If you have customized an obligatorio file (such as `opencode.json`), make a backup before updating — the update will overwrite it with the template version.

---

## Links

- [Configuration](Configuration) — Full reference for `opencode.json` settings.
- [MCP Servers](MCP-Servers) — Pre-configured MCP servers, activation, and per-agent control.
- [Agents](Agents) — Agent permission model and how to add new agents.
- [Commands](Commands) — Adding and modifying slash commands.
- [Workspace Structure](Workspace-Structure) — File classification and update behavior.
- [opencode.ai/v2/docs/config](https://opencode.ai/v2/docs/config/) — Official OpenCode configuration reference.
