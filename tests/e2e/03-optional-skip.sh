#!/bin/bash
#===============================================================================
# F4-T4: Optional Skip E2E
#
# Scenario: Run --project --force without selecting optional files
# Expected: Obligatorio files copied, estandar files copied,
#           optional files NOT present
#
# This verifies that --force truly means "no interaction needed"
# and that optional files default to not being selected.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "F4-T4: Optional Skip E2E"

# Resolve binary
CODICE_BINARY="$(setup_binary)"
log_info "Using binary: $CODICE_BINARY"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_BINARY --project --force in $TEMP_DIR"
EXIT_CODE=0
(cd "$TEMP_DIR" && "$CODICE_BINARY" --project --force) 2>/dev/null || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "Binary exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "Binary exited with code 0"

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

log_info "Verifying obligatorio files exist..."

assert_file_exists "$TEMP_DIR/opencode.json"
assert_file_exists "$TEMP_DIR/agents/backend-developer.md"
assert_file_exists "$TEMP_DIR/skills-lock.json"

log_info "Verifying estandar files exist..."

assert_file_exists "$TEMP_DIR/README.md"
assert_file_exists "$TEMP_DIR/.gitignore"
assert_file_exists "$TEMP_DIR/AGENTS.md"

log_info "Verifying optional files are NOT present..."

assert_file_missing "$TEMP_DIR/Dockerfile"
assert_file_missing "$TEMP_DIR/Justfile"
assert_file_missing "$TEMP_DIR/Makefile"
assert_file_missing "$TEMP_DIR/scripts/build.sh"
assert_file_missing "$TEMP_DIR/scripts/test.sh"
assert_file_missing "$TEMP_DIR/docker-compose.yml"
assert_file_missing "$TEMP_DIR/requirements.txt"

log_info "Verifying version file exists..."

assert_file_exists "$TEMP_DIR/.codice-version"

# Check that optionalSelections is empty in the version file
VERSION_DATA=$(cat "$TEMP_DIR/.codice-version" 2>/dev/null || echo "")
if echo "$VERSION_DATA" | grep -q '"optionalSelections"\s*:\s*\[[^]]'; then
    log_fail "optionalSelections should be an empty array when --force is used"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "optionalSelections is empty in version file"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "F4-T4: All assertions passed"
