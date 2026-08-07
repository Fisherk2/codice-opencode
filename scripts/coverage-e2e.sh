#!/usr/bin/env bash
# Generate coverage report including all tests.
# Uses bun's native --coverage (c8 is incompatible with Bun — see below).
#
# c8 (NYC-compatible) analysis:
#   - c8 v12.0.0 sets NODE_V8_COVERAGE and relies on V8's built-in coverage hooks.
#   - Bun uses JavaScriptCore, not V8, so c8 can only wrap the process
#     but cannot instrument code — it produces 0% coverage reports.
#   - Conclusion: c8 is fundamentally incompatible with Bun.
#
# Usage:
#   bash scripts/coverage-e2e.sh
#
# Output:
#   Terminal: text summary
#   Note: E2E shell scripts are NOT instrumented. Only unit & integration tests
#   run via `bun test --coverage` are instrumented.

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
IGNORE_PATTERNS="--path-ignore-patterns=template/obligatorio/core/skills/**,skills/**"

log_info() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $*" >&2
}

log_error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

cleanup() {
    log_info "Done."
}

trap cleanup EXIT

log_info "Installing deps..."
bun install 2>/dev/null || true

log_info "Running coverage via bun test --coverage..."
log_info "Note: Only unit and integration tests are instrumented. E2E shell scripts are not covered."

bun test tests/ --coverage "$IGNORE_PATTERNS" 2>&1 || {
    log_error "bun test --coverage failed."
    exit 1
}

echo ""
echo "============================================"
echo "✅ Coverage report generated"
echo "============================================"
echo ""
echo "NOTES:"
echo "  - c8 is NOT compatible with Bun (uses V8 coverage hooks; Bun uses JavaScriptCore)"
echo "  - Coverage is generated via bun test --coverage (native)"
echo "  - E2E tests (shell scripts) are NOT instrumented"
echo "  - To improve coverage: see src/cli/ and tests/ for uncovered lines"
