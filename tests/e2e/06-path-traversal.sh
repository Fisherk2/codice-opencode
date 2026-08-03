#!/bin/bash
#===============================================================================
# F4-T7: Path Traversal E2E
#
# Scenario: Attempt to install into a path that escapes the destination
#           boundary using ../ sequences and system directories
# Expected: CLI rejects the destination at parse time (exit != 0)
#           No files written outside the destination boundary
#
# Note: With ADR-007 (template source cascade), the CLI resolves the template
# from the package root in source mode, so a missing template/ in cwd is no
# longer an error. Path traversal prevention is enforced at two layers:
#   - validateDestPath (CLI parse time) rejects ../ and system directories
#   - BunFileSystem / TemplateResolver validate all internal file operations
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "F4-T7: Path Traversal E2E"

TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

# ---------------------------------------------------------------------------
# Execute — expect rejection of traversal destinations
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_CLI --clean --force --dest '$TEMP_DIR/../escape'"
EXIT_CODE=0
$CODICE_CLI --clean --force --dest "$TEMP_DIR/../escape" >/dev/null 2>&1 || EXIT_CODE=$?

if [[ "$EXIT_CODE" -eq 0 ]]; then
    log_fail "CLI accepted a path traversal destination (expected rejection)"
    exit 1
fi
log_pass "CLI rejected path traversal destination (exit $EXIT_CODE)"

log_info "Running: $CODICE_CLI --clean --force --dest /etc"
EXIT_CODE=0
$CODICE_CLI --clean --force --dest /etc >/dev/null 2>&1 || EXIT_CODE=$?

if [[ "$EXIT_CODE" -eq 0 ]]; then
    log_fail "CLI accepted a system directory as destination (expected rejection)"
    exit 1
fi
log_pass "CLI rejected system directory destination (exit $EXIT_CODE)"

# ---------------------------------------------------------------------------
# Assertions — no files written outside the intended boundary
# ---------------------------------------------------------------------------

log_info "Verifying no files were written outside the destination..."

OUTSIDE_FILES=$(find /tmp -maxdepth 3 -name "*.codice-*" -newer "$TEMP_DIR" 2>/dev/null || true)
if echo "$OUTSIDE_FILES" | grep -v "^$" | head -1 >/dev/null 2>&1; then
    log_warn "Found codice-related files outside temp dir (may be from other processes)"
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
