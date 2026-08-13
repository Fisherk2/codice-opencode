#!/usr/bin/env bash
# scripts/setup-branch-protection.sh
# Requires: GitHub CLI (gh)
# Usage: ./scripts/setup-branch-protection.sh

set -euo pipefail

# Confirm gh login
if ! gh auth status >/dev/null 2>&1; then
  echo "Error: gh not authenticated."
  exit 1
fi

REPO="fisherk2/codice-opencode"

echo "Setting up branch protection for $REPO..."

# Protect main
gh api --method PUT \
  "repos/$REPO/branches/main/protection" \
  -f required_status_checks[strict]=true \
  -f "required_status_checks[contexts][]"="quality / quality (ubuntu-latest)" \
  -f "required_status_checks[contexts][]"="quality / quality (macos-latest)" \
  -f "required_status_checks[contexts][]"="quality / quality (windows-latest)" \
  -f "required_pull_request_reviews[required_approving_review_count]"=1 \
  -f required_pull_request_reviews[dismiss_stale_reviews]=true \
  -f enforce_admins=true

# Protect develop
gh api --method PUT \
  "repos/$REPO/branches/develop/protection" \
  -f required_status_checks[strict]=true \
  -f "required_status_checks[contexts][]"="quality / quality (ubuntu-latest)" \
  -f "required_status_checks[contexts][]"="quality / quality (macos-latest)" \
  -f "required_status_checks[contexts][]"="quality / quality (windows-latest)" \
  -f "required_pull_request_reviews[required_approving_review_count]"=1 \
  -f required_pull_request_reviews[dismiss_stale_reviews]=true \
  -f enforce_admins=false

echo "Branch protection configured."
