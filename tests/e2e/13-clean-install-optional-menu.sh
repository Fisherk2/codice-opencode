#!/bin/bash
#===============================================================================
# FEV-2-D: Clean Install Optional Menu E2E
#
# Scenario: Run --clean --force and verify the optional file selection
# menu is correctly auto-selected (all optional files present).
#
# Key deltas vs test 01-clean-install:
# - Verifies optionalSelections in .codice-version is populated
# - Verifies .devin/ symlinks are created (selected via force)
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-2-D: Clean Install Optional Menu E2E"

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

log_info "Running: $CODICE_BINARY --clean --force in $TEMP_DIR"
STDERR_LOG="$TEMP_DIR/stderr.log"
EXIT_CODE=0
(cd "$TEMP_DIR" && "$CODICE_BINARY" --clean --force) 2>"$STDERR_LOG" || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "Binary exited with code $EXIT_CODE (expected 0)"
    [[ -s "$STDERR_LOG" ]] && echo "    Stderr: $(cat "$STDERR_LOG")" >&2
    exit 1
fi
log_pass "Binary exited with code 0"

# Verify stderr has no security warnings
if [[ -s "$STDERR_LOG" ]]; then
    if grep -qi "traversal\|escape\|denied\|EPERM" "$STDERR_LOG"; then
        log_fail "Security warning detected in stderr"
        cat "$STDERR_LOG" >&2
        exit 1
    fi
    log_info "Stderr logged (non-security output only)"
fi

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

# Verify obligatorio files exist (core files always installed)
log_info "Verifying obligatorio files..."
assert_file_exists "$TEMP_DIR/opencode.json"
assert_file_exists "$TEMP_DIR/agents/backend-developer.md"
assert_file_exists "$TEMP_DIR/commands/build.md"
assert_file_exists "$TEMP_DIR/skills-lock.json"
assert_file_exists "$TEMP_DIR/agents/tlaloc.md"

# Verify estandar files exist (standard docs)
log_info "Verifying estandar files..."
assert_file_exists "$TEMP_DIR/README.md"
assert_file_exists "$TEMP_DIR/AGENTS.md"
assert_file_exists "$TEMP_DIR/CHANGELOG.md"
assert_file_exists "$TEMP_DIR/SPEC.md"

# Verify .gitignore exists (generated post-installation from template)
log_info "Verifying .gitignore..."
assert_file_exists "$TEMP_DIR/.gitignore"

# Verify stageable optional files are present (auto-selected via --force)
log_info "Verifying stageable optional files (auto-selected)..."
assert_file_exists "$TEMP_DIR/Dockerfile"
assert_file_exists "$TEMP_DIR/Justfile"
assert_file_exists "$TEMP_DIR/scripts/build.sh"
assert_file_exists "$TEMP_DIR/scripts/test.sh"

# Verify .devin/ symlinks exist (force auto-selects all, including .devin)
log_info "Verifying .devin/ symlinks (created because .devin was auto-selected)..."
assert_symlink_exists "$TEMP_DIR/.devin/skills"
assert_symlink_target "$TEMP_DIR/.devin/skills" "../skills"
assert_symlink_exists "$TEMP_DIR/.devin/workflows"
assert_symlink_target "$TEMP_DIR/.devin/workflows" "../commands"
assert_symlink_exists "$TEMP_DIR/.devin/rules/CODE_STYLE.md"
assert_symlink_target "$TEMP_DIR/.devin/rules/CODE_STYLE.md" "../../docs/CODE_STYLE.md"

# Verify .opencode symlinks always created
log_info "Verifying .opencode symlinks..."
assert_symlink_exists "$TEMP_DIR/.opencode/agents"
assert_symlink_target "$TEMP_DIR/.opencode/agents" "../agents"
assert_symlink_exists "$TEMP_DIR/.opencode/commands"
assert_symlink_target "$TEMP_DIR/.opencode/commands" "../commands"
assert_symlink_exists "$TEMP_DIR/.opencode/skills"
assert_symlink_target "$TEMP_DIR/.opencode/skills" "../skills"

# Verify version file exists with populated optionalSelections
log_info "Verifying version file..."
assert_file_exists "$TEMP_DIR/.codice-version"

VERSION_DATA=$(cat "$TEMP_DIR/.codice-version" 2>/dev/null || echo "")
if [[ -z "$VERSION_DATA" ]]; then
    log_fail ".codice-version is empty or missing"
    exit 1
fi

# Verify optionalSelections is present and non-empty (force auto-selects all)
if ! echo "$VERSION_DATA" | grep -q '"optionalSelections"'; then
    log_fail "optionalSelections field missing in .codice-version"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi

# Verify .devin is in optionalSelections (since force auto-selects all)
if ! echo "$VERSION_DATA" | grep -q '".devin"'; then
    log_fail ".devin should be in optionalSelections when --force is used"
    echo "    Version data: $VERSION_DATA" >&2
    exit 1
fi
log_pass "optionalSelections present with .devin included (force auto-selects all)"

# Verify staging directory was cleaned
if [[ -d "$TEMP_DIR/.codice-staging" ]]; then
    log_fail "Staging directory was not cleaned after successful install"
    exit 1
fi
log_pass "Staging directory cleaned"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-2-D: Clean Install Optional Menu — all assertions passed"
