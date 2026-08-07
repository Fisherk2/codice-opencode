#!/bin/bash
#===============================================================================
# FEV-23-T1.2: Update Option B — Add-Packs Merge E2E (SC-UX7)
#
# Scenario: Seed a v2.0-rc installation (installedPacks: ["software-development"])
# and run --update --force --update-add-packs creative,business.
# --force + --update-add-packs is the non-interactive Option B path: the new
# packs are added while the installed packs are locked in.
#
# Expected (bundled 2.0.0 > seeded 2.0.0-rc.1 → merge RUNS):
#   - exit code 0
#   - output contains "updated to" (the merge actually ran)
#   - .codice-version records ALL THREE packs in installedPacks:
#     "software-development" (lock preserved), "creative", "business"
#   - agents/business-analyst.md EXISTS (business agents merged)
#   - agents/design-brand-guardian.md EXISTS (creative agent merged)
#   - agents/backend-developer.md EXISTS (software-development agents still
#     present — installed pack lock)
#
# SC-UX7: Option B adds new packs during an update; the installed packs are
# locked and can never be dropped by the add-packs flow.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Real agent filenames used for assertions
# ---------------------------------------------------------------------------
# software-development pack → agents/backend-developer.md (verified present)
# business pack             → agents/business-analyst.md (verified present)
# creative pack             → agents/design-brand-guardian.md (verified present)

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-23-T1.2: Update Option B — Add-Packs Merge E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# Seed a v2.0-rc installation with ONLY the software-development pack.
# 2.0.0-rc.1 is older than bundled 2.0.0 (semver) but passes the major>=2
# gate, so the update merge actually runs.
echo '{"version":"2.0.0-rc.1","installedPacks":["software-development"],"installedAt":"2026-01-01T00:00:00.000Z","optionalSelections":[]}' > "$TEMP_DIR/.codice-version"
log_info "Seeded .codice-version with v2.0.0-rc.1 installation (software-development only)"

# Start mock server
start_mock_server
log_info "Mock GitHub API pointing to $CODICE_GITHUB_API_URL"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_CLI --update --force --update-add-packs creative,business in $TEMP_DIR"
EXIT_CODE=0
STDERR_FILE="$TEMP_DIR/stderr.log"
STDOUT_FILE="$TEMP_DIR/stdout.log"
(cd "$TEMP_DIR" && CODICE_GITHUB_API_URL="http://localhost:4567" CODICE_BYPASS_URL_VALIDATION="true" NODE_ENV="test" $CODICE_CLI --update --force --update-add-packs creative,business) >"$STDOUT_FILE" 2>"$STDERR_FILE" || EXIT_CODE=$?

# Stop mock server
stop_mock_server

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "CLI exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "CLI exited with code 0"

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

# Combined output for message assertions (TUI messages emit on stdout via clack)
COMBINED_OUTPUT=$(cat "$STDOUT_FILE" "$STDERR_FILE" 2>/dev/null || echo "")

# 1. Merge actually ran (Option B is a real merge, not a no-op)
log_info "Checking that the CLI reported a completed update..."
assert_contains "$COMBINED_OUTPUT" "updated to"

# 2. Version file records ALL THREE packs (installed lock + added packs)
log_info "Checking that .codice-version records all three packs..."
assert_file_exists "$TEMP_DIR/.codice-version"

VERSION_DATA=$(cat "$TEMP_DIR/.codice-version" 2>/dev/null || echo "")
if ! echo "$VERSION_DATA" | grep -q '"installedPacks"'; then
    log_fail "Version file is missing 'installedPacks'"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
if ! echo "$VERSION_DATA" | grep -q '"software-development"'; then
    log_fail "Version file no longer lists 'software-development' in installedPacks (lock broken)"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
if ! echo "$VERSION_DATA" | grep -q '"creative"'; then
    log_fail "Version file does not list 'creative' in installedPacks"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
if ! echo "$VERSION_DATA" | grep -q '"business"'; then
    log_fail "Version file does not list 'business' in installedPacks"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "Version file records installedPacks with software-development, creative, business"

# 3. Business pack agent merged
log_info "Checking that business pack agent was merged..."
assert_file_exists "$TEMP_DIR/agents/business-analyst.md"

# 4. Creative pack agent merged
log_info "Checking that creative pack agent was merged..."
assert_file_exists "$TEMP_DIR/agents/design-brand-guardian.md"

# 5. Installed pack agents still present (lock preserved)
log_info "Checking that software-development pack agent is still present..."
assert_file_exists "$TEMP_DIR/agents/backend-developer.md"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-23-T1.2: All assertions passed"
