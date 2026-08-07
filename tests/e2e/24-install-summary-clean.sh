#!/bin/bash
#===============================================================================
# FEV-22-T1: Install Summary — Displayed in Clean Install E2E
#
# Scenario: Clean install with TWO packs via --packs software-development,business
#           must show the pre-install summary screen (spec §3.3) before merging.
# Expected:
#   - exit code 0
#   - output contains the note title "📋 Installation Summary"
#   - output contains per-pack agent counts from the manifest:
#       "software-development (146 agents)"
#       "business (92 agents)"
#   - output contains the total: 146 + 92 = "Total: ~238 agents"
#   - output contains the mandatory dirs: "Mandatory: core, packs/main, packs/writers"
#   - agents/backend-developer.md EXISTS (software-development pack installed)
#
# The summary is rendered via clack.note(); the body text sits between ANSI box
# border characters, so assertions match the plain-text needles, which are
# contiguous in the captured output. "Optional:" and total-file counts are NOT
# asserted — that estimate depends on optional file selection (spec §10 Q4:
# approximate is sufficient) and is out of scope for this acceptance test.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-22-T1: Install Summary Displayed in Clean Install"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_CLI --clean --force --packs software-development,business in $TEMP_DIR"
EXIT_CODE=0
CLI_OUTPUT=$(cd "$TEMP_DIR" && $CODICE_CLI --clean --force --packs software-development,business 2>&1) || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "CLI exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "CLI exited with code 0"

# ---------------------------------------------------------------------------
# Assertions: Install summary screen (spec §3.3)
# ---------------------------------------------------------------------------

# 1. Summary note title is rendered (ANSI codes may wrap it, but the emoji +
#    title text is contiguous in the captured output).
log_info "Checking summary title is shown..."
assert_contains "$CLI_OUTPUT" "📋 Installation Summary"

# 2. Per-pack agent counts from the manifest
log_info "Checking software-development agent count shown..."
assert_contains "$CLI_OUTPUT" "software-development (146 agents)"

log_info "Checking business agent count shown..."
assert_contains "$CLI_OUTPUT" "business (92 agents)"

# 3. Total agents = 146 + 92 = 238
log_info "Checking total agent count shown..."
assert_contains "$CLI_OUTPUT" "Total: ~238 agents"

# 4. Mandatory directories include main + writers (spec §3.3)
log_info "Checking mandatory directories shown..."
assert_contains "$CLI_OUTPUT" "Mandatory: core, packs/main, packs/writers"

# 5. Sanity: software-development pack actually installed
log_info "Checking software-development pack agent was installed..."
assert_file_exists "$TEMP_DIR/agents/backend-developer.md"

# 6. Sanity: business pack also installed (two-pack scenario is self-contained)
log_info "Checking business pack agent was installed..."
assert_file_exists "$TEMP_DIR/agents/business-analyst.md"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-22-T1: All assertions passed"
