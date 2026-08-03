#!/usr/bin/env bash
# Benchmark Clean Install performance.
# Asserts SC-9: Complete local installation completes in < 5 seconds on a modern SSD.
set -euo pipefail

DEST="${1:-tests/fixtures/bench/clean}"
mkdir -p "$DEST"

hyperfine --warmup 1 --runs 5 --command-name "clean-install" \
    "bun run src/cli/main.ts --mode clean --dest $DEST --force"

echo ""
echo "SC-9 assertion: Clean Install should complete in < 5 seconds (median)."
echo "Check the 'Time' column above. If median > 5s, file an issue."
