#!/bin/bash
#===============================================================================
# FEV-21-T8: Pack Selection — Custom Multi-Pack E2E
#
# Scenario: Run a clean install selecting TWO packs via
#           --packs software-development,business.
# Expected:
#   - exit code 0
#   - agents/backend-developer.md EXISTS (software-development pack)
#   - agents/business-analyst.md EXISTS (business pack)
#   - agents/ui-designer.md MISSING (creative pack NOT selected)
#   - .codice-version installedPacks contains BOTH pack IDs
#
# CLI --packs overrides the --force "all packs" default (InstallUseCaseBase:
# options.packs ?? selectPacks(force)), so only the selected packs are installed.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Real agent filenames used for assertions
# ---------------------------------------------------------------------------
# software-development pack → agents/backend-developer.md (verified present)
# business pack             → agents/business-analyst.md (verified present)
# creative pack             → agents/ui-designer.md (verified present in pack dir)

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-21-T8: Pack Selection — Custom Multi-Pack E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_CLI --clean --force --packs software-development,business in $TEMP_DIR"
EXIT_CODE=0
CLI_OUTPUT=$(cd "$TEMP_DIR" && $CODICE_CLI --clean --force --packs software-development,business 2>&1) || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "CLI exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "CLI exited with code 0"

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

# 1. software-development pack agent present
log_info "Checking that software-development pack agent was installed..."
assert_file_exists "$TEMP_DIR/agents/backend-developer.md"

# 2. business pack agent present
log_info "Checking that business pack agent was installed..."
assert_file_exists "$TEMP_DIR/agents/business-analyst.md"

# 3. creative pack agent ABSENT (unselected)
log_info "Checking that creative pack agent was NOT installed..."
assert_file_missing "$TEMP_DIR/agents/ui-designer.md"

# 4. Version file records BOTH selected packs
log_info "Checking .codice-version records both packs..."
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
if ! echo "$VERSION_DATA" | grep -q '"business"'; then
    log_fail "Version file does not list 'business' in installedPacks"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "Version file records installedPacks with software-development + business"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-21-T8: All assertions passed"
