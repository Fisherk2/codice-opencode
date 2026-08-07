#!/bin/bash
#===============================================================================
# SC-UX10: Agents Copied to Flat agents/ Directory E2E
#
# Scenario: Clean install with two packs via
#           --packs software-development,business in an empty directory.
# Expected:
#   - exit code 0
#   - agents/backend-developer.md EXISTS (software-development agent at agents/ root)
#   - agents/business-analyst.md EXISTS (business agent at agents/ root)
#   - agents/software-development/ directory MISSING (no pack subdirectory)
#   - agents/business/ directory MISSING (no pack subdirectory)
#
# Per spec §9 SC-UX10, agents are copied to the flat agents/ directory — pack
# IDs are metadata (installedPacks in .codice-version), not directory layout.
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

log_step "SC-UX10: Flat Agents Directory E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_CLI --clean --force --packs software-development,business in $TEMP_DIR"
run_cli_capture -- --clean --force --packs software-development,business

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

# 1. Selected pack agents present at agents/ root (flat)
log_info "Checking that software-development agent exists at agents/ root..."
assert_file_exists "$TEMP_DIR/agents/backend-developer.md"

log_info "Checking that business agent exists at agents/ root..."
assert_file_exists "$TEMP_DIR/agents/business-analyst.md"

# 2. NO pack subdirectories created (flat layout, not nested)
log_info "Checking that NO pack subdirectories exist under agents/..."
assert_dir_missing "$TEMP_DIR/agents/software-development"
assert_dir_missing "$TEMP_DIR/agents/business"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "SC-UX10: All assertions passed"
