#!/usr/bin/env bash
# Generate coverage report and enforce minimum thresholds.
# Uses bun's native --coverage (c8 is incompatible with Bun).
#
# Usage:
#   bash scripts/coverage-check.sh [threshold=95]
#
# Exit codes:
#   0  — Coverage meets threshold
#   1  — Coverage below threshold or error

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
COVERAGE_DIR="$PROJECT_DIR/coverage"
THRESHOLD="${1:-95}"
IGNORE_PATTERNS="--path-ignore-patterns=template/obligatorio/core/skills/**,skills/**"

log_info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $*" >&2; }
log_error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }

cleanup() { log_info "Done."; }
trap cleanup EXIT

mkdir -p "$COVERAGE_DIR"

log_info "Running coverage via bun test --coverage (threshold: ${THRESHOLD}%)..."

# Run tests with lcov output for machine-readable coverage data
bun test tests/ --coverage \
    --coverage-reporter=lcov \
    --coverage-dir="$COVERAGE_DIR" \
    "$IGNORE_PATTERNS" 2>/dev/null || {
    log_error "bun test --coverage failed."
    exit 1
}

# Parse lcov.info to extract total line coverage
# LF = Lines Found (total), LH = Lines Hit (covered)
if [[ ! -f "$COVERAGE_DIR/lcov.info" ]]; then
    log_error "Coverage report not found at $COVERAGE_DIR/lcov.info"
    exit 1
fi

# Pass the lcov path via env var so no shell interpolation reaches the Python source
export COVERAGE_LCOV_PATH="$COVERAGE_DIR/lcov.info"

python3 -c "
import os
import sys
lf_total = 0
lh_total = 0
with open(os.environ['COVERAGE_LCOV_PATH']) as f:
    for line in f:
        line = line.strip()
        if line.startswith('LF:'):
            lf_total += int(line.split(':')[1])
        elif line.startswith('LH:'):
            lh_total += int(line.split(':')[1])

if lf_total == 0:
    print('ERROR: No coverage data found')
    sys.exit(1)

coverage = (lh_total / lf_total) * 100
threshold = $THRESHOLD
print(f'Total line coverage: {coverage:.2f}% ({lh_total}/{lf_total} lines)')

# Check main.ts specifically
main_lf = 0
main_lh = 0
with open(os.environ['COVERAGE_LCOV_PATH']) as f:
    in_main = False
    for line in f:
        line = line.strip()
        if line.startswith('SF:') and 'src/cli/main.ts' in line:
            in_main = True
        elif line.startswith('SF:'):
            in_main = False
        elif line.startswith('LF:') and in_main:
            main_lf += int(line.split(':')[1])
        elif line.startswith('LH:') and in_main:
            main_lh += int(line.split(':')[1])

if main_lf > 0:
    main_cov = (main_lh / main_lf) * 100
    print(f'main.ts coverage: {main_cov:.2f}% ({main_lh}/{main_lf} lines)')
    if main_cov < threshold:
        print(f'FAIL: main.ts coverage below {threshold}%')
        sys.exit(1)

if coverage < threshold:
    print(f'FAIL: Overall coverage below {threshold}%')
    sys.exit(1)

print(f'PASS: Coverage meets threshold ({threshold}%)')
sys.exit(0)
" 2>&1 || {
    log_error "Coverage check failed."
    exit 1
}
