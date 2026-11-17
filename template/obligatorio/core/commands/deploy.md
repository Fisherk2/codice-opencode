---
description: Execute git workflow + CI/CD pipelines.
agent: mictlantecuhtli
---

## Pre-Flight: Detect Existing Workflow

**Delegate** `deployment-engineer` and `secrets-credential-engineer` subagents in parallel to detect the project's CI/CD infrastructure:

1. **Contributing Guidelines** - Check for @CONTRIBUTING.md in project root.
2. **Configuration Files** - Check for `.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`, `.travis.yml`, or other CI config directories.
3. **Branch Protection** - Check for branch protection rules (via CLI if available).
4. **PR/Issue conventions** - Check for existing PR/issue templates in CI config directories.
5. **Secrets/Credentials** - Check for existing secrets in CI/CD config directories.
6. **Pre-commit hooks** - Check for existing pre-commit hooks in the project.

Output summary:

```
PROJECT CI/CD STATE:
- CONTRIBUTING: [exists at <path> / missing / can be improved]
- Configuration files: [exists at <path> / missing / can be improved]
- Branch Protection: [exists at <path> / missing / can be improved]
- PR/Issue Conventions: [exists at <path> / missing / can be improved]
- Secrets/Credentials: [exists at <path> / missing / can be improved]
- Pre-commit hooks: [exists at <path> / missing / can be improved]
```

Use the `question` tool to report findings and ask user whether to:

- **A) Generate, Upgrade or improve an existing CI/CD workflow** - Proceed with phase 0 to generate a new CI/CD workflow or improve an existing one, then proceed to phase 1.
- **B) Execute the current workflow** - Run the current git workflow only with phase 1 and report results.

## Phase 0: Generate or Improve CI/CD Workflow

1. **Delegate** `build-engineer` and `platform-engineer` subagents in parallel to analyze the project:

- **Project Type**: Language, Framework, Build Systems, Test Frameworks, Deployment Targets.
- **Existing Config**: `Makefile`/`Justfile`, `package.json`, `Dockerfile`, `docker-compose.yml`, Kubernetes manifests, Terraform/Pulumi configs, Helm charts, etc.
- **Guardrails**: Typechecking, Linting, Formatting, Testing, Security Audits, Code Coverage, etc.

2. Use `question` tool to let the user choose:

A). Branching strategy (Trunk-based, Local Gitflow, Remote Gitflow, User-defined). If the user chooses User-defined branching strategy, **Load** `interview-me` skill and use `question` tool to clarify their branching strategy.
B). CI/CD platform (GitHub Actions, GitLab CI, CircleCI, Jenkins, etc.)
C). Pipeline stages (Lint, Test, Build, Deploy, etc. — toggle per stage)
D). Pre-commit hooks (Lint, Test, Build, etc. — toggle per hook)

3. **Delegate** `devops-engineer` and `devops-automator` subagents in parallel and **Load** `ci-cd-and-automation` skill to generate or improve the following files:

- Branch Protection Rules
- PR Template file in CI/CD config directory.
- Issue Template file in CI/CD config directory.
- CI Pipeline files configuration.
- Release Pipeline files configuration.
- CD Pipeline files configuration.
- Additional support script files in `scripts/` directory
- Pre-commit hooks, **Load** `setup-pre-commit` skill to configure them.

**Load** `bash-defensive-patterns` skill to ensure robust deployment scripts.

4. **Delegate** to `docs-writer` subagent and update or create `CONTRIBUTING.md` file to document the git workflow with:

- Branching strategy
- Commit message conventions
- PR process, **Load** `pr` skill to establish PR guidelines
- Review requirements
- Deployment procedure
- Rollback procedure

## Phase 1: Execute Deployment

For established workflow, **Delegate** `git-workflow-master` subagent and **Load** `git-workflow-and-versioning` skill to execute deployment with these steps:

1. Verify all tests pass on the latest commit
2. Verify the deployment target is reachable
3. Run the @CONTRIBUTING.md documented deployment procedure.
4. Confirm health checks pass
5. Verify the deployment is successful
6. Report deployment status

## Rules

- If subagent finds issues during deployment, stop and **Delegate** `debugger` subagent, **Load** `debugging-and-error-recovery` skill to diagnose and fix finding issues, then, come back and **Delegate** `git-workflow-master` subagent again to continue deployment.
- If agents are stuck or the deployment fails, **Delegate** to `incident-responder` subagent and **Load** `observability-and-instrumentation` skill to monitor errors and fix issues.
- If the incident responder can't resolve the issue, **Delegate** to `incident-response-commander` subagent and **Load** `incident-response` skill for triage, communication, and blameless postmortems.
- Always follow the rules of the project and git workflows.
- You can stop and ask the user for clarification if you need more information to complete the observation report.
- Use the best available tools for the job.
- Research external resources every time, specially if you are stuck or the deployment fails.

## Suggested Next Step

> Deployment finished. If issues arise, run `/diagnosis` to triage, then `/plan` to create implementation plans for the fixes.

---

User instructions:

