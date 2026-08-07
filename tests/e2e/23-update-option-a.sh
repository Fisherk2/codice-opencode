#!/bin/bash
#===============================================================================
# FEV-23-T3.2: Update Option A — Installed-Pack Scoped Merge E2E (SC-UX6)
#
# Scenario: Seed a v2.0-rc installation (installedPacks: ["software-development"])
# with a custom user agent file, then run --update --force. --force makes the
# update non-interactive, which resolves to Option A (installed packs only,
# no pack menu).
#
# Expected (bundled 2.0.0 > seeded 2.0.0-rc.1 → merge RUNS):
#   - exit code 0
#   - output contains "updated to" (the merge actually ran)
#   - agents/business-analyst.md MISSING (business not in installedPacks →
#     Option A scope)
#   - agents/business-custom.md EXISTS (user's custom file preserved —
#     update never deletes)
#   - .codice-version records installedPacks with "software-development"
#     and NOT "business" (Option A does not add packs)
#
# SC-UX6: an update only touches agents from the installed packs; packs not
# in installedPacks are never merged, and user files are never removed.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Real agent filenames used for assertions
# ---------------------------------------------------------------------------
# business pack             → agents/business-analyst.md (verified present)
# software-development pack → agents/backend-developer.md (verified present)

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-23-T3.2: Update Option A — Installed-Pack Scoped Merge E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# Seed a v2.0-rc installation with ONLY the software-development pack.
# 2.0.0-rc.1 is older than bundled 2.0.0 (semver) but passes the major>=2
# gate, so the update merge actually runs.
echo '{"version":"2.0.0-alpha.1","installedPacks":["software-development"],"installedAt":"2026-01-01T00:00:00.000Z","optionalSelections":[]}' > "$TEMP_DIR/.codice-version"
log_info "Seeded .codice-version with v2.0.0-alpha.1 installation (software-development only)"

# Pre-create a user's custom agent file — must survive the update
mkdir -p "$TEMP_DIR/agents"
echo "# User's custom business file" > "$TEMP_DIR/agents/business-custom.md"
log_info "Pre-created custom user file agents/business-custom.md"

# Start mock server
start_mock_server
log_info "Mock GitHub API pointing to $CODICE_GITHUB_API_URL"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_CLI --update --force in $TEMP_DIR"
EXIT_CODE=0
STDERR_FILE="$TEMP_DIR/stderr.log"
STDOUT_FILE="$TEMP_DIR/stdout.log"
(cd "$TEMP_DIR" && CODICE_GITHUB_API_URL="http://localhost:4567" CODICE_BYPASS_URL_VALIDATION="true" NODE_ENV="test" $CODICE_CLI --update --force) >"$STDOUT_FILE" 2>"$STDERR_FILE" || EXIT_CODE=$?

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

# 1. Merge actually ran (Option A is a real merge, not a no-op)
log_info "Checking that the CLI reported a completed update..."
assert_contains "$COMBINED_OUTPUT" "updated to"

# 2. Business pack agent ABSENT (business not in installedPacks → Option A scope)
log_info "Checking that business pack agent was NOT merged (not in installedPacks)..."
assert_file_missing "$TEMP_DIR/agents/business-analyst.md"

# 3. User's custom file PRESERVED (update never deletes)
log_info "Checking that the user's custom agent file was PRESERVED..."
assert_file_exists "$TEMP_DIR/agents/business-custom.md"

# 4. Version file still records software-development only (no business)
log_info "Checking that .codice-version still records software-development only..."
assert_file_exists "$TEMP_DIR/.codice-version"

VERSION_DATA=$(cat "$TEMP_DIR/.codice-version" 2>/dev/null || echo "")
if ! echo "$VERSION_DATA" | grep -q '"installedPacks"'; then
    log_fail "Version file is missing 'installedPacks'"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
if ! echo "$VERSION_DATA" | grep -q '"software-development"'; then
    log_fail "Version file no longer lists 'software-development' in installedPacks"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
if echo "$VERSION_DATA" | grep -q '"business"'; then
    log_fail "Version file records 'business' in installedPacks — Option A must not add packs"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "Version file records installedPacks with software-development (no business)"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-23-T3.2: All assertions passed"
