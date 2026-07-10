# Customization Guide

The Códice workspace is designed to be adapted to your workflow — not the other way around. This guide covers the most common customizations, from changing AI models to adding custom commands, grouped into practical recipes.

Each recipe follows the same structure: **Problem** → **Solution** → **Step-by-step** → **Verification**.

---

## Recipe 1: "I want to use a different AI model"

**Problem:** The workspace ships with a default AI model (`nvidia/stepfun-ai/step-3.7-flash`), but you prefer a different provider — Claude Sonnet for complex reasoning, GPT-5 for general tasks, or DeepSeek for cost-sensitive work.

**Solution:** Change the `model` and `small_model` fields in `opencode.json`. The template ships with 7 pre-configured providers, so switching is typically a one-field change.

**Step-by-step:**

1. Open `opencode.json` at the project root.
2. Locate the `model` field near the top of the file:
   ```json
   "model": "nvidia/stepfun-ai/step-3.7-flash",
   ```
3. Replace it with your preferred model reference. For example, to use Claude Sonnet 4 via OpenRouter:
   ```json
   "model": "openrouter/anthropic/claude-sonnet-4",
   ```
4. Optionally update the `small_model` for lightweight operations:
   ```json
   "small_model": "openrouter/anthropic/claude-haiku-4-5",
   ```
5. If the provider is already configured in the `provider` section (all 7 are), no further changes are needed. The template includes configurations for Anthropic, DeepSeek, Google, OpenAI, MiniMax, Moonshot, and Z-AI.

**Per-agent overrides:** You can use different models for specific agents:
```json
"agent": {
  "tlaloc": {
    "model": "openrouter/anthropic/claude-sonnet-4",
    "temperature": 0.2
  },
  "moctezuma": {
    "model": "openrouter/deepseek/deepseek-v4-flash",
    "temperature": 0.1
  }
}
```

**Verification:** Run any slash command (e.g., `/help`). The agent's response should reflect the new model's style and reasoning capabilities. Check the model identifier in the agent's response header in the OpenCode UI.

---

## Recipe 2: "I don't need certain skills"

**Problem:** The workspace includes 46 skills, but your team doesn't use UI/UX design, mobile development, or data analysis. These skills clutter the discovery tree and waste context when the agent scans the `skills/` directory.

**Solution:** Remove or rename skill directories you do not need. The agent discovers skills by scanning the filesystem — if the directory is gone or renamed, the skill won't be found.

**Step-by-step:**

1. Identify the skills you want to remove. Browse `skills/` and list the directories:
   ```bash
   ls skills/
   ```
2. Remove unwanted skills:
   ```bash
   rm -rf skills/ui-ux-design-pro skills/design-taste-frontend skills/xlsx
   ```
3. Alternatively, archive them instead of deleting — rename the directory with a leading underscore or `.bak` suffix:
   ```bash
   mv skills/ui-ux-design-pro skills/_ui-ux-design-pro
   ```
   The agent will not find `@skills/_ui-ux-design-pro/SKILL.md` and will skip it.
4. Update `skills/using-agent-skills/SKILL.md` to remove the deleted skills from the discovery tree and Quick Reference table. This prevents the meta-skill from suggesting skills that no longer exist.

**Verification:** Ask an agent a question in the removed skill's domain (e.g., "Create a professional color palette for my app"). The agent should not reference the removed skill and should handle the request using general knowledge instead.

**Caution:** Some skills are referenced by commands. Removing a skill that a command depends on (e.g., removing `test-driven-development` when `/build` expects it) may cause agents to proceed without the structured workflow. Check which commands reference the skill before removing it.

---

## Recipe 3: "I want to add a custom command"

**Problem:** The workspace has 12 SDD commands, but your workflow needs a custom phase — for example, a `/deploy` command that handles deployment to your specific infrastructure.

**Solution:** Create a new command file in `commands/` and register it in the SDD pipeline plugin.

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

2. Register the command in `.opencode/plugins/sdd-pipeline.ts`:
   ```typescript
   const COMMAND_AGENT_MAP: Record<string, string> = {
     // ... existing commands ...
     "/deploy": "tlaloc",
   }
   ```

3. Optional: Add intent patterns so the SDD plugin auto-detects when a user's question should trigger `/deploy`:
   ```typescript
   const INTENT_PATTERNS: Record<string, string[]> = {
     "/deploy": [
       "deploy", "desplegar", "release", "push to production",
       "go live", "roll out",
     ],
   }
   ```

4. Restart your OpenCode session.

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

