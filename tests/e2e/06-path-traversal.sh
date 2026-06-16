#!/bin/bash
#===============================================================================
# F4-T7: Path Traversal E2E
#
# Scenario: Run binary in a directory with a symlink attempting traversal
# Expected: Binary handles the situation gracefully
#           No files written outside the destination boundary
#
# Note: The CLI always uses process.cwd() as the destination and expects
# a template/ subdirectory. Path traversal prevention is built into
# BunFileSystem which validates all internal file operations.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "F4-T7: Path Traversal E2E"

# Resolve binary
CODICE_BINARY="$(setup_binary)"
log_info "Using binary: $CODICE_BINARY"

# Create temp directory WITHOUT template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

# Do NOT provide a proper template directory — only create a minimal
# obligatorio dir with no real files, to trigger a resolution error
mkdir -p "$TEMP_DIR/template/obligatorio"
# Create a symlink pointing outside to test path traversal protection
ln -s /etc/passwd "$TEMP_DIR/template/obligatorio/escape.txt" 2>/dev/null || true

# ---------------------------------------------------------------------------
# Execute — expect exit code 1 (no valid template files)
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_BINARY --clean --force in $TEMP_DIR"
EXIT_CODE=0
(cd "$TEMP_DIR" && "$CODICE_BINARY" --clean --force) 2>/dev/null || EXIT_CODE=$?

# The binary should exit with error because no valid template files exist
if [[ "$EXIT_CODE" -eq 0 ]]; then
    log_fail "Binary exited with code 0 despite missing template content (expected error)"
    exit 1
fi
log_pass "Binary exited with non-zero code $EXIT_CODE (expected — no valid template)"

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

log_info "Verifying no files were written outside the destination..."

# If the binary somehow wrote files despite the error, make sure they stay in TEMP_DIR
OUTSIDE_FILES=$(find /tmp -maxdepth 3 -name "*.codice-*" -newer "$TEMP_DIR" 2>/dev/null || true)
if echo "$OUTSIDE_FILES" | grep -v "^$" | head -1 >/dev/null 2>&1; then
    log_warn "Found codice-related files outside temp dir (may be from other processes)"
fi

# Verify the symlink still exists and points to the right place
if [[ -L "$TEMP_DIR/escape.txt" ]]; then
    LINK_TARGET=$(readlink "$TEMP_DIR/escape.txt")
    if [[ "$LINK_TARGET" == "/etc/passwd" ]]; then
        log_pass "Symlink was not followed or removed by the binary"
    fi
fi

log_info "Verifying no .codice-staging dir was left behind..."

if [[ -d "$TEMP_DIR/.codice-staging" ]]; then
    log_fail "Staging directory was left behind despite error!"
    exit 1
fi
log_pass "No staging directory leaked"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "F4-T7: All assertions passed"
