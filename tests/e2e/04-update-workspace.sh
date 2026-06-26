#!/bin/bash
#===============================================================================
# F4-T5: Update Workspace E2E
#
# Scenario: Pre-populate directory with older version of template files
#           Start mock GitHub API server
#           Run --update --force
# Expected: Obligatorio files updated (overwritten)
#           Estandar files PRESERVED (not overwritten — Issue #2 fix)
#           Opcional files preserved (not touched)
#           .codice-version file updated
#
# This tests the Update mode with a mock GitHub server returning a
# newer version tag, verifying the version check and selective update.
#
# Note: Issue #2 fixed the behavior where Estandar files were incorrectly
# converted to 'mandatory' during update, causing existing user files to
# be overwritten. Now Estandar files respect destinationExists().
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "F4-T5: Update Workspace E2E"

# Resolve binary
CODICE_BINARY="$(setup_binary)"
log_info "Using binary: $CODICE_BINARY"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# Pre-populate with "older version" of key files
# Estandar file with old content (will be overwritten)
echo "# OLD README — This should be updated" > "$TEMP_DIR/README.md"

# Obligatorio file with old content (will be overwritten)
echo '{"old": true, "version": "0.9.0"}' > "$TEMP_DIR/opencode.json"

# Opcional file that already exists (should be preserved)
mkdir -p "$TEMP_DIR/scripts"
echo "# OLD SCRIPT — This should be preserved" > "$TEMP_DIR/scripts/build.sh"

# Write version file with old version
echo '{"installedVersion":"0.9.0","installedAt":"2025-01-01T00:00:00.000Z","optionalSelections":["scripts/build.sh"]}' > "$TEMP_DIR/.codice-version"

log_info "Pre-populated project with version 0.9.0 files"

# Start mock server (returns tag_name: "v1.0.0" by default)
start_mock_server
log_info "Mock GitHub API pointing to $CODICE_GITHUB_API_URL"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_BINARY --update --force in $TEMP_DIR"
EXIT_CODE=0
(cd "$TEMP_DIR" && CODICE_GITHUB_API_URL="http://localhost:4567" CODICE_BYPASS_URL_VALIDATION="true" "$CODICE_BINARY" --update --force) 2>/dev/null || EXIT_CODE=$?

# Stop mock server
stop_mock_server

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "Binary exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "Binary exited with code 0"

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

log_info "Checking that estandar file was PRESERVED (not overwritten)..."

PRESERVED_README=$(head -1 "$TEMP_DIR/README.md" 2>/dev/null || echo "")
if [[ "$PRESERVED_README" != "# OLD README — This should be updated" ]]; then
    log_fail "README.md was OVERWRITTEN! Expected estandar to be preserved (Issue #2 fix)."
    echo "    Actual first line: $PRESERVED_README" >&2
    exit 1
fi
log_pass "README.md preserved (estandar not overwritten - Issue #2 fix confirmed)"

log_info "Checking that new estandar files were copied (for missing destinations)..."

if [[ ! -f "$TEMP_DIR/LICENSE" ]]; then
    log_fail "LICENSE (estandar) was not copied — expected new estandar files to appear"
    exit 1
fi
log_pass "LICENSE was copied (new estandar file appears)"

log_info "Checking that obligatorio file WAS updated (overwritten)..."

UPDATED_OPENCODE=$(head -1 "$TEMP_DIR/opencode.json" 2>/dev/null || echo "")
if [[ "$UPDATED_OPENCODE" == '{"old": true, "version": "0.9.0"}' ]]; then
    log_fail "opencode.json was NOT updated (expected obligatorio to be overwritten)"
    exit 1
fi
log_pass "opencode.json was updated (obligatorio overwritten)"

log_info "Checking that opcional file was PRESERVED (not touched)..."

PRESERVED_SCRIPT=$(head -1 "$TEMP_DIR/scripts/build.sh" 2>/dev/null || echo "")
if [[ "$PRESERVED_SCRIPT" != "# OLD SCRIPT — This should be preserved" ]]; then
    log_fail "scripts/build.sh was modified! Expected opcional to be preserved."
    echo "    Actual first line: $PRESERVED_SCRIPT" >&2
    exit 1
fi
log_pass "scripts/build.sh preserved (opcional not updated)"

log_info "Checking that other obligatorio files are present..."

assert_file_exists "$TEMP_DIR/opencode.json"

log_info "Checking version file was updated..."

if [[ ! -f "$TEMP_DIR/.codice-version" ]]; then
    log_fail ".codice-version file is missing!"
    exit 1
fi

# Get the binary's own version (from package.json, bundled at compile time)
BINARY_VERSION=$("$CODICE_BINARY" --version 2>/dev/null | sed 's/^Códice v//')
log_info "Binary version: $BINARY_VERSION"

VERSION_DATA=$(cat "$TEMP_DIR/.codice-version" 2>/dev/null || echo "")
# After update, version file should reflect the binary's own version (not the remote tag)
if ! echo "$VERSION_DATA" | grep -q "\"installedVersion\"\s*:\s*\"${BINARY_VERSION}\""; then
    log_fail "Version file was not updated to binary version ${BINARY_VERSION}"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "Version file updated to binary version ${BINARY_VERSION}"

log_info "Verifying optional selections preserved from old version..."

if ! echo "$VERSION_DATA" | grep -q '"optionalSelections"\s*:\s*\['; then
    log_fail "Version file is missing optionalSelections"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "Optional selections preserved in version file"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "F4-T5: All assertions passed"
