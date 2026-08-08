#!/bin/bash
# FEV-24 Smoke Test: Validate 4 new commands (sync, migrate, deploy, analyze)
#
# Validates:
#   - File exists
#   - YAML frontmatter has 'description' and 'agent' fields
#   - 'agent' field matches expected value
#   - Body has 'Pre-Flight' and 'Suggested Next Step' sections
#   - Body references at least one skill
#
# This test does NOT validate behavior — that's the agent's responsibility.
#
# NOTE: Registered in run-e2e.sh TESTS array in the Phase 5 commit (when all
# 4 commands are validated and the file is finalized). Until then, run it
# directly via `bash tests/e2e/31-commands-fe24-smoke.sh`.

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

COMMANDS_DIR="$CODICE_ROOT/template/obligatorio/core/commands"

# validate_command <file> <expected_agent> <expected_description_substring>
validate_command() {
  local file="$1"
  local expected_agent="$2"
  local expected_desc_substr="$3"

  log_step "Validating command: $(basename "$file")"

  # File exists
  assert_file_exists "$file"

  # Frontmatter: description
  if ! grep -q "^description:" "$file"; then
    log_fail "Missing 'description' in frontmatter"
    exit 1
  fi

  # Frontmatter: agent
  if ! grep -qE "^agent:\s*${expected_agent}\s*$" "$file"; then
    log_fail "Frontmatter 'agent' field does not match expected '${expected_agent}'"
    exit 1
  fi

  # Description contains expected substring (sanity check)
  if ! grep -q "$expected_desc_substr" "$file"; then
    log_fail "Description does not contain expected substring: '$expected_desc_substr'"
    exit 1
  fi

  # Body: Pre-Flight section
  if ! grep -q "## Pre-Flight" "$file"; then
    log_fail "Missing '## Pre-Flight' section in body"
    exit 1
  fi

  # Body: Suggested Next Step section
  if ! grep -q "## Suggested Next Step" "$file"; then
    log_fail "Missing '## Suggested Next Step' section in body"
    exit 1
  fi

  # Body: References at least one skill
  if ! grep -qE "@?skills/" "$file"; then
    log_fail "No skill references found in body (expected at least one)"
    exit 1
  fi

  log_pass "Command valid: $(basename "$file")"
}

# /sync (FEV-24-A)
validate_command \
  "$COMMANDS_DIR/sync.md" \
  "tlaloc" \
  "sync"

# /migrate (FEV-24-B) — Optional
validate_command \
  "$COMMANDS_DIR/migrate.md" \
  "quetzalcoatl" \
  "migration"

# Verify "Optional" marker in body (per fix10 diagnosis)
if ! grep -qi "optional command" "$COMMANDS_DIR/migrate.md"; then
  log_fail "/migrate should be marked as Optional command (per fix10 diagnosis)"
  exit 1
fi
log_pass "/migrate marked as Optional command"

# /deploy (FEV-24-C)
validate_command \
  "$COMMANDS_DIR/deploy.md" \
  "mictlantecuhtli" \
  "deploy"

# /analyze (FEV-24-D)
validate_command \
  "$COMMANDS_DIR/analyze.md" \
  "quetzalcoatl" \
  "analyze"

# Verify diagnosis.md integration (FEV-24-D requires TECH_DEBT.md as input)
if ! grep -q "TECH_DEBT" "$COMMANDS_DIR/diagnosis.md"; then
  log_fail "diagnosis.md does not reference TECH_DEBT.md (FEV-24-D integration missing)"
  exit 1
fi
log_pass "diagnosis.md references TECH_DEBT.md (FEV-24-D integration verified)"

# Verify all 4 commands are present (Phase 5 finalization check)
for cmd in sync migrate deploy analyze; do
  assert_file_exists "$COMMANDS_DIR/${cmd}.md"
done
log_pass "All 4 FEV-24 commands exist"

log_pass "FEV-24 smoke test: /sync, /migrate, /deploy, /analyze validated"
