#!/bin/bash
#===============================================================================
# Project Install + Pack Selection: Selective Merge with Pack System E2E
#
# Scenario: Pre-populate destination with a README.md (estandar file) and run
#           --project --force --packs business.
# Expected:
#   - exit code 0
#   - README.md still contains "My Custom Project" (estandar preserved, NOT overwritten)
#   - .codice-version exists and lists "business" in installedPacks
#   - agents/business-analyst.md EXISTS (business pack installed)
#   - agents/backend-developer.md MISSING (software-development NOT installed —
#     --packs overrides the --force "all packs" default)
#
# Project Install preserves estandar files (copied only if missing) while
# installing obligatorio content; --packs scopes which agent packs are copied.
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

log_step "Project Install with Pack Selection E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# Pre-populate with a project file that exists in estandar (README.md)
# Give it unique content so we can verify it was NOT overwritten
echo "# My Custom Project" > "$TEMP_DIR/README.md"
log_info "Pre-populated README.md with unique content"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_CLI --project --force --packs business in $TEMP_DIR"
run_cli_capture -- --project --force --packs business

# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

# 1. Existing estandar file PRESERVED (not overwritten)
log_info "Checking that README.md was preserved (estandar — not overwritten)..."
PRESERVED_CONTENT=$(head -1 "$TEMP_DIR/README.md" 2>/dev/null || echo "")
if [[ "$PRESERVED_CONTENT" != "# My Custom Project" ]]; then
    log_fail "README.md was overwritten! Expected original content preserved."
    echo "    Actual first line: $PRESERVED_CONTENT" >&2
    exit 1
fi
log_pass "README.md preserved (estandar — not overwritten)"

# 2. Version file records the selected pack
log_info "Checking .codice-version records installedPacks with business..."
assert_file_exists "$TEMP_DIR/.codice-version"
assert_version_has_pack "$TEMP_DIR/.codice-version" "business"
log_pass "Version file records installedPacks with business"

# 3. Selected pack agent present
log_info "Checking that business pack agent was installed..."
assert_file_exists "$TEMP_DIR/agents/business-analyst.md"

# 4. Non-selected pack agent ABSENT (--packs overrides --force "all packs")
log_info "Checking that software-development pack agent was NOT installed..."
assert_file_missing "$TEMP_DIR/agents/backend-developer.md"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "Project Install with Pack Selection: All assertions passed"
