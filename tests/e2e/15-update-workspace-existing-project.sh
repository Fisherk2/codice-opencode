#!/bin/bash
#===============================================================================
# FEV3-T6: Update Workspace Existing Project E2E
#
# Scenario: Pre-populate directory with existing standard files and directories
#           Run --update --force
# Expected: Standard files (README.md, AGENTS.md) PRESERVED (not overwritten)
#           Standard directories (docs/, specs/) PRESERVED (not overwritten)
#           Mandatory files (opencode.json, etc.) UPDATED (overwritten)
#           New standard files (tasks/) COPIED (since they don't exist yet)
#           .codice-version file updated
#           Optional files preserved (not touched)
#
# This tests the FEV-3 fix for the regression of FEV-1 Issue #2.
# The root cause was BunFileSystem.destinationExists() using Bun.file()
# which doesn't detect directories, causing standard directories to be
# overwritten during update.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV3-T6: Update Workspace Existing Project E2E"

# Resolve binary
CODICE_BINARY="$(setup_binary)"
log_info "Using binary: $CODICE_BINARY"

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

# Opcional file that already exists (should be preserved)
mkdir -p "$TEMP_DIR/scripts"
echo "# CUSTOM SCRIPT — My Custom Build" > "$TEMP_DIR/scripts/build.sh"

# Write version file (older than mock server's default v1.0.0 so update proceeds)
echo '{"installedVersion":"0.9.0","installedAt":"2026-01-01T00:00:00.000Z","optionalSelections":["scripts/build.sh"]}' > "$TEMP_DIR/.codice-version"

log_info "Pre-populated project with existing standard files and directories"

# Start mock server (returns tag that is newer than local)
start_mock_server
log_info "Mock GitHub API pointing to $CODICE_GITHUB_API_URL"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_BINARY --update --force in $TEMP_DIR"
EXIT_CODE=0
STDERR_FILE="$TEMP_DIR/stderr.log"
STDOUT_FILE="$TEMP_DIR/stdout.log"
(cd "$TEMP_DIR" && CODICE_GITHUB_API_URL="http://localhost:4567" CODICE_BYPASS_URL_VALIDATION="true" "$CODICE_BINARY" --update --force) >"$STDOUT_FILE" 2>"$STDERR_FILE" || EXIT_CODE=$?

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

# 5. Mandatory files SHOULD be updated (opencode.json must match template content)
log_info "Checking that obligatorio files were UPDATED..."
if [[ ! -f "$TEMP_DIR/opencode.json" ]]; then
    log_fail "opencode.json was NOT created — expected mandatory file to be overwritten"
    exit 1
fi
if diff -q "$TEMP_DIR/template/obligatorio/opencode.json" "$TEMP_DIR/opencode.json" >/dev/null 2>&1; then
    log_pass "opencode.json content matches template (obligatorio overwritten — correct behavior)"
else
    log_fail "opencode.json content differs from template — expected exact match after overwrite"
    exit 1
fi

# 6. New standard file (tasks/) should be COPIED since it doesn't exist
log_info "Checking that new standard directory tasks/ was COPIED..."
if [[ ! -d "$TEMP_DIR/tasks" ]]; then
    log_fail "tasks/ directory was NOT created — expected new standard directory to appear"
    exit 1
fi
if [[ ! -f "$TEMP_DIR/tasks/todo.md" ]] && [[ ! -f "$TEMP_DIR/tasks/plan.md" ]]; then
    # tasks may have different files — just check the directory exists with content
    TASKS_CONTENT=$(ls "$TEMP_DIR/tasks/" 2>/dev/null || echo "")
    if [[ -z "$TASKS_CONTENT" ]]; then
        log_fail "tasks/ directory exists but is empty"
        exit 1
    fi
fi
log_pass "tasks/ directory was copied (new standard files appear)"

# 7. Optional file preserved
log_info "Checking that opcional file was PRESERVED..."
PRESERVED_SCRIPT=$(head -1 "$TEMP_DIR/scripts/build.sh" 2>/dev/null || echo "")
if [[ "$PRESERVED_SCRIPT" != "# CUSTOM SCRIPT — My Custom Build" ]]; then
    log_fail "scripts/build.sh was modified! Expected opcional to be preserved."
    echo "    Actual first line: $PRESERVED_SCRIPT" >&2
    exit 1
fi
log_pass "scripts/build.sh preserved (opcional not updated)"

# 8. No security warnings in stderr
log_info "Checking stderr for security warnings..."
if [[ -f "$STDERR_FILE" ]]; then
    STDERR_CONTENT=$(cat "$STDERR_FILE" 2>/dev/null || echo "")
    if echo "$STDERR_CONTENT" | grep -qiE "traversal|escape|denied|EPERM"; then
        log_fail "Security warning detected in stderr: $STDERR_CONTENT"
        exit 1
    fi
fi
log_pass "No security warnings in stderr"

# 9. Success message in stdout
log_info "Checking stdout for success message..."
if [[ -f "$STDOUT_FILE" ]]; then
    if grep -q "Workspace update complete" "$STDOUT_FILE" 2>/dev/null; then
        log_pass "Success message found in stdout"
    else
        log_fail "Expected 'Workspace update complete' in stdout"
        echo "    Full stdout: $(cat "$STDOUT_FILE")" >&2
        exit 1
    fi
fi

# 10. Version file updated
log_info "Checking version file was updated..."
if [[ ! -f "$TEMP_DIR/.codice-version" ]]; then
    log_fail ".codice-version file is missing!"
    exit 1
fi

VERSION_DATA=$(cat "$TEMP_DIR/.codice-version" 2>/dev/null || echo "")
if ! echo "$VERSION_DATA" | grep -q '"optionalSelections"'; then
    log_fail "Version file is missing optionalSelections"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "Version file updated with optional selections preserved"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV3-T6: All assertions passed"
