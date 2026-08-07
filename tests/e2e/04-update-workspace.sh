#!/bin/bash
#===============================================================================
# F4-T5: Update Workspace E2E
#
# Scenario: Pre-populate directory with a v2.0.0 installation (.codice-version
#           in the v2.0 format) and custom template files, start the mock
#           GitHub server, then run --update --force.
#
# Scenario: the local installation matches the bundled template version
# (equal), so the bundled comparison reports "already up to date" and no
# merge happens:
#   - exit code 0
#   - README.md (estandar) PRESERVED (custom content kept)
#   - scripts/build.sh (opcional) PRESERVED (custom content kept)
#   - opencode.json (mandatory) NOT overwritten (nothing merges)
#   - stdout/stderr contains "already up to date"
#   - .codice-version still exists in the v2.0 format ("version" key,
#     NOT the legacy "installedVersion" key)
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "F4-T5: Update Workspace E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# Pre-populate with a "customized" project
# Estandar file with custom content (must be PRESERVED)
echo "# OLD README — This should be preserved" > "$TEMP_DIR/README.md"

# Obligatorio file with custom content (must NOT be overwritten — no merge)
echo '{"old": true, "version": "0.9.0"}' > "$TEMP_DIR/opencode.json"

# Opcional file that already exists (must be preserved)
mkdir -p "$TEMP_DIR/scripts"
echo "# OLD SCRIPT — This should be preserved" > "$TEMP_DIR/scripts/build.sh"

# Write version file in the v2.0 format with a version EQUAL to the
# bundled template (2.0.0) so the bundled comparison reports "up to date".
echo '{"version":"2.0.0","installedPacks":["software-development"],"installedAt":"2026-01-01T00:00:00.000Z","optionalSelections":["scripts/build.sh"]}' > "$TEMP_DIR/.codice-version"

log_info "Pre-populated project with version 2.0.0 (v2.0 format) files"

# Start mock server (returns tag_name: "v1.0.0" by default)
start_mock_server
log_info "Mock GitHub API pointing to $CODICE_GITHUB_API_URL"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_CLI --update --force in $TEMP_DIR"
EXIT_CODE=0
STDERR_FILE="$TEMP_DIR/stderr.log"
STDOUT_FILE="$TEMP_DIR/stdout.log"
(cd "$TEMP_DIR" && CODICE_GITHUB_API_URL="http://localhost:4567" CODICE_BYPASS_URL_VALIDATION="true" NODE_ENV="test" $CODICE_CLI --update --force) >"$STDOUT_FILE" 2>"$STDERR_FILE" || EXIT_CODE=$?

# Stop mock server
stop_mock_server

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "CLI exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "CLI exited with code 0"

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

# Combined output for message assertions (TUI messages emit on stdout via clack)
COMBINED_OUTPUT=$(cat "$STDOUT_FILE" "$STDERR_FILE" 2>/dev/null || echo "")

log_info "Checking that estandar file was PRESERVED (not overwritten)..."

PRESERVED_README=$(head -1 "$TEMP_DIR/README.md" 2>/dev/null || echo "")
if [[ "$PRESERVED_README" != "# OLD README — This should be preserved" ]]; then
    log_fail "README.md was OVERWRITTEN! Expected estandar to be preserved."
    echo "    Actual first line: $PRESERVED_README" >&2
    exit 1
fi
log_pass "README.md preserved (estandar not overwritten)"

log_info "Checking that obligatorio file was NOT overwritten (no merge)..."
# Because the bundled comparison reports "already up to date", NOTHING merges —
# including mandatory files. The pre-existing custom content must survive.
PRESERVED_OPENCODE=$(head -1 "$TEMP_DIR/opencode.json" 2>/dev/null || echo "")
if [[ "$PRESERVED_OPENCODE" != '{"old": true, "version": "0.9.0"}' ]]; then
    log_fail "opencode.json was modified! Expected it to stay untouched (no merge)."
    echo "    Actual first line: $PRESERVED_OPENCODE" >&2
    exit 1
fi
log_pass "opencode.json untouched (no merge — workspace already up to date)"

log_info "Checking that opcional file was PRESERVED (not touched)..."

PRESERVED_SCRIPT=$(head -1 "$TEMP_DIR/scripts/build.sh" 2>/dev/null || echo "")
if [[ "$PRESERVED_SCRIPT" != "# OLD SCRIPT — This should be preserved" ]]; then
    log_fail "scripts/build.sh was modified! Expected opcional to be preserved."
    echo "    Actual first line: $PRESERVED_SCRIPT" >&2
    exit 1
fi
log_pass "scripts/build.sh preserved (opcional not updated)"

log_info "Checking that the CLI reported the workspace is already up to date..."

assert_contains "$COMBINED_OUTPUT" "already up to date"

log_info "Checking version file format (v2.0 — 'version' key, not 'installedVersion')..."

assert_file_exists "$TEMP_DIR/.codice-version"

VERSION_DATA=$(cat "$TEMP_DIR/.codice-version" 2>/dev/null || echo "")
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

log_pass "F4-T5: All assertions passed"
