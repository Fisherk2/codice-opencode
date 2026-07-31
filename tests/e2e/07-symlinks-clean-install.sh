#!/bin/bash
#===============================================================================
# FEV-2-B: Symlinks Clean Install E2E
#
# Scenario: Run Clean Install in empty directory, verify all 3 symlinks
# are created and resolve correctly.
#
# Symlinks verified:
#   .opencode/ (3): agents, commands, skills
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-2-B: Symlinks Clean Install E2E"

# Resolve CLI (builds if needed)

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

# Copy template to temp dir so the CLI can find it
cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_CLI --clean --force in $TEMP_DIR"
EXIT_CODE=0
(cd "$TEMP_DIR" && $CODICE_CLI --clean --force) 2>/dev/null || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "CLI exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "CLI exited with code 0"

# ---------------------------------------------------------------------------
# Assertions — .opencode/ symlinks (3)
# ---------------------------------------------------------------------------

log_info "Verifying .opencode/ symlinks..."

assert_symlink_exists "$TEMP_DIR/.opencode/agents"
assert_symlink_target "$TEMP_DIR/.opencode/agents" "../agents"
assert_dir_exists "$TEMP_DIR/.opencode/agents"

assert_symlink_exists "$TEMP_DIR/.opencode/commands"
assert_symlink_target "$TEMP_DIR/.opencode/commands" "../commands"
assert_dir_exists "$TEMP_DIR/.opencode/commands"

assert_symlink_exists "$TEMP_DIR/.opencode/skills"
assert_symlink_target "$TEMP_DIR/.opencode/skills" "../skills"
assert_dir_exists "$TEMP_DIR/.opencode/skills"

# ---------------------------------------------------------------------------
# Verify staging directory was cleaned
# ---------------------------------------------------------------------------

if [[ -d "$TEMP_DIR/.codice-staging" ]]; then
    log_fail "Staging directory was not cleaned after successful install"
    exit 1
fi
log_pass "Staging directory cleaned"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-2-B: All 3 symlink assertions passed"
