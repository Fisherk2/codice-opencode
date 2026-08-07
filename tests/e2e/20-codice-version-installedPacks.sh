#!/bin/bash
#===============================================================================
# FEV-21-T10: .codice-version v2.0 Format E2E
#
# Scenario: Run a clean install with --packs software-development and inspect
#           the .codice-version file written by postInstall.
# Expected (v2.0 format per WorkspaceVersion.toJSON):
#   - file contains "version"          (v2.0 key)
#   - file contains "installedPacks"   (v2.0 pack metadata)
#   - file contains "installedAt"      (ISO 8601 timestamp)
#   - file does NOT contain "installedVersion" (legacy v1.x key)
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-21-T10: .codice-version v2.0 Format E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_CLI --clean --force --packs software-development in $TEMP_DIR"
EXIT_CODE=0
CLI_OUTPUT=$(cd "$TEMP_DIR" && $CODICE_CLI --clean --force --packs software-development 2>&1) || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "CLI exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "CLI exited with code 0"

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

log_info "Checking .codice-version v2.0 format..."

assert_file_exists "$TEMP_DIR/.codice-version"

VERSION_DATA=$(cat "$TEMP_DIR/.codice-version" 2>/dev/null || echo "")

if ! echo "$VERSION_DATA" | grep -q '"version"'; then
    log_fail "Version file is missing the v2.0 'version' key"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "Version file contains 'version'"

if ! echo "$VERSION_DATA" | grep -q '"installedPacks"'; then
    log_fail "Version file is missing the v2.0 'installedPacks' key"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "Version file contains 'installedPacks'"

if ! echo "$VERSION_DATA" | grep -q '"installedAt"'; then
    log_fail "Version file is missing the 'installedAt' key"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "Version file contains 'installedAt'"

if echo "$VERSION_DATA" | grep -q '"installedVersion"'; then
    log_fail "Version file uses the legacy 'installedVersion' key instead of v2.0 'version'"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "Version file does NOT contain legacy 'installedVersion'"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-21-T10: All assertions passed"
