#!/bin/bash
#===============================================================================
# FEV-21-T11: Update Blocked — Missing .codice-version E2E
#
# Scenario: Run --update --force in a directory with NO .codice-version file.
# Expected (version gate — parseVersionData returns null):
#   - exit code 0 (gate returns success without updating)
#   - output contains "No previous Códice installation found"
#   - NO opencode.json created (no merge happened)
#
# The version gate runs BEFORE any GitHub call or destructive prompt
# (UpdateWorkspaceUseCase: writable check → version gate → confirm).
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-21-T11: Update Blocked — Missing .codice-version E2E"

# Create temp directory with template (NOTHING else — no .codice-version)
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

if [[ -f "$TEMP_DIR/.codice-version" ]]; then
    log_fail "Test setup error: .codice-version should be absent in this scenario"
    exit 1
fi
log_pass "No .codice-version present (as required by scenario)"

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

log_info "Checking that the version gate reported no previous installation..."
assert_contains "$COMBINED_OUTPUT" "No previous Códice installation found"

log_info "Checking that NO merge happened (no opencode.json created)..."
assert_file_missing "$TEMP_DIR/opencode.json"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-21-T11: All assertions passed"
