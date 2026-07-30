#!/usr/bin/env bash
# Benchmark Project Install performance.
# Asserts SC-9: Complete local installation completes in < 5 seconds on a modern SSD.
set -euo pipefail

DEST="${1:-tests/fixtures/bench/project}"
mkdir -p "$DEST"

hyperfine --warmup 1 --runs 5 --command-name "project-install" \
    "bun run src/cli/main.ts --mode project --dest $DEST --force"

echo ""
echo "SC-9 assertion: Project Install should complete in < 5 seconds (median)."
echo "Check the 'Time' column above. If median > 5s, file an issue."
