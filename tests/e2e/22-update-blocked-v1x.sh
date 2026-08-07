#!/bin/bash
#===============================================================================
# FEV-21-T12: Update Blocked — Pre-v2.0 Version E2E
#
# Scenario: Seed .codice-version with a v1.2.0 installation (pre-v2.0 format,
#           no installedPacks metadata) and run --update --force.
# Expected (version gate — isPreV2Version returns true):
#   - exit code 0 (gate returns success without updating)
#   - output contains "update system has changed" and/or "reinstall"
#   - NO merge (opencode.json absent)
#
# The version gate blocks any update against a pre-v2.0 installation because
# the pack system metadata (installedPacks) does not exist for it
# (UpdateWorkspaceUseCase + updateFlow.isPreV2Version).
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-21-T12: Update Blocked — Pre-v2.0 Version E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# Seed a pre-v2.0 installation (no installedPacks metadata)
echo '{"version":"1.2.0","installedAt":"2026-01-01T00:00:00.000Z"}' > "$TEMP_DIR/.codice-version"
log_info "Seeded .codice-version with pre-v2.0 version 1.2.0"

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

log_info "Checking that the version gate reported the v2.0 reinstall requirement..."
if [[ "$COMBINED_OUTPUT" != *"update system has changed"* && "$COMBINED_OUTPUT" != *"reinstall"* ]]; then
    log_fail "Expected 'update system has changed' or 'reinstall' in output"
    echo "    Actual output: $COMBINED_OUTPUT" >&2
    exit 1
fi
log_pass "Version-gate reinstall warning found"

log_info "Checking that NO merge happened (no opencode.json created)..."
assert_file_missing "$TEMP_DIR/opencode.json"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-21-T12: All assertions passed"
