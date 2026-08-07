#!/bin/bash
#===============================================================================
# FEV-21-T9: Pack Validation — Minimum Viable Validation E2E
#
# Scenario: Pass invalid or empty --packs values to the CLI.
# Expected (usage errors — EXIT_USAGE = 2, rejected at parse time BEFORE
# any filesystem I/O, so no .codice-version is ever written):
#   - --packs ""                 → exit 2
#   - --packs nonexistent-pack   → exit 2
#   - --packs (no value)         → exit 2
#
# validatePackList rejects empty entries and unknown pack IDs; readFlagValue
# returns null when the value token is missing — both paths make parseArgs
# return null and main() exit with code 2 (parse-args.ts / main.ts).
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-21-T9: Pack Validation — Minimum Viable Validation E2E"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# Case 1: empty pack list
# ---------------------------------------------------------------------------

log_info "=== Case 1: --packs \"\" (empty value) ==="
EXIT_CODE=0
(cd "$TEMP_DIR" && $CODICE_CLI --clean --force --packs "") >/dev/null 2>&1 || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 2 ]]; then
    log_fail "Empty --packs exited with code $EXIT_CODE (expected 2 — usage error)"
    exit 1
fi
log_pass "Empty --packs exited with code 2"

if [[ -f "$TEMP_DIR/.codice-version" ]]; then
    log_fail ".codice-version was written after an invalid --packs flag"
    exit 1
fi
log_pass "No .codice-version written for empty --packs"

# ---------------------------------------------------------------------------
# Case 2: unknown pack ID
# ---------------------------------------------------------------------------

log_info "=== Case 2: --packs nonexistent-pack (unknown ID) ==="
EXIT_CODE=0
(cd "$TEMP_DIR" && $CODICE_CLI --clean --force --packs nonexistent-pack) >/dev/null 2>&1 || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 2 ]]; then
    log_fail "Unknown pack --packs exited with code $EXIT_CODE (expected 2 — usage error)"
    exit 1
fi
log_pass "Unknown pack --packs exited with code 2"

if [[ -f "$TEMP_DIR/.codice-version" ]]; then
    log_fail ".codice-version was written after an invalid --packs flag"
    exit 1
fi
log_pass "No .codice-version written for unknown pack"

# ---------------------------------------------------------------------------
# Case 3: missing value token
# ---------------------------------------------------------------------------

log_info "=== Case 3: --packs (no value) ==="
EXIT_CODE=0
(cd "$TEMP_DIR" && $CODICE_CLI --clean --force --packs) >/dev/null 2>&1 || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 2 ]]; then
    log_fail "Value-less --packs exited with code $EXIT_CODE (expected 2 — usage error)"
    exit 1
fi
log_pass "Value-less --packs exited with code 2"

if [[ -f "$TEMP_DIR/.codice-version" ]]; then
    log_fail ".codice-version was written after an invalid --packs flag"
    exit 1
fi
log_pass "No .codice-version written for value-less --packs"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-21-T9: All assertions passed"
