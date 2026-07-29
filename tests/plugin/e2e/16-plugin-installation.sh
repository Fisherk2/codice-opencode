#!/bin/bash
#===============================================================================
# F6-T1: Plugin Installation E2E
#
# Scenario: Run clean install and verify SDD plugin files exist
# Expected: Plugin .ts source and src/defaults.ts are installed
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/../../e2e/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "F6-T1: Plugin Installation E2E"

TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

# Copy template so the CLI can find it
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
# Assertions
# ---------------------------------------------------------------------------

log_info "Verifying plugin files..."

assert_file_exists "$TEMP_DIR/.opencode/plugins/sdd-pipeline.ts"
assert_file_exists "$TEMP_DIR/.opencode/plugins/src/defaults.ts"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "F6-T1: All assertions passed"
