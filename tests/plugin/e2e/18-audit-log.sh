#!/bin/bash
#===============================================================================
# F6-T3: Plugin Structure Audit E2E
#
# Scenario: Run clean install and verify the complete plugin file structure
# Expected: All plugin source files, config, and type definitions installed
#
# Note: The SDD audit log (.sdd-audit.log) is created at runtime by the
# OpenCode plugin hooks. This test verifies the file structure that supports
# audit logging (plugin directory, source files, config files).
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/../../e2e/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "F6-T3: Plugin Structure Audit E2E"

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
# Assertions — plugin directory structure
# ---------------------------------------------------------------------------

log_info "Verifying plugin directory structure..."

# Root plugin directory
assert_dir_exists "$TEMP_DIR/.opencode/plugins"

# Main plugin file
assert_file_exists "$TEMP_DIR/.opencode/plugins/sdd-pipeline.ts"

# Config & package files
assert_file_exists "$TEMP_DIR/.opencode/plugins/package.json"
assert_file_exists "$TEMP_DIR/.opencode/plugins/README.md"
assert_file_exists "$TEMP_DIR/.opencode/plugins/tsconfig.json"

# Source modules
assert_file_exists "$TEMP_DIR/.opencode/plugins/src/defaults.ts"
assert_file_exists "$TEMP_DIR/.opencode/plugins/src/configLoader.ts"
assert_file_exists "$TEMP_DIR/.opencode/plugins/src/autoDiscovery.ts"
assert_file_exists "$TEMP_DIR/.opencode/plugins/src/types.ts"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "F6-T3: All assertions passed"
