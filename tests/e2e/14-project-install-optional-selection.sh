#!/bin/bash
#===============================================================================
# FEV-2-D: Project Install Optional Selection E2E
#
# Scenario: Run --project --force and verify:
#   1. No optional files are copied (force skips all optionals)
#   2. .devin/ symlinks are NOT created (not selected)
#   3. optionalSelections in .codice-version is empty
#   4. .opencode symlinks ARE created (always)
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-2-D: Project Install Optional Selection E2E"

# Resolve binary (builds if needed)
CODICE_BINARY="$(setup_binary)"
log_info "Using binary: $CODICE_BINARY"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_BINARY --project --force in $TEMP_DIR"
EXIT_CODE=0
(cd "$TEMP_DIR" && "$CODICE_BINARY" --project --force) 2>/dev/null || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "Binary exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "Binary exited with code 0"

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

# Verify obligatorio files exist (always installed)
log_info "Verifying obligatorio files..."
assert_file_exists "$TEMP_DIR/opencode.json"
assert_file_exists "$TEMP_DIR/agents/backend-developer.md"
assert_file_exists "$TEMP_DIR/commands/build.md"

# Verify estandar files exist (standard docs, copied if missing)
log_info "Verifying estandar files..."
assert_file_exists "$TEMP_DIR/README.md"
assert_file_exists "$TEMP_DIR/AGENTS.md"

# Verify optional files are NOT present (--force skips all optionals in project mode)
log_info "Verifying optional files are absent..."
assert_file_missing "$TEMP_DIR/Dockerfile"
assert_file_missing "$TEMP_DIR/Justfile"
assert_file_missing "$TEMP_DIR/scripts/build.sh"

# Verify .devin/ symlinks do NOT exist (not selected via --force)
log_info "Verifying .devin/ symlinks are absent..."
if [[ -L "$TEMP_DIR/.devin/skills" ]]; then
    log_fail ".devin/skills symlink should NOT exist when .devin was not selected"
    exit 1
fi
log_pass ".devin/symlinks correctly absent"

# Verify .opencode symlinks ARE created (always)
log_info "Verifying .opencode symlinks..."
assert_symlink_exists "$TEMP_DIR/.opencode/agents"
assert_symlink_target "$TEMP_DIR/.opencode/agents" "../agents"
assert_symlink_exists "$TEMP_DIR/.opencode/commands"
assert_symlink_target "$TEMP_DIR/.opencode/commands" "../commands"
assert_symlink_exists "$TEMP_DIR/.opencode/skills"
assert_symlink_target "$TEMP_DIR/.opencode/skills" "../skills"

# Verify version file exists with empty optionalSelections
log_info "Verifying version file..."
assert_file_exists "$TEMP_DIR/.codice-version"

VERSION_DATA=$(cat "$TEMP_DIR/.codice-version" 2>/dev/null || echo "")
if [[ -z "$VERSION_DATA" ]]; then
    log_fail ".codice-version is empty or missing"
    exit 1
fi

# In project --force mode, optionalSelections should be an empty array
if echo "$VERSION_DATA" | grep -q '"optionalSelections"\s*:\s*\[[^]]'; then
    log_fail "optionalSelections should be empty array in --project --force mode"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "optionalSelections is empty array in --project --force mode"

# Verify staging directory was cleaned
if [[ -d "$TEMP_DIR/.codice-staging" ]]; then
    log_fail "Staging directory was not cleaned after successful install"
    exit 1
fi
log_pass "Staging directory cleaned"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-2-D: Project Install Optional Selection — all assertions passed"
