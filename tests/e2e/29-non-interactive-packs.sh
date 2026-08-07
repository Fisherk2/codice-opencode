#!/bin/bash
#===============================================================================
# SC-UX9: --packs Flag Works in Non-Interactive Mode E2E
#
# Scenario: Clean install with --packs business,creative (NO software-development).
# Expected:
#   - exit code 0
#   - .codice-version exists and lists "business" AND "creative" in installedPacks
#   - agents/backend-developer.md MISSING (software-development NOT installed —
#     --packs overrides the --force "all packs" default)
#   - agents/business-analyst.md EXISTS (business agent)
#   - agents/ui-designer.md EXISTS (creative agent)
#
# CLI --packs overrides the --force "all packs" default (InstallUseCaseBase:
# options.packs ?? selectPacks(force)), so only the selected packs are installed.
# NOTE: The creative pack contains ui-designer.md (NOT designer.md) — verified
# in template/obligatorio/packs/creative/.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Real agent filenames used for assertions
# ---------------------------------------------------------------------------
# business pack → agents/business-analyst.md (verified present)
# creative pack → agents/ui-designer.md (verified present in pack dir)

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "SC-UX9: --packs Non-Interactive Mode E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_CLI --clean --force --packs business,creative in $TEMP_DIR"
run_cli_capture -- --clean --force --packs business,creative

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

# 1. Version file records BOTH selected packs
log_info "Checking .codice-version records installedPacks with business + creative..."
assert_file_exists "$TEMP_DIR/.codice-version"
assert_version_has_pack "$TEMP_DIR/.codice-version" "business"
assert_version_has_pack "$TEMP_DIR/.codice-version" "creative"
log_pass "Version file records installedPacks with business + creative"

# 2. software-development agent ABSENT (default overridden by --packs)
log_info "Checking that software-development pack agent was NOT installed..."
assert_file_missing "$TEMP_DIR/agents/backend-developer.md"

# 3. Selected pack agents present
log_info "Checking that business pack agent was installed..."
assert_file_exists "$TEMP_DIR/agents/business-analyst.md"

log_info "Checking that creative pack agent was installed..."
assert_file_exists "$TEMP_DIR/agents/ui-designer.md"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "SC-UX9: All assertions passed"
