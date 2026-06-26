#!/bin/bash
#===============================================================================
# FEV-2-B: Symlinks Project Install E2E
#
# Scenario: Run Project Install and verify symlinks are created conditionally:
#   1. .opencode/ symlinks (3) are ALWAYS created
#   2. .devin/ symlinks (7) are created ONLY when .devin is selected
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-2-B: Symlinks Project Install E2E"

# Resolve binary (builds if needed)
CODICE_BINARY="$(setup_binary)"
log_info "Using binary: $CODICE_BINARY"

# ---------------------------------------------------------------------------
# Test 1: Project Install WITHOUT .devin → only 3 .opencode symlinks
# ---------------------------------------------------------------------------

log_info "--- Test 1: Project Install without .devin selection ---"

TEMP_DIR1="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR1"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR1/template"

log_info "Running: $CODICE_BINARY --project --force in $TEMP_DIR1"
EXIT_CODE=0
(cd "$TEMP_DIR1" && "$CODICE_BINARY" --project --force) 2>/dev/null || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "Binary exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "Binary exited with code 0"

# Verify .opencode symlinks exist (always created)
assert_symlink_exists "$TEMP_DIR1/.opencode/agents"
assert_symlink_target "$TEMP_DIR1/.opencode/agents" "../agents"
assert_dir_exists "$TEMP_DIR1/.opencode/agents"

assert_symlink_exists "$TEMP_DIR1/.opencode/commands"
assert_symlink_target "$TEMP_DIR1/.opencode/commands" "../commands"
assert_dir_exists "$TEMP_DIR1/.opencode/commands"

assert_symlink_exists "$TEMP_DIR1/.opencode/skills"
assert_symlink_target "$TEMP_DIR1/.opencode/skills" "../skills"
assert_dir_exists "$TEMP_DIR1/.opencode/skills"

# Verify .devin symlinks DO NOT exist (not selected when --force)
if [[ -L "$TEMP_DIR1/.devin/skills" ]]; then
    log_fail ".devin/skills symlink should NOT exist when .devin was not selected"
    exit 1
fi
log_pass ".devin/ symlinks correctly absent (not selected via --force)"

log_pass "Test 1: Project Install without .devin — PASSED"

# ---------------------------------------------------------------------------
# Test 2: Project Install WITH .devin → all 10 symlinks
# ---------------------------------------------------------------------------

log_info "--- Test 2: Project Install with .devin selected (interactive) ---"

TEMP_DIR2="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR2"

cp -r "$CODICE_ROOT/template" "$TEMP_DIR2/template"

# Race: interactive mode with mocked selection — we can't easily pipe input
# to @clack/prompts. Instead, install via clean install which always creates
# .devin symlinks (since .devin is always copied in clean mode).
log_info "Using --clean --force as proxy for 'select all optionals including .devin'"
EXIT_CODE2=0
(cd "$TEMP_DIR2" && "$CODICE_BINARY" --clean --force) 2>/dev/null || EXIT_CODE2=$?

if [[ "$EXIT_CODE2" -ne 0 ]]; then
    log_fail "Clean install exited with code $EXIT_CODE2 (expected 0)"
    exit 1
fi
log_pass "Clean install exited with code 0"

# Verify all 10 symlinks exist and resolve correctly
# .opencode/ (3)
assert_symlink_exists "$TEMP_DIR2/.opencode/agents"
assert_symlink_target "$TEMP_DIR2/.opencode/agents" "../agents"
assert_dir_exists "$TEMP_DIR2/.opencode/agents"

assert_symlink_exists "$TEMP_DIR2/.opencode/commands"
assert_symlink_target "$TEMP_DIR2/.opencode/commands" "../commands"
assert_dir_exists "$TEMP_DIR2/.opencode/commands"

assert_symlink_exists "$TEMP_DIR2/.opencode/skills"
assert_symlink_target "$TEMP_DIR2/.opencode/skills" "../skills"
assert_dir_exists "$TEMP_DIR2/.opencode/skills"

# .devin/ directory-level (2)
assert_symlink_exists "$TEMP_DIR2/.devin/skills"
assert_symlink_target "$TEMP_DIR2/.devin/skills" "../skills"
assert_dir_exists "$TEMP_DIR2/.devin/skills"

assert_symlink_exists "$TEMP_DIR2/.devin/workflows"
assert_symlink_target "$TEMP_DIR2/.devin/workflows" "../commands"
assert_dir_exists "$TEMP_DIR2/.devin/workflows"

# .devin/rules/ (5)
assert_symlink_exists "$TEMP_DIR2/.devin/rules/CODE_STYLE.md"
assert_symlink_target "$TEMP_DIR2/.devin/rules/CODE_STYLE.md" "../../docs/CODE_STYLE.md"
assert_file_exists "$TEMP_DIR2/.devin/rules/CODE_STYLE.md"

assert_symlink_exists "$TEMP_DIR2/.devin/rules/CONTRIBUTING.md"
assert_symlink_target "$TEMP_DIR2/.devin/rules/CONTRIBUTING.md" "../../CONTRIBUTING.md"
assert_file_exists "$TEMP_DIR2/.devin/rules/CONTRIBUTING.md"

assert_symlink_exists "$TEMP_DIR2/.devin/rules/code-review-and-quality.md"
assert_symlink_target "$TEMP_DIR2/.devin/rules/code-review-and-quality.md" "../../skills/code-review-and-quality/SKILL.md"
assert_file_exists "$TEMP_DIR2/.devin/rules/code-review-and-quality.md"

assert_symlink_exists "$TEMP_DIR2/.devin/rules/incremental-implementation.md"
assert_symlink_target "$TEMP_DIR2/.devin/rules/incremental-implementation.md" "../../skills/incremental-implementation/SKILL.md"
assert_file_exists "$TEMP_DIR2/.devin/rules/incremental-implementation.md"

assert_symlink_exists "$TEMP_DIR2/.devin/rules/test-driven-development.md"
assert_symlink_target "$TEMP_DIR2/.devin/rules/test-driven-development.md" "../../skills/test-driven-development/SKILL.md"
assert_file_exists "$TEMP_DIR2/.devin/rules/test-driven-development.md"

log_pass "Test 2: All 10 symlinks present and resolving correctly"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-2-B: Symlinks Project Install — all assertions passed"
