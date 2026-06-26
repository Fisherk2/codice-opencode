#!/bin/bash
#===============================================================================
# FEV-2-B: Update No Symlinks E2E
#
# Scenario: Install template with --clean --force (which creates symlinks),
# then remove the .opencode symlinks, then run --update --force.
# Verify that Update mode does NOT recreate the removed symlinks,
# while other template files remain present.
#
# This validates the architectural decision (ADR-008) that symlink generation
# is scoped to Clean Install and Project Install only, NOT Update mode.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-2-B: Update No Symlinks E2E"

# Resolve binary (builds if needed)
CODICE_BINARY="$(setup_binary)"
log_info "Using binary: $CODICE_BINARY"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

# Copy template to temp dir so the binary can find it
cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# Create a version file so Update mode thinks we already have an installed version
echo '{"installedVersion":"0.0.0","installedAt":"2025-01-01T00:00:00.000Z","optionalSelections":[]}' > "$TEMP_DIR/.codice-version"
log_info "Created .codice-version file for update detection"

# ---------------------------------------------------------------------------
# Step 1: First run — Clean Install (creates symlinks)
# ---------------------------------------------------------------------------

log_info "=== Step 1: Clean Install to seed template + symlinks ==="
EXIT_CODE=0
(cd "$TEMP_DIR" && "$CODICE_BINARY" --clean --force) 2>/dev/null || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "Clean install exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "Clean install exited with code 0"

# Verify symlinks were actually created before we remove them
assert_symlink_exists "$TEMP_DIR/.opencode/agents"
log_info "Symlinks confirmed present before removal"

# ---------------------------------------------------------------------------
# Step 2: Remove .opencode symlinks (simulate user that removed them)
# ---------------------------------------------------------------------------

log_info "=== Step 2: Removing .opencode symlinks ==="
rm -f "$TEMP_DIR/.opencode/agents" \
      "$TEMP_DIR/.opencode/commands" \
      "$TEMP_DIR/.opencode/skills"
log_info "Removed 3 .opencode symlinks"

# Also remove a few .devin symlinks to verify they aren't recreated either
rm -f "$TEMP_DIR/.devin/skills" \
      "$TEMP_DIR/.devin/workflows"
log_info "Removed 2 .devin symlinks"

# Verify they are actually gone
if [[ -L "$TEMP_DIR/.opencode/agents" ]]; then
    log_fail "Failed to remove .opencode/agents symlink before update test"
    exit 1
fi
log_pass "Symlinks confirmed removed before update"

# ---------------------------------------------------------------------------
# Step 3: Run Update mode
# ---------------------------------------------------------------------------

log_info "=== Step 3: Running Update mode ==="
EXIT_CODE2=0
# Start mock server so update doesn't fail on version check
start_mock_server

(cd "$TEMP_DIR" && CODICE_GITHUB_API_URL="http://localhost:4567" CODICE_BYPASS_URL_VALIDATION="true" "$CODICE_BINARY" --update --force) 2>/dev/null || EXIT_CODE2=$?

# Stop mock server
stop_mock_server

if [[ "$EXIT_CODE2" -ne 0 ]]; then
    log_fail "Update exited with code $EXIT_CODE2 (expected 0)"
    exit 1
fi
log_pass "Update exited with code 0"

# ---------------------------------------------------------------------------
# Step 4: Assert removed symlinks are STILL absent
# ---------------------------------------------------------------------------

log_info "=== Step 4: Verifying Update did NOT recreate symlinks ==="

# .opencode/ symlinks should still be absent
if [[ -L "$TEMP_DIR/.opencode/agents" ]]; then
    log_fail ".opencode/agents symlink was recreated by Update mode (should NOT be)"
    exit 1
fi
log_pass ".opencode/agents still absent after update"

if [[ -L "$TEMP_DIR/.opencode/commands" ]]; then
    log_fail ".opencode/commands symlink was recreated by Update mode (should NOT be)"
    exit 1
fi
log_pass ".opencode/commands still absent after update"

if [[ -L "$TEMP_DIR/.opencode/skills" ]]; then
    log_fail ".opencode/skills symlink was recreated by Update mode (should NOT be)"
    exit 1
fi
log_pass ".opencode/skills still absent after update"

# .devin/ symlinks should also still be absent
if [[ -L "$TEMP_DIR/.devin/skills" ]]; then
    log_fail ".devin/skills symlink was recreated by Update mode (should NOT be)"
    exit 1
fi
log_pass ".devin/skills still absent after update"

if [[ -L "$TEMP_DIR/.devin/workflows" ]]; then
    log_fail ".devin/workflows symlink was recreated by Update mode (should NOT be)"
    exit 1
fi
log_pass ".devin/workflows still absent after update"

# ---------------------------------------------------------------------------
# Step 5: Assert template files are still present (update should preserve them)
# ---------------------------------------------------------------------------

log_info "=== Step 5: Verifying template files were not affected ==="

assert_file_exists "$TEMP_DIR/opencode.json"
assert_file_exists "$TEMP_DIR/AGENTS.md"
assert_file_exists "$TEMP_DIR/.codice-version"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-2-B: Update No Symlinks — all assertions passed"
