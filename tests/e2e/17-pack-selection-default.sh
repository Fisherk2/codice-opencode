#!/bin/bash
#===============================================================================
# FEV-21-T7: Pack Selection — Default Pack (software-development) E2E
#
# Scenario: Run a clean install selecting ONLY the default software-development
#           pack via --packs software-development.
# Expected:
#   - exit code 0
#   - agents/backend-developer.md EXISTS (software-development pack agent)
#   - agents/business-analyst.md MISSING (business pack NOT selected)
#   - .codice-version contains "installedPacks" AND "software-development"
#   - .codice-version uses the v2.0 "version" key (not legacy "installedVersion")
#
# CLI --packs overrides the --force "all packs" default (InstallUseCaseBase:
# options.packs ?? selectPacks(force)), so only the selected pack is installed.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Real agent filenames used for assertions
# ---------------------------------------------------------------------------
# software-development pack → agents/backend-developer.md (verified present)
# business pack             → agents/business-analyst.md (verified present)

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-21-T7: Pack Selection — Default (software-development) E2E"

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

# 1. Selected pack agent present
log_info "Checking that software-development pack agent was installed..."
assert_file_exists "$TEMP_DIR/agents/backend-developer.md"

# 2. Non-selected pack agent ABSENT
log_info "Checking that business pack agent was NOT installed..."
assert_file_missing "$TEMP_DIR/agents/business-analyst.md"

# 3. Version file records the selected pack
log_info "Checking .codice-version records installedPacks..."
assert_file_exists "$TEMP_DIR/.codice-version"

VERSION_DATA=$(cat "$TEMP_DIR/.codice-version" 2>/dev/null || echo "")
if ! echo "$VERSION_DATA" | grep -q '"installedPacks"'; then
    log_fail "Version file is missing 'installedPacks'"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
if ! echo "$VERSION_DATA" | grep -q '"software-development"'; then
    log_fail "Version file does not list 'software-development' in installedPacks"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "Version file records installedPacks with software-development"

# 4. Version file uses the v2.0 'version' key (not legacy 'installedVersion')
log_info "Checking version file format (v2.0 — 'version' key)..."
if ! echo "$VERSION_DATA" | grep -q '"version"'; then
    log_fail "Version file is missing the v2.0 'version' key"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
if echo "$VERSION_DATA" | grep -q '"installedVersion"'; then
    log_fail "Version file uses the legacy 'installedVersion' key instead of v2.0 'version'"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "Version file uses the v2.0 'version' key (not 'installedVersion')"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-21-T7: All assertions passed"
