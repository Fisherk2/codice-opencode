#!/bin/bash
#===============================================================================
# FEV-2-C: Gitignore Clean Install E2E
#
# Scenario: Run Clean Install and verify .gitignore is generated
#   post-installation by BunGitignoreCreator.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-2-C: Gitignore Clean Install E2E"

CODICE_BINARY="$(setup_binary)"
log_info "Using binary: $CODICE_BINARY"

# ---------------------------------------------------------------------------
# Test: Clean Install → .gitignore exists with content from template
# ---------------------------------------------------------------------------

log_info "--- Clean Install .gitignore verification ---"

TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

log_info "Running: $CODICE_BINARY --clean --force in $TEMP_DIR"
EXIT_CODE=0
(cd "$TEMP_DIR" && "$CODICE_BINARY" --clean --force) 2>/dev/null || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "Binary exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "Binary exited with code 0"

# Verify .gitignore was generated
assert_file_exists "$TEMP_DIR/.gitignore"
log_pass ".gitignore file exists after clean install"

# Verify .gitignore has content (not empty)
GITIGNORE_SIZE=$(stat -c%s "$TEMP_DIR/.gitignore" 2>/dev/null || stat -f%z "$TEMP_DIR/.gitignore" 2>/dev/null)
if [[ "$GITIGNORE_SIZE" -lt 10 ]]; then
    log_fail ".gitignore is too small ($GITIGNORE_SIZE bytes), expected meaningful content"
    exit 1
fi
log_pass ".gitignore has $GITIGNORE_SIZE bytes of content"

# Verify key patterns from the template are present
if grep -q "node_modules" "$TEMP_DIR/.gitignore"; then
    log_pass ".gitignore contains 'node_modules' pattern"
else
    log_fail ".gitignore does not contain expected 'node_modules' pattern"
    exit 1
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-2-C: Gitignore Clean Install — all assertions passed"
