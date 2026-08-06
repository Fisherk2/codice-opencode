#!/bin/bash
#===============================================================================
# FEV-21-T13: Update Option A — Non-Interactive Default E2E (transitional)
#
# Scenario: Seed a v2.0 installation (installedPacks: ["software-development"])
# and run --update --force. --force makes the update non-interactive, which
# resolves to Option A (installed packs only, no pack menu).
#
# Expected (TRANSITIONAL NO-OP): the bundled template is v1.2.0, so the
# bundled comparison (installed 2.0.0 >= bundled 1.2.0) reports "Workspace is
# already up to date" and NO merge happens:
#   - exit code 0
#   - output contains "already up to date"
#   - NO business pack agents appear (nothing merged)
#   - .codice-version unchanged: installedPacks still contains
#     "software-development" and NOT "business"
#
# NOTE: This is the transitional no-op documented in the FEV-21 plan — Option
# A's merge behavior is exercised by integration tests (BUNDLED_TEST_VERSION
# = 2.1.0); the E2E verifies the no-op until the package is published at
# >= 2.0.0. Once the bundled version is >= 2.0.0, Option A's pack-scoped
# merge is verified by asserting business agents appear after
# --update-add-packs business.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Real agent filenames used for assertions
# ---------------------------------------------------------------------------
# business pack → agents/business-analyst.md (verified present in pack dir)

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-21-T13: Update Option A — Non-Interactive Default E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# Seed a v2.0 installation with ONLY the software-development pack
echo '{"version":"2.0.0","installedPacks":["software-development"],"installedAt":"2026-01-01T00:00:00.000Z","optionalSelections":[]}' > "$TEMP_DIR/.codice-version"
log_info "Seeded .codice-version with v2.0.0 installation (software-development only)"

# Start mock server
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

# 1. Bundled comparison reports already up to date (transitional no-op)
log_info "Checking that the CLI reported the workspace is already up to date..."
assert_contains "$COMBINED_OUTPUT" "already up to date"

# 2. No business pack agents appeared (nothing merged)
log_info "Checking that NO business pack agents appeared (no merge)..."
assert_file_missing "$TEMP_DIR/agents/business-analyst.md"

# 3. Version file unchanged: still software-development, no business
log_info "Checking that .codice-version still records software-development only..."
assert_file_exists "$TEMP_DIR/.codice-version"

VERSION_DATA=$(cat "$TEMP_DIR/.codice-version" 2>/dev/null || echo "")
if ! echo "$VERSION_DATA" | grep -q '"installedPacks"'; then
    log_fail "Version file is missing 'installedPacks'"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
if ! echo "$VERSION_DATA" | grep -q '"software-development"'; then
    log_fail "Version file no longer lists 'software-development' in installedPacks"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
if echo "$VERSION_DATA" | grep -q '"business"'; then
    log_fail "Version file records 'business' in installedPacks — unexpected (no update ran)"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "Version file still records installedPacks with software-development (no business)"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-21-T13: All assertions passed"
