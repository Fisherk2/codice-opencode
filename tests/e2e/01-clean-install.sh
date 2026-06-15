#!/bin/bash
#===============================================================================
# F4-T2: Clean Install E2E
#
# Scenario: Run binary in empty directory
# Expected: All template files copied (obligatorio + estandar + opcional)
#
# This tests the --clean --force mode which skips all interactive prompts.
# Optional files are included because clean mode treats all files as mandatory.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "F4-T2: Clean Install E2E"

# Resolve binary (builds if needed)
CODICE_BINARY="$(setup_binary)"
log_info "Using binary: $CODICE_BINARY"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

# Copy template to temp dir so the binary can find it
cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_BINARY --clean --force in $TEMP_DIR"
EXIT_CODE=0
(cd "$TEMP_DIR" && "$CODICE_BINARY" --clean --force) 2>/dev/null || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "Binary exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "Binary exited with code 0"

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

log_info "Verifying obligatorio files..."

assert_file_exists "$TEMP_DIR/opencode.json"
assert_file_exists "$TEMP_DIR/agents/backend-developer.md"
assert_file_exists "$TEMP_DIR/agents/tlaloc.md"
assert_file_exists "$TEMP_DIR/commands/build.md"
assert_file_exists "$TEMP_DIR/references/architecture.md"
assert_file_exists "$TEMP_DIR/skills-lock.json"

log_info "Verifying estandar files..."

assert_file_exists "$TEMP_DIR/README.md"
assert_file_exists "$TEMP_DIR/.gitignore"
assert_file_exists "$TEMP_DIR/.env.example"
assert_file_exists "$TEMP_DIR/AGENTS.md"
assert_file_exists "$TEMP_DIR/CHANGELOG.md"
assert_file_exists "$TEMP_DIR/SPEC.md"

log_info "Verifying opcional files..."

assert_file_exists "$TEMP_DIR/Dockerfile"
assert_file_exists "$TEMP_DIR/Justfile"
assert_file_exists "$TEMP_DIR/scripts/build.sh"
assert_file_exists "$TEMP_DIR/scripts/test.sh"

log_info "Verifying version file..."

assert_file_exists "$TEMP_DIR/.codice-version"

log_info "Verifying shared docs..."

assert_file_exists "$TEMP_DIR/docs/ARCHITECTURE.md"
assert_file_exists "$TEMP_DIR/docs/CODE_STYLE.md"
assert_file_exists "$TEMP_DIR/tasks/plan.md"

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

log_pass "F4-T2: All assertions passed"
