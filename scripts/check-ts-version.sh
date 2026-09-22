#!/usr/bin/env bash
# Advisory coherence check: the tsc that `bun run tsc` actually resolves vs. the
# TypeScript major declared in package.json.
#
# On mounts that ignore chmod (fuseblk/NTFS, nosuid,nodev) the native TS 7
# binary in node_modules loses its executable bit and `bun run tsc` silently
# falls back to a globally installed tsc, so the type-check validates a
# different compiler than the one declared. This script surfaces that drift.
#
# Advisory only: it ALWAYS exits 0, so it can never block `just check` or CI.
# Every failure to resolve either version degrades to a silent no-op. See
# docs/TECH_DEBT.md (TD-V2-97).
#
# Usage:
#   bash scripts/check-ts-version.sh

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
PACKAGE_JSON="$PROJECT_DIR/package.json"

# Degrade silently when the tooling or inputs needed to resolve either version
# are unavailable — this check is a hint, never a gate.
if ! command -v jq >/dev/null 2>&1; then
    exit 0
fi

if [[ ! -f "$PACKAGE_JSON" ]]; then
    exit 0
fi

if ! DECLARED_RANGE="$(jq -er '.devDependencies.typescript // empty' "$PACKAGE_JSON" 2>/dev/null)"; then
    exit 0
fi

if [[ "$DECLARED_RANGE" =~ ([0-9]+) ]]; then
    DECLARED_MAJOR="${BASH_REMATCH[1]}"
else
    exit 0
fi

# Run from the project root so the local node_modules wins; a fallback to a
# global tsc here is exactly the drift this check reports.
if ! TSC_OUTPUT="$(cd "$PROJECT_DIR" && bun run tsc --version 2>/dev/null)"; then
    exit 0
fi

if [[ "$TSC_OUTPUT" =~ Version[[:space:]]+([0-9]+\.[0-9]+\.[0-9]+) ]]; then
    RESOLVED_VERSION="${BASH_REMATCH[1]}"
    RESOLVED_MAJOR="${RESOLVED_VERSION%%.*}"
else
    exit 0
fi

if [[ "$RESOLVED_MAJOR" != "$DECLARED_MAJOR" ]]; then
    printf '⚠ WARNING: resolved tsc is %s but package.json declares %s — type-check is NOT validating the declared TypeScript version (NTFS/fuseblk mount ignores chmod; see docs/TECH_DEBT.md).\n' \
        "$RESOLVED_VERSION" "$DECLARED_RANGE" >&2
fi

exit 0