3. **Update `opencode.json`** — The workspace name is referenced in the configuration. Update any `name`-related fields or file paths that include the old project name:
   ```json
   {
     "name": "Your Project",
     ...
   }
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

1. Open `opencode.json` and locate the `permission` section (around line 403).

2. **Add new deny patterns for file reads** — Prevent agents from reading files you consider sensitive:
   ```json
   "read": {
     "*": "allow",
     "*.env": "deny",
     ".npmrc": "deny",
     "*.pem": "deny",
     "secrets/**": "deny",
     "deployment-keys/*": "deny"
   }
   ```

3. **Restrict bash commands** — Add patterns to block commands your team considers unsafe:
   ```json
   "bash": {
     "*": "ask",
     "ls": "allow",
     "cat *": "allow",
     "docker exec *": "deny",
     "kubectl exec *": "deny",
     "sudo *": "deny",
     ...
   }
   ```

4. **Allow specific commands** — If your agents frequently need `npm install` or `go build`, add them as `allow` to reduce friction:
   ```json
   "npm install": "allow",
   "npm install *": "allow",
   "go build *": "allow"
   ```

5. **Control task delegation** — Restrict which subagents a primary agent can invoke:
   ```json
   "task": {
     "*": "deny",
     "code-reviewer": "allow",
     "docs-writer": "allow"
   }
   ```

**Verification:** Ask an agent to run a blocked command (e.g., `sudo apt update`). It should either ask for permission or refuse. Then ask it to run an allowed command (e.g., `ls`). It should execute without prompting.

---

## Recipe 6: "I want to add a new provider"

**Problem:** The workspace ships with 7 providers (Anthropic, DeepSeek, Google, OpenAI, MiniMax, Moonshot, Z-AI), but you want to use a provider not on that list — for example, a custom enterprise endpoint or a less common AI service.

**Solution:** Add a new entry in the `provider` section of `opencode.json` following the existing provider format.

**Step-by-step:**

1. Open `opencode.json` and locate the `provider` section (around line 13).

2. Add a new provider entry. Follow the pattern of existing providers. At minimum, you need a provider name, a model key, and options:
   ```json
   "provider": {
     "my-enterprise": {
       "models": {
         "my-custom-model": {
           "options": {
             "temperature": 0.3,
             "maxTokens": 4096
           },
           "variants": {
             "deep-think": {
               "temperature": 0.1,
               "maxTokens": 8192
             },
             "economy": {
               "temperature": 0.5,
               "maxTokens": 2048
             }
           }
         }
       }
     },
     // ... existing providers remain ...
   }
   ```

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

1. Open `.opencode/plugins/sdd-pipeline.ts`.
2. Remove `/review` from the `COMMAND_AGENT_MAP`:
   ```typescript
   const COMMAND_AGENT_MAP: Record<string, string> = {
     "/spec": "quetzalcoatl",
     // ... keep everything except "/review"
   }
   ```
3. Restart OpenCode. The `/review` command will no longer be recognized.

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
   - `excel-analysis` — Data analysis for spreadsheets

6. **Disable code-specific commands** — If you do not write code, consider hiding commands that are code-specific:
   ```typescript
   // In .opencode/plugins/sdd-pipeline.ts
   // Remove: "/build", "/test", "/code-simplify", "/review"
   ```
   Or simply ignore them — they will not interfere if you do not call them.

**Verification:** Run through the SDD cycle for a non-coding deliverable. For example, run `/spec` with "I want to create a technical documentation site for a REST API." The agent should produce a `SPEC.md` with sections for audience analysis, content structure, style guide, and delivery timeline — without assuming code implementation.

---

## General Customization Tips

### Files You Should Never Edit

These files are marked as **obligatorio** in the template — they will be overwritten on every update:

| File | Reason |
|------|--------|
| `agents/*.md` | Agent behavior definitions are updated with template releases |
| `commands/*.md` | Command workflows may be updated to fix bugs or add features |
| `.opencode/plugins/sdd-pipeline.ts` | SDD routing and validation logic is maintained by the template |
| `opencode.json` (model/permission sections) | Core configuration updated with each release |

### Files That Are Yours to Customize

These files are marked as **estándar** — they are created once and never overwritten:

| File | Reason |
|------|--------|
| `README.md` | Your project's public face |
| `CONTRIBUTING.md` | Your team's contribution guidelines |
| `SPEC.md` | Your project specification |
| `docs/*.md` | Your project documentation |
| `specs/*.md` | Your modular specs and ADRs |

### Preserving Customizations During Updates

When you run **Update Workspace** mode, only **obligatorio** files are overwritten. Standard files are preserved exactly as you customized them. Optional files are never touched in update mode. This means you can safely customize `README.md`, `docs/`, `specs/`, and `tasks/` without fear of losing changes during an update.

If you have customized an obligatorio file (such as `opencode.json`), make a backup before updating — the update will overwrite it with the template version.

---

## Links

- [Configuration](Configuration) — Full reference for `opencode.json` settings.
- [Agents](Agents) — Agent permission model and how to add new agents.
- [Commands](Commands) — Adding and modifying slash commands.
- [Workspace Structure](Workspace-Structure) — File classification and update behavior.
- [opencode.ai/docs/configuration](https://opencode.ai/docs/configuration) — Official OpenCode configuration reference.
