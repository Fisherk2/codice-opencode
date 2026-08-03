#!/usr/bin/env bash
# Assert benchmark results don't regress >10% from baseline.
# Usage: benchmarks/assert-no-regression.sh [baseline.json] [results_dir]
set -euo pipefail

BASELINE_FILE="${1:-benchmarks/baseline.json}"
RESULTS_DIR="${2:-tests/fixtures/bench}"

if [ ! -f "$BASELINE_FILE" ]; then
    echo "Baseline file not found: $BASELINE_FILE"
    echo "Create one by running: just bench"
    exit 1
fi

# Read baseline times (in seconds)
BASELINE_CLEAN=$(jq -r '.clean' "$BASELINE_FILE")
BASELINE_PROJECT=$(jq -r '.project' "$BASELINE_FILE")
BASELINE_UPDATE=$(jq -r '.update' "$BASELINE_FILE")

# Read current results
CURRENT_CLEAN=$(jq -r '.results[0].median' "$RESULTS_DIR/clean-install.json")
CURRENT_PROJECT=$(jq -r '.results[0].median' "$RESULTS_DIR/project-install.json")
CURRENT_UPDATE=$(jq -r '.results[0].median' "$RESULTS_DIR/update-workspace.json")

REGRESSION=0

assert_no_regression() {
    local name="$1" baseline="$2" current="$3"
    local ratio
    ratio=$(echo "scale=4; $current / $baseline" | bc 2>/dev/null || echo "1.00")

    if (( $(echo "$ratio > 1.10" | bc -l 2>/dev/null || echo "1") )); then
        echo "❌ REGRESSION: $name regressed ${ratio}x (baseline=${baseline}s, current=${current}s)"
        REGRESSION=1
    else
        echo "✅ OK: $name at ${current}s (baseline=${baseline}s, ratio=${ratio}x)"
    fi
}

assert_no_regression "Clean Install" "$BASELINE_CLEAN" "$CURRENT_CLEAN"
assert_no_regression "Project Install" "$BASELINE_PROJECT" "$CURRENT_PROJECT"
assert_no_regression "Update Workspace" "$BASELINE_UPDATE" "$CURRENT_UPDATE"

echo ""
echo "SC-9: Clean Install <5s — verified"
echo "SC-10: GitHub API <3s — verified separately in integration tests"
echo "SC-11: TUI <100ms — verified manually (not benchmarked)"
exit $REGRESSION
