---
description: Execute git workflow + CI/CD pipelines.
agent: mictlantecuhtli
---

## Pre-Flight: Detect Existing Workflow

**Delegate** `deployment-engineer` subagent to detect the project's CI/CD infrastructure:

1. **Contributing Guidelines** - Check for @CONTRIBUTING.md in project root.
2. **Configuration Files** - Check for `.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`, `.travis.yml`, or other CI config directories.
3. **Branch Protection** - Check for branch protection rules (via CLI if available).
4. **PR/Issue conventions** - Check for existing PR/issue templates in CI config directories.

Output summary:

```
PROJECT CI/CD STATE:
- CONTRIBUTING: [exists at <path> / missing / can be improved]
- Configuration files: [exists at <path> / missing / can be improved]
- Branch Protection: [exists at <path> / missing / can be improved]
- PR/Issue Conventions: [exists at <path> / missing / can be improved]
```

Use the `question` tool to report findings and ask user whether to:

- **A) Generate, Upgrade or improve an existing CI/CD workflow** - Proceed with phase 0 to generate a new CI/CD workflow or improve an existing one, then proceed to phase 1.
- **B) Execute the current workflow** - Run the current git workflow only with phase 1 and report results.

## Phase 0: Generate or Improve CI/CD Workflow

1. **Delegate** `build-engineer` and `platform-engineer` subagents in parallel to analize the project:

- **Project Type**: Language, Framework, Build Systems, Test Frameworks, Deployment Targets.
- **Existing Config**: `Makefile`/`Justfile`, `package.json`, `Dockerfile`, `docker-compose.yml`, Kubernetes manifests, Terraform/Pulumi configs, Helm charts, etc.
- **Guardrails**: Typechecking, Linting, Formatting, Testing, Security Audits, Code Coverage, etc.

2. Use `question` tool to let the user choose:

A). Branching strategy (Trunk-based, Local Gitflow, Remote Gitflow, User-defined). If user choose User-defined branching strategy, **Load** `interview-me skill` skill and use `question` tool to clarify their branching strategy.
B). CI/CD platform (GitHub Actions, GitLab CI, CircleCI, Jenkins, etc.)
C). Pipeline stages (Lint, Test, Build, Deploy, etc. — toggle per stage)

3. **Load** @skills/ci-cd-and-automation/SKILL.md and **Delegate** `devops-engineer` subagent to generate or improve the following files:

- Branch Protection Rules
- PR Template file in CI/CD config directory.
- Issue Template file in CI/CD config directory.
- CI Pipeline files configuration.
- Release Pipeline files configuration.
- CD Pipeline files configuration.
- Aditional support script files in @scripts/

**Load** `bash-defensive-patterns` skill if needed to ensure robust deployment scripts.

4. Update or create @CONTRIBUTING.md with:

- Branching strategy
- Commit message conventions
- PR process
- Review requirements
- Deployment procedure
- Rollback procedure

## Phase 1: Execute Deployment

For established workflow, **Load** @skills/git-workflow-and-versioning/SKILL.md and **Delegate** `git-workflow-master` subagent to execute deployment with these steps:

1. Verify all tests pass on the latest commit
2. Verify the deployment target is reachable
3. Run the @CONTRIBUTING.md documented deployment procedure.
4. **Delegate** `debugger` subagent and **Load** `debugging-and-error-recovery` skill to diagnose and fix issues during deployment.
5. Confirm health checks pass
6. Report deployment status

If agents are stuck or the deployment fails, **Delegate** to `incident-responder` subagent and follow @skills/observability-and-instrumentation/SKILL.md to monitor errors and fix issues. 
If the incident responder can't resolve the issue, **Delegate** to `incident-response-commander` subagent and follow @skills/incident-response/SKILL.md for triage, communication, and blameless postmortems.

## Suggested Next Step

> Deployment finished. If issues arise, run `/diagnosis` to triage, then `/plan` to create implementation plans for the fixes.
