#!/bin/bash
#===============================================================================
# F4-T3: Project Install Selective E2E
#
# Scenario: Pre-populate destination with a file that exists in estandar
# Expected: Existing estandar file is preserved (not overwritten)
#           Obligatorio files are always copied
#           Optional files are NOT selected (--force skips optional selection)
#
# This tests the --project --force merge behavior.
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "F4-T3: Project Install Selective E2E"

# Resolve binary
CODICE_BINARY="$(setup_binary)"
log_info "Using binary: $CODICE_BINARY"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# Pre-populate with a file that exists in estandar (e.g., README.md)
# Give it unique content so we can verify it was NOT overwritten
echo "# PRESERVED — This README should survive the install" > "$TEMP_DIR/README.md"
log_info "Pre-populated README.md with unique content"

# Also pre-populate an obligatorio file to verify it IS overwritten
mkdir -p "$TEMP_DIR/agents"
echo "# ORIGINAL — This should be overwritten" > "$TEMP_DIR/agents/tlaloc.md"
log_info "Pre-populated agents/tlaloc.md (obligatorio — expect overwrite)"

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

log_info "Checking that estandar file was PRESERVED (not overwritten)..."

PRESERVED_CONTENT=$(head -1 "$TEMP_DIR/README.md" 2>/dev/null || echo "")
if [[ "$PRESERVED_CONTENT" != "# PRESERVED — This README should survive the install" ]]; then
    log_fail "README.md was overwritten! Expected original content preserved."
    echo "    Actual first line: $PRESERVED_CONTENT" >&2
    exit 1
fi
log_pass "README.md preserved (estandar — not overwritten)"

log_info "Checking that obligatorio file WAS overwritten..."

if [[ ! -f "$TEMP_DIR/agents/tlaloc.md" ]]; then
    log_fail "agents/tlaloc.md is missing!"
    exit 1
fi
OVERWRITTEN_CONTENT=$(head -1 "$TEMP_DIR/agents/tlaloc.md" 2>/dev/null || echo "")
if [[ "$OVERWRITTEN_CONTENT" == "# ORIGINAL — This should be overwritten" ]]; then
    log_fail "agents/tlaloc.md was NOT overwritten (expected obligatorio to overwrite)"
    exit 1
fi
log_pass "agents/tlaloc.md was overwritten (obligatorio — correct)"

log_info "Checking that other estandar files were copied..."

assert_file_exists "$TEMP_DIR/.gitignore"
assert_file_exists "$TEMP_DIR/AGENTS.md"

log_info "Checking that optional files are NOT present (--force skips optional)..."

assert_file_missing "$TEMP_DIR/Dockerfile"
assert_file_missing "$TEMP_DIR/scripts/build.sh"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "F4-T3: All assertions passed"
