#!/bin/bash
#===============================================================================
# FEV-2-B: Symlinks Idempotency E2E
#
# Scenario: Run Clean Install twice in the same directory. Verify that running
# the installer a second time produces the same result — all 10 symlinks still
# exist with correct targets.
#
# Symlinks verified (same as 07-symlinks-clean-install.sh):
#   .opencode/ (3): agents, commands, skills
#   .devin/ (7): skills, workflows, rules/{CODE_STYLE.md, CONTRIBUTING.md,
#                code-review-and-quality.md, incremental-implementation.md,
#                test-driven-development.md}
#===============================================================================

set -Eeuo pipefail
source "$(dirname "$0")/common.sh"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

log_step "FEV-2-B: Symlinks Idempotency E2E"

# Resolve binary (builds if needed)
CODICE_BINARY="$(setup_binary)"
log_info "Using binary: $CODICE_BINARY"

# Create temp directory with template
TEMP_DIR="$(create_temp_dir)"
log_info "Test directory: $TEMP_DIR"

# Copy template to temp dir so the binary can find it
cp -r "$CODICE_ROOT/template" "$TEMP_DIR/template"

# ---------------------------------------------------------------------------
# First run
# ---------------------------------------------------------------------------

log_info "=== First run: $CODICE_BINARY --clean --force ==="
EXIT_CODE=0
(cd "$TEMP_DIR" && "$CODICE_BINARY" --clean --force) 2>/dev/null || EXIT_CODE=$?

if [[ "$EXIT_CODE" -ne 0 ]]; then
    log_fail "First run exited with code $EXIT_CODE (expected 0)"
    exit 1
fi
log_pass "First run exited with code 0"

# ---------------------------------------------------------------------------
# Second run
# ---------------------------------------------------------------------------

log_info "=== Second run: $CODICE_BINARY --clean --force (idempotency check) ==="
EXIT_CODE2=0
(cd "$TEMP_DIR" && "$CODICE_BINARY" --clean --force) 2>/dev/null || EXIT_CODE2=$?

if [[ "$EXIT_CODE2" -ne 0 ]]; then
    log_fail "Second run exited with code $EXIT_CODE2 (expected 0)"
    exit 1
fi
log_pass "Second run exited with code 0"

# ---------------------------------------------------------------------------
# Assertions — .opencode/ symlinks (3)
# ---------------------------------------------------------------------------

log_info "Verifying .opencode/ symlinks..."

assert_symlink_exists "$TEMP_DIR/.opencode/agents"
assert_symlink_target "$TEMP_DIR/.opencode/agents" "../agents"
assert_dir_exists "$TEMP_DIR/.opencode/agents"

assert_symlink_exists "$TEMP_DIR/.opencode/commands"
assert_symlink_target "$TEMP_DIR/.opencode/commands" "../commands"
assert_dir_exists "$TEMP_DIR/.opencode/commands"

assert_symlink_exists "$TEMP_DIR/.opencode/skills"
assert_symlink_target "$TEMP_DIR/.opencode/skills" "../skills"
assert_dir_exists "$TEMP_DIR/.opencode/skills"

# ---------------------------------------------------------------------------
# Assertions — .devin/ symlinks (7)
# ---------------------------------------------------------------------------

log_info "Verifying .devin/ directory-level symlinks..."

assert_symlink_exists "$TEMP_DIR/.devin/skills"
assert_symlink_target "$TEMP_DIR/.devin/skills" "../skills"
assert_dir_exists "$TEMP_DIR/.devin/skills"

assert_symlink_exists "$TEMP_DIR/.devin/workflows"
assert_symlink_target "$TEMP_DIR/.devin/workflows" "../commands"
assert_dir_exists "$TEMP_DIR/.devin/workflows"

# ---------------------------------------------------------------------------
# Assertions — .devin/rules/ symlinks (5)
# ---------------------------------------------------------------------------

log_info "Verifying .devin/rules/ symlinks..."

assert_symlink_exists "$TEMP_DIR/.devin/rules/CODE_STYLE.md"
assert_symlink_target "$TEMP_DIR/.devin/rules/CODE_STYLE.md" "../../docs/CODE_STYLE.md"
assert_file_exists "$TEMP_DIR/.devin/rules/CODE_STYLE.md"

assert_symlink_exists "$TEMP_DIR/.devin/rules/CONTRIBUTING.md"
assert_symlink_target "$TEMP_DIR/.devin/rules/CONTRIBUTING.md" "../../CONTRIBUTING.md"
assert_file_exists "$TEMP_DIR/.devin/rules/CONTRIBUTING.md"

assert_symlink_exists "$TEMP_DIR/.devin/rules/code-review-and-quality.md"
assert_symlink_target "$TEMP_DIR/.devin/rules/code-review-and-quality.md" "../../skills/code-review-and-quality/SKILL.md"
assert_file_exists "$TEMP_DIR/.devin/rules/code-review-and-quality.md"

assert_symlink_exists "$TEMP_DIR/.devin/rules/incremental-implementation.md"
assert_symlink_target "$TEMP_DIR/.devin/rules/incremental-implementation.md" "../../skills/incremental-implementation/SKILL.md"
assert_file_exists "$TEMP_DIR/.devin/rules/incremental-implementation.md"

assert_symlink_exists "$TEMP_DIR/.devin/rules/test-driven-development.md"
assert_symlink_target "$TEMP_DIR/.devin/rules/test-driven-development.md" "../../skills/test-driven-development/SKILL.md"
assert_file_exists "$TEMP_DIR/.devin/rules/test-driven-development.md"

# ---------------------------------------------------------------------------
# Verify staging directory was cleaned after second run
# ---------------------------------------------------------------------------

if [[ -d "$TEMP_DIR/.codice-staging" ]]; then
    log_fail "Staging directory was not cleaned after second install"
    exit 1
fi
log_pass "Staging directory cleaned"

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

log_pass "FEV-2-B: Symlinks Idempotency — all assertions passed (2 runs, 10 symlinks each)"
