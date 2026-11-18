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

# Leak check scoped to what this script actually exercises:
#   1. /etc — the system destination the CLI attempted (staging/writes from
#      a traversal miss would land here); -newer TEMP_DIR ignores old junk.
#   2. "$TEMP_DIR/../escape" — the exact traversal target of the ../
#      attempt above (resolves to /tmp/escape). A /tmp-wide .codice-* find
#      is unreliable under concurrent e2e runs (their staging dirs live in
#      sibling mkdtemp dirs), so only this exact path is checked.
LEAKED=$(find /etc -maxdepth 3 \( -name ".codice-*" -o -name "*.codice-*" \) -newer "$TEMP_DIR" 2>/dev/null || true)
if [[ -n "$LEAKED" ]]; then
    log_fail ".codice-* artifacts written into /etc: $LEAKED"
    exit 1
fi

if [[ -e "$TEMP_DIR/../escape" ]]; then
    log_fail "Traversal destination ../escape exists — files were written outside TEMP_DIR"
    exit 1
fi
log_pass "No files leaked outside the destination boundary"

log_info "Verifying no .codice-staging dir was left behind..."
if compgen -G "$TEMP_DIR/.codice-staging-*" > /dev/null; then
    log_fail "Staging directory was left behind despite error!"
    exit 1
fi
log_pass "No staging directory leaked"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "F4-T7: All assertions passed"
