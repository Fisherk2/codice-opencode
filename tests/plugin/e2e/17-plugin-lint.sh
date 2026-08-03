#!/bin/bash
#===============================================================================
# F6-T2: Plugin Lint E2E
#
# Scenario: Install plugin, then run Biome lint on the installed file
# Expected: Plugin passes lint with exit code 0
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/../../e2e/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "F6-T2: Plugin Lint E2E"

TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

# Copy template so the CLI can find it
cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# Execute — install
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
# Execute — lint
# ---------------------------------------------------------------------------

log_info "Copying biome.json to temp dir..."
cp "$CODICE_ROOT/biome.json" "$TEMP_DIR/biome.json"

log_info "Running Biome lint on installed plugin..."

LINT_EXIT=0
bunx @biomejs/biome check --vcs-enabled=false "$TEMP_DIR/.opencode/plugins/sdd-pipeline.ts" || LINT_EXIT=$?

if [[ "$LINT_EXIT" -ne 0 ]]; then
	log_fail "Biome lint failed with exit code $LINT_EXIT"
	exit 1
fi
log_pass "Biome lint passed (exit code 0)"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "F6-T2: All assertions passed"
