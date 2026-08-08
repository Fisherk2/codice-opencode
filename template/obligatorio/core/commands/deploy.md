---
description: Configure and execute git workflow + CI/CD pipelines. Detects project type, proposes workflow, and generates modular configurations
agent: mictlantecuhtli
---

**SDD Flow Position:** After `/ship` (ship reviews before launch, deploy launches to production).

## Pre-Flight: Detect Existing Workflow

1. Check for `CONTRIBUTING.md` in project root.
2. Check for `.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`, `.travis.yml`, or other CI config directories.
3. Check for branch protection rules (via `gh` CLI if available, GitHub only).
4. Check for existing PR templates in `.github/PULL_REQUEST_TEMPLATE.md`.

Use the `question` tool to ask the user: **"What is the current state of your CI/CD setup?"** with options:
- **A) No workflow configured** — generate from scratch
- **B) Basic workflow, needs improvements** — analyze and optimize
- **C) Established workflow** — execute the documented workflow
- **D) Just analyze** — generate report without making changes

## Phase 1: Project Analysis (if A, B, or D)

Detect project characteristics:

### Project Type
- **Language:** JavaScript/TypeScript, Python, Rust, Go, Java, Ruby, etc.
- **Framework:** Next.js, Express, Django, Spring Boot, etc.
- **Build system:** npm, yarn, pnpm, cargo, maven, gradle, etc.
- **Test framework:** Jest, pytest, cargo test, etc.
- **Deployment target:** Vercel, Netlify, AWS, GCP, Azure, self-hosted, etc.

### Existing Config
- `package.json` scripts
- Docker / docker-compose files
- Kubernetes manifests
- Terraform / Pulumi configs
- Helm charts

**If the user selected D (Just analyze):** stop after this phase, generate an analysis
report (current workflow state, detected gaps, recommended improvements) and exit
**without writing any files or running any commands** that mutate the project.

## Phase 2: Propose Workflow (if A or B)

For a new project, propose improvements over the existing basic workflow:

### Branching Strategy
- **Trunk-based** — single `main` branch, short-lived feature branches, deploy from main
- **Gitflow** — `main` + `develop` branches, release branches, hotfix branches
- **GitHub Flow** — `main` + feature branches via PRs

### CI/CD Platform
- **GitHub Actions** — if repo is on GitHub
- **GitLab CI** — if repo is on GitLab
- **CircleCI / Travis CI** — for cross-platform CI
- **Jenkins** — for self-hosted enterprise

### Pipeline Stages
1. **Lint** — ESLint, Prettier, Biome, etc.
2. **Test** — unit, integration, e2e
3. **Build** — production bundle
4. **Deploy** — staging → production (with approval gates)

Use `question` tool to let the user choose:
1. Branching strategy
2. CI/CD platform
3. Pipeline stages (toggle per stage)

## Phase 3: Generate Configurations (if A or B)

Create modular files:

### Branch Protection Rules (if GitHub)
```bash
gh api repos/:owner/:repo/branches/main/protection -X PUT --input branch-protection.json
```

Or document manual steps in CONTRIBUTING.md.

### PR Template
`.github/PULL_REQUEST_TEMPLATE.md`:
```markdown
## Summary
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Changes
- [Describe changes]

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guide
- [ ] Self-reviewed
- [ ] Comments added for complex logic
- [ ] Documentation updated
```

### CI Pipeline (GitHub Actions example)
`.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # GitHub-hosted runners do not ship Bun; install it explicitly.
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun test
      - run: bun run lint
```

### Deployment Strategy
- **Blue-green** — zero-downtime via parallel environments
- **Canary** — gradual rollout to subset of users
- **Rolling** — sequential instance replacement
- **Feature flag** — deploy hidden, enable via flag

## Phase 4: Update Documentation (if A or B)

Update or create `CONTRIBUTING.md` with:

- Branching strategy
- Commit message conventions
- PR process
- Review requirements
- Deployment procedure
- Rollback procedure

## Phase 5: Execute Deployment (if C)

For established workflow:

1. Verify all tests pass on the latest commit
2. Verify the deployment target is reachable
3. Run the documented deployment commands
4. Monitor for errors during deployment
5. Confirm health checks pass
6. Report deployment status

## Rules

1. **Never auto-push to `main`** — always require explicit user approval.
2. **Test deployment in staging first** — unless the user explicitly requests direct-to-prod.
3. **Document every config change** — commit message should explain why.
4. **Modular configurations** — split large pipelines into reusable workflows.
5. **Secrets via CI/CD platform** — never commit secrets to git.
6. **Rollback procedure mandatory** — every deployment must have a documented rollback.

## Skills Used

- `@skills/ci-cd-and-automation/SKILL.md` — for pipeline design
- `@skills/git-workflow-and-versioning/SKILL.md` — for branching strategy
- `@skills/bash-defensive-patterns/SKILL.md` — for robust deployment scripts
- `@skills/observability-and-instrumentation/SKILL.md` — for deployment monitoring
- `@skills/interview-me/SKILL.md` — for asking about CI/CD preferences

## Suggested Next Step

> Deployment configured. Run `/ship` to review before launch, then run `/deploy` again with mode C to execute. If issues arise, run `/diagnosis` to triage.
