#!/usr/bin/env bash
# Generate coverage report and enforce minimum thresholds.
# Uses bun's native --coverage (c8 is incompatible with Bun).
#
# Thresholds live in scripts/coverage-thresholds.json — the single source of
# truth for both the global gate and the per-file sub-gate (src/cli/main.ts).
# An optional positional argument overrides ONLY the global threshold.
#
# Usage:
#   bash scripts/coverage-check.sh [global-threshold]
#
# Exit codes:
#   0  — Coverage meets every threshold
#   1  — Coverage below a threshold, or thresholds config missing/invalid
#        (fail-closed: a broken config never approves the build)

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
COVERAGE_DIR="$PROJECT_DIR/coverage"
THRESHOLDS_FILE="$SCRIPT_DIR/coverage-thresholds.json"
MAIN_FILE_KEY="src/cli/main.ts"
IGNORE_PATTERNS="--path-ignore-patterns=template/obligatorio/core/skills/**,skills/**"

log_info() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $*" >&2; }
log_error() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2; }

cleanup() { log_info "Done."; }
trap cleanup EXIT

# ─── Load thresholds (fail-closed) ────────────────────────────────────────────

if [[ ! -f "$THRESHOLDS_FILE" ]]; then
    log_error "Coverage thresholds config not found: $THRESHOLDS_FILE"
    exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
    log_error "jq is required to read coverage thresholds from $THRESHOLDS_FILE"
    exit 1
fi

# A malformed config (invalid JSON or non-numeric value) fails here instead of
# silently falling back to a default that could pass.
if ! GLOBAL_THRESHOLD="$(jq -er '.global | numbers' "$THRESHOLDS_FILE")"; then
    log_error "Invalid coverage thresholds config: '.global' must be a number ($THRESHOLDS_FILE)"
    exit 1
fi

# Per-file sub-gate; falls back to the global threshold when not configured.
if ! MAIN_THRESHOLD="$(jq -er --arg key "$MAIN_FILE_KEY" '.files[$key] | numbers' "$THRESHOLDS_FILE")"; then
    MAIN_THRESHOLD="$GLOBAL_THRESHOLD"
fi

# Optional positional argument overrides ONLY the global threshold.
GLOBAL_OVERRIDE="${1:-}"
if [[ -n "$GLOBAL_OVERRIDE" ]]; then
    if [[ ! "$GLOBAL_OVERRIDE" =~ ^[0-9]+([.][0-9]+)?$ ]]; then
        log_error "Invalid global threshold override: '$GLOBAL_OVERRIDE' (expected a number)"
        exit 1
    fi
    GLOBAL_THRESHOLD="$GLOBAL_OVERRIDE"
fi

log_info "Thresholds source: ${THRESHOLDS_FILE}"
if [[ -n "$GLOBAL_OVERRIDE" ]]; then
    log_info "Global threshold overridden by argument: ${GLOBAL_OVERRIDE}%"
fi
log_info "Running coverage via bun test --coverage (global threshold: ${GLOBAL_THRESHOLD}%, ${MAIN_FILE_KEY} threshold: ${MAIN_THRESHOLD}%)..."

mkdir -p "$COVERAGE_DIR"

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

# Pass paths/thresholds via env so no shell interpolation reaches the Python source
export COVERAGE_LCOV_PATH="$COVERAGE_DIR/lcov.info"
export COVERAGE_GLOBAL_THRESHOLD="$GLOBAL_THRESHOLD"
export COVERAGE_MAIN_THRESHOLD="$MAIN_THRESHOLD"

python3 -c "
import os
import sys
global_threshold = float(os.environ['COVERAGE_GLOBAL_THRESHOLD'])
main_threshold = float(os.environ['COVERAGE_MAIN_THRESHOLD'])

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
print(f'Total line coverage: {coverage:.2f}% ({lh_total}/{lf_total} lines)')

# Check the per-file sub-gate specifically
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
    print(f'main.ts coverage: {main_cov:.2f}% ({main_lh}/{main_lf} lines) — threshold {main_threshold:g}%')
    if main_cov < main_threshold:
        print(f'FAIL: main.ts coverage below {main_threshold:g}%')
        sys.exit(1)

if coverage < global_threshold:
    print(f'FAIL: Overall coverage below {global_threshold:g}%')
    sys.exit(1)

print(f'PASS: Coverage meets threshold ({global_threshold:g}%)')
sys.exit(0)
" 2>&1 || {
    log_error "Coverage check failed."
    exit 1
}
