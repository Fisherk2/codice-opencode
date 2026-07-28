#!/bin/bash
#===============================================================================
# Códice — CLI wrapper for E2E tests
#
# Invokes the CLI via `bun run src/cli/main.ts` forwarding all arguments.
# Replaces the compiled binary used in earlier versions.
#===============================================================================
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
CODICE_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd -P)"

exec bun run "$CODICE_ROOT/src/cli/main.ts" "$@"
