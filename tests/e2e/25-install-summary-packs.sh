#!/bin/bash
#===============================================================================
# FEV-22-T2: Install Summary — Pack Count Accuracy E2E
#
# Scenario: Clean install with a SINGLE pack (--packs software-development).
#           The agent count shown per pack in the summary must match the
#           manifest count, and the manifest count must match the actual number
#           of agent files in the pack directory.
# Expected:
#   - exit code 0
#   - output contains "software-development (146 agents)" (manifest count)
#   - output contains "Total: ~146 agents" (single pack → total = its count)
#   - filesystem cross-check: number of *.md files in
#     template/obligatorio/packs/software-development/ equals 146
#     (verified exact during development — no tolerance band needed)
#
# Per spec §10 Q4 "approximate is sufficient", a tolerance band would be
# acceptable, but the count matches the manifest exactly, so we assert equality
# — the strongest form. If the pack gains agents in the future, the manifest
# must be updated in lockstep, and this test enforces that.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-22-T2: Pack Count Accuracy in Summary"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# Execute
# ---------------------------------------------------------------------------

log_info "Running: $CODICE_CLI --clean --force --packs software-development in $TEMP_DIR"
EXIT_CODE=0
CLI_OUTPUT=$(cd "$TEMP_DIR" && $CODICE_CLI --clean --force --packs software-development 2>&1) || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "CLI exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "CLI exited with code 0"

# ---------------------------------------------------------------------------
# Assertions: Pack count accuracy
# ---------------------------------------------------------------------------

# 1. Summary shows the manifest count for the single pack
log_info "Checking software-development agent count shown..."
assert_contains "$CLI_OUTPUT" "software-development (146 agents)"

# 2. Total equals the single pack count
log_info "Checking total agent count shown..."
assert_contains "$CLI_OUTPUT" "Total: ~146 agents"

# 3. Filesystem cross-check: manifest count == actual agent files in pack dir
log_info "Counting actual agent files in software-development pack..."
PACK_DIR="$CODICE_ROOT/template/obligatorio/packs/software-development"
ACTUAL_COUNT="$(find "$PACK_DIR" -maxdepth 1 -name '*.md' | wc -l | tr -d '[:space:]')"
MANIFEST_COUNT=146

if [[ "$ACTUAL_COUNT" -ne "$MANIFEST_COUNT" ]]; then
    log_fail "Pack agent count mismatch: manifest says $MANIFEST_COUNT, found $ACTUAL_COUNT .md files in $PACK_DIR"
    exit 1
fi
log_pass "Pack agent count matches manifest: $ACTUAL_COUNT == $MANIFEST_COUNT"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-22-T2: All assertions passed"
