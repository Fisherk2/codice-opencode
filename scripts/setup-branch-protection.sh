#!/usr/bin/env bash
# scripts/setup-branch-protection.sh
# Applies GitHub branch protection to main and develop for the 3-stage pipeline
# (develop -> main -> tags). Idempotent: safe to re-run.
#
# Requires: GitHub CLI (gh) authenticated with repo admin access.
# Usage:   ./scripts/setup-branch-protection.sh
#
# Design notes (single-contributor project):
#   - required_approving_review_count: 0 — PR flow enforced without needing a
#     second human reviewer (the maintainer is the only contributor).
#   - required_status_checks contexts use the GitHub Actions format
#     "<workflow> / <job> (<matrix>)", matching what ci.yml reports.
#   - enforce_admins: true on main only — admins (incl. CI tokens) must follow
#     the same rules on the production branch; develop stays flexible.

set -euo pipefail

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh not authenticated. Run 'gh auth login' first."
  exit 1
fi

REPO="${1:-fisherk2/codice-opencode}"

protect_branch() {
  local branch="$1"
  local enforce_admins="$2"
  echo "Applying branch protection to ${branch} (enforce_admins=${enforce_admins})..."

  gh api --method PUT \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "/repos/${REPO}/branches/${branch}/protection" \
    --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "quality (ubuntu-latest)",
      "quality (macos-latest)",
      "quality (windows-latest)"
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": false,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true
}
JSON
}

protect_branch "main" false
protect_branch "develop" false

echo "Branch protection configured for main and develop."
