#!/bin/bash
#===============================================================================
# FEV-2-C: Gitignore Project Install E2E
#
# Scenario: Run Project Install and verify:
#   1. .gitignore is generated post-installation
#   2. .gitignore is NOT overwritten if it already exists (idempotent)
#   3. .gitignore path being a real directory is handled gracefully (G5)
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-2-C: Gitignore Project Install E2E"

CODICE_BINARY="$(setup_binary)"
log_info "Using binary: $CODICE_BINARY"

# ---------------------------------------------------------------------------
# Test 1: Project Install (empty dest) → .gitignore exists
# ---------------------------------------------------------------------------

log_info "--- Test 1: Project Install .gitignore generation ---"

TEMP_DIR1="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR1"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR1/template"

log_info "Running: $CODICE_BINARY --project --force in $TEMP_DIR1"
EXIT_CODE=0
(cd "$TEMP_DIR1" && "$CODICE_BINARY" --project --force) 2>/dev/null || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "Binary exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "Binary exited with code 0"

# Verify .gitignore was generated
assert_file_exists "$TEMP_DIR1/.gitignore"
log_pass ".gitignore file exists after project install"

# Verify content
if grep -q "node_modules" "$TEMP_DIR1/.gitignore"; then
    log_pass ".gitignore contains 'node_modules' pattern"
else
    log_fail ".gitignore does not contain expected 'node_modules' pattern"
    exit 1
fi

log_pass "Test 1: Project Install .gitignore — PASSED"

# ---------------------------------------------------------------------------
# Test 2: Re-run Project Install → .gitignore is NOT overwritten (idempotent)
# ---------------------------------------------------------------------------

log_info "--- Test 2: .gitignore idempotency (not overwritten) ---"

# Add a custom pattern to .gitignore (simulating user customization)
echo "# User-customized gitignore" >> "$TEMP_DIR1/.gitignore"
echo "my-custom-pattern/" >> "$TEMP_DIR1/.gitignore"

log_info "Running: $CODICE_BINARY --project --force again in $TEMP_DIR1"
EXIT_CODE2=0
(cd "$TEMP_DIR1" && "$CODICE_BINARY" --project --force) 2>/dev/null || EXIT_CODE2=$?

if [[ "$EXIT_CODE2" -ne 0 ]]; then
    log_fail "Second run exited with code $EXIT_CODE2 (expected 0)"
    exit 1
fi
log_pass "Second run exited with code 0"

# Verify .gitignore still exists
assert_file_exists "$TEMP_DIR1/.gitignore"

# Verify user customization was preserved (NOT overwritten)
if grep -q "my-custom-pattern/" "$TEMP_DIR1/.gitignore"; then
    log_pass ".gitignore idempotent: user customization preserved"
else
    log_fail ".gitignore was overwritten! User customization lost."
    exit 1
fi

log_pass "Test 2: .gitignore idempotency — PASSED"

# ---------------------------------------------------------------------------
# Test 3: Pre-existing directory at .gitignore path is skipped gracefully (G5)
# ---------------------------------------------------------------------------

log_info "--- Test 3: .gitignore path is a directory (graceful skip) ---"

TEMP_DIR3="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR3"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR3/template"

# Pre-create a directory at .gitignore path (user may have created manually)
mkdir -p "$TEMP_DIR3/.gitignore"

log_info "Running: $CODICE_BINARY --project --force in $TEMP_DIR3 (with .gitignore dir)"
EXIT_CODE3=0
(cd "$TEMP_DIR3" && "$CODICE_BINARY" --project --force) 2>/dev/null || EXIT_CODE3=$?

if [[ "$EXIT_CODE3" -ne 0 ]]; then
    log_fail "Third run exited with code $EXIT_CODE3 (expected 0)"
    exit 1
fi
log_pass "Third run exited with code 0 (graceful skip of .gitignore directory)"

# Verify .gitignore is still a directory (NOT overwritten with file)
if [[ -d "$TEMP_DIR3/.gitignore" ]]; then
    log_pass ".gitignore path is still a directory (not overwritten)"
else
    log_fail ".gitignore was overwritten! Directory became a file."
    exit 1
fi

log_pass "Test 3: .gitignore directory skip — PASSED"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-2-C: Gitignore Project Install — all assertions passed"
