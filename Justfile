# Códice — Just command runner

setup:
    bun install

dev:
    mkdir -p tests/fixtures/workspace
    bun run src/cli/main.ts --verbose --dest tests/fixtures/workspace

lint:
    bunx @biomejs/biome check src/ tests/

format:
    bunx @biomejs/biome format --write src/ tests/

format-check:
    bunx @biomejs/biome ci src/ tests/

check:
    bunx @biomejs/biome ci src/ tests/ && bun run tsc --noEmit

# Exclude template/obligatorio/skills/ and skills/ — external code with own test deps
IGNORE_PATTERNS := "--path-ignore-patterns=template/obligatorio/core/skills/**,skills/**"

test:
    bun test tests/ {{IGNORE_PATTERNS}}

test-unit:
    bun test tests/unit/ {{IGNORE_PATTERNS}}

test-integration:
    bun test tests/integration/ {{IGNORE_PATTERNS}}

test-coverage:
    bun test tests/ --coverage {{IGNORE_PATTERNS}}

# Generate lcov coverage report and enforce minimum threshold (default: 95%)
# Usage: just coverage-check [threshold]
coverage-check threshold="95":
    bash scripts/coverage-check.sh {{threshold}}

test-watch:
    bun test tests/ --watch {{IGNORE_PATTERNS}}

test-packaging:
    bun test tests/integration/packaging/ {{IGNORE_PATTERNS}}

# Skip packaging tests when offline (no npm pack):
#   SKIP_NETWORK_TESTS=1 just test-packaging
test-packaging-skip:
    SKIP_NETWORK_TESTS=1 bun test tests/integration/packaging/ {{IGNORE_PATTERNS}}

test-e2e:
    bash tests/e2e/run-e2e.sh

# Remove legacy dist/ directory (binary compilation removed in v1.2.0; kept for cleanup of old artifacts)
clean:
    rm -rf dist

# ─── Plugin Quality ──────────────────────────────────────────────────────────

# Lint all plugin files with Biome
check-plugin:
    bunx @biomejs/biome check template/obligatorio/core/.opencode/plugins/ template/opcional/.opencode/plugins/

# Run plugin unit tests
test-plugin-unit:
    bun test ./template/obligatorio/core/.opencode/plugins/src/__tests__/*.test.ts

# Run plugin integration tests
test-plugin-integration:
    bun test tests/plugin/integration/

# Run plugin E2E tests
test-plugin-e2e:
    bash tests/plugin/e2e/run-plugin-e2e.sh

# ─── Performance Benchmarks ────────────────────────────────────────────────────

# Run installation performance benchmarks with hyperfine.
# Requires: cargo install hyperfine (or download from GitHub releases)
bench:
    #!/usr/bin/env bash
    set -euo pipefail
    mkdir -p tests/fixtures/bench
    echo "Benchmarking Clean Install..."
    hyperfine \
        --warmup 1 \
        --runs 5 \
        --export-json tests/fixtures/bench/clean-install.json \
        --command-name "clean-install" \
        "bun run src/cli/main.ts --mode clean --dest tests/fixtures/bench/clean --force"
    echo "Benchmarking Project Install..."
    hyperfine \
        --warmup 1 \
        --runs 5 \
        --export-json tests/fixtures/bench/project-install.json \
        --command-name "project-install" \
        "bun run src/cli/main.ts --mode project --dest tests/fixtures/bench/project --force"
    echo "Benchmarking Update Workspace..."
    hyperfine \
        --warmup 1 \
        --runs 5 \
        --export-json tests/fixtures/bench/update-workspace.json \
        --command-name "update-workspace" \
        "bun run src/cli/main.ts --mode update --dest tests/fixtures/bench/update --force"
