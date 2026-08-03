#!/bin/bash
#===============================================================================
# FEV-2-B: Symlinks Project Install E2E
#
# Scenario: Run Project Install and verify .opencode symlinks are always created
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-2-B: Symlinks Project Install E2E"

# Resolve CLI (builds if needed)

# ---------------------------------------------------------------------------
# Test 1: Project Install → only 3 .opencode symlinks
# ---------------------------------------------------------------------------

log_info "--- Test 1: Project Install ---"

TEMP_DIR1="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR1"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR1/template"

log_info "Running: $CODICE_CLI --project --force in $TEMP_DIR1"
EXIT_CODE=0
(cd "$TEMP_DIR1" && $CODICE_CLI --project --force) 2>/dev/null || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "CLI exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "CLI exited with code 0"

# Verify .opencode symlinks exist (always created)
assert_symlink_exists "$TEMP_DIR1/.opencode/agents"
assert_symlink_target "$TEMP_DIR1/.opencode/agents" "../agents"
assert_dir_exists "$TEMP_DIR1/.opencode/agents"

assert_symlink_exists "$TEMP_DIR1/.opencode/commands"
assert_symlink_target "$TEMP_DIR1/.opencode/commands" "../commands"
assert_dir_exists "$TEMP_DIR1/.opencode/commands"

assert_symlink_exists "$TEMP_DIR1/.opencode/skills"
assert_symlink_target "$TEMP_DIR1/.opencode/skills" "../skills"
assert_dir_exists "$TEMP_DIR1/.opencode/skills"

log_pass "Test 1: Project Install — PASSED"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-2-B: Symlinks Project Install — all assertions passed"
