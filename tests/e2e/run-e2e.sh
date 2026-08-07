#!/bin/bash
#===============================================================================
# Códice — E2E Test Runner
#
# Runs all E2E test scenarios via `bun run src/cli/main.ts`.
# Each test script is sourced as a function to isolate failures.
#
# Usage:
#   bash tests/e2e/run-e2e.sh
#
# Environment variables:
#   VERBOSE=1       — Show all output (by default, only summary is shown)
#===============================================================================

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
CODICE_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd -P)"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly CYAN='\033[0;36m'
readonly YELLOW='\033[1;33m'
readonly RESET='\033[0m'

# Test results
PASSED=0
FAILED=0
FAILED_TESTS=()

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${CYAN}  Códice — E2E Test Suite${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# ---------------------------------------------------------------------------
# Helper: run a single test
# ---------------------------------------------------------------------------

run_test() {
    local test_script="$1"
    local test_name="$(basename "$test_script" .sh)"

    echo -e "${CYAN}[RUN]${RESET} $test_name..."

    if [[ "${VERBOSE:-0}" == "1" ]]; then
        # Show all output
        if bash "$test_script"; then
            echo -e "${GREEN}[PASS]${RESET} $test_name"
            PASSED=$((PASSED + 1))
        else
            echo -e "${RED}[FAIL]${RESET} $test_name"
            FAILED=$((FAILED + 1))
            FAILED_TESTS+=("$test_name")
        fi
    else
        # Suppress output, only show pass/fail
        if bash "$test_script" >/dev/null 2>&1; then
            echo -e "${GREEN}[PASS]${RESET} $test_name"
            PASSED=$((PASSED + 1))
        else
            # Re-run with output visible on failure
            echo -e "${RED}[FAIL]${RESET} $test_name — re-running with output:"
            bash "$test_script" 2>&1 || true
            FAILED=$((FAILED + 1))
            FAILED_TESTS+=("$test_name")
        fi
    fi

    echo ""
}

# ---------------------------------------------------------------------------
# Run all test scenarios
# ---------------------------------------------------------------------------

TESTS=(
    "$SCRIPT_DIR/01-clean-install.sh"
    "$SCRIPT_DIR/02-project-install.sh"
    "$SCRIPT_DIR/03-optional-skip.sh"
    "$SCRIPT_DIR/04-update-workspace.sh"
    "$SCRIPT_DIR/05-atomic-rollback.sh"
    "$SCRIPT_DIR/06-path-traversal.sh"
    "$SCRIPT_DIR/07-symlinks-clean-install.sh"
    "$SCRIPT_DIR/08-symlinks-project-install.sh"
    "$SCRIPT_DIR/09-symlinks-idempotency.sh"
    "$SCRIPT_DIR/10-update-no-symlinks.sh"
    "$SCRIPT_DIR/11-gitignore-clean-install.sh"
    "$SCRIPT_DIR/12-gitignore-project-install.sh"
    "$SCRIPT_DIR/13-clean-install-optional-menu.sh"
    "$SCRIPT_DIR/14-project-install-optional-selection.sh"
    "$SCRIPT_DIR/15-update-workspace-existing-project.sh"
    "$SCRIPT_DIR/16-update-granularity.sh"
    "$SCRIPT_DIR/17-pack-selection-default.sh"
    "$SCRIPT_DIR/18-pack-selection-custom.sh"
    "$SCRIPT_DIR/19-pack-validation-min1.sh"
    "$SCRIPT_DIR/20-codice-version-installedPacks.sh"
    "$SCRIPT_DIR/21-update-blocked-missing.sh"
    "$SCRIPT_DIR/22-update-blocked-v1x.sh"
    "$SCRIPT_DIR/23-update-option-a.sh"
    "$SCRIPT_DIR/24-install-summary-clean.sh"
    "$SCRIPT_DIR/25-install-summary-packs.sh"
    "$SCRIPT_DIR/26-update-blocked-pre-1.2.0.sh"
    "$SCRIPT_DIR/28-flat-agents-destination.sh"
    "$SCRIPT_DIR/29-non-interactive-packs.sh"
    "$SCRIPT_DIR/30-project-install-packs.sh"
)

for test_script in "${TESTS[@]}"; do
    if [[ ! -f "$test_script" ]]; then
        echo -e "${YELLOW}[SKIP]${RESET} $(basename "$test_script" .sh) — test script not found"
        continue
    fi
    run_test "$test_script"
done

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${CYAN}  Results: $PASSED passed, $FAILED failed${RESET}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"

if [[ "$FAILED" -gt 0 ]]; then
    echo ""
    echo -e "${RED}Failed tests:${RESET}"
    for failed in "${FAILED_TESTS[@]}"; do
        echo "  - $failed"
    done
    exit 1
fi

exit 0
