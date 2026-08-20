#!/bin/bash
#===============================================================================
# FEV3-T6: Update Workspace Existing Project E2E
#
# Scenario: Pre-populate directory with an existing project (custom standard
#           files and directories, custom mandatory files, custom optional
#           files) and a v2.0.0 .codice-version, then run --update --force.
#
# Scenario: the local installation matches the bundled template version
# (equal), so the bundled comparison reports "already up to date" and no
# merge happens:
#   - exit code 0
#   - README.md, docs/README.md, specs/README.md, .env.example all PRESERVED
#   - scripts/build.sh (opcional) PRESERVED
#   - opencode.json (mandatory) NOT overwritten (nothing merges)
#   - stderr has no traversal/EPERM warnings
#   - stdout/stderr contains "already up to date"
#   - .codice-version still exists in the v2.0 format ("version" key)
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV3-T6: Update Workspace Existing Project E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# Pre-populate with existing project files
# Standard files with custom content (should be PRESERVED)
echo "# CUSTOM README — My Project" > "$TEMP_DIR/README.md"
echo "# CUSTOM AGENTS — My Agent Config" > "$TEMP_DIR/AGENTS.md"
echo "# CUSTOM ENV EXAMPLE — My Environment Config" > "$TEMP_DIR/.env.example"

# Standard directories with custom content (should be PRESERVED)
mkdir -p "$TEMP_DIR/docs"
echo "# Custom Documentation" > "$TEMP_DIR/docs/README.md"
echo "Design doc content" > "$TEMP_DIR/docs/DESIGN.md"

mkdir -p "$TEMP_DIR/specs"
echo "# Custom Specs" > "$TEMP_DIR/specs/README.md"
echo "API spec content" > "$TEMP_DIR/specs/api.md"

# Obligatorio file with custom content (must NOT be overwritten — no merge)
echo '{"custom": true, "version": "0.9.0"}' > "$TEMP_DIR/opencode.json"

# Opcional file that already exists (should be preserved)
mkdir -p "$TEMP_DIR/scripts"
echo "# CUSTOM SCRIPT — My Custom Build" > "$TEMP_DIR/scripts/build.sh"

# Write version file in the v2.0 format with a version EQUAL to the
# bundled template (2.1.0) so the bundled comparison reports "up to date".
echo '{"version":"2.1.0","installedPacks":["software-development"],"installedAt":"2026-01-01T00:00:00.000Z","optionalSelections":["scripts/build.sh"]}' > "$TEMP_DIR/.codice-version"

log_info "Pre-populated project with existing standard files and directories"

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

# 1. Standard file preserved
log_info "Checking that standard file README.md was PRESERVED..."
PRESERVED_README=$(head -1 "$TEMP_DIR/README.md" 2>/dev/null || echo "")
if [[ "$PRESERVED_README" != "# CUSTOM README — My Project" ]]; then
    log_fail "README.md was OVERWRITTEN! Expected standard file to be preserved."
    echo "    Actual first line: $PRESERVED_README" >&2
    exit 1
fi
log_pass "README.md preserved (standard file not overwritten)"

# 2. Standard directory preserved
log_info "Checking that standard directory docs/ was PRESERVED..."
PRESERVED_DOCS=$(head -1 "$TEMP_DIR/docs/README.md" 2>/dev/null || echo "")
if [[ "$PRESERVED_DOCS" != "# Custom Documentation" ]]; then
    log_fail "docs/README.md was OVERWRITTEN! Expected standard directory to be preserved."
    echo "    Actual first line: $PRESERVED_DOCS" >&2
    exit 1
fi
log_pass "docs/ directory preserved (standard directory not overwritten)"

# 3. Another standard directory preserved
log_info "Checking that standard directory specs/ was PRESERVED..."
PRESERVED_SPECS=$(head -1 "$TEMP_DIR/specs/README.md" 2>/dev/null || echo "")
if [[ "$PRESERVED_SPECS" != "# Custom Specs" ]]; then
    log_fail "specs/README.md was OVERWRITTEN! Expected standard directory to be preserved."
    echo "    Actual first line: $PRESERVED_SPECS" >&2
    exit 1
fi
log_pass "specs/ directory preserved (standard directory not overwritten)"

# 4. Standard standalone file preserved (not just standard directories)
log_info "Checking that standard file .env.example was PRESERVED..."
PRESERVED_ENV=$(head -1 "$TEMP_DIR/.env.example" 2>/dev/null || echo "")
if [[ "$PRESERVED_ENV" != "# CUSTOM ENV EXAMPLE — My Environment Config" ]]; then
    log_fail ".env.example was OVERWRITTEN! Expected standard file to be preserved."
    echo "    Actual first line: $PRESERVED_ENV" >&2
    exit 1
fi
log_pass ".env.example preserved (standard file not overwritten)"

# 5. Obligatorio file NOT overwritten (no merge happens)
log_info "Checking that obligatorio file opencode.json was NOT overwritten..."
PRESERVED_OPENCODE=$(head -1 "$TEMP_DIR/opencode.json" 2>/dev/null || echo "")
if [[ "$PRESERVED_OPENCODE" != '{"custom": true, "version": "0.9.0"}' ]]; then
    log_fail "opencode.json was modified! Expected it to stay untouched (no merge)."
    echo "    Actual first line: $PRESERVED_OPENCODE" >&2
    exit 1
fi
log_pass "opencode.json untouched (no merge — workspace already up to date)"

# 6. Optional file preserved
log_info "Checking that opcional file was PRESERVED..."
PRESERVED_SCRIPT=$(head -1 "$TEMP_DIR/scripts/build.sh" 2>/dev/null || echo "")
if [[ "$PRESERVED_SCRIPT" != "# CUSTOM SCRIPT — My Custom Build" ]]; then
    log_fail "scripts/build.sh was modified! Expected opcional to be preserved."
    echo "    Actual first line: $PRESERVED_SCRIPT" >&2
    exit 1
fi
log_pass "scripts/build.sh preserved (opcional not updated)"

# 7. No security warnings in stderr
log_info "Checking stderr for security warnings..."
if [[ -f "$STDERR_FILE" ]]; then
    STDERR_CONTENT=$(cat "$STDERR_FILE" 2>/dev/null || echo "")
    if echo "$STDERR_CONTENT" | grep -qiE "traversal|escape|denied|EPERM"; then
        log_fail "Security warning detected in stderr: $STDERR_CONTENT"
        exit 1
    fi
fi
log_pass "No security warnings in stderr"

# 8. CLI reports the workspace is already up to date
log_info "Checking output for 'already up to date' message..."
assert_contains "$COMBINED_OUTPUT" "already up to date"

# 9. Version file in v2.0 format ('version' key, not 'installedVersion')
log_info "Checking version file format (v2.0 — 'version' key)..."
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

log_pass "FEV3-T6: All assertions passed"
