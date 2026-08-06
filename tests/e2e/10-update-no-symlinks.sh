#!/bin/bash
#===============================================================================
# FEV-2-B: Update No Symlinks E2E (FEV-21 version-gate behavior)
#
# Scenario: Install template with --clean --force (which creates symlinks and
# writes .codice-version), then remove the .opencode symlinks, then run
# --update --force.
#
# Expected (FEV-21 version gate): the clean install writes .codice-version
# with the bundled version 1.2.0 (major < 2), which FAILS the update version
# gate. The update therefore prints the "update system has changed in
# v2.0.0 ... reinstall" warning and exits 0 WITHOUT merging:
#   - exit code 0
#   - .opencode symlinks remain ABSENT (update did nothing)
#   - stdout/stderr contains "update system has changed" / "reinstall"
#   - .codice-version still exists (untouched)
#
# NOTE: This validates ADR-008 (symlink generation is scoped to Clean Install
# and Project Install only, NOT Update mode) while also exercising the new
# version-gate behavior that replaced the old pre-v2.0 update merge.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-2-B: Update No Symlinks E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

# Copy template to temp dir so the CLI can find it
cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# Step 1: First run — Clean Install (creates symlinks + .codice-version)
# ---------------------------------------------------------------------------

log_info "=== Step 1: Clean Install to seed template + symlinks ==="
EXIT_CODE=0
(cd "$TEMP_DIR" && $CODICE_CLI --clean --force) 2>/dev/null || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "Clean install exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "Clean install exited with code 0"

# The clean install writes .codice-version with the bundled CLI version
# (1.2.0) — major < 2, so the update version gate will block below.
assert_file_exists "$TEMP_DIR/.codice-version"

# Verify symlinks were actually created before we remove them
assert_symlink_exists "$TEMP_DIR/.opencode/agents"
log_info "Symlinks confirmed present before removal"

# ---------------------------------------------------------------------------
# Step 2: Remove .opencode symlinks (simulate user that removed them)
# ---------------------------------------------------------------------------

log_info "=== Step 2: Removing .opencode symlinks ==="
rm -f "$TEMP_DIR/.opencode/agents" \
      "$TEMP_DIR/.opencode/commands" \
      "$TEMP_DIR/.opencode/skills"
log_info "Removed 3 .opencode symlinks"

# Verify they are actually gone
if [[ -L "$TEMP_DIR/.opencode/agents" ]]; then
    log_fail "Failed to remove .opencode/agents symlink before update test"
    exit 1
fi
log_pass "Symlinks confirmed removed before update"

# ---------------------------------------------------------------------------
# Step 3: Run Update mode
# ---------------------------------------------------------------------------

log_info "=== Step 3: Running Update mode ==="
EXIT_CODE2=0
STDERR_FILE="$TEMP_DIR/stderr.log"
STDOUT_FILE="$TEMP_DIR/stdout.log"
# Start mock server so update doesn't fail on version check
start_mock_server

(cd "$TEMP_DIR" && CODICE_GITHUB_API_URL="http://localhost:4567" CODICE_BYPASS_URL_VALIDATION="true" NODE_ENV="test" $CODICE_CLI --update --force) >"$STDOUT_FILE" 2>"$STDERR_FILE" || EXIT_CODE2=$?

# Stop mock server
stop_mock_server

if [[ "$EXIT_CODE2" -ne 0 ]]; then
    log_fail "Update exited with code $EXIT_CODE2 (expected 0)"
    exit 1
fi
log_pass "Update exited with code 0"

# ---------------------------------------------------------------------------
# Step 4: Assert version-gate warning + symlinks still absent
# ---------------------------------------------------------------------------

log_info "=== Step 4: Verifying version-gate blocked the update ==="

# Combined output for message assertions (TUI messages emit on stdout via clack)
COMBINED_OUTPUT=$(cat "$STDOUT_FILE" "$STDERR_FILE" 2>/dev/null || echo "")

# .codice-version is 1.2.0 (written by clean install) → pre-v2.0 → blocked
assert_contains "$COMBINED_OUTPUT" "update system has changed"
assert_contains "$COMBINED_OUTPUT" "reinstall"

# .opencode/ symlinks should still be absent (update did nothing)
if [[ -L "$TEMP_DIR/.opencode/agents" ]]; then
    log_fail ".opencode/agents symlink was recreated by Update mode (should NOT be)"
    exit 1
fi
log_pass ".opencode/agents still absent after update"

if [[ -L "$TEMP_DIR/.opencode/commands" ]]; then
    log_fail ".opencode/commands symlink was recreated by Update mode (should NOT be)"
    exit 1
fi
log_pass ".opencode/commands still absent after update"

if [[ -L "$TEMP_DIR/.opencode/skills" ]]; then
    log_fail ".opencode/skills symlink was recreated by Update mode (should NOT be)"
    exit 1
fi
log_pass ".opencode/skills still absent after update"

# ---------------------------------------------------------------------------
# Step 5: Assert template files were not affected
# ---------------------------------------------------------------------------

log_info "=== Step 5: Verifying template files were not affected ==="

assert_file_exists "$TEMP_DIR/opencode.json"
assert_file_exists "$TEMP_DIR/AGENTS.md"
assert_file_exists "$TEMP_DIR/.codice-version"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-2-B: Update No Symlinks — all assertions passed"
