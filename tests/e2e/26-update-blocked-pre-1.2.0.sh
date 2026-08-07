#!/bin/bash
#===============================================================================
# SC-UX12: Update Blocked — Pre-1.2.0 Installation E2E
#
# Scenario: Seed .codice-version with a pre-1.2.0 installation (version 1.1.0,
#           older than the 1.2.0 references/ + .devin/ split) and run
#           --update --force.
# Expected (version gate — status "pre-1.2.0"):
#   - exit code 0 (gate returns success without updating)
#   - output contains "Pre-1.2.0 Installation Detected"
#   - output contains "references/" AND ".devin/" (cleanup suggestion)
#   - NO merge (opencode.json absent)
#
# The TUI header (main.ts → detectVersionContext → showVersionInfo) classifies
# v1.1.0 as "pre-1.2.0" (major===1 && minor < 2, see versionContext.ts), and
# the UpdateWorkspaceUseCase gate (isPreV2Version) blocks the update before
# any merge. The pre-1.2.0 gate runs before any version comparison, so this
# works regardless of the bundled version.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "SC-UX12: Update Blocked — Pre-1.2.0 Installation E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# Seed a pre-1.2.0 installation (version 1.1.0 — before the references/
# and .devin/ directories existed in the template)
echo '{"version":"1.1.0","installedAt":"2026-01-01T00:00:00.000Z"}' > "$TEMP_DIR/.codice-version"
log_info "Seeded .codice-version with pre-1.2.0 version 1.1.0"

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
    log_fail "CLI exited with code $EXIT_CODE (expected 0 — gate returns success)"
    exit 1
fi
log_pass "CLI exited with code 0"

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

# Combined output for message assertions (TUI messages emit on stdout via clack)
COMBINED_OUTPUT=$(cat "$STDOUT_FILE" "$STDERR_FILE" 2>/dev/null || echo "")

log_info "Checking that the version gate detected the pre-1.2.0 installation..."
assert_contains "$COMBINED_OUTPUT" "Pre-1.2.0 Installation Detected"

log_info "Checking that the update gate reported the pre-1.2.0 warning..."
assert_contains "$COMBINED_OUTPUT" "Detected v1.1.0 installation"

log_info "Checking that the cleanup suggestion mentions references/ and .devin/..."
assert_contains "$COMBINED_OUTPUT" "references/"
assert_contains "$COMBINED_OUTPUT" ".devin/"

log_info "Checking that NO merge happened (no opencode.json created)..."
assert_file_missing "$TEMP_DIR/opencode.json"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "SC-UX12: All assertions passed"
