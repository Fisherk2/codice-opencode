#!/bin/bash
#===============================================================================
# FEV-24: v2.1.0 Commands Installed E2E
#
# Scenario: Run CLI in empty directory (clean install)
# Expected: The 4 new v2.1.0 command files are installed and reachable
#           through the .opencode/commands symlink:
#           sync.md, migrate.md, deploy.md, analyze.md
#
# This closes the coverage gap flagged in the /ship review: the existing
# scenarios only assert commands/build.md, never the v2.1.0 additions.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-24: v2.1.0 Commands Installed E2E"

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
CLI_OUTPUT=$(cd "$TEMP_DIR" && $CODICE_CLI --clean --force 2>&1) || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "CLI exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "CLI exited with code 0"

# ---------------------------------------------------------------------------
# Assertions: the 4 new v2.1.0 commands exist after clean install
# ---------------------------------------------------------------------------

log_info "Verifying v2.1.0 commands are installed..."

# .opencode/commands is a symlink to the flat commands/ dir; following it
# proves both that the symlink resolves and that the command files exist.
assert_file_exists "$TEMP_DIR/.opencode/commands/sync.md"
assert_file_exists "$TEMP_DIR/.opencode/commands/migrate.md"
assert_file_exists "$TEMP_DIR/.opencode/commands/deploy.md"
assert_file_exists "$TEMP_DIR/.opencode/commands/analyze.md"

log_pass "v2.1.0 commands present in .opencode/commands"

# ---------------------------------------------------------------------------
# Assertions: baseline command (v1.x) still installed alongside the new ones
# ---------------------------------------------------------------------------

log_info "Verifying baseline commands remain installed..."

assert_file_exists "$TEMP_DIR/.opencode/commands/build.md"
assert_file_exists "$TEMP_DIR/.opencode/commands/spec.md"
assert_file_exists "$TEMP_DIR/.opencode/commands/test.md"
log_pass "Baseline commands still present"

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

log_pass "FEV-24: All assertions passed"