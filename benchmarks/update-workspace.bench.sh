#!/usr/bin/env bash
# Benchmark Update Workspace performance.
# Asserts SC-9: Complete local installation completes in < 5 seconds on a modern SSD.
set -euo pipefail

DEST="${1:-tests/fixtures/bench/update}"
mkdir -p "$DEST"

hyperfine --warmup 1 --runs 5 --command-name "update-workspace" \
    "bun run src/cli/main.ts --mode update --dest $DEST --force"

echo ""
echo "SC-9 assertion: Update Workspace should complete in < 5 seconds (median)."
echo "Check the 'Time' column above. If median > 5s, file an issue."
